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

  const { tipo, dados, empresa, ambiente = 'producao', funcionario } = req.body
  if (!tipo || !dados || !empresa) return res.status(400).json({ erro: 'Dados incompletos' })

  // tpAmb: 1=Produção
  const tpAmb = '1'

  try {
    // Validações antes de gerar XML
    if ((tipo === 'S-2220' || tipo === 'S-2210' || tipo === 'S-2240') && funcionario) {
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
function data(br) {
  if (!br) return ''
  if (br.includes('-')) return br.substring(0, 10)
  const [d, m, y] = br.split('/')
  return `${y}-${(m||'').padStart(2,'0')}-${(d||'').padStart(2,'0')}`
}
function id(cnpjEmp) {
  const ts = Date.now().toString()
  const rnd = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `ID${cnpjEmp}${ts}${rnd}`
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

// Mapa de conclusão → código eSocial
const CONCLUSAO = { apto: '1', apto_restricao: '2', inapto: '3' }

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
function gerarS2220(aso, empresa, tpAmb, funcionario = {}) {
  const cnpjEmp = cnpj(empresa.cnpj)
  const idEvt = id(cnpjEmp)
  // Suporte a estrutura flat (row do DB) e aninhada (legado)
  const func = aso.funcionario || funcionario || {}
  const dadosAso = aso.aso || aso
  const exames = aso.exames || dadosAso.exames || []

  const examesXML = exames.map((ex) => `
        <exame>
          <dtExm>${data(dadosAso.data_exame)}</dtExm>
          <procRealizado>
            <codProc>${codigoExame(ex.nome)}</codProc>
            <obsProc>${escapeXml(ex.nome)}</obsProc>
          </procRealizado>
          ${ex.resultado ? `<indResult>${ex.resultado === 'Normal' ? '1' : ex.resultado === 'Alterado' ? '2' : ex.resultado === 'Pendente' ? '3' : '1'}</indResult>` : '<indResult>1</indResult>'}
        </exame>`).join('')

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
    <aso>
      <dtAso>${data(dadosAso.data_exame)}</dtAso>
      <tpAso>${TIPO_ASO[normalizarTipoAso(dadosAso.tipo_aso)] || '1'}</tpAso>
      ${examesXML}
      <medico>
        <nmMed>${escapeXml(dadosAso.medico_nome)}</nmMed>
        <nrCRM>${(dadosAso.medico_crm || '').replace(/\D/g, '')}</nrCRM>
        <ufCRM>${extrairUfCrm(dadosAso.medico_crm)}</ufCRM>
      </medico>
      <concl>${CONCLUSAO[dadosAso.conclusao] || '1'}</concl>
      ${dadosAso.prox_exame ? `<obsAtiv>Próximo exame previsto: ${data(dadosAso.prox_exame)}</obsAtiv>` : ''}
    </aso>
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
      const fnsGhe = (ghe.funcoes || []).map(f => f.toLowerCase().trim())
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

// ─── S-2240: CONDIÇÕES AMBIENTAIS ────────────────────
// Evento por vínculo (um S-2240 por funcionário) — o XML reporta só o(s)
// GHE(s) daquele funcionário, nunca o inventário inteiro da empresa.
function gerarS2240(ltcat, empresa, tpAmb, funcionario = {}) {
  const cnpjEmp = cnpj(empresa.cnpj)
  const idEvt = id(cnpjEmp)
  // Suporte a estrutura flat (row do DB) e aninhada (legado)
  const geral = ltcat.dados_gerais || ltcat
  const todosGhes = ltcat.ghes || []
  const gheFunc = resolverGheFuncionario(todosGhes, funcionario)
  const ghes = gheFunc ? [gheFunc] : []

  const TIPO_AGENTE = { fis: '01', qui: '02', bio: '03', erg: '04' }

  // iniValid: usa data_vigencia ou data_emissao como fallback, nunca string vazia
  const iniValidRaw = geral.data_vigencia || geral.data_emissao || new Date().toISOString().substring(0,10)
  const iniValid = data(iniValidRaw).substring(0, 7) || new Date().toISOString().substring(0,7)

  const ghesXML = ghes.map(ghe => {
    const agentesXML = (ghe.agentes || []).map(ag => `
        <agNoc>
          <tpAgt>${TIPO_AGENTE[ag.tipo] || '01'}</tpAgt>
          <dsAgt>${escapeXml(ag.nome)}</dsAgt>
          ${ag.valor ? `<nrInsc>${escapeXml(ag.valor)}</nrInsc>` : ''}
          <ltcat>
            <nrDocTec>${escapeXml(geral.resp_registro)}</nrDocTec>
            <ideOC>${escapeXml(geral.resp_conselho) || 'CREA'}</ideOC>
            <dscAtvDes>${escapeXml(ag.nome)} — ${escapeXml(ag.valor) || 'não medido'}</dscAtvDes>
          </ltcat>
          <epcEpi>
            <utilizEpc>${(ghe.epc||[]).length > 0 ? 'S' : 'N'}</utilizEpc>
            <eficEpc>${(ghe.epc||[]).some(e => e.eficaz) ? 'S' : 'N'}</eficEpc>
            <utilizEpi>${(ghe.epi||[]).length > 0 ? 'S' : 'N'}</utilizEpi>
            <eficEpi>${(ghe.epi||[]).some(e => e.eficaz) ? 'S' : 'N'}</eficEpi>
            ${(ghe.epi||[]).map(e => `
            <epi>
              <caEPI>${(e.ca||'').replace(/\D/g,'')}</caEPI>
              <dscEPI>${escapeXml(e.nome)}</dscEPI>
            </epi>`).join('')}
          </epcEpi>
        </agNoc>`).join('')

    return `
      <infoAtiv>
        <dscAtivDes>${escapeXml(ghe.nome)}</dscAtivDes>
        ${agentesXML}
      </infoAtiv>`
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
      <iniValid>${iniValid}</iniValid>
      ${ghesXML}
      <respReg>
        <ideResponsavel>
          <nmRespReg>${escapeXml(geral.resp_nome)}</nmRespReg>
          <ideOC>${escapeXml(geral.resp_conselho) || 'CREA'}</ideOC>
          <nrOC>${escapeXml(geral.resp_registro)}</nrOC>
        </ideResponsavel>
      </respReg>
    </infoExpRisco>
  </evtExpRisco>
</eSocial>`
}

// ─── S-2210: CAT ─────────────────────────────────────
function gerarS2210(cat, empresa, tpAmb, funcionario = {}) {
  const cnpjEmp = cnpj(empresa.cnpj)
  const idEvt = id(cnpjEmp)
  // Suporte a estrutura flat (row do DB) e aninhada (legado)
  const func = cat.funcionario || funcionario || {}
  const TIPO_CAT = { tipico: '1', doenca: '2', trajeto: '3' }
  const atend = cat.atendimento || {}
  // diagProvavel deve ser texto descritivo, não o código CID
  const descDiag = cat.descricao || cat.natureza_lesao || cat.cid || ''
  // dtObito deve ser a data real do óbito (se informada) ou a data do acidente
  const dtObito = cat.dt_obito ? data(cat.dt_obito) : data(cat.dt_acidente)

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
      ${cat.hora_acidente ? `<hrAcid>${cat.hora_acidente}</hrAcid>` : ''}
      <tpAcid>${TIPO_CAT[cat.tipo_cat] || '1'}</tpAcid>
      <dscLesao>${escapeXml(cat.natureza_lesao)}</dscLesao>
      <dscCompLesao>${escapeXml(cat.descricao)}</dscCompLesao>
      <diagProvavel>${escapeXml(descDiag)}</diagProvavel>
      <codCID>${escapeXml(cat.cid)}</codCID>
      ${cat.houve_morte ? `<infoObito><dtObito>${dtObito}</dtObito></infoObito>` : ''}
      <atendimento>
        <dtAtendimento>${data(atend.data) || data(cat.dt_acidente)}</dtAtendimento>
        ${atend.hora ? `<hrAtendimento>${atend.hora}</hrAtendimento>` : ''}
        <nmMedico>${escapeXml(atend.medico)}</nmMedico>
        <nrCRM>${(atend.crm || '').replace(/\D/g,'')}</nrCRM>
        <ufCRM>${extrairUfCrm(atend.crm)}</ufCRM>
      </atendimento>
    </cat>
  </evtCAT>
</eSocial>`
}
