// pages/api/xml-generator.js
// Gera XML eSocial S-2220, S-2240 e S-2210 com códigos da Tabela 27

import { checkRateLimit, getClientIP } from '../../lib/rate-limit'
import { requireAuth } from '../../lib/auth-middleware'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const user = await requireAuth(req, res)
  if (!user) return

  const ip = getClientIP(req)
  const { limited, retryAfter } = await checkRateLimit(ip, { windowMs: 60_000, max: 20 })
  if (limited) return res.status(429).json({ erro: 'Muitas requisições. Tente novamente em breve.', retryAfter })

  const { tipo, dados, empresa, ambiente = 'producao_restrita', funcionario } = req.body
  if (!tipo || !dados || !empresa) return res.status(400).json({ erro: 'Dados incompletos' })

  // tpAmb: 1=Produção, 2=Produção Restrita (testes)
  const tpAmb = ambiente === 'producao' ? '1' : '2'

  try {
    // Validações antes de gerar XML
    if ((tipo === 'S-2220' || tipo === 'S-2210' || tipo === 'S-2240' || tipo === 'S-2221') && funcionario) {
      const mat = (funcionario.matricula_esocial || '').trim()
      if (!mat || mat.startsWith('PEND-')) {
        return res.status(400).json({ erro: `Funcionário sem matrícula eSocial definida. Acesse Funcionários e preencha a matrícula antes de transmitir.` })
      }
      const cpfLimpo = (funcionario.cpf || '').replace(/\D/g, '')
      if (cpfLimpo.length !== 11) {
        return res.status(400).json({ erro: `CPF do funcionário inválido ou ausente. Verifique o cadastro.` })
      }
    }
    if (tipo === 'S-2240' && empresa) {
      const cnpjLimpo = (empresa.cnpj || '').replace(/\D/g, '')
      if (cnpjLimpo.length !== 14) {
        return res.status(400).json({ erro: `CNPJ da empresa inválido: ${empresa.cnpj}` })
      }
    }
    if (tipo === 'S-2240') {
      const ghe = resolverGheFuncionario(dados?.ghes || [], funcionario || {})
      if (!ghe) {
        return res.status(400).json({ erro: 'Não foi possível determinar o GHE deste funcionário. Acesse S-2240 e clique em "Vincular GHE" antes de transmitir.' })
      }
      const semCodigo = (ghe.agentes || []).filter(ag => !AGNOC_PATTERN.test(((ag.codigo_t24 || ag.codigo_esocial || '').trim())))
      if (semCodigo.length) {
        return res.status(400).json({
          erro: `O(s) risco(s) "${semCodigo.map(a => a.nome).join(', ')}" não têm o código oficial da Tabela 24 do eSocial preenchido (formato NN.NN.NNN). Acesse /ghes, edite o(s) risco(s) e preencha o campo "Código eSocial" antes de transmitir o S-2240.`,
        })
      }
      // Agente com medição quantitativa exige unidade reconhecida e metodologia —
      // o eSocial rejeita o evento sem esses campos quando tpAval = quantitativo.
      const quantitativosIncompletos = (ghe.agentes || []).filter(ag => {
        if ((ag.codigo_t24 || ag.codigo_esocial || '').trim() === AGNOC_AUSENCIA_RISCO) return false
        if (!ag.medicao_quantitativa) return false
        return !codigoUnMed(ag.unidade) || !(ag.metodologia || '').trim()
      })
      if (quantitativosIncompletos.length) {
        return res.status(400).json({
          erro: `O(s) risco(s) "${quantitativosIncompletos.map(a => a.nome).join(', ')}" têm medição quantitativa mas faltam "unidade" (num formato reconhecido, ex: dB(A), ppm, mg/m³) e/ou "metodologia" no cadastro. Acesse /ghes e complete antes de transmitir o S-2240.`,
        })
      }
    }
    if (tipo === 'S-2221') {
      if (!dados.dt_exame) return res.status(400).json({ erro: 'Data do exame ausente.' })
      if ((dados.cnpj_lab || '').replace(/\D/g, '').length !== 14) {
        return res.status(400).json({ erro: 'CNPJ do laboratório inválido ou ausente. Edite o exame em S-2221 e informe o CNPJ.' })
      }
      if (!/^[a-zA-Z]{2}\d{9}$/.test((dados.cod_seq_exame || '').trim())) {
        return res.status(400).json({ erro: 'Código do exame (SNCTE) inválido ou ausente. Deve ter 2 letras + 9 números.' })
      }
      if (!(dados.responsavel_nome || '').trim()) {
        return res.status(400).json({ erro: 'Nome do médico responsável ausente. Edite o exame em S-2221.' })
      }
    }

    // S-2210 exige os campos do XSD oficial (evtCAT) — bloqueia antes de gerar XML inválido
    if (tipo === 'S-2210') {
      const faltando = []
      if (!/^\d{9}$/.test((dados.cod_sit_geradora || '').replace(/\D/g, ''))) faltando.push('situação geradora (Tabela 15)')
      if (!/^\d{9}$/.test((dados.cod_parte_atingida || '').replace(/\D/g, ''))) faltando.push('parte do corpo atingida (Tabela 13)')
      if (!/^\d{9}$/.test((dados.cod_agente_causador || '').replace(/\D/g, ''))) faltando.push('agente causador (Tabela 14)')
      if (!/^\d{9}$/.test((dados.cod_lesao || '').replace(/\D/g, ''))) faltando.push('natureza da lesão (Tabela 17)')
      if (!(dados.local_acidente?.dscLograd || '').trim()) faltando.push('logradouro do local do acidente')
      if (!(dados.local_acidente?.nrLograd || '').trim()) faltando.push('número do logradouro do local do acidente (use S/N se não houver)')
      if (!(dados.atendimento?.hora || dados.hora_acidente || '').trim()) faltando.push('hora do atendimento médico')
      if (!(dados.atendimento?.medico || '').trim()) faltando.push('nome do médico/dentista emitente')
      if (!digitos(dados.atendimento?.crm)) faltando.push('número de inscrição no conselho de classe (CRM/CRO/RMS)')
      if (dados.tipo_cat !== 'doenca' && !(dados.hora_acidente || '').trim()) faltando.push('hora do acidente')
      if (dados.tipo_cat !== 'doenca' && !(dados.hrs_trab_antes_acid || '').trim()) faltando.push('horas trabalhadas antes do acidente')
      if (!dados.ult_dia_trab) faltando.push('último dia trabalhado')
      if (dados.houve_morte && !dados.dt_obito) faltando.push('data do óbito')
      if ((dados.natureza_cat === 'reabertura' || dados.natureza_cat === 'obito') && !/^1\.\d\.\d{19}$/.test((dados.nr_rec_cat_origem || '').trim())) faltando.push('número do recibo da CAT anterior (formato 1.N.19 dígitos, ex: 1.2.1234567890123456789)')
      if (faltando.length) {
        return res.status(400).json({ erro: `Faltam campos obrigatórios do eSocial na CAT: ${faltando.join(', ')}. Edite o registro em /s2210 antes de transmitir.` })
      }
    }

    // S-2220 exige ao menos 1 exame — bloqueia antes de gerar XML inválido
    if (tipo === 'S-2220') {
      const exames = dados.exames || dados.aso?.exames || []
      if (!exames.length) {
        return res.status(400).json({
          erro: 'O ASO não possui exames cadastrados. Adicione ao menos 1 exame (ex: Exame Clínico) na tela de S-2220 antes de transmitir.',
        })
      }
    }

    let xml = ''
    if (tipo === 'S-2220') xml = gerarS2220(dados, empresa, tpAmb, funcionario)
    else if (tipo === 'S-2240') xml = gerarS2240(dados, empresa, tpAmb, funcionario)
    else if (tipo === 'S-2210') xml = gerarS2210(dados, empresa, tpAmb, funcionario)
    else if (tipo === 'S-2221') xml = gerarS2221(dados, empresa, tpAmb, funcionario)
    else return res.status(400).json({ erro: 'Tipo inválido' })

    return res.status(200).json({ sucesso: true, xml })
  } catch (err) {
    console.error('[xml-generator]', err)
    return res.status(500).json({ erro: 'Erro ao gerar XML. Verifique os dados e tente novamente.' })
  }
}

// ─── HELPERS ─────────────────────────────────────────
function escapeXml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
function cnpj(v) { return (v || '').replace(/\D/g, '') }
function cpf(v)  { return (v || '').replace(/\D/g, '') }
function digitos(v) { return (v || '').replace(/\D/g, '') }
function hhmm(v) { return (v || '').replace(/:/g, '') }
function simNao(v) { return v ? 'S' : 'N' }
function data(br) {
  if (!br) return ''
  if (br.includes('-')) return br.substring(0, 10)
  const [d, m, y] = br.split('/')
  return `${y}-${(m||'').padStart(2,'0')}-${(d||'').padStart(2,'0')}`
}
// Padrão oficial TS_Id (Manual de Orientação do Desenvolvedor, Anexo II):
// "ID" + tpInsc(1) + nrInsc(14, CNPJ com zeros à direita se raiz de 8) +
// AAAAMMDD(8) + HHMMSS(6) + sequencial(5) = 36 caracteres.
function id(cnpjEmp, tpInsc = '1') {
  const now = new Date()
  const aaaammdd = now.toISOString().slice(0, 10).replace(/-/g, '')
  const hhmmss = now.toTimeString().slice(0, 8).replace(/:/g, '')
  const seq = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  const nrInsc = (cnpjEmp || '').padEnd(14, '0').slice(0, 14)
  return `ID${tpInsc}${nrInsc}${aaaammdd}${hhmmss}${seq}`
}

// Código do agente nocivo (Tabela 24 do eSocial): NN.NN.NNN
const AGNOC_PATTERN = /^\d{2}\.\d{2}\.\d{3}$/
const AGNOC_AUSENCIA_RISCO = '09.01.001'

// Tabela oficial de unidade de medida do S-2240 (unMed, 1-30) — conferida
// contra o XSD oficial evtExpRisco. Mapeamento best-effort a partir do texto
// livre gravado em ghes.riscos[].unidade; só mapeia quando há certeza da
// correspondência — se não achar, retorna null e o handler bloqueia a
// transmissão em vez de adivinhar um código errado.
const UNMED_TABELA = [
  [/^db ?\(?linear\)?$/, '2'], [/^db ?\(?c\)?$/, '3'], [/^db ?\(?a\)?$/, '4'],
  [/^m\/s ?[²2]$/, '5'], [/^m\/s ?1[,.]75$/, '6'],
  [/^ppm$/, '7'], [/^mg\/m ?[³3]$/, '8'], [/^f(ibras?)?\/cm ?[³3]$/, '9'],
  [/^°?c$|^ibutg ?°?c$/, '10'], [/^m\/s$/, '11'], [/^%$/, '12'], [/^lu?x$/, '13'],
]
function codigoUnMed(unidade) {
  const norm = (unidade || '').toLowerCase().trim().replace(/\s+/g, ' ')
  for (const [re, cod] of UNMED_TABELA) if (re.test(norm)) return cod
  return null
}

// ideOC do respReg: 1=CRM, 4=CREA, 9=Outros (conferido contra o XSD oficial —
// não existe código genérico "conselho de classe").
function ideOcPorConselho(conselho) {
  const c = (conselho || '').toUpperCase().trim()
  if (c === 'CRM') return '1'
  if (c === 'CREA') return '4'
  return '9'
}

// Extrai UF do CRM com segurança — suporta "CRM-SP 12345", "12345-SP", "12345/SP"
function extrairUfCrm(crm) {
  const s = (crm || '').toUpperCase()
  const ufMatch = s.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/)
  return ufMatch ? ufMatch[1] : 'SP'
}

// Normaliza tipo ASO para chave canônica (espelha importar.jsx)
function normalizarTipoAso(valor) {
  if (!valor) return 'periodico'
  const v = valor.toString().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '')
  if (v.includes('admiss'))  return 'admissional'
  if (v.includes('demiss'))  return 'demissional'
  if (v.includes('retorn'))  return 'retorno'
  if (v.includes('mudan') || v.includes('funcao') || v.includes('cargo')) return 'mudanca'
  if (v.includes('monitor')) return 'monitoracao'
  if (v.includes('period') || v.includes('anual') || v.includes('bienal')) return 'periodico'
  return 'periodico'
}

// Mapa de tipo ASO → código eSocial
const TIPO_ASO = {
  admissional: '0', periodico: '1', retorno: '2',
  mudanca: '3', monitoracao: '4', demissional: '9'
}

// Mapa de conclusão → código eSocial (resAso só tem 2 valores oficiais —
// "apto com restrição" não existe como código próprio, mapeado para Apto).
const CONCLUSAO = { apto: '1', apto_restricao: '1', inapto: '2' }

// indResult só tem 4 valores oficiais — sem "Pendente". Se o resultado não
// bater com nenhum, omite o campo (opcional) em vez de adivinhar um errado.
const INDRESULT = { normal: '1', alterado: '2', estavel: '3', agravamento: '4' }
function codigoIndResult(resultado) {
  const norm = (resultado || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
  return INDRESULT[norm] || null
}

// Mapa de exame → código Tabela 27 (principais)
const TABELA27 = {
  'avaliacao clinica': '0001', 'exame clinico': '0001',
  'avaliacao psicossocial': '0002', 'psicossocial': '0002',
  'hemograma': '0010', 'hemograma completo': '0010',
  'glicemia': '0011', 'glicemia de jejum': '0011', 'glicemia/ glicose': '0011', 'glicemia/glicose': '0011',
  'urina': '0012', 'eas': '0012',
  'tipagem sanguinea': '0029', 'tipagem': '0029',
  'audiometria': '0040', 'audiometria tonal': '0040',
  'acuidade visual': '0050', 'visao': '0050',
  'espirometria': '0060',
  'rx torax': '0061', 'rx de torax': '0061', 'rx tórax pa oit': '0061', 'rx torax pa oit': '0061',
  'eletroencefalograma': '0070', 'eeg': '0070',
  'teste de romberg': '0073', 'romberg': '0073',
  'eletrocardiograma': '0080', 'ecg': '0080',
  'rx coluna': '0091', 'coluna': '0091',
}

function codigoExame(nomeExame) {
  const lower = (nomeExame || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
  for (const [chave, codigo] of Object.entries(TABELA27)) {
    if (lower.includes(chave)) return codigo
  }
  return '0200' // Outros
}

// ─── S-2220: MONITORAMENTO DA SAÚDE ──────────────────
// Estrutura conferida contra o XSD oficial evtMonit v_S_01_03_00: o ASO fica
// dentro de um grupo <exMedOcup> (tpExameOcup + aso), que a versão anterior
// deste gerador omitia por completo — <aso> era filho direto de evtMonit, o
// que o schema rejeita. procRealizado é o próprio código (não um wrapper com
// codProc/obsProc), e a conclusão é <resAso> com só 2 valores possíveis.
function gerarS2220(aso, empresa, tpAmb, funcionario = {}) {
  const cnpjEmp = cnpj(empresa.cnpj)
  const idEvt = id(cnpjEmp)
  // Suporte a estrutura flat (row do DB) e aninhada (legado)
  const func = aso.funcionario || funcionario || {}
  const dadosAso = aso.aso || aso
  const exames = aso.exames || dadosAso.exames || []

  const examesXML = exames.map((ex) => {
    const indResult = codigoIndResult(ex.resultado)
    return `
        <exame>
          <dtExm>${data(dadosAso.data_exame)}</dtExm>
          <procRealizado>${codigoExame(ex.nome)}</procRealizado>
          <obsProc>${escapeXml(ex.nome)}</obsProc>
          ${indResult ? `<indResult>${indResult}</indResult>` : ''}
        </exame>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtMonit/v_S_01_03_00"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <evtMonit Id="${idEvt}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>${tpAmb}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>1.0.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpjEmp}</nrInsc>
    </ideEmpregador>
    <ideVinculo>
      <cpfTrab>${cpf(func.cpf)}</cpfTrab>
      <matricula>${func.matricula_esocial || ''}</matricula>
    </ideVinculo>
    <exMedOcup>
      <tpExameOcup>${TIPO_ASO[normalizarTipoAso(dadosAso.tipo_aso)] || '1'}</tpExameOcup>
      <aso>
        <dtAso>${data(dadosAso.data_exame)}</dtAso>
        <resAso>${CONCLUSAO[dadosAso.conclusao] || '1'}</resAso>
        ${examesXML}
        <medico>
          <nmMed>${escapeXml(dadosAso.medico_nome)}</nmMed>
          <nrCRM>${(dadosAso.medico_crm || '').replace(/\D/g, '')}</nrCRM>
          <ufCRM>${extrairUfCrm(dadosAso.medico_crm)}</ufCRM>
        </medico>
      </aso>
    </exMedOcup>
  </evtMonit>
</eSocial>`
}

// Resolve o GHE do funcionário dentro do array de GHEs do LTCAT — mesma
// ordem de prioridade usada em pages/s2240.tsx (gheDoFuncionario), pra não
// divergir do que o usuário viu na tela ao criar a transmissão.
function resolverGheFuncionario(ghes, func) {
  if (!ghes || !ghes.length) return null

  if (func.ghe_uuid) {
    const porUuid = ghes.find(g => g.id === func.ghe_uuid)
    if (porUuid) return porUuid
  }

  if (func.ghe_id !== undefined && func.ghe_id !== null) {
    const porIndice = ghes[func.ghe_id]
    if (porIndice) return porIndice
  }

  if (func.funcao) {
    const fnLow = func.funcao.toLowerCase().trim()
    for (const ghe of ghes) {
      const fnsGhe = (ghe.funcoes || []).map(f => (f.nome || f || '').toLowerCase().trim())
      if (fnsGhe.some(f =>
        f.includes(fnLow) || fnLow.includes(f) ||
        fnLow.split(' ').filter(w => w.length > 3).some(w => f.includes(w))
      )) return ghe
    }
  }

  if (func.setor) {
    const sf = func.setor.toLowerCase()
    for (const ghe of ghes) {
      const sg = (ghe.setor || '').toLowerCase()
      if (sg && sf && (sg.includes(sf) || sf.includes(sg))) return ghe
    }
  }

  if (ghes.length === 1) return ghes[0]

  return null
}

// Descrição de atividade (dscAtivDes) — usa o texto cadastrado para a função
// específica do trabalhador dentro do GHE (mesma fonte central do PGR/PCMSO),
// caindo para a lista de nomes de função e, por fim, para o nome do GHE.
function descricaoAtividadeFuncionario(ghe, funcionario) {
  const funcoes = ghe.funcoes || []
  const fnLow = (funcionario.funcao || '').toLowerCase().trim()
  let match = null
  if (fnLow) {
    match = funcoes.find(f => (f.nome || f || '').toLowerCase().trim() === fnLow)
      || funcoes.find(f => {
        const n = (f.nome || f || '').toLowerCase().trim()
        return n && (n.includes(fnLow) || fnLow.includes(n))
      })
  }
  if (match?.atividades) return match.atividades
  const nomes = funcoes.map(f => f.nome || f || '').filter(Boolean)
  return nomes.join(', ') || ghe.nome || 'Atividades não detalhadas'
}

// ─── S-2240: CONDIÇÕES AMBIENTAIS ────────────────────
// Evento por vínculo (um S-2240 por funcionário) — o XML reporta só o GHE
// daquele funcionário, nunca o inventário inteiro da empresa.
// Estrutura conferida contra o XSD oficial evtExpRisco v_S_01_03_00
// (nfephp-org/sped-esocial): infoAmb, infoAtiv, agNoc e respReg são grupos
// irmãos dentro de infoExpRisco (não aninhados uns nos outros); epcEpi fica
// dentro de cada agNoc.
//
// Premissas assumidas por falta de campo dedicado no cadastro (documentar
// se algum dia o cadastro ganhar esses campos, para parar de assumir):
// - localAmb sempre "1" (instalações do próprio empregador).
// - infoAmb/tpInsc sempre "1" (CNPJ do empregador) — não há hoje conceito de
//   estabelecimento/obra separado no cadastro de GHE.
// - utilizEPC/utilizEPI: "2" (implementa) se há EPC/EPI cadastrado pro GHE,
//   "0" (não se aplica) se não há nenhum — nunca "1" (não implementa), pois
//   não há como o sistema inferir uma não-conformidade que o usuário não
//   registrou.
// - limTol só é preenchido para os 2 códigos da Tabela 24 que o XSD permite
//   (01.18.001, 02.01.014) — para os demais o campo é omitido mesmo que
//   ag.limite exista, porque o eSocial rejeita o campo fora desses códigos.
function gerarS2240(ltcat, empresa, tpAmb, funcionario = {}) {
  const cnpjEmp = cnpj(empresa.cnpj)
  const idEvt = id(cnpjEmp)
  // Suporte a estrutura flat (row do DB) e aninhada (legado)
  const geral = ltcat.dados_gerais || ltcat
  const todosGhes = ltcat.ghes || []
  const ghe = resolverGheFuncionario(todosGhes, funcionario) || {}
  const agentes = ghe.agentes || []

  const dtIniRaw = geral.data_vigencia || geral.data_emissao || new Date().toISOString().substring(0, 10)
  const dtIniCondicao = data(dtIniRaw) || new Date().toISOString().substring(0, 10)

  const temEpc = (ghe.epc || []).length > 0
  const temEpi = (ghe.epi || []).length > 0

  // agNoc é obrigatório (mín. 1) — se o GHE não tem nenhum risco cadastrado,
  // reporta o código oficial de ausência de fator de risco (Tabela 24: 09.01.001)
  // em vez de gerar um XML sem nenhum <agNoc>, que seria rejeitado pelo schema.
  const agentesParaXml = agentes.length ? agentes : [{ nome: '', codigo_esocial: AGNOC_AUSENCIA_RISCO, medicao_quantitativa: false }]

  const agNocXML = agentesParaXml.map(ag => {
    const codAgNoc = (ag.codigo_t24 || ag.codigo_esocial || '').trim()
    const ausenciaRisco = codAgNoc === AGNOC_AUSENCIA_RISCO
    const quantitativo = !!ag.medicao_quantitativa
    const valorNum = parseFloat(String(ag.valor || '').replace(',', '.'))
    const limiteNum = parseFloat(String(ag.limite || '').replace(',', '.'))
    const permiteLimTol = codAgNoc === '01.18.001' || codAgNoc === '02.01.014'
    const unMedCod = quantitativo ? codigoUnMed(ag.unidade) : null

    // codAgNoc = 09.01.001 (ausência de risco): dscAgNoc/tpAval/intConc/limTol/
    // unMed/tecMedicao devem ficar de fora, e epcEpi é proibido (CONDICAO_GRUPO
    // "N" no XSD) — daí o early return com só o código.
    if (ausenciaRisco) {
      return `
      <agNoc>
        <codAgNoc>${codAgNoc}</codAgNoc>
      </agNoc>`
    }

    return `
      <agNoc>
        <codAgNoc>${codAgNoc}</codAgNoc>
        <dscAgNoc>${escapeXml((ag.nome || '').slice(0, 100))}</dscAgNoc>
        <tpAval>${quantitativo ? '1' : '2'}</tpAval>
        ${quantitativo && !isNaN(valorNum) ? `<intConc>${valorNum.toFixed(4)}</intConc>` : ''}
        ${quantitativo && permiteLimTol && !isNaN(limiteNum) ? `<limTol>${limiteNum.toFixed(4)}</limTol>` : ''}
        ${quantitativo && unMedCod ? `<unMed>${unMedCod}</unMed>` : ''}
        ${quantitativo && ag.metodologia ? `<tecMedicao>${escapeXml(ag.metodologia.slice(0, 40))}</tecMedicao>` : ''}
        <epcEpi>
          <utilizEPC>${temEpc ? '2' : '0'}</utilizEPC>
          ${temEpc ? `<eficEpc>${(ghe.epc || []).some(e => e.eficaz) ? 'S' : 'N'}</eficEpc>` : ''}
          <utilizEPI>${temEpi ? '2' : '0'}</utilizEPI>
          ${temEpi ? `<eficEpi>${(ghe.epi || []).some(e => e.eficaz) ? 'S' : 'N'}</eficEpi>` : ''}
          ${(ghe.epi || []).map(e => `
          <epi>
            <docAval>${escapeXml((e.nome || 'EPI') + (e.ca ? ` (CA ${(e.ca || '').replace(/\D/g, '')})` : '')).slice(0, 255)}</docAval>
          </epi>`).join('')}
        </epcEpi>
      </agNoc>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtExpRisco/v_S_01_03_00"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <evtExpRisco Id="${idEvt}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>${tpAmb}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>1.0.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpjEmp}</nrInsc>
    </ideEmpregador>
    <ideVinculo>
      <cpfTrab>${cpf(funcionario.cpf)}</cpfTrab>
      <matricula>${funcionario.matricula_esocial || ''}</matricula>
    </ideVinculo>
    <infoExpRisco>
      <dtIniCondicao>${dtIniCondicao}</dtIniCondicao>
      <infoAmb>
        <localAmb>1</localAmb>
        <dscSetor>${escapeXml((ghe.setor || ghe.nome || 'Não informado').slice(0, 100))}</dscSetor>
        <tpInsc>1</tpInsc>
        <nrInsc>${cnpjEmp}</nrInsc>
      </infoAmb>
      <infoAtiv>
        <dscAtivDes>${escapeXml(descricaoAtividadeFuncionario(ghe, funcionario).slice(0, 999))}</dscAtivDes>
      </infoAtiv>
      ${agNocXML}
      <respReg>
        <cpfResp>${cpf(geral.resp_cpf)}</cpfResp>
        <ideOC>${ideOcPorConselho(geral.resp_conselho)}</ideOC>
        ${ideOcPorConselho(geral.resp_conselho) === '9' ? `<dscOC>${escapeXml((geral.resp_conselho || 'Outro').slice(0, 20))}</dscOC>` : ''}
        <nrOC>${escapeXml((geral.resp_registro || '').slice(0, 14))}</nrOC>
        <ufOC>${extrairUfCrm(geral.resp_registro)}</ufOC>
      </respReg>
    </infoExpRisco>
  </evtExpRisco>
</eSocial>`
}

// ─── S-2210: CAT ─────────────────────────────────────
// Estrutura conferida direto contra o XSD oficial evtCAT v_S_01_03_00
// (github.com/nfephp-org/sped-esocial/schemes/v_S_01_03_00/evtCAT.xsd) em
// 17/07/2026 — ordem dos elementos e obrigatoriedade seguem exatamente o
// schema, não o Manual de Orientação (que às vezes descreve de forma solta).
const CAT_NATUREZA = { inicial: '1', reabertura: '2', obito: '3' }
const CAT_TP_ACID = { tipico: '1', doenca: '2', trajeto: '3' }
const CAT_INICIATIVA = { empregador: '1', ordem_judicial: '2', orgao_fiscalizador: '3' }
const CAT_LATERALIDADE = { na: '0', esquerda: '1', direita: '2', ambos: '3' }
const CAT_CONSELHO = { crm: '1', cro: '2', rms: '3' }

function gerarS2210(cat, empresa, tpAmb, funcionario = {}) {
  const cnpjEmp = cnpj(empresa.cnpj)
  const idEvt = id(cnpjEmp)
  const func = cat.funcionario || funcionario || {}
  const atend = cat.atendimento || {}
  const local = cat.local_acidente || {}
  const tpAcid = CAT_TP_ACID[cat.tipo_cat] || '1'
  const tpCat = CAT_NATUREZA[cat.natureza_cat] || '1'
  const obito = !!cat.houve_morte
  const afastado = simNao(!!cat.ind_afastamento)
  // codCID exige 3-4 caracteres alfanuméricos — sem ponto (S60.0 -> S600)
  const cidCod = (cat.cid || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const reaberturaOuObito = cat.natureza_cat === 'reabertura' || cat.natureza_cat === 'obito'

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtCAT/v_S_01_03_00"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <evtCAT Id="${idEvt}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>${tpAmb}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>1.0.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpjEmp}</nrInsc>
    </ideEmpregador>
    <ideVinculo>
      <cpfTrab>${cpf(func.cpf)}</cpfTrab>
      <matricula>${func.matricula_esocial || ''}</matricula>
    </ideVinculo>
    <cat>
      <dtAcid>${data(cat.dt_acidente)}</dtAcid>
      <tpAcid>${tpAcid}</tpAcid>
      ${cat.tipo_cat !== 'doenca' && cat.hora_acidente ? `<hrAcid>${hhmm(cat.hora_acidente)}</hrAcid>` : ''}
      ${cat.tipo_cat !== 'doenca' && cat.hrs_trab_antes_acid ? `<hrsTrabAntesAcid>${hhmm(cat.hrs_trab_antes_acid)}</hrsTrabAntesAcid>` : ''}
      <tpCat>${tpCat}</tpCat>
      <indCatObito>${simNao(obito)}</indCatObito>
      ${obito && cat.dt_obito ? `<dtObito>${data(cat.dt_obito)}</dtObito>` : ''}
      <indComunPolicia>${simNao(!!cat.ind_comun_policia)}</indComunPolicia>
      <codSitGeradora>${digitos(cat.cod_sit_geradora)}</codSitGeradora>
      <iniciatCAT>${CAT_INICIATIVA[cat.iniciat_cat] || '1'}</iniciatCAT>
      ${cat.ult_dia_trab ? `<ultDiaTrab>${data(cat.ult_dia_trab)}</ultDiaTrab>` : ''}
      <houveAfast>${afastado}</houveAfast>
      <localAcidente>
        <tpLocal>${local.tpLocal || '1'}</tpLocal>
        ${local.dscLocal ? `<dscLocal>${escapeXml(local.dscLocal)}</dscLocal>` : ''}
        ${local.tpLograd ? `<tpLograd>${escapeXml(local.tpLograd)}</tpLograd>` : ''}
        <dscLograd>${escapeXml(local.dscLograd)}</dscLograd>
        <nrLograd>${escapeXml(local.nrLograd || 'SN')}</nrLograd>
        ${local.complemento ? `<complemento>${escapeXml(local.complemento)}</complemento>` : ''}
        ${local.bairro ? `<bairro>${escapeXml(local.bairro)}</bairro>` : ''}
        ${local.cep ? `<cep>${digitos(local.cep)}</cep>` : ''}
        ${local.codMunic ? `<codMunic>${digitos(local.codMunic)}</codMunic>` : ''}
        ${local.uf ? `<uf>${escapeXml(local.uf)}</uf>` : ''}
        ${local.pais ? `<pais>${escapeXml(local.pais)}</pais>` : ''}
        ${local.codPostal ? `<codPostal>${escapeXml(local.codPostal)}</codPostal>` : ''}
      </localAcidente>
      <parteAtingida>
        <codParteAting>${digitos(cat.cod_parte_atingida)}</codParteAting>
        <lateralidade>${CAT_LATERALIDADE[cat.lateralidade] || '0'}</lateralidade>
      </parteAtingida>
      <agenteCausador>
        <codAgntCausador>${digitos(cat.cod_agente_causador)}</codAgntCausador>
      </agenteCausador>
      <atestado>
        <dtAtendimento>${data(atend.data) || data(cat.dt_acidente)}</dtAtendimento>
        <hrAtendimento>${hhmm(atend.hora || cat.hora_acidente)}</hrAtendimento>
        <indInternacao>${simNao(!!cat.ind_internacao)}</indInternacao>
        <durTrat>${cat.dias_afastamento || 0}</durTrat>
        <indAfast>${obito ? 'N' : afastado}</indAfast>
        <dscLesao>${digitos(cat.cod_lesao)}</dscLesao>
        ${cat.descricao ? `<dscCompLesao>${escapeXml(cat.descricao)}</dscCompLesao>` : ''}
        <codCID>${cidCod}</codCID>
        <emitente>
          <nmEmit>${escapeXml(atend.medico)}</nmEmit>
          <ideOC>${CAT_CONSELHO[cat.conselho_medico] || '1'}</ideOC>
          <nrOC>${digitos(atend.crm)}</nrOC>
          ${cat.conselho_medico !== 'rms' ? `<ufOC>${extrairUfCrm(atend.crm)}</ufOC>` : ''}
        </emitente>
      </atestado>
      ${reaberturaOuObito && cat.nr_rec_cat_origem ? `<catOrigem>
        <nrRecCatOrig>${escapeXml((cat.nr_rec_cat_origem || '').trim())}</nrRecCatOrig>
      </catOrigem>` : ''}
    </cat>
  </evtCAT>
</eSocial>`
}

// ─── S-2221: EXAME TOXICOLÓGICO DO MOTORISTA ─────────
// Schema evtToxic (v_S_01_03_00) confirmado contra o XSD oficial: só exige
// dtExame, cnpjLab, codSeqExame e o médico (nmMed/nrCRM/ufCRM) — não carrega
// resultado nem substâncias testadas (isso fica só no registro interno).
function gerarS2221(exame, empresa, tpAmb, funcionario = {}) {
  const cnpjEmp = cnpj(empresa.cnpj)
  const idEvt = id(cnpjEmp)
  const crm = (exame.responsavel_crf || '').replace(/\D/g, '')

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtToxic/v_S_01_03_00"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <evtToxic Id="${idEvt}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>${tpAmb}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>1.0.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpjEmp}</nrInsc>
    </ideEmpregador>
    <ideVinculo>
      <cpfTrab>${cpf(funcionario.cpf)}</cpfTrab>
      <matricula>${funcionario.matricula_esocial || ''}</matricula>
    </ideVinculo>
    <toxicologico>
      <dtExame>${data(exame.dt_exame)}</dtExame>
      <cnpjLab>${(exame.cnpj_lab || '').replace(/\D/g, '')}</cnpjLab>
      <codSeqExame>${escapeXml((exame.cod_seq_exame || '').trim().toUpperCase())}</codSeqExame>
      <nmMed>${escapeXml(exame.responsavel_nome)}</nmMed>
      ${crm ? `<nrCRM>${crm}</nrCRM>` : ''}
      ${crm ? `<ufCRM>${extrairUfCrm(exame.responsavel_crf)}</ufCRM>` : ''}
    </toxicologico>
  </evtToxic>
</eSocial>`
}
