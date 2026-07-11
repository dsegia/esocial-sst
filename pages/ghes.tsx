import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'
import { ESOCIAL_TABELA24 } from '../lib/esocial-tabela24'
import { sugerirParaRisco } from '../lib/pgr-sugestoes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

const TIPO_AGENTE = { fis:'Físico', qui:'Químico', bio:'Biológico', erg:'Ergonômico' }
const COR_AGENTE  : Record<string,string> = { fis:'#E6F1FB', qui:'#FAEEDA', bio:'#EAF3DE', erg:'#FCEBEB' }
const TXT_AGENTE  : Record<string,string> = { fis:'#0C447C', qui:'#633806', bio:'#27500A', erg:'#791F1F' }

const gheVazio = () => ({
  nome: '', setor: '', qtd_trabalhadores: 1, aposentadoria_especial: false,
  riscos: [] as any[], epc: [] as any[], epi: [] as any[], funcoes: [] as string[],
})
const riscoVazio = () => ({
  id: crypto.randomUUID(), tipo:'fis', nome:'', valor:'', limite:'', unidade:'',
  supera_lt:false, medicao_quantitativa:false, metodologia:'', codigo_esocial:'', fonte_geradora:'',
})
const epiVazio = () => ({ nome:'', ca:'', eficaz:true })
const epcVazio = () => ({ nome:'', eficaz:true })

export default function Ghes() {
  const router = useRouter()
  const [_empresaId, setEmpresaId] = useState('')
  const [ghesLista, setGhesLista] = useState<any[]>([])
  const [todosFunc, setTodosFunc] = useState<any[]>([])
  const [gheSel, setGheSel] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [formGhe, setFormGhe] = useState<any>(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, (user as any).empresa_id)
    setEmpresaId(empId)
    const { data } = await supabase.from('ghes').select('*').eq('empresa_id', empId).eq('ativo', true).order('criado_em')
    setGhesLista(data || [])
    if (data && data.length > 0) setGheSel(data[0])
    const { data: funcs } = await supabase.from('funcionarios').select('id,nome,funcao,setor,ghe_uuid').eq('empresa_id', empId).eq('ativo', true)
    setTodosFunc(funcs || [])
    setCarregando(false)
  }

  function abrirEdicao(g: any) {
    setFormGhe(JSON.parse(JSON.stringify(g)))
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function criarNovoGhe() {
    setFormGhe(gheVazio())
    setModoEdicao(true)
    setSucesso(''); setErro('')
  }

  function cancelarEdicao() {
    setModoEdicao(false)
    setFormGhe(null)
  }

  async function salvarEdicao() {
    setSalvando(true); setErro(''); setSucesso('')
    const dados = {
      nome: formGhe.nome || '',
      setor: formGhe.setor || '',
      qtd_trabalhadores: formGhe.qtd_trabalhadores || 1,
      aposentadoria_especial: !!formGhe.aposentadoria_especial,
      funcoes: formGhe.funcoes || [],
      riscos: formGhe.riscos || [],
      epc: formGhe.epc || [],
      epi: formGhe.epi || [],
      atualizado_em: new Date().toISOString(),
    }

    const { error } = formGhe.id
      ? await supabase.from('ghes').update(dados).eq('id', formGhe.id)
      : await supabase.from('ghes').insert({ ...dados, empresa_id: _empresaId })

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso(formGhe.id ? 'GHE atualizado com sucesso!' : 'GHE criado com sucesso!')
      setModoEdicao(false)
      setFormGhe(null)
      await init()
    }
    setSalvando(false)
  }

  async function desativar(id: string) {
    if (!confirm('Arquivar este GHE? Ele deixa de aparecer nas sincronizações dos documentos.')) return
    await supabase.from('ghes').update({ ativo: false }).eq('id', id)
    setGheSel(null)
    init()
  }

  async function excluirGhe(id: string) {
    if (!confirm('EXCLUIR este GHE permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('ghes').delete().eq('id', id)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setSucesso('GHE excluído.')
    setGheSel(null)
    init()
  }

  // Helpers de edição — riscos
  function addRisco() {
    setFormGhe((p: any) => ({ ...p, riscos: [...(p.riscos||[]), riscoVazio()] }))
  }

  function setRisco(ri: number, field: string, value: any) {
    setFormGhe((p: any) => {
      const riscos = JSON.parse(JSON.stringify(p.riscos))
      riscos[ri][field] = value
      return { ...p, riscos }
    })
  }

  function removeRisco(ri: number) {
    setFormGhe((p: any) => ({ ...p, riscos: p.riscos.filter((_: any, idx: number) => idx !== ri) }))
  }

  function aoSairDoNomeRisco(ri: number) {
    setFormGhe((p: any) => {
      const riscos = JSON.parse(JSON.stringify(p.riscos))
      if (!riscos[ri].codigo_esocial) {
        const sugestao = sugerirParaRisco(riscos[ri].nome)
        if (sugestao) riscos[ri].codigo_esocial = sugestao.codigo_esocial
      }
      return { ...p, riscos }
    })
  }

  // Helpers de edição — EPI/EPC
  function addEPI() {
    setFormGhe((p: any) => ({ ...p, epi: [...(p.epi||[]), epiVazio()] }))
  }
  function setEPI(ei: number, field: string, value: any) {
    setFormGhe((p: any) => {
      const epi = JSON.parse(JSON.stringify(p.epi))
      epi[ei][field] = value
      return { ...p, epi }
    })
  }
  function addEPC() {
    setFormGhe((p: any) => ({ ...p, epc: [...(p.epc||[]), epcVazio()] }))
  }
  function setEPC(ei: number, field: string, value: any) {
    setFormGhe((p: any) => {
      const epc = JSON.parse(JSON.stringify(p.epc))
      epc[ei][field] = value
      return { ...p, epc }
    })
  }

  function addFuncao(nome: string) {
    const fn = nome.trim()
    if (!fn) return
    setFormGhe((p: any) => ({ ...p, funcoes: [...(p.funcoes||[]), fn] }))
  }
  function removeFuncao(fi: number) {
    setFormGhe((p: any) => ({ ...p, funcoes: p.funcoes.filter((_: any, i: number) => i !== fi) }))
  }

  function funcionariosDoGhe(g: any) {
    if (!g) return []
    return todosFunc.filter(f => {
      if (f.ghe_uuid) return f.ghe_uuid === g.id
      const sg = (g.setor||'').toLowerCase()
      const sf = (f.setor||'').toLowerCase()
      return sg && sf && (sg.includes(sf) || sf.includes(sg))
    })
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="ghes">
      <Head><title>Cadastro de GHEs — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>Cadastro de GHEs e Riscos</div>
          <div style={s.sub}>Fonte única de dados para LTCAT, PGR e PCMSO — cadastre aqui e sincronize em cada documento</div>
        </div>
        {!modoEdicao && (
          <div style={{ display:'flex', gap:8 }}>
            <button style={s.btnPrimary} onClick={criarNovoGhe}>+ Novo GHE</button>
          </div>
        )}
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro    && <div style={s.erroBox}>{erro}</div>}

      {ghesLista.length === 0 && !modoEdicao ? (
        <div style={s.emptyCard}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="14,3 14,8 19,8"/>
          </svg>
          <div style={{ fontSize:14, fontWeight:500, color:'#374151', marginTop:12 }}>Nenhum GHE cadastrado</div>
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Cadastre os Grupos Homogêneos de Exposição da empresa uma única vez</div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button style={s.btnPrimary} onClick={criarNovoGhe}>+ Novo GHE</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:14 }}>

          {/* Lista lateral */}
          <div>
            <div style={s.secLabel}>GHEs cadastrados</div>
            {ghesLista.map(g => {
              const ativo = g.id === (modoEdicao ? formGhe?.id : gheSel?.id)
              return (
                <div key={g.id} onClick={() => { if(!modoEdicao){ setGheSel(g) } }}
                  style={{ ...s.item, border: ativo?'1.5px solid #185FA5':'0.5px solid #e5e7eb', background: ativo?'#E6F1FB':'#fff', cursor: modoEdicao?'default':'pointer' }}>
                  <div style={{ fontSize:12, fontWeight:600, color: ativo?'#0C447C':'#111' }}>
                    {g.nome || 'GHE sem nome'}
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:3 }}>
                    {g.setor || '—'} · {(g.riscos||[]).length} risco(s)
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detalhe / Edição */}
          <div>
            {/* MODO VISUALIZAÇÃO */}
            {!modoEdicao && gheSel && (
              <div style={s.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#111' }}>{gheSel.nome || 'GHE sem nome'}</div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button style={{ ...s.btnPrimary, padding:'6px 14px', fontSize:12 }} onClick={() => abrirEdicao(gheSel)}>✏ Editar</button>
                    <button style={{ ...s.btnOutline, color:'#E24B4A', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }}
                      onClick={() => desativar(gheSel.id)}>Arquivar</button>
                    <button style={{ ...s.btnOutline, color:'#791F1F', borderColor:'#F09595', padding:'6px 14px', fontSize:12 }}
                      onClick={() => excluirGhe(gheSel.id)}>🗑 Excluir</button>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                  {[
                    { l:'Setor', v: gheSel.setor||'—' },
                    { l:'Trabalhadores', v: gheSel.qtd_trabalhadores||'—' },
                    { l:'Aposent. especial', v: gheSel.aposentadoria_especial?'Sim':'Não' },
                    { l:'Riscos', v: (gheSel.riscos||[]).length },
                  ].map((it,i) => (
                    <div key={i} style={{ background:'#f9fafb', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase' }}>{it.l}</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#111', marginTop:2 }}>{it.v}</div>
                    </div>
                  ))}
                </div>

                {(gheSel.riscos||[]).length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={s.secLabel}>Riscos / agentes</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {gheSel.riscos.map((ag: any, i: number) => (
                        <div key={ag.id||i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10, borderLeft:`3px solid ${TXT_AGENTE[ag.tipo]||'#6b7280'}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                            <span style={{ padding:'1px 7px', borderRadius:99, fontSize:10, fontWeight:600, background:COR_AGENTE[ag.tipo]||'#f3f4f6', color:TXT_AGENTE[ag.tipo]||'#374151' }}>
                              {(TIPO_AGENTE as any)[ag.tipo]||ag.tipo}
                            </span>
                            {ag.supera_lt && <span style={{ fontSize:10, fontWeight:700, color:'#E24B4A' }}>⚠ Supera LT</span>}
                          </div>
                          <div style={{ fontSize:13, fontWeight:500, color:'#111' }}>{ag.nome}</div>
                          {ag.medicao_quantitativa && (ag.valor||ag.limite) && (
                            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>
                              {ag.valor&&`Medido: ${ag.valor}${ag.unidade?' '+ag.unidade:''}`}{ag.valor&&ag.limite?' · ':''}{ag.limite&&`LT: ${ag.limite}`}
                            </div>
                          )}
                          {ag.metodologia && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Metodologia: {ag.metodologia}</div>}
                          {ag.codigo_esocial && <div style={{ fontSize:10, color:'#9ca3af', marginTop:2, fontFamily:'monospace' }}>eSocial: {ag.codigo_esocial}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(() => {
                  const fncsVinculadas = funcionariosDoGhe(gheSel)
                  const todasFuncoes = [...new Set([
                    ...(gheSel.funcoes||[]),
                    ...fncsVinculadas.map((f:any)=>f.funcao).filter(Boolean)
                  ])]
                  if (!todasFuncoes.length) return null
                  return (
                    <div style={{ marginBottom:14 }}>
                      <div style={s.secLabel}>Funções/cargos neste GHE ({fncsVinculadas.length} funcionário(s) vinculado(s))</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {todasFuncoes.map((fn,i) => (
                          <span key={i} style={{ padding:'3px 10px', borderRadius:99, fontSize:11, background:'#E6F1FB', color:'#0C447C' }}>{fn}</span>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <div style={s.secLabel}>EPC</div>
                    {!gheSel.epc?.length ? <div style={s.emptySmall}>Nenhum EPC</div> : gheSel.epc.map((e: any,i: number) => (
                      <div key={i} style={s.epiRow}><span style={{ fontSize:14 }}>{e.eficaz?'✓':'✗'}</span><div><div style={{ fontSize:13 }}>{e.nome}</div><div style={{ fontSize:11, color:e.eficaz?'#1D9E75':'#E24B4A' }}>{e.eficaz?'Eficaz':'Ineficaz'}</div></div></div>
                    ))}
                  </div>
                  <div>
                    <div style={s.secLabel}>EPI</div>
                    {!gheSel.epi?.length ? <div style={s.emptySmall}>Nenhum EPI</div> : gheSel.epi.map((e: any,i: number) => (
                      <div key={i} style={s.epiRow}><span style={{ fontSize:14 }}>{e.eficaz?'✓':'✗'}</span><div><div style={{ fontSize:13 }}>{e.nome}</div><div style={{ fontSize:11, color:'#6b7280' }}>CA: {e.ca||'—'}</div></div></div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop:14, padding:'8px 12px', background:'#f9fafb', borderRadius:8, fontSize:11, color:'#6b7280' }}>
                  Depois de editar aqui, use o botão &quot;Atualizar/Sincronizar do cadastro&quot; em LTCAT, PGR e PCMSO para trazer essas mudanças para cada documento.
                </div>
              </div>
            )}

            {/* MODO EDIÇÃO */}
            {modoEdicao && formGhe && (
              <div style={{ ...s.card, border:'1.5px solid #185FA5' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>✏ {formGhe.id ? 'Editando GHE' : 'Novo GHE'}</div>
                  <button onClick={cancelarEdicao} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
                </div>

                {/* Info básica do GHE */}
                <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr', gap:10, marginBottom:12 }}>
                  <div>
                    <label style={s.label}>Nome do GHE</label>
                    <input style={s.input} value={formGhe.nome||''} onChange={e=>setFormGhe((p:any)=>({...p,nome:e.target.value}))} placeholder="Ex: GHE 01 — Produção"/>
                  </div>
                  <div>
                    <label style={s.label}>Setor</label>
                    <input style={s.input} value={formGhe.setor||''} onChange={e=>setFormGhe((p:any)=>({...p,setor:e.target.value}))} placeholder="Ex: Linha de Produção"/>
                  </div>
                  <div>
                    <label style={s.label}>Qtd. trabalhadores</label>
                    <input style={s.input} type="number" min="1" value={formGhe.qtd_trabalhadores||1} onChange={e=>setFormGhe((p:any)=>({...p,qtd_trabalhadores:parseInt(e.target.value)||1}))}/>
                  </div>
                  <div>
                    <label style={s.label}>Aposent. especial</label>
                    <select style={s.input} value={formGhe.aposentadoria_especial?'sim':'nao'} onChange={e=>setFormGhe((p:any)=>({...p,aposentadoria_especial:e.target.value==='sim'}))}>
                      <option value="nao">Não</option><option value="sim">Sim</option>
                    </select>
                  </div>
                </div>

                {/* Funções/Cargos */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <label style={s.label}>Funções/Cargos neste GHE</label>
                    <span style={{ fontSize:11, color:'#9ca3af' }}>Usado para vincular funcionários automaticamente</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:6 }}>
                    {(formGhe.funcoes||[]).map((fn: string, fi: number) => (
                      <span key={fi} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:99, fontSize:12, background:'#E6F1FB', color:'#0C447C' }}>
                        {fn}
                        <button onClick={()=>removeFuncao(fi)} style={{background:'none',border:'none',cursor:'pointer',color:'#0C447C',fontSize:14,lineHeight:1,padding:0}}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input id="inp-funcao-ghe" style={{ ...s.input, flex:1 }}
                      placeholder="Ex: Operador de Produção, Soldador, Cargo/Função..."
                      list="funcoes-existentes"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                          addFuncao((e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}/>
                    <datalist id="funcoes-existentes">
                      {todosFunc.map(f=>f.funcao).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(fn=>(
                        <option key={fn} value={fn}/>
                      ))}
                    </datalist>
                    <button style={{ ...s.btnOutline, padding:'6px 12px', fontSize:12, whiteSpace:'nowrap' }}
                      onClick={() => {
                        const inp = document.getElementById('inp-funcao-ghe') as HTMLInputElement
                        if (inp?.value.trim()) { addFuncao(inp.value); inp.value = '' }
                      }}>+ Adicionar</button>
                  </div>
                </div>

                {/* Riscos */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={s.secLabel}>Riscos / agentes</div>
                    <button style={{ ...s.btnOutline, padding:'3px 8px', fontSize:11 }} onClick={addRisco}>+ Risco</button>
                  </div>
                  {(formGhe.riscos||[]).map((ag: any, ai: number) => (
                    <div key={ag.id||ai} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:8 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 30px', gap:8, marginBottom:6, alignItems:'center' }}>
                        <select style={s.input} value={ag.tipo||'fis'} onChange={e=>setRisco(ai,'tipo',e.target.value)}>
                          <option value="fis">Físico</option><option value="qui">Químico</option>
                          <option value="bio">Biológico</option><option value="erg">Ergonômico</option>
                        </select>
                        <input style={s.input} value={ag.nome||''} onChange={e=>setRisco(ai,'nome',e.target.value)} onBlur={()=>aoSairDoNomeRisco(ai)} placeholder="Nome do risco (ex: Ruído)"/>
                        <button onClick={()=>removeRisco(ai)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:18, padding:0 }}>×</button>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 130px', gap:8, marginBottom:6 }}>
                        <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                          <input type="checkbox" checked={ag.medicao_quantitativa||false} onChange={e=>setRisco(ai,'medicao_quantitativa',e.target.checked)}/>
                          Medição quantitativa
                        </label>
                        <input style={s.input} value={ag.valor||''} onChange={e=>setRisco(ai,'valor',e.target.value)} placeholder="Valor medido" disabled={!ag.medicao_quantitativa}/>
                        <input style={s.input} value={ag.unidade||''} onChange={e=>setRisco(ai,'unidade',e.target.value)} placeholder="Unidade (dB(A)...)" disabled={!ag.medicao_quantitativa}/>
                        <input style={s.input} value={ag.limite||''} onChange={e=>setRisco(ai,'limite',e.target.value)} placeholder="Limite de tolerância"/>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 160px', gap:8 }}>
                        <input style={s.input} value={ag.metodologia||''} onChange={e=>setRisco(ai,'metodologia',e.target.value)} placeholder="Metodologia (ex: NHO-01)" disabled={!ag.medicao_quantitativa}/>
                        <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, whiteSpace:'nowrap' }}>
                          <input type="checkbox" checked={ag.supera_lt||false} onChange={e=>setRisco(ai,'supera_lt',e.target.checked)}/>
                          Supera LT
                        </label>
                        <input style={s.input} value={ag.codigo_esocial||''} onChange={e=>setRisco(ai,'codigo_esocial',e.target.value)} list="tabela24-codigos" placeholder="Código eSocial"/>
                      </div>
                    </div>
                  ))}
                  <datalist id="tabela24-codigos">
                    {ESOCIAL_TABELA24.map(t => <option key={t.codigo} value={t.codigo}>{t.nome}</option>)}
                  </datalist>
                  {!(formGhe.riscos?.length) && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum risco. Clique em + Risco.</div>}
                </div>

                {/* EPI e EPC */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <div style={s.secLabel}>EPC</div>
                      <button style={{ ...s.btnOutline, padding:'2px 7px', fontSize:10 }} onClick={addEPC}>+ EPC</button>
                    </div>
                    {(formGhe.epc||[]).map((e: any, ei: number) => (
                      <div key={ei} style={{ display:'flex', gap:6, marginBottom:6, alignItems:'center' }}>
                        <input style={{ ...s.input, flex:1 }} value={e.nome||''} onChange={v=>setEPC(ei,'nome',v.target.value)} placeholder="Nome do EPC"/>
                        <select style={{ ...s.input, width:90 }} value={e.eficaz?'sim':'nao'} onChange={v=>setEPC(ei,'eficaz',v.target.value==='sim')}>
                          <option value="sim">Eficaz</option><option value="nao">Ineficaz</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <div style={s.secLabel}>EPI</div>
                      <button style={{ ...s.btnOutline, padding:'2px 7px', fontSize:10 }} onClick={addEPI}>+ EPI</button>
                    </div>
                    {(formGhe.epi||[]).map((e: any, ei: number) => (
                      <div key={ei} style={{ display:'flex', gap:6, marginBottom:6, alignItems:'center' }}>
                        <input style={{ ...s.input, flex:2 }} value={e.nome||''} onChange={v=>setEPI(ei,'nome',v.target.value)} placeholder="Nome do EPI"/>
                        <input style={{ ...s.input, width:70 }} value={e.ca||''} onChange={v=>setEPI(ei,'ca',v.target.value)} placeholder="CA"/>
                        <select style={{ ...s.input, width:90 }} value={e.eficaz?'sim':'nao'} onChange={v=>setEPI(ei,'eficaz',v.target.value==='sim')}>
                          <option value="sim">Eficaz</option><option value="nao">Ineficaz</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {erro && <div style={s.erroBox}>{erro}</div>}
                <div style={{ display:'flex', gap:8, marginTop:14 }}>
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

const s: Record<string, React.CSSProperties> = {
  loading:    { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:     { fontSize:20, fontWeight:700, color:'#111' },
  sub:        { fontSize:12, color:'#6b7280', marginTop:2 },
  secLabel:   { fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 },
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' },
  item:       { borderRadius:10, padding:'10px 12px', marginBottom:8, transition:'all .15s' },
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
