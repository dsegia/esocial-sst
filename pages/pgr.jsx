import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { gerarPdfPgr } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'
import { SEVERIDADE_OPCOES, PROBABILIDADE_OPCOES, TRAJETORIA_OPCOES, TIPO_EXPOSICAO_OPCOES, PRIORIZACAO_OPCOES, nivelRisco } from '../lib/pgr-conteudo'
import { ESOCIAL_TABELA24 } from '../lib/esocial-tabela24'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TIPO_AGENTE = { fis:'Físico', qui:'Químico', bio:'Biológico', erg:'Ergonômico', aci:'Mecânico/Acidentes' }
const COR_AGENTE  = { fis:'#E6F1FB', qui:'#FAEEDA', bio:'#EAF3DE', erg:'#FCEBEB', aci:'#EDE9FE' }
const TXT_AGENTE  = { fis:'#0C447C', qui:'#633806', bio:'#27500A', erg:'#791F1F', aci:'#5B21B6' }

const STATUS_ACAO = [
  { key:'pendente',    label:'Pendente',    cor:'#791F1F', bg:'#FCEBEB' },
  { key:'andamento',   label:'Em andamento',cor:'#633806', bg:'#FAEEDA' },
  { key:'concluida',   label:'Concluída',   cor:'#27500A', bg:'#EAF3DE' },
]

function inventarioDoLtcat(ltcat) {
  if (!ltcat?.ghes) return []
  const vistos = new Set()
  const lista = []
  for (const ghe of ltcat.ghes) {
    for (const ag of (ghe.agentes || [])) {
      const chave = `${ghe.nome}__${ag.nome}`
      if (vistos.has(chave)) continue
      vistos.add(chave)
      lista.push({
        ghe: ghe.nome || '—', funcao: '', tipo: ag.tipo, nome: ag.nome,
        perigo: '', fontes_circunstancias: '', codigo_esocial: '', possiveis_danos: '',
        severidade: '', probabilidade: '',
        valor: ag.valor || '', unidade: ag.unidade || '', limite: ag.limite || '',
        equipamento: '', trajetoria: '', tipo_exposicao: '',
      })
    }
  }
  return lista
}

function ambientesDoLtcat(ltcat) {
  if (!ltcat?.ghes) return []
  return ltcat.ghes.map(ghe => ({
    nome: ghe.nome || ghe.setor || 'Ambiente',
    descricao: '', tipo: 'proprio', data_inicio: '',
    epcs: (ghe.epc || []).map(e => ({ nome: e.nome || '' })),
  }))
}

const riscoVazio = () => ({
  ghe: 'Manual', funcao: '', tipo: 'fis', nome: '',
  perigo: '', fontes_circunstancias: '', codigo_esocial: '', possiveis_danos: '',
  severidade: '', probabilidade: '',
  valor: '', unidade: '', limite: '', equipamento: '', trajetoria: '', tipo_exposicao: '',
})

const ambienteVazio = () => ({ nome: '', descricao: '', tipo: 'proprio', data_inicio: '', epcs: [] })

const acaoVazia = (risco = '') => ({
  risco, medida_controle: '', justificativa: '', como: '', onde: 'Ambiente da empresa',
  prazo: '', responsavel: '', priorizacao: 'media', epis: [], status: 'pendente',
})

export default function PGR() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [empresaCompleta, setEmpresaCompleta] = useState(null)
  const [totalFuncionarios, setTotalFuncionarios] = useState(0)
  const [ltcatAtivo, setLtcatAtivo] = useState(null)
  const [pgrs, setPgrs] = useState([])
  const [pgrSel, setPgrSel] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('documento')
  const [form, setForm] = useState(null)
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

    const [empRes, funcCountRes, ltcatRes, pgrRes] = await Promise.all([
      supabase.from('empresas').select('*').eq('id', empId).single(),
      supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('empresa_id', empId).eq('ativo', true),
      supabase.from('ltcats').select('*').eq('empresa_id', empId).eq('ativo', true).order('data_emissao', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('pgr').select('*').eq('empresa_id', empId).order('criado_em', { ascending: false }),
    ])
    if (empRes.data) {
      setNomeEmpresa(empRes.data.razao_social)
      setCnpjEmpresa(empRes.data.cnpj)
      setEmpresaCompleta(empRes.data)
    }
    setTotalFuncionarios(funcCountRes.count || 0)
    setLtcatAtivo(ltcatRes.data || null)
    setPgrs(pgrRes.data || [])
    setPgrSel(pgrRes.data?.[0] || null)
    setCarregando(false)
  }

  function abrirNovo() {
    const inventario = inventarioDoLtcat(ltcatAtivo)
    const ambientes = ambientesDoLtcat(ltcatAtivo)
    setForm({
      data_elaboracao: new Date().toISOString().split('T')[0],
      prox_revisao: '',
      resp_nome: ltcatAtivo?.resp_nome || '',
      resp_conselho: ltcatAtivo?.resp_conselho || 'CREA',
      resp_registro: ltcatAtivo?.resp_registro || '',
      ambientes,
      inventario,
      plano_acao: [...new Set(inventario.map(i => i.nome))].map(acaoVazia),
    })
    setAba('editar')
    setSucesso(''); setErro('')
  }

  function abrirEdicao(pgr) {
    setForm(JSON.parse(JSON.stringify(pgr)))
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
    setSalvando(true); setErro(''); setSucesso('')

    const dados = {
      empresa_id: empresaId,
      data_elaboracao: form.data_elaboracao,
      prox_revisao: form.prox_revisao || null,
      resp_nome: form.resp_nome,
      resp_conselho: form.resp_conselho || 'CREA',
      resp_registro: form.resp_registro || null,
      ambientes: form.ambientes || [],
      inventario: form.inventario || [],
      plano_acao: form.plano_acao || [],
      atualizado_em: new Date().toISOString(),
    }

    let error
    if (form.id) {
      ;({ error } = await supabase.from('pgr').update(dados).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('pgr').insert(dados))
    }

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso('PGR salvo com sucesso!')
      setForm(null)
      setAba('documento')
      await init()
    }
    setSalvando(false)
  }

  async function arquivar(id) {
    if (!confirm('Arquivar este PGR?')) return
    await supabase.from('pgr').update({ ativo: false }).eq('id', id)
    init()
  }

  async function excluir(id) {
    if (!confirm('EXCLUIR este PGR permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('pgr').delete().eq('id', id)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setPgrSel(null)
    init()
  }

  // ── Ambientes ──────────────────────────────────────────
  function addAmbiente() {
    setForm(p => ({ ...p, ambientes: [...(p.ambientes || []), ambienteVazio()] }))
  }
  function setAmbiente(i, field, value) {
    setForm(p => {
      const ambientes = [...p.ambientes]
      ambientes[i] = { ...ambientes[i], [field]: value }
      return { ...p, ambientes }
    })
  }
  function removerAmbiente(i) {
    setForm(p => ({ ...p, ambientes: p.ambientes.filter((_, idx) => idx !== i) }))
  }
  function addEpcAmbiente(ai) {
    setForm(p => {
      const ambientes = JSON.parse(JSON.stringify(p.ambientes))
      ambientes[ai].epcs = [...(ambientes[ai].epcs || []), { nome: '' }]
      return { ...p, ambientes }
    })
  }
  function setEpcAmbiente(ai, ei, value) {
    setForm(p => {
      const ambientes = JSON.parse(JSON.stringify(p.ambientes))
      ambientes[ai].epcs[ei] = { nome: value }
      return { ...p, ambientes }
    })
  }
  function removerEpcAmbiente(ai, ei) {
    setForm(p => {
      const ambientes = JSON.parse(JSON.stringify(p.ambientes))
      ambientes[ai].epcs = ambientes[ai].epcs.filter((_, idx) => idx !== ei)
      return { ...p, ambientes }
    })
  }

  // ── Inventário de riscos ──────────────────────────────
  function addRiscoManual() {
    setForm(p => ({ ...p, inventario: [...(p.inventario || []), riscoVazio()] }))
  }
  function setRisco(i, field, value) {
    setForm(p => {
      const inventario = [...p.inventario]
      inventario[i] = { ...inventario[i], [field]: value }
      return { ...p, inventario }
    })
  }
  function removerRisco(i) {
    setForm(p => ({ ...p, inventario: p.inventario.filter((_, idx) => idx !== i) }))
  }

  // ── Plano de ação ──────────────────────────────────────
  function addAcao() {
    setForm(p => ({ ...p, plano_acao: [...(p.plano_acao || []), acaoVazia()] }))
  }
  function setAcao(i, field, value) {
    setForm(p => {
      const plano_acao = [...p.plano_acao]
      plano_acao[i] = { ...plano_acao[i], [field]: value }
      return { ...p, plano_acao }
    })
  }
  function removerAcao(i) {
    setForm(p => ({ ...p, plano_acao: p.plano_acao.filter((_, idx) => idx !== i) }))
  }
  function addEpiAcao(ai) {
    setForm(p => {
      const plano_acao = JSON.parse(JSON.stringify(p.plano_acao))
      plano_acao[ai].epis = [...(plano_acao[ai].epis || []), { nome: '', ca: '', eficaz: true }]
      return { ...p, plano_acao }
    })
  }
  function setEpiAcao(ai, ei, field, value) {
    setForm(p => {
      const plano_acao = JSON.parse(JSON.stringify(p.plano_acao))
      plano_acao[ai].epis[ei][field] = value
      return { ...p, plano_acao }
    })
  }
  function removerEpiAcao(ai, ei) {
    setForm(p => {
      const plano_acao = JSON.parse(JSON.stringify(p.plano_acao))
      plano_acao[ai].epis = plano_acao[ai].epis.filter((_, idx) => idx !== ei)
      return { ...p, plano_acao }
    })
  }

  function exportarPdf(pgr) {
    gerarPdfPgr(
      {
        dados_gerais: {
          data_elaboracao: pgr.data_elaboracao,
          prox_revisao: pgr.prox_revisao,
          resp_nome: pgr.resp_nome,
          resp_conselho: pgr.resp_conselho,
          resp_registro: pgr.resp_registro,
        },
        ambientes: pgr.ambientes || [],
        inventario: pgr.inventario || [],
        plano_acao: pgr.plano_acao || [],
      },
      { ...(empresaCompleta || {}), razao_social: nomeEmpresa, cnpj: cnpjEmpresa, numero_empregados: totalFuncionarios }
    )
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  const acoesPendentes = (pgrSel?.plano_acao || []).filter(a => a.status !== 'concluida').length
  const maiorRisco = (pgrSel?.inventario || []).reduce((max, r) => {
    const n = nivelRisco(r.severidade, r.probabilidade)
    return n && (!max || n.valor > max.valor) ? n : max
  }, null)

  return (
    <Layout pagina="pgr">
      <Head><title>PGR — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>PGR</div>
          <div style={s.sub}>Programa de Gerenciamento de Riscos · NR-1</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {pgrSel && (
            <button style={s.btnOutline} onClick={() => exportarPdf(pgrSel)}>📄 Exportar PDF</button>
          )}
          <button style={s.btnPrimary} onClick={abrirNovo}>+ Novo PGR</button>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && aba !== 'editar' && <div style={s.erroBox}>{erro}</div>}

      {!ltcatAtivo && (
        <div style={{ ...s.card, background:'#FAEEDA', border:'0.5px solid #F3D9A4' }}>
          <div style={{ fontSize:13, color:'#633806' }}>
            Nenhum LTCAT vigente encontrado. O inventário de riscos e os ambientes podem ser cadastrados manualmente, mas recomendamos cadastrar o LTCAT primeiro para herdar os agentes de risco automaticamente.
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:'1.25rem' }}>
        {[
          { n: pgrSel ? 'Vigente' : 'Ausente', l:'PGR', c: pgrSel ? '#1D9E75' : '#E24B4A' },
          { n: pgrSel?.inventario?.length || 0, l:'Riscos no inventário', c:'#185FA5' },
          { n: maiorRisco?.faixa || '—', l:'Maior nível de risco', c: maiorRisco?.cor || '#6b7280' },
          { n: pgrSel?.plano_acao?.length || 0, l:'Ações no plano', c:'#185FA5' },
          { n: acoesPendentes, l:'Ações pendentes', c: acoesPendentes > 0 ? '#E24B4A' : '#1D9E75' },
        ].map((k,i) => (
          <div key={i} style={s.kpiCard}>
            <div style={{ fontSize:20, fontWeight:700, color:k.c }}>{k.n}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {aba === 'documento' && (
        <div>
          {!pgrSel ? (
            <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:14, color:'#374151', marginBottom:8 }}>Nenhum PGR cadastrado</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>
                Monte os ambientes de trabalho, o inventário de riscos e o plano de ação da empresa
              </div>
              <button style={s.btnPrimary} onClick={abrirNovo}>+ Criar primeiro PGR</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={s.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={s.cardTit}>Dados gerais</div>
                  <div style={{ display:'flex', gap:5 }}>
                    <button style={s.btnAcao} onClick={() => abrirEdicao(pgrSel)}>Editar</button>
                    <button style={s.btnAcao} onClick={() => arquivar(pgrSel.id)}>Arquivar</button>
                    <button style={{ ...s.btnAcao, color:'#E24B4A', borderColor:'#F09595' }} onClick={() => excluir(pgrSel.id)}>Excluir</button>
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <div style={s.secLabel}>Elaboração</div>
                    <div style={{ fontSize:13 }}>{pgrSel.data_elaboracao ? new Date(pgrSel.data_elaboracao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                  <div>
                    <div style={s.secLabel}>Próxima revisão</div>
                    <div style={{ fontSize:13 }}>{pgrSel.prox_revisao ? new Date(pgrSel.prox_revisao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <div style={s.secLabel}>Responsável técnico</div>
                    <div style={{ fontSize:13 }}>{pgrSel.resp_nome || '—'}</div>
                  </div>
                  <div>
                    <div style={s.secLabel}>{pgrSel.resp_conselho || 'CREA'}</div>
                    <div style={{ fontSize:13 }}>{pgrSel.resp_registro || '—'}</div>
                  </div>
                </div>
              </div>

              <div style={s.card}>
                <div style={s.cardTit}>Ambientes de trabalho ({pgrSel.ambientes?.length || 0})</div>
                {pgrSel.ambientes?.length ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                    {pgrSel.ambientes.map((a,i) => (
                      <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{a.nome}</div>
                          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:99, background:'#f3f4f6', color:'#6b7280' }}>
                            {a.tipo === 'terceiro' ? 'Terceiro' : 'Próprio'}{a.data_inicio ? ` · desde ${new Date(a.data_inicio+'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                          </span>
                        </div>
                        {a.descricao && <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>{a.descricao}</div>}
                        {a.epcs?.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
                            {a.epcs.map((e,ei) => (
                              <span key={ei} style={{ padding:'2px 8px', borderRadius:99, fontSize:10, background:'#E6F1FB', color:'#0C447C' }}>{e.nome}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhum ambiente cadastrado.</div>}
              </div>

              <div style={s.card}>
                <div style={s.cardTit}>Inventário de riscos ({pgrSel.inventario?.length || 0})</div>
                {pgrSel.inventario?.length ? (
                  <div style={{ overflowX:'auto', marginTop:10 }}>
                    <table style={s.table}>
                      <thead>
                        <tr style={{ background:'#f9fafb' }}>
                          {['Tipo','Perigo / Risco','Função','Ambiente','Nível de risco','Medição','Exposição'].map(h => <th key={h} style={s.th}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {pgrSel.inventario.map((r,i) => {
                          const nr = nivelRisco(r.severidade, r.probabilidade)
                          return (
                            <tr key={i} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                              <td style={s.td}>
                                <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, background:COR_AGENTE[r.tipo]||'#f3f4f6', color:TXT_AGENTE[r.tipo]||'#374151' }}>
                                  {TIPO_AGENTE[r.tipo] || r.tipo}
                                </span>
                              </td>
                              <td style={s.td}>
                                <div style={{ fontWeight:500 }}>{r.nome || '—'}</div>
                                {r.perigo && <div style={{ fontSize:11, color:'#9ca3af' }}>{r.perigo}</div>}
                              </td>
                              <td style={s.td}>{r.funcao || '—'}</td>
                              <td style={{ ...s.td, fontSize:11, color:'#9ca3af' }}>{r.ghe}</td>
                              <td style={s.td}>
                                {nr ? (
                                  <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:nr.bg, color:nr.cor }}>
                                    {nr.faixa} ({nr.valor})
                                  </span>
                                ) : <span style={{ fontSize:11, color:'#d1d5db' }}>—</span>}
                              </td>
                              <td style={s.td}>{r.valor ? `${r.valor}${r.unidade ? ` ${r.unidade}` : ''}${r.limite ? ` / LT ${r.limite}` : ''}` : '—'}</td>
                              <td style={{ ...s.td, fontSize:11 }}>{r.tipo_exposicao || '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhum risco cadastrado.</div>}
              </div>

              <div style={s.card}>
                <div style={s.cardTit}>Plano de ação ({pgrSel.plano_acao?.length || 0})</div>
                {pgrSel.plano_acao?.length ? (
                  <div style={{ overflowX:'auto', marginTop:10 }}>
                    <table style={s.table}>
                      <thead>
                        <tr style={{ background:'#f9fafb' }}>
                          {['Prior.','Risco','O que','Quem','Como','Onde','Quando','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {pgrSel.plano_acao.map((a,i) => {
                          const st = STATUS_ACAO.find(x => x.key === a.status) || STATUS_ACAO[0]
                          const pr = PRIORIZACAO_OPCOES.find(x => x.v === a.priorizacao)
                          return (
                            <tr key={i} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                              <td style={s.td}>
                                {pr && <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:pr.bg, color:pr.cor }}>{pr.l}</span>}
                              </td>
                              <td style={s.td}>{a.risco || '—'}</td>
                              <td style={s.td}>{a.medida_controle || '—'}</td>
                              <td style={s.td}>{a.responsavel || '—'}</td>
                              <td style={s.td}>{a.como || '—'}</td>
                              <td style={s.td}>{a.onde || '—'}</td>
                              <td style={s.td}>{a.prazo ? new Date(a.prazo+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                              <td style={s.td}>
                                <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:st.bg, color:st.cor }}>{st.label}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhuma ação cadastrada.</div>}
              </div>

              {pgrs.length > 1 && (
                <div style={s.card}>
                  <div style={s.cardTit}>Histórico</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                    {pgrs.map(p => (
                      <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'0.5px solid #f3f4f6' }}>
                        <span style={{ fontSize:12, color: p.ativo ? '#111' : '#9ca3af' }}>
                          {p.data_elaboracao ? new Date(p.data_elaboracao+'T12:00:00').toLocaleDateString('pt-BR') : '—'} {!p.ativo && '(arquivado)'}
                        </span>
                        <button style={{ ...s.btnAcao, fontSize:10 }} onClick={() => setPgrSel(p)}>Ver</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {aba === 'editar' && form && (
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={s.cardTit}>{form.id ? 'Editar PGR' : 'Novo PGR'}</div>
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

          {/* ── Ambientes de trabalho ── */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>Ambientes de trabalho ({form.ambientes?.length || 0})</label>
              <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addAmbiente}>+ Adicionar ambiente</button>
            </div>
            {(form.ambientes || []).map((a, ai) => (
              <div key={ai} style={s.blocoItem}>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <button onClick={() => removerAmbiente(ai)} style={s.btnRemover}>×</button>
                </div>
                <div style={s.row2}>
                  <input style={s.input} placeholder="Nome do ambiente (ex: Almoxarifado)" value={a.nome} onChange={e => setAmbiente(ai, 'nome', e.target.value)} />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <select style={s.input} value={a.tipo} onChange={e => setAmbiente(ai, 'tipo', e.target.value)}>
                      <option value="proprio">Próprio</option>
                      <option value="terceiro">Terceiro</option>
                    </select>
                    <input type="date" style={s.input} value={a.data_inicio || ''} onChange={e => setAmbiente(ai, 'data_inicio', e.target.value)} />
                  </div>
                </div>
                <textarea style={{ ...s.input, minHeight:50, marginBottom:10 }} placeholder="Descrição do ambiente (ventilação, piso, pé-direito, etc.)"
                  value={a.descricao} onChange={e => setAmbiente(ai, 'descricao', e.target.value)} />
                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginBottom:4 }}>EQUIPAMENTOS DE PROTEÇÃO COLETIVA (EPC)</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                  {(a.epcs || []).map((e,ei) => (
                    <span key={ei} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:99, fontSize:11, background:'#E6F1FB', color:'#0C447C' }}>
                      <input style={{ border:'none', background:'transparent', fontSize:11, color:'#0C447C', width:120 }} value={e.nome} onChange={ev => setEpcAmbiente(ai, ei, ev.target.value)} placeholder="Nome do EPC" />
                      <button onClick={() => removerEpcAmbiente(ai, ei)} style={{ background:'none', border:'none', cursor:'pointer', color:'#0C447C' }}>×</button>
                    </span>
                  ))}
                  <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => addEpcAmbiente(ai)}>+ EPC</button>
                </div>
              </div>
            ))}
            {!(form.ambientes || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum ambiente cadastrado.</div>}
          </div>

          {/* ── Inventário de riscos ── */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>Inventário de riscos ({form.inventario?.length || 0})</label>
              <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addRiscoManual}>+ Adicionar risco</button>
            </div>
            {(form.inventario || []).map((r, i) => {
              const nr = nivelRisco(r.severidade, r.probabilidade)
              return (
                <div key={i} style={s.blocoItem}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:10, color:'#9ca3af' }}>{r.ghe}</span>
                    <button onClick={() => removerRisco(i)} style={s.btnRemover}>×</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 1fr 1fr', gap:6, marginBottom:8 }}>
                    <select style={s.inputSm} value={r.tipo} onChange={e => setRisco(i, 'tipo', e.target.value)}>
                      {Object.entries(TIPO_AGENTE).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                    <input style={s.inputSm} placeholder="Agente / risco (ex: Ruído)" value={r.nome} onChange={e => setRisco(i, 'nome', e.target.value)} />
                    <input style={s.inputSm} placeholder="Perigo (ex: Intensidade)" value={r.perigo} onChange={e => setRisco(i, 'perigo', e.target.value)} />
                    <input style={s.inputSm} placeholder="Função / cargo" value={r.funcao} onChange={e => setRisco(i, 'funcao', e.target.value)} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:6, marginBottom:8 }}>
                    <input style={s.inputSm} placeholder="Fontes / circunstâncias" value={r.fontes_circunstancias} onChange={e => setRisco(i, 'fontes_circunstancias', e.target.value)} />
                    <input style={s.inputSm} placeholder="Código eSocial" list="lista-codigo-esocial" value={r.codigo_esocial} onChange={e => setRisco(i, 'codigo_esocial', e.target.value)} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, alignItems:'center', marginBottom:8 }}>
                    <select style={s.inputSm} value={r.severidade} onChange={e => setRisco(i, 'severidade', e.target.value ? parseInt(e.target.value,10) : '')}>
                      <option value="">Severidade</option>
                      {SEVERIDADE_OPCOES.map(o => <option key={o.v} value={o.v}>{o.l} ({o.v})</option>)}
                    </select>
                    <select style={s.inputSm} value={r.probabilidade} onChange={e => setRisco(i, 'probabilidade', e.target.value ? parseInt(e.target.value,10) : '')}>
                      <option value="">Probabilidade</option>
                      {PROBABILIDADE_OPCOES.map(o => <option key={o.v} value={o.v}>{o.l} ({o.v})</option>)}
                    </select>
                    {nr ? (
                      <span style={{ textAlign:'center', padding:'6px 10px', borderRadius:8, fontSize:12, fontWeight:600, background:nr.bg, color:nr.cor }}>
                        {nr.faixa} ({nr.valor})
                      </span>
                    ) : <span style={{ textAlign:'center', fontSize:11, color:'#9ca3af' }}>Nível de risco</span>}
                  </div>
                  <input style={{ ...s.inputSm, marginBottom:8 }} placeholder="Possíveis danos à saúde" value={r.possiveis_danos} onChange={e => setRisco(i, 'possiveis_danos', e.target.value)} />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6, marginBottom:8 }}>
                    <input style={s.inputSm} placeholder="Valor medido" value={r.valor} onChange={e => setRisco(i, 'valor', e.target.value)} />
                    <input style={s.inputSm} placeholder="Medida" list="unidades-medida-pgr" value={r.unidade} onChange={e => setRisco(i, 'unidade', e.target.value)} />
                    <input style={s.inputSm} placeholder="Limite de tolerância" value={r.limite} onChange={e => setRisco(i, 'limite', e.target.value)} />
                    <input style={s.inputSm} placeholder="Equipamento de medição" value={r.equipamento} onChange={e => setRisco(i, 'equipamento', e.target.value)} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <select style={s.inputSm} value={r.trajetoria} onChange={e => setRisco(i, 'trajetoria', e.target.value)}>
                      <option value="">Trajetória</option>
                      {TRAJETORIA_OPCOES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select style={s.inputSm} value={r.tipo_exposicao} onChange={e => setRisco(i, 'tipo_exposicao', e.target.value)}>
                      <option value="">Tipo de exposição</option>
                      {TIPO_EXPOSICAO_OPCOES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )
            })}
            {!(form.inventario || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhum risco. Cadastre um LTCAT vigente ou adicione manualmente.</div>}
            <datalist id="lista-codigo-esocial">
              {ESOCIAL_TABELA24.map(a => <option key={a.codigo} value={a.codigo}>{a.nome}</option>)}
            </datalist>
            <datalist id="unidades-medida-pgr">
              <option value="dB(A)" /><option value="ppm" /><option value="mg/m³" /><option value="µg/m³" />
              <option value="fibras/cm³" /><option value="IBUTG °C" /><option value="lux" /><option value="m/s²" /><option value="%" />
            </datalist>
          </div>

          {/* ── Plano de ação ── */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={s.label}>Plano de ação ({form.plano_acao?.length || 0})</label>
              <button style={{ ...s.btnAcao, fontSize:11 }} onClick={addAcao}>+ Adicionar ação</button>
            </div>
            {(form.plano_acao || []).map((a, i) => (
              <div key={i} style={s.blocoItem}>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <button onClick={() => removerAcao(i)} style={s.btnRemover}>×</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:6, marginBottom:8 }}>
                  <input style={s.inputSm} placeholder="Risco" value={a.risco} onChange={e => setAcao(i, 'risco', e.target.value)} />
                  <input style={s.inputSm} placeholder="Responsável (quem)" value={a.responsavel} onChange={e => setAcao(i, 'responsavel', e.target.value)} />
                  <select style={s.inputSm} value={a.status} onChange={e => setAcao(i, 'status', e.target.value)}>
                    {STATUS_ACAO.map(st => <option key={st.key} value={st.key}>{st.label}</option>)}
                  </select>
                </div>
                <textarea style={{ ...s.inputSm, minHeight:40, marginBottom:8 }} placeholder="O que — medida de controle/prevenção" value={a.medida_controle} onChange={e => setAcao(i, 'medida_controle', e.target.value)} />
                <textarea style={{ ...s.inputSm, minHeight:40, marginBottom:8 }} placeholder="Por que — justificativa da ação" value={a.justificativa} onChange={e => setAcao(i, 'justificativa', e.target.value)} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6, marginBottom:8 }}>
                  <input style={s.inputSm} placeholder="Como" value={a.como} onChange={e => setAcao(i, 'como', e.target.value)} />
                  <input style={s.inputSm} placeholder="Onde" value={a.onde} onChange={e => setAcao(i, 'onde', e.target.value)} />
                  <input type="date" style={s.inputSm} value={a.prazo || ''} onChange={e => setAcao(i, 'prazo', e.target.value)} />
                  <select style={s.inputSm} value={a.priorizacao} onChange={e => setAcao(i, 'priorizacao', e.target.value)}>
                    {PRIORIZACAO_OPCOES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                  </select>
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginBottom:4 }}>EPIS APLICÁVEIS</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {(a.epis || []).map((e,ei) => (
                    <span key={ei} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:99, fontSize:11, background:'#EAF3DE' }}>
                      <input style={{ border:'none', background:'transparent', fontSize:11, color:'#27500A', width:100 }} placeholder="EPI" value={e.nome} onChange={ev => setEpiAcao(i, ei, 'nome', ev.target.value)} />
                      <input style={{ border:'none', background:'transparent', fontSize:11, color:'#27500A', width:60 }} placeholder="CA" value={e.ca} onChange={ev => setEpiAcao(i, ei, 'ca', ev.target.value)} />
                      <button onClick={() => removerEpiAcao(i, ei)} style={{ background:'none', border:'none', cursor:'pointer', color:'#27500A' }}>×</button>
                    </span>
                  ))}
                  <button style={{ ...s.btnAcao, fontSize:11 }} onClick={() => addEpiAcao(i)}>+ EPI</button>
                </div>
              </div>
            ))}
            {!(form.plano_acao || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhuma ação cadastrada.</div>}
          </div>

          {erro && <div style={s.erroBox}>{erro}</div>}

          <div style={{ display:'flex', gap:8 }}>
            <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar PGR'}</button>
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
  kpiCard:    { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'0.85rem' },
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' },
  cardTit:    { fontSize:13, fontWeight:600, color:'#111' },
  secLabel:   { fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 },
  row2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 },
  label:      { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 },
  input:      { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  inputSm:    { width:'100%', padding:'5px 8px', fontSize:12, border:'1px solid #d1d5db', borderRadius:6, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:720 },
  th:         { padding:'8px 10px', textAlign:'left', fontSize:10, fontWeight:600, color:'#6b7280', borderBottom:'0.5px solid #e5e7eb', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' },
  td:         { padding:'8px 10px', verticalAlign:'top', color:'#374151' },
  btnAcao:    { padding:'3px 10px', fontSize:11, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151' },
  btnRemover: { background:'none', border:'none', color:'#E24B4A', cursor:'pointer', fontSize:16 },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  blocoItem:  { border:'0.5px solid #e5e7eb', borderRadius:8, padding:12, marginBottom:8, background:'#fafbfc' },
}
