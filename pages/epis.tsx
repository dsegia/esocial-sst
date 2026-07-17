import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'
import { gerarPdfFichaEpi } from '../lib/gerar-pdf'

const formVazio = () => ({
  funcionario_id: '', epi_nome: '', ca: '', data_entrega: new Date().toISOString().split('T')[0],
  data_validade_ca: '', data_troca_prevista: '', quantidade: 1, ciencia: false,
})

const EPIS_COMUNS = [
  'Capacete de segurança', 'Óculos de proteção', 'Protetor auricular (plug)', 'Protetor auricular (concha)',
  'Luva de proteção', 'Luva de raspa', 'Botina de segurança', 'Cinto de segurança tipo paraquedista',
  'Máscara respiratória (PFF2)', 'Máscara respiratória semifacial', 'Avental de raspa', 'Protetor facial',
  'Colete refletivo', 'Perneira de segurança',
]

export default function Epis() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [entregas, setEntregas] = useState<any[]>([])
  const [funcSel, setFuncSel] = useState<any>(null)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState<any>(formVazio())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

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

    const [fRes, eRes] = await Promise.all([
      supabase.from('funcionarios').select('id,nome,cpf,funcao,setor').eq('empresa_id', empId).eq('ativo', true).order('nome').limit(2000),
      supabase.from('epis_entregues').select('*').eq('empresa_id', empId).order('data_entrega', { ascending: false }).limit(4000),
    ])
    setFuncionarios(fRes.data || [])
    setEntregas(eRes.data || [])
    setCarregando(false)
  }

  function entregasDoFunc(funcId: string) {
    return entregas.filter(e => e.funcionario_id === funcId)
  }

  function selecionarFunc(f: any) {
    setFuncSel(f)
    setErro(''); setSucesso('')
  }

  function abrirCriar() {
    setForm({ ...formVazio(), funcionario_id: funcSel?.id || '' })
    setErro(''); setSucesso('')
    setCriando(true)
  }

  async function salvar() {
    setErro(''); setSucesso('')
    if (!form.funcionario_id) { setErro('Selecione o funcionário.'); return }
    if (!form.epi_nome.trim()) { setErro('Informe o nome do EPI.'); return }
    if (!form.data_entrega) { setErro('Informe a data de entrega.'); return }
    setSalvando(true)

    const { error } = await supabase.from('epis_entregues').insert({
      empresa_id: empresaId, funcionario_id: form.funcionario_id,
      epi_nome: form.epi_nome.trim(), ca: form.ca.trim() || null,
      data_entrega: form.data_entrega,
      data_validade_ca: form.data_validade_ca || null,
      data_troca_prevista: form.data_troca_prevista || null,
      quantidade: parseInt(form.quantidade) || 1,
      ciencia: !!form.ciencia,
    })

    if (error) { setErro('Erro ao salvar: ' + error.message); setSalvando(false); return }
    setSucesso('EPI registrado com sucesso!')
    setCriando(false)
    await init()
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este registro de entrega de EPI?')) return
    await supabase.from('epis_entregues').delete().eq('id', id).eq('empresa_id', empresaId)
    setEntregas(prev => prev.filter(e => e.id !== id))
  }

  function diasParaVencer(d: string | null) {
    if (!d) return null
    return Math.round((new Date(d).getTime() - Date.now()) / 86400000)
  }

  const fmtData = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
  const funcsFiltrados = funcionarios.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()))
  const entregasSel = funcSel ? entregasDoFunc(funcSel.id) : []

  const totalCaVencido = entregas.filter(e => { const d = diasParaVencer(e.data_validade_ca); return d !== null && d < 0 }).length
  const totalSemCiencia = entregas.filter(e => !e.ciencia).length

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="epis">
      <Head><title>Ficha de EPI — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>Controle de EPI</div>
          <div style={s.sub}>NR-6 · {entregas.length} entrega(s) · {totalCaVencido} CA vencido(s) · {totalSemCiencia} sem ciência assinada</div>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && <div style={s.erroBox}>{erro}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:14 }}>
        <div>
          <input style={s.input} placeholder="Buscar funcionário..." value={busca} onChange={e => setBusca(e.target.value)} />
          <div style={{ marginTop:10, maxHeight:600, overflowY:'auto' }}>
            {funcsFiltrados.map(f => {
              const qtd = entregasDoFunc(f.id).length
              return (
                <div key={f.id} onClick={() => selecionarFunc(f)}
                  style={{ ...s.itemLista, border: funcSel?.id===f.id?'1.5px solid #185FA5':'0.5px solid #e5e7eb', background: funcSel?.id===f.id?'#E6F1FB':'#fff' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:12, fontWeight:600, color: funcSel?.id===f.id?'#0C447C':'#111' }}>{f.nome}</div>
                    <span style={{ padding:'2px 7px', borderRadius:99, fontSize:9, fontWeight:600, background: qtd>0?'#EAF3DE':'#f3f4f6', color: qtd>0?'#27500A':'#9ca3af' }}>
                      {qtd || '—'}
                    </span>
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
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Escolha na lista ao lado para ver ou registrar entregas de EPI</div>
            </div>
          )}
          {funcSel && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={s.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#111' }}>{funcSel.nome}</div>
                    <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{funcSel.funcao || '—'} · {funcSel.setor || '—'}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {entregasSel.length > 0 && (
                      <button style={{ ...s.btnOutline, color:'#27500A', borderColor:'#C0DD97', padding:'6px 14px', fontSize:12 }}
                        onClick={() => gerarPdfFichaEpi(funcSel, entregasSel, { razao_social: nomeEmpresa, cnpj: cnpjEmpresa })}>↓ Ficha PDF</button>
                    )}
                    <button style={{ ...s.btnPrimary, padding:'6px 14px', fontSize:12 }} onClick={abrirCriar}>+ Registrar entrega</button>
                  </div>
                </div>
              </div>

              <div style={s.card}>
                <div style={s.cardTit}>Entregas registradas ({entregasSel.length})</div>
                {entregasSel.length === 0 ? (
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhum EPI registrado para este funcionário.</div>
                ) : (
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, marginTop:10 }}>
                    <thead>
                      <tr style={{ background:'#f9fafb' }}>
                        {['EPI','CA','Qtd','Entrega','Validade CA','Troca prevista','Ciência',''].map(h => <th key={h} style={s.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {entregasSel.map(e => {
                        const diasCa = diasParaVencer(e.data_validade_ca)
                        return (
                          <tr key={e.id} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                            <td style={s.td}>{e.epi_nome}</td>
                            <td style={{ ...s.td, fontFamily:'monospace' }}>{e.ca || '—'}</td>
                            <td style={s.td}>{e.quantidade}</td>
                            <td style={s.td}>{fmtData(e.data_entrega)}</td>
                            <td style={s.td}>
                              {e.data_validade_ca ? (
                                <span style={{ color: diasCa !== null && diasCa < 0 ? '#E24B4A' : '#374151' }}>{fmtData(e.data_validade_ca)}</span>
                              ) : '—'}
                            </td>
                            <td style={s.td}>{fmtData(e.data_troca_prevista)}</td>
                            <td style={s.td}>
                              <span style={{ padding:'1px 7px', borderRadius:99, fontSize:10, fontWeight:600, background: e.ciencia ? '#EAF3DE' : '#FAEEDA', color: e.ciencia ? '#27500A' : '#633806' }}>
                                {e.ciencia ? 'Sim' : 'Pendente'}
                              </span>
                            </td>
                            <td style={s.td}>
                              <button onClick={() => excluir(e.id)} style={{ ...s.btnAcao, color:'#E24B4A', borderColor:'#F09595' }}>Excluir</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {criando && (
        <div style={s.overlay} onClick={() => setCriando(false)}>
          <div style={{ ...s.modal, width: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>+ Registrar entrega de EPI</div>
              <button onClick={() => setCriando(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
            </div>
            {erro && <div style={{ ...s.erroBox, marginBottom:12 }}>{erro}</div>}

            {!funcSel && (
              <div style={{ marginBottom:12 }}>
                <label style={s.label}>Funcionário *</label>
                <select style={s.input} value={form.funcionario_id} onChange={e => setForm({ ...form, funcionario_id: e.target.value })}>
                  <option value="">— selecione —</option>
                  {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom:12 }}>
              <label style={s.label}>EPI *</label>
              <input style={s.input} list="epis-sugestoes" value={form.epi_nome} onChange={e => setForm({ ...form, epi_nome: e.target.value })} />
              <datalist id="epis-sugestoes">
                {EPIS_COMUNS.map(nome => <option key={nome} value={nome} />)}
              </datalist>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div>
                <label style={s.label}>Certificado de Aprovação (CA)</label>
                <input style={s.input} value={form.ca} onChange={e => setForm({ ...form, ca: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Quantidade</label>
                <input style={s.input} type="number" min={1} value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div>
                <label style={s.label}>Data de entrega *</label>
                <input style={s.input} type="date" value={form.data_entrega} onChange={e => setForm({ ...form, data_entrega: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Validade do CA</label>
                <input style={s.input} type="date" value={form.data_validade_ca} onChange={e => setForm({ ...form, data_validade_ca: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={s.label}>Próxima troca prevista</label>
              <input style={s.input} type="date" value={form.data_troca_prevista} onChange={e => setForm({ ...form, data_troca_prevista: e.target.value })} />
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer', marginBottom:14 }}>
              <input type="checkbox" checked={form.ciencia} onChange={e => setForm({ ...form, ciencia: e.target.checked })} />
              Funcionário assinou ciência do recebimento e treinamento de uso
            </label>

            <div style={{ display:'flex', gap:8 }}>
              <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              <button style={s.btnOutline} onClick={() => setCriando(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

const s: Record<string, any> = {
  loading:    { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:     { fontSize:20, fontWeight:700, color:'#111' },
  sub:        { fontSize:12, color:'#6b7280', marginTop:2 },
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem' },
  cardTit:    { fontSize:13, fontWeight:600, color:'#111' },
  itemLista:  { padding:'9px 11px', borderRadius:8, marginBottom:6, cursor:'pointer' },
  th:         { padding:'8px 10px', textAlign:'left', fontSize:10, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' },
  td:         { padding:'9px 10px', verticalAlign:'top', color:'#374151' },
  label:      { display:'block', fontSize:11, fontWeight:500, color:'#374151', marginBottom:3 },
  input:      { width:'100%', padding:'7px 9px', fontSize:12, border:'1px solid #d1d5db', borderRadius:7, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  btnAcao:    { padding:'3px 9px', fontSize:10, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151', whiteSpace:'nowrap' },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:12, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' },
  modal:      { background:'#fff', borderRadius:12, padding:'1.5rem', width:480, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
}
