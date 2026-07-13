import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { gerarPdfPpp } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function agentesDoFuncionario(ltcat, func) {
  if (!ltcat?.ghes) return null
  for (const ghe of ltcat.ghes) {
    const setorGHE = (ghe.setor || '').toLowerCase()
    const setorFunc = (func.setor || '').toLowerCase()
    if (setorGHE && setorFunc && (setorGHE.includes(setorFunc) || setorFunc.includes(setorGHE))) {
      return ghe
    }
  }
  return null
}

const periodoVazio = () => ({
  periodo_inicio: '', periodo_fim: '', funcao: '', setor: '', agentes: [], epi_eficaz: true,
})

const AGENTE_TIPOS = ['Físico', 'Químico', 'Biológico', 'Ergonômico', 'Mecânico/Acidente']
const agenteVazio = () => ({ tipo: AGENTE_TIPOS[0], nome: '', valor: '', limite: '' })

export default function PPP() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [respLegalEmpresa, setRespLegalEmpresa] = useState('')
  const [funcionarios, setFuncionarios] = useState([])
  const [ltcatAtivo, setLtcatAtivo] = useState(null)
  const [ppps, setPpps] = useState([])
  const [funcSel, setFuncSel] = useState(null)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [form, setForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)
    setEmpresaId(empId)
    supabase.from('empresas').select('razao_social,cnpj,resp_nome').eq('id', empId).single()
      .then(({ data: emp }) => { if (emp) { setNomeEmpresa(emp.razao_social); setCnpjEmpresa(emp.cnpj); setRespLegalEmpresa(emp.resp_nome || '') } })

    const [funcsRes, ltcatRes, pppRes] = await Promise.all([
      // Inclui desligados também — o PPP precisa continuar acessível mesmo depois
      // que o funcionário sai da empresa (documento exigido por décadas).
      supabase.from('funcionarios').select('id,nome,cpf,funcao,setor,matricula_esocial,data_adm,ativo,data_desligamento').eq('empresa_id', empId).order('nome').limit(2000),
      supabase.from('ltcats').select('*').eq('empresa_id', empId).eq('ativo', true).order('data_emissao', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('ppp').select('*').eq('empresa_id', empId),
    ])
    setFuncionarios(funcsRes.data || [])
    setLtcatAtivo(ltcatRes.data || null)
    setPpps(pppRes.data || [])
    setCarregando(false)
  }

  function pppDoFunc(funcId) {
    return ppps.find(p => p.funcionario_id === funcId) || null
  }

  function selecionarFunc(func) {
    setFuncSel(func)
    setModoEdicao(false)
    setForm(null)
    setSucesso(''); setErro('')
  }

  function criarPpp() {
    const ghe = agentesDoFuncionario(ltcatAtivo, funcSel)
    setForm({
      data_emissao: new Date().toISOString().split('T')[0],
      resp_nome: '', resp_cargo: '',
      historico: ghe ? [{
        periodo_inicio: funcSel.data_adm || '', periodo_fim: '',
        funcao: funcSel.funcao || '', setor: funcSel.setor || '',
        agentes: ghe.agentes || [], epi_eficaz: true,
      }] : [],
    })
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function editarPpp(ppp) {
    setForm(JSON.parse(JSON.stringify(ppp)))
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function cancelarEdicao() {
    setModoEdicao(false)
    setForm(null)
  }

  async function salvar() {
    if (!form.resp_nome) { setErro('Informe o responsável pelo preenchimento.'); return }
    setSalvando(true); setErro(''); setSucesso('')

    const dados = {
      empresa_id: empresaId,
      funcionario_id: funcSel.id,
      data_emissao: form.data_emissao || null,
      resp_nome: form.resp_nome,
      resp_cargo: form.resp_cargo || null,
      historico: form.historico || [],
      atualizado_em: new Date().toISOString(),
    }

    const { error } = await supabase.from('ppp').upsert(dados, { onConflict: 'funcionario_id' })

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso('PPP salvo com sucesso!')
      setModoEdicao(false)
      setForm(null)
      await init()
    }
    setSalvando(false)
  }

  async function excluir(funcId) {
    if (!confirm('EXCLUIR este PPP permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('ppp').delete().eq('funcionario_id', funcId)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    init()
  }

  function addPeriodo() {
    const ghe = funcSel ? agentesDoFuncionario(ltcatAtivo, funcSel) : null
    setForm(p => ({ ...p, historico: [...(p.historico || []), ghe ? {
      periodo_inicio: '', periodo_fim: '', funcao: funcSel.funcao || '', setor: funcSel.setor || '',
      agentes: ghe.agentes || [], epi_eficaz: true,
    } : periodoVazio()] }))
  }

  function setPeriodo(i, field, value) {
    setForm(p => {
      const historico = [...p.historico]
      historico[i] = { ...historico[i], [field]: value }
      return { ...p, historico }
    })
  }

  function removerPeriodo(i) {
    setForm(p => ({ ...p, historico: p.historico.filter((_, idx) => idx !== i) }))
  }

  function addAgente(i) {
    setForm(p => {
      const historico = [...p.historico]
      historico[i] = { ...historico[i], agentes: [...(historico[i].agentes || []), agenteVazio()] }
      return { ...p, historico }
    })
  }

  function setAgenteField(i, j, field, value) {
    setForm(p => {
      const historico = [...p.historico]
      const agentes = [...(historico[i].agentes || [])]
      agentes[j] = { ...agentes[j], [field]: value }
      historico[i] = { ...historico[i], agentes }
      return { ...p, historico }
    })
  }

  function removerAgente(i, j) {
    setForm(p => {
      const historico = [...p.historico]
      historico[i] = { ...historico[i], agentes: (historico[i].agentes || []).filter((_, idx) => idx !== j) }
      return { ...p, historico }
    })
  }

  function exportarPdf(ppp, func) {
    gerarPdfPpp(
      { funcionario: func, dados_gerais: { data_emissao: ppp.data_emissao, resp_nome: ppp.resp_nome, resp_cargo: ppp.resp_cargo }, historico: ppp.historico || [] },
      { razao_social: nomeEmpresa, cnpj: cnpjEmpresa, resp_nome: respLegalEmpresa }
    )
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  const funcsFiltrados = funcionarios.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()))
  const pppSel = funcSel ? pppDoFunc(funcSel.id) : null
  const totalComPpp = ppps.length
  const idsAtivos = new Set(funcionarios.filter(f => f.ativo).map(f => f.id))
  const funcionariosAtivosCount = idsAtivos.size
  const comPppAtivos = ppps.filter(p => idsAtivos.has(p.funcionario_id)).length

  return (
    <Layout pagina="ppp">
      <Head><title>PPP — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>PPP</div>
          <div style={s.sub}>Perfil Profissiográfico Previdenciário</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:'1.25rem' }}>
        {[
          { n: funcionariosAtivosCount, l:'Funcionários ativos', c:'#185FA5' },
          { n: totalComPpp, l:'Com PPP cadastrado (total)', c: totalComPpp > 0 ? '#1D9E75' : '#E24B4A' },
          { n: funcionariosAtivosCount - comPppAtivos, l:'Ativos sem PPP', c: (funcionariosAtivosCount - comPppAtivos) > 0 ? '#E24B4A' : '#1D9E75' },
        ].map((k,i) => (
          <div key={i} style={s.kpiCard}>
            <div style={{ fontSize:22, fontWeight:700, color:k.c }}>{k.n}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && <div style={s.erroBox}>{erro}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:14 }}>
        <div>
          <input style={s.input} placeholder="Buscar funcionário..." value={busca} onChange={e => setBusca(e.target.value)} />
          <div style={{ marginTop:10, maxHeight:560, overflowY:'auto' }}>
            {funcsFiltrados.map(f => {
              const tem = !!pppDoFunc(f.id)
              return (
                <div key={f.id} onClick={() => selecionarFunc(f)}
                  style={{ ...s.itemLista, border: funcSel?.id===f.id?'1.5px solid #185FA5':'0.5px solid #e5e7eb', background: funcSel?.id===f.id?'#E6F1FB':'#fff' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:12, fontWeight:600, color: funcSel?.id===f.id?'#0C447C':'#111' }}>{f.nome}</div>
                    <div style={{ display:'flex', gap:4 }}>
                      {!f.ativo && (
                        <span style={{ padding:'2px 7px', borderRadius:99, fontSize:9, fontWeight:600, background:'#f3f4f6', color:'#6b7280' }}>Desligado</span>
                      )}
                      <span style={{ padding:'2px 7px', borderRadius:99, fontSize:9, fontWeight:600, background: tem?'#EAF3DE':'#f3f4f6', color: tem?'#27500A':'#9ca3af' }}>
                        {tem ? 'PPP' : '—'}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{f.funcao || '—'}</div>
                </div>
              )
            })}
            {!funcsFiltrados.length && <div style={{ fontSize:12, color:'#9ca3af', textAlign:'center', padding:'1rem' }}>Nenhum funcionário encontrado.</div>}
          </div>
        </div>

        <div>
          {!funcSel && (
            <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:14, color:'#374151' }}>Selecione um funcionário</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Escolha na lista ao lado para ver ou criar o PPP</div>
            </div>
          )}

          {funcSel && !modoEdicao && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={s.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#111' }}>{funcSel.nome}</div>
                    <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{funcSel.funcao || '—'} · {funcSel.setor || '—'} · {funcSel.cpf || '—'}</div>
                  </div>
                  {pppSel ? (
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={{ ...s.btnPrimary, padding:'6px 14px', fontSize:12 }} onClick={() => editarPpp(pppSel)}>✏ Editar</button>
                      <button style={{ ...s.btnOutline, color:'#27500A', borderColor:'#C0DD97', padding:'6px 14px', fontSize:12 }} onClick={() => exportarPdf(pppSel, funcSel)}>↓ PDF</button>
                      <button style={{ ...s.btnOutline, color:'#791F1F', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }} onClick={() => excluir(funcSel.id)}>🗑</button>
                    </div>
                  ) : (
                    <button style={s.btnPrimary} onClick={criarPpp}>+ Criar PPP</button>
                  )}
                </div>
              </div>

              {pppSel ? (
                <>
                  <div style={s.card}>
                    <div style={s.row2}>
                      <div>
                        <div style={s.secLabel}>Data de emissão</div>
                        <div style={{ fontSize:13 }}>{pppSel.data_emissao ? new Date(pppSel.data_emissao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                      </div>
                      <div>
                        <div style={s.secLabel}>Responsável pelo preenchimento</div>
                        <div style={{ fontSize:13 }}>{pppSel.resp_nome || '—'}{pppSel.resp_cargo ? ` (${pppSel.resp_cargo})` : ''}</div>
                      </div>
                    </div>
                  </div>

                  <div style={s.card}>
                    <div style={s.cardTit}>Histórico de exposição ({pppSel.historico?.length || 0})</div>
                    {pppSel.historico?.length ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                        {pppSel.historico.map((h,i) => (
                          <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10 }}>
                            <div style={{ display:'flex', justifyContent:'space-between' }}>
                              <div style={{ fontSize:13, fontWeight:600 }}>{h.funcao} {h.setor ? `— ${h.setor}` : ''}</div>
                              <div style={{ fontSize:11, color:'#9ca3af' }}>
                                {h.periodo_inicio ? new Date(h.periodo_inicio+'T12:00:00').toLocaleDateString('pt-BR') : '—'} até {h.periodo_fim ? new Date(h.periodo_fim+'T12:00:00').toLocaleDateString('pt-BR') : 'atual'}
                              </div>
                            </div>
                            {h.agentes?.length > 0 && (
                              <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>
                                Agentes: {h.agentes.map(a=>a.nome).join(', ')}
                              </div>
                            )}
                            <div style={{ fontSize:11, marginTop:4, color: h.epi_eficaz ? '#27500A' : '#791F1F' }}>
                              EPI {h.epi_eficaz ? 'eficaz' : 'não eficaz / não fornecido'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhum período registrado.</div>}
                  </div>
                </>
              ) : (
                <div style={{ ...s.card, textAlign:'center', padding:'2rem' }}>
                  <div style={{ fontSize:13, color:'#374151' }}>Nenhum PPP cadastrado para este funcionário</div>
                </div>
              )}
            </div>
          )}

          {funcSel && modoEdicao && form && (
            <div style={{ ...s.card, border:'1.5px solid #185FA5' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>PPP — {funcSel.nome}</div>
                <button onClick={cancelarEdicao} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
              </div>

              <div style={s.row2}>
                <div>
                  <label style={s.label}>Data de emissão</label>
                  <input type="date" style={s.input} value={form.data_emissao || ''} onChange={e => setForm({ ...form, data_emissao: e.target.value })} />
                </div>
              </div>
              <div style={s.row2}>
                <div>
                  <label style={s.label}>Responsável pelo preenchimento *</label>
                  <input style={s.input} value={form.resp_nome || ''} onChange={e => setForm({ ...form, resp_nome: e.target.value })} />
                </div>
                <div>
                  <label style={s.label}>Cargo</label>
                  <input style={s.input} value={form.resp_cargo || ''} onChange={e => setForm({ ...form, resp_cargo: e.target.value })} placeholder="Ex: Técnico de Segurança" />
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <label style={s.label}>Histórico de exposição ({form.historico?.length || 0})</label>
                  <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addPeriodo}>+ Adicionar período</button>
                </div>
                {(form.historico || []).map((h, i) => (
                  <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:12, marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button onClick={() => removerPeriodo(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:16 }}>×</button>
                    </div>
                    <div style={s.row2}>
                      <input style={s.input} placeholder="Função" value={h.funcao} onChange={e => setPeriodo(i, 'funcao', e.target.value)} />
                      <input style={s.input} placeholder="Setor" value={h.setor} onChange={e => setPeriodo(i, 'setor', e.target.value)} />
                    </div>
                    <div style={s.row2}>
                      <div>
                        <label style={s.label}>Início do período</label>
                        <input type="date" style={s.input} value={h.periodo_inicio||''} onChange={e => setPeriodo(i, 'periodo_inicio', e.target.value)} />
                      </div>
                      <div>
                        <label style={s.label}>Fim do período (vazio = atual)</label>
                        <input type="date" style={s.input} value={h.periodo_fim||''} onChange={e => setPeriodo(i, 'periodo_fim', e.target.value)} />
                      </div>
                    </div>
                    <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer', marginBottom:10 }}>
                      <input type="checkbox" checked={!!h.epi_eficaz} onChange={e => setPeriodo(i, 'epi_eficaz', e.target.checked)} />
                      EPI eficaz neste período
                    </label>

                    <div style={{ borderTop:'0.5px solid #f3f4f6', paddingTop:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.04em' }}>
                          Agentes de risco ({h.agentes?.length || 0})
                        </span>
                        <button style={{ ...s.btnAcao, fontSize:10, padding:'2px 8px' }} onClick={() => addAgente(i)}>+ Risco</button>
                      </div>
                      {(h.agentes || []).length === 0 && (
                        <div style={{ fontSize:11, color:'#9ca3af', marginBottom:4 }}>
                          Nenhum agente vinculado — carregado automaticamente do LTCAT vigente quando o setor bate, ou adicione manualmente.
                        </div>
                      )}
                      {(h.agentes || []).map((a, j) => (
                        <div key={j} style={{ display:'grid', gridTemplateColumns:'110px 1fr 90px 90px 22px', gap:6, marginBottom:6, alignItems:'center' }}>
                          <select style={{ ...s.input, padding:'6px 8px', fontSize:11 }} value={a.tipo || AGENTE_TIPOS[0]} onChange={e => setAgenteField(i, j, 'tipo', e.target.value)}>
                            {AGENTE_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <input style={{ ...s.input, padding:'6px 8px', fontSize:11 }} placeholder="Nome do agente" value={a.nome || ''} onChange={e => setAgenteField(i, j, 'nome', e.target.value)} />
                          <input style={{ ...s.input, padding:'6px 8px', fontSize:11 }} placeholder="Valor" value={a.valor || ''} onChange={e => setAgenteField(i, j, 'valor', e.target.value)} />
                          <input style={{ ...s.input, padding:'6px 8px', fontSize:11 }} placeholder="Limite" value={a.limite || ''} onChange={e => setAgenteField(i, j, 'limite', e.target.value)} />
                          <button onClick={() => removerAgente(i, j)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:15 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!(form.historico || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum período adicionado.</div>}
              </div>

              {erro && <div style={s.erroBox}>{erro}</div>}

              <div style={{ display:'flex', gap:8 }}>
                <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar PPP'}</button>
                <button style={s.btnOutline} onClick={cancelarEdicao}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

const s = {
  loading:    { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:     { fontSize:20, fontWeight:700, color:'#111' },
  sub:        { fontSize:12, color:'#6b7280', marginTop:2 },
  kpiCard:    { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1rem' },
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem' },
  cardTit:    { fontSize:13, fontWeight:600, color:'#111' },
  secLabel:   { fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 },
  itemLista:  { padding:'9px 11px', borderRadius:8, marginBottom:6, cursor:'pointer' },
  row2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 },
  label:      { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 },
  input:      { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  btnAcao:    { padding:'3px 10px', fontSize:11, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151' },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
}
