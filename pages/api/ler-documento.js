export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const { paginas, tipo } = req.body
  if (!paginas || paginas.length === 0) return res.status(400).json({ erro: 'Nenhuma página enviada' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ erro: 'GEMINI_API_KEY não configurada na Vercel' })

  const prompts = {
    aso: `Você está analisando um ASO (Atestado de Saúde Ocupacional) brasileiro.
Retorne SOMENTE um JSON válido, sem markdown, sem texto antes ou depois. Use null para campos não encontrados.
{
  "funcionario": {
    "nome": "nome completo",
    "cpf": "000.000.000-00",
    "data_nasc": "DD/MM/AAAA",
    "data_adm": "DD/MM/AAAA",
    "matricula": "matrícula ou null",
    "funcao": "função ou null",
    "setor": "setor ou null"
  },
  "aso": {
    "tipo_aso": "admissional|periodico|retorno|mudanca|demissional|monitoracao",
    "data_exame": "DD/MM/AAAA",
    "prox_exame": "DD/MM/AAAA ou null",
    "conclusao": "apto|inapto|apto_restricao",
    "medico_nome": "nome do médico",
    "medico_crm": "CRM-UF ex: 12345-SP"
  },
  "exames": [{"nome": "nome do exame", "resultado": "Normal|Alterado|Pendente"}],
  "riscos": ["risco 1"],
  "confianca": {"nome": 90, "cpf": 90, "tipo_aso": 85, "data_exame": 95, "conclusao": 90, "medico_crm": 80}
}`,
    ltcat: `Você está analisando um LTCAT brasileiro.
Retorne SOMENTE JSON válido, sem markdown, sem texto antes ou depois.
{
  "dados_gerais": {
    "data_emissao": "DD/MM/AAAA",
    "data_vigencia": "DD/MM/AAAA",
    "prox_revisao": "DD/MM/AAAA ou null",
    "resp_nome": "nome do responsável",
    "resp_conselho": "CREA|CRQ|CRM",
    "resp_registro": "número"
  },
  "ghes": [{
    "nome": "GHE 01",
    "setor": "setor",
    "qtd_trabalhadores": 1,
    "aposentadoria_especial": false,
    "agentes": [{"tipo": "fis|qui|bio|erg", "nome": "agente", "valor": "medição", "limite": "LT", "supera_lt": false}],
    "epc": [{"nome": "EPC", "eficaz": true}],
    "epi": [{"nome": "EPI", "ca": "CA", "eficaz": true}]
  }],
  "confianca": {"data_emissao": 90, "resp_nome": 95, "ghes": 80}
}`
  }

  try {
    const parts = [
      ...paginas.map(b64 => ({
        inlineData: { mimeType: 'image/jpeg', data: b64 }
      })),
      { text: prompts[tipo] || prompts.aso }
    ]

    // Modelo e endpoint corretos conforme documentação oficial Google AI
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
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      return res.status(500).json({ erro: 'Erro na API Gemini: ' + errText })
    }

    const data = await response.json()
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let resultado
    try {
      resultado = JSON.parse(jsonLimpo)
    } catch {
      return res.status(500).json({
        erro: 'Resposta inválida do Gemini. Tente com um PDF mais legível.',
        raw: texto.substring(0, 300)
      })
    }

    return res.status(200).json({ sucesso: true, dados: resultado })

  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno: ' + err.message })
  }
}
