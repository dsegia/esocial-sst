// pages/api/stripe/webhook.js
// Recebe eventos do Stripe e atualiza o plano no Supabase

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { buffer } from 'micro'

export const config = { api: { bodyParser: false } }

const PRICE_PLANO = {
  [process.env.STRIPE_PRICE_STARTER]:      'starter',
  [process.env.STRIPE_PRICE_PROFESSIONAL]: 'professional',
  [process.env.STRIPE_PRICE_BUSINESS]:     'business',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    const rawBody = await buffer(req)
    const sig = req.headers['stripe-signature']
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ erro: `Webhook error: ${err.message}` })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  async function atualizarEmpresa(empresaId, patch) {
    if (!empresaId) return
    const { error } = await sb.from('empresas').update(patch).eq('id', empresaId)
    if (error) console.error('Supabase update error:', error)
  }

  function planoFromSubscription(subscription) {
    const priceId = subscription.items?.data?.[0]?.price?.id
    return PRICE_PLANO[priceId] || null
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const empresaId = session.metadata?.empresa_id
      const plano = session.metadata?.plano
      if (empresaId && plano) {
        await atualizarEmpresa(empresaId, {
          plano,
          stripe_subscription_id: session.subscription,
          trial_ends_at: null,
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const empresaId = sub.metadata?.empresa_id
      const plano = planoFromSubscription(sub)
      if (empresaId) {
        if (sub.status === 'active' && plano) {
          await atualizarEmpresa(empresaId, { plano, stripe_subscription_id: sub.id })
        } else if (['past_due', 'unpaid'].includes(sub.status)) {
          await atualizarEmpresa(empresaId, { plano: 'trial' })
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const empresaId = sub.metadata?.empresa_id
      if (empresaId) {
        await atualizarEmpresa(empresaId, { plano: 'cancelado', stripe_subscription_id: null })
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId = invoice.customer
      const { data: empresa } = await sb.from('empresas')
        .select('id').eq('stripe_customer_id', customerId).single()
      if (empresa) {
        await atualizarEmpresa(empresa.id, { plano: 'trial' })
      }
      break
    }
  }

  return res.status(200).json({ recebido: true })
}
