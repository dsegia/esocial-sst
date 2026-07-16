// pages/api/revisar-metodologia-ltcat.js
// Revisão consultiva (não bloqueante) da metodologia padrão do LTCAT: para cada
// risco informado, pergunta à IA se a metodologia padrão do tipo de agente
// (lib/ltcat-conteudo.ts → METODOLOGIAS_RISCO) parece coerente com o agente e
// os dados medidos. Não substitui nem gera texto de metodologia — só avisa a
// tela quando algo parece tecnicamente incoerente, para o usuário revisar
// antes de exportar o PDF (que continua usando os textos estáticos padrão).

import { checkRateLimit, getClientIP } from '../../lib/rate-limit'

function extrairJSON(str) {
  const ini = str.indexOf('{'); if (ini === -1) return null
  let d = 0
  for (let i = ini; i < str.length; i++) { if (str[i] === '{') d++; if (str[i] === '}') { d--; if (d === 0) return str.substring(ini, i + 1) } }
  return null
}

function parseRobusto(texto) {
  const limpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  for (const fn of [
    () => JSON.parse(limpo),
    () => JSON.parse(extrairJSON(limpo)),
    () => JSON.parse(extrairJSON(texto)),
  ]) { try { const r = fn(); if (r) return r } catch {} }
  return null
}

function montarPrompt(riscos) {
  const lista = riscos.map((r, i) => (
    `${i + 1}. tipo_risco="${r.tipo_risco}" agente="${r.nome_agente}" valor_medido="${r.valor_medido ?? '—'}" limite_tolerancia="${r.limite_tolerancia ?? '—'}" metodologia_padrao="${r.metodologia_padrao}"`
  )).join('\n')

  return `Você é auditor técnico de LTCAT/NR-15/NHO-Fundacentro. Para cada risco listado, avalie SOMENTE se a metodologia padrão informada é tecnicamente coerente com o tipo de risco e o agente descritos — não avalie mais nada.

Marque "compativel": false APENAS quando houver uma inconsistência técnica real e óbvia (ex.: um agente tipicamente físico como ruído ou calor classificado como risco químico ou biológico; uma metodologia de NHO claramente incompatível com o agente, como usar NHO de ruído para um agente químico). Na dúvida, marque "compativel": true — o objetivo é só sinalizar erros grosseiros de classificação, não questionar escolhas técnicas legítimas.

Retorne SOMENTE JSON, sem texto antes ou depois, no formato:
{"resultados":[{"indice":1,"compativel":true,"observacao":""}]}

"observacao" só deve conter texto quando "compativel" for false, explicando em 1 frase curta o que parece incoerente.

RISCOS:
${lista}`
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } }, maxDuration: 30 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const ip = getClientIP(req)
  const { limited: limitedIp, retryAfter: retryIp } = await checkRateLimit(ip, { windowMs: 60_000, max: 10 })
  if (limitedIp) {
    res.setHeader('Retry-After', String(retryIp))
    return res.status(429).json({ erro: 'Muitas requisições. Tente novamente em breve.' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ erro: 'Autenticação necessária' })

  let userId = null
  try {
    const { createClient } = require('@supabase/supabase-js')
    const sbAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user }, error } = await sbAuth.auth.getUser(token)
    if (error || !user) return res.status(401).json({ erro: 'Sessão inválida ou expirada' })
    userId = user.id
  } catch {
    return res.status(401).json({ erro: 'Falha na verificação de autenticação' })
  }

  const { limited: limitedUser, retryAfter: retryUser } = await checkRateLimit(`user:${userId}`, { windowMs: 3_600_000, max: 30 })
  if (limitedUser) {
    res.setHeader('Retry-After', String(retryUser))
    return res.status(429).json({ erro: 'Limite de revisões por hora atingido. Tente novamente mais tarde.' })
  }

  try {
    const { createClient: cc } = require('@supabase/supabase-js')
    const sbAdmin = cc(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: usuarioDb } = await sbAdmin.from('usuarios').select('empresa_id').eq('id', userId).single()
    if (usuarioDb?.empresa_id) {
      const { data: emp } = await sbAdmin.from('empresas').select('plano').eq('id', usuarioDb.empresa_id).single()
      if (emp?.plano === 'cancelado') {
        return res.status(403).json({ erro: 'Assinatura cancelada. Acesse /planos para reativar.' })
      }
    }
  } catch { /* não bloqueia se a verificação falhar */ }

  const { riscos } = req.body
  if (!Array.isArray(riscos) || !riscos.length) {
    return res.status(200).json({ sucesso: true, resultados: [] })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return res.status(500).json({ erro: 'Nenhuma API key configurada' })

  const riscosLimitados = riscos.slice(0, 60)
  const prompt = montarPrompt(riscosLimitados)

  async function chamarClaude(modelo, maxTokens) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    })
    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`Anthropic ${response.status}: ${errBody.substring(0, 150)}`)
    }
    const data = await response.json()
    const texto = data.content?.[0]?.text || ''
    return parseRobusto(texto)
  }

  let resultado = null
  try {
    resultado = await chamarClaude('claude-sonnet-4-6', 4000)
  } catch (err) {
    console.error('[revisar-metodologia-ltcat] Sonnet falhou:', err.message?.substring(0, 150))
    try {
      resultado = await chamarClaude('claude-haiku-4-5-20251001', 2000)
    } catch (err2) {
      console.error('[revisar-metodologia-ltcat] Haiku fallback falhou:', err2.message?.substring(0, 150))
    }
  }

  if (!resultado?.resultados) {
    return res.status(500).json({ erro: 'Não foi possível revisar a metodologia agora. Tente novamente em alguns minutos.' })
  }

  const resultados = riscosLimitados.map((r, i) => {
    const item = resultado.resultados.find(x => x.indice === i + 1) || resultado.resultados[i]
    return {
      nome_agente: r.nome_agente,
      tipo_risco: r.tipo_risco,
      compativel: item?.compativel !== false,
      observacao: item?.compativel === false ? (item.observacao || '') : '',
    }
  })

  return res.status(200).json({ sucesso: true, resultados })
}
