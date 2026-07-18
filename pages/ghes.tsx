import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'
import { ESOCIAL_TABELA24 } from '../lib/esocial-tabela24'
import { sugerirParaRisco } from '../lib/pgr-sugestoes'
import { sugerirAnexoIV } from '../lib/ltcat-anexo-iv'
import { AGENTES_POR_TIPO } from '../lib/agentes-risco'
import { SEVERIDADE_OPCOES, PROBABILIDADE_OPCOES, TRAJETORIA_OPCOES, TIPO_EXPOSICAO_OPCOES, nivelRisco } from '../lib/pgr-conteudo'

const TIPO_AGENTE = { fis:'Físico', qui:'Químico', bio:'Biológico', erg:'Ergonômico', aci:'Acidentes', psi:'Psicossocial' }
const COR_AGENTE  : Record<string,string> = { fis:'#E6F1FB', qui:'#FAEEDA', bio:'#EAF3DE', erg:'#FCEBEB', aci:'#FDEBD3', psi:'#EDE6FB' }
const TXT_AGENTE  : Record<string,string> = { fis:'#0C447C', qui:'#633806', bio:'#27500A', erg:'#791F1F', aci:'#8A4B08', psi:'#4B2C82' }

const gheVazio = () => ({
  nome: '', setor: '', qtd_trabalhadores: 1, aposentadoria_especial: false,
  periculosidade: false, insalubridade: false, horario_funcionamento: '',
  riscos: [] as any[], epc: [] as any[], epi: [] as any[], funcoes: [] as any[],
})
const riscoVazio = () => ({
  id: crypto.randomUUID(), tipo:'fis', nome:'', perigo:'', fontes_circunstancias:'',
  valor:'', limite:'', unidade:'', supera_lt:false, medicao_quantitativa:false, metodologia:'',
  codigo_esocial:'', fonte_geradora:'', danos_saude:'',
  severidade:'' as number | '', probabilidade:'' as number | '', trajetoria:'', tipo_exposicao:'',
})
const epiVazio = () => ({ nome:'', ca:'', atenuacao:'', eficaz:true })
const epcVazio = () => ({ nome:'', eficaz:true })
const funcaoVazia = () => ({ nome:'', cbo:'', nivel:'Pleno', atividades:'', requisitos:'' })

function nomeDaFuncao(f: any) { return typeof f === 'string' ? f : (f?.nome || '') }
function normalizarFuncao(f: any) {
  if (typeof f === 'string') return { nome: f, cbo:'', nivel:'Pleno', atividades:'', requisitos:'' }
  return { nome: f.nome||'', cbo: f.cbo||'', nivel: f.nivel||'Pleno', atividades: f.atividades||'', requisitos: f.requisitos||'' }
}

export default function Ghes() {
  const router = useRouter()
  const [_empresaId, setEmpresaId] = useState('')
  const [ghesLista, setGhesLista] = useState<any[]>([])
  const [todosFunc, setTodosFunc] = useState<any[]>([])
  const [gheSel, setGheSel] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [formGhe, setFormGhe] = useState<any>(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const [importAberto, setImportAberto] = useState(false)
  const [buscandoImport, setBuscandoImport] = useState(false)
  const [candidatos, setCandidatos] = useState<any[]>([])
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [importando, setImportando] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, (user as any).empresa_id)
    setEmpresaId(empId)
    const { data } = await supabase.from('ghes').select('*').eq('empresa_id', empId).eq('ativo', true).order('criado_em')
    setGhesLista(data || [])
    if (data && data.length > 0) setGheSel(data[0])
    const { data: funcs } = await supabase.from('funcionarios').select('id,nome,funcao,setor,ghe_uuid').eq('empresa_id', empId).eq('ativo', true)
    setTodosFunc(funcs || [])
    setCarregando(false)
  }

  function abrirEdicao(g: any) {
    setFormGhe(JSON.parse(JSON.stringify(g)))
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function criarNovoGhe() {
    setFormGhe(gheVazio())
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function cancelarEdicao() {
    setModoEdicao(false)
    setFormGhe(null)
  }

  function normalizarRisco(r: any) {
    return {
      id: crypto.randomUUID(), tipo: r.tipo || 'fis', nome: r.nome || '',
      perigo: r.perigo || '', fontes_circunstancias: r.fontes_circunstancias || '',
      valor: r.valor || '', limite: r.limite || '', unidade: r.unidade || '',
      supera_lt: !!r.supera_lt, medicao_quantitativa: !!r.medicao_quantitativa,
      metodologia: r.metodologia || '', codigo_esocial: r.codigo_t24 || r.codigo_esocial || '',
      fonte_geradora: r.equipamento || r.fonte_geradora || '',
      danos_saude: r.danos_saude || r.possiveis_danos || '',
      severidade: r.severidade || '', probabilidade: r.probabilidade || '',
      trajetoria: r.trajetoria || '', tipo_exposicao: r.tipo_exposicao || '',
    }
  }

  async function abrirImportar() {
    setImportAberto(true)
    setBuscandoImport(true)
    setErro(''); setSucesso('')

    const [{ data: pgrs }, { data: lts }] = await Promise.all([
      supabase.from('pgr').select('inventario').eq('empresa_id', _empresaId).order('criado_em', { ascending: false }).limit(1),
      supabase.from('ltcats').select('ghes').eq('empresa_id', _empresaId).order('data_emissao', { ascending: false }).limit(1),
    ])

    const inventarioPgr = pgrs?.[0]?.inventario || []
    const ghesLtcat = lts?.[0]?.ghes || []

    const doLtcat = ghesLtcat.map((g: any) => ({
      origem: 'LTCAT',
      nome: g.nome || g.setor || 'GHE sem nome',
      setor: g.setor || g.nome || '',
      qtd_trabalhadores: g.qtd_trabalhadores || 1,
      aposentadoria_especial: !!g.aposentadoria_especial,
      horario_funcionamento: g.horario_funcionamento || '',
      funcoes: (g.funcoes || []).map(normalizarFuncao).filter((f: any) => f.nome),
      riscos: (g.agentes || g.riscos || []).map(normalizarRisco),
      epc: g.epc || [],
      epi: (g.epi || []).map((e: any) => ({ nome: e.nome || '', ca: e.ca || '', atenuacao: e.atenuacao || '', eficaz: e.eficaz !== false })),
    }))

    const doPgr = inventarioPgr.map((g: any) => ({
      origem: 'PGR',
      nome: g.nome || g.ambientes_relacionados || 'GHE sem nome',
      setor: g.ambientes_relacionados || g.nome || '',
      qtd_trabalhadores: parseInt(g.numero_empregados) || 1,
      aposentadoria_especial: false,
      horario_funcionamento: g.jornada_trabalho || '',
      funcoes: (g.funcoes || []).map(normalizarFuncao).filter((f: any) => f.nome),
      riscos: (g.riscos || []).map(normalizarRisco),
      epc: [],
      epi: (g.epis || []).map((e: any) => ({ nome: e.nome || '', ca: '', atenuacao: e.atenuacao || '', eficaz: e.eficaz !== false })),
    }))

    const todos = [...doLtcat, ...doPgr]
    setCandidatos(todos)
    setSelecionados(new Set(todos.map((_, i) => i)))
    setBuscandoImport(false)
  }

  function alternarSelecionado(i: number) {
    setSelecionados(prev => {
      const novo = new Set(prev)
      if (novo.has(i)) novo.delete(i); else novo.add(i)
      return novo
    })
  }

  function fecharImportar() {
    setImportAberto(false)
    setCandidatos([])
    setSelecionados(new Set())
  }

  async function confirmarImport() {
    const linhas = candidatos.filter((_, i) => selecionados.has(i)).map(c => ({
      empresa_id: _empresaId,
      nome: c.nome, setor: c.setor, qtd_trabalhadores: c.qtd_trabalhadores || 1,
      aposentadoria_especial: !!c.aposentadoria_especial,
      horario_funcionamento: c.horario_funcionamento || '',
      funcoes: c.funcoes || [], riscos: c.riscos || [], epc: c.epc || [], epi: c.epi || [],
      ativo: true,
    }))
    if (!linhas.length) { fecharImportar(); return }

    setImportando(true)
    const { error } = await supabase.from('ghes').insert(linhas)
    if (error) { setErro('Erro ao importar: ' + error.message) }
    else {
      setSucesso(`${linhas.length} GHE(s) importado(s) com sucesso! Revise os dados e ajuste o que for necessário.`)
      fecharImportar()
      await init()
    }
    setImportando(false)
  }

  async function salvarEdicao() {
    setSalvando(true); setErro(''); setSucesso('')
    const dados = {
      nome: formGhe.nome || '',
      setor: formGhe.setor || '',
      qtd_trabalhadores: formGhe.qtd_trabalhadores || 1,
      aposentadoria_especial: !!formGhe.aposentadoria_especial,
      periculosidade: !!formGhe.periculosidade,
      insalubridade: !!formGhe.insalubridade,
      horario_funcionamento: formGhe.horario_funcionamento || '',
      funcoes: formGhe.funcoes || [],
      riscos: formGhe.riscos || [],
      epc: formGhe.epc || [],
      epi: formGhe.epi || [],
      atualizado_em: new Date().toISOString(),
    }

    const { error } = formGhe.id
      ? await supabase.from('ghes').update(dados).eq('id', formGhe.id)
      : await supabase.from('ghes').insert({ ...dados, empresa_id: _empresaId })

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso(formGhe.id ? 'GHE atualizado com sucesso!' : 'GHE criado com sucesso!')
      setModoEdicao(false)
      setFormGhe(null)
      await init()
    }
    setSalvando(false)
  }

  async function desativar(id: string) {
    if (!confirm('Arquivar este GHE? Ele deixa de aparecer nas sincronizações dos documentos.')) return
    await supabase.from('ghes').update({ ativo: false }).eq('id', id)
    setGheSel(null)
    init()
  }

  async function excluirGhe(id: string) {
    if (!confirm('EXCLUIR este GHE permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('ghes').delete().eq('id', id)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setSucesso('GHE excluído.')
    setGheSel(null)
    init()
  }

  // Helpers de edição — riscos
  function addRisco() {
    setFormGhe((p: any) => ({ ...p, riscos: [...(p.riscos||[]), riscoVazio()] }))
  }

  function setRisco(ri: number, field: string, value: any) {
    setFormGhe((p: any) => {
      const riscos = JSON.parse(JSON.stringify(p.riscos))
      riscos[ri][field] = value
      return { ...p, riscos }
    })
  }

  function removeRisco(ri: number) {
    setFormGhe((p: any) => ({ ...p, riscos: p.riscos.filter((_: any, idx: number) => idx !== ri) }))
  }

  function aoSairDoNomeRisco(ri: number) {
    setFormGhe((p: any) => {
      const riscos = JSON.parse(JSON.stringify(p.riscos))
      if (!riscos[ri].codigo_esocial) {
        const sugestao = sugerirParaRisco(riscos[ri].nome)
        if (sugestao) riscos[ri].codigo_esocial = sugestao.codigo_esocial
      }
      return { ...p, riscos }
    })
  }

  // Helpers de edição — EPI/EPC
  function addEPI() {
    setFormGhe((p: any) => ({ ...p, epi: [...(p.epi||[]), epiVazio()] }))
  }
  function setEPI(ei: number, field: string, value: any) {
    setFormGhe((p: any) => {
      const epi = JSON.parse(JSON.stringify(p.epi))
      epi[ei][field] = value
      return { ...p, epi }
    })
  }
  function addEPC() {
    setFormGhe((p: any) => ({ ...p, epc: [...(p.epc||[]), epcVazio()] }))
  }
  function setEPC(ei: number, field: string, value: any) {
    setFormGhe((p: any) => {
      const epc = JSON.parse(JSON.stringify(p.epc))
      epc[ei][field] = value
      return { ...p, epc }
    })
  }

  // Helpers de edição — Funções/cargos
  function addFuncao() {
    setFormGhe((p: any) => ({ ...p, funcoes: [...(p.funcoes||[]), funcaoVazia()] }))
  }
  function setFuncao(fi: number, field: string, value: any) {
    setFormGhe((p: any) => {
      const funcoes = JSON.parse(JSON.stringify(p.funcoes))
      funcoes[fi][field] = value
      return { ...p, funcoes }
    })
  }
  function removeFuncao(fi: number) {
    setFormGhe((p: any) => ({ ...p, funcoes: p.funcoes.filter((_: any, i: number) => i !== fi) }))
  }

  function funcionariosDoGhe(g: any) {
    if (!g) return []
    return todosFunc.filter(f => {
      if (f.ghe_uuid) return f.ghe_uuid === g.id
      const sg = (g.setor||'').toLowerCase()
      const sf = (f.setor||'').toLowerCase()
      return sg && sf && (sg.includes(sf) || sf.includes(sg))
    })
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="ghes">
      <Head><title>Cadastro de GHEs — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>Cadastro de GHEs e Riscos</div>
          <div style={s.sub}>Fonte única de dados para LTCAT, PGR e PCMSO — cadastre aqui e sincronize em cada documento</div>
        </div>
        {!modoEdicao && !importAberto && (
          <div style={{ display:'flex', gap:8 }}>
            <button style={s.btnOutline} onClick={abrirImportar}>⬇ Importar do PGR/LTCAT</button>
            <button style={s.btnPrimary} onClick={criarNovoGhe}>+ Novo GHE</button>
          </div>
        )}
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro    && <div style={s.erroBox}>{erro}</div>}

      {importAberto && (
        <div style={{ ...s.card, border:'1.5px solid #185FA5', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>Importar GHEs do PGR/LTCAT</div>
            <button onClick={fecharImportar} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
          </div>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:12 }}>
            Traz os GHEs e riscos já preenchidos no PGR e no LTCAT mais recentes desta empresa para o cadastro central. Revise a seleção antes de importar.
          </div>

          {buscandoImport ? (
            <div style={{ fontSize:13, color:'#6b7280' }}>Buscando dados no PGR e LTCAT...</div>
          ) : candidatos.length === 0 ? (
            <div style={s.emptySmall}>Nenhum GHE encontrado no PGR ou LTCAT desta empresa.</div>
          ) : (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                {candidatos.map((c, i) => (
                  <label key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, border:'0.5px solid #e5e7eb', borderRadius:8, padding:10, cursor:'pointer', background: selecionados.has(i) ? '#F5FAFF' : '#fff' }}>
                    <input type="checkbox" checked={selecionados.has(i)} onChange={() => alternarSelecionado(i)} style={{ marginTop:2 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ padding:'1px 7px', borderRadius:99, fontSize:10, fontWeight:600, background:'#E6F1FB', color:'#0C447C' }}>{c.origem}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'#111' }}>{c.nome}</span>
                      </div>
                      <div style={{ fontSize:11, color:'#6b7280', marginTop:3 }}>
                        {c.setor || '—'} · {c.riscos.length} risco(s){c.funcoes.length ? ` · ${c.funcoes.length} função(ões)` : ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button style={s.btnPrimary} onClick={confirmarImport} disabled={importando || selecionados.size === 0}>
                  {importando ? 'Importando...' : `Importar selecionados (${selecionados.size})`}
                </button>
                <button style={s.btnOutline} onClick={fecharImportar}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      )}

      {ghesLista.length === 0 && !modoEdicao && !importAberto ? (
        <div style={s.emptyCard}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="14,3 14,8 19,8"/>
          </svg>
          <div style={{ fontSize:14, fontWeight:500, color:'#374151', marginTop:12 }}>Nenhum GHE cadastrado</div>
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Cadastre os Grupos Homogêneos de Exposição da empresa uma única vez</div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button style={s.btnOutline} onClick={abrirImportar}>⬇ Importar do PGR/LTCAT</button>
            <button style={s.btnPrimary} onClick={criarNovoGhe}>+ Novo GHE</button>
          </div>
        </div>
      ) : !importAberto ? (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:14 }}>

          {/* Lista lateral */}
          <div>
            <div style={s.secLabel}>GHEs cadastrados</div>
            {ghesLista.map(g => {
              const ativo = g.id === (modoEdicao ? formGhe?.id : gheSel?.id)
              return (
                <div key={g.id} onClick={() => { if(!modoEdicao){ setGheSel(g) } }}
                  style={{ ...s.item, border: ativo?'1.5px solid #185FA5':'0.5px solid #e5e7eb', background: ativo?'#E6F1FB':'#fff', cursor: modoEdicao?'default':'pointer' }}>
                  <div style={{ fontSize:12, fontWeight:600, color: ativo?'#0C447C':'#111' }}>
                    {g.nome || 'GHE sem nome'}
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:3 }}>
                    {g.setor || '—'} · {(g.riscos||[]).length} risco(s)
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detalhe / Edição */}
          <div>
            {/* MODO VISUALIZAÇÃO */}
            {!modoEdicao && gheSel && (
              <div style={s.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#111' }}>{gheSel.nome || 'GHE sem nome'}</div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button style={{ ...s.btnPrimary, padding:'6px 14px', fontSize:12 }} onClick={() => abrirEdicao(gheSel)}>✏ Editar</button>
                    <button style={{ ...s.btnOutline, color:'#E24B4A', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }}
                      onClick={() => desativar(gheSel.id)}>Arquivar</button>
                    <button style={{ ...s.btnOutline, color:'#791F1F', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }}
                      onClick={() => excluirGhe(gheSel.id)}>🗑 Excluir</button>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                  {[
                    { l:'Setor', v: gheSel.setor||'—' },
                    { l:'Trabalhadores', v: gheSel.qtd_trabalhadores||'—' },
                    { l:'Horário de Funcionamento', v: gheSel.horario_funcionamento||'—' },
                    { l:'Riscos', v: (gheSel.riscos||[]).length },
                    { l:'Periculosidade', v: gheSel.periculosidade?'Sim':'Não' },
                    { l:'Insalubridade', v: gheSel.insalubridade?'Sim':'Não' },
                    { l:'Aposent. especial', v: gheSel.aposentadoria_especial?'Sim':'Não' },
                  ].map((it,i) => (
                    <div key={i} style={{ background:'#f9fafb', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase' }}>{it.l}</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#111', marginTop:2 }}>{it.v}</div>
                    </div>
                  ))}
                </div>

                {(gheSel.riscos||[]).length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={s.secLabel}>Riscos / agentes</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {gheSel.riscos.map((ag: any, i: number) => {
                        const nr = nivelRisco(ag.severidade, ag.probabilidade)
                        return (
                        <div key={ag.id||i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10, borderLeft:`3px solid ${TXT_AGENTE[ag.tipo]||'#6b7280'}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3, flexWrap:'wrap', gap:4 }}>
                            <span style={{ padding:'1px 7px', borderRadius:99, fontSize:10, fontWeight:600, background:COR_AGENTE[ag.tipo]||'#f3f4f6', color:TXT_AGENTE[ag.tipo]||'#374151' }}>
                              {(TIPO_AGENTE as any)[ag.tipo]||ag.tipo}
                            </span>
                            <div style={{ display:'flex', gap:4 }}>
                              {nr && <span style={{ padding:'1px 7px', borderRadius:99, fontSize:10, fontWeight:700, background:nr.bg, color:nr.cor }}>{nr.faixa} ({nr.valor})</span>}
                              {ag.supera_lt && <span style={{ fontSize:10, fontWeight:700, color:'#E24B4A' }}>⚠ Supera LT</span>}
                            </div>
                          </div>
                          <div style={{ fontSize:13, fontWeight:500, color:'#111' }}>{ag.nome}</div>
                          {ag.perigo && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>Perigo: {ag.perigo}</div>}
                          {ag.fontes_circunstancias && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>Fontes/circunstâncias: {ag.fontes_circunstancias}</div>}
                          {ag.medicao_quantitativa && (ag.valor||ag.limite) && (
                            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>
                              {ag.valor&&`Medido: ${ag.valor}${ag.unidade?' '+ag.unidade:''}`}{ag.valor&&ag.limite?' · ':''}{ag.limite&&`LT: ${ag.limite}`}
                            </div>
                          )}
                          {ag.metodologia && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Metodologia: {ag.metodologia}</div>}
                          {ag.fonte_geradora && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Equipamento: {ag.fonte_geradora}</div>}
                          {(ag.trajetoria || ag.tipo_exposicao) && (
                            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>
                              {ag.trajetoria && `Trajetória: ${ag.trajetoria}`}{ag.trajetoria && ag.tipo_exposicao ? ' · ' : ''}{ag.tipo_exposicao && `Exposição: ${ag.tipo_exposicao}`}
                            </div>
                          )}
                          {ag.danos_saude && <div style={{ fontSize:11, color:'#791F1F', marginTop:2 }}>Danos à saúde: {ag.danos_saude}</div>}
                          {ag.codigo_esocial && <div style={{ fontSize:10, color:'#9ca3af', marginTop:2, fontFamily:'monospace' }}>eSocial: {ag.codigo_esocial}</div>}
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {(() => {
                  const fncsVinculadas = funcionariosDoGhe(gheSel)
                  const nomesGhe = (gheSel.funcoes||[]).map(nomeDaFuncao).filter(Boolean)
                  const nomesFuncionarios = fncsVinculadas.map((f:any)=>f.funcao).filter(Boolean)
                  const todasFuncoes = [...new Set([...nomesGhe, ...nomesFuncionarios])]
                  if (!todasFuncoes.length) return null
                  return (
                    <div style={{ marginBottom:14 }}>
                      <div style={s.secLabel}>Funções/cargos neste GHE ({fncsVinculadas.length} funcionário(s) vinculado(s))</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {(gheSel.funcoes||[]).map((fn: any, i: number) => (
                          <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                              <span style={{ fontSize:13, fontWeight:600, color:'#111' }}>{fn.nome}</span>
                              {fn.cbo && <span style={{ fontSize:10, color:'#6b7280', fontFamily:'monospace' }}>CBO {fn.cbo}</span>}
                              {fn.nivel && <span style={{ padding:'1px 7px', borderRadius:99, fontSize:10, fontWeight:600, background:'#E6F1FB', color:'#0C447C' }}>{fn.nivel}</span>}
                            </div>
                            {fn.atividades && <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>{fn.atividades}</div>}
                            {fn.requisitos && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Requisitos: {fn.requisitos}</div>}
                          </div>
                        ))}
                        {nomesFuncionarios.filter(n => !nomesGhe.includes(n)).map((n,i) => (
                          <span key={`extra-${i}`} style={{ padding:'3px 10px', borderRadius:99, fontSize:11, background:'#f3f4f6', color:'#6b7280', width:'fit-content' }}>{n} (só no cadastro de funcionários)</span>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <div style={s.secLabel}>EPC</div>
                    {!gheSel.epc?.length ? <div style={s.emptySmall}>Nenhum EPC</div> : gheSel.epc.map((e: any,i: number) => (
                      <div key={i} style={s.epiRow}><span style={{ fontSize:14 }}>{e.eficaz?'✓':'✗'}</span><div><div style={{ fontSize:13 }}>{e.nome}</div><div style={{ fontSize:11, color:e.eficaz?'#1D9E75':'#E24B4A' }}>{e.eficaz?'Eficaz':'Ineficaz'}</div></div></div>
                    ))}
                  </div>
                  <div>
                    <div style={s.secLabel}>EPI</div>
                    {!gheSel.epi?.length ? <div style={s.emptySmall}>Nenhum EPI</div> : gheSel.epi.map((e: any,i: number) => (
                      <div key={i} style={s.epiRow}><span style={{ fontSize:14 }}>{e.eficaz?'✓':'✗'}</span><div><div style={{ fontSize:13 }}>{e.nome}</div><div style={{ fontSize:11, color:'#6b7280' }}>CA: {e.ca||'—'}{e.atenuacao?` · Atenuação: ${e.atenuacao}`:''}</div></div></div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop:14, padding:'8px 12px', background:'#f9fafb', borderRadius:8, fontSize:11, color:'#6b7280' }}>
                  Depois de editar aqui, use o botão &quot;Atualizar/Sincronizar do cadastro&quot; em LTCAT, PGR e PCMSO para trazer essas mudanças para cada documento.
                </div>
              </div>
            )}

            {/* MODO EDIÇÃO */}
            {modoEdicao && formGhe && (
              <div style={{ ...s.card, border:'1.5px solid #185FA5' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>✏ {formGhe.id ? 'Editando GHE' : 'Novo GHE'}</div>
                  <button onClick={cancelarEdicao} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
                </div>

                {/* Info básica do GHE */}
                <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr', gap:10, marginBottom:10 }}>
                  <div>
                    <label style={s.label}>Nome do GHE</label>
                    <input style={s.input} value={formGhe.nome||''} onChange={e=>setFormGhe((p:any)=>({...p,nome:e.target.value}))} placeholder="Ex: GHE 01 — Produção"/>
                  </div>
                  <div>
                    <label style={s.label}>Setor</label>
                    <input style={s.input} value={formGhe.setor||''} onChange={e=>setFormGhe((p:any)=>({...p,setor:e.target.value}))} placeholder="Ex: Linha de Produção"/>
                  </div>
                  <div>
                    <label style={s.label}>Qtd. trabalhadores</label>
                    <input style={s.input} type="number" min="1" value={formGhe.qtd_trabalhadores||1} onChange={e=>setFormGhe((p:any)=>({...p,qtd_trabalhadores:parseInt(e.target.value)||1}))}/>
                  </div>
                </div>
                <div style={{ marginBottom:10 }}>
                  <label style={s.label}>Horário de Funcionamento</label>
                  <input style={s.input} value={formGhe.horario_funcionamento||''} onChange={e=>setFormGhe((p:any)=>({...p,horario_funcionamento:e.target.value}))} placeholder="Ex: Seg/Sex 08:00-12:00/14:00-18:00, Sáb 08:00-12:00"/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
                  <div>
                    <label style={s.label}>Periculosidade</label>
                    <select style={s.input} value={formGhe.periculosidade?'sim':'nao'} onChange={e=>setFormGhe((p:any)=>({...p,periculosidade:e.target.value==='sim'}))}>
                      <option value="nao">Não</option><option value="sim">Sim</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Insalubridade</label>
                    <select style={s.input} value={formGhe.insalubridade?'sim':'nao'} onChange={e=>setFormGhe((p:any)=>({...p,insalubridade:e.target.value==='sim'}))}>
                      <option value="nao">Não</option><option value="sim">Sim</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Aposent. especial</label>
                    <select style={s.input} value={formGhe.aposentadoria_especial?'sim':'nao'} onChange={e=>setFormGhe((p:any)=>({...p,aposentadoria_especial:e.target.value==='sim'}))}>
                      <option value="nao">Não</option><option value="sim">Sim</option>
                    </select>
                  </div>
                </div>

                {/* Funções/Cargos */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={s.secLabel}>Funções/Cargos neste GHE</div>
                    <button style={{ ...s.btnOutline, padding:'3px 8px', fontSize:11 }} onClick={addFuncao}>+ Função</button>
                  </div>
                  <datalist id="funcoes-existentes">
                    {todosFunc.map(f=>f.funcao).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(fn=>(
                      <option key={fn} value={fn}/>
                    ))}
                  </datalist>
                  {(formGhe.funcoes||[]).map((fn: any, fi: number) => (
                    <div key={fi} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:8 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 30px', gap:8, marginBottom:6, alignItems:'center' }}>
                        <input style={s.input} value={fn.nome||''} onChange={e=>setFuncao(fi,'nome',e.target.value)} list="funcoes-existentes" placeholder="Nome da função (ex: Operador de Produção)"/>
                        <input style={s.input} value={fn.cbo||''} onChange={e=>setFuncao(fi,'cbo',e.target.value)} placeholder="CBO"/>
                        <select style={s.input} value={fn.nivel||'Pleno'} onChange={e=>setFuncao(fi,'nivel',e.target.value)}>
                          <option value="Junior">Junior</option>
                          <option value="Pleno">Pleno</option>
                          <option value="Senior">Senior</option>
                        </select>
                        <button onClick={()=>removeFuncao(fi)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:18, padding:0 }}>×</button>
                      </div>
                      <textarea style={{ ...s.input, minHeight:50, marginBottom:6, resize:'vertical' }} value={fn.atividades||''} onChange={e=>setFuncao(fi,'atividades',e.target.value)} placeholder="Descrição das atividades desta função"/>
                      <textarea style={{ ...s.input, minHeight:36, resize:'vertical' }} value={fn.requisitos||''} onChange={e=>setFuncao(fi,'requisitos',e.target.value)} placeholder="Requisitos do cargo (formação, experiência...)"/>
                    </div>
                  ))}
                  {!(formGhe.funcoes?.length) && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhuma função. Clique em + Função.</div>}
                </div>

                {/* Riscos */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={s.secLabel}>Riscos / agentes</div>
                    <button style={{ ...s.btnOutline, padding:'3px 8px', fontSize:11 }} onClick={addRisco}>+ Risco</button>
                  </div>
                  {(formGhe.riscos||[]).map((ag: any, ai: number) => {
                    const nr = nivelRisco(ag.severidade, ag.probabilidade)
                    return (
                    <div key={ag.id||ai} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:8 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 30px', gap:8, marginBottom:6, alignItems:'center' }}>
                        <select style={s.input} value={ag.tipo||'fis'} onChange={e=>setRisco(ai,'tipo',e.target.value)}>
                          <option value="fis">Físico</option><option value="qui">Químico</option>
                          <option value="bio">Biológico</option><option value="erg">Ergonômico</option>
                          <option value="aci">Acidentes</option><option value="psi">Psicossocial</option>
                        </select>
                        <input style={s.input} value={ag.nome||''} onChange={e=>setRisco(ai,'nome',e.target.value)} onBlur={()=>aoSairDoNomeRisco(ai)} list={`agentes-${ag.tipo||'fis'}`} placeholder="Nome do risco (ex: Ruído)"/>
                        <button onClick={()=>removeRisco(ai)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:18, padding:0 }}>×</button>
                      </div>
                      {(() => {
                        const anexoIV = sugerirAnexoIV(ag.nome)
                        if (!anexoIV) return null
                        return (
                          <div style={{ fontSize:11, color:'#0C447C', background:'#E6F1FB', borderRadius:6, padding:'5px 8px', marginBottom:6 }}>
                            ⓘ Consta no Anexo IV do Decreto 3.048/99 (agente {anexoIV.codigo}, {anexoIV.categoria}) — tempo de exposição para aposentadoria especial: {anexoIV.tempoExposicaoAnos} anos. Avalie se este GHE deve marcar &quot;Aposentadoria especial&quot;.
                          </div>
                        )
                      })()}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:6 }}>
                        <input style={s.input} value={ag.perigo||''} onChange={e=>setRisco(ai,'perigo',e.target.value)} placeholder="Perigo (ex: Intensidade/concentração do agente)"/>
                        <input style={s.input} value={ag.fontes_circunstancias||''} onChange={e=>setRisco(ai,'fontes_circunstancias',e.target.value)} placeholder="Fontes/circunstâncias de exposição"/>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 130px', gap:8, marginBottom:6 }}>
                        <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                          <input type="checkbox" checked={ag.medicao_quantitativa||false} onChange={e=>setRisco(ai,'medicao_quantitativa',e.target.checked)}/>
                          Medição quantitativa
                        </label>
                        <input style={s.input} value={ag.valor||''} onChange={e=>setRisco(ai,'valor',e.target.value)} placeholder="Valor medido" disabled={!ag.medicao_quantitativa}/>
                        <input style={s.input} value={ag.unidade||''} onChange={e=>setRisco(ai,'unidade',e.target.value)} placeholder="Unidade (dB(A)...)" disabled={!ag.medicao_quantitativa}/>
                        <input style={s.input} value={ag.limite||''} onChange={e=>setRisco(ai,'limite',e.target.value)} placeholder="Limite de tolerância"/>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 160px', gap:8, marginBottom:6 }}>
                        <input style={s.input} value={ag.metodologia||''} onChange={e=>setRisco(ai,'metodologia',e.target.value)} placeholder="Metodologia (ex: NHO-01)" disabled={!ag.medicao_quantitativa}/>
                        <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, whiteSpace:'nowrap' }}>
                          <input type="checkbox" checked={ag.supera_lt||false} onChange={e=>setRisco(ai,'supera_lt',e.target.checked)}/>
                          Supera LT
                        </label>
                        <input style={s.input} value={ag.codigo_esocial||''} onChange={e=>setRisco(ai,'codigo_esocial',e.target.value)} list="tabela24-codigos" placeholder="Código eSocial"/>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:6 }}>
                        <input style={s.input} value={ag.fonte_geradora||''} onChange={e=>setRisco(ai,'fonte_geradora',e.target.value)} placeholder="Equipamento / fonte geradora"/>
                        <input style={s.input} value={ag.danos_saude||''} onChange={e=>setRisco(ai,'danos_saude',e.target.value)} placeholder="Possíveis danos à saúde (ex: PAIR, dermatose, LER/DORT...)"/>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:6 }}>
                        <select style={s.input} value={ag.severidade} onChange={e=>setRisco(ai,'severidade', e.target.value?parseInt(e.target.value,10):'')}>
                          <option value="">Severidade</option>
                          {SEVERIDADE_OPCOES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                        <select style={s.input} value={ag.probabilidade} onChange={e=>setRisco(ai,'probabilidade', e.target.value?parseInt(e.target.value,10):'')}>
                          <option value="">Probabilidade</option>
                          {PROBABILIDADE_OPCOES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, alignItems:'center' }}>
                        <select style={s.input} value={ag.trajetoria||''} onChange={e=>setRisco(ai,'trajetoria',e.target.value)}>
                          <option value="">Trajetória</option>
                          {TRAJETORIA_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <select style={s.input} value={ag.tipo_exposicao||''} onChange={e=>setRisco(ai,'tipo_exposicao',e.target.value)}>
                          <option value="">Tipo de exposição</option>
                          {TIPO_EXPOSICAO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        {nr && <span style={{ padding:'4px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:nr.bg, color:nr.cor, whiteSpace:'nowrap' }}>{nr.faixa} ({nr.valor})</span>}
                      </div>
                    </div>
                    )
                  })}
                  <datalist id="tabela24-codigos">
                    {ESOCIAL_TABELA24.map(t => <option key={t.codigo} value={t.codigo}>{t.nome}</option>)}
                  </datalist>
                  {Object.entries(AGENTES_POR_TIPO).map(([tipo, agentes]) => (
                    <datalist key={tipo} id={`agentes-${tipo}`}>
                      {agentes.map(nome => <option key={nome} value={nome} />)}
                    </datalist>
                  ))}
                  {!(formGhe.riscos?.length) && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum risco. Clique em + Risco.</div>}
                </div>

                {/* EPI e EPC */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <div style={s.secLabel}>EPC</div>
                      <button style={{ ...s.btnOutline, padding:'2px 7px', fontSize:10 }} onClick={addEPC}>+ EPC</button>
                    </div>
                    {(formGhe.epc||[]).map((e: any, ei: number) => (
                      <div key={ei} style={{ display:'flex', gap:6, marginBottom:6, alignItems:'center' }}>
                        <input style={{ ...s.input, flex:1 }} value={e.nome||''} onChange={v=>setEPC(ei,'nome',v.target.value)} placeholder="Nome do EPC"/>
                        <select style={{ ...s.input, width:90 }} value={e.eficaz?'sim':'nao'} onChange={v=>setEPC(ei,'eficaz',v.target.value==='sim')}>
                          <option value="sim">Eficaz</option><option value="nao">Ineficaz</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <div style={s.secLabel}>EPI</div>
                      <button style={{ ...s.btnOutline, padding:'2px 7px', fontSize:10 }} onClick={addEPI}>+ EPI</button>
                    </div>
                    {(formGhe.epi||[]).map((e: any, ei: number) => (
                      <div key={ei} style={{ display:'flex', gap:6, marginBottom:6, alignItems:'center', flexWrap:'wrap' }}>
                        <input style={{ ...s.input, flex:2, minWidth:100 }} value={e.nome||''} onChange={v=>setEPI(ei,'nome',v.target.value)} placeholder="Nome do EPI"/>
                        <input style={{ ...s.input, width:60 }} value={e.ca||''} onChange={v=>setEPI(ei,'ca',v.target.value)} placeholder="CA"/>
                        <input style={{ ...s.input, width:80 }} value={e.atenuacao||''} onChange={v=>setEPI(ei,'atenuacao',v.target.value)} placeholder="Atenuação"/>
                        <select style={{ ...s.input, width:90 }} value={e.eficaz?'sim':'nao'} onChange={v=>setEPI(ei,'eficaz',v.target.value==='sim')}>
                          <option value="sim">Eficaz</option><option value="nao">Ineficaz</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {erro && <div style={s.erroBox}>{erro}</div>}
                <div style={{ display:'flex', gap:8, marginTop:14 }}>
                  <button style={s.btnPrimary} onClick={salvarEdicao} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                  <button style={s.btnOutline} onClick={cancelarEdicao}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Layout>
  )
}

const s: Record<string, React.CSSProperties> = {
  loading:    { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:     { fontSize:20, fontWeight:700, color:'#111' },
  sub:        { fontSize:12, color:'#6b7280', marginTop:2 },
  secLabel:   { fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 },
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' },
  item:       { borderRadius:10, padding:'10px 12px', marginBottom:8, transition:'all .15s' },
  epiRow:     { display:'flex', alignItems:'flex-start', gap:6, padding:'5px 0', borderBottom:'0.5px solid #f3f4f6' },
  emptySmall: { fontSize:12, color:'#9ca3af', padding:'6px 0' },
  emptyCard:  { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'3rem', textAlign:'center' },
  label:      { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:3 },
  input:      { width:'100%', padding:'7px 9px', fontSize:12, border:'1px solid #d1d5db', borderRadius:7, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  btnPrimary: { padding:'7px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'7px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
}
