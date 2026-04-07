// pages/api/ler-documento.js
// API Route Next.js — recebe imagens base64 do PDF e retorna dados extraídos pelo Claude

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const { paginas, tipo } = req.body

  if (!paginas || paginas.length === 0) {
    return res.status(400).json({ erro: 'Nenhuma página enviada' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ erro: 'ANTHROPIC_API_KEY não configurada nas variáveis de ambiente da Vercel' })
  }

  const prompts = {
    aso: `Você está analisando um ASO (Atestado de Saúde Ocupacional) brasileiro.
Extraia TODOS os campos visíveis e retorne SOMENTE um JSON válido, sem markdown, sem explicação.
Use null para campos não encontrados.

{
  "funcionario": {
    "nome": "nome completo do trabalhador",
    "cpf": "CPF no formato 000.000.000-00",
    "data_nasc": "DD/MM/AAAA",
    "data_adm": "DD/MM/AAAA ou null",
    "matricula": "matrícula ou null",
    "funcao": "função/cargo ou null",
    "setor": "setor/GHE ou null",
    "cbo": "código CBO ou null"
  },
  "aso": {
    "tipo_aso": "admissional|periodico|retorno|mudanca|demissional|monitoracao",
    "data_exame": "DD/MM/AAAA",
    "prox_exame": "DD/MM/AAAA ou null",
    "conclusao": "apto|inapto|apto_restricao",
    "medico_nome": "nome do médico",
    "medico_crm": "CRM com UF ex: 12345-SP"
  },
  "exames": [
    {"nome": "nome do exame", "resultado": "Normal|Alterado|Pendente"}
  ],
  "riscos": ["risco 1", "risco 2"],
  "confianca": {
    "nome": 95,
    "cpf": 90,
    "tipo_aso": 85,
    "data_exame": 95,
    "conclusao": 90,
    "medico_crm": 80
  }
}`,

    ltcat: `Você está analisando um LTCAT (Laudo Técnico das Condições Ambientais do Trabalho) brasileiro.
Extraia TODOS os dados visíveis e retorne SOMENTE um JSON válido, sem markdown, sem explicação.
Use null para campos não encontrados.

{
  "dados_gerais": {
    "data_emissao": "DD/MM/AAAA",
    "data_vigencia": "DD/MM/AAAA ou null",
    "prox_revisao": "DD/MM/AAAA ou null",
    "resp_nome": "nome do responsável técnico",
    "resp_conselho": "CREA|CRQ|CRM",
    "resp_registro": "número do registro"
  },
  "ghes": [
    {
      "nome": "nome do GHE",
      "setor": "setor",
      "qtd_trabalhadores": 0,
      "aposentadoria_especial": false,
      "agentes": [
        {
          "tipo": "fis|qui|bio|erg",
          "nome": "nome do agente",
          "valor": "valor medido",
          "limite": "limite de tolerância",
          "supera_lt": false
        }
      ],
      "epc": [{"nome": "nome do EPC", "eficaz": true}],
      "epi": [{"nome": "nome do EPI", "ca": "número CA", "eficaz": true}]
    }
  ],
  "confianca": {
    "data_emissao": 90,
    "resp_nome": 95,
    "ghes": 80
  }
}`
  }

  try {
    // Monta o conteúdo com todas as páginas do PDF
    const content = [
      ...paginas.map(b64 => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: b64,
        },
      })),
      {
        type: 'text',
        text: prompts[tipo] || prompts.aso,
      },
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(500).json({ erro: 'Erro na API Claude: ' + errText })
    }

    const data = await response.json()
    const texto = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    // Remove markdown se Claude incluir
    const jsonLimpo = texto
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let resultado
    try {
      resultado = JSON.parse(jsonLimpo)
    } catch {
      return res.status(500).json({
        erro: 'Claude retornou resposta inválida. Tente com um PDF mais legível.',
        raw: texto.substring(0, 200)
      })
    }

    return res.status(200).json({ sucesso: true, dados: resultado })

  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno: ' + err.message })
  }
}
