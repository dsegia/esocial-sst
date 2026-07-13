import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../../lib/auth-middleware'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' })
  }

  const user = await requireAuth(req, res)
  if (!user) return

  const { logo_url } = req.body as { logo_url: string | null }

  const { data: usuarioDb } = await sbAdmin
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuarioDb?.empresa_id) {
    return res.status(400).json({ erro: 'Empresa não encontrada' })
  }

  const { error } = await sbAdmin
    .from('empresas')
    .update({ logo_url })
    .eq('id', usuarioDb.empresa_id)

  if (error) {
    return res.status(500).json({ erro: 'Erro ao atualizar logo' })
  }

  res.status(200).json({ sucesso: true })
}
