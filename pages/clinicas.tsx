import { useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'

const formVazio = () => ({ id:'', nome:'', cnpj:'', endereco:'', telefone:'', email:'' })

export default function Clinicas() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [clinicas, setClinicas] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
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
    const { data } = await supabase.from('clinicas').select('*').eq('empresa_id', empId).order('nome')
    setClinicas(data || [])
    setCarregando(false)
  }

  function abrirNovo() {
    setForm(formVazio())
    setErro(''); setSucesso('')
    setEditando(true)
  }

  function abrirEdicao(c: any) {
    setForm({ id:c.id, nome:c.nome||'', cnpj:c.cnpj||'', endereco:c.endereco||'', telefone:c.telefone||'', email:c.email||'' })
    setErro(''); setSucesso('')
    setEditando(true)
  }

  async function salvar() {
    setErro(''); setSucesso('')
    if (!form.nome.trim()) { setErro('Informe o nome da clínica.'); return }
    setSalvando(true)

    const dados = {
      empresa_id: empresaId, nome: form.nome.trim(), cnpj: form.cnpj || null,
      endereco: form.endereco || null, telefone: form.telefone || null, email: form.email || null,
      atualizado_em: new Date().toISOString(),
    }

    const { error } = form.id
      ? await supabase.from('clinicas').update(dados).eq('id', form.id)
      : await supabase.from('clinicas').insert(dados)

    if (error) { setErro('Erro ao salvar: ' + error.message); setSalvando(false); return }
    setSucesso('Clínica salva com sucesso!')
    setEditando(false)
    await init()
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta clínica do cadastro?')) return
    const { error } = await supabase.from('clinicas').delete().eq('id', id).eq('empresa_id', empresaId)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setClinicas(prev => prev.filter(c => c.id !== id))
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  const filtradas = clinicas.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <Layout pagina="clinicas">
      <Head><title>Clínicas — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>Cadastro de Clínicas</div>
          <div style={s.sub}>Registro reutilizável para PCMSO — clínica designada para exames ocupacionais</div>
        </div>
        <button style={s.btnPrimary} onClick={abrirNovo}>+ Nova clínica</button>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && <div style={s.erroBox}>{erro}</div>}

      <input style={{ ...s.input, marginBottom:14, maxWidth:320 }} placeholder="Buscar clínica..." value={busca} onChange={e => setBusca(e.target.value)} />

      <div style={s.card}>
        {filtradas.length === 0 ? (
          <div style={{ fontSize:12, color:'#9ca3af', padding:'1rem 0', textAlign:'center' }}>Nenhuma clínica cadastrada.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#f9fafb' }}>
                {['Nome','CNPJ','Endereço','Telefone','Email',''].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtradas.map(c => (
                <tr key={c.id} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                  <td style={{ ...s.td, fontWeight:600, color:'#111' }}>{c.nome}</td>
                  <td style={s.td}>{c.cnpj || '—'}</td>
                  <td style={s.td}>{c.endereco || '—'}</td>
                  <td style={s.td}>{c.telefone || '—'}</td>
                  <td style={s.td}>{c.email || '—'}</td>
                  <td style={s.td}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => abrirEdicao(c)} style={s.btnAcao}>Editar</button>
                      <button onClick={() => excluir(c.id)} style={{ ...s.btnAcao, color:'#E24B4A', borderColor:'#F09595' }}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editando && (
        <div style={s.overlay} onClick={() => setEditando(false)}>
          <div style={{ ...s.modal, width: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>{form.id ? 'Editar clínica' : '+ Nova clínica'}</div>
              <button onClick={() => setEditando(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
            </div>
            {erro && <div style={{ ...s.erroBox, marginBottom:12 }}>{erro}</div>}

            <div style={{ marginBottom:12 }}>
              <label style={s.label}>Nome *</label>
              <input style={s.input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={s.label}>CNPJ</label>
              <input style={s.input} value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={s.label}>Endereço</label>
              <input style={s.input} value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              <div>
                <label style={s.label}>Telefone</label>
                <input style={s.input} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Email</label>
                <input style={s.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              <button style={s.btnOutline} onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

const s: Record<string, CSSProperties> = {
  loading:    { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:     { fontSize:20, fontWeight:700, color:'#111' },
  sub:        { fontSize:12, color:'#6b7280', marginTop:2 },
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem' },
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
  modal:      { background:'#fff', borderRadius:12, padding:'1.5rem', width:440, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
}
