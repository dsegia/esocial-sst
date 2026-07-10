import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { gerarPdfAet } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'
import { formatarCPF } from '../lib/format'
import { TEXTOS_LEGAIS_AET } from '../lib/aet-conteudo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const postoVazio = () => ({
  nome: '', setor: '', descricao_atividade: '',
  mobiliario_adequado: true, levantamento_peso: false, posturas_inadequadas: false, repetitividade: false,
  descricao_organizacao_trabalho: '', controle_rigido_produtividade: false, trabalho_noturno_turnos: false, pausas_previstas: '',
  recomendacoes: [],
})

export default function AET() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [aets, setAets] = useState([])
  const [aetSel, setAetSel] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('documento')
  const [form, setForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const [novaRecomendacao, setNovaRecomendacao] = useState('')
  const [textoAberto, setTextoAberto] = useState(null)
  const [modalTextos, setModalTextos] = useState(false)

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

    const { data } = await supabase.from('aet').select('*').eq('empresa_id', empId).order('criado_em', { ascending: false })
    setAets(data || [])
    setAetSel(data?.[0] || null)
    setCarregando(false)
  }

  function abrirNovo() {
    setForm({
      data_elaboracao: new Date().toISOString().split('T')[0],
      prox_revisao: '', resp_nome: '', resp_conselho: 'CREA', resp_registro: '', resp_cpf: '',
      postos_trabalho: [],
      textos_legais_custom: {},
    })
    setAba('editar')
    setSucesso(''); setErro('')
  }

  // ── Textos legais editáveis ───────────────────────────
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

  function abrirEdicao(aet) {
    setForm(JSON.parse(JSON.stringify(aet)))
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
      resp_cpf: form.resp_cpf || null,
      postos_trabalho: form.postos_trabalho || [],
      textos_legais_custom: form.textos_legais_custom || {},
      atualizado_em: new Date().toISOString(),
    }

    let error
    if (form.id) {
      ;({ error } = await supabase.from('aet').update(dados).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('aet').insert(dados))
    }

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso('AET salva com sucesso!')
      setForm(null)
      setAba('documento')
      await init()
    }
    setSalvando(false)
  }

  async function arquivar(id) {
    if (!confirm('Arquivar esta AET?')) return
    await supabase.from('aet').update({ ativo: false }).eq('id', id)
    init()
  }

  async function excluir(id) {
    if (!confirm('EXCLUIR esta AET permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('aet').delete().eq('id', id)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setAetSel(null)
    init()
  }

  function addPosto() {
    setForm(p => ({ ...p, postos_trabalho: [...(p.postos_trabalho || []), postoVazio()] }))
  }

  function setPosto(i, field, value) {
    setForm(p => {
      const postos = [...p.postos_trabalho]
      postos[i] = { ...postos[i], [field]: value }
      return { ...p, postos_trabalho: postos }
    })
  }

  function removerPosto(i) {
    setForm(p => ({ ...p, postos_trabalho: p.postos_trabalho.filter((_, idx) => idx !== i) }))
  }

  function addRecomendacao(i) {
    if (!novaRecomendacao.trim()) return
    setForm(p => {
      const postos = [...p.postos_trabalho]
      postos[i] = { ...postos[i], recomendacoes: [...(postos[i].recomendacoes || []), novaRecomendacao.trim()] }
      return { ...p, postos_trabalho: postos }
    })
    setNovaRecomendacao('')
  }

  function removerRecomendacao(i, ri) {
    setForm(p => {
      const postos = [...p.postos_trabalho]
      postos[i] = { ...postos[i], recomendacoes: postos[i].recomendacoes.filter((_, idx) => idx !== ri) }
      return { ...p, postos_trabalho: postos }
    })
  }

  function exportarPdf(aet) {
    gerarPdfAet(
      {
        dados_gerais: {
          data_elaboracao: aet.data_elaboracao, prox_revisao: aet.prox_revisao,
          resp_nome: aet.resp_nome, resp_conselho: aet.resp_conselho, resp_registro: aet.resp_registro, resp_cpf: aet.resp_cpf,
        },
        postos_trabalho: aet.postos_trabalho || [],
        textos_legais_custom: aet.textos_legais_custom || {},
      },
      { razao_social: nomeEmpresa, cnpj: cnpjEmpresa }
    )
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="aet">
      <Head><title>AET — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>AET</div>
          <div style={s.sub}>Análise Ergonômica do Trabalho · NR-17</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {aetSel && <button style={s.btnOutline} onClick={() => setModalTextos(true)}>📃 Ver textos do documento</button>}
          {aetSel && <button style={s.btnOutline} onClick={() => exportarPdf(aetSel)}>📄 Exportar PDF</button>}
          <button style={s.btnPrimary} onClick={abrirNovo}>+ Nova AET</button>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && aba !== 'editar' && <div style={s.erroBox}>{erro}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:'1.25rem' }}>
        {[
          { n: aetSel ? 'Vigente' : 'Ausente', l:'AET', c: aetSel ? '#1D9E75' : '#E24B4A' },
          { n: aetSel?.postos_trabalho?.length || 0, l:'Postos avaliados', c:'#185FA5' },
          { n: (aetSel?.postos_trabalho || []).filter(p => p.posturas_inadequadas || p.levantamento_peso || p.repetitividade).length, l:'Postos com risco identificado', c:'#E24B4A' },
        ].map((k,i) => (
          <div key={i} style={s.kpiCard}>
            <div style={{ fontSize:22, fontWeight:700, color:k.c }}>{k.n}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {aba === 'documento' && (
        <div>
          {!aetSel ? (
            <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:14, color:'#374151', marginBottom:8 }}>Nenhuma AET cadastrada</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>Avalie os postos de trabalho quanto a fatores ergonômicos</div>
              <button style={s.btnPrimary} onClick={abrirNovo}>+ Criar primeira AET</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={s.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={s.cardTit}>Dados gerais</div>
                  <div style={{ display:'flex', gap:5 }}>
                    <button style={s.btnAcao} onClick={() => abrirEdicao(aetSel)}>Editar</button>
                    <button style={s.btnAcao} onClick={() => arquivar(aetSel.id)}>Arquivar</button>
                    <button style={{ ...s.btnAcao, color:'#E24B4A', borderColor:'#F09595' }} onClick={() => excluir(aetSel.id)}>Excluir</button>
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <div style={s.secLabel}>Elaboração</div>
                    <div style={{ fontSize:13 }}>{aetSel.data_elaboracao ? new Date(aetSel.data_elaboracao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                  <div>
                    <div style={s.secLabel}>Próxima revisão</div>
                    <div style={{ fontSize:13 }}>{aetSel.prox_revisao ? new Date(aetSel.prox_revisao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <div style={s.secLabel}>Responsável técnico</div>
                    <div style={{ fontSize:13 }}>{aetSel.resp_nome || '—'} {aetSel.resp_cpf ? `· ${aetSel.resp_cpf}` : ''}</div>
                  </div>
                  <div>
                    <div style={s.secLabel}>{aetSel.resp_conselho || 'CREA'}</div>
                    <div style={{ fontSize:13 }}>{aetSel.resp_registro || '—'}</div>
                  </div>
                </div>
              </div>

              <div style={s.card}>
                <div style={s.cardTit}>Postos de trabalho ({aetSel.postos_trabalho?.length || 0})</div>
                {aetSel.postos_trabalho?.length ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:10 }}>
                    {aetSel.postos_trabalho.map((p,i) => (
                      <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{p.nome}</div>
                          <div style={{ fontSize:11, color:'#9ca3af' }}>{p.setor}</div>
                        </div>
                        {p.descricao_atividade && <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>{p.descricao_atividade}</div>}
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
                          {!p.mobiliario_adequado && <span style={s.tagRisco}>Mobiliário inadequado</span>}
                          {p.levantamento_peso && <span style={s.tagRisco}>Levantamento de peso</span>}
                          {p.posturas_inadequadas && <span style={s.tagRisco}>Posturas inadequadas</span>}
                          {p.repetitividade && <span style={s.tagRisco}>Repetitividade</span>}
                          {p.controle_rigido_produtividade && <span style={s.tagRisco}>Controle rígido de produtividade</span>}
                          {p.trabalho_noturno_turnos && <span style={s.tagRisco}>Trabalho noturno/turnos</span>}
                        </div>
                        {p.descricao_organizacao_trabalho && (
                          <div style={{ fontSize:11, color:'#6b7280', marginTop:6 }}><strong>Organização do trabalho:</strong> {p.descricao_organizacao_trabalho}</div>
                        )}
                        {p.pausas_previstas && (
                          <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}><strong>Pausas previstas:</strong> {p.pausas_previstas}</div>
                        )}
                        {p.recomendacoes?.length > 0 && (
                          <div style={{ marginTop:6, fontSize:11, color:'#374151' }}>
                            <strong>Recomendações:</strong> {p.recomendacoes.join(' · ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhum posto avaliado.</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {aba === 'editar' && form && (
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={s.cardTit}>{form.id ? 'Editar AET' : 'Nova AET'}</div>
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

          <div style={s.row2}>
            <div>
              <label style={s.label}>CPF do responsável</label>
              <input style={s.input} value={form.resp_cpf || ''} onChange={e => setForm({ ...form, resp_cpf: formatarCPF(e.target.value) })} placeholder="000.000.000-00" />
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>Postos de trabalho ({form.postos_trabalho?.length || 0})</label>
              <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addPosto}>+ Adicionar posto</button>
            </div>
            {(form.postos_trabalho || []).map((p, i) => (
              <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:12, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <button onClick={() => removerPosto(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:16 }}>×</button>
                </div>
                <div style={s.row2}>
                  <input style={s.input} placeholder="Posto/função" value={p.nome} onChange={e => setPosto(i, 'nome', e.target.value)} />
                  <input style={s.input} placeholder="Setor" value={p.setor} onChange={e => setPosto(i, 'setor', e.target.value)} />
                </div>
                <textarea style={{ ...s.input, minHeight:50, marginBottom:10 }} placeholder="Descrição da atividade"
                  value={p.descricao_atividade} onChange={e => setPosto(i, 'descricao_atividade', e.target.value)} />
                <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:10 }}>
                  {[
                    { k:'mobiliario_adequado', l:'Mobiliário adequado' },
                    { k:'levantamento_peso', l:'Levantamento de peso' },
                    { k:'posturas_inadequadas', l:'Posturas inadequadas' },
                    { k:'repetitividade', l:'Repetitividade' },
                    { k:'controle_rigido_produtividade', l:'Controle rígido de produtividade' },
                    { k:'trabalho_noturno_turnos', l:'Trabalho noturno/turnos' },
                  ].map(chk => (
                    <label key={chk.k} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer' }}>
                      <input type="checkbox" checked={!!p[chk.k]} onChange={e => setPosto(i, chk.k, e.target.checked)} />
                      {chk.l}
                    </label>
                  ))}
                </div>
                <textarea style={{ ...s.input, minHeight:50, marginBottom:10 }} placeholder="Organização do trabalho (jornada, ritmo, metas de produção, modo operatório — NR-17 item 17.6)"
                  value={p.descricao_organizacao_trabalho || ''} onChange={e => setPosto(i, 'descricao_organizacao_trabalho', e.target.value)} />
                <input style={{ ...s.input, marginBottom:10 }} placeholder="Pausas previstas (ex: 10 min a cada 50 min de atividade)"
                  value={p.pausas_previstas || ''} onChange={e => setPosto(i, 'pausas_previstas', e.target.value)} />
                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginBottom:4 }}>RECOMENDAÇÕES</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                  {(p.recomendacoes || []).map((r,ri) => (
                    <span key={ri} style={{ padding:'3px 10px', borderRadius:99, fontSize:11, background:'#E6F1FB', color:'#0C447C' }}>
                      {r}
                      <button onClick={() => removerRecomendacao(i, ri)} style={{ marginLeft:6, background:'none', border:'none', cursor:'pointer', color:'#0C447C' }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <input style={s.inputSm} placeholder="Nova recomendação..." value={novaRecomendacao}
                    onChange={e => setNovaRecomendacao(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRecomendacao(i))} />
                  <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => addRecomendacao(i)}>+ Adicionar</button>
                </div>
              </div>
            ))}
            {!(form.postos_trabalho || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum posto adicionado.</div>}
          </div>

          {/* ── Textos legais do documento ── */}
          <div style={{ marginBottom:16 }}>
            <label style={s.label}>Textos legais do documento (NR-17)</label>
            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:8 }}>Textos padrão que vão no PDF — edite só se precisar ajustar alguma redação para o caso da empresa.</div>
            {TEXTOS_LEGAIS_AET.map(secaoTexto => {
              const aberto = textoAberto === secaoTexto.titulo
              const custom = form.textos_legais_custom?.[secaoTexto.titulo]
              return (
                <div key={secaoTexto.titulo} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>
                      {secaoTexto.titulo}
                      {custom && <span style={{ marginLeft:8, fontSize:10, fontWeight:600, color:'#0C447C', background:'#E6F1FB', padding:'1px 7px', borderRadius:99 }}>editado</span>}
                    </div>
                    <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => setTextoAberto(aberto ? null : secaoTexto.titulo)}>
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
                        {custom && <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => restaurarTextoPadrao(secaoTexto.titulo)}>Restaurar padrão</button>}
                        <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => setTextoAberto(null)}>Concluído</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {erro && <div style={s.erroBox}>{erro}</div>}

          <div style={{ display:'flex', gap:8 }}>
            <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar AET'}</button>
            <button style={s.btnOutline} onClick={cancelarEdicao}>Cancelar</button>
          </div>
        </div>
      )}

      {modalTextos && aetSel && (
        <div style={s.overlay} onClick={() => setModalTextos(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>Textos do documento (NR-17)</div>
              <button onClick={() => setModalTextos(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
            </div>
            {TEXTOS_LEGAIS_AET.map(secaoTexto => (
              <div key={secaoTexto.titulo} style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#185FA5', marginBottom:6 }}>{secaoTexto.titulo}</div>
                {(aetSel.textos_legais_custom?.[secaoTexto.titulo] || secaoTexto.paragrafos).map((p, i) => (
                  <div key={i} style={{ fontSize:12, color:'#374151', lineHeight:1.6, marginBottom:8 }}>{p}</div>
                ))}
              </div>
            ))}
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
  inputSm:    { flex:1, padding:'6px 10px', fontSize:12, border:'1px solid #d1d5db', borderRadius:6, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  btnAcao:    { padding:'3px 10px', fontSize:11, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151' },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  tagRisco:   { padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, background:'#FAEEDA', color:'#633806' },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' },
  modal:      { background:'#fff', borderRadius:12, padding:'1.5rem', width:620, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
}
