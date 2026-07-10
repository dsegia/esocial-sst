// pages/api/cron/snapshot-vidas.js
// Executa diariamente: conta funcionários ativos por empresa e reporta
// ao Stripe como usage record (action=set) no item metered da assinatura.
// O Price usa aggregate_usage=max — o Stripe cobra pelo PICO do ciclo, não
// pelo valor do último dia. Isso impede o golpe de "cadastra, transmite e
// deleta antes do fechamento": o pico já fica registrado no dia em que ocorreu.
// Também grava o snapshot em vidas_uso_diario (histórico + relatório do admin).

import Stripe from 'stripe'
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

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null

  try {
    const { data: empresas, error: selErr } = await sb
      .from('empresas')
      .select('id, razao_social, plano, stripe_metered_item_id')
      .eq('plano', 'vidas')
      .not('stripe_metered_item_id', 'is', null)

    if (selErr) throw new Error(selErr.message)

    const hoje = new Date().toISOString().split('T')[0]
    const resultado = []

    for (const emp of (empresas || [])) {
      const { count, error: countErr } = await sb
        .from('funcionarios')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', emp.id)
        .eq('ativo', true)

      if (countErr) {
        console.error('[snapshot-vidas] erro ao contar funcionarios', emp.id, countErr.message)
        continue
      }

      const qtd = count || 0

      // Grava histórico (upsert por dia — reexecução do cron não duplica)
      const { error: upsertErr } = await sb
        .from('vidas_uso_diario')
        .upsert({ empresa_id: emp.id, data: hoje, qtd_funcionarios: qtd }, { onConflict: 'empresa_id,data' })
      if (upsertErr) {
        console.error('[snapshot-vidas] erro ao gravar snapshot', emp.id, upsertErr.message)
      }

      // Reporta ao Stripe (action=set substitui o valor do dia; aggregate_usage=max
      // no Price garante que o Stripe cobra pelo maior valor do ciclo)
      if (stripe) {
        try {
          await stripe.subscriptionItems.createUsageRecord(emp.stripe_metered_item_id, {
            quantity: qtd,
            timestamp: Math.floor(Date.now() / 1000),
            action: 'set',
          })
        } catch (err) {
          console.error('[snapshot-vidas] erro ao reportar uso ao Stripe', emp.id, err?.message)
          continue
        }
      }

      resultado.push({ empresa_id: emp.id, razao_social: emp.razao_social, qtd_funcionarios: qtd })
    }

    return res.status(200).json({ ok: true, processadas: resultado.length, empresas: resultado })
  } catch (err) {
    console.error('[snapshot-vidas] Erro:', err.message)
    return res.status(500).json({ erro: err.message })
  }
}
