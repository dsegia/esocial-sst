// pages/api/admin/renovar-creditos.js
// Reset manual de créditos para uma empresa (usado pelo admin no painel)

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ erro: 'Não autenticado' })

  const supabaseAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error: authErr } = await supabaseAnon.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ erro: 'Sessão inválida' })
  if (user.email !== process.env.ADMIN_EMAIL) return res.status(403).json({ erro: 'Acesso restrito' })

  const { empresa_id } = req.body
  if (!empresa_id) return res.status(400).json({ erro: 'empresa_id obrigatório' })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { data: emp } = await sb.from('empresas')
      .select('id, razao_social, plano, creditos_incluidos')
      .eq('id', empresa_id).single()

    if (!emp) return res.status(404).json({ erro: 'Empresa não encontrada' })

    const { error } = await sb.from('empresas')
      .update({ creditos_restantes: emp.creditos_incluidos })
      .eq('id', empresa_id)

    if (error) throw new Error(error.message)

    return res.status(200).json({ ok: true, creditos_incluidos: emp.creditos_incluidos })
  } catch (err) {
    return res.status(500).json({ erro: err.message })
  }
}
