// pages/api/cron/alertas-trial.js
// Roda diariamente — envia emails em D-7, D-3, D-0 antes do trial expirar

import { createClient } from '@supabase/supabase-js'

const DIAS_ALERTA = [7, 3, 0]

async function enviarEmail(to, subject, html) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'eSocial SST <noreply@esocialsst.com.br>',
      to,
      subject,
      html,
    }),
  })
  return resp.ok
}

export default async function handler(req, res) {
  // Fail-closed: sem CRON_SECRET configurado o endpoint é negado.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ erro: 'Não autorizado' })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: trials, error: trialsErr } = await sb
    .from('empresas')
    .select('id, razao_social, trial_inicio')
    .eq('plano', 'trial')
    .not('trial_inicio', 'is', null)

  if (trialsErr) {
    console.error('[alertas-trial] falha ao buscar trials:', trialsErr.message)
    return res.status(500).json({ ok: false, erro: trialsErr.message })
  }

  const hoje = new Date()
  const resultados = []

  for (const emp of (trials || [])) {
    const inicio = new Date(emp.trial_inicio)
    const expira = new Date(inicio)
    expira.setDate(expira.getDate() + 14)
    const diasRestantes = Math.ceil((expira - hoje) / 86400000)

    if (!DIAS_ALERTA.includes(diasRestantes)) continue

    const { data: admin } = await sb
      .from('usuarios')
      .select('id, nome')
      .eq('empresa_id', emp.id)
      .eq('perfil', 'admin')
      .maybeSingle()

    if (!admin) continue

    const { data: authUser } = await sb.auth.admin.getUserById(admin.id)
    const email = authUser?.user?.email
    if (!email) continue

    const nome = (admin.nome || '').split(' ')[0] || 'Olá'

    let assunto, mensagem, cta

    if (diasRestantes === 0) {
      assunto = `[eSocial SST] Seu trial expira hoje — não perca o acesso`
      mensagem = `Seu período de avaliação gratuito do eSocial SST <strong>expira hoje</strong>. Para continuar transmitindo eventos ao Gov.br sem interrupção, escolha um plano agora.`
      cta = 'Escolher meu plano →'
    } else if (diasRestantes === 3) {
      assunto = `[eSocial SST] 3 dias restantes no seu trial`
      mensagem = `Seu período de avaliação do eSocial SST termina em <strong>3 dias</strong>. Faça o upgrade agora para garantir continuidade nas transmissões.`
      cta = 'Ver planos e preços →'
    } else {
      assunto = `[eSocial SST] Seu trial termina em 7 dias`
      mensagem = `Você tem <strong>7 dias restantes</strong> no seu trial do eSocial SST. Aproveite para explorar todas as funcionalidades e escolher o plano ideal.`
      cta = 'Conhecer os planos →'
    }

    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;margin:0 auto;color:#111">
  <div style="background:#185FA5;padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px;font-weight:700">eSocial SST</h2>
    <p style="color:#b3d4f0;margin:4px 0 0;font-size:13px">${emp.razao_social}</p>
  </div>
  <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p style="margin:0 0 12px;font-size:14px">Olá, <strong>${nome}</strong>!</p>
    <p style="margin:0 0 20px;font-size:13px;color:#374151;line-height:1.7">${mensagem}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/planos"
      style="display:inline-block;padding:11px 22px;background:#185FA5;color:#fff;border-radius:7px;text-decoration:none;font-weight:500;font-size:13px">
      ${cta}
    </a>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
    <p style="font-size:11px;color:#9ca3af;margin:0">
      eSocial SST Transmissor · Este e-mail foi enviado porque você está em período de trial.<br>
      Para cancelar, responda a este e-mail.
    </p>
  </div>
</div>`

    const enviado = await enviarEmail(email, assunto, html)
    resultados.push({ empresa_id: emp.id, razao_social: emp.razao_social, dias_restantes: diasRestantes, email, enviado })
  }

  const enviados = resultados.filter(r => r.enviado).length
  return res.status(200).json({ ok: true, processadas: (trials || []).length, alertas_enviados: enviados, detalhes: resultados })
}
