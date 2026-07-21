import { useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'

const DOCUMENTOS = [
  { key:'pgr',   href:'/pgr',   nome:'PGR',   descricao:'Programa de Gerenciamento de Riscos · NR-1',                table:'pgr' },
  { key:'ltcat', href:'/ltcat', nome:'LTCAT', descricao:'Laudo Técnico das Condições Ambientais do Trabalho',        table:'ltcats' },
  { key:'pcmso', href:'/pcmso', nome:'PCMSO', descricao:'Programa de Controle Médico de Saúde Ocupacional · NR-7',  table:'pcmso_programa' },
  { key:'aso',   href:'/aso',   nome:'ASO',   descricao:'Atestado de Saúde Ocupacional',                            table:'asos' },
  { key:'aet',   href:'/aet',   nome:'AET',   descricao:'Análise Ergonômica do Trabalho · NR-17',                   table:'aet' },
  { key:'apr',   href:'/apr',   nome:'APR',   descricao:'Análise Preliminar de Risco',                              table:'apr' },
  { key:'lip',   href:'/lip',   nome:'LIP',   descricao:'Laudo de Insalubridade e Periculosidade · NR-15/16',       table:'lip' },
  { key:'ppp',   href:'/ppp',   nome:'PPP',   descricao:'Perfil Profissiográfico Previdenciário',                   table:'ppp' },
  { key:'aep',   href:'/aep',   nome:'AEP',   descricao:'Atestado de Exposição a Agentes Nocivos',                  table:'aep' },
  { key:'dir',   href:'/dir',   nome:'DIR',   descricao:'Declaração de Inexistência de Risco',                      table:'dir' },
]

export default function Documentos() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [contagens, setContagens] = useState<Record<string, number>>({})
  const [busca, setBusca] = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)

    const resultados = await Promise.all(
      DOCUMENTOS.map(d => supabase.from(d.table).select('id', { count: 'exact', head: true }).eq('empresa_id', empId))
    )
    const mapa: Record<string, number> = {}
    resultados.forEach((r, i) => { mapa[DOCUMENTOS[i].key] = r.count || 0 })
    setContagens(mapa)
    setCarregando(false)
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  const filtrados = DOCUMENTOS.filter(d =>
    d.nome.toLowerCase().includes(busca.toLowerCase()) || d.descricao.toLowerCase().includes(busca.toLowerCase())
  )
  const totalCadastrados = DOCUMENTOS.filter(d => (contagens[d.key] || 0) > 0).length

  return (
    <Layout pagina="documentos">
      <Head><title>Todos os Documentos — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>Todos os Documentos</div>
          <div style={s.sub}>{totalCadastrados} de {DOCUMENTOS.length} tipos de documento com pelo menos um registro</div>
        </div>
      </div>

      <input style={{ ...s.input, marginBottom:16, maxWidth:320 }} placeholder="Buscar documento..." value={busca} onChange={e => setBusca(e.target.value)} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px, 1fr))', gap:12 }}>
        {filtrados.map(d => {
          const qtd = contagens[d.key] || 0
          return (
            <div key={d.key} style={s.card} onClick={() => router.push(d.href)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#111' }}>{d.nome}</div>
                <span style={{ ...s.badge, background: qtd > 0 ? '#EAF3DE' : '#f3f4f6', color: qtd > 0 ? '#27500A' : '#9ca3af' }}>
                  {qtd > 0 ? `${qtd} registro${qtd > 1 ? 's' : ''}` : 'vazio'}
                </span>
              </div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:6, lineHeight:1.4 }}>{d.descricao}</div>
            </div>
          )
        })}
        {!filtrados.length && <div style={{ fontSize:12, color:'#9ca3af', gridColumn:'1/-1', textAlign:'center', padding:'2rem' }}>Nenhum documento encontrado.</div>}
      </div>
    </Layout>
  )
}

const s: Record<string, CSSProperties> = {
  loading:  { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  header:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:   { fontSize:20, fontWeight:700, color:'#111' },
  sub:      { fontSize:12, color:'#6b7280', marginTop:2 },
  input:    { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  card:     { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1rem', cursor:'pointer' },
  badge:    { padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, whiteSpace:'nowrap', flexShrink:0 },
}
