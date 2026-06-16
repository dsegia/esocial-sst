// lib/master-cert.ts
// Certificado mestre do SaaS (procurador eCAC).
// Usado para transmitir/assinar em nome de empresas que outorgaram procuração
// eSocial ao CNPJ do SaaS no portal eCAC — assim a empresa cliente não precisa
// subir o próprio certificado digital.
//
// Variáveis de ambiente (Vercel):
//   ESOCIAL_MASTER_CERT_PFX_B64  → arquivo .pfx do e-CNPJ do SaaS em base64
//   ESOCIAL_MASTER_CERT_SENHA    → senha do .pfx
//   ESOCIAL_MASTER_CNPJ          → CNPJ do SaaS (procurador). Fallback: NEXT_PUBLIC_SAAS_CNPJ

type MasterCert = { pfxBuffer: Buffer; senha: string; cnpj: string }

let cache: MasterCert | null | undefined

export function getMasterCert(): MasterCert | null {
  if (cache !== undefined) return cache

  const b64 = process.env.ESOCIAL_MASTER_CERT_PFX_B64
  const senha = process.env.ESOCIAL_MASTER_CERT_SENHA
  const cnpj = (process.env.ESOCIAL_MASTER_CNPJ || process.env.NEXT_PUBLIC_SAAS_CNPJ || '').replace(/\D/g, '')

  if (!b64 || !senha || cnpj.length !== 14) {
    cache = null
    return null
  }

  cache = { pfxBuffer: Buffer.from(b64, 'base64'), senha, cnpj }
  return cache
}

export function masterCertConfigurado(): boolean {
  return getMasterCert() !== null
}
