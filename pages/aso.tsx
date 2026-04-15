import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { getEmpresaId } from '../lib/empresa'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TIPO_LABEL: Record<string,string> = {
  admissional:'Admissional', periodico:'Periódico', retorno:'Retorno ao trabalho',
  mudanca:'Mudança de função', demissional:'Demissional', monitoracao:'Monitoração pontual',
}

const CONCL_COR: Record<string,string[]> = {
  apto:           ['#EAF3DE','#27500A'],
  apto_restricao: ['#FAEEDA','#633806'],
  inapto:         ['#FCEBEB','#791F1F'],
}

export default function Aso() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [asos, setAsos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('todos') // todos | validos | vencidos | sem_prox

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/'); return }
    const { data: user } = await supabase.from('usuarios')
      .select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/'); return }
    const empId = getEmpresaId() || user.empresa_id
    setEmpresaId(empId)

    // Busca ASOs com dados do funcionário associado
    const { data } = await supabase
      .from('asos')
      .select('*, funcionarios(id, nome, funcao, setor, matricula_esocial, ativo)')
      .eq('empresa_id', empId)
      .not('funcionario_id', 'is', null)
      .order('data_exame', { ascending: false })

    // Filtra apenas ASOs de funcionários ativos e cadastrados
    const validos = (data || []).filter(a => a.funcionarios?.ativo !== false)
    setAsos(validos)
    setCarregando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este ASO?')) return
    await supabase.from('asos').delete().eq('id', id)
    setAsos(prev => prev.filter(a => a.id !== id))
  }

  function diasParaVencer(d: string | null) {
    if (!d) return null
    return Math.round((new Date(d).getTime() - Date.now()) / 86400000)
  }

  function statusAso(aso: any) {
    const dias = diasParaVencer(aso.prox_exame)
    if (dias === null) return { label:'Sem próximo exame', cor:'#9ca3af', bg:'#f3f4f6' }
    if (dias < 0)      return { label:`Vencido há ${Math.abs(dias)}d`, cor:'#E24B4A', bg:'#FCEBEB' }
    if (dias <= 30)    return { label:`Vence em ${dias}d`, cor:'#EF9F27', bg:'#FAEEDA' }
    if (dias <= 90)    return { label:`Vence em ${dias}d`, cor:'#185FA5', bg:'#E6F1FB' }
    return { label:'Em dia', cor:'#1D9E75', bg:'#EAF3DE' }
  }

  const hoje = new Date()
  const asosFiltrados = asos.filter(a => {
    if (filtro === 'todos')    return true
    const dias = diasParaVencer(a.prox_exame)
    if (filtro === 'validos')  return dias !== null && dias >= 0
    if (filtro === 'vencidos') return dias !== null && dias < 0
    if (filtro === 'sem_prox') return dias === null
    return true
  })

  const totalVencidos = asos.filter(a => { const d = diasParaVencer(a.prox_exame); return d !== null && d < 0 }).length
  const totalVence30  = asos.filter(a => { const d = diasParaVencer(a.prox_exame); return d !== null && d >= 0 && d <= 30 }).length
  const totalEmDia    = asos.filter(a => { const d = diasParaVencer(a.prox_exame); return d !== null && d > 30 }).length

  if (carregando) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' }}>
      Carregando...
    </div>
  )

  return (
    <Layout pagina="aso">
      <Head><title>ASO — eSocial SST</title></Head>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'#111' }}>ASO — Atestados de Saúde Ocupacional</div>
          <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>
            {asos.length} atestado(s) importado(s) · {totalVencidos} vencido(s) · {totalVence30} vencem em 30 dias
          </div>
        </div>
        <button
          onClick={() => router.push('/leitor?tipo=aso')}
          style={{ padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>
          ↑ Importar ASO
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total importados', valor:asos.length, cor:'#185FA5', bg:'#f9fafb' },
          { label:'Em dia', valor:totalEmDia, cor:'#1D9E75', bg:'#EAF3DE' },
          { label:'Vencem em 30 dias', valor:totalVence30, cor:'#EF9F27', bg:'#FAEEDA' },
          { label:'Vencidos', valor:totalVencidos, cor:'#E24B4A', bg:'#FCEBEB' },
        ].map((k,i) => (
          <div key={i} style={{ background:k.bg, border:`0.5px solid ${k.cor}33`, borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:22, fontWeight:800, color:k.cor }}>{k.valor}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[
          { key:'todos',    label:`Todos (${asos.length})` },
          { key:'validos',  label:`Em dia (${totalEmDia + totalVence30})` },
          { key:'vencidos', label:`Vencidos (${totalVencidos})` },
          { key:'sem_prox', label:`Sem próximo exame (${asos.filter(a => diasParaVencer(a.prox_exame) === null).length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            style={{ padding:'5px 12px', fontSize:11, fontWeight:filtro===f.key?600:400, borderRadius:99, border:'0.5px solid', cursor:'pointer',
              borderColor: filtro===f.key ? '#185FA5' : '#e5e7eb',
              background:  filtro===f.key ? '#185FA5' : '#fff',
              color:       filtro===f.key ? '#fff' : '#374151',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de ASOs */}
      {asosFiltrados.length === 0 ? (
        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'3rem', textAlign:'center', color:'#9ca3af' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
          <div style={{ fontSize:14, fontWeight:500, color:'#374151', marginBottom:6 }}>Nenhum ASO encontrado</div>
          <div style={{ fontSize:12, marginBottom:16 }}>Importe atestados de saúde via PDF ou XML</div>
          <button onClick={() => router.push('/leitor?tipo=aso')}
            style={{ padding:'8px 18px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, cursor:'pointer' }}>
            ↑ Importar ASO
          </button>
        </div>
      ) : (
        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#f9fafb', borderBottom:'0.5px solid #e5e7eb' }}>
                {['Funcionário','Cargo / Setor','Tipo ASO','Data exame','Próximo exame','Conclusão','Status',''].map((h,i) => (
                  <th key={i} style={{ padding:'9px 12px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {asosFiltrados.map((aso, i) => {
                const func = aso.funcionarios
                const st   = statusAso(aso)
                const [cBg, cTxt] = CONCL_COR[aso.conclusao] || ['#f3f4f6','#374151']
                const fmtData = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
                return (
                  <tr key={aso.id} style={{ borderBottom:'0.5px solid #f3f4f6', background: i%2===0?'#fff':'#fafafa' }}>
                    <td style={{ padding:'9px 12px', fontWeight:500, color:'#111' }}>
                      {func?.nome || '—'}
                    </td>
                    <td style={{ padding:'9px 12px', color:'#6b7280' }}>
                      <div>{func?.funcao || '—'}</div>
                      {func?.setor && <div style={{ fontSize:11, color:'#9ca3af' }}>{func.setor}</div>}
                    </td>
                    <td style={{ padding:'9px 12px', color:'#374151' }}>
                      {TIPO_LABEL[aso.tipo_aso] || aso.tipo_aso || '—'}
                    </td>
                    <td style={{ padding:'9px 12px', color:'#374151' }}>
                      {fmtData(aso.data_exame)}
                    </td>
                    <td style={{ padding:'9px 12px', color:'#374151' }}>
                      {fmtData(aso.prox_exame)}
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, background:cBg, color:cTxt }}>
                        {aso.conclusao === 'apto' ? 'Apto' : aso.conclusao === 'apto_restricao' ? 'Apto c/ restrição' : 'Inapto'}
                      </span>
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, background:st.bg, color:st.cor }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      <button onClick={() => excluir(aso.id)}
                        style={{ padding:'3px 8px', fontSize:10, border:'0.5px solid #e5e7eb', borderRadius:6, background:'#fff', color:'#E24B4A', cursor:'pointer' }}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
