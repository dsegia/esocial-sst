import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { gerarPdfPgr } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TIPO_AGENTE = { fis:'Físico', qui:'Químico', bio:'Biológico', erg:'Ergonômico' }
const COR_AGENTE  = { fis:'#E6F1FB', qui:'#FAEEDA', bio:'#EAF3DE', erg:'#FCEBEB' }
const TXT_AGENTE  = { fis:'#0C447C', qui:'#633806', bio:'#27500A', erg:'#791F1F' }

const STATUS_ACAO = [
  { key:'pendente',    label:'Pendente',    cor:'#791F1F', bg:'#FCEBEB' },
  { key:'andamento',   label:'Em andamento',cor:'#633806', bg:'#FAEEDA' },
  { key:'concluida',   label:'Concluída',   cor:'#27500A', bg:'#EAF3DE' },
]

function inventarioDoLtcat(ltcat) {
  if (!ltcat?.ghes) return []
  const vistos = new Set()
  const lista = []
  for (const ghe of ltcat.ghes) {
    for (const ag of (ghe.agentes || [])) {
      const chave = `${ghe.nome}__${ag.nome}`
      if (vistos.has(chave)) continue
      vistos.add(chave)
      lista.push({ ghe: ghe.nome || '—', tipo: ag.tipo, nome: ag.nome, valor: ag.valor || '', unidade: ag.unidade || '' })
    }
  }
  return lista
}

const acaoVazia = (risco = '') => ({ risco, medida_controle: '', prazo: '', responsavel: '', status: 'pendente' })

export default function PGR() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [ltcatAtivo, setLtcatAtivo] = useState(null)
  const [pgrs, setPgrs] = useState([])
  const [pgrSel, setPgrSel] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('documento')
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

    const [ltcatRes, pgrRes] = await Promise.all([
      supabase.from('ltcats').select('*').eq('empresa_id', empId).eq('ativo', true).order('data_emissao', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('pgr').select('*').eq('empresa_id', empId).order('criado_em', { ascending: false }),
    ])
    setLtcatAtivo(ltcatRes.data || null)
    setPgrs(pgrRes.data || [])
    setPgrSel(pgrRes.data?.[0] || null)
    setCarregando(false)
  }

  function abrirNovo() {
    const inventario = inventarioDoLtcat(ltcatAtivo)
    setForm({
      data_elaboracao: new Date().toISOString().split('T')[0],
      prox_revisao: '',
      resp_nome: ltcatAtivo?.resp_nome || '',
      resp_conselho: ltcatAtivo?.resp_conselho || 'CREA',
      resp_registro: ltcatAtivo?.resp_registro || '',
      inventario,
      plano_acao: [...new Set(inventario.map(i => i.nome))].map(acaoVazia),
    })
    setAba('editar')
    setSucesso(''); setErro('')
  }

  function abrirEdicao(pgr) {
    setForm(JSON.parse(JSON.stringify(pgr)))
    setAba('editar')
    setSucesso(''); setErro('')
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
      data_elaboracao: form.data_elaboracao,
      prox_revisao: form.prox_revisao || null,
      resp_nome: form.resp_nome,
      resp_conselho: form.resp_conselho || 'CREA',
      resp_registro: form.resp_registro || null,
      inventario: form.inventario || [],
      plano_acao: form.plano_acao || [],
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

  function addRiscoManual() {
    setForm(p => ({ ...p, inventario: [...(p.inventario || []), { ghe: 'Manual', tipo: 'fis', nome: '', valor: '', unidade: '' }] }))
  }

  function setRisco(i, field, value) {
    setForm(p => {
      const inventario = [...p.inventario]
      inventario[i] = { ...inventario[i], [field]: value }
      return { ...p, inventario }
    })
  }

  function removerRisco(i) {
    setForm(p => ({ ...p, inventario: p.inventario.filter((_, idx) => idx !== i) }))
  }

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
        inventario: pgr.inventario || [],
        plano_acao: pgr.plano_acao || [],
      },
      { razao_social: nomeEmpresa, cnpj: cnpjEmpresa }
    )
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  const acoesPendentes = (pgrSel?.plano_acao || []).filter(a => a.status !== 'concluida').length

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
            <button style={s.btnOutline} onClick={() => exportarPdf(pgrSel)}>📄 Exportar PDF</button>
          )}
          <button style={s.btnPrimary} onClick={abrirNovo}>+ Novo PGR</button>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && aba !== 'editar' && <div style={s.erroBox}>{erro}</div>}

      {!ltcatAtivo && (
        <div style={{ ...s.card, background:'#FAEEDA', border:'0.5px solid #F3D9A4' }}>
          <div style={{ fontSize:13, color:'#633806' }}>
            Nenhum LTCAT vigente encontrado. O inventário de riscos pode ser cadastrado manualmente, mas recomendamos cadastrar o LTCAT primeiro para herdar os agentes de risco automaticamente.
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1.25rem' }}>
        {[
          { n: pgrSel ? 'Vigente' : 'Ausente', l:'PGR', c: pgrSel ? '#1D9E75' : '#E24B4A' },
          { n: pgrSel?.inventario?.length || 0, l:'Riscos no inventário', c:'#185FA5' },
          { n: pgrSel?.plano_acao?.length || 0, l:'Ações no plano', c:'#185FA5' },
          { n: acoesPendentes, l:'Ações pendentes', c: acoesPendentes > 0 ? '#E24B4A' : '#1D9E75' },
        ].map((k,i) => (
          <div key={i} style={s.kpiCard}>
            <div style={{ fontSize:22, fontWeight:700, color:k.c }}>{k.n}</div>
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
                Monte o inventário de riscos e o plano de ação da empresa
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
                <div style={s.cardTit}>Inventário de riscos ({pgrSel.inventario?.length || 0})</div>
                {pgrSel.inventario?.length ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                    {pgrSel.inventario.map((r,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid #f3f4f6' }}>
                        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, background:COR_AGENTE[r.tipo]||'#f3f4f6', color:TXT_AGENTE[r.tipo]||'#374151' }}>
                          {TIPO_AGENTE[r.tipo] || r.tipo}
                        </span>
                        <span style={{ fontSize:13, flex:1 }}>{r.nome}{r.valor ? ` — ${r.valor}${r.unidade ? ` ${r.unidade}` : ''}` : ''}</span>
                        <span style={{ fontSize:11, color:'#9ca3af' }}>{r.ghe}</span>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhum risco cadastrado.</div>}
              </div>

              <div style={s.card}>
                <div style={s.cardTit}>Plano de ação ({pgrSel.plano_acao?.length || 0})</div>
                {pgrSel.plano_acao?.length ? (
                  <div style={{ overflowX:'auto', marginTop:10 }}>
                    <table style={s.table}>
                      <thead>
                        <tr style={{ background:'#f9fafb' }}>
                          {['Risco','Medida de controle','Prazo','Responsável','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {pgrSel.plano_acao.map((a,i) => {
                          const st = STATUS_ACAO.find(x => x.key === a.status) || STATUS_ACAO[0]
                          return (
                            <tr key={i} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                              <td style={s.td}>{a.risco || '—'}</td>
                              <td style={s.td}>{a.medida_controle || '—'}</td>
                              <td style={s.td}>{a.prazo ? new Date(a.prazo+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                              <td style={s.td}>{a.responsavel || '—'}</td>
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

          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>Inventário de riscos ({form.inventario?.length || 0})</label>
              <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addRiscoManual}>+ Adicionar risco</button>
            </div>
            {(form.inventario || []).map((r, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'100px 1fr 80px 100px 60px 28px', gap:6, alignItems:'center', padding:'5px 0', borderBottom:'0.5px solid #f3f4f6' }}>
                <select style={s.inputSm} value={r.tipo} onChange={e => setRisco(i, 'tipo', e.target.value)}>
                  {Object.entries(TIPO_AGENTE).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <input style={s.inputSm} placeholder="Agente / risco" value={r.nome} onChange={e => setRisco(i, 'nome', e.target.value)} />
                <input style={s.inputSm} placeholder="Valor" value={r.valor || ''} onChange={e => setRisco(i, 'valor', e.target.value)} />
                <input style={s.inputSm} placeholder="Medida" list="unidades-medida" value={r.unidade || ''} onChange={e => setRisco(i, 'unidade', e.target.value)} />
                <div style={{ fontSize:10, color:'#9ca3af', textAlign:'center' }}>{r.ghe}</div>
                <button onClick={() => removerRisco(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:16 }}>×</button>
              </div>
            ))}
            <datalist id="unidades-medida">
              <option value="dB(A)" />
              <option value="ppm" />
              <option value="mg/m³" />
              <option value="µg/m³" />
              <option value="fibras/cm³" />
              <option value="IBUTG °C" />
              <option value="lux" />
              <option value="m/s²" />
              <option value="%" />
            </datalist>
            {!(form.inventario || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum risco. Cadastre um LTCAT vigente ou adicione manualmente.</div>}
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>Plano de ação ({form.plano_acao?.length || 0})</label>
              <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addAcao}>+ Adicionar ação</button>
            </div>
            {(form.plano_acao || []).map((a, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 110px 1fr 130px 28px', gap:6, alignItems:'center', padding:'5px 0', borderBottom:'0.5px solid #f3f4f6' }}>
                <input style={s.inputSm} placeholder="Risco" value={a.risco} onChange={e => setAcao(i, 'risco', e.target.value)} />
                <input style={s.inputSm} placeholder="Medida de controle" value={a.medida_controle} onChange={e => setAcao(i, 'medida_controle', e.target.value)} />
                <input type="date" style={s.inputSm} value={a.prazo || ''} onChange={e => setAcao(i, 'prazo', e.target.value)} />
                <input style={s.inputSm} placeholder="Responsável" value={a.responsavel} onChange={e => setAcao(i, 'responsavel', e.target.value)} />
                <select style={s.inputSm} value={a.status} onChange={e => setAcao(i, 'status', e.target.value)}>
                  {STATUS_ACAO.map(st => <option key={st.key} value={st.key}>{st.label}</option>)}
                </select>
                <button onClick={() => removerAcao(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:16 }}>×</button>
              </div>
            ))}
            {!(form.plano_acao || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhuma ação cadastrada.</div>}
          </div>

          {erro && <div style={s.erroBox}>{erro}</div>}

          <div style={{ display:'flex', gap:8 }}>
            <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar PGR'}</button>
            <button style={s.btnOutline} onClick={cancelarEdicao}>Cancelar</button>
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
  secLabel:   { fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 },
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
}
