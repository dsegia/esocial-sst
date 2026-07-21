// pages/api/pesquisa-psicossocial/resultados.js
// Agrega as respostas anônimas da empresa do usuário autenticado: médias por
// dimensão, prevalência dos itens críticos (assédio) e comentários abertos.
// Nunca devolve respostas individuais — só agregados, e só a partir do
// tamanho mínimo definido em MIN_RESPOSTAS_ANALISE/MIN_RESPOSTAS_SETOR, para
// preservar o anonimato dos respondentes.

import { createClient } from '@supabase/supabase-js'
import {
  DIMENSOES_PESQUISA, ITENS_PREVALENCIA_CRITICA, todosItens,
  mediaDimensao, classificarNivel, MIN_RESPOSTAS_ANALISE, MIN_RESPOSTAS_SETOR,
} from '../../../lib/pesquisa-psicossocial-conteudo'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ erro: 'Autenticação necessária' })

  const sbAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error: authErr } = await sbAuth.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ erro: 'Sessão inválida ou expirada' })

  const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: usuarioDb } = await sbAdmin.from('usuarios').select('empresa_id').eq('id', user.id).single()
  if (!usuarioDb?.empresa_id) return res.status(403).json({ erro: 'Usuário sem empresa vinculada' })
  const empresaId = usuarioDb.empresa_id

  const { data: respostas, error } = await sbAdmin.from('pesquisa_psicossocial_respostas')
    .select('setor, respostas, comentario, sugestao, criado_em')
    .eq('empresa_id', empresaId).order('criado_em', { ascending: false }).limit(5000)

  if (error) return res.status(500).json({ erro: 'Erro ao carregar resultados.' })

  const total = respostas?.length || 0
  const liberadoAnalise = total >= MIN_RESPOSTAS_ANALISE

  if (!total) {
    return res.status(200).json({
      total, liberado_analise: false, min_respostas_analise: MIN_RESPOSTAS_ANALISE,
      dimensoes: [], prevalencia_critica: [], setores: [], comentarios: [], sugestoes: [],
    })
  }

  // valores por item, agregados de todas as respostas (empresa toda)
  const valoresPorItem = {}
  for (const item of todosItens()) valoresPorItem[item.id] = []
  for (const r of respostas) {
    for (const item of todosItens()) {
      const v = r.respostas?.[item.id]
      if (Number.isInteger(v)) valoresPorItem[item.id].push(v)
    }
  }

  const dimensoes = DIMENSOES_PESQUISA.map(d => {
    const media = mediaDimensao(valoresPorItem, d.id)
    const nivel = classificarNivel(media)
    return { id: d.id, nome: d.nome, media: media != null ? Number(media.toFixed(2)) : null, ...nivel }
  })

  const itensPorId = Object.fromEntries(todosItens().map(i => [i.id, i.texto]))
  const prevalenciaCritica = ITENS_PREVALENCIA_CRITICA.map(itemId => {
    const valores = valoresPorItem[itemId] || []
    const relatos = valores.filter(v => v >= 4).length
    return {
      item_id: itemId,
      texto: itensPorId[itemId],
      respostas: valores.length,
      relatos,
      percentual: valores.length ? Number(((relatos / valores.length) * 100).toFixed(1)) : 0,
    }
  })

  // agrupamento por setor autodeclarado — só aparece se o grupo tiver tamanho
  // mínimo, senão cai no "não segmentado" (mantido fora do array de setores)
  const gruposSetor = new Map()
  for (const r of respostas) {
    const chave = (r.setor || '').trim()
    if (!chave) continue
    if (!gruposSetor.has(chave)) gruposSetor.set(chave, [])
    gruposSetor.get(chave).push(r)
  }

  const setores = [...gruposSetor.entries()]
    .filter(([, rs]) => rs.length >= MIN_RESPOSTAS_SETOR)
    .map(([nome, rs]) => {
      const valoresSetor = {}
      for (const item of todosItens()) valoresSetor[item.id] = []
      for (const r of rs) {
        for (const item of todosItens()) {
          const v = r.respostas?.[item.id]
          if (Number.isInteger(v)) valoresSetor[item.id].push(v)
        }
      }
      const mediasSetor = DIMENSOES_PESQUISA.map(d => mediaDimensao(valoresSetor, d.id)).filter(m => m != null)
      const mediaGeral = mediasSetor.length ? mediasSetor.reduce((a, b) => a + b, 0) / mediasSetor.length : null
      return { nome, total: rs.length, media_geral: mediaGeral != null ? Number(mediaGeral.toFixed(2)) : null, ...classificarNivel(mediaGeral) }
    })
    .sort((a, b) => (b.media_geral || 0) - (a.media_geral || 0))

  const comentarios = liberadoAnalise ? respostas.map(r => r.comentario).filter(Boolean) : []
  const sugestoes = liberadoAnalise ? respostas.map(r => r.sugestao).filter(Boolean) : []

  return res.status(200).json({
    total, liberado_analise: liberadoAnalise, min_respostas_analise: MIN_RESPOSTAS_ANALISE,
    dimensoes, prevalencia_critica: prevalenciaCritica, setores, comentarios, sugestoes,
  })
}
