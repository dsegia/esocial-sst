import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../../lib/auth-middleware'
import { resolverProcurador } from '../../../lib/resolve-cert'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Informa se a empresa tem procuração ativa e se o procurador (consultoria)
// possui certificado configurado no sistema — usado para avisar o usuário
// quando a transmissão via procuração ainda não pode funcionar.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth(req, res)
  if (!user) return

  let empresaId = (req.query.empresa_id as string) || ''
  if (!empresaId) {
    const { data: usuarioDb } = await sbAdmin.from('usuarios').select('empresa_id').eq('id', user.id).single()
    empresaId = usuarioDb?.empresa_id || (user.user_metadata as any)?.empresa_id || ''
  }
  if (!empresaId) return res.status(200).json({ ativa: false, procuradorOk: false })

  const { data: empresa } = await sbAdmin
    .from('empresas').select('ecac_cnpj_procurador').eq('id', empresaId).single()

  if (!empresa?.ecac_cnpj_procurador) {
    return res.status(200).json({ ativa: false, procuradorOk: false })
  }

  const proc = await resolverProcurador(empresa.ecac_cnpj_procurador, user)
  return res.status(200).json({
    ativa: true,
    procuradorOk: !!proc,
    titular: proc?.cert_titular || null,
    validade: proc?.cert_digital_validade || null,
  })
}
