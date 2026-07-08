import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../../lib/auth-middleware'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const user = await requireAuth(req, res)
  if (!user) return

  const { razao_social, cnpj, cnpj_procurador, nome_procurador } = req.body
  if (!razao_social?.trim() || !cnpj || !cnpj_procurador) {
    return res.status(400).json({ erro: 'razao_social, cnpj e cnpj_procurador são obrigatórios' })
  }

  const cnpjLimpo = cnpj.replace(/\D/g, '')
  const cnpjProcLimpo = cnpj_procurador.replace(/\D/g, '')

  if (cnpjLimpo.length !== 14) return res.status(400).json({ erro: 'CNPJ da empregadora inválido' })
  if (cnpjProcLimpo.length !== 14) return res.status(400).json({ erro: 'CNPJ do procurador inválido' })
  if (cnpjLimpo === cnpjProcLimpo) return res.status(400).json({ erro: 'A empregadora não pode ser a própria procuradora' })

  // Verifica que o usuário tem acesso à empresa procuradora (segurança)
  const { data: usuarioDb } = await sbAdmin.from('usuarios').select('empresa_id').eq('id', user.id).single()
  const { data: vinculos } = await sbAdmin.from('usuario_empresas').select('empresa_id').eq('usuario_id', user.id)
  const empresasDoUsuario = [
    ...(usuarioDb?.empresa_id ? [usuarioDb.empresa_id] : []),
    ...((vinculos || []).map((v: any) => v.empresa_id)),
  ]
  const { data: procuradora } = await sbAdmin
    .from('empresas').select('id, cnpj').eq('cnpj', formatCnpj(cnpjProcLimpo)).maybeSingle()

  if (!procuradora || !empresasDoUsuario.includes(procuradora.id)) {
    return res.status(403).json({ erro: 'Acesso não autorizado à empresa procuradora' })
  }

  const cnpjFormatado = formatCnpj(cnpjLimpo)
  const { data: existe } = await sbAdmin.from('empresas').select('id, razao_social').eq('cnpj', cnpjFormatado).maybeSingle()

  let empresa: any

  if (existe) {
    // Empresa já existe — apenas vincula a procuração e o usuário
    const { data: atualizada, error: errUp } = await sbAdmin.from('empresas').update({
      ecac_cnpj_procurador: cnpjProcLimpo,
      ecac_nome_procurador: nome_procurador?.trim() || null,
      is_consultoria: false,
    }).eq('id', existe.id).select().single()
    if (errUp || !atualizada) {
      return res.status(500).json({ erro: 'Erro ao atualizar procuração da empresa: ' + (errUp?.message || '') })
    }
    empresa = atualizada
  } else {
    // Empresa não existe — cria com service role (bypassa RLS)
    const trialExpira = new Date()
    trialExpira.setDate(trialExpira.getDate() + 14)
    const { data: nova, error } = await sbAdmin.from('empresas').insert({
      razao_social: razao_social.trim(),
      cnpj: cnpjFormatado,
      ecac_cnpj_procurador: cnpjProcLimpo,
      ecac_nome_procurador: nome_procurador?.trim() || null,
      is_consultoria: false,
      plano_expira_em: trialExpira.toISOString(),
    }).select().single()
    if (error || !nova) {
      return res.status(500).json({ erro: 'Erro ao cadastrar empresa transmitida: ' + (error?.message || '') })
    }
    empresa = nova
  }

  // Vincula o usuário à empresa (nova ou existente)
  await sbAdmin.from('usuario_empresas').upsert({
    usuario_id: user.id,
    empresa_id: empresa.id,
    perfil: 'admin',
    tipo_acesso: 'empresa',
  }, { onConflict: 'usuario_id,empresa_id' })

  return res.status(200).json({ sucesso: true, empresa })
}

function formatCnpj(cnpj: string) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}
