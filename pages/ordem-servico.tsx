import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'
import { gerarPdfOrdemServico } from '../lib/gerar-pdf'

const norm = (s: any) => String(s ?? '').trim().toLowerCase()

function gheDaFuncao(ghes: any[], funcao: string) {
  if (!funcao) return null
  return ghes.find(g => (g.funcoes || []).some((f: any) => norm(f.nome || f) === norm(funcao))) || null
}

const formVazio = () => ({
  funcao: '', setor: '', riscos: [] as any[], medidas_preventivas: [] as string[],
  epis_obrigatorios: [] as string[], resp_nome: '', resp_cargo: '', data_emissao: new Date().toISOString().split('T')[0],
})

export default function OrdemServico() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [lista, setLista] = useState<any[]>([])
  const [ghes, setGhes] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [selecionada, setSelecionada] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [novaMedida, setNovaMedida] = useState('')
  const [novoEpi, setNovoEpi] = useState('')
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

    const [osRes, ghesRes, funcsRes] = await Promise.all([
      supabase.from('ordens_servico').select('*').eq('empresa_id', empId).eq('ativo', true).order('funcao'),
      supabase.from('ghes').select('*').eq('empresa_id', empId),
      supabase.from('funcionarios').select('id,nome,funcao,setor').eq('empresa_id', empId).eq('ativo', true).order('nome').limit(2000),
    ])
    setLista(osRes.data || [])
    setGhes(ghesRes.data || [])
    setFuncionarios(funcsRes.data || [])
    setCarregando(false)
  }

  function funcionariosDaFuncao(funcao: string) {
    return funcionarios.filter(f => norm(f.funcao) === norm(funcao))
  }

  function selecionar(os: any) {
    setSelecionada(os)
    setModoEdicao(false)
    setForm(null)
    setSucesso(''); setErro('')
  }

  function abrirNova() {
    setSelecionada(null)
    setForm(formVazio())
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function abrirEditar(os: any) {
    setForm(JSON.parse(JSON.stringify(os)))
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function carregarDoGhe() {
    const ghe = gheDaFuncao(ghes, form.funcao)
    if (!ghe) { setErro('Nenhum GHE encontrado com essa função vinculada (cadastre em /ghes).'); return }
    setForm((p: any) => ({
      ...p,
      setor: p.setor || ghe.setor || '',
      riscos: (ghe.riscos || []).map((r: any) => ({ tipo: r.tipo, nome: r.nome })),
      epis_obrigatorios: Array.from(new Set([...(p.epis_obrigatorios || []), ...((ghe.epi || []).map((e: any) => e.nome).filter(Boolean))])),
      medidas_preventivas: Array.from(new Set([...(p.medidas_preventivas || []), ...((ghe.epc || []).map((e: any) => e.nome).filter(Boolean))])),
    }))
    setErro('')
  }

  function addMedida() {
    if (!novaMedida.trim()) return
    setForm((p: any) => ({ ...p, medidas_preventivas: [...(p.medidas_preventivas || []), novaMedida.trim()] }))
    setNovaMedida('')
  }
  function removerMedida(i: number) {
    setForm((p: any) => ({ ...p, medidas_preventivas: p.medidas_preventivas.filter((_: any, idx: number) => idx !== i) }))
  }
  function addEpi() {
    if (!novoEpi.trim()) return
    setForm((p: any) => ({ ...p, epis_obrigatorios: [...(p.epis_obrigatorios || []), novoEpi.trim()] }))
    setNovoEpi('')
  }
  function removerEpi(i: number) {
    setForm((p: any) => ({ ...p, epis_obrigatorios: p.epis_obrigatorios.filter((_: any, idx: number) => idx !== i) }))
  }
  function removerRisco(i: number) {
    setForm((p: any) => ({ ...p, riscos: p.riscos.filter((_: any, idx: number) => idx !== i) }))
  }
  function addRisco() {
    setForm((p: any) => ({ ...p, riscos: [...(p.riscos || []), { tipo: 'Físico', nome: '' }] }))
  }
  function setRiscoField(i: number, field: string, value: string) {
    setForm((p: any) => {
      const riscos = [...p.riscos]
      riscos[i] = { ...riscos[i], [field]: value }
      return { ...p, riscos }
    })
  }

  function toggleCiencia(func: any) {
    setForm((p: any) => {
      const ciencias = [...(p.ciencias || [])]
      const idx = ciencias.findIndex((c: any) => c.funcionario_id === func.id)
      if (idx >= 0) ciencias.splice(idx, 1)
      else ciencias.push({ funcionario_id: func.id, nome: func.nome, data_ciencia: new Date().toISOString().split('T')[0] })
      return { ...p, ciencias }
    })
  }

  async function salvar() {
    setErro(''); setSucesso('')
    if (!form.funcao.trim()) { setErro('Informe a função.'); return }
    setSalvando(true)

    const dados = {
      empresa_id: empresaId,
      funcao: form.funcao.trim(), setor: form.setor?.trim() || '',
      riscos: form.riscos || [], medidas_preventivas: form.medidas_preventivas || [],
      epis_obrigatorios: form.epis_obrigatorios || [], ciencias: form.ciencias || [],
      resp_nome: form.resp_nome || null, resp_cargo: form.resp_cargo || null,
      data_emissao: form.data_emissao || null,
      atualizado_em: new Date().toISOString(),
    }

    const { error } = form.id
      ? await supabase.from('ordens_servico').update(dados).eq('id', form.id).eq('empresa_id', empresaId)
      : await supabase.from('ordens_servico').insert(dados)

    if (error) {
      setErro(error.message.includes('unique') ? 'Já existe uma Ordem de Serviço para essa função/setor.' : 'Erro ao salvar: ' + error.message)
      setSalvando(false); return
    }
    setSucesso(form.id ? 'Ordem de Serviço atualizada!' : 'Ordem de Serviço criada!')
    setModoEdicao(false); setForm(null)
    await init()
    setSalvando(false)
  }

  async function arquivar(id: string) {
    if (!confirm('Arquivar esta Ordem de Serviço?')) return
    await supabase.from('ordens_servico').update({ ativo: false }).eq('id', id).eq('empresa_id', empresaId)
    setSelecionada(null)
    await init()
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="ordem-servico">
      <Head><title>Ordem de Serviço — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>Ordem de Serviço</div>
          <div style={s.sub}>NR-1, item 1.4.1 · {lista.length} função(ões) com OS emitida</div>
        </div>
        <button style={s.btnPrimary} onClick={abrirNova}>+ Nova Ordem de Serviço</button>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && !modoEdicao && <div style={s.erroBox}>{erro}</div>}

      {!modoEdicao && (
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:14 }}>
          <div style={{ maxHeight:600, overflowY:'auto' }}>
            {lista.length === 0 && <div style={{ fontSize:12, color:'#9ca3af', textAlign:'center', padding:'1rem' }}>Nenhuma Ordem de Serviço cadastrada.</div>}
            {lista.map(os => (
              <div key={os.id} onClick={() => selecionar(os)}
                style={{ ...s.itemLista, border: selecionada?.id===os.id?'1.5px solid #185FA5':'0.5px solid #e5e7eb', background: selecionada?.id===os.id?'#E6F1FB':'#fff' }}>
                <div style={{ fontSize:12, fontWeight:600, color: selecionada?.id===os.id?'#0C447C':'#111' }}>{os.funcao}</div>
                <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{os.setor || 'Sem setor'} · {funcionariosDaFuncao(os.funcao).length} funcionário(s)</div>
              </div>
            ))}
          </div>

          <div>
            {!selecionada ? (
              <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
                <div style={{ fontSize:14, color:'#374151' }}>Selecione uma função</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Ou crie uma nova Ordem de Serviço</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={s.card}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#111' }}>{selecionada.funcao}</div>
                      <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{selecionada.setor || '—'} · Emitida em {selecionada.data_emissao ? new Date(selecionada.data_emissao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={{ ...s.btnPrimary, padding:'6px 14px', fontSize:12 }} onClick={() => abrirEditar(selecionada)}>✏ Editar</button>
                      <button style={{ ...s.btnOutline, color:'#27500A', borderColor:'#C0DD97', padding:'6px 14px', fontSize:12 }}
                        onClick={() => gerarPdfOrdemServico(selecionada, { razao_social: nomeEmpresa, cnpj: cnpjEmpresa })}>↓ PDF</button>
                      <button style={{ ...s.btnOutline, color:'#791F1F', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }} onClick={() => arquivar(selecionada.id)}>Arquivar</button>
                    </div>
                  </div>
                </div>

                <div style={s.card}>
                  <div style={s.cardTit}>Riscos ({(selecionada.riscos||[]).length})</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                    {(selecionada.riscos||[]).map((r: any, i: number) => (
                      <span key={i} style={{ padding:'3px 9px', borderRadius:99, fontSize:11, background:'#E6F1FB', color:'#0C447C' }}>{r.tipo}: {r.nome}</span>
                    ))}
                    {(selecionada.riscos||[]).length === 0 && <span style={{ fontSize:12, color:'#9ca3af' }}>Nenhum risco vinculado.</span>}
                  </div>
                </div>

                <div style={s.card}>
                  <div style={s.cardTit}>Medidas preventivas ({(selecionada.medidas_preventivas||[]).length})</div>
                  <ul style={{ margin:'8px 0 0', paddingLeft:18, fontSize:12, color:'#374151' }}>
                    {(selecionada.medidas_preventivas||[]).map((m: string, i: number) => <li key={i}>{m}</li>)}
                  </ul>
                </div>

                <div style={s.card}>
                  <div style={s.cardTit}>EPIs obrigatórios ({(selecionada.epis_obrigatorios||[]).length})</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                    {(selecionada.epis_obrigatorios||[]).map((e: string, i: number) => (
                      <span key={i} style={{ padding:'3px 9px', borderRadius:99, fontSize:11, background:'#EAF3DE', color:'#27500A' }}>{e}</span>
                    ))}
                  </div>
                </div>

                <div style={s.card}>
                  <div style={s.cardTit}>Ciência dos funcionários ({(selecionada.ciencias||[]).length}/{funcionariosDaFuncao(selecionada.funcao).length})</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>Edite a Ordem de Serviço para marcar quem já deu ciência.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {modoEdicao && form && (
        <div style={{ ...s.card, border:'1.5px solid #185FA5' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>{form.id ? `Editar — ${form.funcao}` : 'Nova Ordem de Serviço'}</div>
            <button onClick={() => { setModoEdicao(false); setForm(null) }} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
          </div>
          {erro && <div style={{ ...s.erroBox, marginBottom:12 }}>{erro}</div>}

          <div style={s.row2}>
            <div>
              <label style={s.label}>Função *</label>
              <datalist id="funcoes-existentes-os">
                {funcionarios.map(f => f.funcao).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(fn => (
                  <option key={fn} value={fn} />
                ))}
              </datalist>
              <input style={s.input} value={form.funcao} list="funcoes-existentes-os"
                onChange={e => {
                  const v = e.target.value
                  const func = funcionarios.find(f => norm(f.funcao) === norm(v))
                  setForm((p: any) => ({ ...p, funcao: v, setor: p.setor || (func ? func.setor || '' : '') }))
                }} />
            </div>
            <div>
              <label style={s.label}>Setor</label>
              <input style={s.input} value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} />
            </div>
          </div>
          <div style={s.row2}>
            <div>
              <label style={s.label}>Responsável</label>
              <input style={s.input} value={form.resp_nome} onChange={e => setForm({ ...form, resp_nome: e.target.value })} />
            </div>
            <div>
              <label style={s.label}>Data de emissão</label>
              <input style={s.input} type="date" value={form.data_emissao || ''} onChange={e => setForm({ ...form, data_emissao: e.target.value })} />
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>Riscos ({form.riscos?.length || 0})</label>
              <div style={{ display:'flex', gap:6 }}>
                <button style={{ ...s.btnAcao, fontSize:11 }} onClick={carregarDoGhe}>↻ Carregar do GHE</button>
                <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addRisco}>+ Risco</button>
              </div>
            </div>
            {(form.riscos || []).map((r: any, i: number) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'120px 1fr 22px', gap:6, marginBottom:6 }}>
                <select style={s.input} value={r.tipo} onChange={e => setRiscoField(i, 'tipo', e.target.value)}>
                  {['Físico','Químico','Biológico','Ergonômico','Mecânico/Acidente'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input style={s.input} placeholder="Nome do risco" value={r.nome} onChange={e => setRiscoField(i, 'nome', e.target.value)} />
                <button onClick={() => removerRisco(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:15 }}>×</button>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={s.label}>Medidas preventivas ({form.medidas_preventivas?.length || 0})</label>
            {(form.medidas_preventivas || []).map((m: string, i: number) => (
              <div key={i} style={{ display:'flex', gap:6, marginBottom:6, alignItems:'center' }}>
                <div style={{ flex:1, fontSize:12 }}>{m}</div>
                <button onClick={() => removerMedida(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:15 }}>×</button>
              </div>
            ))}
            <div style={{ display:'flex', gap:6 }}>
              <input style={s.input} placeholder="Ex: Utilizar corrimão nas escadas" value={novaMedida} onChange={e => setNovaMedida(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMedida()} />
              <button style={{ ...s.btnAcao, whiteSpace:'nowrap' }} onClick={addMedida}>+ Adicionar</button>
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={s.label}>EPIs obrigatórios ({form.epis_obrigatorios?.length || 0})</label>
            {(form.epis_obrigatorios || []).map((e: string, i: number) => (
              <div key={i} style={{ display:'flex', gap:6, marginBottom:6, alignItems:'center' }}>
                <div style={{ flex:1, fontSize:12 }}>{e}</div>
                <button onClick={() => removerEpi(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:15 }}>×</button>
              </div>
            ))}
            <div style={{ display:'flex', gap:6 }}>
              <input style={s.input} placeholder="Ex: Óculos de proteção" value={novoEpi} onChange={e => setNovoEpi(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEpi()} />
              <button style={{ ...s.btnAcao, whiteSpace:'nowrap' }} onClick={addEpi}>+ Adicionar</button>
            </div>
          </div>

          {form.funcao && (
            <div style={{ marginBottom:14 }}>
              <label style={s.label}>Ciência dos funcionários desta função</label>
              <div style={{ maxHeight:180, overflowY:'auto', border:'0.5px solid #e5e7eb', borderRadius:8, padding:8 }}>
                {funcionariosDaFuncao(form.funcao).length === 0 && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum funcionário ativo com essa função ainda.</div>}
                {funcionariosDaFuncao(form.funcao).map(f => {
                  const tem = (form.ciencias || []).some((c: any) => c.funcionario_id === f.id)
                  return (
                    <label key={f.id} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, padding:'3px 0', cursor:'pointer' }}>
                      <input type="checkbox" checked={tem} onChange={() => toggleCiencia(f)} />
                      {f.nome}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            <button style={s.btnOutline} onClick={() => { setModoEdicao(false); setForm(null) }}>Cancelar</button>
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
  row2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 },
  label:      { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 },
  input:      { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  btnAcao:    { padding:'3px 10px', fontSize:11, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151' },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
}
