// pages/api/ler-documento.js
// Gemini 2.5-flash-lite (1000 req/dia grátis) + Anthropic fallback
// Exames mapeados para Tabela 27, Riscos para Tabela 24

import { checkRateLimit, getClientIP } from '../../lib/rate-limit'

// ─── TABELA 27 — Procedimentos Diagnósticos (eSocial S-2220) ───────────
const TABELA27 = {
  // 0001 — Avaliação Clínica
  'avaliacao clinica':'0001','exame clinico':'0001','anamnese':'0001','consulta medica':'0001','avaliacao medica':'0001',
  // 0002 — Avaliação Psicossocial
  'avaliacao psicossocial':'0002','psicossocial':'0002','avaliacao psiquiatrica':'0002','avaliacao psicologica':'0002',
  // 0010 — Hemograma
  'hemograma':'0010','hemograma completo':'0010','eritrograma':'0010','leucograma':'0010','plaquetas':'0010','cbc':'0010',
  // 0011 — Glicemia
  'glicemia':'0011','glicemia de jejum':'0011','glicose':'0011','hemoglobina glicada':'0011','hba1c':'0011','curva glicemica':'0011','glicemia/ glicose':'0011','glicemia/glicose':'0011',
  // 0012 — Urina Tipo I (EAS)
  'urina':'0012','eas':'0012','urina tipo i':'0012','urina rotina':'0012','sumario de urina':'0012','urinocalise':'0012','parcial de urina':'0012',
  // 0013 — Ureia
  'ureia':'0013','ureia sanguinea':'0013','bun':'0013',
  // 0014 — Creatinina
  'creatinina':'0014','clearance creatinina':'0014','taxa filtracao glomerular':'0014','tfg':'0014',
  // 0015 — Ácido Úrico
  'acido urico':'0015',
  // 0016 — Colesterol Total e Frações
  'colesterol':'0016','ldl':'0016','hdl':'0016','vldl':'0016','perfil lipidico':'0016','lipidograma':'0016','colesterol total':'0016','nao hdl':'0016',
  // 0017 — Triglicérides
  'triglicerides':'0017','triglicerideos':'0017','triglicerideo':'0017',
  // 0018 — TGO/AST
  'tgo':'0018','ast':'0018','aspartato aminotransferase':'0018','transaminase oxalacetica':'0018',
  // 0019 — TGP/ALT
  'tgp':'0019','alt':'0019','alanina aminotransferase':'0019','transaminase piruvica':'0019',
  // 0020 — Gama GT
  'gama gt':'0020','gama-gt':'0020','ggt':'0020','gamma gt':'0020','gamaglutamiltransferase':'0020',
  // 0021 — Sódio
  'sodio':'0021','sodio serico':'0021','sodio plasmatico':'0021',
  // 0022 — Potássio
  'potassio':'0022','potassio serico':'0022','kalemia':'0022',
  // 0023 — Cálcio
  'calcio':'0023','calcio serico':'0023','calcio total':'0023','calcio ionico':'0023','calcemia':'0023',
  // 0024 — Fósforo
  'fosforo':'0024','fosforo serico':'0024','fosfatemia':'0024','fosfatase alcalina':'0024',
  // 0025 — Ferro Sérico / Ferritina
  'ferro serico':'0025','ferritina':'0025','ferro':'0025','transferrina':'0025','saturacao de transferrina':'0025','capacidade de ligacao do ferro':'0025','tibc':'0025',
  // 0026 — TSH
  'tsh':'0026','hormonio estimulante da tireoide':'0026','tireotropina':'0026',
  // 0027 — T4 Livre / T3
  't4 livre':'0027','t4':'0027','t3 livre':'0027','t3':'0027','tiroxina':'0027','triiodotironina':'0027',
  // 0028 — Coproparasitológico
  'parasitologico':'0028','coproparasitologico':'0028','exame de fezes':'0028','protoparasitologico':'0028','fezes':'0028','coprologico':'0028',
  // 0029 — Tipagem Sanguínea
  'tipagem':'0029','tipagem sanguinea':'0029','abo rh':'0029','grupo sanguineo':'0029','fator rh':'0029','tipo sanguineo':'0029',
  // 0030 — Proteína C Reativa
  'proteina c reativa':'0030','pcr':'0030','pcr ultrassensivel':'0030',
  // 0031 — VDRL / Sífilis
  'vdrl':'0031','sifilis':'0031','rpr':'0031','fta-abs':'0031','ftaabs':'0031','tpha':'0031','sorogia para sifilis':'0031',
  // 0032 — Anti-HCV (Hepatite C)
  'antihcv':'0032','anti-hcv':'0032','hepatite c':'0032','anti hcv':'0032','hcv':'0032',
  // 0033 — Anti-HIV
  'anti-hiv':'0033','antihiv':'0033','hiv':'0033','anti hiv':'0033','aids':'0033',
  // 0040 — Audiometria Tonal
  'audiometria':'0040','audiometria tonal':'0040','audiometria tonal limiar':'0040','atl':'0040',
  // 0041 — Audiometria de Voz / Logoaudiometria
  'audiometria de voz':'0041','logoaudiometria':'0041','audiometria vocal':'0041','indice de reconhecimento de fala':'0041','irf':'0041',
  // 0042 — Emissão Otoacústica
  'emissao otoacustica':'0042','eoa':'0042','otoemissao acustica':'0042','emissoes otoacusticas':'0042',
  // 0050 — Acuidade Visual
  'acuidade visual':'0050','snellen':'0050','visao':'0050','teste de visao':'0050','refratometria':'0050','optometria':'0050','avaliacao visual':'0050',
  // 0051 — Campimetria / Perimetria Visual
  'campimetria':'0051','perimetria':'0051','campo visual':'0051','campimetria computadorizada':'0051',
  // 0060 — Espirometria
  'espirometria':'0060','prova de funcao pulmonar':'0060','pfp':'0060','espirografia':'0060','capacidade pulmonar':'0060','cvf':'0060','vef1':'0060',
  // 0061 — RX Tórax PA (Padrão OIT)
  'rx torax':'0061','rx de torax':'0061','rx torax pa oit':'0061','radiografia torax':'0061','radiografia de torax':'0061','raio x torax':'0061','rx pa':'0061',
  // 0062 — RX Tórax (Outras Incidências)
  'rx torax perfil':'0062','rx torax lateral':'0062','radiografia torax perfil':'0062','rx torax ap':'0062',
  // 0070 — Eletroencefalograma
  'eletroencefalograma':'0070','eeg':'0070',
  // 0071 — Avaliação Neurológica
  'avaliacao neurologica':'0071','exame neurologico':'0071','neurologia':'0071','reflexos neurologicos':'0071',
  // 0073 — Teste de Romberg
  'teste de romberg':'0073','romberg':'0073','rombergismo':'0073','equilíbrio':'0073',
  // 0080 — Eletrocardiograma
  'eletrocardiograma':'0080','ecg':'0080','eletro':'0080','eletro em repouso':'0080',
  // 0081 — Ecocardiograma
  'ecocardiograma':'0081','eco cardiaco':'0081','ecografia cardiaca':'0081','eco doppler':'0081',
  // 0090 — RX Coluna Cervical
  'rx coluna cervical':'0090','coluna cervical':'0090','rx cervical':'0090','radiografia coluna cervical':'0090',
  // 0091 — RX Coluna Lombar / Lombossacra
  'rx coluna':'0091','coluna lombar':'0091','rx lombar':'0091','coluna lombossacra':'0091','rx lombossacro':'0091','radiografia coluna lombar':'0091',
  // 0092 — RX Coluna Dorsal / Torácica
  'rx coluna dorsal':'0092','coluna dorsal':'0092','rx dorsal':'0092','coluna toracica':'0092','rx toracica':'0092',
  // 0100 — Avaliação Dermatológica
  'avaliacao dermatologica':'0100','dermatologica':'0100','dermatologia':'0100','exame dermatologico':'0100',
  // 0101 — Patch Test / Teste de Contato
  'patch test':'0101','teste de contato':'0101','teste epicutaneo':'0101','fotopatch test':'0101','epicutaneo':'0101',
  // 0110 — Hepatite B (HBsAg + Anti-HBs)
  'hepatite b':'0110','hbsag':'0110','anti-hbs':'0110','antihbs':'0110','hbs ag':'0110','anti hbs':'0110','marcadores hepatite b':'0110','anti-hbc':'0110','antihbc':'0110',
  // 0120 — Exame Toxicológico Ampliado
  'toxicologico':'0120','exame toxicologico':'0120','toxicologico ampliado':'0120','exame toxicologico ampliado':'0120',
  // 0121 — Exame Toxicológico Específico
  'toxicologico especifico':'0121','exame toxicologico especifico':'0121',
}

// ─── TABELA 24 — Agentes Nocivos ──────────────────────
const TABELA24 = {
  'ruido':'01.01.001','ruído':'01.01.001','ruido continuo':'01.01.001','ruido intermitente':'01.01.001','pressao sonora':'01.01.001','nps':'01.01.001',
  'ruido de impacto':'01.01.002','impacto':'01.01.002',
  'calor':'01.02.001','calor excessivo':'01.02.001','ibutg':'01.02.001','temperatura elevada':'01.02.001','estresse termico':'01.02.001',
  'radiacao ionizante':'01.03.001','raio x':'01.03.001','radioatividade':'01.03.001','radiologico':'01.03.001',
  'vibracao corpo':'01.04.001','vibracao de corpo inteiro':'01.04.001',
  'vibracao mao':'01.04.002','vibracao braco':'01.04.002','vibracao maos':'01.04.002',
  'frio':'01.05.001','temperatura fria':'01.05.001','camara fria':'01.05.001','frigorifico':'01.05.001',
  'pressao hiperbarica':'01.06.001','mergulho':'01.06.001',
  'umidade':'01.07.001','umidade excessiva':'01.07.001',
  'arsenio':'02.01.001','arsenico':'02.01.001',
  'amianto':'02.02.001','asbesto':'02.02.001','asbestos':'02.02.001',
  'benzeno':'02.03.001','benzol':'02.03.001','tolueno':'02.03.001','xileno':'02.03.001',
  'chumbo':'02.04.001','plumbemia':'02.04.001',
  'carvao':'02.05.001','carvao mineral':'02.05.001',
  'cromo':'02.06.001','cromio':'02.06.001',
  'fosforo':'02.07.001','organofosforado':'02.07.001',
  'hidrocarboneto':'02.08.001','gasolina':'02.08.001','diesel':'02.08.001','solvente':'02.08.001',
  'manganes':'02.09.001','manganês':'02.09.001',
  'mercurio':'02.10.001','mercúrio':'02.10.001',
  'silica':'02.11.001','silicose':'02.11.001','sio2':'02.11.001','quartzo':'02.11.001',
  'poeira respiravel silica':'02.11.001','poeira total silica':'02.11.001','poeira de cal':'02.11.001',
  'poeira respiravel':'02.11.001','poeira total':'02.11.001',
  'agrotoxico':'02.14.001','pesticida':'02.14.001','herbicida':'02.14.001',
  'gases':'02.18.001','vapores':'02.18.001','gas toxico':'02.18.001','vapores alcalinos':'02.18.001',
  'explosivo':'02.21.001','explosao':'02.21.001',
  'biologico':'03.01.001','virus':'03.01.001','bacteria':'03.01.001','fungo':'03.01.001',
  'esgoto':'03.01.002','lixo':'03.01.002','residuo infectante':'03.01.002',
  'queda':'09.01.001','queda de nivel':'09.01.001','queda de altura':'09.01.001',
  'esforco fisico':'09.01.001','postura':'09.01.001','postura inadequada':'09.01.001',
  'ergonomico':'09.01.001','ergonomia':'09.01.001','esforco repetitivo':'09.01.001',
  'arranjo fisico':'09.01.001','prensamento':'09.01.001',
  'insuficiencia de oxigenio':'09.01.001','oxigenio':'09.01.001',
}

function norm(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
}

function codigoExame(nome) {
  const n = norm(nome)
  for (const [k,v] of Object.entries(TABELA27)) { if (n.includes(k)) return v }
  return '0200'
}

function codigoAgente(nome) {
  const n = norm(nome)
  for (const [k,v] of Object.entries(TABELA24)) { if (n.includes(k)) return v }
  return '09.01.001'
}

// ── Logger de IA (fire-and-forget, nunca quebra o fluxo) ─────────────
function logIA(servico, modelo, status, duracao_ms, tipo, erro) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  fetch(`${base}/api/internal/log-ia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
    body: JSON.stringify({ servico, modelo, status, duracao_ms: Math.round(duracao_ms || 0), tipo, erro: erro?.substring(0, 200) }),
  }).catch(() => {})
}

// ── Prompts ──────────────────────────────────────────────
const PROMPT_LTCAT = `Você é especialista em LTCAT brasileiro. Analise o documento COMPLETO e retorne SOMENTE JSON válido, sem texto antes ou depois.

ESTRUTURA TÍPICA DO DOCUMENTO:
- "Data de criação" ou "Data de Emissão" → data_emissao
- "RESPONSABILIDADE TÉCNICA" → resp_nome, resp_conselho (CREA ou CRM), resp_registro (número)
- Tabelas "CÓD. GHE/GF" + "NOMENCLATURA GHE/GF" → cada linha é um GHE separado
- Coluna "FUNÇÃO" dentro de cada GHE → extraia CADA função/cargo individualmente
- Tabela de RISCO com "Código eSocial" → agentes do GHE
- Se o GHE indicar ausência de risco com qualquer expressão ("Inexiste", "Ausência de agente nocivo", "Não há agentes", "Sem exposição", "Não significativo", "Abaixo do LT", "ISENTO", "NÃO HÁ RISCO") → agentes = [] e aposentadoria_especial = false
- Tabela EPI / EPC no final de cada GHE → extraia equipamentos (ignora "--")

REGRAS CRÍTICAS:
1. Datas: converter DD/MM/AAAA para AAAA-MM-DD. Ex: "08/02/2022" → "2022-02-08"
2. "funcoes": CADA cargo separado no array. Se GHE tem 5 funções, o array deve ter 5 itens
3. "agentes": array vazio [] se o documento diz "Inexiste", "Ausência", "Não há", "Sem exposição", "Não significativo", "ISENTO" ou qualquer indicação de ausência de risco
4. "aposentadoria_especial": true APENAS se o laudo confirma direito a aposentadoria especial
5. "epi": array vazio [] se todos os EPIs são "--". Mesmo para epc
6. "resp_conselho": "CREA" se engenheiro, "CRM" se médico do trabalho

{
  "dados_gerais": {
    "data_emissao": "2022-02-08",
    "data_vigencia": null,
    "prox_revisao": null,
    "resp_nome": "Nome Completo do Responsável",
    "resp_conselho": "CREA",
    "resp_registro": "1512311472"
  },
  "ghes": [
    {
      "nome": "GHE 01 - ADMINISTRAÇÃO",
      "setor": "Administrativo",
      "qtd_trabalhadores": 5,
      "aposentadoria_especial": false,
      "funcoes": ["Auxiliar de vendas", "Gerente de Vendas", "Estoquista"],
      "agentes": [],
      "epc": [{"nome": "Extintor pó químico ABC", "eficaz": true}],
      "epi": []
    }
  ],
  "confianca": {"data_emissao": 95, "resp_nome": 95, "ghes": 90}
}`

const PROMPT_PCMSO = `Você é especialista em PCMSO brasileiro (NR-7). Analise o documento e retorne SOMENTE JSON válido, sem texto antes ou depois.

REGRA ABSOLUTA — ANTI-ALUCINAÇÃO:
Extraia APENAS o que está EXPLICITAMENTE ESCRITO no documento.
NÃO invente exames. NÃO use conhecimento geral sobre PCMSO para preencher campos.
Se uma coluna estiver em branco ou ilegível, retorne array vazio [].
Se não conseguir ler um GHE claramente, NÃO o inclua.
É MELHOR retornar menos dados corretos do que dados inventados.

ESTRUTURA DO DOCUMENTO — PCMSO tem GHEs. Cada GHE tem:
- Cabeçalho: nome do setor/grupo (ex: "Administrativo | Recepção", "Enfermagem")
- Campo "Funções": lista de cargos separados por vírgula
- Campos "Perigos de acidentes/ergonômicos/físicos/biológicos/químicos": riscos (ignore "N/A")
- Tabela com colunas: ADMISSIONAL | PERIÓDICO | RETORNO AO TRABALHO | MUDANÇA DE RISCO OCUPACIONAL | DEMISSIONAL

COMO EXTRAIR:
1. CADA GHE = 1 item em "programas"
2. "ghe": nome exato do cabeçalho do grupo
3. "funcoes": cargos listados no campo "Funções" do GHE
4. "riscos": apenas os que NÃO forem "N/A" ou vazios
5. "exames": copie LITERALMENTE os nomes dos exames de cada coluna. Se a coluna estiver vazia → []
6. Se programas = [] porque não conseguiu ler, retorne mesmo assim com array vazio

{
  "dados_gerais": {
    "medico_nome": "Dr. Nome do médico coordenador",
    "medico_crm": "CRM/SP 12345",
    "data_elaboracao": "2026-01-15",
    "vigencia": "2026-2027"
  },
  "programas": [
    {
      "ghe": "Administrativo | Recepção",
      "funcoes": ["Auxiliar Administrativo", "Recepcionista"],
      "riscos": {
        "acidentes": ["Quedas do mesmo nível", "Batida contra móveis do escritório"],
        "ergonomicos": ["Postura inadequada", "Movimentos repetitivos"],
        "fisicos": [],
        "biologicos": [],
        "quimicos": []
      },
      "exames": {
        "admissional": [{"nome": "Exame clínico"}, {"nome": "Acuidade visual"}],
        "periodico":   [{"nome": "Exame clínico"}, {"nome": "Acuidade visual"}],
        "retorno_trabalho": [{"nome": "Exame clínico"}],
        "mudanca_risco":    [{"nome": "Exame clínico"}],
        "demissional":      [{"nome": "Exame clínico"}]
      }
    },
    {
      "ghe": "Enfermagem",
      "funcoes": ["Auxiliar de Enfermagem", "Técnico de Enfermagem", "Enfermeiro"],
      "riscos": {
        "acidentes": ["Quedas do mesmo nível", "Perfurocortantes"],
        "ergonomicos": ["Postura inadequada", "Movimentos repetitivos"],
        "fisicos": [],
        "biologicos": ["Vírus", "Bactérias", "Fungos", "Parasitas", "Exposição a fluidos biológicos", "Materiais perfurocortantes contaminados"],
        "quimicos": ["Medicamentos e drogas", "Produtos de limpeza e desinfecção"]
      },
      "exames": {
        "admissional": [{"nome": "Exame clínico"}, {"nome": "Hemograma completo"}, {"nome": "Anti-HBS"}, {"nome": "HbsAG"}, {"nome": "VDRL"}, {"nome": "AntiHCV"}],
        "periodico":   [{"nome": "Exame clínico"}, {"nome": "Hemograma completo"}, {"nome": "Anti-HBS"}, {"nome": "HbsAG"}, {"nome": "VDRL"}, {"nome": "AntiHCV"}],
        "retorno_trabalho": [{"nome": "Exame clínico"}],
        "mudanca_risco":    [{"nome": "Exame clínico"}],
        "demissional":      [{"nome": "Exame clínico"}]
      }
    }
  ],
  "confianca": {"medico": 90, "programas": 85}
}`

const PROMPT_AUTO = `Você é especialista em documentos SST brasileiros. Analise COMPLETAMENTE este PDF e:

PASSO 1 — Identifique o tipo:
- "ltcat" → contém "LTCAT", "Laudo Técnico das Condições Ambientais", GHEs, agentes de risco, responsável técnico CREA/CRM
- "pcmso" → contém "PCMSO", "Programa de Controle Médico", exames ocupacionais por função, médico coordenador
- "aso" → contém "ASO", "Atestado de Saúde Ocupacional", dados de UM funcionário específico, conclusão apto/inapto

PASSO 2 — Extraia os dados completos conforme o tipo:

LTCAT → {"tipo":"ltcat","dados_gerais":{"data_emissao":"AAAA-MM-DD","data_vigencia":null,"prox_revisao":null,"resp_nome":"Nome do engenheiro/médico","resp_conselho":"CREA","resp_registro":"número do CREA/CRM"},"ghes":[{"nome":"GHE 01 - NOME","setor":"nome do setor","qtd_trabalhadores":1,"aposentadoria_especial":false,"funcoes":["Cargo 1","Cargo 2","Cargo 3"],"agentes":[{"tipo":"fis","nome":"Ruído contínuo","valor":null,"limite":null,"supera_lt":false}],"epc":[{"nome":"Extintor","eficaz":true}],"epi":[]}],"confianca":{"data_emissao":95,"resp_nome":95,"ghes":90}}

PCMSO → {"tipo":"pcmso","dados_gerais":{"medico_nome":null,"medico_crm":null,"data_elaboracao":null,"vigencia":null},"programas":[{"ghe":"Nome do GHE / Setor","funcoes":["Cargo 1","Cargo 2"],"riscos":{"acidentes":["risco"],"ergonomicos":["risco"],"fisicos":[],"biologicos":[],"quimicos":[]},"exames":{"admissional":[{"nome":"Exame clínico"}],"periodico":[{"nome":"Exame clínico"}],"retorno_trabalho":[{"nome":"Exame clínico"}],"mudanca_risco":[{"nome":"Exame clínico"}],"demissional":[{"nome":"Exame clínico"}]}}],"confianca":{"medico":90,"programas":85}}
PCMSO — REGRAS ESPECÍFICAS:
- CADA GHE/setor = 1 item em "programas". "funcoes" lista todos os cargos do GHE
- "exames" é um objeto com chaves: admissional, periodico, retorno_trabalho, mudanca_risco, demissional
- Copie LITERALMENTE os nomes dos exames de cada coluna. Coluna vazia → []
- NÃO invente exames. NÃO use conhecimento geral. Apenas o que está escrito no documento

ASO → {"tipo":"aso","funcionario":{"nome":null,"cpf":null,"data_nasc":null,"data_adm":null,"matricula":null,"funcao":null,"setor":null},"aso":{"tipo_aso":"periodico","data_exame":null,"prox_exame":null,"conclusao":"apto","medico_nome":null,"medico_crm":null},"exames":[{"nome":"exame","resultado":"Normal"}],"riscos":["risco"],"confianca":{"nome":85,"cpf":85,"tipo_aso":80,"data_exame":90,"conclusao":85}}

REGRAS GERAIS:
- Datas: converter DD/MM/AAAA → AAAA-MM-DD
- Agentes: se o documento indica ausência com qualquer termo ("Inexiste", "Ausência", "Não há", "Sem exposição", "Não significativo", "ISENTO", "Abaixo do LT") → agentes = []
- EPI "--" → epi = []
- Retorne SOMENTE o JSON, sem texto antes ou depois`

// Enriquece resultado com códigos das tabelas (escopo de módulo para uso em lerComClaude e handler)
const TIPOS_EXAME = ['admissional','periodico','retorno_trabalho','mudanca_risco','demissional']

function enriquecerExame(ex) {
  return { ...ex, codigo_t27: codigoExame(ex.nome || ex) }
}

function enriquecer(dados, tipo) {
  if (!dados) return dados
  if (tipo === 'pcmso') {
    // Nova estrutura: programas com exames agrupados por tipo
    if (dados.programas?.length) {
      dados.programas = dados.programas.map(prog => {
        const examesEnriq = {}
        for (const t of TIPOS_EXAME) {
          if (Array.isArray(prog.exames?.[t])) {
            examesEnriq[t] = prog.exames[t].map(enriquecerExame)
          }
        }
        return { ...prog, exames: examesEnriq }
      })
    }
  } else if (tipo === 'aso') {
    if (dados.exames?.length) {
      dados.exames = dados.exames.map(enriquecerExame)
    }
    if (dados.riscos?.length) {
      dados.riscos_codificados = dados.riscos.map(r => ({
        nome: r, codigo_t24: codigoAgente(r),
        tipo: codigoAgente(r).startsWith('01') ? 'fis'
            : codigoAgente(r).startsWith('02') ? 'qui'
            : codigoAgente(r).startsWith('03') ? 'bio'
            : codigoAgente(r).startsWith('09') ? 'aus' : 'out',
      }))
    }
  } else if (tipo === 'ltcat') {
    if (dados.ghes?.length) {
      dados.ghes = dados.ghes.map(ghe => ({
        ...ghe,
        agentes: (ghe.agentes||[]).map(ag => ({ ...ag, codigo_t24: codigoAgente(ag.nome) }))
      }))
    }
  }
  return dados
}

// ── Leitor Claude com PDF nativo (primário para LTCAT/PCMSO) ─
async function lerComClaude(pdf_base64, texto_pdf, paginas, tipo, anthropicKey) {
  const prompt = tipo === 'pcmso' ? PROMPT_PCMSO : tipo === 'auto' ? PROMPT_AUTO : PROMPT_LTCAT

  function extrairJSON(str) {
    const ini = str.indexOf('{'); if (ini===-1) return null
    let d=0
    for (let i=ini;i<str.length;i++) { if(str[i]==='{')d++; if(str[i]==='}'){d--;if(d===0)return str.substring(ini,i+1)} }
    return null
  }

  function parseRobusto(texto) {
    const limpo = texto.replace(/\`\`\`json\n?/g,'').replace(/\`\`\`\n?/g,'').trim()
    for (const fn of [
      ()=>JSON.parse(limpo),
      ()=>JSON.parse(extrairJSON(limpo)),
      ()=>JSON.parse(extrairJSON(texto)),
    ]) { try { const r=fn(); if(r) return r } catch {} }
    return null
  }

  try {
    let content = []

    if (pdf_base64) {
      // ── Modo preferencial: PDF nativo (Anthropic document support) ──
      content = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: pdf_base64 }
        },
        { type: 'text', text: prompt }
      ]
    } else if (paginas?.length > 0) {
      // Fallback: imagens JPEG
      paginas.forEach(b64 => {
        content.push({ type:'image', source:{ type:'base64', media_type:'image/jpeg', data:b64 } })
      })
      content.push({ type:'text', text: prompt })
    } else {
      // Fallback: texto extraído
      content = [{ type:'text', text: `${prompt}\n\nTEXTO DO DOCUMENTO:\n${texto_pdf.substring(0,60000)}` }]
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        messages: [{ role: 'user', content }]
      })
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('[ler-documento] Anthropic ERRO STATUS:', response.status, '| BODY:', errBody.substring(0, 400))
      throw new Error(`Anthropic ${response.status}: ${errBody.substring(0, 100)}`)
    }
    const data = await response.json()
    const texto = data.content?.[0]?.text || ''
    const resultado = parseRobusto(texto)
    if (resultado) {
      const modo = pdf_base64 ? 'pdf-nativo' : paginas?.length > 0 ? 'imagem' : 'texto'
      if (tipo === 'auto') {
        // Garante que tipo existe — se Claude esqueceu, inferir pela estrutura
        // Usa Array.isArray para diferenciar array vazio [] (LTCAT sem agentes) de undefined
        const tipoDetectado = resultado.tipo ||
          (Array.isArray(resultado.ghes) ? 'ltcat' : Array.isArray(resultado.programas) ? 'pcmso' : resultado.aso ? 'aso' : null)
        if (!tipoDetectado) throw new Error('Tipo de documento não identificado pelo Claude')
        const { tipo: _, ...dadosSemTipo } = resultado
        return { tipo_detectado: tipoDetectado, dados: enriquecer(dadosSemTipo, tipoDetectado), modo, modelo: 'claude-sonnet' }
      }
      return { dados: enriquecer(resultado, tipo), modo, modelo: 'claude-sonnet' }
    }
    throw new Error('JSON inválido na resposta do Claude')
  } catch (err) {
    console.error('[ler-doc] Claude falhou:', err.message.substring(0,100))
    return null
  }
}

// ────────────────────────────────────────────────────────
export const config = { api: { bodyParser: { sizeLimit: '20mb' } }, maxDuration: 120 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  // Rate limit por IP (proteção contra bots)
  const ip = getClientIP(req)
  const { limited: limitedIp, retryAfter: retryIp } = checkRateLimit(ip, { windowMs: 60_000, max: 10 })
  if (limitedIp) {
    res.setHeader('Retry-After', String(retryIp))
    return res.status(429).json({ erro: 'Muitas requisições. Tente novamente em breve.' })
  }

  // Verificar autenticação — impede consumo de créditos de IA por não autenticados
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

  // Rate limit por usuário — 20 leituras/hora (protege quotas de IA)
  if (userId) {
    const { limited: limitedUser, retryAfter: retryUser } = checkRateLimit(`user:${userId}`, { windowMs: 3_600_000, max: 20 })
    if (limitedUser) {
      res.setHeader('Retry-After', String(retryUser))
      return res.status(429).json({ erro: 'Limite de leituras por hora atingido (20/hora). Tente novamente mais tarde.' })
    }
  }

  // Verifica plano — impede consumo de créditos de IA por empresas canceladas
  if (userId) {
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
  }

  const { paginas, texto_pdf, pdf_base64, tipo } = req.body
  const geminiKey    = process.env.GEMINI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!geminiKey && !anthropicKey) return res.status(500).json({ erro: 'Nenhuma API key configurada' })

  // Roteamento:
  // pdf_base64 → PDF pequeno (≤3MB): Claude nativo direto → Gemini fallback
  // texto_pdf  → PDF com texto: Gemini primário → Claude fallback
  // paginas    → PDF escaneado: Gemini primário (OCR imagens) → Claude fallback

  const pdfBase64Efetivo = pdf_base64 || null

  // PDF pequeno base64 ou texto: Claude nativo primeiro (LTCAT/PCMSO/auto)
  if ((tipo === 'auto' || tipo === 'ltcat' || tipo === 'pcmso') && anthropicKey && !paginas?.length) {
    const _t0claude = Date.now()
    const claudeResult = await lerComClaude(pdfBase64Efetivo, texto_pdf, null, tipo, anthropicKey)
    if (claudeResult) {
      logIA('claude', 'claude-sonnet', 'ok', Date.now() - _t0claude, tipo)
      return res.status(200).json({ sucesso: true, ...claudeResult })
    }
    logIA('claude', 'claude-sonnet', 'fallback', Date.now() - _t0claude, tipo)
    console.error(`[ler-doc] Claude falhou para ${tipo.toUpperCase()}, tentando Gemini`)
  }

  const prompt_aso = `Você é um extrator de dados de ASO brasileiro. Analise o documento e retorne SOMENTE o JSON abaixo preenchido. Não escreva nada antes ou depois do JSON. Campos não encontrados devem ser null.

REGRAS IMPORTANTES:
- Em "exames": liste CADA exame separadamente com seu resultado individual
- Em "riscos": liste CADA agente de risco INDIVIDUALMENTE — não agrupe vários numa só string. Exemplos corretos: ["Ruído contínuo ou intermitente","Poeira respirável sílica","Queda de nível diferente","Vapores alcalinos"]. Exemplos ERRADOS: ["Ruído, poeira, queda"] ou ["FÍSICO"] ou ["QUÍMICO"] ou ["ERGONÔMICO"]
- Ignore rótulos de categoria como "Físico", "Químico", "Ergonômico", "Biológico" — extraia somente os nomes dos agentes específicos
- Se o documento listar riscos separados por vírgula ou em tabela, extraia cada um como item separado da lista

{
  "funcionario":{"nome":null,"cpf":null,"data_nasc":null,"data_adm":null,"matricula":null,"funcao":null,"setor":null},
  "aso":{"tipo_aso":"periodico","data_exame":null,"prox_exame":null,"conclusao":"apto","medico_nome":null,"medico_crm":null},
  "exames":[{"nome":"nome do exame","resultado":"Normal ou Alterado ou Pendente"}],
  "riscos":["risco individual 1","risco individual 2","risco individual 3"],
  "confianca":{"nome":85,"cpf":85,"tipo_aso":80,"data_exame":90,"conclusao":85}
}`

  const prompt_ltcat = `Você é um extrator especializado em LTCAT (Laudo Técnico das Condições Ambientais do Trabalho) brasileiro.
Analise o documento completo e retorne SOMENTE o JSON abaixo. Nenhum texto antes ou depois. Campos não encontrados: null.

REGRAS CRÍTICAS:
1. "funcoes" de cada GHE: extraia CADA cargo/função do campo "FUNÇÕES DO GRUPO", "CARGOS DO GRUPO", "CARGOS", "FUNÇÕES" ou tabela similar. São listas separadas por vírgula, ponto-e-vírgula ou quebra de linha. Extraia CADA UM como item separado do array — podem ser dezenas de itens. NUNCA agrupe ou resuma. Se a lista tiver 40 cargos, o array deve ter 40 itens. Exemplo: "Apontador, Analista de controle, Eng. mecânico" → ["Apontador","Analista de controle","Eng. mecânico"].
2. "nome" do GHE: use o identificador como "GHE 01", "GHE 02", "GRUPO 01", "GRUPO: 02" etc.
   TABELAS: se o documento tiver tabelas HTML ou estrutura de grid, extraia o conteúdo de todas as células relevantes.
3. "setor": campo "SETOR" ou "ÁREA" do GHE quando disponível.
4. "agentes": CADA agente de risco separado. tipo: fis=físico, qui=químico, bio=biológico, erg=ergonômico.
   Se o GHE indicar ausência de risco com qualquer expressão ("Inexiste", "Ausência", "Não há agentes", "Sem exposição", "Não significativo", "Abaixo do LT", "ISENTO", "NÃO HÁ RISCO") → agentes = [] e aposentadoria_especial = false.
5. "aposentadoria_especial": true SOMENTE se o laudo confirmar direito a aposentadoria especial. false quando não há agentes nocivos.
6. "epi" e "epc": liste cada equipamento individualmente com CA quando disponível.

{
  "dados_gerais":{"data_emissao":null,"data_vigencia":null,"prox_revisao":null,"resp_nome":null,"resp_conselho":"CREA","resp_registro":null},
  "ghes":[{
    "nome":"GHE 01",
    "setor":null,
    "qtd_trabalhadores":1,
    "aposentadoria_especial":false,
    "funcoes":["Cargo 1","Cargo 2","Função 3"],
    "agentes":[{"tipo":"fis","nome":"Ruído contínuo","valor":null,"limite":null,"supera_lt":false}],
    "epc":[{"nome":"nome do EPC","eficaz":true}],
    "epi":[{"nome":"nome do EPI","ca":"12345","eficaz":true}]
  }],
  "confianca":{"data_emissao":90,"resp_nome":90,"ghes":85}
}`

  const usandoTexto = texto_pdf && texto_pdf.replace(/\s/g,'').length > 100
  // eImagens: PDF escaneado em modo auto (sem base64 pequeno, sem texto)
  const eImagens = tipo === 'auto' && paginas?.length > 0 && !pdfBase64Efetivo && !usandoTexto
  // Para imagens auto: PROMPT_PCMSO focado (PCMSO é o tipo escaneado mais comum)
  // LTCAT e ASO raramente chegam escaneados; se chegarem, o usuário verá erro claro
  const promptBase = tipo === 'ltcat' ? prompt_ltcat
    : tipo === 'pcmso' ? PROMPT_PCMSO
    : eImagens ? PROMPT_PCMSO
    : tipo === 'auto' ? PROMPT_AUTO
    : prompt_aso

  function extrairJSON(str) {
    const ini = str.indexOf('{'); if (ini===-1) return null
    let d=0
    for (let i=ini;i<str.length;i++) { if(str[i]==='{')d++; if(str[i]==='}'){d--;if(d===0)return str.substring(ini,i+1)} }
    return null
  }

  function parseRobusto(texto) {
    const limpo = texto.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
    for (const fn of [
      ()=>JSON.parse(limpo),
      ()=>JSON.parse(extrairJSON(limpo)),
      ()=>JSON.parse(extrairJSON(texto)),
    ]) { try { const r=fn(); if(r) return r } catch {} }
    return null
  }

  // ── GEMINI ─────────────────────────────────────────
  if (geminiKey) {
    const modelos = usandoTexto
      ? ['gemini-2.5-flash-lite','gemini-2.5-flash']
      : ['gemini-2.5-flash','gemini-2.5-flash-lite']

    let parts = []
    if (pdfBase64Efetivo && (tipo === 'auto' || tipo === 'pcmso' || tipo === 'ltcat')) {
      // Gemini também suporta PDF inline (base64 direto ou baixado do storage)
      parts = [
        { inlineData: { mimeType: 'application/pdf', data: pdfBase64Efetivo } },
        { text: promptBase }
      ]
    } else if (usandoTexto) {
      // Pré-processar: extrair seções de FUNÇÕES DO GRUPO do texto bruto
      let textoProcessado = texto_pdf
      if (tipo === 'ltcat' || tipo === 'auto') {
        textoProcessado = texto_pdf
          .replace(/FUNÇÕES DO GRUPO:/gi, '\n\n===FUNÇÕES DO GRUPO===\n')
          .replace(/CARGOS DO GRUPO:/gi, '\n\n===FUNÇÕES DO GRUPO===\n')
          .replace(/FUNÇÃO DO GRUPO:/gi, '\n\n===FUNÇÕES DO GRUPO===\n')
          .replace(/NOMENCLATURA GHE\/GF/gi, '\n\n===GHE===\n')
          .replace(/DESCRIÇÃO DAS ATIVIDADES/gi, '\n\n===ATIVIDADES===\n')
        // Converter lista de funções separadas por vírgula em itens individuais
        textoProcessado = textoProcessado.replace(
          /(===FUNÇÕES DO GRUPO===\n)([\s\S]*?)(?=\n\n===|\n===|$)/g,
          (match, header, funcoes) => {
            const linha = funcoes.trim()
            if (!linha) return match
            // Se já tem bullet/quebra de linha por item, mantém como está
            if (linha.includes('\n•') || linha.includes('\n-')) return match
            // Separa por vírgula ou ponto-e-vírgula
            const itens = linha.split(/[,;]/).map(s => s.trim()).filter(Boolean)
            if (itens.length <= 1) return match
            return header + itens.map(i => `• ${i}`).join('\n') + '\n'
          }
        )
      }
      parts = [{ text: `${promptBase}\n\nTEXTO DO DOCUMENTO:\n${textoProcessado.substring(0,60000)}` }]
    } else if (paginas?.length > 0) {
      parts = [
        ...paginas.map(b64 => ({ inlineData: { mimeType:'image/jpeg', data:b64 } })),
        { text: promptBase }
      ]
    }

    for (const modelo of modelos) {
      const _t0gem = Date.now()
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
          {
            method:'POST',
            headers:{ 'Content-Type':'application/json', 'x-goog-api-key': geminiKey },
            body: JSON.stringify({ contents:[{parts}], generationConfig:{temperature:0,maxOutputTokens:8192} })
          }
        )
        if (!response.ok) {
          const err = await response.json()
          if ([429,503].includes(err?.error?.code)) {
            logIA('gemini', modelo, 'fallback', Date.now() - _t0gem, tipo, `quota/503`)
            continue
          }
          throw new Error(JSON.stringify(err))
        }
        const data = await response.json()
        const texto = (data.candidates?.[0]?.content?.parts||[]).filter(p=>p.text).map(p=>p.text).join('')
        const resultado = parseRobusto(texto)
        if (resultado) {
          logIA('gemini', modelo, 'ok', Date.now() - _t0gem, tipo)
          const modo = usandoTexto ? 'texto' : 'imagem'
          if (tipo === 'auto' || eImagens) {
            // Para imagens com PROMPT_PCMSO, tipo_detectado é sempre 'pcmso'
            const tipoDetectado = eImagens ? 'pcmso'
              : resultado.tipo || (Array.isArray(resultado.ghes) ? 'ltcat' : Array.isArray(resultado.programas) ? 'pcmso' : resultado.aso ? 'aso' : null)
            if (!tipoDetectado) continue
            // PCMSO com 0 programas em modo TEXTO: tenta próximo modelo
            if (tipoDetectado === 'pcmso' && (resultado.programas?.length ?? 0) === 0 && usandoTexto) {
              console.error('[ler-doc] Gemini PCMSO 0 programas modo texto, tentando próximo modelo')
              continue
            }
            const { tipo: _, ...dadosSemTipo } = resultado
            return res.status(200).json({ sucesso:true, tipo_detectado: tipoDetectado, dados: enriquecer(dadosSemTipo, tipoDetectado), modo, modelo })
          }
          // PCMSO explícito com 0 programas em modo texto: tenta próximo modelo
          if (tipo === 'pcmso' && (resultado.programas?.length ?? 0) === 0 && usandoTexto) {
            console.error('[ler-doc] Gemini PCMSO 0 programas modo texto, tentando próximo modelo')
            continue
          }
          return res.status(200).json({ sucesso:true, dados: enriquecer(resultado, tipo), modo, modelo })
        }
      } catch (err) {
        logIA('gemini', modelo, 'erro', Date.now() - _t0gem, tipo, err.message)
        console.error(`[ler-doc] Erro ${modelo}:`, err.message); continue
      }
    }
  }

  // ── ANTHROPIC FALLBACK ─────────────────────────────
  if (anthropicKey) {
    const _t0haiku = Date.now()
    try {
      let content = []
      if (paginas?.length > 0) paginas.forEach(b64 => {
        content.push({ type:'image', source:{ type:'base64', media_type:'image/jpeg', data:b64 } })
      })
      content.push({ type:'text', text: usandoTexto
        ? `${promptBase}\n\nTEXTO DO DOCUMENTO:\n${texto_pdf?.substring(0,40000)}`
        : promptBase
      })
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key': anthropicKey, 'anthropic-version':'2023-06-01' },
        body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:4000, messages:[{role:'user',content}] })
      })
      if (!response.ok) {
        const errBody = await response.text()
        console.error('[ler-documento] Anthropic haiku error:', response.status, errBody.substring(0, 200))
        throw new Error('Falha na API de processamento')
      }
      const data = await response.json()
      const resultado = parseRobusto(data.content?.[0]?.text || '')
      if (resultado) {
        logIA('claude', 'claude-haiku-fallback', 'ok', Date.now() - _t0haiku, tipo)
        if (tipo === 'auto') {
          const tipoDetectado = resultado.tipo ||
            (resultado.ghes ? 'ltcat' : resultado.programas ? 'pcmso' : resultado.aso ? 'aso' : null)
          if (tipoDetectado) {
            const { tipo: _, ...dadosSemTipo } = resultado
            return res.status(200).json({ sucesso:true, tipo_detectado: tipoDetectado, dados: enriquecer(dadosSemTipo, tipoDetectado), modo: usandoTexto?'texto':'imagem', modelo:'claude-fallback' })
          }
        }
        return res.status(200).json({ sucesso:true, dados: enriquecer(resultado, tipo), modo: usandoTexto?'texto':'imagem', modelo:'claude-fallback' })
      }
    } catch (err) {
      logIA('claude', 'claude-haiku-fallback', 'erro', Date.now() - _t0haiku, tipo, err.message)
      console.error('[ler-doc] Haiku fallback erro:', err.message.substring(0, 150))
    }
  }

  const msgFinal = tipo === 'auto'
    ? 'Não foi possível identificar o documento. Certifique-se que é um PDF de ASO, LTCAT ou PCMSO e que a ANTHROPIC_API_KEY está configurada.'
    : 'Todas as APIs falharam. Tente novamente em alguns minutos.'
  return res.status(500).json({ erro: msgFinal })
}
