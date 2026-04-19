// pages/api/verificar-duplicidade.js
// Verifica se já existe ASO duplicado antes de salvar

import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../lib/auth-middleware'
import { checkRateLimit, getClientIP } from '../../lib/rate-limit'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const ip = getClientIP(req)
  const { limited, retryAfter } = checkRateLimit(ip, { windowMs: 60_000, max: 30 })
  if (limited) {
    res.setHeader('Retry-After', String(retryAfter))
    return res.status(429).json({ erro: 'Muitas requisições. Tente novamente em breve.' })
  }

  const user = await requireAuth(req, res)
  if (!user) return

  const { funcionario_id, tipo_aso, data_exame, aso_id } = req.body

  if (!funcionario_id || !tipo_aso || !data_exame) {
    return res.status(400).json({ erro: 'Dados incompletos' })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { data: resultado, error } = await sb
      .rpc('verificar_aso_duplicado', {
        p_funcionario_id: funcionario_id,
        p_tipo_aso: tipo_aso,
        p_data_exame: data_exame,
        p_aso_id: aso_id || null,
      })

    if (error) throw error

    if (resultado?.duplicado && resultado?.aso_id) {
      const { data: tx } = await sb
        .from('transmissoes')
        .select('status, recibo, dt_envio')
        .eq('referencia_id', resultado.aso_id)
        .eq('evento', 'S-2220')
        .single()

      return res.status(200).json({
        ...resultado,
        transmissao: tx || null,
        jaTransmitido: tx?.status === 'enviado' || tx?.status === 'lote',
      })
    }

    return res.status(200).json(resultado)

  } catch (err) {
    console.error('[verificar-duplicidade]', err)
    return res.status(500).json({ erro: 'Erro ao verificar duplicidade.' })
  }
}
