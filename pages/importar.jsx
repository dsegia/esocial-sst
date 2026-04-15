import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { getEmpresaId } from '../lib/empresa'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TIPO_INFO = {
  ltcat: { label: 'LTCAT', cor: '#185FA5', bg: '#E6F1FB', icone: '🏭' },
  pcmso: { label: 'PCMSO', cor: '#27500A', bg: '#EAF3DE', icone: '🩺' },
  aso:   { label: 'ASO',   cor: '#633806', bg: '#FAEEDA', icone: '📋' },
}

const LIMITE_ARQUIVOS = 10
const LIMITE_BASE64   = 3 * 1024 * 1024   // 3 MB → envia como base64 nativo
const LIMITE_TAMANHO  = 50 * 1024 * 1024  // 50 MB → tamanho máximo aceito

// ── Utilitários ────────────────────────────────────────
function converterData(br) {
  if (!br) return null
  if (typeof br === 'string' && br.includes('-') && !br.includes('/')) return br.substring(0, 10)
  const p = String(br).split('/')
  return p.length === 3 ? `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}` : null
}

function fmtTamanho(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ── Garantir PDF.js carregado ───────────────────────────
let pdfJsLoading = null
async function carregarPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib
  if (!pdfJsLoading) {
    pdfJsLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(window.pdfjsLib)
      }
      s.onerror = reject
      document.head.appendChild(s)
    })
  }
  return pdfJsLoading
}

// ── Processar 1 arquivo: extrai texto/imagens e chama API ──
async function processarArquivo(file, onProgresso) {
  onProgresso('Carregando PDF...')
  const lib = await carregarPdfJs()
  const arrayBuf = await file.arrayBuffer()
  const pdfDoc = await lib.getDocument({ data: arrayBuf.slice(0) }).promise

  onProgresso('Extraindo texto...')
  let textoPdf = ''
  for (let i = 1; i <= Math.min(pdfDoc.numPages, 10); i++) {
    const page = await pdfDoc.getPage(i)
    const content = await page.getTextContent()
    textoPdf += content.items.map(it => it.str).join(' ') + '\n'
  }
  const temTexto = textoPdf.replace(/\s/g, '').length > 300

  let payload
  if (file.size <= LIMITE_BASE64) {
    onProgresso('Preparando leitura nativa...')
    const bytes = new Uint8Array(arrayBuf.slice(0))
    let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    const pdf_base64 = btoa(bin)
    payload = { pdf_base64, texto_pdf: textoPdf, paginas: [], tipo: 'auto' }
  } else if (temTexto) {
    onProgresso(`PDF grande (${fmtTamanho(file.size)}) — usando texto...`)
    payload = { texto_pdf: textoPdf, paginas: [], tipo: 'auto' }
  } else {
    onProgresso('PDF escaneado — convertendo imagens...')
    const paginas = []
    for (let i = 1; i <= Math.min(pdfDoc.numPages, 5); i++) {
      onProgresso(`Convertendo página ${i}/${Math.min(pdfDoc.numPages, 5)}...`)
      const page = await pdfDoc.getPage(i)
      const vp = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width; canvas.height = vp.height
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
      paginas.push(canvas.toDataURL('image/jpeg', 0.8).split(',')[1])
    }
    payload = { paginas, texto_pdf: '', tipo: 'auto' }
  }

  onProgresso('Identificando com IA...')
  const resp = await fetch('/api/ler-documento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  let json
  try { json = await resp.json() }
  catch { throw new Error('O servidor não respondeu. Tente novamente.') }
  if (!resp.ok || !json.sucesso) throw new Error(json.erro || 'Erro na análise do documento')
  return json // { tipo_detectado, dados }
}

// ── Salvar documento no Supabase ───────────────────────
async function salvarDocumento(tipo, dados, empresaId) {
  if (tipo === 'ltcat') {
    const { error } = await supabase.from('ltcats').insert({
      empresa_id: empresaId,
      data_emissao: dados.dados_gerais?.data_emissao || null,
      data_vigencia: dados.dados_gerais?.data_vigencia || null,
      prox_revisao: dados.dados_gerais?.prox_revisao || null,
      resp_nome: dados.dados_gerais?.resp_nome || null,
      resp_conselho: dados.dados_gerais?.resp_conselho || 'CREA',
      resp_registro: dados.dados_gerais?.resp_registro || null,
      ghes: dados.ghes || [],
      ativo: true,
    })
    if (error) throw new Error(error.message)
    return 'ltcat'
  }

  if (tipo === 'pcmso') {
    for (const prog of (dados.programas || [])) {
      await supabase.from('pcmso_programa').upsert({
        empresa_id: empresaId,
        funcao: prog.funcao,
        setor: prog.setor || null,
        riscos: prog.riscos || [],
        exames: (prog.exames || []).map(e => ({
          nome: typeof e === 'string' ? e : e.nome,
          periodicidade: e.periodicidade || 'Anual',
          obrigatorio: true,
        })),
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'empresa_id,funcao' })
    }
    return 'pcmso'
  }

  if (tipo === 'aso') {
    const cpfBruto = dados.funcionario?.cpf?.replace(/\D/g, '') || ''
    let funcId = null

    if (cpfBruto.length === 11) {
      const cpfFmt = cpfBruto.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      const { data: funcAtivo } = await supabase.from('funcionarios')
        .select('id').eq('empresa_id', empresaId).eq('cpf', cpfFmt).eq('ativo', true).single()
      if (funcAtivo) {
        funcId = funcAtivo.id
      } else {
        const { data: funcInativo } = await supabase.from('funcionarios')
          .select('id').eq('empresa_id', empresaId).eq('cpf', cpfFmt).single()
        if (funcInativo) funcId = funcInativo.id
      }
    }

    if (!funcId) {
      const cpfFmt = cpfBruto.length === 11
        ? cpfBruto.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        : (dados.funcionario?.cpf || '000.000.000-00')
      const { data: novoFunc, error: funcErr } = await supabase.from('funcionarios').insert({
        empresa_id: empresaId,
        nome: dados.funcionario?.nome || 'Não identificado',
        cpf: cpfFmt,
        data_nasc: converterData(dados.funcionario?.data_nasc),
        data_adm: converterData(dados.funcionario?.data_adm),
        matricula_esocial: 'PEND-' + Date.now(),
        funcao: dados.funcionario?.funcao || null,
        setor: dados.funcionario?.setor || null,
        ativo: true,
      }).select().single()
      if (funcErr) throw new Error('Erro ao criar funcionário: ' + funcErr.message)
      funcId = novoFunc.id
    }

    const dataExame = converterData(dados.aso?.data_exame) || new Date().toISOString().split('T')[0]
    const { data: aso, error: asoErr } = await supabase.from('asos').insert({
      funcionario_id: funcId, empresa_id: empresaId,
      tipo_aso: dados.aso?.tipo_aso || 'periodico',
      data_exame: dataExame,
      prox_exame: converterData(dados.aso?.prox_exame) || null,
      conclusao: dados.aso?.conclusao || 'apto',
      medico_nome: dados.aso?.medico_nome || null,
      medico_crm: dados.aso?.medico_crm || null,
      exames: dados.exames || [],
      riscos: dados.riscos || [],
    }).select().single()
    if (asoErr) throw new Error(asoErr.message)

    await supabase.from('transmissoes').insert({
      empresa_id: empresaId, funcionario_id: funcId,
      evento: 'S-2220', referencia_id: aso.id, referencia_tipo: 'aso',
      status: 'pendente', tentativas: 0, ambiente: 'producao_restrita',
    })
    return 'aso'
  }

  throw new Error('Tipo de documento não reconhecido')
}

// ── Componente principal ───────────────────────────────
export default function Importar() {
  const router = useRouter()
  const fileRef = useRef()
  const [empresaId, setEmpresaId] = useState('')
  const [fila, setFila] = useState([])         // [{ id, nome, tamanho, file, estado, tipo, info, erro }]
  const [processando, setProcessando] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [erroGlobal, setErroGlobal] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
        .then(({ data: u }) => {
          if (!u) { router.push('/'); return }
          setEmpresaId(getEmpresaId() || u.empresa_id)
        })
    })
  }, [])

  function atualizarItem(id, patch) {
    setFila(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))
  }

  function adicionarArquivos(files) {
    setErroGlobal('')
    const validos = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    if (validos.length === 0) { setErroGlobal('Selecione arquivos PDF.'); return }

    setFila(prev => {
      const jaExistentes = prev.length
      const vagos = LIMITE_ARQUIVOS - jaExistentes
      if (vagos <= 0) { setErroGlobal(`Limite de ${LIMITE_ARQUIVOS} arquivos atingido.`); return prev }

      const novos = validos.slice(0, vagos).map(f => {
        if (f.size > LIMITE_TAMANHO) {
          return { id: Math.random().toString(36).slice(2), nome: f.name, tamanho: f.size, file: null, estado: 'erro', tipo: null, info: null, erro: `Arquivo muito grande (${fmtTamanho(f.size)}). Máximo: 50 MB.` }
        }
        return { id: Math.random().toString(36).slice(2), nome: f.name, tamanho: f.size, file: f, estado: 'aguardando', tipo: null, info: null, erro: null }
      })

      if (validos.length > vagos) setErroGlobal(`Apenas ${vagos} arquivo(s) adicionado(s). Limite é ${LIMITE_ARQUIVOS}.`)
      return [...prev, ...novos]
    })
  }

  function removerItem(id) {
    if (processando) return
    setFila(prev => prev.filter(it => it.id !== id))
  }

  async function processarFila() {
    if (!empresaId || processando) return
    const pendentes = fila.filter(it => it.estado === 'aguardando' && it.file)
    if (pendentes.length === 0) return
    setProcessando(true)

    for (const item of pendentes) {
      atualizarItem(item.id, { estado: 'processando', progresso: 'Iniciando...' })
      try {
        const resultado = await processarArquivo(item.file, msg =>
          atualizarItem(item.id, { progresso: msg })
        )
        atualizarItem(item.id, { progresso: 'Salvando...' })
        const tipoFinal = await salvarDocumento(resultado.tipo_detectado, resultado.dados, empresaId)
        const info = TIPO_INFO[tipoFinal]
        const resumo = resumoDocumento(tipoFinal, resultado.dados)
        atualizarItem(item.id, { estado: 'salvo', tipo: tipoFinal, info, resumo, progresso: null })
      } catch (err) {
        atualizarItem(item.id, { estado: 'erro', erro: err.message, progresso: null })
      }
    }

    setProcessando(false)
  }

  function resumoDocumento(tipo, dados) {
    if (tipo === 'aso')   return `${dados.funcionario?.nome || '—'} · ${dados.aso?.tipo_aso || '—'}`
    if (tipo === 'ltcat') return `${dados.ghes?.length || 0} GHEs · ${dados.dados_gerais?.resp_nome || '—'}`
    if (tipo === 'pcmso') return `${dados.programas?.length || 0} programas`
    return ''
  }

  const totalAguardando = fila.filter(it => it.estado === 'aguardando').length
  const totalSalvos     = fila.filter(it => it.estado === 'salvo').length
  const totalErros      = fila.filter(it => it.estado === 'erro').length
  const totalFila       = fila.length
  const podeProsseguir  = totalSalvos > 0

  // Rotas por tipo
  function navegar() {
    const tipos = [...new Set(fila.filter(it => it.estado === 'salvo').map(it => it.tipo))]
    if (tipos.length === 1) router.push(`/${tipos[0]}`)
    else router.push('/dashboard')
  }

  return (
    <Layout pagina="importar">
      <Head><title>Importar Documentos — eSocial SST</title></Head>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Cabeçalho */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>Importar Documentos</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            Selecione até {LIMITE_ARQUIVOS} PDFs — ASO, LTCAT ou PCMSO detectados automaticamente
          </div>
        </div>

        {/* Zona de drop */}
        {!processando && totalFila < LIMITE_ARQUIVOS && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); adicionarArquivos(e.dataTransfer.files) }}
            style={{
              border: `2px dashed ${dragOver ? '#185FA5' : '#d1d5db'}`,
              borderRadius: 12, padding: '2rem', textAlign: 'center',
              cursor: 'pointer', background: dragOver ? '#F0F7FF' : '#f9fafb',
              transition: 'all .15s', marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              {totalFila === 0 ? 'Clique ou arraste os PDFs aqui' : `Adicionar mais arquivos (${totalFila}/${LIMITE_ARQUIVOS})`}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>
              Até {LIMITE_ARQUIVOS} arquivos · máximo 50 MB cada · PDF apenas
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept=".pdf" multiple style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.length) adicionarArquivos(e.target.files); e.target.value = '' }} />

        {erroGlobal && (
          <div style={{ background: '#FCEBEB', color: '#791F1F', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '9px 14px', fontSize: 12, marginBottom: 12 }}>
            {erroGlobal}
          </div>
        )}

        {/* Fila de arquivos */}
        {fila.length > 0 && (
          <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            {fila.map((item, idx) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                borderBottom: idx < fila.length - 1 ? '0.5px solid #f3f4f6' : 'none',
                background: item.estado === 'processando' ? '#F8FBFF' : '#fff',
              }}>
                {/* Ícone estado */}
                <div style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>
                  {item.estado === 'aguardando'   && <span style={{ color: '#d1d5db' }}>⏳</span>}
                  {item.estado === 'processando'  && <Spinner />}
                  {item.estado === 'salvo'        && <span style={{ color: '#27a048' }}>✓</span>}
                  {item.estado === 'erro'         && <span style={{ color: '#dc2626' }}>✗</span>}
                </div>

                {/* Info arquivo */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.nome}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                    {item.estado === 'processando' && (item.progresso || 'Processando...')}
                    {item.estado === 'aguardando'  && fmtTamanho(item.tamanho)}
                    {item.estado === 'salvo'       && item.resumo}
                    {item.estado === 'erro'        && <span style={{ color: '#dc2626' }}>{item.erro}</span>}
                  </div>
                </div>

                {/* Badge tipo */}
                {item.info && (
                  <div style={{ flexShrink: 0, padding: '2px 10px', background: item.info.bg, borderRadius: 99, fontSize: 11, fontWeight: 600, color: item.info.cor }}>
                    {item.info.icone} {item.info.label}
                  </div>
                )}

                {/* Tamanho */}
                {item.estado === 'aguardando' && (
                  <div style={{ flexShrink: 0, fontSize: 11, color: '#9ca3af', minWidth: 52, textAlign: 'right' }}>
                    {fmtTamanho(item.tamanho)}
                  </div>
                )}

                {/* Remover */}
                {!processando && item.estado !== 'processando' && (
                  <button onClick={() => removerItem(item.id)} style={{
                    flexShrink: 0, background: 'none', border: 'none', fontSize: 16,
                    color: '#d1d5db', cursor: 'pointer', padding: '0 2px', lineHeight: 1,
                  }}>×</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sumário + ações */}
        {fila.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

            {totalAguardando > 0 && !processando && (
              <button onClick={processarFila} style={{
                padding: '9px 20px', background: '#185FA5', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Processar {totalAguardando} arquivo{totalAguardando > 1 ? 's' : ''}
              </button>
            )}

            {processando && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#E6F1FB', borderRadius: 8 }}>
                <Spinner />
                <span style={{ fontSize: 13, color: '#185FA5', fontWeight: 500 }}>Processando...</span>
              </div>
            )}

            {podeProsseguir && !processando && (
              <button onClick={navegar} style={{
                padding: '9px 18px', background: '#27500A', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Ver documentos salvos →
              </button>
            )}

            {!processando && (
              <button onClick={() => { setFila([]); setErroGlobal('') }} style={{
                padding: '9px 14px', background: 'transparent', border: '1px solid #d1d5db',
                borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#374151',
              }}>
                Limpar lista
              </button>
            )}

            {/* Contadores */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, fontSize: 12 }}>
              {totalSalvos  > 0 && <span style={{ color: '#27a048', fontWeight: 600 }}>✓ {totalSalvos} salvo{totalSalvos > 1 ? 's' : ''}</span>}
              {totalErros   > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>✗ {totalErros} erro{totalErros > 1 ? 's' : ''}</span>}
              {totalAguardando > 0 && !processando && <span style={{ color: '#9ca3af' }}>{totalAguardando} aguardando</span>}
            </div>
          </div>
        )}

        {/* Estado inicial vazio */}
        {fila.length === 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {Object.entries(TIPO_INFO).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: v.bg, borderRadius: 99 }}>
                <span style={{ fontSize: 13 }}>{v.icone}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: v.cor }}>{v.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2px solid #d1d5db', borderTopColor: '#185FA5',
      borderRadius: '50%', animation: 'spin .7s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </span>
  )
}
