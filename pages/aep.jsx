import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { gerarPdfAep } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'
import { TEXTOS_LEGAIS_AEP } from '../lib/aep-conteudo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function gheDoFuncionario(ltcat, func) {
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

const AGENTE_TIPOS = ['Físico', 'Químico', 'Biológico', 'Ergonômico', 'Mecânico/Acidente']
const agenteVazio = () => ({ tipo: AGENTE_TIPOS[0], nome: '', valor: '', limite: '' })

export default function AEP() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [respLegalEmpresa, setRespLegalEmpresa] = useState('')
  const [funcionarios, setFuncionarios] = useState([])
  const [ltcatAtivo, setLtcatAtivo] = useState(null)
  const [aeps, setAeps] = useState([])
  const [funcSel, setFuncSel] = useState(null)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [form, setForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const [textoAberto, setTextoAberto] = useState(null)

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

    const [funcsRes, ltcatRes, aepRes] = await Promise.all([
      supabase.from('funcionarios').select('id,nome,cpf,funcao,setor,matricula_esocial,data_adm,ativo,data_desligamento').eq('empresa_id', empId).order('nome').limit(2000),
      supabase.from('ltcats').select('*').eq('empresa_id', empId).eq('ativo', true).order('data_emissao', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('aep').select('*').eq('empresa_id', empId),
    ])
    setFuncionarios(funcsRes.data || [])
    setLtcatAtivo(ltcatRes.data || null)
    setAeps(aepRes.data || [])
    setCarregando(false)
  }

  function aepDoFunc(funcId) {
    return aeps.find(a => a.funcionario_id === funcId) || null
  }

  function selecionarFunc(func) {
    setFuncSel(func)
    setModoEdicao(false)
    setForm(null)
    setSucesso(''); setErro('')
  }

  function criarAep() {
    const ghe = gheDoFuncionario(ltcatAtivo, funcSel)
    setForm({
      data_emissao: new Date().toISOString().split('T')[0],
      periodo_inicio: funcSel.data_adm || '', periodo_fim: '',
      funcao: funcSel.funcao || '', setor: funcSel.setor || '',
      agentes: ghe ? (ghe.agentes || []) : [],
      epc_epi_eficaz: true,
      conclusao: '',
      resp_nome: '', resp_cargo: '', resp_conselho: 'CREA', resp_registro: '',
      textos_legais_custom: {},
    })
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function editarAep(aep) {
    setForm(JSON.parse(JSON.stringify(aep)))
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function cancelarEdicao() {
    setModoEdicao(false)
    setForm(null)
  }

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

  async function salvar() {
    if (!form.resp_nome) { setErro('Informe o responsável técnico.'); return }
    if (!form.data_emissao) { setErro('Informe a data de emissão.'); return }
    setSalvando(true); setErro(''); setSucesso('')

    const dados = {
      empresa_id: empresaId,
      funcionario_id: funcSel.id,
      data_emissao: form.data_emissao || null,
      periodo_inicio: form.periodo_inicio || null,
      periodo_fim: form.periodo_fim || null,
      funcao: form.funcao || null,
      setor: form.setor || null,
      agentes: form.agentes || [],
      epc_epi_eficaz: !!form.epc_epi_eficaz,
      conclusao: form.conclusao || null,
      resp_nome: form.resp_nome,
      resp_cargo: form.resp_cargo || null,
      resp_conselho: form.resp_conselho || 'CREA',
      resp_registro: form.resp_registro || null,
      textos_legais_custom: form.textos_legais_custom || {},
      atualizado_em: new Date().toISOString(),
    }

    const { error } = await supabase.from('aep').upsert(dados, { onConflict: 'funcionario_id' })

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso('AEP salvo com sucesso!')
      setModoEdicao(false)
      setForm(null)
      await init()
    }
    setSalvando(false)
  }

  async function excluir(funcId) {
    if (!confirm('EXCLUIR este AEP permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('aep').delete().eq('funcionario_id', funcId)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    init()
  }

  function addAgente() {
    setForm(p => ({ ...p, agentes: [...(p.agentes || []), agenteVazio()] }))
  }

  function setAgenteField(j, field, value) {
    setForm(p => {
      const agentes = [...(p.agentes || [])]
      agentes[j] = { ...agentes[j], [field]: value }
      return { ...p, agentes }
    })
  }

  function removerAgente(j) {
    setForm(p => ({ ...p, agentes: (p.agentes || []).filter((_, idx) => idx !== j) }))
  }

  function exportarPdf(aep, func) {
    gerarPdfAep(
      { funcionario: func, dados_gerais: aep, agentes: aep.agentes || [], textos_legais_custom: aep.textos_legais_custom || {} },
      { razao_social: nomeEmpresa, cnpj: cnpjEmpresa, resp_nome: respLegalEmpresa }
    )
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  const funcsFiltrados = funcionarios.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()))
  const aepSel = funcSel ? aepDoFunc(funcSel.id) : null
  const totalComAep = aeps.length
  const idsAtivos = new Set(funcionarios.filter(f => f.ativo).map(f => f.id))
  const funcionariosAtivosCount = idsAtivos.size
  const comAepAtivos = aeps.filter(a => idsAtivos.has(a.funcionario_id)).length

  return (
    <Layout pagina="aep">
      <Head><title>AEP — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>AEP</div>
          <div style={s.sub}>Atestado de Exposição a Agentes Nocivos</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:'1.25rem' }}>
        {[
          { n: funcionariosAtivosCount, l:'Funcionários ativos', c:'#185FA5' },
          { n: totalComAep, l:'Com AEP cadastrado (total)', c: totalComAep > 0 ? '#1D9E75' : '#E24B4A' },
          { n: funcionariosAtivosCount - comAepAtivos, l:'Ativos sem AEP', c: (funcionariosAtivosCount - comAepAtivos) > 0 ? '#E24B4A' : '#1D9E75' },
        ].map((k,i) => (
          <div key={i} style={s.kpiCard}>
            <div style={{ fontSize:22, fontWeight:700, color:k.c }}>{k.n}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && <div style={s.erroBox}>{erro}</div>}

      {!ltcatAtivo && (
        <div style={{ ...s.card, background:'#FAEEDA', border:'0.5px solid #F3D9A4', marginBottom:'1rem' }}>
          <div style={{ fontSize:13, color:'#633806' }}>
            Nenhum LTCAT vigente encontrado. Os agentes podem ser cadastrados manualmente, mas recomendamos cadastrar o LTCAT primeiro para herdar os agentes de risco automaticamente por setor.
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:14 }}>
        <div>
          <input style={s.input} placeholder="Buscar funcionário..." value={busca} onChange={e => setBusca(e.target.value)} />
          <div style={{ marginTop:10, maxHeight:560, overflowY:'auto' }}>
            {funcsFiltrados.map(f => {
              const tem = !!aepDoFunc(f.id)
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
                        {tem ? 'AEP' : '—'}
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
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Escolha na lista ao lado para ver ou criar o AEP</div>
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
                  {aepSel ? (
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={{ ...s.btnPrimary, padding:'6px 14px', fontSize:12 }} onClick={() => editarAep(aepSel)}>✏ Editar</button>
                      <button style={{ ...s.btnOutline, color:'#27500A', borderColor:'#C0DD97', padding:'6px 14px', fontSize:12 }} onClick={() => exportarPdf(aepSel, funcSel)}>↓ PDF</button>
                      <button style={{ ...s.btnOutline, color:'#791F1F', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }} onClick={() => excluir(funcSel.id)}>🗑</button>
                    </div>
                  ) : (
                    <button style={s.btnPrimary} onClick={criarAep}>+ Criar AEP</button>
                  )}
                </div>
              </div>

              {aepSel ? (
                <>
                  <div style={s.card}>
                    <div style={s.row2}>
                      <div>
                        <div style={s.secLabel}>Data de emissão</div>
                        <div style={{ fontSize:13 }}>{aepSel.data_emissao ? new Date(aepSel.data_emissao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                      </div>
                      <div>
                        <div style={s.secLabel}>Período de exposição</div>
                        <div style={{ fontSize:13 }}>
                          {aepSel.periodo_inicio ? new Date(aepSel.periodo_inicio+'T12:00:00').toLocaleDateString('pt-BR') : '—'} até {aepSel.periodo_fim ? new Date(aepSel.periodo_fim+'T12:00:00').toLocaleDateString('pt-BR') : 'atual'}
                        </div>
                      </div>
                    </div>
                    <div style={s.row2}>
                      <div>
                        <div style={s.secLabel}>Função / Setor</div>
                        <div style={{ fontSize:13 }}>{aepSel.funcao || '—'} {aepSel.setor ? `— ${aepSel.setor}` : ''}</div>
                      </div>
                      <div>
                        <div style={s.secLabel}>Responsável técnico</div>
                        <div style={{ fontSize:13 }}>{aepSel.resp_nome || '—'}{aepSel.resp_cargo ? ` (${aepSel.resp_cargo})` : ''}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:11, marginTop:4, color: aepSel.epc_epi_eficaz ? '#27500A' : '#791F1F' }}>
                      EPC/EPI {aepSel.epc_epi_eficaz ? 'eficaz' : 'não eficaz / não fornecido'}
                    </div>
                  </div>

                  <div style={s.card}>
                    <div style={s.cardTit}>Agentes nocivos ({aepSel.agentes?.length || 0})</div>
                    {aepSel.agentes?.length ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                        {aepSel.agentes.map((a,i) => (
                          <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10, fontSize:12 }}>
                            <strong>{a.tipo}</strong> — {a.nome || '—'} {a.valor ? `· ${a.valor}` : ''} {a.limite ? `(limite: ${a.limite})` : ''}
                          </div>
                        ))}
                      </div>
                    ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhum agente registrado.</div>}
                  </div>

                  {aepSel.conclusao && (
                    <div style={s.card}>
                      <div style={s.cardTit}>Conclusão</div>
                      <div style={{ fontSize:13, marginTop:8, whiteSpace:'pre-wrap' }}>{aepSel.conclusao}</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ ...s.card, textAlign:'center', padding:'2rem' }}>
                  <div style={{ fontSize:13, color:'#374151' }}>Nenhum AEP cadastrado para este funcionário</div>
                </div>
              )}
            </div>
          )}

          {funcSel && modoEdicao && form && (
            <div style={{ ...s.card, border:'1.5px solid #185FA5' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>AEP — {funcSel.nome}</div>
                <button onClick={cancelarEdicao} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
              </div>

              <div style={s.row2}>
                <div>
                  <label style={s.label}>Data de emissão *</label>
                  <input type="date" style={s.input} value={form.data_emissao || ''} onChange={e => setForm({ ...form, data_emissao: e.target.value })} />
                </div>
              </div>
              <div style={s.row2}>
                <div>
                  <label style={s.label}>Início do período</label>
                  <input type="date" style={s.input} value={form.periodo_inicio || ''} onChange={e => setForm({ ...form, periodo_inicio: e.target.value })} />
                </div>
                <div>
                  <label style={s.label}>Fim do período (vazio = atual)</label>
                  <input type="date" style={s.input} value={form.periodo_fim || ''} onChange={e => setForm({ ...form, periodo_fim: e.target.value })} />
                </div>
              </div>
              <div style={s.row2}>
                <input style={s.input} placeholder="Função" value={form.funcao || ''} onChange={e => setForm({ ...form, funcao: e.target.value })} />
                <input style={s.input} placeholder="Setor" value={form.setor || ''} onChange={e => setForm({ ...form, setor: e.target.value })} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer', marginBottom:14 }}>
                <input type="checkbox" checked={!!form.epc_epi_eficaz} onChange={e => setForm({ ...form, epc_epi_eficaz: e.target.checked })} />
                EPC/EPI eficaz no período
              </label>

              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <label style={s.label}>Agentes nocivos ({form.agentes?.length || 0})</label>
                  <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addAgente}>+ Agente</button>
                </div>
                {(form.agentes || []).length === 0 && (
                  <div style={{ fontSize:11, color:'#9ca3af', marginBottom:4 }}>
                    Nenhum agente vinculado — carregado automaticamente do LTCAT vigente quando o setor bate, ou adicione manualmente.
                  </div>
                )}
                {(form.agentes || []).map((a, j) => (
                  <div key={j} style={{ display:'grid', gridTemplateColumns:'110px 1fr 90px 90px 22px', gap:6, marginBottom:6, alignItems:'center' }}>
                    <select style={{ ...s.input, padding:'6px 8px', fontSize:11 }} value={a.tipo || AGENTE_TIPOS[0]} onChange={e => setAgenteField(j, 'tipo', e.target.value)}>
                      {AGENTE_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input style={{ ...s.input, padding:'6px 8px', fontSize:11 }} placeholder="Nome do agente" value={a.nome || ''} onChange={e => setAgenteField(j, 'nome', e.target.value)} />
                    <input style={{ ...s.input, padding:'6px 8px', fontSize:11 }} placeholder="Valor" value={a.valor || ''} onChange={e => setAgenteField(j, 'valor', e.target.value)} />
                    <input style={{ ...s.input, padding:'6px 8px', fontSize:11 }} placeholder="Limite" value={a.limite || ''} onChange={e => setAgenteField(j, 'limite', e.target.value)} />
                    <button onClick={() => removerAgente(j)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:15 }}>×</button>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={s.label}>Conclusão</label>
                <textarea style={{ ...s.input, minHeight:80 }} placeholder="Texto de conclusão do atestado (opcional — complementa a fundamentação técnica)" value={form.conclusao || ''} onChange={e => setForm({ ...form, conclusao: e.target.value })} />
              </div>

              <div style={s.row2}>
                <div>
                  <label style={s.label}>Responsável técnico *</label>
                  <input style={s.input} value={form.resp_nome || ''} onChange={e => setForm({ ...form, resp_nome: e.target.value })} />
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

              {/* ── Textos legais do documento ── */}
              <div style={{ marginBottom:16 }}>
                <label style={s.label}>Textos legais do documento (Lei 8.213/91 / Decreto 3.048/99)</label>
                <div style={{ fontSize:11, color:'#9ca3af', marginBottom:8 }}>Textos padrão que vão no PDF — edite só se precisar ajustar alguma redação para o caso da empresa.</div>
                {TEXTOS_LEGAIS_AEP.map(secaoTexto => {
                  const aberto = textoAberto === secaoTexto.titulo
                  const custom = form.textos_legais_custom?.[secaoTexto.titulo]
                  return (
                    <div key={secaoTexto.titulo} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>
                          {secaoTexto.titulo}
                          {custom && <span style={{ marginLeft:8, fontSize:10, fontWeight:600, color:'#0C447C', background:'#E6F1FB', padding:'1px 7px', borderRadius:99 }}>editado</span>}
                        </div>
                        <button style={s.btnAcao} onClick={() => setTextoAberto(aberto ? null : secaoTexto.titulo)}>
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
                            {custom && <button style={s.btnAcao} onClick={() => restaurarTextoPadrao(secaoTexto.titulo)}>Restaurar padrão</button>}
                            <button style={s.btnAcao} onClick={() => setTextoAberto(null)}>Concluído</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {erro && <div style={s.erroBox}>{erro}</div>}

              <div style={{ display:'flex', gap:8 }}>
                <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar AEP'}</button>
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
