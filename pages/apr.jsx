import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { gerarPdfApr } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const etapaVazia = () => ({ etapa: '', risco: '', causa: '', medida_controle: '', responsavel: '' })
const membroVazio = () => ({ nome: '', funcao: '' })

export default function APR() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [aprs, setAprs] = useState([])
  const [aprSel, setAprSel] = useState(null)
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
    supabase.from('empresas').select('razao_social,cnpj').eq('id', empId).single()
      .then(({ data: emp }) => { if (emp) { setNomeEmpresa(emp.razao_social); setCnpjEmpresa(emp.cnpj) } })

    const { data } = await supabase.from('apr').select('*').eq('empresa_id', empId).eq('ativo', true).order('data_realizacao', { ascending: false })
    setAprs(data || [])
    setAprSel(prev => data?.find(a => a.id === prev?.id) || data?.[0] || null)
    setCarregando(false)
  }

  function criarNova() {
    setForm({
      atividade: '', local: '', data_realizacao: new Date().toISOString().split('T')[0],
      resp_nome: '', resp_cargo: '', etapas: [], equipe: [],
    })
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function abrirEdicao(apr) {
    setForm(JSON.parse(JSON.stringify(apr)))
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function cancelarEdicao() {
    setModoEdicao(false)
    setForm(null)
  }

  async function salvar() {
    if (!form.atividade) { setErro('Informe a atividade.'); return }
    setSalvando(true); setErro(''); setSucesso('')

    const dados = {
      empresa_id: empresaId,
      atividade: form.atividade,
      local: form.local || null,
      data_realizacao: form.data_realizacao || null,
      resp_nome: form.resp_nome || null,
      resp_cargo: form.resp_cargo || null,
      etapas: form.etapas || [],
      equipe: form.equipe || [],
      atualizado_em: new Date().toISOString(),
    }

    let error
    if (form.id) {
      ;({ error } = await supabase.from('apr').update(dados).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('apr').insert(dados))
    }

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso(form.id ? 'APR atualizada com sucesso!' : 'APR criada com sucesso!')
      setModoEdicao(false)
      setForm(null)
      await init()
    }
    setSalvando(false)
  }

  async function arquivar(id) {
    if (!confirm('Arquivar esta APR?')) return
    await supabase.from('apr').update({ ativo: false }).eq('id', id)
    setAprSel(null)
    init()
  }

  async function excluir(id) {
    if (!confirm('EXCLUIR esta APR permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('apr').delete().eq('id', id)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setAprSel(null)
    init()
  }

  function addEtapa() {
    setForm(p => ({ ...p, etapas: [...(p.etapas || []), etapaVazia()] }))
  }
  function setEtapa(i, field, value) {
    setForm(p => {
      const etapas = [...p.etapas]
      etapas[i] = { ...etapas[i], [field]: value }
      return { ...p, etapas }
    })
  }
  function removerEtapa(i) {
    setForm(p => ({ ...p, etapas: p.etapas.filter((_, idx) => idx !== i) }))
  }

  function addMembro() {
    setForm(p => ({ ...p, equipe: [...(p.equipe || []), membroVazio()] }))
  }
  function setMembro(i, field, value) {
    setForm(p => {
      const equipe = [...p.equipe]
      equipe[i] = { ...equipe[i], [field]: value }
      return { ...p, equipe }
    })
  }
  function removerMembro(i) {
    setForm(p => ({ ...p, equipe: p.equipe.filter((_, idx) => idx !== i) }))
  }

  function exportarPdf(apr) {
    gerarPdfApr(
      { dados_gerais: apr, etapas: apr.etapas || [], equipe: apr.equipe || [] },
      { razao_social: nomeEmpresa, cnpj: cnpjEmpresa }
    )
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="apr">
      <Head><title>APR — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>APR</div>
          <div style={s.sub}>Análise Preliminar de Risco</div>
        </div>
        {!modoEdicao && (
          <button style={s.btnPrimary} onClick={criarNova}>+ Nova APR</button>
        )}
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && !modoEdicao && <div style={s.erroBox}>{erro}</div>}

      {aprs.length === 0 && !modoEdicao ? (
        <div style={s.emptyCard}>
          <div style={{ fontSize:14, fontWeight:500, color:'#374151' }}>Nenhuma APR cadastrada</div>
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Registre a análise de risco antes de iniciar uma atividade</div>
          <button style={{ ...s.btnPrimary, marginTop:16 }} onClick={criarNova}>+ Criar primeira APR</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: modoEdicao ? '1fr' : '260px 1fr', gap:14 }}>

          {!modoEdicao && (
            <div>
              <div style={s.secLabel}>APRs cadastradas ({aprs.length})</div>
              {aprs.map(a => (
                <div key={a.id} onClick={() => setAprSel(a)}
                  style={{ ...s.itemLista, border: aprSel?.id===a.id?'1.5px solid #185FA5':'0.5px solid #e5e7eb', background: aprSel?.id===a.id?'#E6F1FB':'#fff' }}>
                  <div style={{ fontSize:12, fontWeight:600, color: aprSel?.id===a.id?'#0C447C':'#111' }}>{a.atividade}</div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:3 }}>
                    {a.data_realizacao ? new Date(a.data_realizacao+'T12:00:00').toLocaleDateString('pt-BR') : '—'} {a.local ? `· ${a.local}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            {!modoEdicao && aprSel && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={s.card}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#111', marginBottom:8 }}>{aprSel.atividade}</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                        {[
                          { l:'Local', v: aprSel.local||'—' },
                          { l:'Data', v: aprSel.data_realizacao ? new Date(aprSel.data_realizacao+'T12:00:00').toLocaleDateString('pt-BR') : '—' },
                          { l:'Responsável', v: `${aprSel.resp_nome||'—'}${aprSel.resp_cargo ? ` (${aprSel.resp_cargo})` : ''}` },
                        ].map((it,i) => (
                          <div key={i}>
                            <div style={{ fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase' }}>{it.l}</div>
                            <div style={{ fontSize:13, fontWeight:500, color:'#111', marginTop:2 }}>{it.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button style={{ ...s.btnPrimary, padding:'6px 14px', fontSize:12 }} onClick={() => abrirEdicao(aprSel)}>✏ Editar</button>
                      <button style={{ ...s.btnOutline, color:'#27500A', borderColor:'#C0DD97', padding:'6px 14px', fontSize:12 }} onClick={() => exportarPdf(aprSel)}>↓ PDF</button>
                      <button style={{ ...s.btnOutline, color:'#E24B4A', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }} onClick={() => arquivar(aprSel.id)}>Arquivar</button>
                      <button style={{ ...s.btnOutline, color:'#791F1F', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }} onClick={() => excluir(aprSel.id)}>🗑</button>
                    </div>
                  </div>
                </div>

                <div style={s.card}>
                  <div style={s.cardTit}>Etapas e riscos ({aprSel.etapas?.length||0})</div>
                  {aprSel.etapas?.length ? (
                    <div style={{ overflowX:'auto', marginTop:10 }}>
                      <table style={s.table}>
                        <thead><tr>{['Etapa','Risco','Causa','Medida de controle','Responsável'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {aprSel.etapas.map((e,i) => (
                            <tr key={i} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                              <td style={s.td}>{e.etapa||'—'}</td>
                              <td style={s.td}>{e.risco||'—'}</td>
                              <td style={s.td}>{e.causa||'—'}</td>
                              <td style={s.td}>{e.medida_controle||'—'}</td>
                              <td style={s.td}>{e.responsavel||'—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhuma etapa cadastrada.</div>}
                </div>

                <div style={s.card}>
                  <div style={s.cardTit}>Equipe envolvida ({aprSel.equipe?.length||0})</div>
                  {aprSel.equipe?.length ? (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                      {aprSel.equipe.map((m,i) => (
                        <span key={i} style={{ padding:'4px 10px', borderRadius:99, fontSize:12, background:'#f3f4f6', color:'#374151' }}>
                          {m.nome}{m.funcao ? ` · ${m.funcao}` : ''}
                        </span>
                      ))}
                    </div>
                  ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhum integrante cadastrado.</div>}
                </div>
              </div>
            )}

            {modoEdicao && form && (
              <div style={{ ...s.card, border:'1.5px solid #185FA5' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>{form.id ? '✏ Editando APR' : 'Nova APR'}</div>
                  <button onClick={cancelarEdicao} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
                </div>

                <div style={s.row2}>
                  <div>
                    <label style={s.label}>Atividade *</label>
                    <input style={s.input} placeholder="Ex: Troca de válvula em altura" value={form.atividade} onChange={e => setForm({...form, atividade:e.target.value})} />
                  </div>
                  <div>
                    <label style={s.label}>Local</label>
                    <input style={s.input} value={form.local||''} onChange={e => setForm({...form, local:e.target.value})} />
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <label style={s.label}>Data de realização</label>
                    <input type="date" style={s.input} value={form.data_realizacao||''} onChange={e => setForm({...form, data_realizacao:e.target.value})} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={s.label}>Responsável</label>
                      <input style={s.input} value={form.resp_nome||''} onChange={e => setForm({...form, resp_nome:e.target.value})} />
                    </div>
                    <div>
                      <label style={s.label}>Cargo</label>
                      <input style={s.input} value={form.resp_cargo||''} onChange={e => setForm({...form, resp_cargo:e.target.value})} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <label style={s.label}>Etapas e riscos ({form.etapas?.length||0})</label>
                    <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addEtapa}>+ Adicionar etapa</button>
                  </div>
                  {(form.etapas||[]).map((e,i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 28px', gap:6, alignItems:'center', padding:'5px 0', borderBottom:'0.5px solid #f3f4f6' }}>
                      <input style={s.inputSm} placeholder="Etapa" value={e.etapa} onChange={ev => setEtapa(i,'etapa',ev.target.value)} />
                      <input style={s.inputSm} placeholder="Risco" value={e.risco} onChange={ev => setEtapa(i,'risco',ev.target.value)} />
                      <input style={s.inputSm} placeholder="Causa" value={e.causa} onChange={ev => setEtapa(i,'causa',ev.target.value)} />
                      <input style={s.inputSm} placeholder="Medida de controle" value={e.medida_controle} onChange={ev => setEtapa(i,'medida_controle',ev.target.value)} />
                      <input style={s.inputSm} placeholder="Responsável" value={e.responsavel} onChange={ev => setEtapa(i,'responsavel',ev.target.value)} />
                      <button onClick={() => removerEtapa(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:16 }}>×</button>
                    </div>
                  ))}
                  {!(form.etapas||[]).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhuma etapa cadastrada.</div>}
                </div>

                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <label style={s.label}>Equipe envolvida ({form.equipe?.length||0})</label>
                    <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addMembro}>+ Adicionar integrante</button>
                  </div>
                  {(form.equipe||[]).map((m,i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 28px', gap:6, alignItems:'center', padding:'5px 0', borderBottom:'0.5px solid #f3f4f6' }}>
                      <input style={s.inputSm} placeholder="Nome" value={m.nome} onChange={ev => setMembro(i,'nome',ev.target.value)} />
                      <input style={s.inputSm} placeholder="Função" value={m.funcao} onChange={ev => setMembro(i,'funcao',ev.target.value)} />
                      <button onClick={() => removerMembro(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:16 }}>×</button>
                    </div>
                  ))}
                  {!(form.equipe||[]).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum integrante cadastrado.</div>}
                </div>

                {erro && <div style={s.erroBox}>{erro}</div>}

                <div style={{ display:'flex', gap:8 }}>
                  <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar APR'}</button>
                  <button style={s.btnOutline} onClick={cancelarEdicao}>Cancelar</button>
                </div>
              </div>
            )}
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
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem' },
  cardTit:    { fontSize:13, fontWeight:600, color:'#111' },
  secLabel:   { fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 },
  itemLista:  { padding:'10px 12px', borderRadius:8, marginBottom:6, cursor:'pointer' },
  row2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 },
  label:      { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 },
  input:      { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  inputSm:    { width:'100%', padding:'5px 8px', fontSize:12, border:'1px solid #d1d5db', borderRadius:6, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:         { padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'#6b7280', borderBottom:'0.5px solid #e5e7eb', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' },
  td:         { padding:'10px 12px', verticalAlign:'middle', color:'#374151' },
  btnAcao:    { padding:'3px 10px', fontSize:11, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151' },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  emptyCard:  { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'3rem', textAlign:'center' },
}
