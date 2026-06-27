import { createClient } from '@supabase/supabase-js'
import { decryptSenha } from './cert-crypto'
import { downloadCertR2 } from './cert-store'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type AuthUser = { id: string; email?: string | null }

export type CertResolvido = {
  pfxBuffer: Buffer
  senha: string
  cnpjTransmissor: string
  fonte: 'propria' | 'procuracao'
}

// Resolve o certificado (PFX + senha) e o CNPJ transmissor para a empresa.
export async function resolverCertEmpresa(empresaId: string, user: AuthUser): Promise<CertResolvido | null> {
  const { data: empresa } = await sbAdmin
    .from('empresas')
    .select('cnpj, cert_pfx_path, cert_senha_enc, ecac_cnpj_procurador')
    .eq('id', empresaId)
    .single()
  if (!empresa) return null

  // 1. Certificado próprio
  if (empresa.cert_pfx_path && empresa.cert_senha_enc) {
    return {
      pfxBuffer: await downloadCertR2(empresa.cert_pfx_path),
      senha: decryptSenha(empresa.cert_senha_enc),
      cnpjTransmissor: (empresa.cnpj || '').replace(/\D/g, ''),
      fonte: 'propria',
    }
  }

  return null
}
