// pages/api/gerar-analise-psicossocial-ia.js
// Agrega as respostas anônimas da pesquisa de riscos psicossociais da empresa
// e pede à IA um texto técnico (no mesmo estilo das demais seções legais do
// PGR) descrevendo os achados reais, para substituir o parágrafo genérico da
// seção "RISCOS PSICOSSOCIAIS". O resultado é gravado direto em
// pgr.textos_legais_custom['RISCOS PSICOSSOCIAIS'] — mesmo mecanismo que a
// edição manual de textos legais já usa em pages/pgr.jsx.

import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP } from '../../lib/rate-limit'
import {
  DIMENSOES_PESQUISA, ITENS_PREVALENCIA_CRITICA, todosItens,
  mediaDimensao, classificarNivel, limiteAnaliseEfetivo,
} from '../../lib/pesquisa-psicossocial-conteudo'

const TITULO_SECAO = 'RISCOS PSICOSSOCIAIS'

const PROMPT_BASE = `Você é engenheiro/técnico de segurança do trabalho especialista em NR-1 e gestão de riscos psicossociais (Portaria MTE nº 1.419/2024).

Você vai receber os resultados agregados e ANÔNIMOS de uma pesquisa de riscos psicossociais respondida pelos colaboradores de uma empresa (médias por dimensão numa escala de 1 a 5, onde valores mais altos = maior exposição ao risco; percentuais de relato de itens críticos de assédio; e uma amostra de comentários abertos, também anônimos).

Sua tarefa é escrever o texto da seção "RISCOS PSICOSSOCIAIS" do PGR (Programa de Gerenciamento de Riscos) dessa empresa, substituindo o texto genérico padrão por uma análise que reflita os dados REAIS recebidos.

REGRAS:
1. Escreva de 3 a 5 parágrafos, em português técnico/formal, no mesmo estilo das demais seções legais de um PGR (linguagem objetiva de laudo, não coloquial).
2. Primeiro parágrafo: reafirme brevemente a base legal (NR-1, Portaria MTE nº 1.419/2024, FRPRT) e informe que a avaliação foi realizada por meio de consulta direta e anônima aos trabalhadores (cite o número de respondentes recebido).
3. Parágrafos seguintes: descreva os achados por dimensão, agrupando por nível (Elevado, Moderado, Baixo) — não repita todas as dimensões com o mesmo peso; dê destaque às de nível Elevado e Moderado, e trate as de nível Baixo de forma resumida ou agregada.
4. Se houver QUALQUER percentual de relato de assédio moral, sexual ou discriminação acima de 0%, trate isso em parágrafo próprio, com linguagem cautelosa e apropriada — não minimize, mas também não generalize um relato pontual como cultura sistêmica da empresa sem evidência suficiente para tanto. Nunca cite comentário individual literal que possa identificar alguém.
5. Não invente números ou achados que não estão nos dados fornecidos. Se um dado não veio, não mencione.
6. Feche com um parágrafo indicando que os achados de nível Moderado/Elevado devem orientar a priorização de medidas no plano de ação do PGR, e que a pesquisa deve ser reaplicada periodicamente (sugestão: anualmente) para acompanhar a evolução.
7. Nunca atribua uma citação a "um funcionário" ou "um colaborador" de forma que soe individualmente identificável — trate comentários sempre como tendência agregada ("alguns respondentes relataram...").
8. Retorne SOMENTE JSON válido, sem texto antes ou depois, no formato:
{ "paragrafos": ["parágrafo 1 completo", "parágrafo 2 completo", "..."] }`

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const ip = getClientIP(req)
  const { limited: limitedIp, retryAfter: retryIp } = await checkRateLimit(ip, { windowMs: 60_000, max: 6 })
  if (limitedIp) {
    res.setHeader('Retry-After', String(retryIp))
    return res.status(429).json({ erro: 'Muitas requisições. Tente novamente em breve.' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ erro: 'Autenticação necessária' })

  const sbAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error: authErr } = await sbAuth.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ erro: 'Sessão inválida ou expirada' })

  const { limited: limitedUser, retryAfter: retryUser } = await checkRateLimit(`user:${user.id}:psi-ia`, { windowMs: 3_600_000, max: 10 })
  if (limitedUser) {
    res.setHeader('Retry-After', String(retryUser))
    return res.status(429).json({ erro: 'Limite de gerações por hora atingido. Tente novamente mais tarde.' })
  }

  const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: usuarioDb } = await sbAdmin.from('usuarios').select('empresa_id').eq('id', user.id).single()
  if (!usuarioDb?.empresa_id) return res.status(403).json({ erro: 'Usuário sem empresa vinculada' })
  const empresaId = usuarioDb.empresa_id

  const { data: emp } = await sbAdmin.from('empresas').select('plano').eq('id', empresaId).single()
  if (emp?.plano === 'cancelado') return res.status(403).json({ erro: 'Assinatura cancelada. Acesse /planos para reativar.' })

  const { data: pgrAtivo } = await sbAdmin.from('pgr')
    .select('id, textos_legais_custom').eq('empresa_id', empresaId).eq('ativo', true)
    .order('criado_em', { ascending: false }).limit(1).maybeSingle()
  if (!pgrAtivo) return res.status(400).json({ erro: 'Nenhum PGR ativo encontrado. Crie o PGR da empresa antes de gerar a análise psicossocial.' })

  const [{ data: respostas, error: errRespostas }, { count: totalFuncionarios }] = await Promise.all([
    sbAdmin.from('pesquisa_psicossocial_respostas').select('respostas, comentario, sugestao').eq('empresa_id', empresaId).limit(5000),
    sbAdmin.from('funcionarios').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('ativo', true),
  ])
  if (errRespostas) return res.status(500).json({ erro: 'Erro ao carregar respostas da pesquisa.' })

  const minRespostasAnalise = limiteAnaliseEfetivo(totalFuncionarios)
  const total = respostas?.length || 0
  if (total < minRespostasAnalise) {
    return res.status(400).json({ erro: `São necessárias ao menos ${minRespostasAnalise} respostas para gerar a análise (recebidas: ${total}).` })
  }

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
    return { dimensao: d.nome, media_1_a_5: media != null ? Number(media.toFixed(2)) : null, nivel: classificarNivel(media).label }
  })

  const prevalenciaCritica = ITENS_PREVALENCIA_CRITICA.map(itemId => {
    const valores = valoresPorItem[itemId] || []
    const relatos = valores.filter(v => v >= 4).length
    const item = todosItens().find(i => i.id === itemId)
    return { descricao: item?.texto, percentual_relato: valores.length ? Number(((relatos / valores.length) * 100).toFixed(1)) : 0 }
  })

  const comentarios = respostas.map(r => r.comentario).filter(Boolean).slice(0, 40)
  const sugestoes = respostas.map(r => r.sugestao).filter(Boolean).slice(0, 40)

  const entrada = { total_respondentes: total, dimensoes, itens_criticos_assedio_discriminacao: prevalenciaCritica, comentarios_abertos: comentarios, sugestoes_abertas: sugestoes }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return res.status(500).json({ erro: 'IA não configurada no servidor.' })

  const _t0 = Date.now()
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: `${PROMPT_BASE}\n\nDADOS AGREGADOS DA PESQUISA:\n${JSON.stringify(entrada, null, 2)}` }],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('[gerar-analise-psicossocial-ia] Anthropic erro:', response.status, errBody.substring(0, 300))
      throw new Error(`Anthropic ${response.status}`)
    }

    const data = await response.json()
    const texto = data.content?.[0]?.text || ''
    const limpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let resultado = null
    try { resultado = JSON.parse(limpo) } catch {
      const ini = limpo.indexOf('{')
      const fim = limpo.lastIndexOf('}')
      if (ini !== -1 && fim !== -1) { try { resultado = JSON.parse(limpo.substring(ini, fim + 1)) } catch {} }
    }

    if (!resultado?.paragrafos?.length) {
      console.error('[gerar-analise-psicossocial-ia] Resposta sem parágrafos válidos:', texto.substring(0, 300))
      return res.status(500).json({ erro: 'A IA não conseguiu gerar a análise. Tente novamente.' })
    }

    const novosTextos = { ...(pgrAtivo.textos_legais_custom || {}), [TITULO_SECAO]: resultado.paragrafos }
    const { error: errUpdate } = await sbAdmin.from('pgr')
      .update({ textos_legais_custom: novosTextos }).eq('id', pgrAtivo.id)
    if (errUpdate) return res.status(500).json({ erro: 'IA gerou o texto, mas houve erro ao salvar no PGR.' })

    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/log-ia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
      body: JSON.stringify({
        servico: 'claude', modelo: 'claude-sonnet', status: 'ok', duracao_ms: Date.now() - _t0,
        tipo: 'gerar-analise-psicossocial-ia', tokens_entrada: data.usage?.input_tokens || null, tokens_saida: data.usage?.output_tokens || null,
        empresa_id: empresaId, usuario_id: user.id,
      }),
    }).catch(() => {})

    return res.status(200).json({ sucesso: true, paragrafos: resultado.paragrafos, pgr_id: pgrAtivo.id })
  } catch (err) {
    console.error('[gerar-analise-psicossocial-ia] falhou:', err.message?.substring(0, 200))
    return res.status(500).json({ erro: 'Falha ao gerar análise com IA. Tente novamente em alguns instantes.' })
  }
}
