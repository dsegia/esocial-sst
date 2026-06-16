// lib/resolve-cert.ts
// Resolve qual certificado digital usar para transmitir/assinar em nome de uma empresa.
//
// Dois caminhos:
//  1. Certificado próprio da empresa (cert_pfx_path no R2).
//  2. Procuração eCAC: usa o certificado da empresa PROCURADORA (consultoria) cujo
//     CNPJ corresponde a `ecac_cnpj_procurador`.
//
// Segurança: a consultoria procuradora precisa estar entre as empresas que o
// usuário pode usar — suas empresas vinculadas (usuario_empresas + empresa padrão)
// ou, para o admin do sistema (ADMIN_EMAIL), qualquer empresa.

import { createClient } from '@supabase/supabase-js'
import { decryptSenha } from './cert-crypto'
import { downloadCertR2 } from './cert-store'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type AuthUser = { id: string; email?: string | null }

type ProcuradorRow = {
  cnpj: string | null
  cert_pfx_path: string | null
  cert_senha_enc: string | null
  cert_titular: string | null
  cert_digital_validade: string | null
}

function ehAdmin(user: AuthUser): boolean {
  return !!user.email && !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
}

// IDs de todas as empresas às quais o usuário tem acesso (própria + vínculos).
async function empresasDoUsuario(userId: string): Promise<string[]> {
  const [{ data: usuarioDb }, { data: vinculos }] = await Promise.all([
    sbAdmin.from('usuarios').select('empresa_id').eq('id', userId).single(),
    sbAdmin.from('usuario_empresas').select('empresa_id').eq('usuario_id', userId),
  ])
  const ids = new Set<string>()
  if (usuarioDb?.empresa_id) ids.add(usuarioDb.empresa_id)
  for (const v of vinculos || []) ids.add(v.empresa_id)
  return [...ids]
}

// Empresa procuradora (consultoria) com certificado configurado, acessível ao usuário.
export async function resolverProcurador(
  ecacCnpjProcurador: string | null | undefined,
  user: AuthUser
): Promise<ProcuradorRow | null> {
  if (!ecacCnpjProcurador) return null
  const cnpjProc = ecacCnpjProcurador.replace(/\D/g, '')
  if (cnpjProc.length !== 14) return null

  let query = sbAdmin
    .from('empresas')
    .select('cnpj, cert_pfx_path, cert_senha_enc, cert_titular, cert_digital_validade')

  // Admin do sistema enxerga todas as empresas; demais, só as suas.
  if (!ehAdmin(user)) {
    const ids = await empresasDoUsuario(user.id)
    if (!ids.length) return null
    query = query.in('id', ids)
  }

  const { data: procs } = await query
  return (procs || []).find(
    (p) => (p.cnpj || '').replace(/\D/g, '') === cnpjProc && p.cert_pfx_path && p.cert_senha_enc
  ) || null
}

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

  // 2. Procuração → certificado da consultoria procuradora
  const proc = await resolverProcurador(empresa.ecac_cnpj_procurador, user)
  if (proc) {
    return {
      pfxBuffer: await downloadCertR2(proc.cert_pfx_path!),
      senha: decryptSenha(proc.cert_senha_enc!),
      cnpjTransmissor: (proc.cnpj || '').replace(/\D/g, ''),
      fonte: 'procuracao',
    }
  }

  return null
}
