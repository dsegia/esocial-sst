import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import UploadLogo from '../components/UploadLogo'
import { gerarPdfPgr } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'
import { SEVERIDADE_OPCOES, PROBABILIDADE_OPCOES, TRAJETORIA_OPCOES, TIPO_EXPOSICAO_OPCOES, PRIORIZACAO_OPCOES, nivelRisco, TEXTOS_LEGAIS_PGR } from '../lib/pgr-conteudo'
import { ESOCIAL_TABELA24 } from '../lib/esocial-tabela24'
import { AGENTES_POR_TIPO } from '../lib/agentes-risco'
import { redimensionarImagem } from '../lib/imagem-util'
import { sugerirParaRisco } from '../lib/pgr-sugestoes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TIPO_AGENTE = { fis:'Físico', qui:'Químico', bio:'Biológico', erg:'Ergonômico', aci:'Mecânico/Acidentes', psi:'Psicossocial' }
const COR_AGENTE  = { fis:'#E6F1FB', qui:'#FAEEDA', bio:'#EAF3DE', erg:'#FCEBEB', aci:'#EDE9FE', psi:'#CFFAFE' }
const TXT_AGENTE  = { fis:'#0C447C', qui:'#633806', bio:'#27500A', erg:'#791F1F', aci:'#5B21B6', psi:'#155E75' }

const STATUS_ACAO = [
  { key:'pendente',    label:'Pendente',    cor:'#791F1F', bg:'#FCEBEB' },
  { key:'andamento',   label:'Em andamento',cor:'#633806', bg:'#FAEEDA' },
  { key:'concluida',   label:'Concluída',   cor:'#27500A', bg:'#EAF3DE' },
]

// ── Inventário de riscos por GHE ─────────────────────────
function riscoVazio() {
  return {
    risco_id: null, risco_sync: null,
    perigo: '', fontes_circunstancias: '', tipo: 'fis', codigo_esocial: '', nome: '',
    possiveis_danos: '', severidade: '', probabilidade: '',
    valor: '', unidade: '', limite: '', equipamento: '', trajetoria: '', tipo_exposicao: '',
    medicao_quantitativa: false, metodologia: '',
  }
}
const funcaoVazia = () => ({
  nome: '',
  cbo: '',
  nivel: 'Pleno',
  atividades: '',
  requisitos: '',
  periodicidade_monitoramento: 'Anual'
})
const epiGheVazio = () => ({ nome: '', atenuacao: '', eficaz: true })
const medidaAdmVazia = (risco = '') => ({ risco, medida: '' })

function gheVazio() {
  return {
    ghe_id: null, ghe_sync: null,
    nome: '', ambientes_relacionados: '', jornada_trabalho: '', numero_empregados: '',
    funcoes: [], riscos: [], epis: [], medidas_administrativas: [], imagens: [],
  }
}

// Campos do risco que vêm do cadastro central (/ghes) e podem ser sincronizados;
// os demais (perigo, severidade, probabilidade, possiveis_danos, equipamento,
// trajetoria, tipo_exposicao) são exclusivos do PGR e nunca são sobrescritos.
const CAMPOS_RISCO_COMPARTILHADOS = ['nome', 'tipo', 'valor', 'unidade', 'limite', 'medicao_quantitativa', 'codigo_esocial', 'metodologia']

function riscoDoCadastro(ag, atualizadoEm) {
  const sugestao = sugerirParaRisco(ag.nome)
  return {
    ...riscoVazio(),
    risco_id: ag.id, risco_sync: { atualizado_em: atualizadoEm },
    tipo: ag.tipo, nome: ag.nome,
    codigo_esocial: ag.codigo_esocial || sugestao?.codigo_esocial || '',
    valor: ag.valor || '', unidade: ag.unidade || '', limite: ag.limite || '',
    medicao_quantitativa: !!ag.medicao_quantitativa, metodologia: ag.metodologia || '',
  }
}

function gheInventarioDoCadastro(ghesCadastro) {
  return (ghesCadastro || []).map(ghe => {
    const riscos = (ghe.riscos || []).map(ag => riscoDoCadastro(ag, ghe.atualizado_em))
    const nomesRiscos = [...new Set(riscos.map(r => r.nome).filter(Boolean))]
    return {
      ghe_id: ghe.id, ghe_sync: { atualizado_em: ghe.atualizado_em },
      nome: ghe.nome || ghe.setor || 'GHE',
      ambientes_relacionados: ghe.nome || ghe.setor || '',
      jornada_trabalho: '', numero_empregados: '',
      funcoes: (ghe.funcoes || []).map(fn => ({ nome: fn, atividades: '' })),
      riscos,
      epis: (ghe.epi || []).map(e => ({ nome: e.nome || '', atenuacao: '', eficaz: e.eficaz !== false })),
      medidas_administrativas: nomesRiscos.map(nome => {
        const sugestao = sugerirParaRisco(nome)
        return { risco: nome, medida: sugestao?.medida_administrativa || '' }
      }),
      imagens: [],
    }
  })
}

function ambientesDoCadastro(ghesCadastro) {
  return (ghesCadastro || []).map(ghe => ({
    nome: ghe.nome || ghe.setor || 'Ambiente',
    descricao: '', tipo: 'proprio', data_inicio: '',
    epcs: (ghe.epc || []).map(e => ({ nome: e.nome || '' })),
    imagens: [],
  }))
}

// Compara o inventário salvo no PGR contra o cadastro central e produz um novo
// inventário + um changelog do que mudaria — nunca aplica sozinho (ver
// prepararSincronizacao/aplicarSincronizacao no componente).
function sincronizarInventarioComCadastro(inventarioAtual, ghesCadastro) {
  const novoInventario = JSON.parse(JSON.stringify(inventarioAtual || []))
  const changelog = { grupos_novos: [], riscos_novos: [], campos_atualizados: [], riscos_removidos_do_cadastro: [] }

  for (const ghe of (ghesCadastro || [])) {
    let grupo = novoInventario.find(g => g.ghe_id === ghe.id)

    if (!grupo) {
      const [novoGrupo] = gheInventarioDoCadastro([ghe])
      novoInventario.push(novoGrupo)
      changelog.grupos_novos.push(ghe.nome)
      continue
    }

    if (grupo.ghe_sync?.atualizado_em === ghe.atualizado_em) continue

    if (grupo.nome !== ghe.nome) changelog.campos_atualizados.push(`${grupo.nome} → nome`)
    grupo.nome = ghe.nome

    const nomesFuncoesAtuais = new Set((grupo.funcoes || []).map(f => f.nome))
    for (const fn of (ghe.funcoes || [])) {
      if (!nomesFuncoesAtuais.has(fn)) grupo.funcoes = [...(grupo.funcoes || []), { nome: fn, atividades: '' }]
    }

    for (const riscoCadastro of (ghe.riscos || [])) {
      const riscoPgr = (grupo.riscos || []).find(r => r.risco_id === riscoCadastro.id)
      if (!riscoPgr) {
        grupo.riscos = [...(grupo.riscos || []), riscoDoCadastro(riscoCadastro, ghe.atualizado_em)]
        changelog.riscos_novos.push(riscoCadastro.nome)
        continue
      }
      for (const campo of CAMPOS_RISCO_COMPARTILHADOS) {
        if (riscoCadastro[campo] !== undefined && riscoPgr[campo] !== riscoCadastro[campo]) {
          changelog.campos_atualizados.push(`${riscoCadastro.nome} → ${campo}`)
          riscoPgr[campo] = riscoCadastro[campo]
        }
      }
      riscoPgr.risco_sync = { atualizado_em: ghe.atualizado_em }
    }

    for (const riscoPgr of (grupo.riscos || [])) {
      if (riscoPgr.risco_id && !(ghe.riscos || []).find(r => r.id === riscoPgr.risco_id)) {
        changelog.riscos_removidos_do_cadastro.push(riscoPgr.nome)
      }
    }

    grupo.ghe_sync = { atualizado_em: ghe.atualizado_em }
  }

  return { novoInventario, changelog }
}

// GHE do inventário do PGR precisa de sincronização se o cadastro central mudou
// desde a última vez que esse grupo foi trazido/sincronizado.
function inventarioDesatualizado(inventario, ghesCadastro) {
  return (inventario || []).some(g => {
    if (!g.ghe_id) return false
    const atual = (ghesCadastro || []).find(gc => gc.id === g.ghe_id)
    return atual && g.ghe_sync?.atualizado_em !== atual.atualizado_em
  })
}

const ambienteVazio = () => ({ nome: '', descricao: '', tipo: 'proprio', data_inicio: '', epcs: [], imagens: [] })

const acaoVazia = (risco = '') => ({
  risco, medida_controle: '', justificativa: '', como: '', onde: 'Ambiente da empresa',
  prazo: '', responsavel: '', priorizacao: 'media', status: 'pendente',
})

export default function PGR() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [empresaCompleta, setEmpresaCompleta] = useState(null)
  const [totalFuncionarios, setTotalFuncionarios] = useState(0)
  const [ltcatAtivo, setLtcatAtivo] = useState(null)
  const [ghesCadastro, setGhesCadastro] = useState([])
  const [syncPendente, setSyncPendente] = useState(null)
  const [pgrs, setPgrs] = useState([])
  const [pgrSel, setPgrSel] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('documento')
  const [form, setForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const [textoAberto, setTextoAberto] = useState(null)
  const [modalTextos, setModalTextos] = useState(false)
  const [salvandoLogo, setSalvandoLogo] = useState(false)

  useEffect(() => { init() }, [])

  async function atualizarLogo(logoUrl) {
    setSalvandoLogo(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/empresa/atualizar-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ logo_url: logoUrl })
      })
      if (!res.ok) throw new Error('Erro ao atualizar logo')
      setEmpresaCompleta({ ...empresaCompleta, logo_url: logoUrl })
      setSucesso('Logo atualizada com sucesso!')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErro(err.message)
      setTimeout(() => setErro(''), 3000)
    } finally {
      setSalvandoLogo(false)
    }
  }

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)
    setEmpresaId(empId)

    const [empRes, funcCountRes, ltcatRes, pgrRes, ghesRes] = await Promise.all([
      supabase.from('empresas').select('*').eq('id', empId).single(),
      supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('empresa_id', empId).eq('ativo', true),
      supabase.from('ltcats').select('*').eq('empresa_id', empId).eq('ativo', true).order('data_emissao', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('pgr').select('*').eq('empresa_id', empId).order('criado_em', { ascending: false }),
      supabase.from('ghes').select('*').eq('empresa_id', empId).eq('ativo', true).order('criado_em'),
    ])
    if (empRes.data) {
      setNomeEmpresa(empRes.data.razao_social)
      setCnpjEmpresa(empRes.data.cnpj)
      setEmpresaCompleta(empRes.data)
    }
    setTotalFuncionarios(funcCountRes.count || 0)
    setLtcatAtivo(ltcatRes.data || null)
    setGhesCadastro(ghesRes.data || [])
    setPgrs(pgrRes.data || [])
    setPgrSel(pgrRes.data?.[0] || null)
    setCarregando(false)
  }

  function abrirNovo() {
    const inventario = gheInventarioDoCadastro(ghesCadastro)
    const ambientes = ambientesDoCadastro(ghesCadastro)
    const nomesRiscos = [...new Set(inventario.flatMap(g => g.riscos.map(r => r.nome)).filter(Boolean))]
    const hoje = new Date().toISOString().split('T')[0]
    const proxyear = new Date()
    proxyear.setFullYear(proxyear.getFullYear() + 1)
    const proximaRevisao = proxyear.toISOString().split('T')[0]

    setForm({
      numero_revisao: 1,
      status: 'Ativo',
      data_elaboracao: hoje,
      prox_revisao: proximaRevisao,
      resp_nome: ltcatAtivo?.resp_nome || '',
      resp_conselho: ltcatAtivo?.resp_conselho || 'CREA',
      resp_registro: ltcatAtivo?.resp_registro || '',
      ambientes,
      inventario,
      plano_acao: nomesRiscos.map(acaoVazia),
      textos_legais_custom: {},
      imagens_anexas: [],
      historico_revisoes: [
        {
          numero: 1,
          data: hoje,
          responsavel: ltcatAtivo?.resp_nome || '',
          alteracoes: 'PGR Inicial'
        }
      ],
    })
    setAba('editar')
    setSucesso(''); setErro('')
  }

  function abrirEdicao(pgr) {
    setForm(JSON.parse(JSON.stringify(pgr)))
    setAba('editar')
    setSucesso(''); setErro('')
  }

  // Traz do cadastro central (/ghes) o que mudou desde a última sincronização
  // deste PGR, sem aplicar ainda — mostra um changelog para confirmação.
  function prepararSincronizacao() {
    const resultado = sincronizarInventarioComCadastro(form.inventario, ghesCadastro)
    setSyncPendente(resultado)
  }
  function aplicarSincronizacao() {
    setForm(p => ({ ...p, inventario: syncPendente.novoInventario }))
    setSyncPendente(null)
    setSucesso('Inventário sincronizado com o cadastro central.')
  }
  function cancelarSincronizacao() {
    setSyncPendente(null)
  }

  function cancelarEdicao() {
    setForm(null)
    setAba('documento')
  }

  async function salvar() {
    if (!form.resp_nome) { setErro('Informe o responsável técnico.'); return }
    if (!form.data_elaboracao) { setErro('Informe a data de elaboração.'); return }
    setSalvando(true); setErro(''); setSucesso('')

    const dados = {
      empresa_id: empresaId,
      numero_revisao: form.numero_revisao || 1,
      status: form.status || 'Ativo',
      data_elaboracao: form.data_elaboracao,
      prox_revisao: form.prox_revisao || null,
      resp_nome: form.resp_nome,
      resp_conselho: form.resp_conselho || 'CREA',
      resp_registro: form.resp_registro || null,
      ambientes: form.ambientes || [],
      inventario: form.inventario || [],
      plano_acao: form.plano_acao || [],
      textos_legais_custom: form.textos_legais_custom || {},
      imagens_anexas: form.imagens_anexas || [],
      historico_revisoes: form.historico_revisoes || [],
      atualizado_em: new Date().toISOString(),
    }

    let error
    if (form.id) {
      ;({ error } = await supabase.from('pgr').update(dados).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('pgr').insert(dados))
    }

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso('PGR salvo com sucesso!')
      setForm(null)
      setAba('documento')
      await init()
    }
    setSalvando(false)
  }

  async function arquivar(id) {
    if (!confirm('Arquivar este PGR?')) return
    await supabase.from('pgr').update({ ativo: false }).eq('id', id)
    init()
  }

  async function excluir(id) {
    if (!confirm('EXCLUIR este PGR permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('pgr').delete().eq('id', id)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setPgrSel(null)
    init()
  }

  // ── Ambientes ──────────────────────────────────────────
  function addAmbiente() {
    setForm(p => ({ ...p, ambientes: [...(p.ambientes || []), ambienteVazio()] }))
  }
  function setAmbiente(i, field, value) {
    setForm(p => {
      const ambientes = [...p.ambientes]
      ambientes[i] = { ...ambientes[i], [field]: value }
      return { ...p, ambientes }
    })
  }
  function removerAmbiente(i) {
    setForm(p => ({ ...p, ambientes: p.ambientes.filter((_, idx) => idx !== i) }))
  }
  function addEpcAmbiente(ai) {
    setForm(p => {
      const ambientes = JSON.parse(JSON.stringify(p.ambientes))
      ambientes[ai].epcs = [...(ambientes[ai].epcs || []), { nome: '' }]
      return { ...p, ambientes }
    })
  }
  function setEpcAmbiente(ai, ei, value) {
    setForm(p => {
      const ambientes = JSON.parse(JSON.stringify(p.ambientes))
      ambientes[ai].epcs[ei] = { nome: value }
      return { ...p, ambientes }
    })
  }
  function removerEpcAmbiente(ai, ei) {
    setForm(p => {
      const ambientes = JSON.parse(JSON.stringify(p.ambientes))
      ambientes[ai].epcs = ambientes[ai].epcs.filter((_, idx) => idx !== ei)
      return { ...p, ambientes }
    })
  }

  // ── GHEs (inventário) ─────────────────────────────────
  function addGhe() {
    setForm(p => ({ ...p, inventario: [...(p.inventario || []), gheVazio()] }))
  }
  function setGhe(gi, field, value) {
    setForm(p => {
      const inventario = [...p.inventario]
      inventario[gi] = { ...inventario[gi], [field]: value }
      return { ...p, inventario }
    })
  }
  function removerGhe(gi) {
    setForm(p => ({ ...p, inventario: p.inventario.filter((_, idx) => idx !== gi) }))
  }

  function addFuncaoGhe(gi) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].funcoes = [...(inventario[gi].funcoes || []), funcaoVazia()]
      return { ...p, inventario }
    })
  }
  function setFuncaoGhe(gi, fi, field, value) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].funcoes[fi][field] = value
      return { ...p, inventario }
    })
  }
  function removerFuncaoGhe(gi, fi) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].funcoes = inventario[gi].funcoes.filter((_, idx) => idx !== fi)
      return { ...p, inventario }
    })
  }

  function addRiscoGhe(gi) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].riscos = [...(inventario[gi].riscos || []), riscoVazio()]
      return { ...p, inventario }
    })
  }
  function setRiscoGhe(gi, ri, field, value) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].riscos[ri][field] = value
      return { ...p, inventario }
    })
  }
  function removerRiscoGhe(gi, ri) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].riscos = inventario[gi].riscos.filter((_, idx) => idx !== ri)
      return { ...p, inventario }
    })
  }
  // Ao sair do campo "risco", sugere código eSocial e medida administrativa
  // (só preenche o que ainda estiver vazio — nunca sobrescreve o que já foi digitado)
  function aoSairDoNomeRisco(gi, ri) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      const risco = inventario[gi].riscos[ri]
      const sugestao = sugerirParaRisco(risco.nome)
      if (!sugestao || !risco.nome) return p
      if (!risco.codigo_esocial) risco.codigo_esocial = sugestao.codigo_esocial
      const medidas = inventario[gi].medidas_administrativas || []
      const existente = medidas.find(m => m.risco === risco.nome)
      if (existente) {
        if (!existente.medida) existente.medida = sugestao.medida_administrativa
      } else {
        medidas.push({ risco: risco.nome, medida: sugestao.medida_administrativa })
      }
      inventario[gi].medidas_administrativas = medidas
      return { ...p, inventario }
    })
  }

  function addEpiGhe(gi) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].epis = [...(inventario[gi].epis || []), epiGheVazio()]
      return { ...p, inventario }
    })
  }
  function setEpiGhe(gi, ei, field, value) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].epis[ei][field] = value
      return { ...p, inventario }
    })
  }
  function removerEpiGhe(gi, ei) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].epis = inventario[gi].epis.filter((_, idx) => idx !== ei)
      return { ...p, inventario }
    })
  }

  function addMedidaAdmGhe(gi) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].medidas_administrativas = [...(inventario[gi].medidas_administrativas || []), medidaAdmVazia()]
      return { ...p, inventario }
    })
  }
  function setMedidaAdmGhe(gi, mi, field, value) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].medidas_administrativas[mi][field] = value
      return { ...p, inventario }
    })
  }
  function removerMedidaAdmGhe(gi, mi) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].medidas_administrativas = inventario[gi].medidas_administrativas.filter((_, idx) => idx !== mi)
      return { ...p, inventario }
    })
  }

  // ── Plano de ação ──────────────────────────────────────
  function addAcao() {
    setForm(p => ({ ...p, plano_acao: [...(p.plano_acao || []), acaoVazia()] }))
  }
  function setAcao(i, field, value) {
    setForm(p => {
      const plano_acao = [...p.plano_acao]
      plano_acao[i] = { ...plano_acao[i], [field]: value }
      return { ...p, plano_acao }
    })
  }
  function removerAcao(i) {
    setForm(p => ({ ...p, plano_acao: p.plano_acao.filter((_, idx) => idx !== i) }))
  }

  // ── Textos legais editáveis ───────────────────────────
  function setTextoCustom(titulo, paragrafos) {
    setForm(p => ({ ...p, textos_legais_custom: { ...(p.textos_legais_custom || {}), [titulo]: paragrafos } }))
  }
  function restaurarTextoPadrao(titulo) {
    setForm(p => {
      const textos = { ...(p.textos_legais_custom || {}) }
      delete textos[titulo]
      return { ...p, textos_legais_custom: textos }
    })
  }
  function paragrafosDoTexto(titulo, padrao) {
    return form.textos_legais_custom?.[titulo] || padrao
  }

  // ── Imagens ────────────────────────────────────────────
  async function addImagensAmbiente(ai, fileList) {
    const arquivos = Array.from(fileList || [])
    if (!arquivos.length) return
    const dataUrls = await Promise.all(arquivos.map(f => redimensionarImagem(f)))
    setForm(p => {
      const ambientes = JSON.parse(JSON.stringify(p.ambientes))
      ambientes[ai].imagens = [...(ambientes[ai].imagens || []), ...dataUrls]
      return { ...p, ambientes }
    })
  }
  function removerImagemAmbiente(ai, imgIdx) {
    setForm(p => {
      const ambientes = JSON.parse(JSON.stringify(p.ambientes))
      ambientes[ai].imagens = (ambientes[ai].imagens || []).filter((_, idx) => idx !== imgIdx)
      return { ...p, ambientes }
    })
  }
  async function addImagensGhe(gi, fileList) {
    const arquivos = Array.from(fileList || [])
    if (!arquivos.length) return
    const dataUrls = await Promise.all(arquivos.map(f => redimensionarImagem(f)))
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].imagens = [...(inventario[gi].imagens || []), ...dataUrls]
      return { ...p, inventario }
    })
  }
  function removerImagemGhe(gi, imgIdx) {
    setForm(p => {
      const inventario = JSON.parse(JSON.stringify(p.inventario))
      inventario[gi].imagens = (inventario[gi].imagens || []).filter((_, idx) => idx !== imgIdx)
      return { ...p, inventario }
    })
  }

  function exportarPdf(pgr) {
    gerarPdfPgr(
      {
        dados_gerais: {
          data_elaboracao: pgr.data_elaboracao,
          prox_revisao: pgr.prox_revisao,
          resp_nome: pgr.resp_nome,
          resp_conselho: pgr.resp_conselho,
          resp_registro: pgr.resp_registro,
        },
        ambientes: pgr.ambientes || [],
        inventario: pgr.inventario || [],
        plano_acao: pgr.plano_acao || [],
        textos_legais_custom: pgr.textos_legais_custom || {},
        imagens_anexas: pgr.imagens_anexas || [],
      },
      { ...(empresaCompleta || {}), razao_social: nomeEmpresa, cnpj: cnpjEmpresa, numero_empregados: totalFuncionarios }
    )
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  const totalRiscos = (pgrSel?.inventario || []).reduce((acc, g) => acc + (g.riscos?.length || 0), 0)
  const acoesPendentes = (pgrSel?.plano_acao || []).filter(a => a.status !== 'concluida').length
  const maiorRisco = (pgrSel?.inventario || []).reduce((max, g) => {
    for (const r of (g.riscos || [])) {
      const n = nivelRisco(r.severidade, r.probabilidade)
      if (n && (!max || n.valor > max.valor)) max = n
    }
    return max
  }, null)

  return (
    <Layout pagina="pgr">
      <Head><title>PGR — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>PGR</div>
          <div style={s.sub}>Programa de Gerenciamento de Riscos · NR-1</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {pgrSel && (
            <>
              <button style={s.btnOutline} onClick={() => setModalTextos(true)}>📃 Ver textos do documento</button>
              <button style={s.btnOutline} onClick={() => exportarPdf(pgrSel)}>📄 Exportar PDF</button>
            </>
          )}
          <button style={s.btnPrimary} onClick={abrirNovo}>+ Novo PGR</button>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && aba !== 'editar' && <div style={s.erroBox}>{erro}</div>}

      <div style={s.card}>
        <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:12 }}>Marca da Empresa</div>
        <UploadLogo
          empresa={empresaCompleta}
          onUpdate={atualizarLogo}
          isLoading={salvandoLogo}
        />
        <div style={{ fontSize:12, color:'#6b7280', marginTop:8 }}>
          A logo será incluída automaticamente em todos os documentos PDF (PGR, LTCAT, PCMSO, ASO, AET, PPP, LIP, APR, Treinamentos, Fichas de EPI e Ordens de Serviço).
        </div>
      </div>

      {!ghesCadastro.length && (
        <div style={{ ...s.card, background:'#FAEEDA', border:'0.5px solid #F3D9A4' }}>
          <div style={{ fontSize:13, color:'#633806' }}>
            Nenhum GHE cadastrado. O inventário de riscos e os ambientes podem ser preenchidos manualmente, mas recomendamos cadastrar os GHEs em <strong>/ghes</strong> primeiro para herdar automaticamente aqui e no LTCAT/PCMSO.
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:'1.25rem' }}>
        {[
          { n: pgrSel ? 'Vigente' : 'Ausente', l:'PGR', c: pgrSel ? '#1D9E75' : '#E24B4A' },
          { n: pgrSel?.inventario?.length || 0, l:'GHEs cadastrados', c:'#185FA5' },
          { n: totalRiscos, l:'Riscos no inventário', c:'#185FA5' },
          { n: maiorRisco?.faixa || '—', l:'Maior nível de risco', c: maiorRisco?.cor || '#6b7280' },
          { n: acoesPendentes, l:'Ações pendentes', c: acoesPendentes > 0 ? '#E24B4A' : '#1D9E75' },
        ].map((k,i) => (
          <div key={i} style={s.kpiCard}>
            <div style={{ fontSize:20, fontWeight:700, color:k.c }}>{k.n}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {aba === 'documento' && (
        <div>
          {!pgrSel ? (
            <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:14, color:'#374151', marginBottom:8 }}>Nenhum PGR cadastrado</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>
                Monte os ambientes de trabalho, o inventário de riscos por GHE e o plano de ação da empresa
              </div>
              <button style={s.btnPrimary} onClick={abrirNovo}>+ Criar primeiro PGR</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={s.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={s.cardTit}>Dados gerais</div>
                  <div style={{ display:'flex', gap:5 }}>
                    <button style={s.btnAcao} onClick={() => abrirEdicao(pgrSel)}>Editar</button>
                    <button style={s.btnAcao} onClick={() => arquivar(pgrSel.id)}>Arquivar</button>
                    <button style={{ ...s.btnAcao, color:'#E24B4A', borderColor:'#F09595' }} onClick={() => excluir(pgrSel.id)}>Excluir</button>
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <div style={s.secLabel}>Elaboração</div>
                    <div style={{ fontSize:13 }}>{pgrSel.data_elaboracao ? new Date(pgrSel.data_elaboracao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                  <div>
                    <div style={s.secLabel}>Próxima revisão</div>
                    <div style={{ fontSize:13 }}>{pgrSel.prox_revisao ? new Date(pgrSel.prox_revisao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <div style={s.secLabel}>Responsável técnico</div>
                    <div style={{ fontSize:13 }}>{pgrSel.resp_nome || '—'}</div>
                  </div>
                  <div>
                    <div style={s.secLabel}>{pgrSel.resp_conselho || 'CREA'}</div>
                    <div style={{ fontSize:13 }}>{pgrSel.resp_registro || '—'}</div>
                  </div>
                </div>
              </div>

              <div style={s.card}>
                <div style={s.cardTit}>Ambientes de trabalho ({pgrSel.ambientes?.length || 0})</div>
                {pgrSel.ambientes?.length ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                    {pgrSel.ambientes.map((a,i) => (
                      <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{a.nome}</div>
                          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:99, background:'#f3f4f6', color:'#6b7280' }}>
                            {a.tipo === 'terceiro' ? 'Terceiro' : 'Próprio'}{a.data_inicio ? ` · desde ${new Date(a.data_inicio+'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                          </span>
                        </div>
                        {a.descricao && <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>{a.descricao}</div>}
                        {a.epcs?.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
                            {a.epcs.map((e,ei) => (
                              <span key={ei} style={{ padding:'2px 8px', borderRadius:99, fontSize:10, background:'#E6F1FB', color:'#0C447C' }}>{e.nome}</span>
                            ))}
                          </div>
                        )}
                        {a.imagens?.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                            {a.imagens.map((img,ii) => (
                              <img key={ii} src={img} alt={`${a.nome} — foto ${ii+1}`} style={{ width:64, height:64, objectFit:'cover', borderRadius:6, border:'0.5px solid #e5e7eb' }} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhum ambiente cadastrado.</div>}
              </div>

              {pgrSel.imagens_anexas?.length > 0 && (
                <div style={s.card}>
                  <div style={s.cardTit}>Imagens anexas ({pgrSel.imagens_anexas.length})</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:10 }}>
                    {pgrSel.imagens_anexas.map((img,i) => (
                      <div key={i} style={{ textAlign:'center' }}>
                        <img src={img.dataUrl} alt={img.legenda || `Imagem ${i+1}`} style={{ width:120, height:120, objectFit:'cover', borderRadius:8, border:'0.5px solid #e5e7eb' }} />
                        {img.legenda && <div style={{ fontSize:11, color:'#6b7280', marginTop:4, maxWidth:120 }}>{img.legenda}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={s.card}>
                <div style={s.cardTit}>Inventário de riscos por GHE ({pgrSel.inventario?.length || 0})</div>
                {pgrSel.inventario?.length ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:10 }}>
                    {pgrSel.inventario.map((g, gi) => (
                      <div key={gi} style={{ border:'0.5px solid #e5e7eb', borderRadius:10, padding:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:8 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#111' }}>{g.nome || '—'}</div>
                          <div style={{ fontSize:11, color:'#6b7280' }}>
                            {g.ambientes_relacionados ? `Ambientes: ${g.ambientes_relacionados} · ` : ''}
                            {g.jornada_trabalho ? `Jornada: ${g.jornada_trabalho} · ` : ''}
                            {g.numero_empregados ? `${g.numero_empregados} empregado(s)` : ''}
                          </div>
                        </div>
                        {g.imagens?.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                            {g.imagens.map((img, ii) => (
                              <img key={ii} src={img} alt={`${g.nome || 'GHE'} — foto ${ii+1}`} style={{ width:100, height:100, objectFit:'cover', borderRadius:8, border:'0.5px solid #e5e7eb' }} />
                            ))}
                          </div>
                        )}
                        {g.funcoes?.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                            {g.funcoes.map((fn,fi) => (
                              <span key={fi} title={fn.atividades || ''} style={{ padding:'3px 10px', borderRadius:99, fontSize:11, background:'#f3f4f6', color:'#374151' }}>{fn.nome}</span>
                            ))}
                          </div>
                        )}
                        {g.riscos?.length > 0 ? (
                          <div style={{ overflowX:'auto', marginBottom:10 }}>
                            <table style={s.table}>
                              <thead>
                                <tr style={{ background:'#f9fafb' }}>
                                  {['Tipo','Perigo / Risco','Cód. eSocial','Nível de risco','Medição','Exposição'].map(h => <th key={h} style={s.th}>{h}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {g.riscos.map((r,ri) => {
                                  const nr = nivelRisco(r.severidade, r.probabilidade)
                                  return (
                                    <tr key={ri} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                                      <td style={s.td}>
                                        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, background:COR_AGENTE[r.tipo]||'#f3f4f6', color:TXT_AGENTE[r.tipo]||'#374151' }}>
                                          {TIPO_AGENTE[r.tipo] || r.tipo}
                                        </span>
                                      </td>
                                      <td style={s.td}>
                                        <div style={{ fontWeight:500 }}>{r.nome || '—'}</div>
                                        {r.perigo && <div style={{ fontSize:11, color:'#9ca3af' }}>{r.perigo}</div>}
                                      </td>
                                      <td style={{ ...s.td, fontSize:11, fontFamily:'monospace' }}>{r.codigo_esocial || '—'}</td>
                                      <td style={s.td}>
                                        {nr ? (
                                          <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:nr.bg, color:nr.cor }}>
                                            {nr.faixa} ({nr.valor})
                                          </span>
                                        ) : <span style={{ fontSize:11, color:'#d1d5db' }}>—</span>}
                                      </td>
                                      <td style={s.td}>{r.valor ? `${r.valor}${r.unidade ? ` ${r.unidade}` : ''}${r.limite ? ` / LT ${r.limite}` : ''}` : '—'}</td>
                                      <td style={{ ...s.td, fontSize:11 }}>{r.tipo_exposicao || '—'}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : <div style={{ fontSize:12, color:'#9ca3af', marginBottom:10 }}>Nenhum risco cadastrado neste GHE.</div>}
                        {g.epis?.length > 0 && (
                          <div style={{ overflowX:'auto', marginBottom:10 }}>
                            <table style={s.table}>
                              <thead>
                                <tr style={{ background:'#f9fafb' }}>{['EPI','Atenuação','Eficácia'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                              </thead>
                              <tbody>
                                {g.epis.map((e,ei) => (
                                  <tr key={ei} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                                    <td style={s.td}>{e.nome || '—'}</td>
                                    <td style={s.td}>{e.atenuacao || '—'}</td>
                                    <td style={s.td}>{e.eficaz ? 'Sim' : 'Não'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {g.medidas_administrativas?.length > 0 && (
                          <div style={{ overflowX:'auto' }}>
                            <table style={s.table}>
                              <thead>
                                <tr style={{ background:'#f9fafb' }}>{['Risco','Medida administrativa'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                              </thead>
                              <tbody>
                                {g.medidas_administrativas.map((m,mi) => (
                                  <tr key={mi} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                                    <td style={s.td}>{m.risco || '—'}</td>
                                    <td style={s.td}>{m.medida || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhum GHE cadastrado.</div>}
              </div>

              <div style={s.card}>
                <div style={s.cardTit}>Plano de ação ({pgrSel.plano_acao?.length || 0})</div>
                {pgrSel.plano_acao?.length ? (
                  <div style={{ overflowX:'auto', marginTop:10 }}>
                    <table style={s.table}>
                      <thead>
                        <tr style={{ background:'#f9fafb' }}>
                          {['Prior.','Risco','O que','Quem','Como','Onde','Quando','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {pgrSel.plano_acao.map((a,i) => {
                          const st = STATUS_ACAO.find(x => x.key === a.status) || STATUS_ACAO[0]
                          const pr = PRIORIZACAO_OPCOES.find(x => x.v === a.priorizacao)
                          return (
                            <tr key={i} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                              <td style={s.td}>
                                {pr && <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:pr.bg, color:pr.cor }}>{pr.l}</span>}
                              </td>
                              <td style={s.td}>{a.risco || '—'}</td>
                              <td style={s.td}>{a.medida_controle || '—'}</td>
                              <td style={s.td}>{a.responsavel || '—'}</td>
                              <td style={s.td}>{a.como || '—'}</td>
                              <td style={s.td}>{a.onde || '—'}</td>
                              <td style={s.td}>{a.prazo ? new Date(a.prazo+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                              <td style={s.td}>
                                <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:st.bg, color:st.cor }}>{st.label}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhuma ação cadastrada.</div>}
              </div>

              {pgrs.length > 1 && (
                <div style={s.card}>
                  <div style={s.cardTit}>Histórico</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                    {pgrs.map(p => (
                      <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'0.5px solid #f3f4f6' }}>
                        <span style={{ fontSize:12, color: p.ativo ? '#111' : '#9ca3af' }}>
                          {p.data_elaboracao ? new Date(p.data_elaboracao+'T12:00:00').toLocaleDateString('pt-BR') : '—'} {!p.ativo && '(arquivado)'}
                        </span>
                        <button style={{ ...s.btnAcao, fontSize:10 }} onClick={() => setPgrSel(p)}>Ver</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {aba === 'editar' && form && (
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={s.cardTit}>{form.id ? 'Editar PGR' : 'Novo PGR'}</div>
            <button onClick={cancelarEdicao} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
          </div>

          <div style={{ background:'#f9fafb', padding:12, borderRadius:8, marginBottom:16, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={s.label}>Nº da revisão</label>
              <input type="number" style={s.input} min="1" value={form.numero_revisao || 1} onChange={e => setForm({ ...form, numero_revisao: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <label style={s.label}>Status</label>
              <select style={s.input} value={form.status || 'Ativo'} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Ativo">Ativo</option>
                <option value="Revisão">Em Revisão</option>
                <option value="Arquivado">Arquivado</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Responsável elaboração</label>
              <select style={s.input} value={form.resp_nome || ''} onChange={e => {
                const nome = e.target.value
                const hoje = new Date().toISOString().split('T')[0]
                const hist = form.historico_revisoes || []
                setForm({
                  ...form,
                  resp_nome: nome,
                  historico_revisoes: !form.id && hist.length === 1 && hist[0].responsavel !== nome
                    ? [{ ...hist[0], responsavel: nome }]
                    : hist
                })
              }}>
                <option value="">Selecionar responsável...</option>
                <option value={ltcatAtivo?.resp_nome || ''}>{ltcatAtivo?.resp_nome || 'Responsável LTCAT'}</option>
              </select>
            </div>
          </div>

          <div style={s.row2}>
            <div>
              <label style={s.label}>Data de elaboração *</label>
              <input type="date" style={s.input} value={form.data_elaboracao || ''} onChange={e => setForm({ ...form, data_elaboracao: e.target.value })} />
            </div>
            <div>
              <label style={s.label}>Próxima revisão</label>
              <input type="date" style={s.input} value={form.prox_revisao || ''} onChange={e => setForm({ ...form, prox_revisao: e.target.value })} />
            </div>
          </div>

          <div style={s.row2}>
            <div>
              <label style={s.label}>Responsável técnico *</label>
              <input style={s.input} placeholder="Nome do responsável" value={form.resp_nome || ''} onChange={e => setForm({ ...form, resp_nome: e.target.value })} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:8 }}>
              <div>
                <label style={s.label}>Conselho</label>
                <input style={s.input} value={form.resp_conselho || 'CREA'} onChange={e => setForm({ ...form, resp_conselho: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Registro</label>
                <input style={s.input} value={form.resp_registro || ''} onChange={e => setForm({ ...form, resp_registro: e.target.value })} />
              </div>
            </div>
          </div>

          {/* ── Ambientes de trabalho ── */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>Ambientes de trabalho ({form.ambientes?.length || 0})</label>
              <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addAmbiente}>+ Adicionar ambiente</button>
            </div>
            {(form.ambientes || []).map((a, ai) => (
              <div key={ai} style={s.blocoItem}>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <button onClick={() => removerAmbiente(ai)} style={s.btnRemover}>×</button>
                </div>
                <div style={s.row2}>
                  <input style={s.input} placeholder="Nome do ambiente (ex: Almoxarifado)" value={a.nome} onChange={e => setAmbiente(ai, 'nome', e.target.value)} />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <select style={s.input} value={a.tipo} onChange={e => setAmbiente(ai, 'tipo', e.target.value)}>
                      <option value="proprio">Próprio</option>
                      <option value="terceiro">Terceiro</option>
                    </select>
                    <input type="date" style={s.input} value={a.data_inicio || ''} onChange={e => setAmbiente(ai, 'data_inicio', e.target.value)} />
                  </div>
                </div>
                <textarea style={{ ...s.input, minHeight:50, marginBottom:10 }} placeholder="Descrição do ambiente (ventilação, piso, pé-direito, etc.)"
                  value={a.descricao} onChange={e => setAmbiente(ai, 'descricao', e.target.value)} />
                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginBottom:4 }}>EQUIPAMENTOS DE PROTEÇÃO COLETIVA (EPC)</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                  {(a.epcs || []).map((e,ei) => (
                    <span key={ei} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:99, fontSize:11, background:'#E6F1FB', color:'#0C447C' }}>
                      <input style={{ border:'none', background:'transparent', fontSize:11, color:'#0C447C', width:120 }} value={e.nome} onChange={ev => setEpcAmbiente(ai, ei, ev.target.value)} placeholder="Nome do EPC" />
                      <button onClick={() => removerEpcAmbiente(ai, ei)} style={{ background:'none', border:'none', cursor:'pointer', color:'#0C447C' }}>×</button>
                    </span>
                  ))}
                  <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => addEpcAmbiente(ai)}>+ EPC</button>
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginBottom:4 }}>FOTOS DO AMBIENTE</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                  {(a.imagens || []).map((img, ii) => (
                    <div key={ii} style={{ position:'relative' }}>
                      <img src={img} alt={`Foto ${ii+1}`} style={{ width:56, height:56, objectFit:'cover', borderRadius:6, border:'0.5px solid #e5e7eb' }} />
                      <button onClick={() => removerImagemAmbiente(ai, ii)} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#E24B4A', color:'#fff', border:'none', cursor:'pointer', fontSize:11, lineHeight:'18px', padding:0 }}>×</button>
                    </div>
                  ))}
                  <label style={{ ...s.btnAcao, fontSize:11, cursor:'pointer' }}>
                    + Foto
                    <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => { addImagensAmbiente(ai, e.target.files); e.target.value = '' }} />
                  </label>
                </div>
              </div>
            ))}
            {!(form.ambientes || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum ambiente cadastrado.</div>}
          </div>

          {/* ── Inventário de riscos por GHE ── */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>
                Inventário de riscos por GHE ({form.inventario?.length || 0})
                {inventarioDesatualizado(form.inventario, ghesCadastro) && (
                  <span style={{ marginLeft:8, padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, background:'#FAEEDA', color:'#633806' }}>
                    ⚠ cadastro foi atualizado
                  </span>
                )}
              </label>
              <div style={{ display:'flex', gap:6 }}>
                <button style={{ ...s.btnAcao, fontSize:11, color:'#0C447C', borderColor:'#B5D4F4' }} onClick={prepararSincronizacao}>↻ Sincronizar do cadastro</button>
                <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addGhe}>+ Adicionar GHE</button>
              </div>
            </div>
            {(form.inventario || []).map((g, gi) => (
              <div key={gi} style={{ ...s.blocoItem, background:'#fff', border:'1px solid #d1d5db' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>GHE {gi + 1}</div>
                  <button onClick={() => removerGhe(gi)} style={s.btnRemover}>×</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
                  <input style={s.inputSm} placeholder="Nome do GHE (ex: ALMOXARIFADO)" value={g.nome} onChange={e => setGhe(gi, 'nome', e.target.value)} />
                  <input style={s.inputSm} placeholder="Ambientes relacionados" value={g.ambientes_relacionados} onChange={e => setGhe(gi, 'ambientes_relacionados', e.target.value)} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:6, marginBottom:10 }}>
                  <input style={s.inputSm} placeholder="Jornada de trabalho (ex: Seg/Sex 08:00-12:00/14:00-18:00)" value={g.jornada_trabalho} onChange={e => setGhe(gi, 'jornada_trabalho', e.target.value)} />
                  <input style={s.inputSm} type="number" min="0" placeholder="Nº de empregados" value={g.numero_empregados} onChange={e => setGhe(gi, 'numero_empregados', e.target.value)} />
                </div>

                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginBottom:4 }}>FOTOS DO GHE</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center', marginBottom:10 }}>
                  {(g.imagens || []).map((img, ii) => (
                    <div key={ii} style={{ position:'relative' }}>
                      <img src={img} alt={`Foto ${ii+1} de ${g.nome || 'GHE'}`} style={{ width:56, height:56, objectFit:'cover', borderRadius:6, border:'0.5px solid #e5e7eb' }} />
                      <button onClick={() => removerImagemGhe(gi, ii)} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#E24B4A', color:'#fff', border:'none', cursor:'pointer', fontSize:11, lineHeight:'18px', padding:0 }}>×</button>
                    </div>
                  ))}
                  <label style={{ ...s.btnAcao, fontSize:11, cursor:'pointer' }}>
                    + Foto
                    <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => { addImagensGhe(gi, e.target.files); e.target.value = '' }} />
                  </label>
                </div>

                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginBottom:4 }}>FUNÇÕES DESTE GHE</div>
                {(g.funcoes || []).map((fn, fi) => (
                  <div key={fi} style={{ border:'0.5px solid #e5e7eb', borderRadius:6, padding:10, marginBottom:8, background:'#fafbfc' }}>
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button onClick={() => removerFuncaoGhe(gi, fi)} style={s.btnRemover}>×</button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:6, marginBottom:6 }}>
                      <input style={s.inputSm} placeholder="Nome da função (ex: Auxiliar Administrativo)" value={fn.nome} onChange={e => setFuncaoGhe(gi, fi, 'nome', e.target.value)} />
                      <input style={s.inputSm} placeholder="CBO (ex: 4110-10)" value={fn.cbo||''} onChange={e => setFuncaoGhe(gi, fi, 'cbo', e.target.value)} />
                      <select style={s.inputSm} value={fn.nivel || 'Pleno'} onChange={e => setFuncaoGhe(gi, fi, 'nivel', e.target.value)}>
                        <option value="Junior">Junior</option>
                        <option value="Pleno">Pleno</option>
                        <option value="Sênior">Sênior</option>
                      </select>
                    </div>
                    <textarea style={{ ...s.inputSm, minHeight:40, marginBottom:6 }} placeholder="Descrição das atividades (ex: Atendimento ao cliente, organização de arquivos, elaboração de documentos)" value={fn.atividades} onChange={e => setFuncaoGhe(gi, fi, 'atividades', e.target.value)} />
                    <textarea style={{ ...s.inputSm, minHeight:35, marginBottom:6 }} placeholder="Requisitos técnicos (ex: Conhecimento em Excel, Word, NoSQL. Experiência mínima 2 anos...)" value={fn.requisitos||''} onChange={e => setFuncaoGhe(gi, fi, 'requisitos', e.target.value)} />
                    <select style={s.inputSm} value={fn.periodicidade_monitoramento || 'Anual'} onChange={e => setFuncaoGhe(gi, fi, 'periodicidade_monitoramento', e.target.value)}>
                      <option value="Trimestral">Avaliação Trimestral</option>
                      <option value="Semestral">Avaliação Semestral</option>
                      <option value="Anual">Avaliação Anual</option>
                      <option value="Eventual">Avaliação Eventual</option>
                    </select>
                  </div>
                ))}
                <button style={{ ...s.btnAcao, fontSize:11, marginBottom:12 }} onClick={() => addFuncaoGhe(gi)}>+ Função</button>

                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginBottom:4 }}>RISCOS DESTE GHE</div>
                {(g.riscos || []).map((r, ri) => {
                  const nr = nivelRisco(r.severidade, r.probabilidade)
                  return (
                    <div key={ri} style={{ border:'0.5px solid #e5e7eb', borderRadius:6, padding:10, marginBottom:8, background:'#fafbfc' }}>
                      <div style={{ display:'flex', justifyContent:'flex-end' }}>
                        <button onClick={() => removerRiscoGhe(gi, ri)} style={s.btnRemover}>×</button>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 1fr', gap:6, marginBottom:8 }}>
                        <select style={s.inputSm} value={r.tipo} onChange={e => setRiscoGhe(gi, ri, 'tipo', e.target.value)}>
                          {Object.entries(TIPO_AGENTE).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                        <input style={s.inputSm} placeholder="Agente / risco (ex: Ruído)" list={`lista-agentes-${r.tipo}`} value={r.nome}
                          onChange={e => setRiscoGhe(gi, ri, 'nome', e.target.value)}
                          onBlur={() => aoSairDoNomeRisco(gi, ri)} />
                        <input style={s.inputSm} placeholder="Perigo (ex: Intensidade)" value={r.perigo} onChange={e => setRiscoGhe(gi, ri, 'perigo', e.target.value)} />
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:6, marginBottom:8 }}>
                        <input style={s.inputSm} placeholder="Fontes / circunstâncias" value={r.fontes_circunstancias} onChange={e => setRiscoGhe(gi, ri, 'fontes_circunstancias', e.target.value)} />
                        <input style={s.inputSm} placeholder="Código eSocial (Tabela 24)" list="lista-codigo-esocial" value={r.codigo_esocial} onChange={e => setRiscoGhe(gi, ri, 'codigo_esocial', e.target.value)} />
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, alignItems:'center', marginBottom:8 }}>
                        <select style={s.inputSm} value={r.severidade} onChange={e => setRiscoGhe(gi, ri, 'severidade', e.target.value ? parseInt(e.target.value,10) : '')}>
                          <option value="">Severidade</option>
                          {SEVERIDADE_OPCOES.map(o => <option key={o.v} value={o.v}>{o.l} ({o.v})</option>)}
                        </select>
                        <select style={s.inputSm} value={r.probabilidade} onChange={e => setRiscoGhe(gi, ri, 'probabilidade', e.target.value ? parseInt(e.target.value,10) : '')}>
                          <option value="">Probabilidade</option>
                          {PROBABILIDADE_OPCOES.map(o => <option key={o.v} value={o.v}>{o.l} ({o.v})</option>)}
                        </select>
                        {nr ? (
                          <span style={{ textAlign:'center', padding:'6px 10px', borderRadius:8, fontSize:12, fontWeight:600, background:nr.bg, color:nr.cor }}>
                            {nr.faixa} ({nr.valor})
                          </span>
                        ) : <span style={{ textAlign:'center', fontSize:11, color:'#9ca3af' }}>Nível de risco</span>}
                      </div>
                      <input style={{ ...s.inputSm, marginBottom:8 }} placeholder="Possíveis danos à saúde" value={r.possiveis_danos} onChange={e => setRiscoGhe(gi, ri, 'possiveis_danos', e.target.value)} />
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6, marginBottom:8 }}>
                        <input style={s.inputSm} placeholder="Valor medido" value={r.valor} onChange={e => setRiscoGhe(gi, ri, 'valor', e.target.value)} />
                        <input style={s.inputSm} placeholder="Medida" list="unidades-medida-pgr" value={r.unidade} onChange={e => setRiscoGhe(gi, ri, 'unidade', e.target.value)} />
                        <input style={s.inputSm} placeholder="Limite de tolerância" value={r.limite} onChange={e => setRiscoGhe(gi, ri, 'limite', e.target.value)} />
                        <input style={s.inputSm} placeholder="Equipamento de medição" value={r.equipamento} onChange={e => setRiscoGhe(gi, ri, 'equipamento', e.target.value)} />
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 140px', gap:6, marginBottom:8 }}>
                        <input style={s.inputSm} placeholder="Metodologia de medição (ex: NHO-01)" value={r.metodologia||''} onChange={e => setRiscoGhe(gi, ri, 'metodologia', e.target.value)} />
                        <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, whiteSpace:'nowrap' }}>
                          <input type="checkbox" checked={r.medicao_quantitativa||false} onChange={e => setRiscoGhe(gi, ri, 'medicao_quantitativa', e.target.checked)} />
                          Medição quantitativa
                        </label>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        <select style={s.inputSm} value={r.trajetoria} onChange={e => setRiscoGhe(gi, ri, 'trajetoria', e.target.value)}>
                          <option value="">Trajetória</option>
                          {TRAJETORIA_OPCOES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select style={s.inputSm} value={r.tipo_exposicao} onChange={e => setRiscoGhe(gi, ri, 'tipo_exposicao', e.target.value)}>
                          <option value="">Tipo de exposição</option>
                          {TIPO_EXPOSICAO_OPCOES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  )
                })}
                <button style={{ ...s.btnAcao, fontSize:11, marginBottom:12 }} onClick={() => addRiscoGhe(gi)}>+ Risco</button>

                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginBottom:4 }}>EPI (COM ATENUAÇÃO E EFICÁCIA)</div>
                {(g.epis || []).map((e, ei) => (
                  <div key={ei} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 28px', gap:6, marginBottom:6, alignItems:'center' }}>
                    <input style={s.inputSm} placeholder="Nome do EPI" value={e.nome} onChange={ev => setEpiGhe(gi, ei, 'nome', ev.target.value)} />
                    <input style={s.inputSm} placeholder="Atenuação" value={e.atenuacao} onChange={ev => setEpiGhe(gi, ei, 'atenuacao', ev.target.value)} />
                    <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer' }}>
                      <input type="checkbox" checked={!!e.eficaz} onChange={ev => setEpiGhe(gi, ei, 'eficaz', ev.target.checked)} />
                      Eficaz
                    </label>
                    <button onClick={() => removerEpiGhe(gi, ei)} style={s.btnRemover}>×</button>
                  </div>
                ))}
                <button style={{ ...s.btnAcao, fontSize:11, marginBottom:12 }} onClick={() => addEpiGhe(gi)}>+ EPI</button>

                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginBottom:4 }}>MEDIDAS ADMINISTRATIVAS</div>
                {(g.medidas_administrativas || []).map((m, mi) => (
                  <div key={mi} style={{ display:'grid', gridTemplateColumns:'1fr 2fr 28px', gap:6, marginBottom:6, alignItems:'center' }}>
                    <input style={s.inputSm} placeholder="Risco" value={m.risco} onChange={ev => setMedidaAdmGhe(gi, mi, 'risco', ev.target.value)} />
                    <input style={s.inputSm} placeholder="Medida administrativa" value={m.medida} onChange={ev => setMedidaAdmGhe(gi, mi, 'medida', ev.target.value)} />
                    <button onClick={() => removerMedidaAdmGhe(gi, mi)} style={s.btnRemover}>×</button>
                  </div>
                ))}
                <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => addMedidaAdmGhe(gi)}>+ Medida administrativa</button>
              </div>
            ))}
            {!(form.inventario || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum GHE. Cadastre um LTCAT vigente ou adicione manualmente.</div>}
            <datalist id="lista-codigo-esocial">
              {ESOCIAL_TABELA24.map(a => <option key={a.codigo} value={a.codigo}>{a.nome}</option>)}
            </datalist>
            {Object.entries(AGENTES_POR_TIPO).map(([tipo, agentes]) => (
              <datalist key={tipo} id={`lista-agentes-${tipo}`}>
                {agentes.map(nome => <option key={nome} value={nome} />)}
              </datalist>
            ))}
            <datalist id="unidades-medida-pgr">
              <option value="dB(A)" /><option value="ppm" /><option value="mg/m³" /><option value="µg/m³" />
              <option value="fibras/cm³" /><option value="IBUTG °C" /><option value="lux" /><option value="m/s²" /><option value="%" />
            </datalist>
          </div>

          {/* ── Plano de ação ── */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>Plano de ação ({form.plano_acao?.length || 0})</label>
              <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addAcao}>+ Adicionar ação</button>
            </div>
            {(form.plano_acao || []).map((a, i) => (
              <div key={i} style={s.blocoItem}>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <button onClick={() => removerAcao(i)} style={s.btnRemover}>×</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:6, marginBottom:8 }}>
                  <input style={s.inputSm} placeholder="Risco" value={a.risco} onChange={e => setAcao(i, 'risco', e.target.value)} />
                  <input style={s.inputSm} placeholder="Responsável (quem)" value={a.responsavel} onChange={e => setAcao(i, 'responsavel', e.target.value)} />
                  <select style={s.inputSm} value={a.status} onChange={e => setAcao(i, 'status', e.target.value)}>
                    {STATUS_ACAO.map(st => <option key={st.key} value={st.key}>{st.label}</option>)}
                  </select>
                </div>
                <textarea style={{ ...s.inputSm, minHeight:40, marginBottom:8 }} placeholder="O que — medida de controle/prevenção" value={a.medida_controle} onChange={e => setAcao(i, 'medida_controle', e.target.value)} />
                <textarea style={{ ...s.inputSm, minHeight:40, marginBottom:8 }} placeholder="Por que — justificativa da ação" value={a.justificativa} onChange={e => setAcao(i, 'justificativa', e.target.value)} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6 }}>
                  <input style={s.inputSm} placeholder="Como" value={a.como} onChange={e => setAcao(i, 'como', e.target.value)} />
                  <input style={s.inputSm} placeholder="Onde" value={a.onde} onChange={e => setAcao(i, 'onde', e.target.value)} />
                  <input type="date" style={s.inputSm} value={a.prazo || ''} onChange={e => setAcao(i, 'prazo', e.target.value)} />
                  <select style={s.inputSm} value={a.priorizacao} onChange={e => setAcao(i, 'priorizacao', e.target.value)}>
                    {PRIORIZACAO_OPCOES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                  </select>
                </div>
              </div>
            ))}
            {!(form.plano_acao || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhuma ação cadastrada.</div>}
          </div>

          {/* ── Textos legais do documento ── */}
          <div style={{ marginBottom:16 }}>
            <label style={s.label}>Textos legais do documento (NR-1)</label>
            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:8 }}>Textos padrão que vão no PDF — edite só se precisar ajustar alguma redação para o caso da empresa.</div>
            {TEXTOS_LEGAIS_PGR.map(secaoTexto => {
              const aberto = textoAberto === secaoTexto.titulo
              const custom = form.textos_legais_custom?.[secaoTexto.titulo]
              return (
                <div key={secaoTexto.titulo} style={s.blocoItem}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>
                      {secaoTexto.titulo}
                      {custom && <span style={{ marginLeft:8, fontSize:10, fontWeight:600, color:'#0C447C', background:'#E6F1FB', padding:'1px 7px', borderRadius:99 }}>editado</span>}
                    </div>
                    <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => setTextoAberto(aberto ? null : secaoTexto.titulo)}>
                      {aberto ? 'Fechar' : 'Ver / Editar'}
                    </button>
                  </div>
                  {aberto && (
                    <div style={{ marginTop:10 }}>
                      <textarea
                        style={{ ...s.input, minHeight:160, fontSize:12, lineHeight:1.5 }}
                        value={paragrafosDoTexto(secaoTexto.titulo, secaoTexto.paragrafos).join('\n\n')}
                        onChange={e => setTextoCustom(secaoTexto.titulo, e.target.value.split(/\n\s*\n/))}
                      />
                      <div style={{ display:'flex', gap:8, marginTop:6 }}>
                        {custom && <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => restaurarTextoPadrao(secaoTexto.titulo)}>Restaurar padrão</button>}
                        <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => setTextoAberto(null)}>Concluído</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {erro && <div style={s.erroBox}>{erro}</div>}

          <div style={{ display:'flex', gap:8 }}>
            <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar PGR'}</button>
            <button style={s.btnOutline} onClick={cancelarEdicao}>Cancelar</button>
          </div>
        </div>
      )}

      {syncPendente && (
        <div style={s.overlay} onClick={cancelarSincronizacao}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>Sincronizar do cadastro central</div>
              <button onClick={cancelarSincronizacao} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
            </div>
            {(() => {
              const c = syncPendente.changelog
              const semMudancas = !c.grupos_novos.length && !c.riscos_novos.length && !c.campos_atualizados.length && !c.riscos_removidos_do_cadastro.length
              if (semMudancas) return <div style={{ fontSize:13, color:'#6b7280' }}>Nada para sincronizar — o inventário já está em dia com o cadastro.</div>
              return (
                <>
                  {c.grupos_novos.length > 0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#27500A', marginBottom:4 }}>GHEs novos ({c.grupos_novos.length})</div>
                      <div style={{ fontSize:12, color:'#374151' }}>{c.grupos_novos.join(', ')}</div>
                    </div>
                  )}
                  {c.riscos_novos.length > 0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#27500A', marginBottom:4 }}>Riscos novos ({c.riscos_novos.length})</div>
                      <div style={{ fontSize:12, color:'#374151' }}>{c.riscos_novos.join(', ')}</div>
                    </div>
                  )}
                  {c.campos_atualizados.length > 0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#0C447C', marginBottom:4 }}>Campos atualizados ({c.campos_atualizados.length})</div>
                      <div style={{ fontSize:12, color:'#374151' }}>{c.campos_atualizados.join(', ')}</div>
                    </div>
                  )}
                  {c.riscos_removidos_do_cadastro.length > 0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#791F1F', marginBottom:4 }}>Removidos do cadastro, mas mantidos aqui ({c.riscos_removidos_do_cadastro.length})</div>
                      <div style={{ fontSize:12, color:'#374151' }}>{c.riscos_removidos_do_cadastro.join(', ')}</div>
                    </div>
                  )}
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:8 }}>
                    Campos exclusivos do PGR (severidade, probabilidade, medidas administrativas, jornada, nº de empregados) não são alterados por esta sincronização.
                  </div>
                </>
              )
            })()}
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button style={s.btnPrimary} onClick={aplicarSincronizacao}>Aplicar</button>
              <button style={s.btnOutline} onClick={cancelarSincronizacao}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalTextos && pgrSel && (
        <div style={s.overlay} onClick={() => setModalTextos(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>Textos do documento (NR-1)</div>
              <button onClick={() => setModalTextos(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
            </div>
            {TEXTOS_LEGAIS_PGR.map(secaoTexto => (
              <div key={secaoTexto.titulo} style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#185FA5', marginBottom:6 }}>{secaoTexto.titulo}</div>
                {(pgrSel.textos_legais_custom?.[secaoTexto.titulo] || secaoTexto.paragrafos).map((p, i) => (
                  <div key={i} style={{ fontSize:12, color:'#374151', lineHeight:1.6, marginBottom:8 }}>{p}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}

const s = {
  loading:    { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:     { fontSize:20, fontWeight:700, color:'#111' },
  sub:        { fontSize:12, color:'#6b7280', marginTop:2 },
  kpiCard:    { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'0.85rem' },
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' },
  cardTit:    { fontSize:13, fontWeight:600, color:'#111' },
  secLabel:   { fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 },
  row2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 },
  label:      { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 },
  input:      { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  inputSm:    { width:'100%', padding:'5px 8px', fontSize:12, border:'1px solid #d1d5db', borderRadius:6, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:640 },
  th:         { padding:'8px 10px', textAlign:'left', fontSize:10, fontWeight:600, color:'#6b7280', borderBottom:'0.5px solid #e5e7eb', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' },
  td:         { padding:'8px 10px', verticalAlign:'top', color:'#374151' },
  btnAcao:    { padding:'3px 10px', fontSize:11, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151' },
  btnRemover: { background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:16 },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  blocoItem:  { border:'0.5px solid #e5e7eb', borderRadius:8, padding:12, marginBottom:8, background:'#fafbfc' },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' },
  modal:      { background:'#fff', borderRadius:12, padding:'1.5rem', width:620, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
}
