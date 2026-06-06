// pages/api/admin/manage-client.js
// Ações administrativas: excluir empresa e resetar senha de cliente
// POST { acao: 'excluir', empresa_id }
// POST { acao: 'resetar_senha', empresa_id }

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const adminEmail = process.env.ADMIN_EMAIL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!adminEmail || !serviceKey) {
    return res.status(500).json({ erro: 'Variáveis de ambiente não configuradas' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ erro: 'Não autenticado' })

  const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error: authErr } = await supabaseAnon.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ erro: 'Sessão inválida' })
  if (user.email !== adminEmail) return res.status(403).json({ erro: 'Acesso restrito' })

  const { acao, empresa_id } = req.body
  if (!acao || !empresa_id) return res.status(400).json({ erro: 'acao e empresa_id obrigatórios' })

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // ── EXCLUIR EMPRESA ──────────────────────────────────
  if (acao === 'excluir') {
    try {
      await sb.from('admin_audit_log').insert({
        acao: 'excluir_empresa',
        empresa_id,
        executado_por: user.id,
        ip: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null,
      })

      // Busca usuários vinculados para remover do Auth também
      const { data: vinculos } = await sb
        .from('usuario_empresas')
        .select('usuario_id')
        .eq('empresa_id', empresa_id)

      const { data: usuariosDiretos } = await sb
        .from('usuarios')
        .select('id')
        .eq('empresa_id', empresa_id)

      const idsAuth = new Set([
        ...(vinculos || []).map(v => v.usuario_id),
        ...(usuariosDiretos || []).map(u => u.id),
      ])

      // Remove dados da empresa (cascata pelo banco)
      // Ordem importa: filhos antes do pai
      await sb.from('transmissoes').delete().eq('empresa_id', empresa_id)
      await sb.from('asos').delete().eq('empresa_id', empresa_id)
      await sb.from('cats').delete().eq('empresa_id', empresa_id)
      await sb.from('funcionarios').delete().eq('empresa_id', empresa_id)
      await sb.from('ltcats').delete().eq('empresa_id', empresa_id)
      await sb.from('pcmso_programa').delete().eq('empresa_id', empresa_id)
      await sb.from('usuario_empresas').delete().eq('empresa_id', empresa_id)
      await sb.from('usuarios').delete().eq('empresa_id', empresa_id)
      await sb.from('empresas').delete().eq('id', empresa_id)

      // Remove usuários do Auth que não têm mais nenhuma empresa
      for (const uid of idsAuth) {
        const { data: restantes } = await sb
          .from('usuario_empresas')
          .select('id')
          .eq('usuario_id', uid)
          .limit(1)

        const { data: restantesDireto } = await sb
          .from('usuarios')
          .select('id')
          .eq('id', uid)
          .limit(1)

        if (!restantes?.length && !restantesDireto?.length) {
          await sb.auth.admin.deleteUser(uid)
        }
      }

      return res.status(200).json({ ok: true, mensagem: 'Empresa e dados excluídos com sucesso.' })
    } catch (err) {
      console.error('[manage-client/excluir]', err)
      return res.status(500).json({ erro: 'Erro ao excluir empresa: ' + err.message })
    }
  }

  // ── RESETAR SENHA ────────────────────────────────────
  if (acao === 'resetar_senha') {
    try {
      // Busca e-mail do responsável da empresa
      const { data: vinculos } = await sb
        .from('usuario_empresas')
        .select('usuario_id')
        .eq('empresa_id', empresa_id)
        .eq('perfil', 'admin')
        .limit(1)

      const { data: usuarioDireto } = await sb
        .from('usuarios')
        .select('id')
        .eq('empresa_id', empresa_id)
        .eq('perfil', 'admin')
        .limit(1)

      const userId = vinculos?.[0]?.usuario_id || usuarioDireto?.[0]?.id
      if (!userId) return res.status(404).json({ erro: 'Nenhum usuário admin encontrado para esta empresa.' })

      const { data: authUser } = await sb.auth.admin.getUserById(userId)
      if (!authUser?.user?.email) return res.status(404).json({ erro: 'E-mail do usuário não encontrado.' })

      const email = authUser.user.email
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dsegconsultoria.com.br'

      const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/redefinir-senha`,
      })

      if (error) throw new Error(error.message)

      return res.status(200).json({ ok: true, mensagem: `E-mail de redefinição enviado para ${email}` })
    } catch (err) {
      console.error('[manage-client/resetar_senha]', err)
      return res.status(500).json({ erro: 'Erro ao enviar e-mail: ' + err.message })
    }
  }

  return res.status(400).json({ erro: 'Ação inválida' })
}
