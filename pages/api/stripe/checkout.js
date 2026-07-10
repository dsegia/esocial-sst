// pages/api/stripe/checkout.js
//
// Plano único por vidas: 1 Price metered (billing_scheme=tiered,
// tiers_mode=volume, aggregate_usage=max) em STRIPE_PRICE_VIDAS.
// O valor cobrado é definido automaticamente pelas faixas do Price,
// a partir do usage record diário (qtd_funcionarios ativos) — ver
// pages/api/cron/snapshot-vidas.js. Não há escolha de plano no checkout.
//
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://esocial-sst.vercel.app'
    const priceVidas = process.env.STRIPE_PRICE_VIDAS

    if (!stripeKey) return res.status(500).json({ erro: 'STRIPE_SECRET_KEY não configurada' })
    if (!priceVidas) return res.status(500).json({ erro: 'STRIPE_PRICE_VIDAS não configurado' })

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ erro: 'Não autenticado' })

    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user }, error: authErr } = await supabaseAnon.auth.getUser(token)
    if (authErr || !user) return res.status(401).json({ erro: 'Sessão inválida' })

    const sbAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    const { data: usuarioDb } = await sbAdmin.from('usuarios')
      .select('empresa_id').eq('id', user.id).single()
    const empresaId = usuarioDb?.empresa_id || user.user_metadata?.empresa_id

    if (!empresaId) return res.status(403).json({ erro: 'Empresa não encontrada para este usuário' })

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    const { data: empresa } = await sbAdmin.from('empresas')
      .select('id, razao_social, cnpj, stripe_customer_id').eq('id', empresaId).single()

    let customerId = empresa?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: empresa?.razao_social || user.email,
        metadata: { empresa_id: empresaId, cnpj: empresa?.cnpj || '' },
      })
      customerId = customer.id
      await sbAdmin.from('empresas').update({ stripe_customer_id: customerId }).eq('id', empresaId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'boleto'],
      line_items: [{ price: priceVidas }],
      success_url: `${siteUrl}/dashboard?upgrade=ok`,
      cancel_url: `${siteUrl}/planos?cancelado=1`,
      metadata: { empresa_id: empresaId },
      subscription_data: {
        metadata: { empresa_id: empresaId },
      },
    })

    return res.status(200).json({ url: session.url })

  } catch (err) {
    console.error('[checkout] erro:', err?.message || err)
    return res.status(500).json({ erro: err?.message || 'Erro interno ao criar sessão de pagamento' })
  }
}
