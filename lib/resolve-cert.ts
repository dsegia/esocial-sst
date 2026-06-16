// lib/resolve-cert.ts
// Resolve qual certificado digital usar para transmitir/assinar em nome de uma empresa.
//
// Dois caminhos:
//  1. Certificado próprio da empresa (cert_pfx_path no R2).
//  2. Procuração eCAC: usa o certificado da empresa PROCURADORA (consultoria) cujo
//     CNPJ corresponde a `ecac_cnpj_procurador` — desde que o usuário que está
//     transmitindo tenha acesso a essa empresa (evita uso indevido de certificado
//     de outro inquilino).

import { createClient } from '@supabase/supabase-js'
import { decryptSenha } from './cert-crypto'
import { downloadCertR2 } from './cert-store'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type ProcuradorRow = {
  cnpj: string | null
  cert_pfx_path: string | null
  cert_senha_enc: string | null
  cert_titular: string | null
  cert_digital_validade: string | null
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
  userId: string
): Promise<ProcuradorRow | null> {
  if (!ecacCnpjProcurador) return null
  const cnpjProc = ecacCnpjProcurador.replace(/\D/g, '')
  if (cnpjProc.length !== 14) return null

  const ids = await empresasDoUsuario(userId)
  if (!ids.length) return null

  const { data: procs } = await sbAdmin
    .from('empresas')
    .select('cnpj, cert_pfx_path, cert_senha_enc, cert_titular, cert_digital_validade')
    .in('id', ids)

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
export async function resolverCertEmpresa(empresaId: string, userId: string): Promise<CertResolvido | null> {
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
  const proc = await resolverProcurador(empresa.ecac_cnpj_procurador, userId)
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
