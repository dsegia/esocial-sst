// pages/api/cron/bloquear-trials-expirados.js
// Roda diariamente — bloqueia empresas cujo trial expirou há mais de 14 dias

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ erro: 'Não autorizado' })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: bloqueadas, error } = await sb
    .from('empresas')
    .update({ bloqueado: true })
    .eq('plano', 'trial')
    .eq('ativo', true)
    .eq('bloqueado', false)
    .lt('plano_expira_em', new Date().toISOString())
    .select('id, razao_social, plano_expira_em')

  if (error) {
    return res.status(500).json({ ok: false, erro: error.message })
  }

  return res.status(200).json({
    ok: true,
    bloqueadas: (bloqueadas || []).length,
    empresas: (bloqueadas || []).map(e => ({ id: e.id, razao_social: e.razao_social, expirou_em: e.plano_expira_em })),
  })
}
