import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { gerarPdfLip } from '../lib/gerar-pdf'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'
import { formatarCPF } from '../lib/format'
import { TEXTOS_LEGAIS_LIP } from '../lib/lip-conteudo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const GRAU_INSALUBRIDADE = [
  { key:'minimo', label:'Mínimo (10%)' },
  { key:'medio',  label:'Médio (20%)' },
  { key:'maximo', label:'Máximo (40%)' },
]

const MOTIVO_PERICULOSIDADE = [
  { key:'', label:'Selecione o motivo...' },
  { key:'inflamaveis',   label:'Inflamáveis / explosivos (NR-16 Anexo 1/2)' },
  { key:'eletricidade',  label:'Energia elétrica (NR-16 Anexo 4)' },
  { key:'radiacao',      label:'Radiação ionizante (NR-16 Anexo 5 antigo / atividades nucleares)' },
  { key:'seguranca',     label:'Segurança patrimonial / roubo (NR-16 Anexo 3)' },
  { key:'motocicleta',   label:'Uso de motocicleta em via pública (NR-16 Anexo V — Portaria MTE 2.021/2025)' },
  { key:'outro',         label:'Outro' },
]

const FUNDAMENTACAO_SUGERIDA = {
  motocicleta: 'NR-16, Anexo V (Portaria MTE nº 2.021/2025) — atividade habitual de deslocamento em via pública com motocicleta, conforme relatório de caracterização técnica.',
  inflamaveis: 'NR-16, Anexo 1/2 — operações com inflamáveis/explosivos em quantidade acima do limite de isenção.',
  eletricidade: 'NR-16, Anexo 4 — atividades e operações com energia elétrica em condições de risco.',
  radiacao: 'NR-16 — atividades com radiação ionizante ou substâncias radioativas.',
  seguranca: 'NR-16, Anexo 3 — atividades de segurança patrimonial ou pessoal com exposição a roubos e outras espécies de violência física.',
}

function funcoesDoLtcat(ltcat) {
  if (!ltcat?.ghes) return []
  const lista = []
  for (const ghe of ltcat.ghes) {
    const nomes = ghe.funcoes?.length ? ghe.funcoes.map(f => f.nome || f).filter(Boolean) : [ghe.nome || 'Função não identificada']
    for (const funcao of nomes) {
      if (lista.find(f => f.funcao === funcao)) continue
      lista.push({
        funcao, setor: ghe.setor || '', agentes: ghe.agentes || [],
        insalubre: false, grau_insalubridade: 'minimo', percentual_insalubridade: 10,
        periculoso: false, motivo_periculosidade: '', fundamentacao: '',
      })
    }
  }
  return lista
}

export default function LIP() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [respLegalEmpresa, setRespLegalEmpresa] = useState('')
  const [ltcatAtivo, setLtcatAtivo] = useState(null)
  const [lips, setLips] = useState([])
  const [lipSel, setLipSel] = useState(null)
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

    const [ltcatRes, lipRes] = await Promise.all([
      supabase.from('ltcats').select('*').eq('empresa_id', empId).eq('ativo', true).order('data_emissao', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('lip').select('*').eq('empresa_id', empId).order('criado_em', { ascending: false }),
    ])
    setLtcatAtivo(ltcatRes.data || null)
    setLips(lipRes.data || [])
    setLipSel(lipRes.data?.[0] || null)
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

  function abrirEdicao(lip) {
    setForm(JSON.parse(JSON.stringify(lip)))
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
      resp_cpf: form.resp_cpf || null,
      funcoes: form.funcoes || [],
      textos_legais_custom: form.textos_legais_custom || {},
      atualizado_em: new Date().toISOString(),
    }

    let error
    if (form.id) {
      ;({ error } = await supabase.from('lip').update(dados).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('lip').insert(dados))
    }

    if (error) { setErro('Erro ao salvar: ' + error.message) }
    else {
      setSucesso('LIP salvo com sucesso!')
      setForm(null)
      setAba('documento')
      await init()
    }
    setSalvando(false)
  }

  async function arquivar(id) {
    if (!confirm('Arquivar este LIP?')) return
    await supabase.from('lip').update({ ativo: false }).eq('id', id)
    init()
  }

  async function excluir(id) {
    if (!confirm('EXCLUIR este LIP permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('lip').delete().eq('id', id)
    if (error) { setErro('Erro ao excluir: ' + error.message); return }
    setLipSel(null)
    init()
  }

  function addFuncaoManual() {
    setForm(p => ({ ...p, funcoes: [...(p.funcoes || []), { funcao:'', setor:'', agentes:[], insalubre:false, grau_insalubridade:'minimo', percentual_insalubridade:10, periculoso:false, motivo_periculosidade:'', fundamentacao:'' }] }))
  }

  function setFuncao(i, field, value) {
    setForm(p => {
      const funcoes = [...p.funcoes]
      funcoes[i] = { ...funcoes[i], [field]: value }
      if (field === 'grau_insalubridade') {
        funcoes[i].percentual_insalubridade = { minimo:10, medio:20, maximo:40 }[value] || 10
      }
      if (field === 'motivo_periculosidade' && value && !funcoes[i].fundamentacao) {
        funcoes[i].fundamentacao = FUNDAMENTACAO_SUGERIDA[value] || ''
      }
      return { ...p, funcoes }
    })
  }

  function removerFuncao(i) {
    setForm(p => ({ ...p, funcoes: p.funcoes.filter((_, idx) => idx !== i) }))
  }

  function exportarPdf(lip) {
    gerarPdfLip(
      {
        dados_gerais: {
          data_elaboracao: lip.data_elaboracao, prox_revisao: lip.prox_revisao,
          resp_nome: lip.resp_nome, resp_conselho: lip.resp_conselho, resp_registro: lip.resp_registro, resp_cpf: lip.resp_cpf,
        },
        funcoes: lip.funcoes || [],
        textos_legais_custom: lip.textos_legais_custom || {},
      },
      { razao_social: nomeEmpresa, cnpj: cnpjEmpresa, resp_nome: respLegalEmpresa }
    )
  }

  if (carregando) return <div style={s.loading}>Carregando...</div>

  const qtdInsalubres = (lipSel?.funcoes || []).filter(f => f.insalubre).length
  const qtdPericulosas = (lipSel?.funcoes || []).filter(f => f.periculoso).length

  return (
    <Layout pagina="lip">
      <Head><title>LIP — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>LIP</div>
          <div style={s.sub}>Laudo de Insalubridade e Periculosidade · NR-15 / NR-16</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {lipSel && <button style={s.btnOutline} onClick={() => exportarPdf(lipSel)}>📄 Exportar PDF</button>}
          <button style={s.btnPrimary} onClick={abrirNovo}>+ Novo LIP</button>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && aba !== 'editar' && <div style={s.erroBox}>{erro}</div>}

      {!ltcatAtivo && (
        <div style={{ ...s.card, background:'#FAEEDA', border:'0.5px solid #F3D9A4' }}>
          <div style={{ fontSize:13, color:'#633806' }}>
            Nenhum LTCAT vigente encontrado. As funções podem ser cadastradas manualmente, mas recomendamos cadastrar o LTCAT primeiro para herdar os agentes de risco automaticamente.
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1.25rem' }}>
        {[
          { n: lipSel ? 'Vigente' : 'Ausente', l:'LIP', c: lipSel ? '#1D9E75' : '#E24B4A' },
          { n: lipSel?.funcoes?.length || 0, l:'Funções avaliadas', c:'#185FA5' },
          { n: qtdInsalubres, l:'Insalubres', c: qtdInsalubres > 0 ? '#EF9F27' : '#1D9E75' },
          { n: qtdPericulosas, l:'Periculosas', c: qtdPericulosas > 0 ? '#E24B4A' : '#1D9E75' },
        ].map((k,i) => (
          <div key={i} style={s.kpiCard}>
            <div style={{ fontSize:22, fontWeight:700, color:k.c }}>{k.n}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {aba === 'documento' && (
        <div>
          {!lipSel ? (
            <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:14, color:'#374151', marginBottom:8 }}>Nenhum LIP cadastrado</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>Defina o grau de insalubridade e periculosidade por função</div>
              <button style={s.btnPrimary} onClick={abrirNovo}>+ Criar primeiro LIP</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={s.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={s.cardTit}>Dados gerais</div>
                  <div style={{ display:'flex', gap:5 }}>
                    <button style={s.btnAcao} onClick={() => abrirEdicao(lipSel)}>Editar</button>
                    <button style={s.btnAcao} onClick={() => arquivar(lipSel.id)}>Arquivar</button>
                    <button style={{ ...s.btnAcao, color:'#E24B4A', borderColor:'#F09595' }} onClick={() => excluir(lipSel.id)}>Excluir</button>
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <div style={s.secLabel}>Elaboração</div>
                    <div style={{ fontSize:13 }}>{lipSel.data_elaboracao ? new Date(lipSel.data_elaboracao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                  <div>
                    <div style={s.secLabel}>Próxima revisão</div>
                    <div style={{ fontSize:13 }}>{lipSel.prox_revisao ? new Date(lipSel.prox_revisao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                </div>
                <div style={s.row2}>
                  <div>
                    <div style={s.secLabel}>Responsável técnico</div>
                    <div style={{ fontSize:13 }}>{lipSel.resp_nome || '—'} {lipSel.resp_cpf ? `· ${lipSel.resp_cpf}` : ''}</div>
                  </div>
                  <div>
                    <div style={s.secLabel}>{lipSel.resp_conselho || 'CREA'}</div>
                    <div style={{ fontSize:13 }}>{lipSel.resp_registro || '—'}</div>
                  </div>
                </div>
              </div>

              <div style={s.card}>
                <div style={s.cardTit}>Funções avaliadas ({lipSel.funcoes?.length || 0})</div>
                {lipSel.funcoes?.length ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                    {lipSel.funcoes.map((f,i) => (
                      <div key={i} style={{ border:'0.5px solid #e5e7eb', borderRadius:8, padding:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{f.funcao}</div>
                          <div style={{ fontSize:11, color:'#9ca3af' }}>{f.setor}</div>
                        </div>
                        <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                          {f.insalubre && <span style={{ ...s.tag, background:'#FAEEDA', color:'#633806' }}>Insalubre — {GRAU_INSALUBRIDADE.find(g=>g.key===f.grau_insalubridade)?.label || f.grau_insalubridade}</span>}
                          {f.periculoso && <span style={{ ...s.tag, background:'#FCEBEB', color:'#791F1F' }}>Periculoso — 30%{f.motivo_periculosidade ? ` · ${MOTIVO_PERICULOSIDADE.find(m=>m.key===f.motivo_periculosidade)?.label.split(' (')[0] || ''}` : ''}</span>}
                          {!f.insalubre && !f.periculoso && <span style={{ ...s.tag, background:'#EAF3DE', color:'#27500A' }}>Sem enquadramento</span>}
                        </div>
                        {f.fundamentacao && <div style={{ fontSize:11, color:'#6b7280', marginTop:6 }}>{f.fundamentacao}</div>}
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Nenhuma função avaliada.</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {aba === 'editar' && form && (
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={s.cardTit}>{form.id ? 'Editar LIP' : 'Novo LIP'}</div>
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
              <label style={s.label}>Funções avaliadas ({form.funcoes?.length || 0})</label>
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
                <div style={{ display:'flex', gap:16, marginBottom:10, flexWrap:'wrap' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer' }}>
                    <input type="checkbox" checked={!!f.insalubre} onChange={e => setFuncao(i, 'insalubre', e.target.checked)} />
                    Insalubre
                  </label>
                  {f.insalubre && (
                    <select style={s.inputSm} value={f.grau_insalubridade} onChange={e => setFuncao(i, 'grau_insalubridade', e.target.value)}>
                      {GRAU_INSALUBRIDADE.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
                    </select>
                  )}
                  <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer' }}>
                    <input type="checkbox" checked={!!f.periculoso} onChange={e => setFuncao(i, 'periculoso', e.target.checked)} />
                    Periculoso (30%)
                  </label>
                  {f.periculoso && (
                    <select style={s.inputSm} value={f.motivo_periculosidade || ''} onChange={e => setFuncao(i, 'motivo_periculosidade', e.target.value)}>
                      {MOTIVO_PERICULOSIDADE.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                  )}
                </div>
                {f.periculoso && f.motivo_periculosidade === 'motocicleta' && (
                  <div style={{ background:'#FAEEDA', border:'0.5px solid #F3D9A4', borderRadius:8, padding:'8px 10px', fontSize:11, color:'#633806', marginBottom:10 }}>
                    <strong>NR-16, Anexo V (Portaria MTE 2.021/2025):</strong> só configura periculosidade o uso de motocicleta como ferramenta de trabalho, em via pública, de forma habitual. <strong>Não</strong> gera periculosidade: trajeto residência–trabalho e volta; uso em local privado ou via interna sem circulação pública; uso eventual ou habitual com tempo de exposição extremamente reduzido. Recomenda-se elaborar relatório técnico de caracterização (percurso, tipo de via, frequência e tempo de exposição) e mantê-lo disponível aos trabalhadores, sindicato e fiscalização.
                  </div>
                )}
                <input style={s.input} placeholder="Fundamentação (ex: NR-15 Anexo 1 — ruído contínuo)" value={f.fundamentacao||''} onChange={e => setFuncao(i, 'fundamentacao', e.target.value)} />
                {f.agentes?.length > 0 && (
                  <div style={{ marginTop:8, fontSize:11, color:'#9ca3af' }}>
                    Agentes do LTCAT: {f.agentes.map(a=>a.nome).join(', ')}
                  </div>
                )}
              </div>
            ))}
            {!(form.funcoes || []).length && <div style={{ fontSize:12, color:'#9ca3af' }}>Nenhuma função. Cadastre um LTCAT vigente ou adicione manualmente.</div>}
          </div>

          {/* ── Textos legais do documento ── */}
          <div style={{ marginBottom:16 }}>
            <label style={s.label}>Textos legais do documento (CLT / NR-15 / NR-16)</label>
            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:8 }}>Textos padrão que vão no PDF — edite só se precisar ajustar alguma redação para o caso da empresa.</div>
            {TEXTOS_LEGAIS_LIP.map(secaoTexto => {
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
            <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar LIP'}</button>
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
  inputSm:    { padding:'5px 8px', fontSize:12, border:'1px solid #d1d5db', borderRadius:6, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  btnAcao:    { padding:'3px 10px', fontSize:11, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151' },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  tag:        { padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600 },
}
