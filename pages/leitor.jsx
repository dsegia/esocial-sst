import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Leitor() {
  const router = useRouter()
  const inputRef = useRef()

  const [etapa, setEtapa] = useState('upload') // upload | lendo | preview | salvando | sucesso
  const [tipoDoc, setTipoDoc] = useState('aso')
  const [arquivo, setArquivo] = useState(null)
  const [progresso, setProgresso] = useState('')
  const [erro, setErro] = useState('')
  const [dados, setDados] = useState(null)
  const [empresaId, setEmpresaId] = useState('')
  const [funcionarios, setFuncionarios] = useState([])
  const [funcMatch, setFuncMatch] = useState(null)
  const [editando, setEditando] = useState({})

  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
        .then(({ data: user }) => {
          if (!user) return
          setEmpresaId(user.empresa_id)
          supabase.from('funcionarios').select('id, nome, cpf, matricula_esocial, funcao, setor')
            .eq('empresa_id', user.empresa_id).eq('ativo', true).order('nome')
            .then(({ data: funcs }) => setFuncionarios(funcs || []))
        })
    })
  }, [])

  // ─── CONVERTER PDF EM IMAGENS BASE64 ────────────────
  async function pdfParaImagens(file) {
    // Usa pdf.js via CDN para converter páginas em canvas
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = async () => {
        try {
          const pdfjsLib = window.pdfjsLib
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          const paginas = []
          const totalPags = Math.min(pdf.numPages, 4) // máx 4 páginas

          for (let i = 1; i <= totalPags; i++) {
            setProgresso(`Convertendo página ${i} de ${totalPags}...`)
            const page = await pdf.getPage(i)
            const viewport = page.getViewport({ scale: 2.0 })
            const canvas = document.createElement('canvas')
            canvas.width = viewport.width
            canvas.height = viewport.height
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
            const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
            paginas.push(base64)
          }
          resolve(paginas)
        } catch (e) { reject(e) }
      }
      script.onerror = () => reject(new Error('Erro ao carregar pdf.js'))
      if (!document.querySelector('script[src*="pdf.min.js"]')) {
        document.head.appendChild(script)
      } else {
        script.onload()
      }
    })
  }

  // ─── LER XML ────────────────────────────────────────
  function lerXML(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const xml = e.target.result
          const parser = new DOMParser()
          const doc = parser.parseFromString(xml, 'text/xml')

          // Extrai campos do XML eSocial S-2220
          const get = (tag) => doc.querySelector(tag)?.textContent?.trim() || null

          resolve({
            funcionario: {
              nome: get('nmTrab') || get('nome'),
              cpf: get('cpfTrab') || get('cpf'),
              matricula: get('matricula'),
              funcao: null, setor: null, data_nasc: null, data_adm: null, cbo: null,
            },
            aso: {
              tipo_aso: tipoXML(get('tpAso')),
              data_exame: formatarData(get('dtAso')),
              prox_exame: null,
              conclusao: conclusaoXML(get('concl')),
              medico_nome: get('nmMed'),
              medico_crm: get('nrCRM'),
            },
            exames: [],
            riscos: [],
            confianca: { nome: 99, cpf: 99, tipo_aso: 99, data_exame: 99, conclusao: 99 },
            fonte: 'xml',
          })
        } catch (e) { reject(e) }
      }
      reader.readAsText(file)
    })
  }

  function tipoXML(cod) {
    const m = { '0':'admissional','1':'periodico','2':'retorno','3':'mudanca','4':'demissional','5':'monitoracao' }
    return m[cod] || 'periodico'
  }
  function conclusaoXML(cod) {
    const m = { '1':'apto','2':'apto_restricao','3':'inapto' }
    return m[cod] || 'apto'
  }
  function formatarData(iso) {
    if (!iso || iso.length < 10) return null
    const [y,m,d] = iso.substring(0,10).split('-')
    return `${d}/${m}/${y}`
  }

  // ─── PROCESSAR ARQUIVO ───────────────────────────────
  async function processarArquivo() {
    if (!arquivo) return
    setErro(''); setEtapa('lendo')

    try {
      let dadosExtraidos

      if (arquivo.name.toLowerCase().endsWith('.xml')) {
        setProgresso('Lendo arquivo XML...')
        dadosExtraidos = await lerXML(arquivo)
      } else {
        // PDF
        setProgresso('Carregando PDF...')
        const paginas = await pdfParaImagens(arquivo)
        setProgresso(`Enviando ${paginas.length} página(s) para o Claude Vision...`)

        const resp = await fetch('/api/ler-documento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paginas, tipo: tipoDoc }),
        })

        const json = await resp.json()
        if (!resp.ok || !json.sucesso) {
          throw new Error(json.erro || 'Erro na leitura')
        }
        dadosExtraidos = json.dados
      }

      // Tentar encontrar funcionário pelo CPF
      if (dadosExtraidos.funcionario?.cpf) {
        const cpfLimpo = dadosExtraidos.funcionario.cpf.replace(/\D/g, '')
        const match = funcionarios.find(f => f.cpf.replace(/\D/g, '') === cpfLimpo)
        if (match) setFuncMatch(match)
      }

      setDados(dadosExtraidos)
      setEditando(dadosExtraidos)
      setEtapa('preview')

    } catch (err) {
      setErro('Erro: ' + err.message)
      setEtapa('upload')
    }
  }

  // ─── SALVAR ──────────────────────────────────────────
  async function salvar() {
    setEtapa('salvando')
    try {
      const d = editando
      let funcId = funcMatch?.id

      // Se não encontrou, criar funcionário novo
      if (!funcId && d.funcionario?.nome && d.funcionario?.cpf) {
        const { data: novoFunc } = await supabase.from('funcionarios').insert({
          empresa_id: empresaId,
          nome: d.funcionario.nome,
          cpf: d.funcionario.cpf,
          data_nasc: converterData(d.funcionario.data_nasc) || '1990-01-01',
          data_adm: converterData(d.funcionario.data_adm) || new Date().toISOString().split('T')[0],
          matricula_esocial: d.funcionario.matricula || ('MAT-' + Date.now()),
          funcao: d.funcionario.funcao,
          setor: d.funcionario.setor,
        }).select().single()
        funcId = novoFunc?.id
      }

      if (!funcId) throw new Error('Nenhum funcionário selecionado ou encontrado.')

      if (tipoDoc === 'aso') {
        const { data: aso } = await supabase.from('asos').insert({
          funcionario_id: funcId,
          empresa_id: empresaId,
          tipo_aso: d.aso?.tipo_aso || 'periodico',
          data_exame: converterData(d.aso?.data_exame) || new Date().toISOString().split('T')[0],
          prox_exame: converterData(d.aso?.prox_exame) || null,
          conclusao: d.aso?.conclusao || 'apto',
          medico_nome: d.aso?.medico_nome || null,
          medico_crm: d.aso?.medico_crm || null,
          exames: d.exames || [],
          riscos: d.riscos || [],
        }).select().single()

        await supabase.from('transmissoes').insert({
          empresa_id: empresaId, funcionario_id: funcId,
          evento: 'S-2220', referencia_id: aso.id, referencia_tipo: 'aso',
          status: 'pendente', tentativas: 0, ambiente: 'producao_restrita',
        })
      } else {
        const { data: ltcat } = await supabase.from('ltcats').insert({
          empresa_id: empresaId,
          data_emissao: converterData(d.dados_gerais?.data_emissao) || new Date().toISOString().split('T')[0],
          data_vigencia: converterData(d.dados_gerais?.data_vigencia) || new Date().toISOString().split('T')[0],
          prox_revisao: converterData(d.dados_gerais?.prox_revisao) || null,
          resp_nome: d.dados_gerais?.resp_nome || '',
          resp_conselho: d.dados_gerais?.resp_conselho || 'CREA',
          resp_registro: d.dados_gerais?.resp_registro || null,
          ghes: d.ghes || [],
          ativo: true,
        }).select().single()

        await supabase.from('transmissoes').insert({
          empresa_id: empresaId,
          evento: 'S-2240', referencia_id: ltcat.id, referencia_tipo: 'ltcat',
          status: 'pendente', tentativas: 0, ambiente: 'producao_restrita',
        })
      }

      setEtapa('sucesso')
    } catch (err) {
      setErro('Erro ao salvar: ' + err.message)
      setEtapa('preview')
    }
  }

  function converterData(br) {
    if (!br) return null
    const p = br.split('/')
    if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`
    return null
  }

  function confiancaCor(v) {
    if (!v) return '#9ca3af'
    if (v >= 90) return '#1D9E75'
    if (v >= 70) return '#EF9F27'
    return '#E24B4A'
  }
  function confiancaLabel(v) {
    if (!v) return '?'
    if (v >= 90) return 'Alta'
    if (v >= 70) return 'Média'
    return 'Baixa'
  }

  // ─── RENDER ──────────────────────────────────────────
  return (
    <Layout pagina="leitor">
      <Head><title>Leitor Inteligente — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>Leitor inteligente de documentos</div>
          <div style={s.sub}>PDF ou XML → campos extraídos automaticamente → confirmar → salvar</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <span style={{ ...s.badge, background: tipoDoc==='aso'?'#E6F1FB':'#f3f4f6', color: tipoDoc==='aso'?'#0C447C':'#6b7280', cursor:'pointer' }}
            onClick={() => setTipoDoc('aso')}>ASO (S-2220)</span>
          <span style={{ ...s.badge, background: tipoDoc==='ltcat'?'#FAEEDA':'#f3f4f6', color: tipoDoc==='ltcat'?'#633806':'#6b7280', cursor:'pointer' }}
            onClick={() => setTipoDoc('ltcat')}>LTCAT (S-2240)</span>
        </div>
      </div>

      {erro && <div style={s.erroBox}>{erro}</div>}

      {/* ── UPLOAD ── */}
      {etapa === 'upload' && (
        <div style={s.card}>
          <div
            style={s.dropZone}
            onClick={() => inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#185FA5' }}
            onDragLeave={e => { e.currentTarget.style.borderColor='#d1d5db' }}
            onDrop={e => {
              e.preventDefault()
              e.currentTarget.style.borderColor='#d1d5db'
              const f = e.dataTransfer.files[0]
              if (f) setArquivo(f)
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <div style={{ fontSize:14, fontWeight:500, color:'#374151', marginTop:10 }}>
              {arquivo ? arquivo.name : 'Clique ou arraste o arquivo aqui'}
            </div>
            <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>
              Aceita PDF (digitalizado ou digital) e XML eSocial
            </div>
            {arquivo && (
              <div style={{ marginTop:8, fontSize:12, color:'#185FA5', fontWeight:500 }}>
                ✓ {arquivo.name} ({(arquivo.size/1024).toFixed(0)} KB) — pronto para leitura
              </div>
            )}
          </div>

          <input ref={inputRef} type="file" accept=".pdf,.xml" style={{ display:'none' }}
            onChange={e => setArquivo(e.target.files[0])} />

          {arquivo && (
            <button style={{ ...s.btnPrimary, marginTop:12, width:'100%' }} onClick={processarArquivo}>
              Ler documento com Claude Vision →
            </button>
          )}

          <div style={{ marginTop:16, padding:'10px 14px', background:'#f9fafb', borderRadius:8, fontSize:12, color:'#6b7280', lineHeight:1.8 }}>
            <strong>Como funciona:</strong><br/>
            1. Você sobe o PDF ou XML do ASO / LTCAT<br/>
            2. O sistema lê e extrai todos os campos automaticamente<br/>
            3. Você confere os dados e corrige se necessário<br/>
            4. Confirma e o registro é salvo + transmissão agendada
          </div>
        </div>
      )}

      {/* ── LENDO ── */}
      {etapa === 'lendo' && (
        <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
          <div style={{ width:60, height:60, border:'3px solid #185FA5', borderTopColor:'transparent', borderRadius:'50%', margin:'0 auto 16px', animation:'spin 1s linear infinite' }}></div>
          <div style={{ fontSize:14, fontWeight:500, color:'#111', marginBottom:6 }}>Lendo documento...</div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{progresso}</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {etapa === 'preview' && dados && (
        <div>
          <div style={{ ...s.card, border:'2px solid #1D9E75' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#085041' }}>
                Documento lido com sucesso — confira os campos
              </div>
              <span style={{ fontSize:11, color:'#6b7280' }}>
                Campos em <span style={{ color:'#1D9E75', fontWeight:600 }}>verde</span> = alta confiança ·
                <span style={{ color:'#EF9F27', fontWeight:600' }}> amarelo</span> = verificar ·
                <span style={{ color:'#E24B4A', fontWeight:600 }}> vermelho</span> = preencher manualmente
              </span>
            </div>

            {/* Funcionário */}
            {tipoDoc === 'aso' && dados.funcionario && (
              <div style={{ marginBottom:14 }}>
                <div style={s.secLabel}>Funcionário</div>

                {/* Match automático */}
                {funcMatch ? (
                  <div style={{ background:'#EAF3DE', border:'0.5px solid #9FE1CB', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#085041', marginBottom:10 }}>
                    ✓ Funcionário encontrado no cadastro: <strong>{funcMatch.nome}</strong> — {funcMatch.cpf}
                    <button onClick={() => setFuncMatch(null)} style={{ marginLeft:10, fontSize:11, color:'#E24B4A', background:'none', border:'none', cursor:'pointer' }}>Trocar</button>
                  </div>
                ) : (
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:12, color:'#633806', background:'#FAEEDA', padding:'8px 12px', borderRadius:8, marginBottom:8 }}>
                      CPF não encontrado no cadastro. Selecione manualmente ou um novo funcionário será criado.
                    </div>
                    <select style={s.input} onChange={e => setFuncMatch(funcionarios.find(f=>f.id===e.target.value)||null)}>
                      <option value="">— criar novo com dados do documento —</option>
                      {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome} — {f.cpf}</option>)}
                    </select>
                  </div>
                )}

                <div style={s.row2}>
                  {campoPreview('Nome', dados.funcionario.nome, dados.confianca?.nome, v => setEditando(p=>({...p, funcionario:{...p.funcionario, nome:v}})))}
                  {campoPreview('CPF', dados.funcionario.cpf, dados.confianca?.cpf, v => setEditando(p=>({...p, funcionario:{...p.funcionario, cpf:v}})))}
                  {campoPreview('Função', dados.funcionario.funcao, 70, v => setEditando(p=>({...p, funcionario:{...p.funcionario, funcao:v}})))}
                  {campoPreview('Setor / GHE', dados.funcionario.setor, 70, v => setEditando(p=>({...p, funcionario:{...p.funcionario, setor:v}})))}
                </div>
              </div>
            )}

            {/* ASO */}
            {tipoDoc === 'aso' && dados.aso && (
              <div style={{ marginBottom:14 }}>
                <div style={s.secLabel}>Dados do ASO</div>
                <div style={s.row2}>
                  {campoPreview('Tipo de exame', dados.aso.tipo_aso, dados.confianca?.tipo_aso, v => setEditando(p=>({...p, aso:{...p.aso, tipo_aso:v}})))}
                  {campoPreview('Conclusão', dados.aso.conclusao, dados.confianca?.conclusao, v => setEditando(p=>({...p, aso:{...p.aso, conclusao:v}})))}
                  {campoPreview('Data do exame', dados.aso.data_exame, dados.confianca?.data_exame, v => setEditando(p=>({...p, aso:{...p.aso, data_exame:v}})))}
                  {campoPreview('Próximo exame', dados.aso.prox_exame, 75, v => setEditando(p=>({...p, aso:{...p.aso, prox_exame:v}})))}
                  {campoPreview('Médico', dados.aso.medico_nome, 80, v => setEditando(p=>({...p, aso:{...p.aso, medico_nome:v}})))}
                  {campoPreview('CRM', dados.aso.medico_crm, dados.confianca?.medico_crm, v => setEditando(p=>({...p, aso:{...p.aso, medico_crm:v}})))}
                </div>
              </div>
            )}

            {/* Exames */}
            {tipoDoc === 'aso' && dados.exames && dados.exames.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={s.secLabel}>Exames realizados ({dados.exames.length})</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {dados.exames.map((ex, i) => (
                    <span key={i} style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:500,
                      background: ex.resultado==='Normal'?'#EAF3DE': ex.resultado==='Alterado'?'#FCEBEB':'#FAEEDA',
                      color: ex.resultado==='Normal'?'#085041': ex.resultado==='Alterado'?'#791F1F':'#633806' }}>
                      {ex.nome}: {ex.resultado}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* LTCAT */}
            {tipoDoc === 'ltcat' && dados.dados_gerais && (
              <div style={{ marginBottom:14 }}>
                <div style={s.secLabel}>Dados gerais do LTCAT</div>
                <div style={s.row2}>
                  {campoPreview('Data emissão', dados.dados_gerais.data_emissao, dados.confianca?.data_emissao)}
                  {campoPreview('Próxima revisão', dados.dados_gerais.prox_revisao, 80)}
                  {campoPreview('Responsável', dados.dados_gerais.resp_nome, dados.confianca?.resp_nome)}
                  {campoPreview('Conselho/Registro', `${dados.dados_gerais.resp_conselho||''} ${dados.dados_gerais.resp_registro||''}`, 85)}
                </div>
                {dados.ghes && (
                  <div style={{ fontSize:12, color:'#374151', marginTop:8 }}>
                    {dados.ghes.length} GHE(s) identificado(s) com {dados.ghes.reduce((a,g)=>a+(g.agentes?.length||0),0)} agente(s) de risco
                  </div>
                )}
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button style={s.btnPrimary} onClick={salvar}>
                Confirmar e salvar →
              </button>
              <button style={s.btnOutline} onClick={() => { setEtapa('upload'); setDados(null); setArquivo(null) }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SALVANDO ── */}
      {etapa === 'salvando' && (
        <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
          <div style={{ fontSize:14, fontWeight:500, color:'#111' }}>Salvando no banco...</div>
        </div>
      )}

      {/* ── SUCESSO ── */}
      {etapa === 'sucesso' && (
        <div style={{ ...s.card, textAlign:'center', padding:'3rem' }}>
          <div style={{ width:60, height:60, background:'#EAF3DE', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div style={{ fontSize:16, fontWeight:600, color:'#085041', marginBottom:6 }}>Salvo com sucesso!</div>
          <div style={{ fontSize:13, color:'#374151', marginBottom:20 }}>
            Documento lido, dados salvos e transmissão agendada como pendente.
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button style={s.btnPrimary} onClick={() => { setEtapa('upload'); setDados(null); setArquivo(null); setFuncMatch(null) }}>
              Ler outro documento
            </button>
            <button style={s.btnOutline} onClick={() => router.push('/historico')}>
              Ver histórico →
            </button>
          </div>
        </div>
      )}
    </Layout>
  )

  function campoPreview(label, valor, confianca, onChange) {
    const cor = confiancaCor(confianca)
    const lbl = confiancaLabel(confianca)
    return (
      <div key={label} style={{ marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
          <span style={{ fontSize:11, fontWeight:500, color:'#374151' }}>{label}</span>
          <span style={{ fontSize:10, color: cor, fontWeight:600 }}>● {lbl}</span>
        </div>
        <input
          style={{ ...s.input, borderColor: confianca >= 90 ? '#9FE1CB' : confianca >= 70 ? '#FAC775' : '#F09595' }}
          defaultValue={valor || ''}
          onChange={onChange ? e => onChange(e.target.value) : undefined}
          readOnly={!onChange}
        />
      </div>
    )
  }
}

const s = {
  header:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:   { fontSize:20, fontWeight:700, color:'#111' },
  sub:      { fontSize:12, color:'#6b7280', marginTop:2 },
  badge:    { padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:500, cursor:'pointer', transition:'all .15s' },
  card:     { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' },
  dropZone: { border:'2px dashed #d1d5db', borderRadius:12, padding:'2.5rem', textAlign:'center', cursor:'pointer', transition:'border-color .15s' },
  secLabel: { fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 },
  row2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  input:    { width:'100%', padding:'7px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:7, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  erroBox:  { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  btnPrimary: { padding:'10px 20px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
  btnOutline: { padding:'10px 20px', background:'transparent', color:'#374151', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer' },
}
