// Sliding-window rate limiter
// Usa Upstash Redis quando UPSTASH_REDIS_REST_URL estiver configurado (funciona entre workers Vercel)
// Fallback automático para in-memory quando não configurado

const store = new Map<string, number[]>()

interface RateLimitOptions {
  windowMs?: number
  max?: number
}

interface RateLimitResult {
  limited: boolean
  remaining: number
  retryAfter: number
}

function checkMemory(
  key: string,
  { windowMs = 60_000, max = 30 }: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const timestamps = (store.get(key) ?? []).filter(t => now - t < windowMs)
  timestamps.push(now)
  store.set(key, timestamps)

  if (timestamps.length > max) {
    const oldest = timestamps[0]
    return { limited: true, remaining: 0, retryAfter: Math.ceil((oldest + windowMs - now) / 1000) }
  }
  return { limited: false, remaining: max - timestamps.length, retryAfter: 0 }
}

async function checkRedis(
  key: string,
  { windowMs = 60_000, max = 30 }: RateLimitOptions
): Promise<RateLimitResult> {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL!
  const token   = process.env.UPSTASH_REDIS_REST_TOKEN!
  const windowSec = Math.ceil(windowMs / 1000)
  const windowKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`

  const resp = await fetch(`${baseUrl}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', windowKey],
      ['EXPIRE', windowKey, windowSec],
    ]),
  })

  if (!resp.ok) throw new Error('Redis pipeline failed')
  const results = await resp.json()
  const count: number = results[0]?.result ?? 1

  if (count > max) {
    return { limited: true, remaining: 0, retryAfter: windowSec }
  }
  return { limited: false, remaining: max - count, retryAfter: 0 }
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await checkRedis(key, options)
    } catch {
      // Redis indisponível — fallback silencioso para in-memory
    }
  }
  return checkMemory(key, options)
}

// Limpeza de entradas antigas (apenas no modo in-memory)
setInterval(() => {
  const cutoff = Date.now() - 600_000
  for (const [key, timestamps] of store.entries()) {
    const fresh = timestamps.filter((t: number) => t > cutoff)
    if (fresh.length === 0) store.delete(key)
    else store.set(key, fresh)
  }
}, 300_000)

export function getClientIP(
  req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }
): string {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim()
  const realIP = req.headers['x-real-ip']
  if (realIP) return Array.isArray(realIP) ? realIP[0] : realIP
  return req.socket?.remoteAddress ?? 'unknown'
}
