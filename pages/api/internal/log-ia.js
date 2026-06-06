// pages/api/internal/log-ia.js
// Endpoint interno para logging não-bloqueante de chamadas às IAs

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Custo por 1M tokens em USD (preços aproximados, atualizar conforme pricing)
const CUSTO_POR_MILHAO = {
  'claude-sonnet':           { entrada: 3.00,  saida: 15.00  },
  'claude-haiku-fallback':   { entrada: 0.80,  saida: 4.00   },
  'gemini-2.5-flash':        { entrada: 0.30,  saida: 2.50   },
  'gemini-2.5-flash-lite':   { entrada: 0.10,  saida: 0.40   },
}

function calcularCusto(modelo, tokens_entrada, tokens_saida) {
  const tabela = CUSTO_POR_MILHAO[modelo]
  if (!tabela || !tokens_entrada) return null
  const custo =
    (tokens_entrada  / 1_000_000) * tabela.entrada +
    ((tokens_saida || 0) / 1_000_000) * tabela.saida
  return Math.round(custo * 1_000_000) / 1_000_000 // 6 casas decimais
}

export default async function handler(req, res) {
  // Sempre retorna 200 para não quebrar o caller
  if (req.method !== 'POST') return res.status(200).end()

  const secret = req.headers['x-internal-secret'] || ''
  const expectedSecret = process.env.INTERNAL_API_SECRET || ''
  const match = expectedSecret.length > 0 &&
    secret.length === expectedSecret.length &&
    crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(expectedSecret))
  if (!match) return res.status(401).end()

  try {
    const { servico, modelo, status, duracao_ms, tipo, erro, tokens_entrada, tokens_saida, empresa_id, usuario_id } = req.body
    if (!servico || !status) return res.status(200).end()

    const custo_usd = calcularCusto(modelo, tokens_entrada, tokens_saida)

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await sb.from('api_logs').insert({
      servico,
      modelo:          modelo || null,
      status,
      duracao_ms:      duracao_ms ? Math.round(duracao_ms) : null,
      tipo:            tipo || null,
      erro:            erro ? String(erro).substring(0, 200) : null,
      tokens_entrada:  tokens_entrada || null,
      tokens_saida:    tokens_saida   || null,
      custo_usd:       custo_usd,
      empresa_id:      empresa_id || null,
      usuario_id:      usuario_id || null,
    })
  } catch {
    // silently ignore — logging must never break the main flow
  }

  return res.status(200).end()
}
