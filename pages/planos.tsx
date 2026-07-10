import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'
import { FAIXAS_VIDAS, faixaAtual, formatarFaixaLabel } from '../lib/vidas-planos'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Planos() {
  const router = useRouter()
  const [planoAtual, setPlanoAtual] = useState<string>('trial')
  const [qtdFuncionarios, setQtdFuncionarios] = useState<number>(0)
  const [trialRestante, setTrialRestante] = useState<number | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)

    const { data: status } = await supabase.rpc('get_plano_empresa', { p_empresa_id: empId })
    if (status) {
      setPlanoAtual(status.plano || 'trial')
      setQtdFuncionarios(status.qtd_funcionarios || 0)
      if (status.trial_ativo) setTrialRestante(status.trial_dias_restantes)
      else if (status.plano === 'trial') setTrialRestante(0)
    }
    setCarregando(false)
  }

  async function assinar() {
    setErro('')
    setProcessando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({}),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json.erro || 'Erro ao criar sessão de pagamento')
      window.location.href = json.url
    } catch (err: any) {
      setErro(err.message)
      setProcessando(false)
    }
  }

  if (carregando) return (
    <>
      <Head><title>Planos e Preços — eSocial SST Transmissor</title></Head>
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' }}>
        Carregando...
      </div>
    </>
  )

  const indiceAtual = FAIXAS_VIDAS.findIndex(f => f === faixaAtual(qtdFuncionarios))

  return (
    <Layout pagina="planos">
      <Head>
        <title>Planos e Preços — eSocial SST Transmissor</title>
        <meta name="description" content="Um único plano, cobrado pelo número de funcionários ativos. Transmissão eSocial e documentos SST ilimitados." />
        <meta property="og:title" content="Planos e Preços — eSocial SST Transmissor" />
        <meta property="og:description" content="Cobrança por vidas ativas — empresas menores pagam menos. Trial gratuito de 14 dias." />
      </Head>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign:'center', marginBottom: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 6 }}>
            Um plano só, por número de vidas
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            Transmissão eSocial + os 7 documentos SST (PGR, LTCAT, PCMSO, AET, APR, LIP, PPP) ilimitados · Cancele quando quiser
          </div>

          {planoAtual === 'trial' && trialRestante !== null && trialRestante > 0 && (
            <div style={{ display:'inline-block', marginTop: 12, background:'#FAEEDA', border:'0.5px solid #FAC775', borderRadius: 8, padding:'8px 16px', fontSize:13, color:'#633806', fontWeight:500 }}>
              Seu trial termina em {trialRestante} dia{trialRestante !== 1 ? 's' : ''}
            </div>
          )}
          {(router.query.trial_expirado === '1' || (planoAtual === 'trial' && trialRestante === 0)) && (
            <div style={{ display:'inline-block', marginTop: 12, background:'#FCEBEB', border:'0.5px solid #F7C1C1', borderRadius: 8, padding:'8px 16px', fontSize:13, color:'#791F1F', fontWeight:600 }}>
              Seu trial de 14 dias expirou. Assine para continuar.
            </div>
          )}

          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginTop:14, background:'#f9fafb', border:'0.5px solid #e5e7eb', borderRadius:10, padding:'10px 16px' }}>
            <div style={{ fontSize:13, color:'#374151' }}>
              Funcionários ativos cadastrados: <strong>{qtdFuncionarios}</strong>
            </div>
          </div>
        </div>

        {router.query.upgrade === 'ok' && (
          <div style={{ background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:20, textAlign:'center' }}>
            Assinatura ativada com sucesso! Obrigado por assinar.
          </div>
        )}

        {erro && (
          <div style={{ background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:20 }}>
            {erro}
          </div>
        )}

        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:14, overflow:'hidden', marginBottom: 24 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f9fafb' }}>
                <th style={{ textAlign:'left', padding:'10px 16px', fontSize:12, color:'#6b7280', fontWeight:600 }}>Vidas ativas</th>
                <th style={{ textAlign:'right', padding:'10px 16px', fontSize:12, color:'#6b7280', fontWeight:600 }}>Mensalidade</th>
              </tr>
            </thead>
            <tbody>
              {FAIXAS_VIDAS.map((f, i) => {
                const atual = i === indiceAtual
                const preco = 'preco' in f ? `R$ ${f.preco}` : `R$ ${f.precoPorVida!.toFixed(2).replace('.', ',')}/vida`
                return (
                  <tr key={i} style={{ background: atual ? '#E6F1FB' : 'transparent', borderTop: '0.5px solid #e5e7eb' }}>
                    <td style={{ padding:'10px 16px', fontSize:13, color: atual ? '#185FA5' : '#111', fontWeight: atual ? 700 : 400 }}>
                      {formatarFaixaLabel(i)} {atual && '· sua faixa atual'}
                    </td>
                    <td style={{ padding:'10px 16px', fontSize:13, textAlign:'right', color: atual ? '#185FA5' : '#111', fontWeight: atual ? 700 : 400 }}>
                      {preco}{'preco' in f ? '/mês' : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign:'center', marginBottom: 24 }}>
          {planoAtual === 'vidas' ? (
            <div style={{ display:'inline-block', padding:'10px 24px', background:'#EAF3DE', border:'1px solid #27500A40', borderRadius:8, fontSize:13, fontWeight:600, color:'#27500A' }}>
              Assinatura ativa
            </div>
          ) : (
            <button
              onClick={assinar}
              disabled={processando}
              style={{
                padding:'12px 32px', background:'#185FA5', color:'#fff',
                border:'none', borderRadius:8, fontSize:14, fontWeight:600,
                cursor: processando ? 'not-allowed' : 'pointer', opacity: processando ? 0.7 : 1,
              }}>
              {processando ? 'Redirecionando...' : 'Assinar agora'}
            </button>
          )}
        </div>

        <div style={{ background:'#f9fafb', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'16px 20px', fontSize:12, color:'#6b7280', textAlign:'center' }}>
          A faixa é recalculada automaticamente pelo pico de funcionários ativos no ciclo (não pelo valor no fechamento) ·
          Pagamentos processados com segurança pelo <strong>Stripe</strong> · Cartão de crédito, débito ou boleto ·
          Cancele a qualquer momento
        </div>
      </div>
    </Layout>
  )
}
