// pages/api/pesquisa-psicossocial/responder.js
// Recebe a resposta anônima de um colaborador ao questionário de riscos
// psicossociais. Sem autenticação (o respondente nunca tem sessão Supabase
// da empresa) — protegido por rate limit de IP, igual ao padrão de
// pages/api/leads/proposta.js. Nada de PII é aceito ou gravado.

import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP } from '../../../lib/rate-limit'
import { todosItens } from '../../../lib/pesquisa-psicossocial-conteudo'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const ip = getClientIP(req)
  const { limited, retryAfter } = await checkRateLimit(`psi-responder:${ip}`, { windowMs: 3_600_000, max: 60 })
  if (limited) {
    res.setHeader('Retry-After', String(retryAfter))
    return res.status(429).json({ erro: 'Muitas requisições. Tente novamente mais tarde.' })
  }

  const { token, respostas, setor, comentario, sugestao } = req.body || {}
  if (!token || typeof token !== 'string') return res.status(400).json({ erro: 'Link inválido.' })
  if (!respostas || typeof respostas !== 'object') return res.status(400).json({ erro: 'Respostas ausentes.' })

  const itens = todosItens()
  const respostasValidadas = {}
  for (const item of itens) {
    const valor = respostas[item.id]
    if (!Number.isInteger(valor) || valor < 1 || valor > 5) {
      return res.status(400).json({ erro: `Responda todas as perguntas (falta: "${item.texto}").` })
    }
    respostasValidadas[item.id] = valor
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: link } = await sb.from('pesquisa_psicossocial_links')
    .select('id, empresa_id, ativo').eq('token', token).maybeSingle()

  if (!link || !link.ativo) return res.status(404).json({ erro: 'Este link de pesquisa não existe ou foi encerrado.' })

  const { error } = await sb.from('pesquisa_psicossocial_respostas').insert({
    empresa_id: link.empresa_id,
    link_id: link.id,
    setor: setor ? String(setor).trim().substring(0, 120) : null,
    respostas: respostasValidadas,
    comentario: comentario ? String(comentario).trim().substring(0, 2000) : null,
    sugestao: sugestao ? String(sugestao).trim().substring(0, 2000) : null,
  })

  if (error) {
    console.error('[pesquisa-psicossocial/responder] erro ao salvar:', error.message)
    return res.status(500).json({ erro: 'Erro ao registrar resposta. Tente novamente.' })
  }

  return res.status(200).json({ sucesso: true })
}
