// pages/api/pesquisa-psicossocial/link.js
// Gera/obtém o link público (token opaco) da pesquisa de riscos psicossociais
// da empresa do usuário autenticado. GET devolve o link ativo (cria um se não
// existir); POST com action:'regenerar' encerra o link atual e cria outro.

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function gerarToken() {
  return crypto.randomBytes(24).toString('base64url')
}

async function autenticar(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return { erro: 'Autenticação necessária', status: 401 }

  const sbAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error } = await sbAuth.auth.getUser(token)
  if (error || !user) return { erro: 'Sessão inválida ou expirada', status: 401 }

  const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: usuarioDb } = await sbAdmin.from('usuarios').select('empresa_id').eq('id', user.id).single()
  if (!usuarioDb?.empresa_id) return { erro: 'Usuário sem empresa vinculada', status: 403 }

  return { sbAdmin, user, empresaId: usuarioDb.empresa_id }
}

function montarUrl(token) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base.replace(/\/$/, '')}/pesquisa-psicossocial/${token}`
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const auth = await autenticar(req)
  if (auth.erro) return res.status(auth.status).json({ erro: auth.erro })
  const { sbAdmin, user, empresaId } = auth

  const acao = req.method === 'POST' ? (req.body?.action || 'regenerar') : null

  if (acao === 'regenerar') {
    await sbAdmin.from('pesquisa_psicossocial_links')
      .update({ ativo: false, encerrado_em: new Date().toISOString() })
      .eq('empresa_id', empresaId).eq('ativo', true)

    const { data: novo, error } = await sbAdmin.from('pesquisa_psicossocial_links')
      .insert({ empresa_id: empresaId, token: gerarToken(), criado_por: user.id })
      .select('token, criado_em').single()

    if (error) return res.status(500).json({ erro: 'Erro ao gerar novo link.' })
    return res.status(200).json({ token: novo.token, url: montarUrl(novo.token), criado_em: novo.criado_em })
  }

  const { data: existente } = await sbAdmin.from('pesquisa_psicossocial_links')
    .select('token, criado_em').eq('empresa_id', empresaId).eq('ativo', true)
    .order('criado_em', { ascending: false }).limit(1).maybeSingle()

  if (existente) return res.status(200).json({ token: existente.token, url: montarUrl(existente.token), criado_em: existente.criado_em })

  const { data: novo, error } = await sbAdmin.from('pesquisa_psicossocial_links')
    .insert({ empresa_id: empresaId, token: gerarToken(), criado_por: user.id })
    .select('token, criado_em').single()

  if (error) return res.status(500).json({ erro: 'Erro ao gerar link.' })
  return res.status(200).json({ token: novo.token, url: montarUrl(novo.token), criado_em: novo.criado_em })
}
