// pages/api/cleanup-signup.js
// Remove usuário órfão do Auth quando cadastro falhou após criar auth user
// Só deleta se o usuário não tiver empresa vinculada (segurança)

import { createClient } from '@supabase/supabase-js'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ erro: 'Não autenticado' })

  const sbAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error } = await sbAnon.auth.getUser(token)
  if (error || !user) return res.status(401).json({ erro: 'Sessão inválida' })

  // Verifica que o usuário não tem empresa (só deleta órfãos)
  const { data: usuario } = await sbAdmin
    .from('usuarios').select('id').eq('id', user.id).single()

  if (usuario) {
    return res.status(400).json({ erro: 'Usuário já possui empresa — não pode ser removido via este endpoint.' })
  }

  const { error: delErr } = await sbAdmin.auth.admin.deleteUser(user.id)
  if (delErr) return res.status(500).json({ erro: 'Erro ao limpar conta: ' + delErr.message })

  return res.status(200).json({ ok: true })
}
