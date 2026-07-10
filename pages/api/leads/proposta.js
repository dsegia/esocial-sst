// pages/api/leads/proposta.js
// Recebe pedidos de proposta comercial vindos do site (seção de preços) e do formulário de contato.
// Salva em leads_propostas (Supabase) e notifica por e-mail via Resend.

import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP } from '../../../lib/rate-limit'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const ip = getClientIP(req)
  const { limited, retryAfter } = await checkRateLimit(`lead:${ip}`, { windowMs: 60_000, max: 5 })
  if (limited) {
    res.setHeader('Retry-After', String(retryAfter))
    return res.status(429).json({ erro: 'Muitas requisições. Tente novamente em breve.' })
  }

  const { nome, empresa, email, telefone, funcionarios, plano_interesse, mensagem } = req.body || {}

  if (!nome || !String(nome).trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: 'E-mail inválido.' })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const lead = {
    nome: String(nome).trim().substring(0, 200),
    empresa: empresa ? String(empresa).trim().substring(0, 200) : null,
    email: String(email).trim().substring(0, 200),
    telefone: telefone ? String(telefone).trim().substring(0, 40) : null,
    funcionarios: funcionarios ? String(funcionarios).trim().substring(0, 40) : null,
    plano_interesse: plano_interesse ? String(plano_interesse).trim().substring(0, 60) : null,
    mensagem: mensagem ? String(mensagem).trim().substring(0, 2000) : null,
  }

  const { error: dbError } = await sb.from('leads_propostas').insert(lead)
  if (dbError) {
    console.error('[leads/proposta] erro ao salvar:', dbError.message)
    return res.status(500).json({ erro: 'Erro ao registrar solicitação. Tente novamente.' })
  }

  if (process.env.RESEND_API_KEY) {
    const htmlEmail = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
  <tr><td style="background:#185FA5;padding:20px 28px">
    <div style="color:#fff;font-size:16px;font-weight:bold">Novo pedido de proposta — site eSocial SST</div>
  </td></tr>
  <tr><td style="padding:24px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#374151">
      <tr><td style="padding:6px 0;color:#6b7280;width:140px">Nome</td><td style="padding:6px 0"><strong>${lead.nome}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Empresa</td><td style="padding:6px 0">${lead.empresa || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">E-mail</td><td style="padding:6px 0">${lead.email}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Telefone</td><td style="padding:6px 0">${lead.telefone || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Nº funcionários</td><td style="padding:6px 0">${lead.funcionarios || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Plano de interesse</td><td style="padding:6px 0">${lead.plano_interesse || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Mensagem</td><td style="padding:6px 0">${lead.mensagem ? lead.mensagem.replace(/\n/g, '<br>') : '—'}</td></tr>
    </table>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          from: 'eSocial SST <noreply@esocialsst.com.br>',
          to: [process.env.LEADS_NOTIFY_EMAIL || 'dseg.sst@gmail.com'],
          reply_to: lead.email,
          subject: `Novo pedido de proposta — ${lead.nome}${lead.empresa ? ' (' + lead.empresa + ')' : ''}`,
          html: htmlEmail,
        }),
      })
    } catch (err) {
      console.error('[leads/proposta] falha ao notificar por e-mail:', err.message)
      // não bloqueia a resposta de sucesso — o lead já está salvo no banco
    }
  }

  return res.status(200).json({ sucesso: true })
}
