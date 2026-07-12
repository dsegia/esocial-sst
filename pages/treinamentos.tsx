import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { getEmpresaIdValida } from '../lib/empresa'
import { NR_TREINAMENTOS, NORMAS_DISPONIVEIS, sugestoesPorNorma, calcularVencimento } from '../lib/nr-treinamentos'
import { gerarPdfTreinamento } from '../lib/gerar-pdf'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const formVazio = () => ({
  funcionario_id: '', norma: NORMAS_DISPONIVEIS[0], nome: '', carga_horaria: '' as any,
  data_realizacao: '', validade_meses: '' as any, instrutor: '', instituicao: '',
})

let pdfJsLoadingPromise: Promise<any> | null = null
async function carregarPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib
  if (!pdfJsLoadingPromise) {
    pdfJsLoadingPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      s.integrity = 'sha512-q+4liFwdPC/bNdhUpZx6aXDx/h77yEQtn4I1slHydcbZK34nLaR3cAeYSJshoxIOq3mjEf7xJE8YWIUHMn+oCQ=='
      s.crossOrigin = 'anonymous'
      s.onload = () => {
        const lib = (window as any).pdfjsLib
        if (!lib) { reject(new Error('PDF.js não carregou corretamente')); return }
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(lib)
      }
      s.onerror = () => reject(new Error('Falha ao carregar leitor de PDF. Verifique sua conexão.'))
      document.head.appendChild(s)
    })
  }
  return pdfJsLoadingPromise
}

async function extrairTextoPdf(file: File): Promise<string> {
  const lib = await carregarPdfJs()
  const arrayBuf = await file.arrayBuffer()
  const pdfDoc = await lib.getDocument({ data: arrayBuf.slice(0) }).promise
  let texto = ''
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i)
    const content = await page.getTextContent()
    texto += content.items.map((it: any) => it.str).join(' ') + '\n'
    if (texto.length > 60000) break
  }
  return texto
}

export default function Treinamentos() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjEmpresa, setCnpjEmpresa] = useState('')
  const [lista, setLista] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState<any>(formVazio())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [importandoIA, setImportandoIA] = useState(false)
  const [avisoIA, setAvisoIA] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)
    setEmpresaId(empId)
    supabase.from('empresas').select('razao_social,cnpj').eq('id', empId).single()
      .then(({ data: emp }) => { if (emp) { setNomeEmpresa(emp.razao_social); setCnpjEmpresa(emp.cnpj) } })

    const [tRes, fRes] = await Promise.all([
      supabase.from('treinamentos').select('*,funcionarios(id,nome,cpf,funcao,setor)').eq('empresa_id', empId).order('data_realizacao', { ascending: false }).limit(2000),
      supabase.from('funcionarios').select('id,nome,cpf,funcao,setor').eq('empresa_id', empId).eq('ativo', true).order('nome').limit(2000),
    ])
    setLista(tRes.data || [])
    setFuncionarios(fRes.data || [])
    setCarregando(false)
  }

  function abrirCriar() {
    setForm(formVazio())
    setAvisoIA(false)
    setErro(''); setSucesso('')
    setCriando(true)
  }

  // Importa certificado de treinamento via IA — mesmo motor de leitura de PDF já
  // usado para ASO/LTCAT/PCMSO, mas com tipo próprio ('treinamento'), isolado do
  // fluxo 'auto' de /importar (não altera a detecção existente).
  async function importarCertificado(file: File) {
    setErro(''); setSucesso(''); setImportandoIA(true)
    try {
      const texto = await extrairTextoPdf(file)
      if (texto.replace(/\s/g, '').length < 100) {
        throw new Error('Não foi possível extrair texto suficiente deste PDF. Preencha manualmente com "+ Novo treinamento".')
      }
      const { data: sess } = await supabase.auth.getSession()
      const r = await fetch('/api/ler-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sess?.session?.access_token}` },
        body: JSON.stringify({ texto_pdf: texto, paginas: [], tipo: 'treinamento' }),
      })
      const json = await r.json()
      if (!r.ok || !json.sucesso) throw new Error(json.erro || 'Erro na análise do certificado.')

      const dados = json.dados || {}
      const cpfExtraido = (dados.funcionario?.cpf || '').replace(/\D/g, '')
      const funcEncontrado = cpfExtraido
        ? funcionarios.find(f => (f.cpf || '').replace(/\D/g, '') === cpfExtraido)
        : null

      setForm({
        funcionario_id: funcEncontrado?.id || '',
        norma: dados.norma || NORMAS_DISPONIVEIS[0],
        nome: dados.nome || '',
        carga_horaria: dados.carga_horaria || '',
        data_realizacao: dados.data_realizacao || '',
        validade_meses: dados.validade_meses || '',
        instrutor: dados.instrutor || '',
        instituicao: dados.instituicao || '',
      })
      setAvisoIA(true)
      setCriando(true)
      if (!funcEncontrado) {
        setErro(dados.funcionario?.nome
          ? `Funcionário "${dados.funcionario.nome}" não encontrado no cadastro — selecione manualmente.`
          : 'Não foi possível identificar o funcionário — selecione manualmente.')
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao importar certificado.')
    } finally {
      setImportandoIA(false)
    }
  }

  function aplicarSugestao(norma: string) {
    const sug = sugestoesPorNorma(norma)[0]
    setForm((p: any) => ({
      ...p, norma,
      nome: sug?.nome || p.nome,
      carga_horaria: sug?.carga_horaria ?? p.carga_horaria,
      validade_meses: sug?.validade_meses ?? '',
    }))
  }

  async function salvar() {
    setErro(''); setSucesso('')
    if (!form.funcionario_id) { setErro('Selecione o funcionário.'); return }
    if (!form.nome.trim())    { setErro('Informe o nome do treinamento.'); return }
    if (!form.data_realizacao) { setErro('Informe a data de realização.'); return }
    setSalvando(true)

    const validadeMeses = form.validade_meses ? parseInt(form.validade_meses) : null
    const dataVencimento = calcularVencimento(form.data_realizacao, validadeMeses)

    const { error } = await supabase.from('treinamentos').insert({
      empresa_id: empresaId, funcionario_id: form.funcionario_id,
      norma: form.norma, nome: form.nome.trim(),
      carga_horaria: form.carga_horaria ? parseInt(form.carga_horaria) : null,
      data_realizacao: form.data_realizacao,
      validade_meses: validadeMeses,
      data_vencimento: dataVencimento,
      instrutor: form.instrutor.trim() || null,
      instituicao: form.instituicao.trim() || null,
    })

    if (error) { setErro('Erro ao salvar: ' + error.message); setSalvando(false); return }
    setSucesso('Treinamento registrado com sucesso!')
    setCriando(false)
    await init()
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este registro de treinamento?')) return
    await supabase.from('treinamentos').delete().eq('id', id).eq('empresa_id', empresaId)
    setLista(prev => prev.filter(t => t.id !== id))
  }

  function diasParaVencer(d: string | null) {
    if (!d) return null
    return Math.round((new Date(d).getTime() - Date.now()) / 86400000)
  }

  function status(t: any) {
    const dias = diasParaVencer(t.data_vencimento)
    if (dias === null) return { label: 'Sem reciclagem', cor: '#9ca3af', bg: '#f3f4f6' }
    if (dias < 0)   return { label: `Vencido há ${Math.abs(dias)}d`, cor: '#E24B4A', bg: '#FCEBEB' }
    if (dias <= 30) return { label: `Vence em ${dias}d`, cor: '#EF9F27', bg: '#FAEEDA' }
    if (dias <= 90) return { label: `Vence em ${dias}d`, cor: '#185FA5', bg: '#E6F1FB' }
    return { label: 'Em dia', cor: '#1D9E75', bg: '#EAF3DE' }
  }

  const totalVencidos = lista.filter(t => { const d = diasParaVencer(t.data_vencimento); return d !== null && d < 0 }).length
  const totalVence30  = lista.filter(t => { const d = diasParaVencer(t.data_vencimento); return d !== null && d >= 0 && d <= 30 }).length

  const listaFiltrada = lista.filter(t => {
    if (filtro === 'todos') return true
    const dias = diasParaVencer(t.data_vencimento)
    if (filtro === 'vencidos') return dias !== null && dias < 0
    if (filtro === 'vence30')  return dias !== null && dias >= 0 && dias <= 30
    return true
  })

  const fmtData = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="treinamentos">
      <Head><title>Treinamentos — eSocial SST</title></Head>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
        <div>
          <div style={s.titulo}>Treinamentos NR</div>
          <div style={s.sub}>{lista.length} registro(s) · {totalVencidos} vencido(s) · {totalVence30} vencem em 30 dias</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <label style={{ ...s.btnOutline, cursor: importandoIA ? 'wait' : 'pointer', display:'inline-flex', alignItems:'center', opacity: importandoIA ? 0.6 : 1 }}>
            {importandoIA ? 'Analisando...' : '↑ Importar certificado (IA)'}
            <input type="file" accept=".pdf" style={{ display:'none' }} disabled={importandoIA}
              onChange={e => { const f = e.target.files?.[0]; if (f) importarCertificado(f); e.target.value = '' }} />
          </label>
          <button style={s.btnPrimary} onClick={abrirCriar}>+ Novo treinamento</button>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro && <div style={s.erroBox}>{erro}</div>}

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[
          { key:'todos', label:`Todos (${lista.length})` },
          { key:'vencidos', label:`Vencidos (${totalVencidos})` },
          { key:'vence30', label:`Vencem em 30d (${totalVence30})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            style={{ padding:'5px 12px', fontSize:11, fontWeight: filtro===f.key?600:400, borderRadius:99, border:'0.5px solid',
              cursor:'pointer', borderColor: filtro===f.key ? '#185FA5' : '#e5e7eb',
              background: filtro===f.key ? '#185FA5' : '#fff', color: filtro===f.key ? '#fff' : '#374151' }}>
            {f.label}
          </button>
        ))}
      </div>

      {listaFiltrada.length === 0 ? (
        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'3rem', textAlign:'center', color:'#9ca3af' }}>
          <div style={{ fontSize:14, fontWeight:500, color:'#374151', marginBottom:6 }}>Nenhum treinamento registrado</div>
          <div style={{ fontSize:12, marginBottom:16 }}>Cadastre os treinamentos de NR realizados pelos funcionários (NR-35, NR-10, NR-33...)</div>
          <button style={s.btnPrimary} onClick={abrirCriar}>+ Novo treinamento</button>
        </div>
      ) : (
        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#f9fafb' }}>
                {['Funcionário','Norma','Treinamento','Realizado em','Vencimento','Status','Ações'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((t, i) => {
                const st = status(t)
                return (
                  <tr key={t.id} style={{ borderBottom:'0.5px solid #f3f4f6', background: i%2===0?'#fff':'#fafafa' }}>
                    <td style={s.td}>
                      <div style={{ fontWeight:500, color:'#111' }}>{t.funcionarios?.nome || '—'}</div>
                      <div style={{ fontSize:10, color:'#9ca3af' }}>{t.funcionarios?.funcao || '—'}</div>
                    </td>
                    <td style={s.td}><span style={{ padding:'1px 7px', borderRadius:99, fontSize:10, fontWeight:600, background:'#E6F1FB', color:'#185FA5' }}>{t.norma}</span></td>
                    <td style={s.td}>{t.nome}{t.carga_horaria ? <span style={{ color:'#9ca3af' }}> · {t.carga_horaria}h</span> : ''}</td>
                    <td style={s.td}>{fmtData(t.data_realizacao)}</td>
                    <td style={s.td}>{fmtData(t.data_vencimento)}</td>
                    <td style={s.td}>
                      <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600, background:st.bg, color:st.cor }}>{st.label}</span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => gerarPdfTreinamento(t, { razao_social: nomeEmpresa, cnpj: cnpjEmpresa })} style={{ ...s.btnAcao, color:'#27500A', borderColor:'#C0DD97' }}>↓ PDF</button>
                        <button onClick={() => excluir(t.id)} style={{ ...s.btnAcao, color:'#E24B4A', borderColor:'#F09595' }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {criando && (
        <div style={s.overlay} onClick={() => setCriando(false)}>
          <div style={{ ...s.modal, width: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>+ Novo treinamento</div>
              <button onClick={() => setCriando(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
            </div>
            {avisoIA && (
              <div style={{ background:'#E6F1FB', border:'0.5px solid #B5D4F4', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#0C447C', marginBottom:12 }}>
                Dados extraídos por IA do certificado — revise antes de salvar.
              </div>
            )}
            {erro && <div style={{ ...s.erroBox, marginBottom:12 }}>{erro}</div>}

            <div style={{ marginBottom:12 }}>
              <label style={s.label}>Funcionário *</label>
              <select style={s.input} value={form.funcionario_id} onChange={e => setForm({ ...form, funcionario_id: e.target.value })}>
                <option value="">— selecione —</option>
                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome} — {f.funcao || 'sem função'}</option>)}
              </select>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div>
                <label style={s.label}>Norma</label>
                <select style={s.input} value={form.norma} onChange={e => aplicarSugestao(e.target.value)}>
                  {NORMAS_DISPONIVEIS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Carga horária (h)</label>
                <input style={s.input} type="number" value={form.carga_horaria} onChange={e => setForm({ ...form, carga_horaria: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={s.label}>Nome do treinamento *</label>
              <input style={s.input} list="sugestoes-treinamento" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              <datalist id="sugestoes-treinamento">
                {NR_TREINAMENTOS.filter(t => t.norma === form.norma).map((t, i) => <option key={i} value={t.nome} />)}
              </datalist>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div>
                <label style={s.label}>Data de realização *</label>
                <input style={s.input} type="date" value={form.data_realizacao} onChange={e => setForm({ ...form, data_realizacao: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Validade (meses)</label>
                <input style={s.input} type="number" placeholder="vazio = sem reciclagem" value={form.validade_meses} onChange={e => setForm({ ...form, validade_meses: e.target.value })} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              <div>
                <label style={s.label}>Instrutor</label>
                <input style={s.input} value={form.instrutor} onChange={e => setForm({ ...form, instrutor: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Instituição</label>
                <input style={s.input} value={form.instituicao} onChange={e => setForm({ ...form, instituicao: e.target.value })} />
              </div>
            </div>

            {form.data_realizacao && form.validade_meses && (
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:12 }}>
                Vence em: <strong>{new Date(calcularVencimento(form.data_realizacao, parseInt(form.validade_meses))! + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
              </div>
            )}

            <div style={{ display:'flex', gap:8 }}>
              <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar treinamento'}</button>
              <button style={s.btnOutline} onClick={() => setCriando(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

const s: Record<string, any> = {
  loading:    { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  titulo:     { fontSize:20, fontWeight:700, color:'#111' },
  sub:        { fontSize:12, color:'#6b7280', marginTop:2 },
  th:         { padding:'8px 10px', textAlign:'left', fontSize:10, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' },
  td:         { padding:'9px 10px', verticalAlign:'top', color:'#374151' },
  label:      { display:'block', fontSize:11, fontWeight:500, color:'#374151', marginBottom:3 },
  input:      { width:'100%', padding:'7px 9px', fontSize:12, border:'1px solid #d1d5db', borderRadius:7, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  btnAcao:    { padding:'3px 9px', fontSize:10, background:'transparent', border:'0.5px solid #d1d5db', borderRadius:6, cursor:'pointer', color:'#374151', whiteSpace:'nowrap' },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 14px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:12, cursor:'pointer', color:'#374151' },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' },
  modal:      { background:'#fff', borderRadius:12, padding:'1.5rem', width:520, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
}
