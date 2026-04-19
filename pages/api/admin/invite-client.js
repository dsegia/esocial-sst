// pages/api/admin/invite-client.js
// Convida novo cliente: cria empresa com plano + envia e-mail de convite via Supabase

import { createClient } from '@supabase/supabase-js'

const PLANOS_VALIDOS = ['trial', 'starter', 'professional', 'business']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const adminEmail = process.env.ADMIN_EMAIL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!adminEmail || !serviceKey) {
    return res.status(500).json({ erro: 'Variáveis de ambiente não configuradas' })
  }

  // Valida sessão do admin
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ erro: 'Não autenticado' })

  const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error: authErr } = await supabaseAnon.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ erro: 'Sessão inválida' })
  if (user.email !== adminEmail) return res.status(403).json({ erro: 'Acesso restrito' })

  const { email, razao_social, cnpj, plano } = req.body

  if (!email || !razao_social || !plano) {
    return res.status(400).json({ erro: 'Email, razão social e plano são obrigatórios' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ erro: 'Formato de e-mail inválido' })
  }
  if (!PLANOS_VALIDOS.includes(plano)) {
    return res.status(400).json({ erro: 'Plano inválido' })
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    // Verifica se e-mail já existe
    const { data: existentes } = await sb.auth.admin.listUsers()
    const jaExiste = existentes?.users?.find(u => u.email === email)
    if (jaExiste) {
      return res.status(409).json({ erro: 'Este e-mail já possui cadastro no sistema' })
    }

    // Cria empresa
    const { data: empresa, error: empErr } = await sb.from('empresas').insert({
      razao_social: razao_social.trim(),
      cnpj: cnpj?.trim() || null,
      plano,
      trial_inicio: plano === 'trial' ? new Date().toISOString() : null,
    }).select().single()

    if (empErr) throw new Error('Erro ao criar empresa: ' + empErr.message)

    // Envia convite via Supabase Auth (magic link)
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://esocial-sst.vercel.app'}/aceitar-convite?empresa_id=${empresa.id}`

    const { data: convite, error: convErr } = await sb.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        empresa_id: empresa.id,
        plano,
      }
    })

    if (convErr) {
      // Desfaz criação da empresa se convite falhou
      await sb.from('empresas').delete().eq('id', empresa.id)
      throw new Error('Erro ao enviar convite: ' + convErr.message)
    }

    // Cria usuário vinculado (será atualizado quando aceitar o convite)
    await sb.from('usuario_empresas').insert({
      usuario_id: convite.user.id,
      empresa_id: empresa.id,
      perfil: 'admin',
      tipo_acesso: 'empresa',
    }).select()

    return res.status(200).json({
      ok: true,
      empresa_id: empresa.id,
      usuario_id: convite.user.id,
      mensagem: `Convite enviado para ${email}`,
    })
  } catch (err) {
    console.error('[admin/invite-client]', err)
    return res.status(500).json({ erro: 'Erro interno do servidor.' })
  }
}
