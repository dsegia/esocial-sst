import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { gerarPdfPcmso } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'
import { formatarCPF } from '../lib/format'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Exames padrão por tipo de risco (NR-7)
const EXAMES_POR_RISCO = {
  fis: ['Audiometria tonal','Espirometria','Acuidade visual','Avaliação clínica'],
  qui: ['Hemograma completo','Avaliação clínica','Espirometria','Exame toxicológico'],
  bio: ['Hemograma completo','Avaliação clínica','Sorologia hepatite B'],
  erg: ['Avaliação clínica','Avaliação psicossocial','Rx coluna lombar'],
}

const TIPOS_CONSULTA = [
  { key:'admissional',     label:'Admissional', cor:'#1D9E75', bg:'#EAF3DE' },
  { key:'periodico',       label:'Periódico',   cor:'#185FA5', bg:'#E6F1FB' },
  { key:'retorno_trabalho',label:'Retorno',     cor:'#7C3AED', bg:'#EDE9FE' },
  { key:'mudanca_risco',   label:'Mudança',     cor:'#D97706', bg:'#FEF3C7' },
  { key:'demissional',     label:'Demissional', cor:'#DC2626', bg:'#FEE2E2' },
]

// Retorna todos os exames únicos de um programa (nova estrutura)
function todosExamesGhe(prog) {
  const vistos = new Set()
  const lista = []
  for (const t of TIPOS_CONSULTA) {
    for (const ex of (prog.exames?.[t.key] || [])) {
      const nome = ex.nome || ex
      if (!vistos.has(nome)) { vistos.add(nome); lista.push({ nome, codigo_t27: ex.codigo_t27 }) }
    }
  }
  return lista
}

// Backward compat: converte estrutura antiga (array de exames com tipos[]) para nova (objeto por tipo)
function normalizeExames(prog) {
  if (prog.exames && !Array.isArray(prog.exames)) return prog.exames // já é novo formato
  const result = {}
  for (const t of TIPOS_CONSULTA) result[t.key] = []
  for (const ex of (prog.exames || [])) {
    const tipos = ex.tipos?.length ? ex.tipos : ex.periodicidade ? [ex.periodicidade.toLowerCase().includes('admissional')?'admissional':ex.periodicidade.toLowerCase().includes('demissional')?'demissional':'periodico'] : ['periodico']
    for (const t of tipos) { if (result[t]) result[t].push({ nome: ex.nome, codigo_t27: ex.codigo_t27 }) }
  }
  return result
}

// Tipos de consulta (admissional/periodico/...) em que um exame aparece.
// Backward compat com exames que só tinham `periodicidade` (texto livre).
function tiposExame(ex) {
  if (ex.tipos?.length) return ex.tipos
  if (ex.periodicidade) {
    const p = ex.periodicidade.toLowerCase()
    return [p.includes('admissional') ? 'admissional' : p.includes('demissional') ? 'demissional' : 'periodico']
  }
  return ['periodico']
}

function todosRiscos(riscos) {
  if (!riscos) return []
  if (Array.isArray(riscos)) return riscos
  return [...(riscos.acidentes||[]), ...(riscos.ergonomicos||[]), ...(riscos.fisicos||[]), ...(riscos.biologicos||[]), ...(riscos.quimicos||[])]
}

const EXAMES_COMUNS = [
  'Avaliação clínica','Hemograma completo','Glicemia de jejum','Urina rotina',
  'Audiometria tonal','Acuidade visual','Espirometria','Eletrocardiograma (ECG)',
  'Eletroencefalograma (EEG)','Rx Tórax PA OIT','Rx Coluna L/S','Avaliação psicossocial',
  'Tipagem sanguínea','Colesterol total e frações','Triglicérides','TGO/TGP',
  'Teste de Romberg','Avaliação dermatológica','Sorologia hepatite B','Exame toxicológico',
]

export default function PCMSO() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [funcionarios, setFuncionarios] = useState([])
  const [ltcatAtivo, setLtcatAtivo] = useState(null)
  const [ghesCadastro, setGhesCadastro] = useState([])
  const [asos, setAsos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('programa') // programa | funcionarios | novo
  const [filtroSetor, setFiltroSetor] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  // Programa PCMSO
  const [programa, setPrograma] = useState([])
  const [editandoFunc, setEditandoFunc] = useState(null)
  const [formFunc, setFormFunc] = useState({
    funcao: '', setor: '', ghe_id: null, riscos: [], exames: []
  })
  const [novoExame, setNovoExame] = useState({ nome:'', tipos:['periodico'], obrigatorio:true })
  const [salvandoProg, setSalvandoProg] = useState(false)

  // Médico coordenador
  const [medico, setMedico] = useState(null)
  const [editandoMedico, setEditandoMedico] = useState(false)
  const [formMedico, setFormMedico] = useState({ medico_nome:'', medico_cpf:'', medico_crm:'', data_elaboracao:'', prox_revisao:'' })
  const [salvandoMedico, setSalvandoMedico] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data:{ session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data:user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)
    setEmpresaId(empId)
    supabase.from('empresas').select('razao_social,cnpj').eq('id', empId).single()
      .then(({ data: emp }) => { if (emp) { setNomeEmpresa(emp.razao_social); setCnpjEmpresa(emp.cnpj) } })

    const [funcsRes, ltcatRes, ghesRes, asosRes, progRes, medicoRes] = await Promise.all([
      supabase.from('funcionarios').select('id,nome,cpf,funcao,setor,matricula_esocial').eq('empresa_id', empId).eq('ativo',true).order('nome').limit(2000),
      supabase.from('ltcats').select('*').eq('empresa_id', empId).eq('ativo',true).order('data_emissao',{ascending:false}).limit(1).maybeSingle(),
      supabase.from('ghes').select('*').eq('empresa_id', empId).eq('ativo', true).order('criado_em'),
      supabase.from('asos').select('funcionario_id,tipo_aso,data_exame,prox_exame,conclusao,exames').eq('empresa_id', empId).order('data_exame',{ascending:false}).limit(5000),
      supabase.from('pcmso_programa').select('*').eq('empresa_id', empId).order('funcao').limit(200),
      supabase.from('pcmso_dados').select('*').eq('empresa_id', empId).maybeSingle(),
    ])

    setFuncionarios(funcsRes.data || [])
    setLtcatAtivo(ltcatRes.data || null)
    setGhesCadastro(ghesRes.data || [])
    setAsos(asosRes.data || [])
    setPrograma(progRes.data || [])
    setMedico(medicoRes.data || null)
    setCarregando(false)
  }

  function abrirEdicaoMedico() {
    setFormMedico(medico ? { ...medico } : { medico_nome:'', medico_cpf:'', medico_crm:'', data_elaboracao:'', prox_revisao:'' })
    setEditandoMedico(true)
    setSucesso(''); setErro('')
  }

  async function salvarMedico() {
    if (!formMedico.medico_nome) { setErro('Informe o nome do médico coordenador.'); return }
    setSalvandoMedico(true); setErro(''); setSucesso('')

    const dados = {
      empresa_id: empresaId,
      medico_nome: formMedico.medico_nome,
      medico_cpf: formMedico.medico_cpf || null,
      medico_crm: formMedico.medico_crm || null,
      data_elaboracao: formMedico.data_elaboracao || null,
      prox_revisao: formMedico.prox_revisao || null,
      atualizado_em: new Date().toISOString(),
    }
    const { error } = await supabase.from('pcmso_dados').upsert(dados, { onConflict: 'empresa_id' })

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso('Dados do médico coordenador salvos!')
      setEditandoMedico(false)
      await init()
    }
    setSalvandoMedico(false)
  }

  function ultimoAso(funcId) {
    return asos.filter(a => a.funcionario_id === funcId).sort((a,b) => new Date(b.data_exame)-new Date(a.data_exame))[0] || null
  }

  function statusAso(aso) {
    if (!aso) return { label:'Sem ASO', cor:'#E24B4A', bg:'#FCEBEB' }
    if (!aso.prox_exame) return { label:'Sem próximo exame', cor:'#EF9F27', bg:'#FAEEDA' }
    const dias = Math.round((new Date(aso.prox_exame) - new Date()) / 86400000)
    if (dias < 0) return { label:`Vencido há ${Math.abs(dias)}d`, cor:'#E24B4A', bg:'#FCEBEB' }
    if (dias <= 30) return { label:`Vence em ${dias}d`, cor:'#E24B4A', bg:'#FCEBEB' }
    if (dias <= 60) return { label:`Vence em ${dias}d`, cor:'#EF9F27', bg:'#FAEEDA' }
    return { label:'Em dia', cor:'#1D9E75', bg:'#EAF3DE' }
  }

  // GHE sugerido para pré-selecionar ao abrir um novo programa — só um palpite
  // inicial por setor; o vínculo real fica em formFunc.ghe_id, escolhido pelo usuário.
  function gheSugeridoParaFuncionario(func) {
    for (const ghe of ghesCadastro) {
      const setorGHE = (ghe.setor||'').toLowerCase()
      const setorFunc = (func.setor||'').toLowerCase()
      if (setorGHE && setorFunc && (setorGHE.includes(setorFunc) || setorFunc.includes(setorGHE))) {
        return ghe
      }
    }
    return null
  }

  function examesRecomendados(riscos) {
    const set = new Set(['Avaliação clínica'])
    riscos.forEach(r => (EXAMES_POR_RISCO[r.tipo]||[]).forEach(e => set.add(e)))
    return [...set]
  }

  // Recalcula os riscos do formulário a partir do GHE vinculado no cadastro central
  function atualizarRiscosDoCadastro() {
    const ghe = ghesCadastro.find(g => g.id === formFunc.ghe_id)
    if (!ghe) { setErro('Selecione um GHE vinculado primeiro.'); return }
    setFormFunc(p => ({ ...p, riscos: (ghe.riscos||[]).map(r => r.nome) }))
    setSucesso(`Riscos atualizados a partir do GHE "${ghe.nome}".`)
  }

  // Abrir formulário de novo programa para função
  function abrirNovoPrograma(func) {
    const gheSugerido = gheSugeridoParaFuncionario(func)
    const riscos = gheSugerido?.riscos || []
    const examesRec = examesRecomendados(riscos)
    const progExistente = programa.find(p => p.funcao === func.funcao && p.setor === func.setor)

    setEditandoFunc(func)
    setFormFunc({
      funcao: func.funcao || '',
      setor: func.setor || '',
      ghe_id: gheSugerido?.id || null,
      riscos: riscos.map(r => r.nome),
      exames: progExistente?.exames || examesRec.map(e => ({ nome:e, tipos:['admissional','periodico'], obrigatorio:true }))
    })
    setAba('novo')
  }

  function addExame() {
    if (!novoExame.nome) return
    setFormFunc(p => ({ ...p, exames: [...p.exames, { ...novoExame }] }))
    setNovoExame({ nome:'', periodicidade:'Anual', obrigatorio:true })
  }

  function removerExame(i) {
    setFormFunc(p => ({ ...p, exames: p.exames.filter((_,idx) => idx!==i) }))
  }

  async function salvarPrograma() {
    if (!formFunc.funcao) { setErro('Informe a função.'); return }
    if (!formFunc.exames.length) { setErro('Adicione ao menos um exame.'); return }
    setSalvandoProg(true); setErro(''); setSucesso('')

    const dados = {
      empresa_id: empresaId,
      funcao: formFunc.funcao,
      setor: formFunc.setor,
      ghe_id: formFunc.ghe_id || null,
      riscos: formFunc.riscos,
      exames: formFunc.exames,
      atualizado_em: new Date().toISOString(),
    }

    // Verificar se já existe
    const existente = programa.find(p => p.funcao === formFunc.funcao && p.setor === formFunc.setor)
    let error
    if (existente) {
      ;({ error } = await supabase.from('pcmso_programa').update(dados).eq('id', existente.id))
    } else {
      ;({ error } = await supabase.from('pcmso_programa').insert(dados))
    }

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso(`Programa salvo para ${formFunc.funcao}!`)
      await init()
      setAba('programa')
    }
    setSalvandoProg(false)
  }

  async function excluirPrograma(id) {
    if (!confirm('Excluir este programa?')) return
    await supabase.from('pcmso_programa').delete().eq('id', id)
    init()
  }

  const setores = [...new Set(funcionarios.map(f => f.setor).filter(Boolean))]
  const funcsFiltradas = filtroSetor ? funcionarios.filter(f => f.setor === filtroSetor) : funcionarios
  const totalEmDia = funcionarios.filter(f => statusAso(ultimoAso(f.id)).label === 'Em dia').length
  const conformidade = funcionarios.length > 0 ? Math.round((totalEmDia/funcionarios.length)*100) : 100

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="pcmso">
      <Head><title>PCMSO — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>PCMSO</div>
          <div style={s.sub}>Programa de Controle Médico de Saúde Ocupacional · NR-7</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button style={s.btnOutline} onClick={() => {
            gerarPdfPcmso(
              { dados_gerais: { medico_nome: medico?.medico_nome || '', medico_crm: medico?.medico_crm || '', medico_cpf: medico?.medico_cpf || '', data_elaboracao: medico?.data_elaboracao }, programas: programa },
              { razao_social: nomeEmpresa, cnpj: cnpjEmpresa }
            )
          }}>📄 Exportar PDF</button>
          <button style={s.btnOutline} onClick={() => router.push('/importar')}>↑ Importar PDF</button>
          <button style={s.btnPrimary} onClick={() => {
            setEditandoFunc(null)
            setFormFunc({ funcao:'', setor:'', ghe_id:null, riscos:[], exames:[] })
            setAba('novo')
          }}>+ Novo manual</button>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro    && <div style={s.erroBox}>{erro}</div>}

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1.25rem' }}>
        {[
          { n: funcionarios.length,  l:'Funcionários',   c:'#185FA5' },
          { n: conformidade+'%',     l:'ASOs em dia',    c: conformidade<80?'#E24B4A':'#1D9E75' },
          { n: programa.length,      l:'Programas por função', c:'#185FA5' },
          { n: ltcatAtivo?'Vigente':'Ausente', l:'LTCAT', c: ltcatAtivo?'#1D9E75':'#E24B4A' },
        ].map((k,i) => (
          <div key={i} style={s.kpiCard}>
            <div style={{ fontSize:22, fontWeight:700, color:k.c }}>{k.n}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Médico coordenador */}
      <div style={{ ...s.card, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={s.cardTit}>Médico coordenador</div>
            {medico ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginTop:8 }}>
                {[
                  { l:'Nome', v: medico.medico_nome||'—' },
                  { l:'CPF', v: medico.medico_cpf||'—' },
                  { l:'CRM', v: medico.medico_crm||'—' },
                ].map((it,i) => (
                  <div key={i}>
                    <div style={{ fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase' }}>{it.l}</div>
                    <div style={{ fontSize:13, fontWeight:500, color:'#111', marginTop:2 }}>{it.v}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize:12, color:'#E24B4A', marginTop:6 }}>Nenhum médico coordenador cadastrado.</div>
            )}
          </div>
          <button style={{ ...s.btnAcao, flexShrink:0 }} onClick={abrirEdicaoMedico}>
            {medico ? 'Editar' : '+ Cadastrar médico'}
          </button>
        </div>

        {editandoMedico && (
          <div style={{ marginTop:14, paddingTop:14, borderTop:'0.5px solid #e5e7eb' }}>
            <div style={s.row2}>
              <div>
                <label style={s.label}>Nome do médico *</label>
                <input style={s.input} value={formMedico.medico_nome} onChange={e => setFormMedico({...formMedico, medico_nome:e.target.value})} placeholder="Nome do médico coordenador"/>
              </div>
              <div>
                <label style={s.label}>CRM</label>
                <input style={s.input} value={formMedico.medico_crm} onChange={e => setFormMedico({...formMedico, medico_crm:e.target.value})} placeholder="Ex: 123456-SP"/>
              </div>
            </div>
            <div style={s.row2}>
              <div>
                <label style={s.label}>CPF</label>
                <input style={s.input} value={formMedico.medico_cpf} onChange={e => setFormMedico({...formMedico, medico_cpf:formatarCPF(e.target.value)})} placeholder="000.000.000-00"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={s.label}>Data de elaboração</label>
                  <input type="date" style={s.input} value={formMedico.data_elaboracao||''} onChange={e => setFormMedico({...formMedico, data_elaboracao:e.target.value})}/>
                </div>
                <div>
                  <label style={s.label}>Próxima revisão</label>
                  <input type="date" style={s.input} value={formMedico.prox_revisao||''} onChange={e => setFormMedico({...formMedico, prox_revisao:e.target.value})}/>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button style={s.btnPrimary} onClick={salvarMedico} disabled={salvandoMedico}>{salvandoMedico ? 'Salvando...' : 'Salvar'}</button>
              <button style={s.btnOutline} onClick={() => setEditandoMedico(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Abas */}
      <div style={{ display:'flex', gap:4, borderBottom:'0.5px solid #e5e7eb', marginBottom:16 }}>
        {[
          { k:'programa', l:`Programas por função (${programa.length})` },
          { k:'funcionarios', l:`Monitoramento (${funcionarios.length})` },
        ].map(ab => (
          <button key={ab.k} onClick={() => setAba(ab.k)} style={{
            padding:'8px 16px', fontSize:13, fontWeight: aba===ab.k?600:400,
            background:'transparent', border:'none', cursor:'pointer',
            borderBottom: aba===ab.k?'2px solid #185FA5':'2px solid transparent',
            color: aba===ab.k?'#185FA5':'#6b7280',
          }}>{ab.l}</button>
        ))}
      </div>

      {/* ABA: Programas por função */}
      {aba === 'programa' && (
        <div>
          {programa.length === 0 ? (
            <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:14, color:'#374151', marginBottom:8 }}>Nenhum programa cadastrado</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>
                Defina os exames obrigatórios por função/setor
              </div>
              <button style={s.btnPrimary} onClick={() => { setFormFunc({funcao:'',setor:'',ghe_id:null,riscos:[],exames:[]}); setAba('novo') }}>
                + Criar primeiro programa
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {programa.map(prog => {
                const exNorm = normalizeExames(prog)
                const todosEx = todosExamesGhe({ ...prog, exames: exNorm })
                const riscos = todosRiscos(prog.riscos)
                const funcoes = prog.funcoes?.length ? prog.funcoes : [prog.funcao]
                return (
                <div key={prog.id} style={s.card}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#111' }}>{prog.funcao}</div>
                      <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>
                        Funções: {funcoes.join(' · ')}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:5 }}>
                      <button style={s.btnAcao} onClick={() => {
                        setEditandoFunc({ funcao:prog.funcao, setor:prog.setor })
                        setFormFunc({ funcao:prog.funcao, setor:prog.setor, ghe_id: prog.ghe_id || null, riscos: Array.isArray(prog.riscos)?prog.riscos:todosRiscos(prog.riscos), exames: Object.entries(exNorm).flatMap(([t,lista])=>lista.map(ex=>({...ex,tipos:[t]}))) })
                        setAba('novo')
                      }}>Editar</button>
                      <button style={{ ...s.btnAcao, color:'#E24B4A', borderColor:'#F09595' }} onClick={() => excluirPrograma(prog.id)}>Excluir</button>
                    </div>
                  </div>

                  {/* Riscos */}
                  {riscos.length > 0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={s.secLabel}>Riscos</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {riscos.slice(0,4).map((r,i) => (
                          <span key={i} style={{ padding:'2px 8px', borderRadius:99, fontSize:10, background:'#FAEEDA', color:'#633806' }}>{r}</span>
                        ))}
                        {riscos.length > 4 && <span style={{ fontSize:10, color:'#9ca3af' }}>+{riscos.length-4}</span>}
                      </div>
                    </div>
                  )}

                  {/* Tabela de exames por tipo */}
                  <div>
                    <div style={s.secLabel}>Exames por tipo de consulta</div>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead>
                          <tr>
                            {TIPOS_CONSULTA.map(tc => (
                              <th key={tc.key} style={{ padding:'4px 6px', textAlign:'left', fontWeight:600, fontSize:10, color:tc.cor, background:tc.bg, borderRadius:4, whiteSpace:'nowrap', border:'1px solid #f3f4f6' }}>
                                {tc.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {TIPOS_CONSULTA.map(tc => (
                              <td key={tc.key} style={{ padding:'4px 6px', verticalAlign:'top', border:'1px solid #f3f4f6', minWidth:90 }}>
                                {(exNorm[tc.key]||[]).map((ex,i) => (
                                  <div key={i} style={{ fontSize:11, color:'#374151', lineHeight:1.5 }}>
                                    • {ex.nome || ex}
                                    {ex.codigo_t27 && <span style={{ fontSize:9, color:'#9ca3af', marginLeft:3 }}>[{ex.codigo_t27}]</span>}
                                  </div>
                                ))}
                                {!(exNorm[tc.key]?.length) && <span style={{ color:'#d1d5db', fontSize:10 }}>—</span>}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop:6, fontSize:11, color:'#9ca3af' }}>
                      {todosEx.length} exame(s) únicos · {funcoes.length} função(ões) · {funcionarios.filter(f=>funcoes.includes(f.funcao)).length} funcionário(s)
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA: Monitoramento por funcionário */}
      {aba === 'funcionarios' && (
        <div>
          <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
            <button onClick={() => setFiltroSetor('')} style={{ ...s.filtroBtn, background:!filtroSetor?'#185FA5':'#f3f4f6', color:!filtroSetor?'#fff':'#374151' }}>
              Todos ({funcionarios.length})
            </button>
            {setores.map(st => (
              <button key={st} onClick={() => setFiltroSetor(st)} style={{ ...s.filtroBtn, background:filtroSetor===st?'#185FA5':'#f3f4f6', color:filtroSetor===st?'#fff':'#374151' }}>
                {st} ({funcionarios.filter(f=>f.setor===st).length})
              </button>
            ))}
          </div>

          <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
            <table style={s.table}>
              <thead>
                <tr style={{ background:'#f9fafb' }}>
                  {['Funcionário','Função / Setor','Programa PCMSO','Último ASO','Próximo exame','Status','Ação'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funcsFiltradas.map(f => {
                  const aso = ultimoAso(f.id)
                  const st = statusAso(aso)
                  const prog = programa.find(p => p.funcao === f.funcao && (!p.setor || p.setor === f.setor))
                    || programa.find(p => p.funcao === f.funcao)
                  return (
                    <tr key={f.id} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                      <td style={s.td}>
                        <div style={{ fontWeight:500 }}>{f.nome}</div>
                        <div style={{ fontSize:11, color:'#9ca3af' }}>{f.matricula_esocial}</div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontSize:13 }}>{f.funcao || '—'}</div>
                        <div style={{ fontSize:11, color:'#6b7280' }}>{f.setor || '—'}</div>
                      </td>
                      <td style={s.td}>
                        {prog ? (
                          <div>
                            <span style={{ fontSize:11, color:'#1D9E75', fontWeight:500 }}>✓ {todosExamesGhe({...prog, exames:normalizeExames(prog)}).length} exames definidos</span>
                            <div style={{ fontSize:10, color:'#9ca3af' }}>
                              {prog.exames?.slice(0,2).map(e=>e.nome).join(', ')}{prog.exames?.length>2?'...':''}
                            </div>
                          </div>
                        ) : (
                          <button style={{ ...s.btnAcao, color:'#185FA5', borderColor:'#B5D4F4', fontSize:11 }}
                            onClick={() => abrirNovoPrograma(f)}>
                            + Criar programa
                          </button>
                        )}
                      </td>
                      <td style={s.td}>
                        {aso ? (
                          <div style={{ fontSize:12 }}>
                            {new Date(aso.data_exame+'T12:00:00').toLocaleDateString('pt-BR')}
                            <div style={{ fontSize:10, color:'#9ca3af' }}>{aso.tipo_aso}</div>
                          </div>
                        ) : <span style={{ color:'#9ca3af', fontSize:12 }}>—</span>}
                      </td>
                      <td style={s.td}>
                        {aso?.prox_exame
                          ? <span style={{ fontSize:12 }}>{new Date(aso.prox_exame+'T12:00:00').toLocaleDateString('pt-BR')}</span>
                          : <span style={{ color:'#9ca3af', fontSize:12 }}>—</span>}
                      </td>
                      <td style={s.td}>
                        <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:st.bg, color:st.cor }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={s.td}>
                        <button style={{ ...s.btnAcao, color:'#185FA5', borderColor:'#B5D4F4' }}
                          onClick={() => router.push(`/s2220?func=${f.id}`)}>
                          {aso ? 'Novo ASO' : 'Agendar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA: Novo/Editar programa */}
      {aba === 'novo' && (
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={s.cardTit}>
              {editandoFunc ? `Editar programa — ${formFunc.funcao}` : 'Novo programa de exames'}
            </div>
            <button onClick={() => setAba('programa')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
          </div>

          <div style={s.row2}>
            <div>
              <label style={s.label}>Função / Cargo *</label>
              <input style={s.input} placeholder="Ex: Operador de Produção"
                value={formFunc.funcao} onChange={e => setFormFunc({...formFunc, funcao:e.target.value})} />
            </div>
            <div>
              <label style={s.label}>Setor / GHE</label>
              <input style={s.input} placeholder="Ex: Produção, Administrativo"
                value={formFunc.setor} onChange={e => setFormFunc({...formFunc, setor:e.target.value})} />
            </div>
          </div>

          {/* GHE vinculado (cadastro central) */}
          <div style={{ marginBottom:14 }}>
            <label style={s.label}>GHE vinculado (cadastro central)</label>
            <div style={{ display:'flex', gap:8 }}>
              <select style={{ ...s.input, flex:1 }} value={formFunc.ghe_id || ''} onChange={e => {
                const id = e.target.value || null
                const ghe = ghesCadastro.find(g => g.id === id)
                setFormFunc(p => ({ ...p, ghe_id: id, riscos: ghe ? (ghe.riscos||[]).map(r=>r.nome) : p.riscos }))
              }}>
                <option value="">— nenhum —</option>
                {ghesCadastro.map(g => <option key={g.id} value={g.id}>{g.nome}{g.setor ? ` (${g.setor})` : ''}</option>)}
              </select>
              <button style={s.btnOutline} onClick={atualizarRiscosDoCadastro} disabled={!formFunc.ghe_id}>↻ Atualizar riscos</button>
            </div>
            {!ghesCadastro.length && (
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:6 }}>Nenhum GHE cadastrado ainda. Cadastre em <strong>/ghes</strong> para vincular automaticamente.</div>
            )}
          </div>

          {/* Riscos vinculados */}
          <div style={{ marginBottom:14 }}>
            <label style={s.label}>Riscos vinculados a este programa</label>
            {formFunc.riscos.length > 0 ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {formFunc.riscos.map((r,i) => (
                  <span key={i} style={{ padding:'3px 10px', borderRadius:99, fontSize:11, background:'#FAEEDA', color:'#633806' }}>
                    {r}
                    <button onClick={() => setFormFunc(p=>({...p, riscos:p.riscos.filter((_,idx)=>idx!==i)}))}
                      style={{ marginLeft:6, background:'none', border:'none', cursor:'pointer', color:'#633806', fontSize:12 }}>×</button>
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum risco vinculado. Selecione um GHE acima.</div>
            )}
          </div>

          {/* Exames */}
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>Exames obrigatórios ({formFunc.exames.length})</label>
            </div>

            {formFunc.exames.map((ex,i) => {
              const tipos = tiposExame(ex)
              return (
                <div key={i} style={{ padding:'7px 0', borderBottom:'0.5px solid #f3f4f6' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <div style={{ flex:1, fontSize:13, color:'#111', fontWeight:500 }}>{ex.nome}</div>
                    <button onClick={() => removerExame(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {TIPOS_CONSULTA.map(tc => {
                      const ativo = tipos.includes(tc.key)
                      return (
                        <label key={tc.key} style={{ display:'flex', alignItems:'center', gap:3, cursor:'pointer', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:ativo?600:400, background:ativo?tc.bg:'#f3f4f6', color:ativo?tc.cor:'#9ca3af', border:`1px solid ${ativo?tc.cor:'transparent'}` }}>
                          <input type="checkbox" checked={ativo} style={{ display:'none' }}
                            onChange={e => {
                              const novos = e.target.checked ? [...tipos, tc.key] : tipos.filter(t=>t!==tc.key)
                              setFormFunc(p=>({...p, exames:p.exames.map((x,idx)=>idx===i?{...x,tipos:novos}:x)}))
                            }}/>
                          {tc.label}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Adicionar exame */}
            <div style={{ marginTop:10, padding:'12px', background:'#f9fafb', borderRadius:8 }}>
              <div style={{ fontSize:12, fontWeight:500, color:'#374151', marginBottom:8 }}>Adicionar exame</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <input style={s.input} list="exames-list" placeholder="Nome do exame..."
                    value={novoExame.nome} onChange={e => setNovoExame({...novoExame, nome:e.target.value})}
                    onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addExame())} />
                  <datalist id="exames-list">
                    {EXAMES_COMUNS.map(e => <option key={e} value={e}/>)}
                  </datalist>
                </div>
                <button style={s.btnOutline} onClick={addExame}>+ Adicionar</button>
              </div>
              <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                {TIPOS_CONSULTA.map(tc => {
                  const ativo = novoExame.tipos?.includes(tc.key)
                  return (
                    <label key={tc.key} style={{ display:'flex', alignItems:'center', gap:3, cursor:'pointer', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:ativo?600:400, background:ativo?tc.bg:'#f3f4f6', color:ativo?tc.cor:'#9ca3af', border:`1px solid ${ativo?tc.cor:'transparent'}` }}>
                      <input type="checkbox" checked={!!ativo} style={{ display:'none' }}
                        onChange={e => {
                          const ts = novoExame.tipos || []
                          setNovoExame({...novoExame, tipos: e.target.checked ? [...ts,tc.key] : ts.filter(t=>t!==tc.key)})
                        }}/>
                      {tc.label}
                    </label>
                  )
                })}
              </div>
              {/* Sugestões rápidas */}
              <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:4 }}>
                {EXAMES_COMUNS.filter(e => !formFunc.exames.find(ex=>ex.nome===e)).slice(0,6).map(e => (
                  <button key={e} onClick={() => {
                    setFormFunc(p => ({ ...p, exames: [...p.exames, { nome:e, tipos:['admissional','periodico'], obrigatorio:true }] }))
                  }} style={{ padding:'2px 8px', fontSize:11, background:'#E6F1FB', color:'#0C447C', border:'none', borderRadius:99, cursor:'pointer' }}>
                    + {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {erro && <div style={s.erroBox}>{erro}</div>}

          <div style={{ display:'flex', gap:8 }}>
            <button style={s.btnPrimary} onClick={salvarPrograma} disabled={salvandoProg}>
              {salvandoProg ? 'Salvando...' : 'Salvar programa'}
            </button>
            <button style={s.btnOutline} onClick={() => setAba('programa')}>Cancelar</button>
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
  kpiCard:    { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1rem' },
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' },
  cardTit:    { fontSize:13, fontWeight:600, color:'#111' },
  secLabel:   { fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 },
  row2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 },
  label:      { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 },
  input:      { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:         { padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'#6b7280', borderBottom:'0.5px solid #e5e7eb', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' },
  td:         { padding:'10px 12px', verticalAlign:'middle', color:'#374151' },
  filtroBtn:  { padding:'5px 12px', fontSize:11, fontWeight:500, borderRadius:99, cursor:'pointer', border:'none' },
  btnAcao:    { padding:'3px 10px', fontSize:11, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151' },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
}
