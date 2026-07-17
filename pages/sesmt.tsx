import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'
import { calcularSesmt } from '../lib/nr4-sesmt'

export default function Sesmt() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [grau, setGrau] = useState<'1' | '2' | '3' | '4'>('3')
  const [nEmpregados, setNEmpregados] = useState<number>(0)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)
    const { count } = await supabase.from('funcionarios').select('id', { count: 'exact', head: true }).eq('empresa_id', empId).eq('ativo', true)
    setNEmpregados(count || 0)
    setCarregando(false)
  }

  const resultado = calcularSesmt(grau, nEmpregados)
  const abaixoDoMinimo = nEmpregados > 0 && !resultado.faixaEncontrada && nEmpregados < 50

  const PROFISSIONAIS = [
    { key: 'tecnico', label: 'Técnico de Segurança do Trabalho', valor: resultado.tecnico },
    { key: 'engenheiro', label: 'Engenheiro de Segurança do Trabalho', valor: resultado.engenheiro },
    { key: 'auxEnfermagem', label: 'Auxiliar/Técnico de Enfermagem do Trabalho', valor: resultado.auxEnfermagem },
    { key: 'enfermeiro', label: 'Enfermeiro do Trabalho', valor: resultado.enfermeiro },
    { key: 'medico', label: 'Médico do Trabalho', valor: resultado.medico },
  ]

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="sesmt">
      <Head><title>Dimensionamento SESMT — eSocial SST</title></Head>

      <div style={{ marginBottom:'1.25rem' }}>
        <div style={s.titulo}>Dimensionamento do SESMT</div>
        <div style={s.sub}>Estimativa com base na NR-4, Quadro II</div>
      </div>

      <div style={{ background:'#FAEEDA', border:'0.5px solid #EF9F27', borderRadius:10, padding:'12px 16px', fontSize:12, color:'#633806', marginBottom:16 }}>
        ⚠ <strong>Isto é uma estimativa de planejamento</strong>, não um documento oficial. O dimensionamento
        exato do SESMT deve ser confirmado por um engenheiro ou técnico de segurança do trabalho habilitado,
        considerando o CNAE, o grau de risco (Quadro I da NR-4) e as particularidades da empresa.
      </div>

      <div style={s.card}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
          <div>
            <label style={s.label}>Grau de risco da atividade (CNAE, Quadro I da NR-4)</label>
            <select style={s.input} value={grau} onChange={e => setGrau(e.target.value as any)}>
              <option value="1">1 — Risco leve</option>
              <option value="2">2 — Risco leve/moderado</option>
              <option value="3">3 — Risco moderado/alto</option>
              <option value="4">4 — Risco alto</option>
            </select>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>Geralmente já consta no seu PGR/LTCAT.</div>
          </div>
          <div>
            <label style={s.label}>Número de empregados</label>
            <input style={s.input} type="number" min={0} value={nEmpregados} onChange={e => setNEmpregados(parseInt(e.target.value) || 0)} />
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>Preenchido com os funcionários ativos cadastrados — pode ajustar.</div>
          </div>
        </div>

        {nEmpregados <= 0 ? (
          <div style={{ fontSize:12, color:'#9ca3af', textAlign:'center', padding:'1.5rem' }}>Informe o número de empregados para calcular.</div>
        ) : abaixoDoMinimo ? (
          <div style={{ background:'#E6F1FB', border:'0.5px solid #B5D4F4', borderRadius:8, padding:'12px 16px', fontSize:12, color:'#0C447C' }}>
            Com {nEmpregados} empregado(s) e grau de risco {grau}, a empresa está abaixo do piso da tabela de
            dimensionamento do SESMT — não há exigência de equipe dimensionada, mas a empresa ainda precisa
            designar um responsável por segurança do trabalho e manter PGR/PCMSO em dia.
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
            {PROFISSIONAIS.map(p => (
              <div key={p.key} style={{ background: p.valor > 0 ? '#EAF3DE' : '#f9fafb', border:'0.5px solid #e5e7eb', borderRadius:10, padding:'12px 10px', textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, color: p.valor > 0 ? '#1D9E75' : '#9ca3af' }}>{p.valor}</div>
                <div style={{ fontSize:10, color:'#6b7280', marginTop:4 }}>{p.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

const s: Record<string, any> = {
  loading: { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  titulo:  { fontSize:20, fontWeight:700, color:'#111' },
  sub:     { fontSize:12, color:'#6b7280', marginTop:2 },
  card:    { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem' },
  label:   { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 },
  input:   { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
}
