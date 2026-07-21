import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'
import { MIN_RESPOSTAS_ANALISE } from '../lib/pesquisa-psicossocial-conteudo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const s = {
  card: { background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24, marginBottom:20 },
  h2: { fontSize:16, fontWeight:700, color:'#111827', margin:'0 0 4px' },
  hint: { fontSize:13, color:'#6b7280', margin:'0 0 16px' },
  linkBox: { display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' },
  input: { flex:1, minWidth:240, padding:'10px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:13, color:'#374151', background:'#f9fafb' },
  btn: { padding:'10px 16px', borderRadius:8, border:'none', background:'#185FA5', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnOutline: { padding:'10px 16px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnIA: { padding:'12px 20px', borderRadius:8, border:'none', background:'#185FA5', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' },
  btnIADisabled: { padding:'12px 20px', borderRadius:8, border:'none', background:'#9ca3af', color:'#fff', fontSize:14, fontWeight:700, cursor:'default' },
  tabela: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', padding:'8px 10px', color:'#6b7280', fontWeight:600, borderBottom:'1px solid #e5e7eb' },
  td: { padding:'8px 10px', borderBottom:'1px solid #f3f4f6', color:'#374151' },
  badge: (cor, bg) => ({ display:'inline-block', padding:'2px 10px', borderRadius:999, fontSize:12, fontWeight:700, color:cor, background:bg }),
  erro: { background:'#FCEBEB', color:'#791F1F', fontSize:13, padding:'12px 14px', borderRadius:8, marginBottom:16 },
  sucesso: { background:'#EAF3DE', color:'#27500A', fontSize:13, padding:'12px 14px', borderRadius:8, marginBottom:16 },
  aviso: { background:'#FAEEDA', color:'#633806', fontSize:13, padding:'12px 14px', borderRadius:8, marginBottom:16 },
  progressoBarra: { height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden', marginTop:8 },
  progressoFill: (pct) => ({ height:'100%', width:`${Math.min(100, pct)}%`, background:'#185FA5' }),
  quote: { fontSize:13, color:'#374151', background:'#f9fafb', borderLeft:'3px solid #185FA5', padding:'8px 12px', marginBottom:8, borderRadius:4 },
}

export default function PesquisaPsicossocial() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [link, setLink] = useState(null)
  const [gerandoLink, setGerandoLink] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const [resultados, setResultados] = useState(null)
  const [gerandoIA, setGerandoIA] = useState(false)
  const [paragrafosGerados, setParagrafosGerados] = useState(null)

  useEffect(() => { init() }, [])

  async function tokenAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)

    await Promise.all([carregarLink(session.access_token), carregarResultados(session.access_token)])
    setCarregando(false)
  }

  async function carregarLink(accessToken) {
    try {
      const resp = await fetch('/api/pesquisa-psicossocial/link', { headers: { Authorization: `Bearer ${accessToken}` } })
      const json = await resp.json()
      if (resp.ok) setLink(json)
    } catch {}
  }

  async function carregarResultados(accessToken) {
    try {
      const resp = await fetch('/api/pesquisa-psicossocial/resultados', { headers: { Authorization: `Bearer ${accessToken}` } })
      const json = await resp.json()
      if (resp.ok) setResultados(json)
    } catch {}
  }

  async function regenerarLink() {
    if (!confirm('Isso encerra o link atual — quem já tiver o link antigo não conseguirá mais responder. Continuar?')) return
    setGerandoLink(true)
    setErro('')
    try {
      const accessToken = await tokenAuth()
      const resp = await fetch('/api/pesquisa-psicossocial/link', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ action: 'regenerar' }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json.erro)
      setLink(json)
    } catch (err) {
      setErro(err.message || 'Erro ao gerar novo link.')
    }
    setGerandoLink(false)
  }

  function copiarLink() {
    if (!link?.url) return
    navigator.clipboard.writeText(link.url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function gerarAnalise() {
    setGerandoIA(true); setErro(''); setSucesso(''); setParagrafosGerados(null)
    try {
      const accessToken = await tokenAuth()
      const resp = await fetch('/api/gerar-analise-psicossocial-ia', {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json.erro || 'Erro ao gerar análise.')
      setParagrafosGerados(json.paragrafos)
      setSucesso('Análise gerada e aplicada à seção "RISCOS PSICOSSOCIAIS" do PGR ativo. Confira e ajuste se necessário na tela do PGR.')
    } catch (err) {
      setErro(err.message || 'Erro ao gerar análise.')
    }
    setGerandoIA(false)
  }

  if (carregando) return <Layout><div style={{ padding:40 }}>Carregando...</div></Layout>

  const total = resultados?.total || 0
  const liberado = resultados?.liberado_analise

  return (
    <Layout>
      <Head><title>Pesquisa Psicossocial — eSocial SST</title></Head>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 20px' }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#111827', marginBottom:4 }}>Pesquisa de Riscos Psicossociais</h1>
        <p style={{ color:'#6b7280', fontSize:14, marginBottom:24 }}>
          Colete a percepção anônima dos colaboradores sobre riscos psicossociais (NR-1) e gere, com IA, a análise que alimenta a seção "Riscos Psicossociais" do PGR.
        </p>

        {erro && <div style={s.erro}>{erro}</div>}
        {sucesso && <div style={s.sucesso}>{sucesso}</div>}

        <div style={s.card}>
          <h2 style={s.h2}>Link para os colaboradores</h2>
          <p style={s.hint}>Compartilhe por WhatsApp, e-mail ou mural — não exige login. As respostas são 100% anônimas.</p>
          <div style={s.linkBox}>
            <input style={s.input} readOnly value={link?.url || ''} onFocus={e => e.target.select()} />
            <button style={s.btn} onClick={copiarLink}>{copiado ? 'Copiado!' : 'Copiar link'}</button>
            <button style={s.btnOutline} onClick={regenerarLink} disabled={gerandoLink}>{gerandoLink ? 'Gerando...' : 'Gerar novo link'}</button>
          </div>
        </div>

        <div style={s.card}>
          <h2 style={s.h2}>Respostas recebidas</h2>
          <p style={s.hint}>{total} resposta{total === 1 ? '' : 's'} até agora.</p>
          {!liberado && (
            <>
              <div style={s.aviso}>São necessárias ao menos {MIN_RESPOSTAS_ANALISE} respostas para liberar a análise por IA — isso protege o anonimato de quem já respondeu.</div>
              <div style={s.progressoBarra}><div style={s.progressoFill((total / MIN_RESPOSTAS_ANALISE) * 100)} /></div>
            </>
          )}
        </div>

        {liberado && (
          <>
            <div style={s.card}>
              <h2 style={s.h2}>Resultado por dimensão</h2>
              <table style={s.tabela}>
                <thead><tr><th style={s.th}>Dimensão</th><th style={s.th}>Média (1–5)</th><th style={s.th}>Nível</th></tr></thead>
                <tbody>
                  {resultados.dimensoes.map(d => (
                    <tr key={d.id}>
                      <td style={s.td}>{d.nome}</td>
                      <td style={s.td}>{d.media ?? '—'}</td>
                      <td style={s.td}><span style={s.badge(d.cor, d.bg)}>{d.label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {resultados.prevalencia_critica.some(p => p.percentual > 0) && (
              <div style={s.card}>
                <h2 style={s.h2}>Itens críticos relatados</h2>
                <p style={s.hint}>Assédio e discriminação — qualquer percentual acima de zero merece atenção, mesmo isolado.</p>
                <table style={s.tabela}>
                  <thead><tr><th style={s.th}>Item</th><th style={s.th}>% que relatou (frequente/sempre)</th></tr></thead>
                  <tbody>
                    {resultados.prevalencia_critica.map(p => (
                      <tr key={p.item_id}>
                        <td style={s.td}>{p.texto}</td>
                        <td style={s.td}><span style={s.badge(p.percentual > 0 ? '#791F1F' : '#27500A', p.percentual > 0 ? '#FCEBEB' : '#EAF3DE')}>{p.percentual}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {resultados.setores.length > 0 && (
              <div style={s.card}>
                <h2 style={s.h2}>Por setor</h2>
                <p style={s.hint}>Só exibido para setores com {MIN_RESPOSTAS_ANALISE}+ respostas, para preservar o anonimato.</p>
                <table style={s.tabela}>
                  <thead><tr><th style={s.th}>Setor</th><th style={s.th}>Respostas</th><th style={s.th}>Nível geral</th></tr></thead>
                  <tbody>
                    {resultados.setores.map(st => (
                      <tr key={st.nome}>
                        <td style={s.td}>{st.nome}</td>
                        <td style={s.td}>{st.total}</td>
                        <td style={s.td}><span style={s.badge(st.cor, st.bg)}>{st.label}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(resultados.comentarios.length > 0 || resultados.sugestoes.length > 0) && (
              <div style={s.card}>
                <h2 style={s.h2}>Comentários abertos (anônimos)</h2>
                {resultados.comentarios.slice(0, 10).map((c, i) => <div key={`c${i}`} style={s.quote}>{c}</div>)}
                {resultados.sugestoes.slice(0, 10).map((c, i) => <div key={`s${i}`} style={s.quote}>{c}</div>)}
              </div>
            )}

            <div style={s.card}>
              <h2 style={s.h2}>Gerar análise com IA</h2>
              <p style={s.hint}>A IA escreve um texto técnico com base nos dados acima e substitui o parágrafo padrão da seção "Riscos Psicossociais" do PGR ativo da empresa.</p>
              <button style={gerandoIA ? s.btnIADisabled : s.btnIA} onClick={gerarAnalise} disabled={gerandoIA}>
                {gerandoIA ? 'Gerando análise...' : '✨ Gerar análise com IA e aplicar ao PGR'}
              </button>

              {paragrafosGerados && (
                <div style={{ marginTop:20 }}>
                  {paragrafosGerados.map((p, i) => <p key={i} style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>{p}</p>)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
