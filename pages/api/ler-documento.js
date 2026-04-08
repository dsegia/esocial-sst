// pages/api/ler-documento.js
// Usa gemini-2.5-flash-lite (1000 req/dia grátis) + Anthropic como fallback

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const { paginas, texto_pdf, tipo } = req.body
  const geminiKey    = process.env.GEMINI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!geminiKey && !anthropicKey) return res.status(500).json({ erro: 'Nenhuma API key configurada' })

  const prompt_aso = `Você é um extrator de dados de ASO brasileiro. Analise o documento e retorne SOMENTE o JSON abaixo preenchido. Não escreva nada antes ou depois do JSON. Campos não encontrados devem ser null.
{"funcionario":{"nome":null,"cpf":null,"data_nasc":null,"data_adm":null,"matricula":null,"funcao":null,"setor":null},"aso":{"tipo_aso":"periodico","data_exame":null,"prox_exame":null,"conclusao":"apto","medico_nome":null,"medico_crm":null},"exames":[{"nome":"exame","resultado":"Normal"}],"riscos":[],"confianca":{"nome":85,"cpf":85,"tipo_aso":80,"data_exame":90,"conclusao":85}}`

  const prompt_ltcat = `Você é um extrator de dados de LTCAT brasileiro. Retorne SOMENTE o JSON abaixo. Campos não encontrados devem ser null.
{"dados_gerais":{"data_emissao":null,"data_vigencia":null,"prox_revisao":null,"resp_nome":null,"resp_conselho":"CREA","resp_registro":null},"ghes":[{"nome":"GHE 01","setor":null,"qtd_trabalhadores":1,"aposentadoria_especial":false,"agentes":[{"tipo":"fis","nome":"agente","valor":null,"limite":null,"supera_lt":false}],"epc":[],"epi":[]}],"confianca":{"data_emissao":90,"resp_nome":90,"ghes":75}}`

  const promptBase = tipo === 'ltcat' ? prompt_ltcat : prompt_aso
  const usandoTexto = texto_pdf && texto_pdf.replace(/\s/g,'').length > 100

  // Parser robusto
  function extrairJSON(str) {
    const inicio = str.indexOf('{')
    if (inicio === -1) return null
    let depth = 0
    for (let i = inicio; i < str.length; i++) {
      if (str[i] === '{') depth++
      if (str[i] === '}') { depth--; if (depth === 0) return str.substring(inicio, i+1) }
    }
    return null
  }

  function parseRobusto(texto) {
    const limpo = texto.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
    for (const fn of [
      () => JSON.parse(limpo),
      () => JSON.parse(extrairJSON(limpo)),
      () => JSON.parse(extrairJSON(texto)),
    ]) { try { const r = fn(); if (r) return r } catch {} }
    return null
  }

  // ── TENTAR GEMINI PRIMEIRO ─────────────────────────
  if (geminiKey) {
    try {
      let parts = []
      // Modelo: gemini-2.5-flash-lite (1000 req/dia grátis — o mais generoso)
      // Fallback: gemini-2.5-flash (250 req/dia)
      const modelos = usandoTexto
        ? ['gemini-2.5-flash-lite', 'gemini-2.5-flash']
        : ['gemini-2.5-flash', 'gemini-2.5-flash-lite']

      if (usandoTexto) {
        parts = [{ text: `${promptBase}\n\nTEXTO DO DOCUMENTO:\n${texto_pdf.substring(0, 12000)}` }]
      } else if (paginas?.length > 0) {
        parts = [
          ...paginas.map(b64 => ({ inlineData: { mimeType:'image/jpeg', data:b64 } })),
          { text: promptBase }
        ]
      }

      for (const modelo of modelos) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
            {
              method: 'POST',
              headers: { 'Content-Type':'application/json', 'x-goog-api-key': geminiKey },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { temperature:0, maxOutputTokens:8192 }
              })
            }
          )

          if (!response.ok) {
            const err = await response.json()
            const code = err?.error?.code
            // Se quota esgotada (429) ou modelo indisponível (503), tenta próximo modelo
            if (code === 429 || code === 503) {
              console.log(`Modelo ${modelo} indisponível (${code}), tentando próximo...`)
              continue
            }
            throw new Error(JSON.stringify(err))
          }

          const data = await response.json()
          const texto = (data.candidates?.[0]?.content?.parts || [])
            .filter(p => p.text).map(p => p.text).join('')

          const resultado = parseRobusto(texto)
          if (resultado) {
            return res.status(200).json({ sucesso:true, dados:resultado, modo: usandoTexto?'texto':'imagem', modelo })
          }
        } catch (err) {
          console.log(`Erro no modelo ${modelo}:`, err.message)
          continue
        }
      }
    } catch (err) {
      console.log('Gemini falhou completamente:', err.message)
    }
  }

  // ── FALLBACK: ANTHROPIC CLAUDE ─────────────────────
  if (anthropicKey) {
    try {
      let content = []

      if (paginas?.length > 0) {
        // Imagens para Claude
        paginas.forEach(b64 => {
          content.push({ type:'image', source:{ type:'base64', media_type:'image/jpeg', data:b64 } })
        })
      }
      content.push({ type:'text', text: usandoTexto
        ? `${promptBase}\n\nTEXTO DO DOCUMENTO:\n${texto_pdf?.substring(0, 12000)}`
        : promptBase
      })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001', // modelo mais barato
          max_tokens: 4000,
          messages: [{ role:'user', content }]
        })
      })

      if (!response.ok) throw new Error(await response.text())

      const data = await response.json()
      const texto = data.content?.[0]?.text || ''
      const resultado = parseRobusto(texto)

      if (resultado) {
        return res.status(200).json({ sucesso:true, dados:resultado, modo: usandoTexto?'texto':'imagem', modelo:'claude-fallback' })
      }
      throw new Error('Anthropic não retornou JSON válido')

    } catch (err) {
      return res.status(500).json({ erro: 'Erro no Anthropic: ' + err.message })
    }
  }

  return res.status(500).json({ erro: 'Todas as APIs falharam. Tente novamente em alguns minutos.' })
}
