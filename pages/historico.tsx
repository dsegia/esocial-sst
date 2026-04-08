import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const EVT_COR = { 'S-2210':['#FCEBEB','#791F1F'], 'S-2220':['#E6F1FB','#0C447C'], 'S-2240':['#FAEEDA','#633806'] }
const ST_COR  = { enviado:['#EAF3DE','#27500A'], lote:['#EAF3DE','#27500A'], pendente:['#FAEEDA','#633806'], rejeitado:['#FCEBEB','#791F1F'], cancelado:['#f3f4f6','#6b7280'] }
const ST_LBL  = { enviado:'Enviado', lote:'Em lote', pendente:'Pendente', rejeitado:'Rejeitado', cancelado:'Cancelado' }

export default function Historico() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [lista, setLista] = useState([])
  const [selecionados, setSelecionados] = useState([])
  const [filtroEvt, setFiltroEvt] = useState('')
  const [filtroSt, setFiltroSt] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [confirmExcluir, setConfirmExcluir] = useState(null)
  const [modoLote, setModoLote] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    const { data:{ session } } = await supabase.auth.getSession()
    if (!session) { router.push('/'); return }
    const { data:user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/'); return }
    setEmpresaId(user.empresa_id)
    await carregar(user.empresa_id, '', '')
    setCarregando(false)
  }

  async function carregar(eId, evt, st) {
    let q = supabase.from('transmissoes')
      .select('id, evento, status, dt_envio, recibo, tentativas, criado_em, funcionario_id, funcionarios(nome, matricula_esocial)')
      .eq('empresa_id', eId)
      .order('criado_em', { ascending: false })
      .limit(100)
    if (evt) q = q.eq('evento', evt)
    if (st)  q = q.eq('status', st)
    const { data } = await q
    setLista(data || [])
    setSelecionados([])
  }

  async function excluir(id) {
    setErro(''); setSucesso('')
    const { error } = await supabase.from('transmissoes').delete().eq('id', id)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setSucesso('Transmissão excluída.')
    setConfirmExcluir(null)
    carregar(empresaId, filtroEvt, filtroSt)
  }

  async function excluirSelecionados() {
    if (!selecionados.length) return
    setErro(''); setSucesso('')
    const { error } = await supabase.from('transmissoes').delete().in('id', selecionados)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setSucesso(`${selecionados.length} transmissão(ões) excluída(s).`)
    setSelecionados([])
    carregar(empresaId, filtroEvt, filtroSt)
  }

  async function marcarComoLote() {
    if (!selecionados.length) return
    const { error } = await supabase.from('transmissoes')
      .update({ status:'lote' })
      .in('id', selecionados)
    if (error) { setErro('Erro: ' + error.message); return }
    setSucesso(`${selecionados.length} transmissão(ões) agrupada(s) em lote.`)
    setSelecionados([])
    carregar(empresaId, filtroEvt, filtroSt)
  }

  async function marcarIndividual(id) {
    const { error } = await supabase.from('transmissoes')
      .update({ status:'pendente' })
      .eq('id', id)
    if (error) { setErro('Erro: ' + error.message); return }
    setSucesso('Transmissão marcada como individual.')
    carregar(empresaId, filtroEvt, filtroSt)
  }

  function toggleSel(id) {
    setSelecionados(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id])
  }

  function toggleTodos() {
    if (selecionados.length === lista.length) setSelecionados([])
    else setSelecionados(lista.map(t => t.id))
  }

  function fmtData(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
  }

  const pendentes = lista.filter(t => t.status === 'pendente').length
  const emLote    = lista.filter(t => t.status === 'lote').length

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="historico">
      <Head><title>Histórico — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>Histórico de transmissões</div>
          <div style={s.sub}>{lista.length} registro(s) · {pendentes} pendente(s) · {emLote} em lote</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ ...s.btnOutline, background: modoLote?'#185FA5':'transparent', color: modoLote?'#fff':'#374151' }}
            onClick={() => { setModoLote(!modoLote); setSelecionados([]) }}>
            {modoLote ? '✓ Seleção ativa' : 'Selecionar'}
          </button>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro    && <div style={s.erroBox}>{erro}</div>}

      {/* Info lote vs individual */}
      <div style={{ background:'#E6F1FB', border:'0.5px solid #B5D4F4', borderRadius:10, padding:'10px 16px', fontSize:12, color:'#0C447C', marginBottom:14, lineHeight:1.8 }}>
        <strong>Transmissão em lote vs individual:</strong> Individual = cada evento é enviado separadamente ao Gov.br.
        Lote = vários eventos agrupados em um único XML (mais eficiente para muitos funcionários no mesmo mês).
        Selecione as transmissões e clique em "Agrupar em lote" para mudar o modo.
      </div>

      {/* Ações em lote */}
      {modoLote && selecionados.length > 0 && (
        <div style={{ background:'#fff', border:'1.5px solid #185FA5', borderRadius:10, padding:'10px 16px', marginBottom:12, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, fontWeight:500, color:'#185FA5' }}>{selecionados.length} selecionado(s)</span>
          <button style={s.btnPrimary} onClick={marcarComoLote}>📦 Agrupar em lote</button>
          <button style={{ ...s.btnOutline, color:'#E24B4A', borderColor:'#F09595' }} onClick={() => {
            if (confirm(`Excluir ${selecionados.length} transmissão(ões)?`)) excluirSelecionados()
          }}>🗑 Excluir selecionados</button>
          <button style={s.btnOutline} onClick={() => setSelecionados([])}>Cancelar</button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {['','S-2210','S-2220','S-2240'].map(evt => (
          <button key={evt} onClick={() => { setFiltroEvt(evt); carregar(empresaId, evt, filtroSt) }}
            style={{ ...s.filtroBtn, background: filtroEvt===evt?'#185FA5':'#f3f4f6', color: filtroEvt===evt?'#fff':'#374151' }}>
            {evt || 'Todos eventos'}
          </button>
        ))}
        <div style={{ width:1, background:'#e5e7eb' }}></div>
        {['','pendente','lote','enviado','rejeitado'].map(st => (
          <button key={st} onClick={() => { setFiltroSt(st); carregar(empresaId, filtroEvt, st) }}
            style={{ ...s.filtroBtn, background: filtroSt===st?'#374151':'#f3f4f6', color: filtroSt===st?'#fff':'#374151' }}>
            {st ? ST_LBL[st] : 'Todos status'}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
        <table style={s.table}>
          <thead>
            <tr style={{ background:'#f9fafb' }}>
              {modoLote && (
                <th style={{ ...s.th, width:40 }}>
                  <input type="checkbox" checked={selecionados.length===lista.length && lista.length>0}
                    onChange={toggleTodos} style={{ cursor:'pointer' }} />
                </th>
              )}
              {['Evento','Funcionário','Criado em','Enviado em','Recibo','Modo','Status','Ações'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr><td colSpan={modoLote?9:8} style={{ textAlign:'center', padding:'2rem', color:'#9ca3af', fontSize:13 }}>
                Nenhuma transmissão encontrada.
              </td></tr>
            ) : lista.map(tx => {
              const [evBg, evCor] = EVT_COR[tx.evento] || ['#f3f4f6','#374151']
              const [stBg, stCor] = ST_COR[tx.status]  || ['#f3f4f6','#374151']
              const sel = selecionados.includes(tx.id)
              return (
                <tr key={tx.id} style={{ borderBottom:'0.5px solid #f3f4f6', background: sel?'#EFF6FF':'transparent' }}>
                  {modoLote && (
                    <td style={s.td}>
                      <input type="checkbox" checked={sel} onChange={() => toggleSel(tx.id)} style={{ cursor:'pointer' }} />
                    </td>
                  )}
                  <td style={s.td}>
                    <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:evBg, color:evCor }}>
                      {tx.evento}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{tx.funcionarios?.nome || '—'}</div>
                    <div style={{ fontSize:11, color:'#9ca3af' }}>{tx.funcionarios?.matricula_esocial || ''}</div>
                  </td>
                  <td style={{ ...s.td, fontSize:12, color:'#6b7280' }}>{fmtData(tx.criado_em)}</td>
                  <td style={{ ...s.td, fontSize:12, color:'#6b7280' }}>{fmtData(tx.dt_envio)}</td>
                  <td style={{ ...s.td, fontSize:11, fontFamily:'monospace', color:'#6b7280', maxWidth:120 }}>
                    {tx.recibo ? tx.recibo.substring(0,20)+'...' : '—'}
                  </td>
                  <td style={s.td}>
                    <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600,
                      background: tx.status==='lote'?'#E6F1FB':'#f3f4f6',
                      color: tx.status==='lote'?'#0C447C':'#6b7280' }}>
                      {tx.status==='lote' ? '📦 Lote' : '📄 Individual'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:stBg, color:stCor }}>
                      {ST_LBL[tx.status] || tx.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display:'flex', gap:5 }}>
                      {tx.status === 'lote' && (
                        <button style={s.btnAcao} onClick={() => marcarIndividual(tx.id)} title="Converter para individual">
                          📄
                        </button>
                      )}
                      {tx.status === 'pendente' && (
                        <button style={s.btnAcao} onClick={() => {
                          setSelecionados([tx.id]); marcarComoLote()
                        }} title="Agrupar em lote">📦</button>
                      )}
                      <button style={{ ...s.btnAcao, color:'#E24B4A', borderColor:'#F09595' }}
                        onClick={() => setConfirmExcluir(tx)} title="Excluir">🗑</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal confirmar exclusão */}
      {confirmExcluir && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ fontSize:14, fontWeight:600, color:'#111', marginBottom:8 }}>Confirmar exclusão</div>
            <div style={{ fontSize:13, color:'#374151', marginBottom:16, lineHeight:1.6 }}>
              Deseja excluir a transmissão <strong>{confirmExcluir.evento}</strong> de <strong>{confirmExcluir.funcionarios?.nome || '—'}</strong>?
              {confirmExcluir.status === 'enviado' && (
                <div style={{ marginTop:8, color:'#E24B4A', fontSize:12 }}>
                  ⚠ Esta transmissão já foi enviada ao Gov.br. A exclusão é apenas local.
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button style={{ ...s.btnOutline, color:'#E24B4A', borderColor:'#F09595' }} onClick={() => excluir(confirmExcluir.id)}>Excluir</button>
              <button style={s.btnOutline} onClick={() => setConfirmExcluir(null)}>Cancelar</button>
            </div>
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
  filtroBtn:  { padding:'5px 12px', fontSize:11, fontWeight:500, borderRadius:99, cursor:'pointer', border:'none', transition:'all .15s' },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:         { padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'#6b7280', borderBottom:'0.5px solid #e5e7eb', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' },
  td:         { padding:'10px 12px', verticalAlign:'middle', color:'#374151' },
  btnAcao:    { padding:'3px 8px', fontSize:12, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151' },
  btnPrimary: { padding:'7px 14px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'7px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:12, cursor:'pointer', color:'#374151' },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:      { background:'#fff', borderRadius:12, padding:'1.5rem', width:400, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' },
}
