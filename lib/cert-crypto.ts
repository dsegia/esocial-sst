import crypto from 'crypto'

function getKey(): Buffer {
  const hex = process.env.CERT_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) throw new Error('CERT_ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)')
  return Buffer.from(hex, 'hex')
}

export function encryptSenha(senha: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(senha, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptSenha(enc: string): string {
  const key = getKey()
  const buf = Buffer.from(enc, 'base64')
  const iv = buf.subarray(0, 12)
  const authTag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
