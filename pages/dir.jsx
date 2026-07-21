import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { gerarPdfDir } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'
import { formatarCPF } from '../lib/format'
import { TEXTOS_LEGAIS_DIR } from '../lib/dir-conteudo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function funcoesDoLtcat(ltcat) {
  if (!ltcat?.ghes) return []
  const lista = []
  for (const ghe of ltcat.ghes) {
    const nomes = ghe.funcoes?.length ? ghe.funcoes.map(f => f.nome || f).filter(Boolean) : [ghe.nome || 'Função não identificada']
    for (const funcao of nomes) {
      if (lista.find(f => f.funcao === funcao)) continue
      lista.push({ funcao, setor: ghe.setor || '', observacao: '' })
    }
  }
  return lista
}

export default function DIR() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [respLegalEmpresa, setRespLegalEmpresa] = useState('')
  const [ltcatAtivo, setLtcatAtivo] = useState(null)
  const [dirs, setDirs] = useState([])
  const [dirSel, setDirSel] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('documento')
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

    const [ltcatRes, dirRes] = await Promise.all([
      supabase.from('ltcats').select('*').eq('empresa_id', empId).eq('ativo', true).order('data_emissao', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('dir').select('*').eq('empresa_id', empId).order('criado_em', { ascending: false }),
    ])
    setLtcatAtivo(ltcatRes.data || null)
    setDirs(dirRes.data || [])
    setDirSel(dirRes.data?.[0] || null)
    setCarregando(false)
  }

  function abrirNovo() {
    setForm({
      data_elaboracao: new Date().toISOString().split('T')[0],
      prox_revisao: '', resp_nome: '', resp_conselho: 'CREA', resp_registro: '', resp_cpf: '',
      funcoes: funcoesDoLtcat(ltcatAtivo),
      textos_legais_custom: {},
    })
    setAba('editar')
    setSucesso(''); setErro('')
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

  function abrirEdicao(dir) {
    setForm(JSON.parse(JSON.stringify(dir)))
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
    if (!(form.funcoes || []).length) { setErro('Adicione ao menos uma função avaliada.'); return }
    setSalvando(true); setErro(''); setSucesso('')

    const dados = {
      empresa_id: empresaId,
      data_elaboracao: form.data_elaboracao,
      prox_revisao: form.prox_revisao || null,
      resp_nome: form.resp_nome,
      resp_conselho: form.resp_conselho || 'CREA',
      resp_registro: form.resp_registro || null,
      resp_cpf: form.resp_cpf || null,
      funcoes: form.funcoes || [],
      textos_legais_custom: form.textos_legais_custom || {},
      atualizado_em: new Date().toISOString(),
    }

    let error
    if (form.id) {
      ;({ error } = await supabase.from('dir').update(dados).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('dir').insert(dados))
    }

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso('DIR salvo com sucesso!')
      setForm(null)
      setAba('documento')
      await init()
    }
    setSalvando(false)
  }

  async function arquivar(id) {
    if (!confirm('Arquivar este DIR?')) return
    await supabase.from('dir').update({ ativo: false }).eq('id', id)
    init()
  }

  async function excluir(id) {
    if (!confirm('EXCLUIR este DIR permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('dir').delete().eq('id', id)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setDirSel(null)
    init()
  }

  function addFuncaoManual() {
    setForm(p => ({ ...p, funcoes: [...(p.funcoes || []), { funcao:'', setor:'', observacao:'' }] }))
  }

  function setFuncao(i, field, value) {
    setForm(p => {
      const funcoes = [...p.funcoes]
      funcoes[i] = { ...funcoes[i], [field]: value }
      return { ...p, funcoes }
    })
  }

  function removerFuncao(i) {
    setForm(p => ({ ...p, funcoes: p.funcoes.filter((_, idx) => idx !== i) }))
  }

  function exportarPdf(dir) {
    gerarPdfDir(
      {
        dados_gerais: {
          data_elaboracao: dir.data_elaboracao, prox_revisao: dir.prox_revisao,
          resp_nome: dir.resp_nome, resp_conselho: dir.resp_conselho, resp_registro: dir.resp_registro, resp_cpf: dir.resp_cpf,
        },
        funcoes: dir.funcoes || [],
        textos_legais_custom: dir.textos_legais_custom || {},
      },
      { razao_social: nomeEmpresa, cnpj: cnpjEmpresa, resp_nome: respLegalEmpresa }
    )
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="dir">
      <Head><title>DIR — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>DIR</div>
          <div style={s.sub}>Declaração de Inexistência de Risco</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {dirSel && <button style={s.btnOutline} onClick={() => exportarPdf(dirSel)}>📄 Exportar PDF</button>}
          <button style={s.btnPrimary} onClick={abrirNovo}>+ Novo DIR</button>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && aba !== 'editar' && <div style={s.erroBox}>{erro}</div>}

      {!ltcatAtivo && (
        <div style={{ ...s.card, background:'#FAEEDA', border:'0.5px solid #F3D9A4' }}>
          <div style={{ fontSize:13, color:'#633806' }}>
            Nenhum LTCAT vigente encontrado. As funções podem ser cadastradas manualmente, mas recomendamos cadastrar o LTCAT/PGR primeiro para herdar as funções automaticamente.
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:'1.25rem' }}>
        {[
          { n: dirSel ? 'Vigente' : 'Ausente', l:'DIR', c: dirSel ? '#1D9E75' : '#E24B4A' },
          { n: dirSel?.funcoes?.length || 0, l:'Funções declaradas sem risco', c:'#185FA5' },
          { n: dirSel?.prox_revisao ? new Date(dirSel.prox_revisao+'T12:00:00').toLocaleDateString('pt-BR') : '—', l:'Próxima revisão', c:'#374151' },
        ].map((k,i) => (
          <div key={i} style={s.kpiCard}>
            <div style={{ fontSize:22, fontWeight:700, color:k.c }}>{k.n}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {aba === 'documento' && (
        <div>
          {!dirSel ? (
            <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:14, color:'#374151', marginBottom:8 }}>Nenhum DIR cadastrado</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>Declare formalmente a ausência de risco para funções/setores avaliados</div>
              <button style={s.btnPrimary} onClick={abrirNovo}>+ Criar primeiro DIR</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={s.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={s.cardTit}>Dados gerais</div>
                  <div style={{ display:'flex', gap:5 }}>
                    <button style={s.btnAcao} onClick={() => abrirEdicao(dirSel)}>Editar</button>
                    <button style={s.btnAcao} onClick={() => arquivar(dirSel.id)}>Arquivar</button>
                    <button style={{ ...s.btnAcao, color:'#E24B4A', borderColor:'#F09595' }} onClick={() => excluir(dirSel.id)}>Excluir</button>
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <div style={s.secLabel}>Elaboração</div>
                    <div style={{ fontSize:13 }}>{dirSel.data_elaboracao ? new Date(dirSel.data_elaboracao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                  <div>
                    <div style={s.secLabel}>Próxima revisão</div>
                    <div style={{ fontSize:13 }}>{dirSel.prox_revisao ? new Date(dirSel.prox_revisao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <div style={s.secLabel}>Responsável técnico</div>
                    <div style={{ fontSize:13 }}>{dirSel.resp_nome || '—'} {dirSel.resp_cpf ? `· ${dirSel.resp_cpf}` : ''}</div>
                  </div>
                  <div>
                    <div style={s.secLabel}>{dirSel.resp_conselho || 'CREA'}</div>
                    <div style={{ fontSize:13 }}>{dirSel.resp_registro || '—'}</div>
                  </div>
                </div>
              </div>

              <div style={s.card}>
                <div style={s.cardTit}>Funções declaradas sem risco ({dirSel.funcoes?.length || 0})</div>
                {dirSel.funcoes?.length ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                    {dirSel.funcoes.map((f,i) => (
                      <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{f.funcao}</div>
                          <div style={{ fontSize:11, color:'#9ca3af' }}>{f.setor}</div>
                        </div>
                        <div style={{ marginTop:6 }}>
                          <span style={{ ...s.tag, background:'#EAF3DE', color:'#27500A' }}>Sem risco identificado</span>
                        </div>
                        {f.observacao && <div style={{ fontSize:11, color:'#6b7280', marginTop:6 }}>{f.observacao}</div>}
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhuma função declarada.</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {aba === 'editar' && form && (
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={s.cardTit}>{form.id ? 'Editar DIR' : 'Novo DIR'}</div>
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
              <label style={s.label}>Funções declaradas sem risco ({form.funcoes?.length || 0})</label>
              <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addFuncaoManual}>+ Adicionar função</button>
            </div>
            {(form.funcoes || []).map((f, i) => (
              <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:12, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <button onClick={() => removerFuncao(i)} style={{ background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:16 }}>×</button>
                </div>
                <div style={s.row2}>
                  <input style={s.input} placeholder="Função" value={f.funcao} onChange={e => setFuncao(i, 'funcao', e.target.value)} />
                  <input style={s.input} placeholder="Setor" value={f.setor} onChange={e => setFuncao(i, 'setor', e.target.value)} />
                </div>
                <input style={s.input} placeholder="Observação (opcional — ex: avaliação realizada em visita técnica de dd/mm/aaaa)" value={f.observacao||''} onChange={e => setFuncao(i, 'observacao', e.target.value)} />
              </div>
            ))}
            {!(form.funcoes || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhuma função. Cadastre um LTCAT vigente ou adicione manualmente.</div>}
          </div>

          {/* ── Textos legais do documento ── */}
          <div style={{ marginBottom:16 }}>
            <label style={s.label}>Textos legais do documento</label>
            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:8 }}>Textos padrão que vão no PDF — edite só se precisar ajustar alguma redação para o caso da empresa.</div>
            {TEXTOS_LEGAIS_DIR.map(secaoTexto => {
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
            <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar DIR'}</button>
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
  input:      { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit', marginBottom:10 },
  btnAcao:    { padding:'3px 10px', fontSize:11, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151' },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  tag:        { padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600 },
}
