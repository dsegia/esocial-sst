// pages/api/cron/reset-creditos.js
// Executa no dia 1 de cada mês — reseta creditos_restantes = creditos_incluidos
// para todas as empresas ativas com plano pago (que não usam Stripe para reset automático)

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Vercel cron autentica com Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ erro: 'Não autorizado' })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    // Reseta apenas empresas com plano pago e sem renovação via Stripe recente
    // (empresas com stripe_subscription_id ativo são renovadas pelo webhook invoice.paid)
    // Aqui renovamos as gerenciadas manualmente (sem Stripe ou com assinatura manual)
    const { data, error } = await sb
      .from('empresas')
      .update({ creditos_restantes: sb.raw('creditos_incluidos') })
      .not('plano', 'in', '("trial","cancelado")')
      .gt('creditos_incluidos', 0)
      .is('stripe_subscription_id', null) // Apenas quem não tem Stripe (Stripe faz via webhook)
      .select('id, razao_social, plano, creditos_incluidos')

    if (error) throw new Error(error.message)

    return res.status(200).json({ ok: true, renovadas: (data || []).length, empresas: data })
  } catch (err) {
    console.error('[reset-creditos] Erro:', err.message)
    return res.status(500).json({ erro: err.message })
  }
}
