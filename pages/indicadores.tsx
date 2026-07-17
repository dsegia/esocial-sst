import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'

function hojeMenosDias(dias: number) {
  const d = new Date(); d.setDate(d.getDate() - dias)
  return d.toISOString().split('T')[0]
}

export default function Indicadores() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [inicio, setInicio] = useState(hojeMenosDias(365))
  const [fim, setFim] = useState(new Date().toISOString().split('T')[0])
  const [horasDia, setHorasDia] = useState(8)
  const [hhtManual, setHhtManual] = useState<number | ''>('')

  const [qtdFuncionarios, setQtdFuncionarios] = useState(0)
  const [cats, setCats] = useState<any[]>([])
  const [asos, setAsos] = useState<any[]>([])
  const [treinamentos, setTreinamentos] = useState<any[]>([])
  const [episComCiencia, setEpisComCiencia] = useState(0)
  const [episTotal, setEpisTotal] = useState(0)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)

    const [funcRes, catsRes, asosRes, treinRes, episRes] = await Promise.all([
      supabase.from('funcionarios').select('id', { count: 'exact', head: true }).eq('empresa_id', empId).eq('ativo', true),
      supabase.from('cats').select('dt_acidente,dias_afastamento,houve_morte,tipo_cat').eq('empresa_id', empId).limit(5000),
      supabase.from('asos').select('prox_exame,tipo_aso').eq('empresa_id', empId).not('funcionario_id', 'is', null).limit(5000),
      supabase.from('treinamentos').select('data_vencimento').eq('empresa_id', empId).limit(5000),
      supabase.from('epis_entregues').select('ciencia').eq('empresa_id', empId).limit(5000),
    ])
    setQtdFuncionarios(funcRes.count || 0)
    setCats(catsRes.data || [])
    setAsos(asosRes.data || [])
    setTreinamentos(treinRes.data || [])
    setEpisTotal((episRes.data || []).length)
    setEpisComCiencia((episRes.data || []).filter(e => e.ciencia).length)
    setCarregando(false)
  }

  const catsPeriodo = cats.filter(c => c.dt_acidente && c.dt_acidente >= inicio && c.dt_acidente <= fim)
  const acidentesComAfastamento = catsPeriodo.filter(c => (c.dias_afastamento || 0) > 0).length
  const diasPerdidos = catsPeriodo.reduce((soma, c) => soma + (c.dias_afastamento || 0), 0)
  const obitos = catsPeriodo.filter(c => c.houve_morte).length

  const diasNoPeriodo = Math.max(1, Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000))
  const hhtEstimado = qtdFuncionarios * diasNoPeriodo * horasDia
  const hht = hhtManual !== '' ? Number(hhtManual) : hhtEstimado

  const tf = hht > 0 ? (acidentesComAfastamento * 1_000_000) / hht : 0
  const tg = hht > 0 ? (diasPerdidos * 1_000_000) / hht : 0

  function diasParaVencer(d: string | null) {
    if (!d) return null
    return Math.round((new Date(d).getTime() - Date.now()) / 86400000)
  }
  const asosEmDia = asos.filter(a => { const d = diasParaVencer(a.prox_exame); return d === null || d >= 0 }).length
  const pctAsoEmDia = asos.length > 0 ? Math.round((asosEmDia / asos.length) * 100) : null

  const treinamentosComVencimento = treinamentos.filter(t => t.data_vencimento)
  const treinamentosEmDia = treinamentosComVencimento.filter(t => { const d = diasParaVencer(t.data_vencimento); return d !== null && d >= 0 }).length
  const pctTreinamentoEmDia = treinamentosComVencimento.length > 0 ? Math.round((treinamentosEmDia / treinamentosComVencimento.length) * 100) : null

  const pctEpiComCiencia = episTotal > 0 ? Math.round((episComCiencia / episTotal) * 100) : null

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="indicadores">
      <Head><title>Indicadores SST — eSocial SST</title></Head>

      <div style={{ marginBottom:'1.25rem' }}>
        <div style={s.titulo}>Indicadores SST</div>
        <div style={s.sub}>Taxa de frequência/gravidade e conformidade — calculados a partir dos dados já cadastrados</div>
      </div>

      <div style={s.card}>
        <div style={s.cardTit}>Período de análise</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:10 }}>
          <div>
            <label style={s.label}>Início</label>
            <input style={s.input} type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Fim</label>
            <input style={s.input} type="date" value={fim} onChange={e => setFim(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Horas/dia por funcionário</label>
            <input style={s.input} type="number" value={horasDia} onChange={e => setHorasDia(parseInt(e.target.value) || 8)} />
          </div>
        </div>
        <div style={{ marginTop:10 }}>
          <label style={s.label}>Horas-homem trabalhadas no período (HHT)</label>
          <input style={s.input} type="number" placeholder={`Estimado: ${hhtEstimado.toLocaleString('pt-BR')}`} value={hhtManual} onChange={e => setHhtManual(e.target.value === '' ? '' : parseInt(e.target.value))} />
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>
            Estimado automaticamente ({qtdFuncionarios} func. ativos × {diasNoPeriodo} dias × {horasDia}h) — informe o valor real (folha de ponto) se tiver, para um cálculo mais preciso.
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, margin:'16px 0' }}>
        {[
          { label:'Acidentes c/ afastamento', valor: acidentesComAfastamento, cor:'#E24B4A', bg:'#FCEBEB' },
          { label:'Dias perdidos', valor: diasPerdidos, cor:'#EF9F27', bg:'#FAEEDA' },
          { label:'Óbitos', valor: obitos, cor: obitos > 0 ? '#E24B4A' : '#1D9E75', bg: obitos > 0 ? '#FCEBEB' : '#EAF3DE' },
          { label:'Taxa de Frequência (TF)', valor: tf.toFixed(2), cor:'#185FA5', bg:'#E6F1FB' },
        ].map((k, i) => (
          <div key={i} style={{ background:k.bg, border:`0.5px solid ${k.cor}33`, borderRadius:10, padding:'14px' }}>
            <div style={{ fontSize:22, fontWeight:800, color:k.cor }}>{k.valor}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.cardTit}>Taxa de Gravidade (TG)</div>
        <div style={{ fontSize:28, fontWeight:800, color:'#185FA5', marginTop:8 }}>{tg.toFixed(2)}</div>
        <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>
          TF = (acidentes com afastamento × 1.000.000) / HHT · TG = (dias perdidos × 1.000.000) / HHT — fórmulas padrão de indicadores de segurança do trabalho.
        </div>
      </div>

      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:10 }}>Conformidade (dados atuais, não por período)</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            { label:'ASOs em dia', pct: pctAsoEmDia },
            { label:'Treinamentos em dia', pct: pctTreinamentoEmDia },
            { label:'EPIs com ciência assinada', pct: pctEpiComCiencia },
          ].map((k, i) => (
            <div key={i} style={s.card}>
              <div style={{ fontSize:24, fontWeight:800, color: k.pct === null ? '#9ca3af' : k.pct >= 90 ? '#1D9E75' : k.pct >= 70 ? '#EF9F27' : '#E24B4A' }}>
                {k.pct === null ? '—' : `${k.pct}%`}
              </div>
              <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

const s: Record<string, any> = {
  loading: { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  titulo:  { fontSize:20, fontWeight:700, color:'#111' },
  sub:     { fontSize:12, color:'#6b7280', marginTop:2 },
  card:    { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem' },
  cardTit: { fontSize:13, fontWeight:600, color:'#111' },
  label:   { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 },
  input:   { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
}
