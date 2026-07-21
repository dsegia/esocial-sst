import { useEffect, useState } from 'react'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import { DIMENSOES_PESQUISA, ESCALA_LIKERT, PERGUNTAS_ABERTAS } from '../../lib/pesquisa-psicossocial-conteudo'

const s = {
  pagina: { minHeight:'100vh', background:'#f4f6f9', display:'flex', justifyContent:'center', padding:'0 0 40px' },
  cartao: { width:'100%', maxWidth:560, background:'#fff', minHeight:'100vh', boxShadow:'0 0 24px rgba(0,0,0,0.04)' },
  topo: { background:'#185FA5', color:'#fff', padding:'20px 20px 16px' },
  barraProgresso: { height:6, background:'rgba(255,255,255,0.3)', borderRadius:3, marginTop:12, overflow:'hidden' },
  barraProgressoFill: (pct) => ({ height:'100%', width:`${pct}%`, background:'#fff', borderRadius:3, transition:'width .2s' }),
  corpo: { padding:'24px 20px 100px' },
  h1: { fontSize:18, fontWeight:700, margin:0 },
  sub: { fontSize:13, opacity:0.9, marginTop:4 },
  dimNome: { fontSize:16, fontWeight:700, color:'#111827', marginBottom:4 },
  dimContagem: { fontSize:12, color:'#6b7280', marginBottom:20 },
  pergunta: { marginBottom:28 },
  perguntaTexto: { fontSize:14, color:'#1f2937', marginBottom:10, lineHeight:1.4 },
  escala: { display:'flex', gap:6 },
  botaoEscala: (ativo) => ({
    flex:1, padding:'10px 4px', borderRadius:8, border:`1.5px solid ${ativo ? '#185FA5' : '#e5e7eb'}`,
    background: ativo ? '#185FA5' : '#fff', color: ativo ? '#fff' : '#374151',
    fontSize:12, fontWeight:600, cursor:'pointer', textAlign:'center', lineHeight:1.3,
  }),
  rodape: { position:'fixed', bottom:0, left:0, right:0, display:'flex', justifyContent:'center', background:'#fff', borderTop:'1px solid #e5e7eb' },
  rodapeInner: { width:'100%', maxWidth:560, padding:16, display:'flex', gap:10 },
  btnPrimario: (desabilitado) => ({
    flex:1, padding:'14px', borderRadius:10, border:'none', background: desabilitado ? '#9ca3af' : '#185FA5',
    color:'#fff', fontSize:15, fontWeight:700, cursor: desabilitado ? 'default' : 'pointer',
  }),
  btnSecundario: { padding:'14px 18px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:15, fontWeight:600, cursor:'pointer' },
  label: { fontSize:13, fontWeight:600, color:'#374151', marginBottom:8, display:'block' },
  select: { width:'100%', padding:'12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, marginBottom:20, background:'#fff' },
  textarea: { width:'100%', padding:'12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, marginBottom:20, minHeight:80, fontFamily:'inherit', resize:'vertical' },
  aviso: { background:'#E6F1FB', color:'#0C447C', fontSize:13, padding:'12px 14px', borderRadius:8, marginBottom:20, lineHeight:1.5 },
  erro: { background:'#FCEBEB', color:'#791F1F', fontSize:13, padding:'12px 14px', borderRadius:8, marginBottom:16 },
  centro: { textAlign:'center', padding:'60px 20px' },
}

const TOTAL_ITENS = DIMENSOES_PESQUISA.reduce((n, d) => n + d.itens.length, 0)
// intro (0) + 1 passo por dimensão + setor/comentários + sucesso
const ULTIMO_PASSO_DIMENSAO = DIMENSOES_PESQUISA.length

export default function PesquisaPsicossocial(props) {
  const { token, empresa, setores, linkInvalido } = props

  const [passo, setPasso] = useState(0)
  const [respostas, setRespostas] = useState({})
  const [setor, setSetor] = useState('')
  const [comentario, setComentario] = useState('')
  const [sugestao, setSugestao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [jaRespondeu, setJaRespondeu] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(`psi_respondido_${token}`)) {
      setJaRespondeu(true)
    }
  }, [token])

  if (linkInvalido) {
    return (
      <div style={s.pagina}><div style={s.cartao}>
        <div style={s.centro}>
          <h1 style={s.h1}>Link inválido</h1>
          <p style={{ color:'#6b7280', marginTop:8 }}>Este link de pesquisa não existe ou foi encerrado. Fale com o responsável pela empresa para obter um link atualizado.</p>
        </div>
      </div></div>
    )
  }

  if (jaRespondeu) {
    return (
      <div style={s.pagina}><div style={s.cartao}>
        <div style={s.centro}>
          <h1 style={s.h1}>Obrigado!</h1>
          <p style={{ color:'#6b7280', marginTop:8 }}>Você já respondeu esta pesquisa neste dispositivo. Sua resposta é anônima e já foi registrada.</p>
        </div>
      </div></div>
    )
  }

  const dimensaoAtual = passo >= 1 && passo <= ULTIMO_PASSO_DIMENSAO ? DIMENSOES_PESQUISA[passo - 1] : null
  const passoFinal = ULTIMO_PASSO_DIMENSAO + 1
  const passoSucesso = ULTIMO_PASSO_DIMENSAO + 2

  const respondidasAteAgora = Object.keys(respostas).length
  const pctProgresso = passo === 0 ? 0 : passo === passoSucesso ? 100 : Math.min(100, Math.round((respondidasAteAgora / TOTAL_ITENS) * 100))

  function responderItem(itemId, valor) {
    setRespostas(prev => ({ ...prev, [itemId]: valor }))
  }

  function dimensaoCompleta(dim) {
    return dim.itens.every(i => respostas[i.id])
  }

  async function avancar() {
    setErro('')
    if (dimensaoAtual && !dimensaoCompleta(dimensaoAtual)) {
      setErro('Responda todas as perguntas desta página para continuar.')
      return
    }
    if (passo === passoFinal) {
      setEnviando(true)
      try {
        const resp = await fetch('/api/pesquisa-psicossocial/responder', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, respostas, setor: setor || null, comentario: comentario || null, sugestao: sugestao || null }),
        })
        const json = await resp.json()
        if (!resp.ok) throw new Error(json.erro || 'Erro ao enviar respostas.')
        localStorage.setItem(`psi_respondido_${token}`, '1')
        setPasso(passoSucesso)
      } catch (err) {
        setErro(err.message || 'Erro ao enviar respostas. Tente novamente.')
      }
      setEnviando(false)
      return
    }
    setPasso(p => p + 1)
    window.scrollTo(0, 0)
  }

  function voltar() {
    setErro('')
    setPasso(p => Math.max(0, p - 1))
    window.scrollTo(0, 0)
  }

  return (
    <div style={s.pagina}>
      <Head><title>Pesquisa de bem-estar no trabalho</title></Head>
      <div style={s.cartao}>
        <div style={s.topo}>
          <div style={s.h1}>Pesquisa de bem-estar no trabalho</div>
          <div style={s.sub}>{empresa}</div>
          {passo > 0 && passo < passoSucesso && <div style={s.barraProgresso}><div style={s.barraProgressoFill(pctProgresso)} /></div>}
        </div>

        <div style={s.corpo}>
          {passo === 0 && (
            <>
              <div style={s.aviso}>
                Esta pesquisa é <strong>totalmente anônima</strong> — não pedimos seu nome, e-mail ou qualquer identificação. As respostas são analisadas apenas em conjunto, nunca individualmente, e ajudam a empresa a cumprir a NR-1 (avaliação de riscos psicossociais) e a melhorar o ambiente de trabalho.
              </div>
              <p style={{ fontSize:14, color:'#374151', lineHeight:1.6 }}>
                São {TOTAL_ITENS} perguntas de múltipla escolha e 2 perguntas abertas opcionais. Leva cerca de 6 a 8 minutos. Responda pensando na sua rotina de trabalho nos últimos meses.
              </p>
            </>
          )}

          {dimensaoAtual && (
            <>
              <div style={s.dimNome}>{dimensaoAtual.nome}</div>
              <div style={s.dimContagem}>Etapa {passo} de {ULTIMO_PASSO_DIMENSAO}</div>
              {dimensaoAtual.itens.map(item => (
                <div key={item.id} style={s.pergunta}>
                  <div style={s.perguntaTexto}>{item.texto}</div>
                  <div style={s.escala}>
                    {ESCALA_LIKERT.map(op => (
                      <button key={op.valor} type="button" style={s.botaoEscala(respostas[item.id] === op.valor)}
                        onClick={() => responderItem(item.id, op.valor)}>
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {passo === passoFinal && (
            <>
              <div style={s.label}>Setor (opcional)</div>
              <select style={s.select} value={setor} onChange={e => setSetor(e.target.value)}>
                <option value="">Prefiro não informar</option>
                {setores.map(st => <option key={st} value={st}>{st}</option>)}
              </select>

              {PERGUNTAS_ABERTAS.map(p => (
                <div key={p.id}>
                  <div style={s.label}>{p.texto} <span style={{ fontWeight:400, color:'#9ca3af' }}>(opcional)</span></div>
                  <textarea style={s.textarea} value={p.id === 'comentario' ? comentario : sugestao}
                    onChange={e => p.id === 'comentario' ? setComentario(e.target.value) : setSugestao(e.target.value)} />
                </div>
              ))}
            </>
          )}

          {passo === passoSucesso && (
            <div style={s.centro}>
              <h1 style={s.h1}>Obrigado por participar!</h1>
              <p style={{ color:'#6b7280', marginTop:8 }}>Sua resposta foi registrada de forma anônima e vai contribuir para melhorar o ambiente de trabalho na {empresa}.</p>
            </div>
          )}

          {erro && <div style={s.erro}>{erro}</div>}
        </div>

        {passo < passoSucesso && (
          <div style={s.rodape}><div style={s.rodapeInner}>
            {passo > 0 && <button type="button" style={s.btnSecundario} onClick={voltar} disabled={enviando}>Voltar</button>}
            <button type="button" style={s.btnPrimario(enviando)} onClick={avancar} disabled={enviando}>
              {enviando ? 'Enviando...' : passo === 0 ? 'Começar' : passo === passoFinal ? 'Enviar respostas' : 'Continuar'}
            </button>
          </div></div>
        )}
      </div>
    </div>
  )
}

// Validação do token acontece no servidor a cada request (nunca em build/ISR —
// o link pode ser encerrado/regerado a qualquer momento pela empresa).
export async function getServerSideProps({ params, res }) {
  const { token } = params
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: link } = await sb.from('pesquisa_psicossocial_links')
    .select('id, empresa_id, ativo').eq('token', token).maybeSingle()

  if (!link || !link.ativo) {
    res.statusCode = 404
    return { props: { token, empresa: '', setores: [], linkInvalido: true } }
  }

  const { data: empresaRow } = await sb.from('empresas').select('razao_social').eq('id', link.empresa_id).single()

  const [{ data: ghesSetores }, { data: funcSetores }] = await Promise.all([
    sb.from('ghes').select('setor').eq('empresa_id', link.empresa_id).eq('ativo', true),
    sb.from('funcionarios').select('setor').eq('empresa_id', link.empresa_id).eq('ativo', true),
  ])
  const setores = [...new Set([...(ghesSetores || []), ...(funcSetores || [])]
    .map(row => (row.setor || '').trim()).filter(Boolean))].sort()

  return { props: { token, empresa: empresaRow?.razao_social || 'sua empresa', setores, linkInvalido: false } }
}
