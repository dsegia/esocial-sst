// pages/api/gerar-ghe-ia.js
// Gera GHEs (Grupo Homogêneo de Exposição) com IA a partir dos funcionários já
// cadastrados: agrupa por função/setor, sugere descrição de cargo e riscos
// pré-estabelecidos com severidade/probabilidade e análise qualitativa.
// O resultado é sempre um RASCUNHO — nada é salvo sem revisão manual do usuário.

import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP } from '../../lib/rate-limit'

const PROMPT = `Você é engenheiro de segurança do trabalho especialista em PGR/LTCAT brasileiro (NR-1, NR-9, NR-15, NR-16, NR-17).

Você vai receber uma lista de funções/cargos já cadastrados numa empresa (com setor e quantidade de funcionários em cada). Sua tarefa é agrupá-los em GHEs (Grupos Homogêneos de Exposição) e, para CADA GHE, sugerir uma caracterização técnica INICIAL a ser revisada por um profissional habilitado antes de qualquer uso oficial.

REGRAS:
1. Agrupe funções em um mesmo GHE quando o setor for igual ou muito similar e a natureza da exposição a risco for parecida. Funções de setores muito diferentes NÃO devem compartilhar GHE, mesmo que pareçam semelhantes.
2. "atividades" de cada função: descrição objetiva de 1 a 2 frases do que a função tipicamente faz, com base no nome do cargo e no setor informado — texto plausível e genérico, não invente detalhes específicos da empresa (nomes de máquinas, processos exclusivos etc.) que você não tem como saber.
3. "riscos": liste riscos TIPICAMENTE associados a essa função/setor conforme a legislação brasileira (NR-9/NR-15/NR-16 e Tabela 24 do eSocial). Use bom senso ocupacional — não invente riscos exóticos. Se a função for tipicamente de baixo risco (ex: administrativo em escritório), é válido retornar poucos riscos ou majoritariamente ergonômicos.
4. Cada risco deve ter "severidade" ∈ {2,4,8,16,32} (2=Leve, 4=Moderado, 8=Grave, 16=Crítica, 32=Catastrófica) e "probabilidade" ∈ {2,3,5,8,13} (2=Raro, 3=Pouco Provável, 5=Ocasional, 8=Provável, 13=Frequente), atribuídos com critério conservador e plausível para o tipo de atividade.
5. "analise_qualitativa": 1 a 3 frases explicando POR QUE esse risco existe nessa função e QUAL o potencial de dano — linguagem técnica de laudo, não genérica.
6. "aposentadoria_especial": true SOMENTE se o GHE tiver agente nocivo classicamente enquadrado no Anexo IV do Decreto 3.048/99 (ex: ruído acima de limite, calor, agentes químicos cancerígenos, biológico em saúde/saneamento). Na dúvida, false — profissional habilitado decide depois.
7. Retorne SOMENTE JSON válido, sem texto antes ou depois. Nunca deixe "ghes" vazio se houver funções na entrada — toda função de entrada deve aparecer em algum GHE de saída.

Formato de saída:
{
  "ghes": [
    {
      "nome": "GHE 01 - Nome do grupo",
      "setor": "Nome do setor",
      "qtd_trabalhadores": 3,
      "aposentadoria_especial": false,
      "funcoes": [
        {"nome": "Cargo exato recebido na entrada", "atividades": "Descrição objetiva da atividade típica."}
      ],
      "riscos": [
        {
          "tipo": "erg",
          "nome": "Postura inadequada",
          "perigo": "Permanência em pé ou sentado por período prolongado",
          "danos_saude": "LER/DORT, dores osteomusculares",
          "analise_qualitativa": "A função exige postura estática prolongada durante o atendimento, favorecendo o desenvolvimento de distúrbios osteomusculares ao longo do tempo se não houver pausas e mobiliário adequado.",
          "severidade": 4,
          "probabilidade": 5
        }
      ]
    }
  ]
}`

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

  const { limited: limitedUser, retryAfter: retryUser } = await checkRateLimit(`user:${user.id}:ghe-ia`, { windowMs: 3_600_000, max: 10 })
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

  const { data: funcionarios } = await sbAdmin.from('funcionarios')
    .select('funcao,setor').eq('empresa_id', empresaId).eq('ativo', true).limit(2000)

  if (!funcionarios?.length) return res.status(400).json({ erro: 'Nenhum funcionário ativo cadastrado. Cadastre os funcionários antes de gerar GHEs com IA.' })

  // Agrupa por função+setor exatos para não mandar centenas de linhas repetidas ao modelo
  const contagem = new Map()
  for (const f of funcionarios) {
    if (!f.funcao) continue
    const chave = `${f.funcao.trim()}|||${(f.setor || '').trim()}`
    contagem.set(chave, (contagem.get(chave) || 0) + 1)
  }
  const entrada = [...contagem.entries()].map(([chave, qtd]) => {
    const [funcao, setor] = chave.split('|||')
    return { funcao, setor: setor || null, qtd_funcionarios: qtd }
  })
  if (!entrada.length) return res.status(400).json({ erro: 'Nenhum funcionário com função cadastrada.' })

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return res.status(500).json({ erro: 'IA não configurada no servidor.' })

  const _t0 = Date.now()
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: `${PROMPT}\n\nFUNÇÕES CADASTRADAS NESTA EMPRESA:\n${JSON.stringify(entrada, null, 2)}` }],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('[gerar-ghe-ia] Anthropic erro:', response.status, errBody.substring(0, 300))
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

    if (!resultado?.ghes?.length) {
      console.error('[gerar-ghe-ia] Resposta sem GHEs válidos:', texto.substring(0, 300))
      return res.status(500).json({ erro: 'A IA não conseguiu gerar GHEs a partir dos funcionários cadastrados. Tente novamente.' })
    }

    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/log-ia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
      body: JSON.stringify({
        servico: 'claude', modelo: 'claude-sonnet', status: 'ok', duracao_ms: Date.now() - _t0,
        tipo: 'gerar-ghe-ia', tokens_entrada: data.usage?.input_tokens || null, tokens_saida: data.usage?.output_tokens || null,
        empresa_id: empresaId, usuario_id: user.id,
      }),
    }).catch(() => {})

    return res.status(200).json({ sucesso: true, ghes: resultado.ghes })
  } catch (err) {
    console.error('[gerar-ghe-ia] falhou:', err.message?.substring(0, 200))
    return res.status(500).json({ erro: 'Falha ao gerar GHEs com IA. Tente novamente em alguns instantes.' })
  }
}
