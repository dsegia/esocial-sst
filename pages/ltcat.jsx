import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { pdfFichaEPI } from '../lib/gerarPDF'
import { gerarPdfLtcat } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'
import { formatarCPF } from '../lib/format'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TIPO_AGENTE = { fis:'Físico', qui:'Químico', bio:'Biológico', erg:'Ergonômico' }

// noop — funções são mostradas inline via props
const COR_AGENTE  = { fis:'#E6F1FB', qui:'#FAEEDA', bio:'#EAF3DE', erg:'#FCEBEB' }
const TXT_AGENTE  = { fis:'#0C447C', qui:'#633806', bio:'#27500A', erg:'#791F1F' }

const ltcatVazio = () => ({
  data_emissao: new Date().toISOString().split('T')[0], data_vigencia: '', prox_revisao: '',
  resp_nome: '', resp_conselho: 'CREA', resp_registro: '', resp_cpf: '', ghes: [],
})

export default function LTCAT() {
  const router = useRouter()
  const [_empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [ltcats, setLtcats] = useState([])
  const [todosFunc, setTodosFunc] = useState([])
  const [ltcatSel, setLtcatSel] = useState(null)
  const [gheAtivo, setGheAtivo] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [formLtcat, setFormLtcat] = useState(null)
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
    const { data } = await supabase.from('ltcats').select('*').eq('empresa_id', empId).order('data_emissao', { ascending: false })
    setLtcats(data || [])
    if (data?.length > 0) setLtcatSel(data[0])
    const { data: funcs } = await supabase.from('funcionarios').select('id,nome,funcao,setor,ghe_id').eq('empresa_id', empId).eq('ativo', true)
    setTodosFunc(funcs || [])
    setCarregando(false)
  }

  function abrirEdicao(lt) {
    setFormLtcat(JSON.parse(JSON.stringify(lt)))
    setModoEdicao(true)
    setGheAtivo(0)
    setSucesso(''); setErro('')
  }

  function criarNovoLtcat() {
    setFormLtcat(ltcatVazio())
    setModoEdicao(true)
    setGheAtivo(0)
    setSucesso(''); setErro('')
  }

  function cancelarEdicao() {
    setModoEdicao(false)
    setFormLtcat(null)
  }

  async function salvarEdicao() {
    setSalvando(true); setErro(''); setSucesso('')
    const dados = {
      data_emissao: formLtcat.data_emissao,
      data_vigencia: formLtcat.data_vigencia,
      prox_revisao: formLtcat.prox_revisao || null,
      resp_nome: formLtcat.resp_nome || null,
      resp_conselho: formLtcat.resp_conselho || 'CREA',
      resp_registro: formLtcat.resp_registro || null,
      resp_cpf: formLtcat.resp_cpf || null,
      ghes: formLtcat.ghes || [],
    }

    const { error } = formLtcat.id
      ? await supabase.from('ltcats').update(dados).eq('id', formLtcat.id)
      : await supabase.from('ltcats').insert({ ...dados, empresa_id: _empresaId })

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso(formLtcat.id ? 'LTCAT atualizado com sucesso!' : 'LTCAT criado com sucesso!')
      setModoEdicao(false)
      setFormLtcat(null)
      await init()
    }
    setSalvando(false)
  }

  async function desativar(id) {
    if (!confirm('Arquivar este LTCAT?')) return
    await supabase.from('ltcats').update({ ativo: false }).eq('id', id)
    init()
  }

  async function excluirLtcat(id) {
    if (!confirm('EXCLUIR este LTCAT permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('ltcats').delete().eq('id', id)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setSucesso('LTCAT excluído.')
    setLtcatSel(null)
    init()
  }

  // GHEs deixaram de ser editados aqui — fonte única é o cadastro central (/ghes).
  // Estas funções só trazem um snapshot fresco de lá para dentro da LTCAT.
  async function buscarGhesDoCadastro() {
    const { data, error } = await supabase.from('ghes').select('*').eq('empresa_id', _empresaId).eq('ativo', true).order('criado_em')
    if (error) { setErro('Erro ao buscar cadastro de GHEs: ' + error.message); return null }
    return (data || []).map(g => ({
      id: g.id, nome: g.nome, setor: g.setor, qtd_trabalhadores: g.qtd_trabalhadores,
      aposentadoria_especial: g.aposentadoria_especial, funcoes: g.funcoes || [],
      agentes: (g.riscos || []).map(r => ({
        tipo: r.tipo, nome: r.nome, valor: r.valor, limite: r.limite, unidade: r.unidade,
        supera_lt: r.supera_lt, codigo_t24: r.codigo_esocial,
      })),
      epc: g.epc || [], epi: g.epi || [],
    }))
  }

  // Modo edição: só atualiza o formulário local — persiste junto com "Salvar alterações"
  async function atualizarGhesNoForm() {
    const snapshot = await buscarGhesDoCadastro()
    if (!snapshot) return
    setFormLtcat(p => ({ ...p, ghes: snapshot }))
    setGheAtivo(0)
    setSucesso(`${snapshot.length} GHE(s) trazido(s) do cadastro. Clique em "Salvar alterações" para confirmar.`)
  }

  // Modo visualização: LTCAT já existe salva — grava direto no banco
  async function atualizarGhesDoLtcat(ltcatId) {
    const snapshot = await buscarGhesDoCadastro()
    if (!snapshot) return
    const { error } = await supabase.from('ltcats').update({ ghes: snapshot }).eq('id', ltcatId)
    if (error) { setErro('Erro ao atualizar GHEs: ' + error.message); return }
    setSucesso('GHEs atualizados a partir do cadastro central.')
    setGheAtivo(0)
    init()
  }

  function fmtData(d) {
    if (!d) return '—'
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
  }

  function diasParaVencer(d) {
    if (!d) return null
    return Math.round((new Date(d) - new Date()) / 86400000)
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  const ghe = modoEdicao ? formLtcat?.ghes?.[gheAtivo] : ltcatSel?.ghes?.[gheAtivo]

  return (
    <Layout pagina="ltcat">
      <Head><title>LTCAT — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>LTCAT</div>
          <div style={s.sub}>Laudo Técnico das Condições Ambientais do Trabalho · S-2240</div>
        </div>
        {!modoEdicao && (
          <div style={{ display:'flex', gap:8 }}>
            <button style={s.btnPrimary} onClick={criarNovoLtcat}>+ Novo manual</button>
          </div>
        )}
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro    && <div style={s.erroBox}>{erro}</div>}

      {ltcats.length === 0 && !modoEdicao ? (
        <div style={s.emptyCard}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="14,3 14,8 19,8"/>
          </svg>
          <div style={{ fontSize:14, fontWeight:500, color:'#374151', marginTop:12 }}>Nenhum LTCAT cadastrado</div>
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Use a página Importar PDF para adicionar um LTCAT</div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button style={s.btnOutline} onClick={() => router.push('/importar')}>↑ Importar PDF</button>
            <button style={s.btnPrimary} onClick={criarNovoLtcat}>+ Novo manual</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:14 }}>

          {/* Lista lateral */}
          <div>
            <div style={s.secLabel}>Laudos cadastrados</div>
            {ltcats.map(lt => {
              const dias = diasParaVencer(lt.prox_revisao)
              const vencido = dias !== null && dias < 0
              const critico = dias !== null && dias >= 0 && dias <= 60
              const ativo = lt.id === (modoEdicao ? formLtcat?.id : ltcatSel?.id)
              return (
                <div key={lt.id} onClick={() => { if(!modoEdicao){ setLtcatSel(lt); setGheAtivo(0) } }}
                  style={{ ...s.ltcatItem, border: ativo?'1.5px solid #185FA5':'0.5px solid #e5e7eb', background: ativo?'#E6F1FB':'#fff', cursor: modoEdicao?'default':'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div style={{ fontSize:12, fontWeight:600, color: ativo?'#0C447C':'#111' }}>
                      {fmtData(lt.data_emissao)}
                    </div>
                    {lt.ativo ? <span style={s.badgeVig}>Vigente</span> : <span style={s.badgeArq}>Arquivado</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:3 }}>
                    {lt.ghes?.length||0} GHE(s) · {lt.resp_conselho} {lt.resp_registro}
                  </div>
                  {lt.prox_revisao && (
                    <div style={{ fontSize:11, marginTop:3, fontWeight:500, color: vencido?'#E24B4A':critico?'#EF9F27':'#1D9E75' }}>
                      {vencido ? `Revisão vencida há ${Math.abs(dias)}d` : `Revisão em ${dias}d`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Detalhe / Edição */}
          <div>
            {/* MODO VISUALIZAÇÃO */}
            {!modoEdicao && ltcatSel && (
              <>
                <div style={s.card}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#111', marginBottom:8 }}>
                        LTCAT — {fmtData(ltcatSel.data_emissao)}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                        {[
                          { l:'Responsável', v: ltcatSel.resp_nome||'—' },
                          { l:'CPF', v: ltcatSel.resp_cpf||'—' },
                          { l:'Conselho/Registro', v: `${ltcatSel.resp_conselho||''} ${ltcatSel.resp_registro||''}`.trim()||'—' },
                          { l:'Vigência', v: fmtData(ltcatSel.data_vigencia) },
                          { l:'Próxima revisão', v: fmtData(ltcatSel.prox_revisao) },
                          { l:'GHEs', v: `${ltcatSel.ghes?.length||0} grupos` },
                          { l:'Agentes', v: `${(ltcatSel.ghes||[]).reduce((a,g)=>a+(g.agentes?.length||0),0)} identificados` },
                        ].map((it,i) => (
                          <div key={i}>
                            <div style={{ fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase' }}>{it.l}</div>
                            <div style={{ fontSize:13, fontWeight:500, color:'#111', marginTop:2 }}>{it.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button style={{ ...s.btnPrimary, padding:'6px 14px', fontSize:12 }} onClick={() => abrirEdicao(ltcatSel)}>
                        ✏ Editar LTCAT
                      </button>
                      <button style={{ ...s.btnOutline, color:'#0C447C', borderColor:'#B5D4F4', padding:'6px 14px', fontSize:12 }}
                        onClick={() => atualizarGhesDoLtcat(ltcatSel.id)} title="Traz o cadastro de GHEs/riscos mais atual de /ghes para esta LTCAT">
                        ↻ Atualizar do cadastro
                      </button>
                      <button style={{ ...s.btnOutline, color:'#27500A', borderColor:'#C0DD97', padding:'6px 14px', fontSize:12 }}
                        onClick={() => gerarPdfLtcat({ dados_gerais: { data_emissao: ltcatSel.data_emissao, data_vigencia: ltcatSel.data_vigencia, prox_revisao: ltcatSel.prox_revisao, resp_nome: ltcatSel.resp_nome, resp_conselho: ltcatSel.resp_conselho, resp_registro: ltcatSel.resp_registro, resp_cpf: ltcatSel.resp_cpf }, ghes: ltcatSel.ghes }, { razao_social: nomeEmpresa, cnpj: cnpjEmpresa })}>
                        ↓ Exportar PDF
                      </button>
                      {ltcatSel.ativo && (
                        <button style={{ ...s.btnOutline, color:'#E24B4A', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }}
                          onClick={() => desativar(ltcatSel.id)}>Arquivar</button>
                      )}
                      <button style={{ ...s.btnOutline, color:'#791F1F', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }}
                        onClick={() => excluirLtcat(ltcatSel.id)}>🗑 Excluir</button>
                    </div>
                  </div>
                </div>

                {/* GHEs visualização */}
                {ltcatSel.ghes?.length > 0 && (
                  <div style={s.card}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <div style={s.cardTit}>Grupos Homogêneos de Exposição (GHEs)</div>
                      <div style={{ fontSize:12, color:'#6b7280' }}>{ltcatSel.ghes.length} grupo(s)</div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {ltcatSel.ghes.map((g,i) => (
                          <button key={i} onClick={() => setGheAtivo(i)} style={{
                            padding:'5px 12px', fontSize:11, fontWeight:500, borderRadius:99, cursor:'pointer',
                            border: i===gheAtivo?'1.5px solid #185FA5':'1px solid #d1d5db',
                            background: i===gheAtivo?'#185FA5':'#fff', color: i===gheAtivo?'#fff':'#374151',
                          }}>{g.nome||`GHE ${i+1}`}</button>
                        ))}
                      </div>
                      {ghe && (ghe.epi||[]).length > 0 && (
                        <button onClick={() => {
                          const _funcsDoGhe = todosFunc.filter(f =>
                            (f.setor||'').toLowerCase().includes((ghe.setor||'').toLowerCase()) ||
                            (ghe.funcoes||[]).some(fn => (f.funcao||'').toLowerCase().includes(fn.toLowerCase()))
                          )
                          const funcPlaceholder = { nome: `Trabalhadores do ${ghe.nome||'GHE'}`, cpf:'', matricula_esocial:'', funcao: ghe.setor||'', setor: ghe.setor||'', data_adm:'' }
                          pdfFichaEPI(nomeEmpresa, cnpjEmpresa, funcPlaceholder, [ghe])
                        }} style={{ padding:'5px 12px', fontSize:11, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:8, cursor:'pointer', color:'#374151', flexShrink:0 }}>
                          📄 Ficha EPI deste GHE
                        </button>
                      )}
                    </div>
                    {ghe && (
                      <div style={{ border:'0.5px solid #e5e7eb', borderRadius:10, padding:14 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                          {[
                            { l:'Setor', v: ghe.setor||'—' },
                            { l:'Trabalhadores', v: ghe.qtd_trabalhadores||'—' },
                            { l:'Aposent. especial', v: ghe.aposentadoria_especial?'Sim':'Não' },
                            { l:'Agentes', v: ghe.agentes?.length||0 },
                          ].map((it,i) => (
                            <div key={i} style={{ background:'#f9fafb', borderRadius:8, padding:'8px 10px' }}>
                              <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase' }}>{it.l}</div>
                              <div style={{ fontSize:14, fontWeight:600, color:'#111', marginTop:2 }}>{it.v}</div>
                            </div>
                          ))}
                        </div>
                        {ghe.agentes?.length > 0 && (
                          <div style={{ marginBottom:12 }}>
                            <div style={s.secLabel}>Agentes de risco</div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                              {ghe.agentes.map((ag,i) => (
                                <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10, borderLeft:`3px solid ${TXT_AGENTE[ag.tipo]||'#6b7280'}` }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                                    <span style={{ padding:'1px 7px', borderRadius:99, fontSize:10, fontWeight:600, background:COR_AGENTE[ag.tipo]||'#f3f4f6', color:TXT_AGENTE[ag.tipo]||'#374151' }}>
                                      {TIPO_AGENTE[ag.tipo]||ag.tipo}
                                    </span>
                                    {ag.supera_lt && <span style={{ fontSize:10, fontWeight:700, color:'#E24B4A' }}>⚠ Supera LT</span>}
                                  </div>
                                  <div style={{ fontSize:13, fontWeight:500, color:'#111' }}>{ag.nome}</div>
                                  {(ag.valor||ag.limite) && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{ag.valor&&`Medido: ${ag.valor}`}{ag.valor&&ag.limite?' · ':''}{ag.limite&&`LT: ${ag.limite}`}</div>}
                                  {ag.codigo_t24 && <div style={{ fontSize:10, color:'#9ca3af', marginTop:2, fontFamily:'monospace' }}>T24:{ag.codigo_t24}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Funções/cargos deste GHE */}
                        {/* Funções cadastradas no GHE */}
                        {(() => {
                          const fnsCadastradas = ghe.funcoes || []
                          const fncsVinculadas = todosFunc.filter(f => {
                            if (f.ghe_id === ltcatSel.ghes.indexOf(ghe)) return true
                            const sg = (ghe.setor||'').toLowerCase()
                            const sf = (f.setor||'').toLowerCase()
                            return sg && sf && (sg.includes(sf) || sf.includes(sg))
                          })
                          const todasFuncoes = [...new Set([
                            ...fnsCadastradas,
                            ...fncsVinculadas.map(f=>f.funcao).filter(Boolean)
                          ])]
                          if (!todasFuncoes.length && !fncsVinculadas.length) return (
                            <div style={{ marginBottom:12, padding:'8px 12px', background:'#FAEEDA', borderRadius:8, fontSize:12, color:'#633806' }}>
                              ⚠ Nenhuma função associada a este GHE. Clique em &quot;Editar LTCAT&quot; para adicionar.
                            </div>
                          )
                          return (
                            <div style={{ marginBottom:12 }}>
                              <div style={s.secLabel}>
                                Funções/cargos neste GHE
                                ({fncsVinculadas.length} funcionário(s) vinculado(s))
                              </div>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                                {todasFuncoes.map((fn,i) => {
                                  const qtd = fncsVinculadas.filter(f=>f.funcao===fn).length
                                  return (
                                    <span key={i} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:99, fontSize:11, background:'#E6F1FB', color:'#0C447C' }}>
                                      {fn}
                                      {qtd > 0 && <span style={{ background:'#185FA5', color:'#fff', borderRadius:99, padding:'0 5px', fontSize:10 }}>{qtd}</span>}
                                    </span>
                                  )
                                })}
                              </div>
                              {fncsVinculadas.length > 0 && (
                                <div style={{ fontSize:11, color:'#6b7280' }}>
                                  Funcionários: {fncsVinculadas.slice(0,3).map(f=>f.nome.split(' ')[0]).join(', ')}
                                  {fncsVinculadas.length > 3 && ` +${fncsVinculadas.length-3} mais`}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                          <div>
                            <div style={s.secLabel}>EPC</div>
                            {!ghe.epc?.length ? <div style={s.emptySmall}>Nenhum EPC</div> : ghe.epc.map((e,i) => (
                              <div key={i} style={s.epiRow}><span style={{ fontSize:14 }}>{e.eficaz?'✓':'✗'}</span><div><div style={{ fontSize:13 }}>{e.nome}</div><div style={{ fontSize:11, color:e.eficaz?'#1D9E75':'#E24B4A' }}>{e.eficaz?'Eficaz':'Ineficaz'}</div></div></div>
                            ))}
                          </div>
                          <div>
                            <div style={s.secLabel}>EPI</div>
                            {!ghe.epi?.length ? <div style={s.emptySmall}>Nenhum EPI</div> : ghe.epi.map((e,i) => (
                              <div key={i} style={s.epiRow}><span style={{ fontSize:14 }}>{e.eficaz?'✓':'✗'}</span><div><div style={{ fontSize:13 }}>{e.nome}</div><div style={{ fontSize:11, color:'#6b7280' }}>CA: {e.ca||'—'}</div></div></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* MODO EDIÇÃO */}
            {modoEdicao && formLtcat && (
              <div style={{ ...s.card, border:'1.5px solid #185FA5' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>✏ Editando LTCAT</div>
                  <button onClick={cancelarEdicao} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
                </div>

                {/* Dados gerais */}
                <div style={{ marginBottom:16 }}>
                  <div style={s.secLabel}>Dados gerais</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                    <div>
                      <label style={s.label}>Data emissão</label>
                      <input style={s.input} type="date" value={formLtcat.data_emissao||''} onChange={e => setFormLtcat(p=>({...p,data_emissao:e.target.value}))}/>
                    </div>
                    <div>
                      <label style={s.label}>Data vigência</label>
                      <input style={s.input} type="date" value={formLtcat.data_vigencia||''} onChange={e => setFormLtcat(p=>({...p,data_vigencia:e.target.value}))}/>
                    </div>
                    <div>
                      <label style={s.label}>Próxima revisão</label>
                      <input style={s.input} type="date" value={formLtcat.prox_revisao||''} onChange={e => setFormLtcat(p=>({...p,prox_revisao:e.target.value}))}/>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10, marginBottom:10 }}>
                    <div>
                      <label style={s.label}>Responsável técnico</label>
                      <input style={s.input} value={formLtcat.resp_nome||''} onChange={e => setFormLtcat(p=>({...p,resp_nome:e.target.value}))} placeholder="Nome do engenheiro ou médico"/>
                    </div>
                    <div>
                      <label style={s.label}>Conselho</label>
                      <select style={s.input} value={formLtcat.resp_conselho||'CREA'} onChange={e => setFormLtcat(p=>({...p,resp_conselho:e.target.value}))}>
                        <option>CREA</option><option>CRM</option><option>CRQ</option><option>CFT</option>
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Nº Registro</label>
                      <input style={s.input} value={formLtcat.resp_registro||''} onChange={e => setFormLtcat(p=>({...p,resp_registro:e.target.value}))} placeholder="Ex: 123456-D/SP"/>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:10 }}>
                    <div>
                      <label style={s.label}>CPF do responsável</label>
                      <input style={s.input} value={formLtcat.resp_cpf||''} onChange={e => setFormLtcat(p=>({...p,resp_cpf:formatarCPF(e.target.value)}))} placeholder="000.000.000-00"/>
                    </div>
                  </div>
                </div>

                {/* GHEs — não são mais editados aqui, só trazidos do cadastro central */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={s.secLabel}>Grupos Homogêneos de Exposição (GHEs)</div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={{ ...s.btnOutline, padding:'4px 10px', fontSize:11 }} onClick={() => router.push('/ghes')}>Gerenciar em /ghes</button>
                      <button style={{ ...s.btnOutline, color:'#0C447C', borderColor:'#B5D4F4', padding:'4px 10px', fontSize:11 }} onClick={atualizarGhesNoForm}>↻ Trazer do cadastro</button>
                    </div>
                  </div>
                  <div style={{ border:'0.5px solid #e5e7eb', borderRadius:10, padding:14, fontSize:12, color:'#6b7280' }}>
                    {(formLtcat.ghes||[]).length === 0 ? (
                      <>Nenhum GHE trazido ainda. Cadastre os GHEs em <strong>/ghes</strong> e clique em &quot;Trazer do cadastro&quot;.</>
                    ) : (
                      <>
                        {formLtcat.ghes.length} GHE(s) neste rascunho: {formLtcat.ghes.map(g=>g.nome||'—').join(', ')}.
                        {' '}Para adicionar, remover ou editar um GHE, use <strong>/ghes</strong> e clique em &quot;Trazer do cadastro&quot; de novo.
                      </>
                    )}
                  </div>
                </div>

                {erro && <div style={s.erroBox}>{erro}</div>}
                <div style={{ display:'flex', gap:8 }}>
                  <button style={s.btnPrimary} onClick={salvarEdicao} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar alterações'}
                  </button>
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
  secLabel:   { fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 },
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' },
  cardTit:    { fontSize:13, fontWeight:600, color:'#111' },
  ltcatItem:  { borderRadius:10, padding:'10px 12px', marginBottom:8, transition:'all .15s' },
  badgeVig:   { padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, background:'#EAF3DE', color:'#27500A' },
  badgeArq:   { padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, background:'#f3f4f6', color:'#6b7280' },
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
