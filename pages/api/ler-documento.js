export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const { paginas, tipo } = req.body
  if (!paginas || paginas.length === 0) return res.status(400).json({ erro: 'Nenhuma página enviada' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ erro: 'GEMINI_API_KEY não configurada na Vercel' })

  const prompts = {
    aso: `Analise este ASO (Atestado de Saúde Ocupacional) brasileiro e extraia os dados.
IMPORTANTE: Responda APENAS com o JSON abaixo, sem nenhum texto antes ou depois, sem markdown, sem blocos de código.
{
  "funcionario": {
    "nome": "nome completo do trabalhador ou null",
    "cpf": "CPF formatado 000.000.000-00 ou null",
    "data_nasc": "DD/MM/AAAA ou null",
    "data_adm": "DD/MM/AAAA ou null",
    "matricula": "matrícula ou null",
    "funcao": "função ou null",
    "setor": "setor ou null"
  },
  "aso": {
    "tipo_aso": "admissional ou periodico ou retorno ou mudanca ou demissional ou monitoracao",
    "data_exame": "DD/MM/AAAA ou null",
    "prox_exame": "DD/MM/AAAA ou null",
    "conclusao": "apto ou inapto ou apto_restricao",
    "medico_nome": "nome do médico ou null",
    "medico_crm": "número CRM ou null"
  },
  "exames": [{"nome": "nome", "resultado": "Normal ou Alterado ou Pendente"}],
  "riscos": [],
  "confianca": {"nome": 85, "cpf": 85, "tipo_aso": 80, "data_exame": 90, "conclusao": 85, "medico_crm": 75}
}`,
    ltcat: `Analise este LTCAT (Laudo Técnico das Condições Ambientais do Trabalho) brasileiro.
IMPORTANTE: Responda APENAS com o JSON abaixo, sem nenhum texto antes ou depois, sem markdown.
{
  "dados_gerais": {
    "data_emissao": "DD/MM/AAAA ou null",
    "data_vigencia": "DD/MM/AAAA ou null",
    "prox_revisao": "DD/MM/AAAA ou null",
    "resp_nome": "nome do responsável ou null",
    "resp_conselho": "CREA ou CRQ ou CRM",
    "resp_registro": "número ou null"
  },
  "ghes": [{
    "nome": "nome do GHE",
    "setor": "setor",
    "qtd_trabalhadores": 1,
    "aposentadoria_especial": false,
    "agentes": [{"tipo": "fis", "nome": "agente", "valor": "medição", "limite": "LT", "supera_lt": false}],
    "epc": [{"nome": "EPC", "eficaz": true}],
    "epi": [{"nome": "EPI", "ca": "CA", "eficaz": true}]
  }],
  "confianca": {"data_emissao": 90, "resp_nome": 90, "ghes": 75}
}`
  }

  try {
    const parts = [
      ...paginas.map(b64 => ({
        inlineData: { mimeType: 'image/jpeg', data: b64 }
      })),
      { text: prompts[tipo] || prompts.aso }
    ]

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 2000,
            responseMimeType: 'application/json',
          }
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      return res.status(500).json({ erro: 'Erro na API Gemini: ' + errText })
    }

    const data = await response.json()

    // Extrai texto de todos os parts (incluindo thinking)
    const texto = (data.candidates?.[0]?.content?.parts || [])
      .filter(p => p.text)
      .map(p => p.text)
      .join('')

    // Parser robusto — tenta encontrar JSON dentro do texto
    let resultado
    try {
      // Tenta parse direto primeiro
      resultado = JSON.parse(texto.trim())
    } catch {
      // Busca o primeiro bloco JSON válido no texto
      const match = texto.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          resultado = JSON.parse(match[0])
        } catch {
          return res.status(500).json({
            erro: 'Não foi possível extrair os dados do documento. O PDF pode estar muito borrado ou com baixa qualidade.',
            debug: texto.substring(0, 500)
          })
        }
      } else {
        return res.status(500).json({
          erro: 'Gemini não retornou dados estruturados. Tente com outro PDF.',
          debug: texto.substring(0, 500)
        })
      }
    }

    return res.status(200).json({ sucesso: true, dados: resultado })

  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno: ' + err.message })
  }
}
