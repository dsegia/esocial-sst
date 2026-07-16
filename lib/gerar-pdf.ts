// lib/gerar-pdf.ts
// Geração de PDF para ASO, LTCAT e PCMSO usando jsPDF

import {
  TEXTOS_LEGAIS_PGR, TEXTO_PLANO_EMERGENCIA, QUADRO2_INTERPRETACAO, QUADRO4_SEVERIDADE,
  PROBABILIDADE_OPCOES, SEVERIDADE_OPCOES, ESTIMATIVA_OPCOES, nivelRisco, calcularIQCT, IQCT_EXPLICACAO,
  DEFINICOES_PGR, CRITERIOS_GRADACAO_INTRO, TABELA_PROBABILIDADE_QUANTITATIVA,
  TABELA_PROBABILIDADE_QUALITATIVA_QUIMICOS, TABELA_PROBABILIDADE_QUALITATIVA_GERAL, NOTAS_PROBABILIDADE,
  TABELA_SEVERIDADE_REFERENCIA, NOTAS_SEVERIDADE, TEXTO_MATRIZ_RISCO, TabelaGraduacao,
} from './pgr-conteudo'
import { TEXTOS_LEGAIS_AET } from './aet-conteudo'
import { TEXTOS_LEGAIS_LTCAT, METODOLOGIAS_RISCO } from './ltcat-conteudo'
import { ANEXO_IV_AGENTES } from './ltcat-anexo-iv'
import { TEXTOS_LEGAIS_PCMSO } from './pcmso-conteudo'
import { SECOES_PCMSO } from './pcmso-conteudo-completo'
import { TIPOS_CONSULTA } from './pcmso-exames'
import { TEXTOS_LEGAIS_LIP } from './lip-conteudo'
import { TEXTOS_LEGAIS_PPP } from './ppp-conteudo'

// Reserva uma aba em branco de forma síncrona, ainda dentro do gesto de clique
// do usuário — chamar window.open() depois de qualquer await (import do jsPDF,
// carregamento de imagens etc.) arrisca ser bloqueado como pop-up pelo
// navegador. Use o retorno como `abaReservada` em abrirPdfEmNovaAba().
function reservarAbaPdf(): Window | null {
  if (typeof window === 'undefined') return null
  try { return window.open('', '_blank') } catch { return null }
}

// Abre o PDF gerado numa aba do navegador (em vez de baixar direto), para o
// usuário revisar o documento inteiro — paginação, espaçamentos, quebras —
// antes de enviar ao cliente. Se a aba não pôde ser aberta (pop-up bloqueado),
// cai para o download direto de sempre.
function abrirPdfEmNovaAba(doc: any, nomeArquivo: string, abaReservada: Window | null) {
  try { doc.setProperties({ title: nomeArquivo.replace(/\.pdf$/i, '') }) } catch { /* metadado opcional */ }
  if (!abaReservada || abaReservada.closed) { doc.save(nomeArquivo); return }
  const url = URL.createObjectURL(doc.output('blob'))
  abaReservada.location.href = url
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

// Bloco de assinaturas empilhado — primeiro o responsável pela implementação
// (representante legal da empresa), depois o responsável técnico pela
// elaboração — cada um com título, descrição da responsabilidade, espaço em
// branco para a assinatura física e, por fim, linha + nome + cargo/registro.
// Usado ao final de todos os documentos técnico-jurídicos (PGR, LTCAT,
// PCMSO, AET, LIP, PPP).
function desenharAssinaturas(
  doc: any, y: number, mg: number, W: number,
  respImplementacao: { tituloBloco: string; descricao: string; nome?: string },
  respElaboracao: { tituloBloco: string; descricao: string; nome?: string; cargo: string; extra?: string }
): number {
  if (y > 140) { doc.addPage(); y = 20 }
  const centerX = W / 2
  const larguraLinha = 80

  function bloco(tituloBloco: string, descricao: string, nome: string | undefined, cargoOuLabel: string, extra?: string) {
    if (y > 210) { doc.addPage(); y = 20 }
    doc.setFontSize(11); doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold')
    doc.text(tituloBloco, centerX, y, { align: 'center' }); y += 6
    doc.setFontSize(8); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'normal')
    const linhasDesc = doc.splitTextToSize(descricao, W - mg * 2 - 30)
    doc.text(linhasDesc, centerX, y, { align: 'center' }); y += linhasDesc.length * 4 + 18
    doc.setDrawColor(120)
    doc.line(centerX - larguraLinha / 2, y, centerX + larguraLinha / 2, y); y += 5
    doc.setFontSize(9); doc.setTextColor(20, 20, 20); doc.setFont('helvetica', 'bold')
    doc.text(nome || '—', centerX, y, { align: 'center' }); y += 4.5
    doc.setFontSize(8); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'normal')
    doc.text(cargoOuLabel, centerX, y, { align: 'center' }); y += 4
    if (extra) {
      doc.setFontSize(7.5); doc.setTextColor(100)
      doc.text(extra, centerX, y, { align: 'center' }); y += 4
    }
    y += 12
  }

  bloco(respImplementacao.tituloBloco, respImplementacao.descricao, respImplementacao.nome, 'Representante Legal')
  bloco(respElaboracao.tituloBloco, respElaboracao.descricao, respElaboracao.nome, respElaboracao.cargo, respElaboracao.extra)

  return y
}

export async function gerarPdfAso(dados: any, empresa?: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const W = 210
  const mg = 15
  const col = (W - mg * 2) / 2

  let y = 15

  function linha(yPos: number) {
    doc.setDrawColor(220, 220, 220)
    doc.line(mg, yPos, W - mg, yPos)
  }

  function titulo(texto: string, yPos: number): number {
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(texto.toUpperCase(), mg, yPos)
    return yPos + 4
  }

  function valor(texto: string, yPos: number, xPos = mg): number {
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'normal')
    doc.text(texto || '—', xPos, yPos)
    return yPos + 5
  }

  function secao(texto: string, yPos: number): number {
    doc.setFillColor(24, 95, 165)
    doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30)
    return yPos + 10
  }

  // ── Cabeçalho ──────────────────────────────────────────────
  doc.setFillColor(24, 95, 165)
  doc.rect(0, 0, W, 20, 'F')
  if (empresa?.logo_url) {
    try { doc.addImage(empresa.logo_url, 'JPEG', 2, 2, 16, 16) } catch { }
  }
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('ATESTADO DE SAÚDE OCUPACIONAL — ASO', W / 2, 9, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('NR-7 / Portaria MTE 3.214/78', W / 2, 15, { align: 'center' })

  y = 26

  // ── Dados do Funcionário ───────────────────────────────────
  y = secao('DADOS DO FUNCIONÁRIO / TRABALHADOR', y)
  const func = dados?.funcionario || {}

  y = titulo('NOME COMPLETO', y)
  y = valor(func.nome, y)

  const y1 = y
  y = titulo('CPF', y)
  y = valor(func.cpf, y)

  doc.setFontSize(7); doc.setTextColor(100); doc.text('DATA DE NASCIMENTO', mg + col + 5, y1)
  doc.setFontSize(10); doc.setTextColor(30)
  doc.text(func.data_nasc ? new Date(func.data_nasc + 'T00:00').toLocaleDateString('pt-BR') : '—', mg + col + 5, y1 + 4)

  linha(y + 1); y += 4

  const y2 = y
  y = titulo('FUNÇÃO / CARGO', y)
  y = valor(func.funcao, y)
  doc.setFontSize(7); doc.setTextColor(100); doc.text('SETOR', mg + col + 5, y2)
  doc.setFontSize(10); doc.setTextColor(30)
  doc.text(func.setor || '—', mg + col + 5, y2 + 4)

  linha(y + 1); y += 4

  const y3 = y
  y = titulo('DATA DE ADMISSÃO', y)
  y = valor(func.data_adm ? new Date(func.data_adm + 'T00:00').toLocaleDateString('pt-BR') : '—', y)
  doc.setFontSize(7); doc.setTextColor(100); doc.text('MATRÍCULA', mg + col + 5, y3)
  doc.setFontSize(10); doc.setTextColor(30)
  doc.text(func.matricula || '—', mg + col + 5, y3 + 4)

  linha(y + 1); y += 6

  // ── ASO ────────────────────────────────────────────────────
  y = secao('DADOS DO EXAME OCUPACIONAL', y)
  const aso = dados?.aso || {}

  const TIPO_ASO: Record<string, string> = {
    admissional: 'Admissional', periodico: 'Periódico', retorno: 'Retorno ao Trabalho',
    mudanca: 'Mudança de Função', demissional: 'Demissional', monitoracao: 'Monitoração Pontual',
  }

  const y4 = y
  y = titulo('TIPO DE EXAME', y)
  y = valor(TIPO_ASO[aso.tipo_aso] || aso.tipo_aso || '—', y)
  doc.setFontSize(7); doc.setTextColor(100); doc.text('DATA DO EXAME', mg + col + 5, y4)
  doc.setFontSize(10); doc.setTextColor(30)
  doc.text(aso.data_exame ? new Date(aso.data_exame + 'T00:00').toLocaleDateString('pt-BR') : '—', mg + col + 5, y4 + 4)

  linha(y + 1); y += 4

  const y5 = y
  y = titulo('PRÓXIMO EXAME', y)
  y = valor(aso.prox_exame ? new Date(aso.prox_exame + 'T00:00').toLocaleDateString('pt-BR') : '—', y)

  const CONCLUSAO: Record<string, string> = { apto: 'APTO', inapto: 'INAPTO', apto_restricao: 'APTO COM RESTRIÇÃO' }
  const conclusao = CONCLUSAO[aso.conclusao] || aso.conclusao || 'APTO'
  const corConclusao = aso.conclusao === 'inapto' ? [220, 38, 38] : aso.conclusao === 'apto_restricao' ? [180, 100, 0] : [39, 80, 10]

  doc.setFontSize(7); doc.setTextColor(100); doc.text('CONCLUSÃO', mg + col + 5, y5)
  doc.setFontSize(12); doc.setFont('helvetica', 'bold')
  doc.setTextColor(corConclusao[0], corConclusao[1], corConclusao[2])
  doc.text(conclusao, mg + col + 5, y5 + 5)
  doc.setFont('helvetica', 'normal')

  linha(y + 1); y += 6

  // ── Exames realizados ──────────────────────────────────────
  if (dados?.exames?.length) {
    y = secao('EXAMES REALIZADOS', y)
    for (let i = 0; i < dados.exames.length && y < 240; i++) {
      const ex = dados.exames[i]
      const nome = typeof ex === 'string' ? ex : ex.nome
      const resultado = typeof ex === 'object' ? ex.resultado : ''
      doc.setFontSize(9); doc.setTextColor(30); doc.setFont('helvetica', 'normal')
      doc.text(`• ${nome}`, mg + 2, y)
      if (resultado) {
        const corR = resultado.toLowerCase().includes('alter') ? [220, 38, 38] : [39, 80, 10]
        doc.setTextColor(corR[0], corR[1], corR[2])
        doc.text(resultado, W - mg - 2, y, { align: 'right' })
      }
      doc.setTextColor(30)
      y += 5
    }
    y += 2
  }

  // ── Riscos ─────────────────────────────────────────────────
  if (dados?.riscos?.length) {
    if (y > 230) { doc.addPage(); y = 20 }
    y = secao('FATORES DE RISCO OCUPACIONAL', y)
    const cols = 2
    const rw = (W - mg * 2 - 5) / cols
    for (let i = 0; i < dados.riscos.length && y < 265; i++) {
      const r = typeof dados.riscos[i] === 'string' ? dados.riscos[i] : dados.riscos[i]?.nome || ''
      const x = mg + 2 + (i % cols) * (rw + 5)
      if (i % cols === 0 && i > 0) y += 5
      doc.setFontSize(9); doc.setTextColor(30)
      doc.text(`• ${r}`, x, y)
    }
    if (dados.riscos.length % cols !== 0) y += 5
    y += 4
  }

  // ── Médico ─────────────────────────────────────────────────
  if (y > 230) { doc.addPage(); y = 20 }
  y = secao('RESPONSÁVEL TÉCNICO', y)
  const y6 = y
  y = titulo('MÉDICO EXAMINADOR', y)
  y = valor(aso.medico_nome || '—', y)
  doc.setFontSize(7); doc.setTextColor(100); doc.text('CRM', mg + col + 5, y6)
  doc.setFontSize(10); doc.setTextColor(30)
  doc.text(aso.medico_crm ? `CRM ${aso.medico_crm}` : '—', mg + col + 5, y6 + 4)

  y += 6
  linha(y); y += 8

  // Assinatura
  const xMed = W / 2
  doc.line(xMed - 35, y, xMed + 35, y)
  y += 4
  doc.setFontSize(8); doc.setTextColor(80)
  doc.text('Assinatura e carimbo do médico examinador', xMed, y, { align: 'center' })
  y += 8
  linha(y); y += 8
  doc.line(mg + 10, y, mg + 80, y)
  doc.line(W - mg - 80, y, W - mg - 10, y)
  y += 4
  doc.setFontSize(8)
  doc.text('Assinatura do empregado', mg + 45, y, { align: 'center' })
  doc.text('Assinatura do empregador', W - mg - 45, y, { align: 'center' })

  // Rodapé
  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const nome = dados?.funcionario?.nome?.replace(/\s+/g, '_') || 'funcionario'
  const data = dados?.aso?.data_exame || new Date().toISOString().split('T')[0]
  abrirPdfEmNovaAba(doc, `ASO_${nome}_${data}.pdf`, _pdfTab)
}

export async function gerarPdfLtcat(dados: any, empresa: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const H = 297; const mg = 15
  let y = 15
  const paginas: any = { capa: 1 }
  const tipoMap: Record<string, string> = { fis: 'Físico', qui: 'Químico', bio: 'Biológico', erg: 'Ergonômico' }
  const categoriaMap: Record<string, string> = { quimico: 'Químico', fisico: 'Físico', biologico: 'Biológico', associacao: 'Associação' }

  function hexRgb(hex: string): [number, number, number] {
    const h = (hex || '#999999').replace('#', '')
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)]
  }
  function linha(yPos: number) {
    doc.setDrawColor(220, 220, 220)
    doc.line(mg, yPos, W - mg, yPos)
  }
  function secao(texto: string, yPos: number): number {
    doc.setFillColor(24, 95, 165)
    doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 10
  }
  function subSecao(texto: string, yPos: number): number {
    if (yPos > H - 22) { doc.addPage(); yPos = 20 }
    doc.setFontSize(10); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg, yPos)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 6
  }
  function campo(label: string, valor: string, xPos: number, yPos: number, largura: number): number {
    doc.setFontSize(7); doc.setTextColor(100); doc.text(label.toUpperCase(), xPos, yPos)
    doc.setFontSize(10); doc.setTextColor(30)
    const linhas = doc.splitTextToSize(valor || '—', largura - 2)
    doc.text(linhas, xPos, yPos + 4)
    return yPos + 4 + linhas.length * 5
  }
  function linhaDupla(labelA: string, valA: string, labelB: string, valB: string, yPos: number, larguraTotal: number): number {
    const colW = larguraTotal / 2 - 3
    const yA = campo(labelA, valA, mg, yPos, colW)
    const yB = campo(labelB, valB, mg + larguraTotal / 2 + 3, yPos, colW)
    return Math.max(yA, yB)
  }
  function paragrafo(texto: string, yPos: number, tamanho = 9): number {
    doc.setFontSize(tamanho); doc.setTextColor(50)
    const linhas = doc.splitTextToSize(texto, W - mg * 2)
    let yy = yPos
    for (const ln of linhas) {
      if (yy > 278) { doc.addPage(); yy = 20 }
      doc.text(ln, mg, yy)
      yy += 4.3
    }
    return yy + 2
  }
  function tabela(
    colunas: { titulo: string; largura: number }[],
    linhas: string[][],
    yPos: number,
    estiloCelula?: (li: number, ci: number) => { bg?: [number, number, number]; texto?: [number, number, number] } | null,
  ): number {
    const larguraTotal = colunas.reduce((s, c) => s + c.largura, 0)
    function cabecalho(yy: number) {
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold')
      const linhasCab = colunas.map(c => doc.splitTextToSize(c.titulo, c.largura - 3))
      const maxLinhasCab = Math.max(...linhasCab.map((l: string[]) => l.length), 1)
      const alturaCab = maxLinhasCab * 3 + 3
      doc.setFillColor(24, 95, 165)
      doc.rect(mg, yy, larguraTotal, alturaCab, 'F')
      doc.setTextColor(255, 255, 255)
      let xx = mg
      for (let ci = 0; ci < colunas.length; ci++) { doc.text(linhasCab[ci], xx + 1.5, yy + 2.9); xx += colunas[ci].largura }
      doc.setFont('helvetica', 'normal')
      return yy + alturaCab
    }
    if (yPos > H - 32) { doc.addPage(); yPos = 20 }
    let yy = cabecalho(yPos)
    for (let li = 0; li < linhas.length; li++) {
      const linhaAtual = linhas[li]
      const celulas = linhaAtual.map((texto, ci) => doc.splitTextToSize(texto || '—', colunas[ci].largura - 3))
      const maxLinhas = Math.max(...celulas.map((c: string[]) => c.length), 1)
      const alturaLinha = maxLinhas * 3.6 + 3
      if (yy + alturaLinha > H - 12) { doc.addPage(); yy = cabecalho(20) }
      let x = mg
      for (let ci = 0; ci < colunas.length; ci++) {
        const estilo = estiloCelula?.(li, ci)
        if (estilo?.bg) { doc.setFillColor(estilo.bg[0], estilo.bg[1], estilo.bg[2]); doc.rect(x, yy, colunas[ci].largura, alturaLinha - 1, 'F') }
        doc.setFontSize(7.5)
        const cortxt = estilo?.texto || [50, 50, 50]
        doc.setTextColor(cortxt[0], cortxt[1], cortxt[2])
        doc.setFont('helvetica', estilo?.bg ? 'bold' : 'normal')
        doc.text(celulas[ci], x + 1.5, yy + 3.2)
        x += colunas[ci].largura
      }
      doc.setFont('helvetica', 'normal')
      doc.setDrawColor(230); doc.line(mg, yy + alturaLinha - 1, mg + larguraTotal, yy + alturaLinha - 1)
      yy += alturaLinha
    }
    return yy + 3
  }

  const dg = dados?.dados_gerais || {}
  const ghes = dados?.ghes || []
  const fmtData = (d: string) => d ? new Date(d + 'T00:00').toLocaleDateString('pt-BR') : '—'

  // ── PÁGINA 1: CAPA PROFISSIONAL ──────────────────────
  // Logo grande e centralizada no topo, nome do documento logo abaixo dela e,
  // por fim, o nome da empresa em destaque.
  y = 20
  if (empresa?.logo_url) {
    const logoLado = 40
    try { doc.addImage(empresa.logo_url, 'JPEG', (W - logoLado) / 2, y, logoLado, logoLado) } catch { }
    y += logoLado + 10
  } else {
    y += 6
  }
  doc.setFont('helvetica', 'bold'); doc.setTextColor(24, 95, 165)
  doc.setFontSize(18)
  const linhasTituloLtcat = doc.splitTextToSize('LAUDO TÉCNICO DAS CONDIÇÕES AMBIENTAIS DO TRABALHO', W - 50)
  doc.text(linhasTituloLtcat, W / 2, y, { align: 'center' })
  y += linhasTituloLtcat.length * 7.5 + 3
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(90)
  doc.text('LTCAT — Lei 8.213/91 Art. 58 / Decreto 3.048/99 Art. 68 / NR-15', W / 2, y, { align: 'center' }); y += 5.5
  doc.setFontSize(8.5); doc.setTextColor(120)
  doc.text('Base para o PPP e para o evento S-2240 do eSocial', W / 2, y, { align: 'center' }); y += 14
  doc.setDrawColor(220); doc.line(W / 2 - 30, y, W / 2 + 30, y); y += 14

  doc.setFont('helvetica', 'bold')
  let nomeFontSize = 22
  doc.setFontSize(nomeFontSize)
  const nomeEmpresaTxt = empresa?.razao_social || 'EMPRESA'
  while (doc.getTextWidth(nomeEmpresaTxt) > (W - 40) && nomeFontSize > 13) {
    nomeFontSize -= 1
    doc.setFontSize(nomeFontSize)
  }
  doc.setTextColor(24, 95, 165)
  doc.text(nomeEmpresaTxt, W / 2, y, { align: 'center' }); y += 10
  doc.setFontSize(10); doc.setTextColor(80); doc.setFont('helvetica', 'normal')
  doc.text(`CNPJ: ${empresa?.cnpj || '—'}`, W / 2, y, { align: 'center' }); y += 22

  doc.setFontSize(11); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
  doc.text('Dados do Documento', mg, y); y += 8
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(50)
  doc.text(`Data de Emissão: ${fmtData(dg.data_emissao)}`, mg, y); y += 5
  doc.text(`Início da Vigência: ${fmtData(dg.data_vigencia)}`, mg, y); y += 5
  doc.text(`Revisar até: ${fmtData(dg.prox_revisao)}`, mg, y); y += 5
  doc.text(`Grupos Homogêneos de Exposição avaliados: ${ghes.length}`, mg, y); y += 15

  doc.setFontSize(11); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
  doc.text('Responsáveis', mg, y); y += 8
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(50)
  doc.text(`Responsável Técnico: ${dg.resp_nome || '—'} (${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''})`.trim(), mg, y); y += 5
  doc.text(`Representante Legal: ${empresa?.resp_nome || '—'}`, mg, y); y += 15

  y += 20
  doc.setFontSize(8); doc.setTextColor(120); doc.setFont('helvetica', 'italic')
  doc.text('Este documento é confidencial e de uso exclusivo da empresa acima identificada.', W / 2, y, { align: 'center' })

  paginas.capa = 1

  // ── PÁGINA 2: CONTRACAPA — IDENTIFICAÇÃO COMPLETA DA EMPRESA (fonte única) ─
  doc.addPage()
  y = 20
  y = secao('IDENTIFICAÇÃO DA EMPRESA', y)
  const yw = (W - mg * 2)
  y = linhaDupla('Razão Social', empresa?.razao_social, 'Nome Fantasia', empresa?.nome_fantasia || '—', y, yw) + 3
  y = linhaDupla('CNPJ', empresa?.cnpj, 'Grau de Risco (NR-4)', `Classe ${empresa?.grau_risco != null ? empresa.grau_risco : '—'}`, y, yw) + 3
  y = linhaDupla('Inscrição Estadual', empresa?.inscricao_estadual || '—', 'Inscrição Municipal', empresa?.inscricao_municipal || '—', y, yw) + 3
  y = campo('CNAE', `${empresa?.cnae || '—'}${empresa?.cnae_descricao ? ' — ' + empresa.cnae_descricao : ''}`, mg, y, yw) + 3
  y = campo('Endereço', `${empresa?.endereco || '—'}${empresa?.municipio ? ', ' + empresa.municipio : ''}${empresa?.uf ? '/' + empresa.uf : ''}${empresa?.cep ? ' — ' + empresa.cep : ''}`, mg, y, yw) + 3
  y = linhaDupla('Telefone', empresa?.telefone || '—', 'E-mail', empresa?.email || '—', y, yw) + 3
  y = linhaDupla('Nº de Empregados', empresa?.numero_empregados != null ? String(empresa.numero_empregados) : '—', 'Horário de Funcionamento', empresa?.horario_funcionamento || '—', y, yw) + 5

  y = secao('RESPONSÁVEIS PELO LTCAT', y)
  y = campo('Responsável Legal (Implementação)', `${empresa?.resp_nome || '—'}${empresa?.resp_cargo ? ` — ${empresa.resp_cargo}` : ''}`, mg, y, yw) + 3
  y = campo('Responsável Técnico (Elaboração)', `${dg.resp_nome || '—'} — ${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}${dg.resp_cpf ? ` — CPF ${dg.resp_cpf}` : ''}`.trim(), mg, y, yw) + 3
  if (empresa?.resp_telefone || empresa?.resp_email) {
    y = campo('Contato', `${empresa?.resp_telefone || '—'} — ${empresa?.resp_email || '—'}`, mg, y, yw) + 3
  }

  paginas.contracapa = 2

  // ── PÁGINA 3: ÍNDICE (conteúdo preenchido só ao final, quando já se conhece a paginação real) ─
  doc.addPage()
  paginas.indice = (doc as any).internal.getNumberOfPages()

  // ── Textos legais (Lei 8.213/91, Decreto 3.048/99, NR-15) ─
  doc.addPage(); y = 20
  paginas.introducao = (doc as any).internal.getNumberOfPages()
  const textosCustomLtcat = dados?.textos_legais_custom || {}
  for (const secaoTexto of TEXTOS_LEGAIS_LTCAT) {
    if (y > 250) { doc.addPage(); y = 20 }
    y = secao(secaoTexto.titulo, y)
    const paragrafos = textosCustomLtcat[secaoTexto.titulo] || secaoTexto.paragrafos
    for (const p of paragrafos) y = paragrafo(p, y)
    y += 2
  }

  // ── QUADRO-RESUMO — ENQUADRAMENTO POR GHE ────────────
  doc.addPage(); y = 20
  paginas.resumo = (doc as any).internal.getNumberOfPages()
  y = secao(`QUADRO-RESUMO — ENQUADRAMENTO POR GHE (${ghes.length})`, y)
  if (ghes.length) {
    y = tabela(
      [
        { titulo: 'GHE', largura: 42 },
        { titulo: 'SETOR', largura: 34 },
        { titulo: 'TRABALHADORES', largura: 22 },
        { titulo: 'PRINCIPAIS AGENTES', largura: 52 },
        { titulo: 'APOSENT. ESPECIAL', largura: 30 },
      ],
      ghes.map((g: any) => [
        g.nome || '—',
        g.setor || '—',
        String(g.qtd_trabalhadores || '—'),
        (g.agentes || []).map((a: any) => a.nome).filter(Boolean).join(', ') || 'Nenhum identificado',
        g.aposentadoria_especial ? 'SIM' : 'NÃO',
      ]),
      y,
      (li, ci) => {
        if (ci !== 4) return null
        return ghes[li]?.aposentadoria_especial
          ? { bg: [252, 235, 235], texto: [121, 31, 31] }
          : { bg: [234, 243, 222], texto: [39, 80, 10] }
      },
    )
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum GHE cadastrado.', mg + 2, y); y += 6
  }

  // ── GRUPOS HOMOGÊNEOS DE EXPOSIÇÃO — DETALHAMENTO ────
  function opcaoGfip(ghe: any): string {
    if (!ghe.aposentadoria_especial) return '01 — Não ensejador de aposentadoria especial'
    const tempos = (ghe.agentes || [])
      .map((a: any) => ANEXO_IV_AGENTES.find(av => av.codigo === a.codigo_t24)?.tempoExposicaoAnos)
      .filter((t: any) => t != null)
    if (!tempos.length) return '02, 03 ou 04 — conforme o agente nocivo caracterizador (ver Anexo — Agentes Nocivos)'
    const tempoMinimo = Math.min(...tempos)
    const porTempo: Record<number, string> = {
      15: '02 — Ensejador de aposentadoria especial aos 15 anos (alíquota suplementar 12%)',
      20: '03 — Ensejador de aposentadoria especial aos 20 anos (alíquota suplementar 9%)',
      25: '04 — Ensejador de aposentadoria especial aos 25 anos (alíquota suplementar 6%)',
    }
    return porTempo[tempoMinimo] || '02, 03 ou 04 — conforme o agente nocivo caracterizador (ver Anexo — Agentes Nocivos)'
  }

  doc.addPage(); y = 20
  paginas.ghes = (doc as any).internal.getNumberOfPages()
  y = secao('DESCRIÇÃO DOS SETORES E CARGOS, RECONHECIMENTO DOS RISCOS AMBIENTAIS E CONCLUSÕES', y)
  y = paragrafo('Para cada Grupo Homogêneo de Exposição (GHE) identificado, este laudo apresenta os setores e cargos vinculados, os agentes nocivos reconhecidos com sua respectiva metodologia de avaliação, os equipamentos de proteção adotados e a conclusão técnica quanto à periculosidade, à insalubridade e à aposentadoria especial.', y, 8.5)
  y += 2

  for (let gi = 0; gi < ghes.length; gi++) {
    const ghe = ghes[gi]
    if (y > 245) { doc.addPage(); y = 20 }
    y = subSecao(`GHE ${gi + 1}: ${ghe.nome || '—'}`, y)

    campo('Setor', ghe.setor, mg, y, (W - mg * 2) / 2)
    campo('Qtd. Trabalhadores', String(ghe.qtd_trabalhadores || '—'), mg + (W - mg * 2) / 2 + 5, y, (W - mg * 2) / 2 - 5)
    y += 10

    const colConclusao = (W - mg * 2 - 15) / 4
    campo('Opção GFIP / Tabela 24', opcaoGfip(ghe), mg, y, colConclusao)
    campo('Periculosidade', ghe.periculosidade ? 'Sim' : 'Não', mg + colConclusao + 5, y, colConclusao)
    campo('Insalubridade', ghe.insalubridade ? 'Sim' : 'Não', mg + (colConclusao + 5) * 2, y, colConclusao)
    campo('Aposentadoria Especial', ghe.aposentadoria_especial ? 'Sim' : 'Não', mg + (colConclusao + 5) * 3, y, colConclusao)
    y += 12

    if (ghe.funcoes?.length) {
      doc.setFontSize(7); doc.setTextColor(100); doc.text('FUNÇÕES/CARGOS VINCULADOS', mg, y); y += 4
      doc.setFontSize(9); doc.setTextColor(30)
      const linhasFunc = doc.splitTextToSize(ghe.funcoes.join(' • '), W - mg * 2 - 2)
      doc.text(linhasFunc, mg, y); y += linhasFunc.length * 4 + 3
    }

    if (ghe.agentes?.length) {
      y = tabela(
        [
          { titulo: 'TIPO', largura: 18 },
          { titulo: 'AGENTE NOCIVO', largura: 44 },
          { titulo: 'METODOLOGIA', largura: 24 },
          { titulo: 'VALOR MEDIDO', largura: 24 },
          { titulo: 'LIMITE DE TOLERÂNCIA', largura: 24 },
          { titulo: 'SUPERA LT', largura: 16 },
          { titulo: 'CÓD. ESOCIAL (T24)', largura: 18 },
        ],
        ghe.agentes.map((a: any) => [
          tipoMap[a.tipo] || a.tipo || '—',
          a.nome || '—',
          a.medicao_quantitativa ? `Quantitativa${a.metodologia ? ` (${a.metodologia})` : ''}` : 'Qualitativa',
          a.medicao_quantitativa && a.valor ? `${a.valor}${a.unidade ? ' ' + a.unidade : ''}` : '—',
          a.limite || '—',
          a.supera_lt ? 'Sim' : 'Não',
          a.codigo_t24 || '—',
        ]),
        y,
        (li, ci) => {
          if (ci !== 5) return null
          return ghe.agentes[li]?.supera_lt
            ? { bg: [252, 235, 235], texto: [121, 31, 31] }
            : { bg: [234, 243, 222], texto: [39, 80, 10] }
        },
      )

      const agentesComDanos = ghe.agentes.filter((a: any) => a.danos_saude)
      if (agentesComDanos.length) {
        doc.setFontSize(7); doc.setTextColor(100); doc.setFont('helvetica', 'bold')
        doc.text('DANOS À SAÚDE POR AGENTE', mg, y); y += 4
        doc.setFont('helvetica', 'normal')
        for (const a of agentesComDanos) {
          if (y > 270) { doc.addPage(); y = 20 }
          doc.setFontSize(8); doc.setTextColor(30)
          const linhasDano = doc.splitTextToSize(`${a.nome}: ${a.danos_saude}`, W - mg * 2 - 4)
          doc.text(linhasDano, mg + 2, y); y += linhasDano.length * 4 + 1
        }
        y += 2
      }
    } else {
      doc.setFontSize(9); doc.setTextColor(39, 80, 10)
      doc.text('Sem agentes de risco significativos identificados neste GHE.', mg + 2, y); y += 6
    }

    // ── Metodologia e recomendações por tipo de agente presente no GHE ──
    const tiposPresentes = Array.from(new Set((ghe.agentes || []).map((a: any) => a.tipo))).filter(
      (t: any) => t && METODOLOGIAS_RISCO[t as keyof typeof METODOLOGIAS_RISCO],
    ) as Array<keyof typeof METODOLOGIAS_RISCO>
    for (const tipo of tiposPresentes) {
      const met = METODOLOGIAS_RISCO[tipo]
      if (y > 255) { doc.addPage(); y = 20 }
      doc.setFontSize(8); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
      doc.text(`METODOLOGIA — RISCO ${met.titulo.toUpperCase()}`, mg, y); y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8); doc.setTextColor(80); doc.setFont('helvetica', 'bold')
      doc.text('Metodologia:', mg, y)
      doc.setFont('helvetica', 'normal')
      const linhasMet = doc.splitTextToSize(met.metodologia, W - mg * 2 - 22)
      doc.text(linhasMet, mg + 22, y); y += linhasMet.length * 4.3 + 2
      doc.setFontSize(8); doc.setTextColor(80); doc.setFont('helvetica', 'bold')
      doc.text('Recomendações:', mg, y); y += 4.3
      y = paragrafo(met.recomendacoes, y, 8)
      y += 1
    }

    if (ghe.epc?.length) {
      y = tabela(
        [{ titulo: 'EQUIPAMENTO DE PROTEÇÃO COLETIVA (EPC)', largura: 130 }, { titulo: 'EFICÁCIA', largura: 50 }],
        ghe.epc.map((e: any) => [e.nome || '—', e.eficaz === false ? 'Ineficaz' : 'Eficaz']),
        y,
      )
    }
    if (ghe.epi?.length) {
      y = tabela(
        [{ titulo: 'EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL (EPI)', largura: 100 }, { titulo: 'C.A.', largura: 30 }, { titulo: 'EFICÁCIA', largura: 50 }],
        ghe.epi.map((e: any) => [e.nome || '—', e.ca || '—', e.eficaz === false ? 'Ineficaz' : 'Eficaz']),
        y,
      )
    }

    // ── Parecer técnico conclusivo do GHE ──────────────
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFontSize(8); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
    doc.text('PARECER TÉCNICO E ENQUADRAMENTO PREVIDENCIÁRIO', mg, y); y += 5
    doc.setFont('helvetica', 'normal')
    const agentesSuperamLT = (ghe.agentes || []).filter((a: any) => a.supera_lt).map((a: any) => a.nome).filter(Boolean)
    const nomesAgentes = agentesSuperamLT.length ? agentesSuperamLT.join(', ') : (ghe.agentes || []).map((a: any) => a.nome).filter(Boolean).join(', ')
    const parecer = ghe.aposentadoria_especial
      ? `Com base na avaliação técnica realizada, os trabalhadores deste GHE encontram-se expostos, de forma habitual e permanente, a agente(s) nocivo(s) constante(s) do Anexo IV do Decreto nº 3.048/99${nomesAgentes ? ` (${nomesAgentes})` : ''}, sem neutralização comprovada por EPI eficaz (observada a exceção legal do agente ruído, quando aplicável). Este GHE enseja o reconhecimento de tempo de trabalho especial para fins de aposentadoria especial, devendo o(s) código(s) do(s) agente(s) nocivo(s) constante(s) da Tabela 24 do eSocial ser informado(s) no evento S-2240 e no PPP dos trabalhadores vinculados.`
      : `Não foi identificada, neste GHE, exposição habitual e permanente a agente nocivo constante do Anexo IV do Decreto nº 3.048/99 em intensidade ou concentração capaz de ensejar aposentadoria especial, ou a exposição identificada foi neutralizada por EPI comprovadamente eficaz. Código de enquadramento sugerido para o evento S-2240 do eSocial: Tabela 24 — código 01 (não ensejador de aposentadoria especial).`
    y = paragrafo(parecer, y, 8.5)
    y += 3; linha(y); y += 6
  }

  if (ghes.length === 0) {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum GHE cadastrado neste laudo.', mg + 2, y); y += 6
  }

  // ── ANEXO — RELAÇÃO DE AGENTES NOCIVOS DO ANEXO IV DO DECRETO 3.048/99 ─
  doc.addPage(); y = 20
  paginas.anexoIV = (doc as any).internal.getNumberOfPages()
  y = secao('ANEXO — AGENTES NOCIVOS (DECRETO Nº 3.048/99, ANEXO IV)', y)
  y = paragrafo('Relação de referência dos agentes nocivos químicos, físicos e biológicos considerados para fins de concessão de aposentadoria especial, com o respectivo tempo mínimo de exposição habitual e permanente. As atividades exemplificativas são meramente ilustrativas, salvo para agentes biológicos, cuja relação é taxativa (art. 68, § 1º, do Decreto nº 3.048/99).', y, 8)
  y += 2
  y = tabela(
    [
      { titulo: 'CÓD.', largura: 16 },
      { titulo: 'AGENTE NOCIVO', largura: 54 },
      { titulo: 'CATEGORIA', largura: 24 },
      { titulo: 'TEMPO (ANOS)', largura: 20 },
      { titulo: 'ATIVIDADES EXEMPLIFICATIVAS', largura: 66 },
    ],
    ANEXO_IV_AGENTES.map(a => [
      a.codigo,
      a.nome,
      categoriaMap[a.categoria] || a.categoria,
      String(a.tempoExposicaoAnos),
      (a.atividadesExemplo || []).join('; ') || '—',
    ]),
    y,
  )

  // ── Assinaturas ───────────────────────────────────────
  if (y > 250) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  y = desenharAssinaturas(doc, y, mg, W,
    {
      tituloBloco: 'RESPONSÁVEL PELA IMPLEMENTAÇÃO DO LTCAT',
      descricao: 'Será responsável pelo cumprimento e implementação do LTCAT — Laudo Técnico das Condições Ambientais de Trabalho, conforme NR-9.',
      nome: empresa?.resp_nome,
    },
    {
      tituloBloco: 'RESPONSÁVEL PELA ELABORAÇÃO DO LTCAT',
      descricao: 'Laudo Técnico das Condições Ambientais de Trabalho, conforme art. 58 da Lei nº 8.213/1991 e art. 68 do Decreto nº 3.048/99.',
      nome: dg.resp_nome,
      cargo: dg.resp_conselho === 'CRM' ? 'Médico do Trabalho' : 'Técnico/Engenheiro de Segurança do Trabalho',
      extra: `${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim() || undefined,
    }
  )

  // ── Preenche o Índice, agora que a paginação real do documento é conhecida ─
  doc.setPage(paginas.indice)
  let yIndice = 20
  yIndice = secao('ÍNDICE', yIndice)
  yIndice += 4
  const itensIndice: Array<[string, number | undefined]> = [
    ['Identificação da Empresa', paginas.contracapa],
    ['Introdução, Objetivos e Base Legal', paginas.introducao],
    ['Quadro-Resumo — Enquadramento por GHE', paginas.resumo],
    ['Descrição dos Setores e Cargos — Reconhecimento dos Riscos e Conclusões', paginas.ghes],
    ['Anexo — Agentes Nocivos (Decreto 3.048/99, Anexo IV)', paginas.anexoIV],
  ]
  doc.setFontSize(9); doc.setTextColor(30); doc.setFont('helvetica', 'normal')
  let numItemIndice = 1
  for (const [tituloItem, paginaItem] of itensIndice) {
    if (paginaItem == null) continue
    doc.text(`${numItemIndice}. ${tituloItem}`, mg, yIndice)
    doc.text(String(paginaItem), W - mg - 5, yIndice, { align: 'right' })
    yIndice += 6
    numItemIndice++
  }
  yIndice += 6; linha(yIndice); yIndice += 6
  doc.setFontSize(8); doc.setTextColor(100)
  doc.text(`Total de páginas: ${(doc as any).internal.getNumberOfPages()}`, mg, yIndice)

  // ── Rodapé ────────────────────────────────────────────
  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, H - 5)
    doc.text(`Página ${p}/${totalPags}`, W - mg, H - 5, { align: 'right' })
  }

  const data = dg.data_emissao || new Date().toISOString().split('T')[0]
  abrirPdfEmNovaAba(doc, `LTCAT_${empresa?.cnpj?.replace(/\D/g, '') || 'empresa'}_${data}.pdf`, _pdfTab)
}

export async function gerarPdfPcmso(dados: any, empresa: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const H = 297; const mg = 12
  let y = 15

  // Capa no mesmo padrão visual do PGR e do LTCAT: barra com logo + nome do
  // documento no topo, nome da empresa em destaque logo abaixo.
  function capa() {
    y = 20
    if (empresa?.logo_url) {
      const logoLado = 40
      try { doc.addImage(empresa.logo_url, 'JPEG', (W - logoLado) / 2, y, logoLado, logoLado) } catch { }
      y += logoLado + 10
    } else {
      y += 6
    }
    doc.setFont('helvetica', 'bold'); doc.setTextColor(24, 95, 165)
    doc.setFontSize(19)
    const linhasTituloPcmso = doc.splitTextToSize('PROGRAMA DE CONTROLE MÉDICO DE SAÚDE OCUPACIONAL', W - 50)
    doc.text(linhasTituloPcmso, W / 2, y, { align: 'center' })
    y += linhasTituloPcmso.length * 7.5 + 3
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(90)
    doc.text('PCMSO — NR-7 / Portaria MTE nº 3.214/78', W / 2, y, { align: 'center' }); y += 5.5
    doc.setFontSize(8.5); doc.setTextColor(120)
    doc.text('Base para o evento S-2220 do eSocial', W / 2, y, { align: 'center' }); y += 14
    doc.setDrawColor(220); doc.line(W / 2 - 30, y, W / 2 + 30, y); y += 14

    doc.setFont('helvetica', 'bold')
    let nomeFontSize = 22
    doc.setFontSize(nomeFontSize)
    const nomeEmpresaTxt = empresa?.razao_social || 'EMPRESA'
    while (doc.getTextWidth(nomeEmpresaTxt) > (W - 40) && nomeFontSize > 13) {
      nomeFontSize -= 1
      doc.setFontSize(nomeFontSize)
    }
    doc.setTextColor(24, 95, 165)
    doc.text(nomeEmpresaTxt, W / 2, y, { align: 'center' }); y += 10
    doc.setFontSize(10); doc.setTextColor(80); doc.setFont('helvetica', 'normal')
    doc.text(`CNPJ: ${empresa?.cnpj || '—'}`, W / 2, y, { align: 'center' }); y += 30

    doc.setFontSize(8); doc.setTextColor(120); doc.setFont('helvetica', 'italic')
    doc.text('Este documento é confidencial e de uso exclusivo da empresa acima identificada.', W / 2, y, { align: 'center' })

    doc.setFontSize(8); doc.setTextColor(160); doc.setFont('helvetica', 'normal')
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, W / 2, H - 15, { align: 'center' })

    doc.addPage()
    y = 20
  }

  function secaoHeader(texto: string, yPos: number): number {
    doc.setFillColor(24, 95, 165)
    doc.rect(mg, yPos, W - mg * 2, 8, 'F')
    doc.setFontSize(11); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 4, yPos + 5.5)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 12
  }

  function paragrafo(texto: string, yPos: number, tamanho = 10): number {
    doc.setFontSize(tamanho); doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal')
    const linhas = doc.splitTextToSize(texto, W - mg * 2)
    let yy = yPos
    for (const ln of linhas) {
      if (yy > 275) { doc.addPage(); yy = 20 }
      doc.text(ln, mg, yy)
      yy += 4.5
    }
    return yy + 3
  }

  function tabela(dados: string[][], titulo: string, yPos: number): number {
    if (yPos > 250) { doc.addPage(); yPos = 20 }
    let y = yPos
    if (titulo) {
      doc.setFontSize(9); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
      doc.text(titulo, mg, y)
      y += 7
    }

    const nCols = dados[0].length
    const larguraTotal = W - mg * 2
    const pesos = nCols === 2 ? [0.6, 0.4]
      : nCols === 3 ? [0.22, 0.39, 0.39]
      : Array(nCols).fill(1 / nCols)
    const colWidths = pesos.map(p => p * larguraTotal)

    // Header — divisórias brancas entre colunas pra não virar uma barra sólida,
    // e altura dinâmica pra cabeçalhos longos (ex.: "MONITORAMENTO RECOMENDADO")
    // não estourarem a caixa.
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    const headerLines = dados[0].map((h, i) => doc.splitTextToSize(h, colWidths[i] - 2))
    const headerHeight = Math.max(8, Math.max(...headerLines.map(l => l.length)) * 3.6 + 3)
    let xPos = mg
    for (let i = 0; i < nCols; i++) {
      doc.setFillColor(24, 95, 165)
      doc.setDrawColor(255, 255, 255)
      doc.rect(xPos, y, colWidths[i], headerHeight, 'FD')
      doc.text(headerLines[i], xPos + 1, y + 3.6)
      xPos += colWidths[i]
    }
    y += headerHeight + 2

    // Dados
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(40, 40, 40)
    for (let r = 1; r < dados.length && y < 265; r++) {
      let rowHeight = 6
      const cellLines = dados[r].map((cell, i) => doc.splitTextToSize(cell, colWidths[i] - 2))
      rowHeight = Math.max(6, Math.max(...cellLines.map(l => l.length)) * 4)

      if (r % 2 === 0) {
        doc.setFillColor(245, 248, 251)
        xPos = mg
        for (let i = 0; i < nCols; i++) {
          doc.rect(xPos, y - 0.5, colWidths[i], rowHeight, 'F')
          xPos += colWidths[i]
        }
      }

      doc.setDrawColor(200, 210, 220)
      xPos = mg
      for (let c = 0; c < dados[r].length; c++) {
        doc.rect(xPos, y - 0.5, colWidths[c], rowHeight)
        const lines = cellLines[c]
        doc.text(lines, xPos + 1, y + 2)
        xPos += colWidths[c]
      }
      y += rowHeight + 0.5
    }
    return y + 4
  }

  // Capa
  capa()

  // Dados empresa
  y = secaoHeader('DADOS DA EMPRESA', y)
  doc.setFillColor(245, 247, 250); doc.rect(mg, y, W - mg * 2, 70, 'F')
  doc.setFontSize(8); doc.setTextColor(100); doc.setFont('helvetica', 'bold')
  doc.text('RAZÃO SOCIAL:', mg + 2, y + 4)
  doc.setFontSize(10); doc.setTextColor(30); doc.setFont('helvetica', 'normal')
  doc.text(empresa?.razao_social || '—', mg + 2, y + 8)

  doc.setFontSize(7); doc.setTextColor(100); doc.setFont('helvetica', 'bold')
  doc.text(`CNPJ: ${empresa?.cnpj || '—'}`, mg + 2, y + 14)
  doc.text(`Município: ${empresa?.municipio || '—'} | UF: ${empresa?.uf || '—'}`, mg + 2, y + 18)
  doc.text(`Endereço: ${empresa?.endereco || '—'}`, mg + 2, y + 22)
  doc.text(`Telefone: ${empresa?.telefone || '—'} | Email: ${empresa?.email || '—'}`, mg + 2, y + 26)
  doc.text(`CNAE: ${empresa?.cnae || '—'} | Grau de Risco: ${empresa?.grau_risco || '—'}`, mg + 2, y + 30)

  doc.setFont('helvetica', 'bold')
  doc.text('REPRESENTANTE LEGAL:', mg + 2, y + 36); doc.text('MÉDICO COORDENADOR:', mg + 100, y + 36)
  doc.setFont('helvetica', 'normal')
  doc.text(empresa?.resp_nome || '—', mg + 2, y + 40)
  const dg = dados?.dados_gerais || {}
  doc.text(dg.medico_nome || '—', mg + 100, y + 40)
  doc.text(dg.medico_crm ? `CRM: ${dg.medico_crm}` : 'CRM: —', mg + 100, y + 44)

  y += 55

  // Telefones emergenciais — logo no início, pra ficar acessível sem precisar
  // folhear o documento inteiro numa emergência real.
  const telefonesEmergencia = dados?.telefones_emergencia || []
  if (telefonesEmergencia.length > 0) {
    if (y > 245) { doc.addPage(); y = 20 }
    y = secaoHeader('TELEFONES EMERGENCIAIS', y)
    const linhasTel = telefonesEmergencia.map((t: any) => [t.nome || '—', t.telefone || '—'])
    y = tabela([['CONTATO', 'TELEFONE'], ...linhasTel], '', y)
  }

  // Textos legais
  const textosCustom = dados?.textos_legais_custom || {}
  for (const sec of TEXTOS_LEGAIS_PCMSO) {
    if (y > 250) { doc.addPage(); y = 20 }
    y = secaoHeader(sec.titulo, y)
    const pars = textosCustom[sec.titulo] || sec.paragrafos
    for (const p of pars) y = paragrafo(p, y, 9)
    y += 3
  }

  if (y > 240) { doc.addPage(); y = 20 }

  // Quadro-resumo de funções — GHE, funções/cargos vinculados e descrição das
  // atividades, uma linha por função cadastrada no programa.
  const programas = dados?.programas || []
  const gheNomePorId = new Map((dados?.ghes || []).map((g: any) => [g.id, g.nome]))
  if (programas.length > 0) {
    if (y > 240) { doc.addPage(); y = 20 }
    y = secaoHeader('QUADRO DE FUNÇÕES', y)
    const linhasQuadro = programas.map((p: any) => [
      (p.ghe_id && gheNomePorId.get(p.ghe_id)) || p.setor || '—',
      (p.funcoes?.length ? p.funcoes.join(', ') : p.funcao) || '—',
      p.descricao_atividades || '—'
    ])
    y = tabela([['GHE', 'FUNÇÕES / CARGOS', 'DESCRIÇÃO DAS ATIVIDADES'], ...linhasQuadro], '', y)
    y += 4
  }

  // Programas por função
  const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPOS_CONSULTA.map(t => [t.key, t.label]))
  for (const prog of programas) {
    if (y > 245) { doc.addPage(); y = 20 }
    y = secaoHeader(`FUNÇÃO: ${prog.funcao || '—'}`, y)

    // Um exame pode estar vinculado a vários tipos de consulta (admissional,
    // periódico, etc.) — agrupa por nome pra não repetir a mesma linha uma vez
    // por tipo, como acontecia antes.
    const examesPorNome = new Map<string, Set<string>>()
    for (const e of (prog.exames || [])) {
      const nome = typeof e === 'string' ? e : (e.nome || '')
      if (!nome) continue
      if (!examesPorNome.has(nome)) examesPorNome.set(nome, new Set())
      const tipos: string[] = typeof e === 'string' ? [] : (e.tipos || [])
      const set = examesPorNome.get(nome)!
      if (tipos.length) tipos.forEach((t: string) => set.add(TIPO_LABEL[t] || t))
      else if (typeof e !== 'string' && e.periodicidade) set.add(e.periodicidade)
    }
    const exames = [...examesPorNome.entries()].map(([nome, tipos]) => [nome, [...tipos].join(', ') || '—'])
    if (exames.length > 0) {
      const tabDados = [['EXAME', 'TIPOS DE CONSULTA'], ...exames]
      y = tabela(tabDados, 'EXAMES PREVISTOS', y)
    }
  }

  if (y > 240) { doc.addPage(); y = 20 }

  // 16 Seções
  const secoesCust = dados?.secoes_custom || {}
  const secoesImg = dados?.secoes_imagens || {}
  for (const secaoItem of SECOES_PCMSO) {
    if (y > 245) { doc.addPage(); y = 20 }
    y = secaoHeader(secaoItem.titulo, y)

    // Renderiza imagem se houver
    if (secoesImg[secaoItem.id]) {
      try {
        if (y > 200) { doc.addPage(); y = 20 }
        doc.addImage(secoesImg[secaoItem.id], 'PNG', mg, y, 160, 100)
        y += 110
      } catch (e) {
        // Ignora erros ao carregar imagem
      }
    }

    const conteudo = secoesCust[secaoItem.id] || secaoItem.conteudo
    const temCustomizacao = !!secoesCust[secaoItem.id]

    // Se não tem customização, renderiza subsecoes e tabelas da estrutura original
    if (!temCustomizacao && secaoItem.subsecoes) {
      for (const sub of secaoItem.subsecoes) {
        if (y > 250) { doc.addPage(); y = 20 }
        y = secaoHeader('→ ' + sub.titulo, y)
        y = paragrafo(sub.conteudo, y, 9)
      }
    }

    // Renderiza conteúdo (customizado ou padrão)
    y = paragrafo(conteudo, y, 9)

    // Renderiza tabelas originais (sempre mostra, mesmo com customização)
    if (secaoItem.tabelas) {
      for (const tab of secaoItem.tabelas.slice(0, 2)) {
        if (y > 245) { doc.addPage(); y = 20 }
        y = tabela(tab.linhas, tab.titulo, y)
      }
    }
    y += 2
  }

  if (y > 250) { doc.addPage(); y = 20 }
  doc.setDrawColor(200, 200, 200); doc.line(mg, y, W - mg, y); y += 10

  y = desenharAssinaturas(doc, y, mg, W,
    { tituloBloco: 'RESPONSÁVEL PELA IMPLEMENTAÇÃO', descricao: 'Cumprimento do PCMSO conforme NR-7', nome: empresa?.resp_nome },
    { tituloBloco: 'RESPONSÁVEL PELA COORDENAÇÃO', descricao: 'Médico Coordenador', nome: dg.medico_nome, cargo: 'Médico Coordenador', extra: dg.medico_crm ? `CRM ${dg.medico_crm}` : undefined }
  )

  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 291)
    doc.text(`Pág. ${p}/${totalPags}`, W - mg, 291, { align: 'right' })
  }

  const data = dg.data_elaboracao || new Date().toISOString().split('T')[0]
  abrirPdfEmNovaAba(doc, `PCMSO_${empresa?.cnpj?.replace(/\D/g, '') || 'empresa'}_${data}.pdf`, _pdfTab)
}

export async function gerarPdfPgr(dados: any, empresa: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let W = 210, H = 297
  const mg = 15
  let y = 15
  const paginas: any = { capa: 1 }

  function hexRgb(hex: string): [number, number, number] {
    const h = (hex || '#999999').replace('#', '')
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)]
  }
  function linha(yPos: number) {
    doc.setDrawColor(220, 220, 220)
    doc.line(mg, yPos, W - mg, yPos)
  }
  function secao(texto: string, yPos: number): number {
    doc.setFillColor(24, 95, 165)
    doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 10
  }
  function subSecao(texto: string, yPos: number): number {
    if (yPos > H - 22) { doc.addPage(); yPos = 20 }
    doc.setFontSize(10); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg, yPos)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 6
  }
  function campo(label: string, valor: string, xPos: number, yPos: number, largura: number): number {
    doc.setFontSize(7); doc.setTextColor(100); doc.text(label.toUpperCase(), xPos, yPos)
    doc.setFontSize(10); doc.setTextColor(30)
    const linhas = doc.splitTextToSize(valor || '—', largura - 2)
    doc.text(linhas, xPos, yPos + 4)
    return yPos + 4 + linhas.length * 5
  }
  function paragrafo(texto: string, yPos: number, tamanho = 9): number {
    doc.setFontSize(tamanho); doc.setTextColor(50)
    const linhas = doc.splitTextToSize(texto, W - mg * 2)
    let yy = yPos
    for (const ln of linhas) {
      if (yy > H - 19) { doc.addPage(); yy = 20 }
      doc.text(ln, mg, yy)
      yy += 4.3
    }
    return yy + 2
  }
  function tabela(
    colunas: { titulo: string; largura: number }[],
    linhas: string[][],
    yPos: number,
    estiloCelula?: (li: number, ci: number) => { bg?: [number, number, number]; texto?: [number, number, number] } | null,
  ): number {
    const larguraTotal = colunas.reduce((s, c) => s + c.largura, 0)
    function cabecalho(yy: number) {
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold')
      const linhasCab = colunas.map(c => doc.splitTextToSize(c.titulo, c.largura - 3))
      const maxLinhasCab = Math.max(...linhasCab.map((l: string[]) => l.length), 1)
      const alturaCab = maxLinhasCab * 3 + 3
      doc.setFillColor(24, 95, 165)
      doc.rect(mg, yy, larguraTotal, alturaCab, 'F')
      doc.setTextColor(255, 255, 255)
      let xx = mg
      for (let ci = 0; ci < colunas.length; ci++) { doc.text(linhasCab[ci], xx + 1.5, yy + 2.9); xx += colunas[ci].largura }
      doc.setFont('helvetica', 'normal')
      return yy + alturaCab
    }
    if (yPos > H - 32) { doc.addPage(); yPos = 20 }
    let yy = cabecalho(yPos)
    for (let li = 0; li < linhas.length; li++) {
      const linha = linhas[li]
      const celulas = linha.map((texto, ci) => doc.splitTextToSize(texto || '—', colunas[ci].largura - 3))
      const maxLinhas = Math.max(...celulas.map((c: string[]) => c.length), 1)
      const alturaLinha = maxLinhas * 3.6 + 3
      if (yy + alturaLinha > H - 12) { doc.addPage(); yy = cabecalho(20) }
      let x = mg
      for (let ci = 0; ci < colunas.length; ci++) {
        const estilo = estiloCelula?.(li, ci)
        if (estilo?.bg) { doc.setFillColor(estilo.bg[0], estilo.bg[1], estilo.bg[2]); doc.rect(x, yy, colunas[ci].largura, alturaLinha - 1, 'F') }
        doc.setFontSize(7.5)
        const cortxt = estilo?.texto || [50, 50, 50]
        doc.setTextColor(cortxt[0], cortxt[1], cortxt[2])
        doc.setFont('helvetica', estilo?.bg ? 'bold' : 'normal')
        doc.text(celulas[ci], x + 1.5, yy + 3.2)
        x += colunas[ci].largura
      }
      doc.setFont('helvetica', 'normal')
      doc.setDrawColor(230); doc.line(mg, yy + alturaLinha - 1, mg + larguraTotal, yy + alturaLinha - 1)
      yy += alturaLinha
    }
    return yy + 3
  }
  function inserirImagens(imagens: string[], yPos: number, legendas?: (string | undefined)[]): number {
    if (!imagens?.length) return yPos
    const tam = 35, gap = 5
    const porLinha = Math.max(1, Math.floor((W - mg * 2 + gap) / (tam + gap)))
    let x = mg, yy = yPos
    for (let i = 0; i < imagens.length; i++) {
      if (i > 0 && i % porLinha === 0) { x = mg; yy += tam + (legendas ? 8 : 4) }
      if (yy + tam > H - 12) { doc.addPage(); yy = 20; x = mg }
      try { doc.addImage(imagens[i], 'JPEG', x, yy, tam, tam) } catch { /* imagem inválida, ignora */ }
      if (legendas?.[i]) {
        doc.setFontSize(7); doc.setTextColor(120)
        doc.text(doc.splitTextToSize(legendas[i] as string, tam), x, yy + tam + 3)
      }
      x += tam + gap
    }
    const linhas = Math.ceil(imagens.length / porLinha)
    return yPos + linhas * (tam + (legendas ? 8 : 4)) + 2
  }
  // Renderiza uma tabela de gradação de referência (título + subtítulo em itálico
  // + parágrafo introdutório opcional + tabela de colunas/linhas), usada nos
  // critérios técnicos de severidade/probabilidade (AIHA/Fundacentro).
  function tabelaGraduacao(tab: TabelaGraduacao, larguras: number[], yPos: number): number {
    let yy = subSecao(tab.titulo, yPos)
    if (tab.subtitulo) {
      doc.setFontSize(7.5); doc.setTextColor(120); doc.setFont('helvetica', 'italic')
      const linhasSub = doc.splitTextToSize(tab.subtitulo, W - mg * 2)
      doc.text(linhasSub, mg, yy); yy += linhasSub.length * 3.6 + 1.5
      doc.setFont('helvetica', 'normal')
    }
    if (tab.intro) yy = paragrafo(tab.intro, yy, 8)
    yy += 1
    yy = tabela(
      tab.colunas.map((titulo, i) => ({ titulo, largura: larguras[i] })),
      tab.linhas,
      yy,
    )
    return yy + 3
  }

  const dg = dados?.dados_gerais || {}
  const ambientes = dados?.ambientes || []
  const inventario = dados?.inventario || []
  const planoAcao = dados?.plano_acao || []
  const tipoMap: Record<string, string> = { fis: 'Físico', qui: 'Químico', bio: 'Biológico', erg: 'Ergonômico', aci: 'Mecânico/Acidentes', psi: 'Psicossocial' }

  function linhaDupla(labelA: string, valA: string, labelB: string, valB: string, yPos: number, larguraTotal: number): number {
    const colW = larguraTotal / 2 - 3
    const yA = campo(labelA, valA, mg, yPos, colW)
    const yB = campo(labelB, valB, mg + larguraTotal / 2 + 3, yPos, colW)
    return Math.max(yA, yB)
  }

  // ── PÁGINA 1: CAPA PROFISSIONAL ──────────────────────
  // Logo grande e centralizada no topo, nome do documento logo abaixo dela e,
  // por fim, o nome da empresa em destaque.
  y = 20
  if (empresa?.logo_url) {
    const logoLado = 40
    try { doc.addImage(empresa.logo_url, 'JPEG', (W - logoLado) / 2, y, logoLado, logoLado) } catch { }
    y += logoLado + 10
  } else {
    y += 6
  }
  doc.setFont('helvetica', 'bold'); doc.setTextColor(24, 95, 165)
  doc.setFontSize(19)
  const linhasTituloPgr = doc.splitTextToSize('PROGRAMA DE GERENCIAMENTO DE RISCOS', W - 50)
  doc.text(linhasTituloPgr, W / 2, y, { align: 'center' })
  y += linhasTituloPgr.length * 7.5 + 3
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(90)
  doc.text('PGR — NR-1 / Portaria SEPRT nº 6.730/2020', W / 2, y, { align: 'center' }); y += 5.5
  doc.setFontSize(8.5); doc.setTextColor(120)
  doc.text('Conforme Portaria 1.419/2024 (Vigência: 26/05/2026)', W / 2, y, { align: 'center' }); y += 14
  doc.setDrawColor(220); doc.line(W / 2 - 30, y, W / 2 + 30, y); y += 14

  doc.setFont('helvetica', 'bold')
  let nomeFontSize = 22
  doc.setFontSize(nomeFontSize)
  const nomeEmpresaTxt = empresa?.razao_social || 'EMPRESA'
  while (doc.getTextWidth(nomeEmpresaTxt) > (W - 40) && nomeFontSize > 13) {
    nomeFontSize -= 1
    doc.setFontSize(nomeFontSize)
  }
  doc.setTextColor(24, 95, 165)
  doc.text(nomeEmpresaTxt, W / 2, y, { align: 'center' }); y += 10
  doc.setFontSize(10); doc.setTextColor(80); doc.setFont('helvetica', 'normal')
  doc.text(`CNPJ: ${empresa?.cnpj || '—'}`, W / 2, y, { align: 'center' }); y += 22

  doc.setFontSize(11); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
  doc.text('Dados do Documento', mg, y); y += 8
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(50)
  doc.text(`Revisão: ${dg.numero_revisao || '1'}`, mg, y); y += 5
  doc.text(`Data de Elaboração: ${dg.data_elaboracao ? new Date(dg.data_elaboracao + 'T00:00').toLocaleDateString('pt-BR') : '—'}`, mg, y); y += 5
  doc.text(`Vigência: ${dg.data_elaboracao ? new Date(dg.data_elaboracao + 'T00:00').toLocaleDateString('pt-BR') : '—'}${dg.prox_revisao ? ` a ${new Date(dg.prox_revisao + 'T00:00').toLocaleDateString('pt-BR')}` : ''}`, mg, y); y += 5
  doc.text(`Status: ${dg.status || 'Ativo'}`, mg, y); y += 15

  doc.setFontSize(11); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
  doc.text('Responsáveis', mg, y); y += 8
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(50)
  doc.text(`Elaboração: ${dg.resp_nome || '—'} (${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''})`.trim(), mg, y); y += 5
  doc.text(`Representante Legal: ${empresa?.resp_nome || '—'}`, mg, y); y += 15

  y += 20
  doc.setFontSize(8); doc.setTextColor(120); doc.setFont('helvetica', 'italic')
  doc.text('Este documento é confidencial e de uso exclusivo da empresa acima identificada.', W / 2, y, { align: 'center' })

  paginas.capa = 1

  // ── PÁGINA 2: CONTRACAPA — IDENTIFICAÇÃO COMPLETA DA EMPRESA (fonte única) ─
  doc.addPage()
  y = 20
  y = secao('IDENTIFICAÇÃO DA EMPRESA', y)
  const yw = (W - mg * 2)
  y = linhaDupla('Razão Social', empresa?.razao_social, 'Nome Fantasia', empresa?.nome_fantasia || '—', y, yw) + 3
  y = linhaDupla('CNPJ', empresa?.cnpj, 'Grau de Risco (NR-4)', `Classe ${empresa?.grau_risco != null ? empresa.grau_risco : '—'}`, y, yw) + 3
  y = linhaDupla('Inscrição Estadual', empresa?.inscricao_estadual || '—', 'Inscrição Municipal', empresa?.inscricao_municipal || '—', y, yw) + 3
  y = campo('CNAE', `${empresa?.cnae || '—'}${empresa?.cnae_descricao ? ' — ' + empresa.cnae_descricao : ''}`, mg, y, yw) + 3
  y = campo('Endereço', `${empresa?.endereco || '—'}${empresa?.municipio ? ', ' + empresa.municipio : ''}${empresa?.uf ? '/' + empresa.uf : ''}${empresa?.cep ? ' — ' + empresa.cep : ''}`, mg, y, yw) + 3
  y = linhaDupla('Telefone', empresa?.telefone || '—', 'E-mail', empresa?.email || '—', y, yw) + 3
  y = linhaDupla('Nº de Empregados', empresa?.numero_empregados != null ? String(empresa.numero_empregados) : '—', 'Horário de Funcionamento', empresa?.horario_funcionamento || '—', y, yw) + 5

  y = secao('RESPONSÁVEIS PELO PGR', y)
  y = campo('Responsável Legal (Implementação)', `${empresa?.resp_nome || '—'}${empresa?.resp_cargo ? ` — ${empresa.resp_cargo}` : ''}`, mg, y, yw) + 3
  y = campo('Responsável Técnico (Elaboração)', `${dg.resp_nome || '—'} — ${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim(), mg, y, yw) + 3
  if (empresa?.resp_telefone || empresa?.resp_email) {
    y = campo('Contato', `${empresa?.resp_telefone || '—'} — ${empresa?.resp_email || '—'}`, mg, y, yw) + 3
  }

  paginas.contracapa = 2

  // ── PÁGINA 3: ÍNDICE (conteúdo preenchido só ao final, quando já se conhece a paginação real) ─
  doc.addPage()
  paginas.indice = (doc as any).internal.getNumberOfPages()

  // ── HISTÓRICO DE REVISÕES — só aparece quando existe de fato mais de uma revisão ─
  const historicoRevisoes = dados?.historico_revisoes || []
  const temHistoricoReal = historicoRevisoes.length > 1 || (dg.numero_revisao && dg.numero_revisao > 1)
  if (temHistoricoReal) {
    doc.addPage(); y = 20
    y = secao('HISTÓRICO DE REVISÕES', y)
    y = tabela(
      [
        { titulo: 'REV', largura: 20 },
        { titulo: 'DATA', largura: 35 },
        { titulo: 'RESPONSÁVEL', largura: 60 },
        { titulo: 'ALTERAÇÕES PRINCIPAIS', largura: 60 },
      ],
      historicoRevisoes.map((h: any) => [
        h.numero || '—',
        h.data ? new Date(h.data + 'T00:00').toLocaleDateString('pt-BR') : '—',
        h.responsavel || '—',
        h.alteracoes || '—',
      ]),
      y,
    )
    paginas.historico = (doc as any).internal.getNumberOfPages()
  }

  // ── DEFINIÇÕES (glossário técnico do GRO/PGR) ────────
  doc.addPage(); y = 20
  y = secao('DEFINIÇÕES', y)
  y = paragrafo('Para efeito deste documento, aplicam-se as definições a seguir, baseadas no Anexo I ("Termos e Definições") da NR-1, na redação dada pela Portaria MTE nº 1.419/2024, complementadas por conceitos técnicos consagrados na prática de segurança e saúde do trabalho.', y, 8.5)
  y += 1
  for (const d of DEFINICOES_PGR) {
    if (y > 265) { doc.addPage(); y = 20 }
    doc.setFontSize(9); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
    const linhasTermo = doc.splitTextToSize(d.termo, W - mg * 2)
    doc.text(linhasTermo, mg, y); y += linhasTermo.length * 4.3 + 1
    doc.setFont('helvetica', 'normal')
    y = paragrafo(d.definicao, y, 8.5)
    y += 1.5
  }
  paginas.definicoes = (doc as any).internal.getNumberOfPages()

  // ── Textos legais (NR-1): Introdução, Objetivos, Responsabilidades etc. ─
  doc.addPage(); y = 20
  paginas.introducao = (doc as any).internal.getNumberOfPages()
  const textosCustom = dados?.textos_legais_custom || {}
  for (const secaoTexto of TEXTOS_LEGAIS_PGR) {
    if (y > 250) { doc.addPage(); y = 20 }
    y = secao(secaoTexto.titulo, y)
    const paragrafos = textosCustom[secaoTexto.titulo] || secaoTexto.paragrafos
    for (const p of paragrafos) y = paragrafo(p, y)
    y += 2
  }
  if (y > 240) { doc.addPage(); y = 20 }
  linha(y); y += 6

  // ── Ambientes de trabalho ─────────────────────────────
  // Guarda com folga suficiente para caber o cabeçalho da seção + o parágrafo
  // introdutório antes do limite (260) usado pelo loop de cada ambiente — do
  // contrário o cabeçalho fica "preso" sozinho no fim da página anterior,
  // com um vão em branco até o rodapé, e o primeiro ambiente pula pra próxima.
  if (y > 215) { doc.addPage(); y = 20 }
  paginas.ambientes = (doc as any).internal.getNumberOfPages()
  y = secao(`AMBIENTES DE TRABALHO (${ambientes.length})`, y)
  if (ambientes.length) {
    y = paragrafo('Abaixo estão listados todos os ambientes analisados durante a elaboração deste documento, onde os colaboradores desta empresa exercem suas atividades.', y, 8)
    y += 1
    for (const a of ambientes) {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFontSize(9); doc.setTextColor(30); doc.setFont('helvetica', 'bold')
      doc.text(`${a.nome || '—'}${a.tipo === 'terceiro' ? ' (Terceiro)' : ' (Próprio)'}`, mg + 2, y)
      doc.setFont('helvetica', 'normal')
      if (a.data_inicio) {
        doc.setFontSize(8); doc.setTextColor(120)
        doc.text(`desde ${new Date(a.data_inicio + 'T00:00').toLocaleDateString('pt-BR')}`, W - mg - 2, y, { align: 'right' })
      }
      y += 4.5
      if (a.descricao) y = paragrafo(a.descricao, y, 8)
      if (a.epcs?.length) {
        doc.setFontSize(8); doc.setTextColor(90)
        doc.text(`EPC: ${a.epcs.map((e: any) => e.nome).filter(Boolean).join(', ') || '—'}`, mg + 2, y)
        y += 5
      }
      if (a.imagens?.length) y = inserirImagens(a.imagens, y)
      doc.setDrawColor(240); doc.line(mg, y, W - mg, y); y += 4
    }
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum ambiente cadastrado.', mg + 2, y); y += 6
  }
  y += 2; linha(y); y += 6

  // ── Inventário de riscos por GHE (página em paisagem) ─
  doc.addPage('a4', 'landscape'); W = 297; H = 210; y = 20
  paginas.inventario = (doc as any).internal.getNumberOfPages()
  y = secao(`INVENTÁRIO DE RISCOS POR GHE (${inventario.length})`, y)
  if (inventario.length) {
    for (const g of inventario) {
      if (y > H - 30) { doc.addPage(); y = 20 }
      doc.setFontSize(10); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
      doc.text(g.nome || 'GHE', mg, y)
      doc.setFont('helvetica', 'normal')
      const iqct = calcularIQCT(g.riscos)
      doc.setFontSize(8)
      if (iqct) {
        doc.setTextColor(12, 68, 124)
        doc.text(`IQCT ${iqct.valor}/100`, W - mg, y, { align: 'right' })
      } else {
        doc.setTextColor(160)
        doc.text('IQCT — dados insuficientes', W - mg, y, { align: 'right' })
      }
      y += 5
      const infoGhe = [
        g.ambientes_relacionados ? `Ambientes: ${g.ambientes_relacionados}` : '',
        g.jornada_trabalho ? `Jornada: ${g.jornada_trabalho}` : '',
        g.numero_empregados ? `Nº empregados: ${g.numero_empregados}` : '',
      ].filter(Boolean).join(' · ')
      if (infoGhe) y = paragrafo(infoGhe, y, 8)
      if (g.imagens?.length) {
        if (y + 35 > H - 12) { doc.addPage(); y = 20 }
        y = inserirImagens(g.imagens, y)
      }
      if (g.funcoes?.length) {
        doc.setFontSize(8); doc.setTextColor(90); doc.setFont('helvetica', 'bold')
        doc.text('Funções neste GHE:', mg + 2, y); y += 4
        for (const f of g.funcoes) {
          doc.setFontSize(7.5); doc.setTextColor(50); doc.setFont('helvetica', 'bold')
          doc.text(`${f.nome || '—'}`, mg + 4, y)
          if (f.cbo || f.nivel) {
            doc.setFontSize(7); doc.setTextColor(100)
            doc.text(`${f.cbo ? `CBO ${f.cbo}` : ''}${f.cbo && f.nivel ? ' | ' : ''}${f.nivel ? `Nível: ${f.nivel}` : ''}`, mg + 4, y + 3)
          }
          y += 3 + (f.cbo || f.nivel ? 3 : 0)
          if (f.atividades) {
            doc.setFontSize(7); doc.setTextColor(70); doc.setFont('helvetica', 'normal')
            const linhasAt = doc.splitTextToSize(f.atividades, 270)
            for (const ln of linhasAt) { doc.text(ln, mg + 6, y); y += 3 }
          }
          if (f.requisitos) {
            doc.setFontSize(7); doc.setTextColor(80); doc.setFont('helvetica', 'bold')
            doc.text('Requisitos:', mg + 4, y); y += 2.5
            doc.setFont('helvetica', 'normal')
            const linhasReq = doc.splitTextToSize(f.requisitos, 270)
            for (const ln of linhasReq) { doc.text(ln, mg + 6, y); y += 3 }
          }
          doc.setDrawColor(220); doc.line(mg + 2, y, mg + 285, y); y += 3
        }
      }
      y += 1

      if (g.riscos?.length) {
        y = tabela(
          [
            { titulo: 'PERIGO', largura: 26 },
            { titulo: 'FONTES/CIRCUNST.', largura: 26 },
            { titulo: 'TIPO', largura: 17 },
            { titulo: 'CÓD. ESOCIAL', largura: 16 },
            { titulo: 'RISCO', largura: 34 },
            { titulo: 'NÍVEL DE RISCO', largura: 24 },
            { titulo: 'DANOS À SAÚDE', largura: 25 },
            { titulo: 'MEDIÇÃO', largura: 16 },
            { titulo: 'LT/LEO', largura: 14 },
            { titulo: 'EQUIPAMENTO', largura: 16 },
            { titulo: 'TRAJETÓRIA', largura: 15 },
            { titulo: 'EXPOSIÇÃO', largura: 18 },
            { titulo: 'ESTIMATIVA', largura: 20 },
          ],
          g.riscos.map((r: any) => {
            const nr = nivelRisco(r.severidade, r.probabilidade)
            const est = ESTIMATIVA_OPCOES.find(o => o.v === r.estimativa)
            return [
              r.nome || '—',
              r.fontes_circunstancias || '—',
              tipoMap[r.tipo] || r.tipo || '—',
              r.codigo_esocial || '—',
              r.perigo || r.nome || '—',
              nr ? `${r.severidade}/${r.probabilidade} — ${nr.faixa} (${nr.valor})` : '—',
              r.possiveis_danos || '—',
              r.valor ? `${r.valor}${r.unidade ? ' ' + r.unidade : ''}` : '—',
              r.limite || '—',
              r.equipamento || '—',
              r.trajetoria || '—',
              r.tipo_exposicao || '—',
              est ? `${est.l} (${est.num})` : '—',
            ]
          }),
          y,
          (li, ci) => {
            if (ci !== 5) return null
            const nr = nivelRisco(g.riscos[li]?.severidade, g.riscos[li]?.probabilidade)
            return nr ? { bg: hexRgb(nr.bg), texto: hexRgb(nr.cor) } : null
          },
        )
      } else {
        doc.setFontSize(8); doc.setTextColor(120)
        doc.text('Nenhum risco cadastrado neste GHE.', mg + 2, y); y += 5
      }

      if (g.epis?.length) {
        y = tabela(
          [{ titulo: 'EPI', largura: 90 }, { titulo: 'ATENUAÇÃO', largura: 50 }, { titulo: 'EFICÁCIA', largura: 40 }],
          g.epis.map((e: any) => [e.nome || '—', e.atenuacao || '—', e.eficaz ? 'Sim' : 'Não']),
          y,
        )
      }

      if (g.medidas_administrativas?.length) {
        y = tabela(
          [{ titulo: 'RISCO', largura: 60 }, { titulo: 'MEDIDA ADMINISTRATIVA', largura: 120 }],
          g.medidas_administrativas.map((m: any) => [m.risco || '—', m.medida || '—']),
          y,
        )
      }
      doc.setDrawColor(200); doc.line(mg, y, W - mg, y); y += 6
    }
    if (y > H - 20) { doc.addPage(); y = 20 }
    doc.setFontSize(7); doc.setTextColor(140); doc.setFont('helvetica', 'italic')
    const linhasIqct = doc.splitTextToSize(IQCT_EXPLICACAO, W - mg * 2)
    for (const ln of linhasIqct) { doc.text(ln, mg, y); y += 3 }
    doc.setFont('helvetica', 'normal')
    y += 3
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum GHE cadastrado.', mg + 2, y); y += 6
  }

  // ── GRÁFICO: Distribuição de Riscos por Nível ────────
  if (y > H - 50) { doc.addPage(); y = 20 }
  y = subSecao('Distribuição de Riscos por Nível', y)

  // Contar riscos por nível — usa as MESMAS faixas de nivelRisco() (Quadro 2 da
  // NR-1), reaproveitando QUADRO2_INTERPRETACAO para rótulo e cor, evitando
  // categorias inventadas que nunca bateriam com o resultado real de nivelRisco().
  const distribuicaoRiscos: Record<string, number> = {}
  for (const q of QUADRO2_INTERPRETACAO) distribuicaoRiscos[q.label] = 0
  for (const g of inventario) {
    for (const r of (g.riscos || [])) {
      const nr = nivelRisco(r.severidade, r.probabilidade)
      if (nr?.faixa) distribuicaoRiscos[nr.faixa] = (distribuicaoRiscos[nr.faixa] || 0) + 1
    }
  }

  const totalRiscos = Object.values(distribuicaoRiscos).reduce((a, b) => a + b, 0)
  paginas.distribuicao = (doc as any).internal.getNumberOfPages()
  if (totalRiscos > 0) {
    let yy = y
    for (const q of QUADRO2_INTERPRETACAO) {
      const count = distribuicaoRiscos[q.label] || 0
      const pct = (count / totalRiscos) * 100
      const larguraBarra = (pct / 100) * 120
      const [r, g, b] = hexRgb(q.cor)
      doc.setFontSize(8); doc.setTextColor(50)
      doc.text(`${q.label}:`, mg, yy)
      doc.setFillColor(r, g, b); doc.rect(mg + 35, yy - 2.5, Math.max(larguraBarra, count > 0 ? 2 : 0), 3, 'F')
      doc.setTextColor(50); doc.text(`${count} (${pct.toFixed(0)}%)`, mg + 35 + larguraBarra + 5, yy)
      yy += 6
    }
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum risco cadastrado.', mg + 2, y); y += 5
  }
  y += 35

  // ── Plano de ação (página em paisagem — os textos de "o que/por que/como"
  // costumam ser longos e ficavam espremidos em retrato) ─────
  doc.addPage('a4', 'landscape'); W = 297; H = 210; y = 20
  paginas.planoAcao = (doc as any).internal.getNumberOfPages()
  y = secao(`PLANO DE AÇÃO (${planoAcao.length})`, y)
  const statusMap: Record<string, string> = { pendente: 'Pendente', andamento: 'Em andamento', concluida: 'Concluída' }
  const priorMap: Record<string, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
  if (planoAcao.length) {
    y = tabela(
      [
        { titulo: 'RISCO (PRIORIDADE)', largura: 45 },
        { titulo: 'O QUE', largura: 65 },
        { titulo: 'POR QUE', largura: 55 },
        { titulo: 'QUEM / COMO / ONDE', largura: 62 },
        { titulo: 'QUANDO / STATUS', largura: 40 },
      ],
      planoAcao.map((a: any) => [
        `${a.risco || '—'}${a.priorizacao ? ` (${priorMap[a.priorizacao] || a.priorizacao})` : ''}`,
        a.medida_controle || '—',
        a.justificativa || '—',
        [a.responsavel, a.como, a.onde].filter(Boolean).join(' / ') || '—',
        `${a.prazo ? new Date(a.prazo + 'T00:00').toLocaleDateString('pt-BR') : '—'}${a.status ? ` (${statusMap[a.status] || a.status})` : ''}`,
      ]),
      y,
    )
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhuma ação cadastrada.', mg + 2, y); y += 6
  }

  // Não voltamos ao retrato aqui com um addPage() isolado: como nada seria
  // desenhado nele antes do próximo addPage() (das imagens anexas ou do
  // Anexo I, ambos incondicionais), isso deixava uma página em branco
  // "órfã" no meio do documento. A troca de orientação é feita já na
  // primeira seção seguinte que efetivamente desenha conteúdo.

  // ── Imagens anexas ────────────────────────────────────
  const imagensAnexas = dados?.imagens_anexas || []
  if (imagensAnexas.length) {
    doc.addPage('a4', 'portrait'); W = 210; H = 297; y = 20
    y = secao(`IMAGENS ANEXAS (${imagensAnexas.length})`, y)
    y = inserirImagens(
      imagensAnexas.map((im: any) => im.dataUrl),
      y,
      imagensAnexas.map((im: any) => im.legenda),
    )
  }

  // ── Anexo I — Plano de Emergência ─────────────────────
  doc.addPage('a4', 'portrait'); W = 210; H = 297; y = 20
  paginas.planoEmergencia = (doc as any).internal.getNumberOfPages()
  y = secao(TEXTO_PLANO_EMERGENCIA.titulo, y)
  for (const secaoEmerg of TEXTO_PLANO_EMERGENCIA.secoes) {
    if (y > 260) { doc.addPage(); y = 20 }
    y = subSecao(secaoEmerg.subtitulo, y)
    for (const p of secaoEmerg.paragrafos) y = paragrafo(p, y)
    y += 2
  }

  // ── Anexo II — Matriz de Risco Visual (Heatmap) ─────
  doc.addPage(); y = 20
  paginas.matrizRisco = (doc as any).internal.getNumberOfPages()
  y = secao('ANEXO — MATRIZ DE RISCO', y)
  y = subSecao('Matriz de Referência — Severidade × Probabilidade', y)
  y = paragrafo('Grade de referência da NR-1 (Quadros 2 e 3), com o nível de risco resultante de cada combinação de severidade e probabilidade. O número em cada célula indica quantos riscos do inventário caíram exatamente nessa combinação.', y, 8)
  y += 2

  // Matriz de referência: linhas = severidade (decrescente), colunas = probabilidade (crescente) —
  // usa os MESMOS valores discretos de SEVERIDADE_OPCOES/PROBABILIDADE_OPCOES e a
  // MESMA função nivelRisco() da tabela de inventário, evitando reinventar uma escala
  // (bug anterior: assumia 1–5 quando os valores reais são 2/4/8/16/32 e 2/3/5/8/13).
  const severidadesDesc = [...SEVERIDADE_OPCOES].reverse()
  const contagemMatriz: number[][] = severidadesDesc.map(() => PROBABILIDADE_OPCOES.map(() => 0))
  for (const g of inventario) {
    for (const r of (g.riscos || [])) {
      const si = severidadesDesc.findIndex(s => s.v === Number(r.severidade))
      const pi = PROBABILIDADE_OPCOES.findIndex(p => p.v === Number(r.probabilidade))
      if (si >= 0 && pi >= 0) contagemMatriz[si][pi]++
    }
  }

  const tamCelula = 14
  const startX = mg + 24
  const startY = y + 10

  doc.setFontSize(7); doc.setTextColor(100)
  doc.text('SEVERIDADE ↓', mg + 2, startY - 5)
  doc.text('PROBABILIDADE →', startX + (tamCelula * PROBABILIDADE_OPCOES.length) / 2 - 22, startY + (tamCelula * severidadesDesc.length) + 5)

  // Cabeçalho (probabilidade)
  for (let pi = 0; pi < PROBABILIDADE_OPCOES.length; pi++) {
    doc.setFillColor(240, 240, 240)
    doc.rect(startX + pi * tamCelula, startY - tamCelula, tamCelula, tamCelula)
    doc.setFontSize(6.5); doc.setTextColor(80)
    doc.text(String(PROBABILIDADE_OPCOES[pi].v), startX + pi * tamCelula + tamCelula / 2, startY - tamCelula / 2 + 1, { align: 'center' })
    doc.setFontSize(5); const linhasLabel = doc.splitTextToSize(PROBABILIDADE_OPCOES[pi].l, tamCelula - 2)
    doc.text(linhasLabel, startX + pi * tamCelula + tamCelula / 2, startY - tamCelula / 2 + 4, { align: 'center' })
  }

  // Linhas (severidade) + células coloridas pela mesma classificação usada no inventário
  for (let si = 0; si < severidadesDesc.length; si++) {
    doc.setFillColor(240, 240, 240)
    doc.rect(startX - tamCelula, startY + si * tamCelula, tamCelula, tamCelula)
    doc.setFontSize(6.5); doc.setTextColor(80)
    doc.text(String(severidadesDesc[si].v), startX - tamCelula / 2, startY + si * tamCelula + tamCelula / 2 + 1, { align: 'center' })
    doc.setFontSize(5); const linhasLabelSev = doc.splitTextToSize(severidadesDesc[si].l, tamCelula - 2)
    doc.text(linhasLabelSev, startX - tamCelula / 2, startY + si * tamCelula + tamCelula / 2 + 4, { align: 'center' })

    for (let pi = 0; pi < PROBABILIDADE_OPCOES.length; pi++) {
      const nr = nivelRisco(severidadesDesc[si].v, PROBABILIDADE_OPCOES[pi].v)
      const [rB, gB, bB] = hexRgb(nr?.bg || '#EAF3DE')
      doc.setFillColor(rB, gB, bB)
      doc.rect(startX + pi * tamCelula, startY + si * tamCelula, tamCelula, tamCelula, 'FD')
      const count = contagemMatriz[si][pi]
      if (count > 0) {
        const [rC, gC, bC] = hexRgb(nr?.cor || '#27500A')
        doc.setFontSize(8); doc.setTextColor(rC, gC, bC); doc.setFont('helvetica', 'bold')
        doc.text(String(count), startX + pi * tamCelula + tamCelula / 2, startY + si * tamCelula + tamCelula / 2 + 2, { align: 'center' })
        doc.setFont('helvetica', 'normal')
      }
    }
  }

  y = startY + (tamCelula * severidadesDesc.length) + 15

  y = subSecao('Quadro 1 — Interpretação por faixa de risco', y)
  for (const q of QUADRO2_INTERPRETACAO) {
    if (y > 255) { doc.addPage(); y = 20 }
    const [rC, gC, bC] = hexRgb(q.cor)
    const [rB, gB, bB] = hexRgb(q.bg)
    doc.setFillColor(rB, gB, bB); doc.rect(mg, y - 4, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(rC, gC, bC); doc.setFont('helvetica', 'bold')
    doc.text(`${q.label} (${q.faixa})`, mg + 2, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7); doc.setTextColor(90)
    doc.text(q.prazo, W - mg - 2, y, { align: 'right' })
    y += 5
    y = paragrafo(q.acao, y, 8)
    y += 2
  }
  y += 2

  // ── Critérios técnicos de referência (AIHA / AS-NZS 4360 / European
  // Commission, recomendadas pela Fundacentro) — texto e tabelas completos ──
  if (y > 230) { doc.addPage(); y = 20 }
  y = subSecao('Critérios Técnicos de Referência — Gradação de Severidade e Probabilidade', y)
  for (const p of CRITERIOS_GRADACAO_INTRO) y = paragrafo(p, y, 8.5)
  y += 2

  y = tabelaGraduacao(TABELA_PROBABILIDADE_QUANTITATIVA, [12, 60, 108], y)
  y = tabelaGraduacao(TABELA_PROBABILIDADE_QUALITATIVA_QUIMICOS, [12, 50, 118], y)
  y = tabelaGraduacao(TABELA_PROBABILIDADE_QUALITATIVA_GERAL, [12, 55, 113], y)

  if (y > 240) { doc.addPage(); y = 20 }
  y = subSecao('Notas sobre a gradação de probabilidade', y)
  for (const n of NOTAS_PROBABILIDADE) {
    if (y > 255) { doc.addPage(); y = 20 }
    doc.setFontSize(8.5); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
    const linhasTermo = doc.splitTextToSize(n.termo, W - mg * 2)
    doc.text(linhasTermo, mg, y); y += linhasTermo.length * 4 + 1
    doc.setFont('helvetica', 'normal')
    y = paragrafo(n.definicao, y, 8)
    y += 1.5
  }
  y += 2

  y = tabelaGraduacao(TABELA_SEVERIDADE_REFERENCIA, [15, 165], y)

  if (y > 240) { doc.addPage(); y = 20 }
  y = subSecao('Notas sobre a gradação de severidade', y)
  for (const n of NOTAS_SEVERIDADE) {
    if (y > 255) { doc.addPage(); y = 20 }
    doc.setFontSize(8.5); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
    const linhasTermo = doc.splitTextToSize(n.termo, W - mg * 2)
    doc.text(linhasTermo, mg, y); y += linhasTermo.length * 4 + 1
    doc.setFont('helvetica', 'normal')
    y = paragrafo(n.definicao, y, 8)
    y += 1.5
  }
  y += 2

  if (y > 220) { doc.addPage(); y = 20 }
  y = subSecao('Matriz de Risco — Metodologia de Referência', y)
  for (const p of TEXTO_MATRIZ_RISCO.intro) y = paragrafo(p, y, 8.5)
  y += 1
  for (const p of TEXTO_MATRIZ_RISCO.exemplo) y = paragrafo(p, y, 8.5)
  y += 1
  y = paragrafo(TEXTO_MATRIZ_RISCO.metodosControle, y, 8.5)
  y += 1
  y = paragrafo(TEXTO_MATRIZ_RISCO.iqct, y, 8.5)
  y += 3

  // ── Critérios efetivamente adotados neste documento (Quadros 2 e 3) ──
  if (y > 240) { doc.addPage(); y = 20 }
  y = subSecao('Quadro 2 — Critério de probabilidade adotado neste documento', y)
  for (const p of PROBABILIDADE_OPCOES) {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFontSize(8.5); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
    doc.text(`${p.v} — ${p.l}`, mg + 2, y); y += 4
    doc.setFont('helvetica', 'normal')
    y = paragrafo(p.desc, y, 8)
    y += 1
  }
  y += 2
  if (y > 240) { doc.addPage(); y = 20 }
  y = subSecao('Quadro 3 — Critério de severidade adotado neste documento', y)
  for (const sv of QUADRO4_SEVERIDADE) {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFontSize(8.5); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
    doc.text(`${sv.v} — ${sv.l}`, mg + 2, y); y += 4
    doc.setFont('helvetica', 'normal')
    y = paragrafo(sv.efeito, y, 8)
    y += 1
  }

  if (y > 250) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  y = desenharAssinaturas(doc, y, mg, W,
    {
      tituloBloco: 'RESPONSÁVEL PELA IMPLEMENTAÇÃO DO PGR',
      descricao: 'Será responsável pelo cumprimento e implementação do PGR — Programa de Gerenciamento de Riscos, conforme NR-1.',
      nome: empresa?.resp_nome,
    },
    {
      tituloBloco: 'RESPONSÁVEL PELA ELABORAÇÃO DO PGR',
      descricao: 'Programa de Gerenciamento de Riscos, conforme NR-1.',
      nome: dg.resp_nome,
      cargo: dg.resp_conselho === 'CRM' ? 'Médico do Trabalho' : 'Técnico/Engenheiro de Segurança do Trabalho',
      extra: `${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim() || undefined,
    }
  )

  // ── Preenche o Índice, agora que a paginação real do documento é conhecida ─
  doc.setPage(paginas.indice)
  let yIndice = 20
  yIndice = secao('ÍNDICE', yIndice)
  yIndice += 4
  const itensIndice: Array<[string, number | undefined]> = [
    ['Identificação da Empresa', paginas.contracapa],
    ['Histórico de Revisões', paginas.historico],
    ['Definições', paginas.definicoes],
    ['Introdução, Objetivos e Responsabilidades', paginas.introducao],
    ['Ambientes de Trabalho', paginas.ambientes],
    ['Inventário de Riscos por GHE', paginas.inventario],
    ['Distribuição de Riscos por Nível', paginas.distribuicao],
    ['Plano de Ação', paginas.planoAcao],
    ['Anexo I — Plano de Emergência', paginas.planoEmergencia],
    ['Anexo II — Matriz de Risco', paginas.matrizRisco],
  ]
  doc.setFontSize(9); doc.setTextColor(30); doc.setFont('helvetica', 'normal')
  let numItemIndice = 1
  for (const [tituloItem, paginaItem] of itensIndice) {
    if (paginaItem == null) continue
    doc.text(`${numItemIndice}. ${tituloItem}`, mg, yIndice)
    doc.text(String(paginaItem), W - mg - 5, yIndice, { align: 'right' })
    yIndice += 6
    numItemIndice++
  }
  yIndice += 6; linha(yIndice); yIndice += 6
  doc.setFontSize(8); doc.setTextColor(100)
  doc.text(`Total de páginas: ${(doc as any).internal.getNumberOfPages()}`, mg, yIndice)

  // ── Rodapé ────────────────────────────────────────────
  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, ph - 5)
    doc.text(`Página ${p}/${totalPags}`, pw - mg, ph - 5, { align: 'right' })
  }

  const data = dg.data_elaboracao || new Date().toISOString().split('T')[0]
  abrirPdfEmNovaAba(doc, `PGR_${empresa?.cnpj?.replace(/\D/g, '') || 'empresa'}_${data}.pdf`, _pdfTab)
}

export async function gerarPdfAet(dados: any, empresa: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const mg = 15
  let y = 15

  function linha(yPos: number) {
    doc.setDrawColor(220, 220, 220)
    doc.line(mg, yPos, W - mg, yPos)
  }
  function secao(texto: string, yPos: number): number {
    doc.setFillColor(24, 95, 165)
    doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 10
  }
  function campo(label: string, valor: string, xPos: number, yPos: number, largura: number): number {
    doc.setFontSize(7); doc.setTextColor(100); doc.text(label.toUpperCase(), xPos, yPos)
    doc.setFontSize(10); doc.setTextColor(30)
    const linhas = doc.splitTextToSize(valor || '—', largura - 2)
    doc.text(linhas, xPos, yPos + 4)
    return yPos + 4 + linhas.length * 5
  }
  function paragrafo(texto: string, yPos: number, tamanho = 9): number {
    doc.setFontSize(tamanho); doc.setTextColor(50)
    const linhas = doc.splitTextToSize(texto, W - mg * 2)
    let yy = yPos
    for (const ln of linhas) {
      if (yy > 278) { doc.addPage(); yy = 20 }
      doc.text(ln, mg, yy)
      yy += 4.3
    }
    return yy + 2
  }

  doc.setFillColor(24, 95, 165)
  doc.rect(0, 0, W, 20, 'F')
  if (empresa?.logo_url) {
    try { doc.addImage(empresa.logo_url, 'JPEG', 2, 2, 16, 16) } catch { }
  }
  doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('ANÁLISE ERGONÔMICA DO TRABALHO', W / 2, 8, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('AET — NR-17', W / 2, 14, { align: 'center' })
  y = 26

  y = secao('DADOS DA EMPRESA', y)
  const yw = (W - mg * 2)
  campo('Razão Social', empresa?.razao_social, mg, y, yw / 2)
  campo('CNPJ', empresa?.cnpj, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10; linha(y); y += 6

  y = secao('DADOS DO LAUDO', y)
  const dg = dados?.dados_gerais || {}
  const col = (W - mg * 2 - 10) / 3
  campo('Data de Elaboração', dg.data_elaboracao ? new Date(dg.data_elaboracao + 'T00:00').toLocaleDateString('pt-BR') : '—', mg, y, col)
  campo('Próxima Revisão', dg.prox_revisao ? new Date(dg.prox_revisao + 'T00:00').toLocaleDateString('pt-BR') : '—', mg + col + 5, y, col)
  campo(`${dg.resp_conselho || 'CREA'} Nº`, dg.resp_registro, mg + (col + 5) * 2, y, col)
  y += 10; linha(y); y += 6
  campo('Responsável Técnico', dg.resp_nome, mg, y, col * 2)
  campo('CPF', dg.resp_cpf, mg + col * 2 + 5, y, col)
  y += 12; linha(y); y += 6

  // ── Textos legais (NR-17) ──────────────────────────────
  const textosCustomAet = dados?.textos_legais_custom || {}
  for (const secaoTexto of TEXTOS_LEGAIS_AET) {
    if (y > 250) { doc.addPage(); y = 20 }
    y = secao(secaoTexto.titulo, y)
    const paragrafos = textosCustomAet[secaoTexto.titulo] || secaoTexto.paragrafos
    for (const p of paragrafos) y = paragrafo(p, y)
    y += 2
  }
  if (y > 240) { doc.addPage(); y = 20 }
  linha(y); y += 6

  const postos = dados?.postos_trabalho || []
  if (y > 240) { doc.addPage(); y = 20 }
  y = secao(`POSTOS DE TRABALHO AVALIADOS (${postos.length})`, y)
  for (const p of postos) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFontSize(10); doc.setTextColor(30); doc.setFont('helvetica', 'bold')
    doc.text(`${p.nome || '—'}${p.setor ? ` — ${p.setor}` : ''}`, mg, y)
    doc.setFont('helvetica', 'normal'); y += 5
    if (p.descricao_atividade) {
      doc.setFontSize(8); doc.setTextColor(80)
      const linhas = doc.splitTextToSize(p.descricao_atividade, W - mg * 2)
      doc.text(linhas, mg, y); y += linhas.length * 4 + 2
    }
    const fatores = [
      !p.mobiliario_adequado && 'Mobiliário inadequado',
      p.levantamento_peso && 'Levantamento de peso',
      p.posturas_inadequadas && 'Posturas inadequadas',
      p.repetitividade && 'Repetitividade',
      p.controle_rigido_produtividade && 'Controle rígido de produtividade',
      p.trabalho_noturno_turnos && 'Trabalho noturno/turnos',
    ].filter(Boolean)
    if (fatores.length) {
      doc.setFontSize(8); doc.setTextColor(151, 79, 0)
      doc.text(`Fatores de risco: ${fatores.join(', ')}`, mg, y); y += 5
    }
    if (p.descricao_organizacao_trabalho) {
      doc.setFontSize(8); doc.setTextColor(80)
      const linhas = doc.splitTextToSize(`Organização do trabalho: ${p.descricao_organizacao_trabalho}`, W - mg * 2)
      doc.text(linhas, mg, y); y += linhas.length * 4 + 2
    }
    if (p.pausas_previstas) {
      doc.setFontSize(8); doc.setTextColor(80)
      doc.text(`Pausas previstas: ${p.pausas_previstas}`, mg, y); y += 5
    }
    if (p.recomendacoes?.length) {
      doc.setFontSize(8); doc.setTextColor(39, 80, 10)
      const linhas = doc.splitTextToSize(`Recomendações: ${p.recomendacoes.join('; ')}`, W - mg * 2)
      doc.text(linhas, mg, y); y += linhas.length * 4
    }
    y += 4; linha(y); y += 5
  }
  if (!postos.length) {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum posto de trabalho avaliado.', mg + 2, y); y += 6
  }

  if (y > 250) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  y = desenharAssinaturas(doc, y, mg, W,
    {
      tituloBloco: 'RESPONSÁVEL PELA IMPLEMENTAÇÃO DA AET',
      descricao: 'Será responsável pelo cumprimento e implementação da AET — Análise Ergonômica do Trabalho, conforme NR-17.',
      nome: empresa?.resp_nome,
    },
    {
      tituloBloco: 'RESPONSÁVEL PELA ELABORAÇÃO DA AET',
      descricao: 'Análise Ergonômica do Trabalho, conforme NR-17.',
      nome: dg.resp_nome,
      cargo: 'Técnico/Engenheiro de Segurança do Trabalho',
      extra: `${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim() || undefined,
    }
  )

  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const data = dg.data_elaboracao || new Date().toISOString().split('T')[0]
  abrirPdfEmNovaAba(doc, `AET_${empresa?.cnpj?.replace(/\D/g, '') || 'empresa'}_${data}.pdf`, _pdfTab)
}

export async function gerarPdfApr(dados: any, empresa: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const mg = 15
  let y = 15

  function linha(yPos: number) {
    doc.setDrawColor(220, 220, 220)
    doc.line(mg, yPos, W - mg, yPos)
  }
  function secao(texto: string, yPos: number): number {
    doc.setFillColor(24, 95, 165)
    doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 10
  }
  function campo(label: string, valor: string, xPos: number, yPos: number, largura: number): number {
    doc.setFontSize(7); doc.setTextColor(100); doc.text(label.toUpperCase(), xPos, yPos)
    doc.setFontSize(10); doc.setTextColor(30)
    const linhas = doc.splitTextToSize(valor || '—', largura - 2)
    doc.text(linhas, xPos, yPos + 4)
    return yPos + 4 + linhas.length * 5
  }

  doc.setFillColor(24, 95, 165)
  doc.rect(0, 0, W, 20, 'F')
  if (empresa?.logo_url) {
    try { doc.addImage(empresa.logo_url, 'JPEG', 2, 2, 16, 16) } catch { }
  }
  doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('ANÁLISE PRELIMINAR DE RISCO', W / 2, 8, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('APR', W / 2, 14, { align: 'center' })
  y = 26

  y = secao('DADOS DA EMPRESA', y)
  const yw = (W - mg * 2)
  campo('Razão Social', empresa?.razao_social, mg, y, yw / 2)
  campo('CNPJ', empresa?.cnpj, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10; linha(y); y += 6

  y = secao('DADOS DA ATIVIDADE', y)
  const dg = dados?.dados_gerais || {}
  campo('Atividade', dg.atividade, mg, y, yw / 2)
  campo('Local', dg.local, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10
  campo('Data de Realização', dg.data_realizacao ? new Date(dg.data_realizacao + 'T00:00').toLocaleDateString('pt-BR') : '—', mg, y, yw / 2)
  campo('Responsável', `${dg.resp_nome || '—'}${dg.resp_cargo ? ` (${dg.resp_cargo})` : ''}`, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 12; linha(y); y += 6

  const etapas = dados?.etapas || []
  if (y > 230) { doc.addPage(); y = 20 }
  y = secao(`ATIVIDADES, PERIGOS E AÇÕES PREVENTIVAS (${etapas.length})`, y)
  if (etapas.length) {
    doc.setFillColor(245, 247, 250)
    doc.rect(mg, y, W - mg * 2, 5.5, 'F')
    doc.setFontSize(7); doc.setTextColor(80); doc.setFont('helvetica', 'bold')
    doc.text('ATIVIDADE / PERIGO / EFEITO OU IMPACTO', mg + 2, y + 4)
    doc.text('AÇÃO PREVENTIVA', mg + 100, y + 4)
    doc.text('RESPONSÁVEL', mg + 160, y + 4)
    doc.setFont('helvetica', 'normal'); y += 8

    for (const e of etapas) {
      if (y > 265) { doc.addPage(); y = 20 }
      doc.setFontSize(8); doc.setTextColor(30)
      const etapaLinhas = doc.splitTextToSize(`${e.atividade || '—'} — ${e.perigo || '—'} (${e.efeito_impacto || '—'})`, 85)
      doc.text(etapaLinhas, mg + 2, y)
      const medLinhas = doc.splitTextToSize(e.acao_preventiva || '—', 55)
      doc.text(medLinhas, mg + 100, y)
      doc.text(e.responsavel_acao || '—', mg + 160, y)
      const maxLinhas = Math.max(etapaLinhas.length, medLinhas.length)
      doc.setDrawColor(240); doc.line(mg, y + maxLinhas * 3.5 + 2, W - mg, y + maxLinhas * 3.5 + 2)
      y += maxLinhas * 3.5 + 6
    }
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhuma atividade cadastrada.', mg + 2, y); y += 6
  }
  y += 2; linha(y); y += 6

  const epis = dados?.epis || []
  if (y > 230) { doc.addPage(); y = 20 }
  y = secao(`EPIS APLICÁVEIS (${epis.length})`, y)
  if (epis.length) {
    for (const e of epis) {
      if (y > 265) { doc.addPage(); y = 20 }
      doc.setFontSize(9); doc.setTextColor(30)
      doc.text(`• ${e.nome || '—'}${e.ca ? ` — CA ${e.ca}` : ''} — ${e.eficaz ? 'Eficaz' : 'Não eficaz'}`, mg + 2, y)
      y += 5
    }
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum EPI cadastrado.', mg + 2, y); y += 6
  }
  y += 2; linha(y); y += 6

  const epcs = dados?.epcs || []
  if (y > 230) { doc.addPage(); y = 20 }
  y = secao(`EPCS APLICÁVEIS (${epcs.length})`, y)
  if (epcs.length) {
    for (const e of epcs) {
      if (y > 265) { doc.addPage(); y = 20 }
      doc.setFontSize(9); doc.setTextColor(30)
      doc.text(`• ${e.nome || '—'} — ${e.eficaz ? 'Eficaz' : 'Não eficaz'}`, mg + 2, y)
      y += 5
    }
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum EPC cadastrado.', mg + 2, y); y += 6
  }
  y += 2; linha(y); y += 6

  const equipe = dados?.equipe || []
  if (y > 240) { doc.addPage(); y = 20 }
  y = secao(`EQUIPE ENVOLVIDA (${equipe.length})`, y)
  if (equipe.length) {
    for (const m of equipe) {
      if (y > 265) { doc.addPage(); y = 20 }
      doc.setFontSize(9); doc.setTextColor(30)
      doc.text(`• ${m.nome || '—'}${m.funcao ? ` — ${m.funcao}` : ''}`, mg + 2, y)
      y += 5
    }
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum integrante cadastrado.', mg + 2, y); y += 6
  }

  if (y > 250) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  const xMed = W / 2
  doc.line(xMed - 45, y, xMed + 45, y)
  y += 4
  doc.setFontSize(8); doc.setTextColor(80)
  doc.text('Assinatura do responsável pela atividade', xMed, y, { align: 'center' })

  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const data = dg.data_realizacao || new Date().toISOString().split('T')[0]
  abrirPdfEmNovaAba(doc, `APR_${(dg.atividade || 'atividade').replace(/\s+/g, '_')}_${data}.pdf`, _pdfTab)
}

export async function gerarPdfLip(dados: any, empresa: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const mg = 15
  let y = 15

  function linha(yPos: number) {
    doc.setDrawColor(220, 220, 220)
    doc.line(mg, yPos, W - mg, yPos)
  }
  function secao(texto: string, yPos: number): number {
    doc.setFillColor(24, 95, 165)
    doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 10
  }
  function campo(label: string, valor: string, xPos: number, yPos: number, largura: number): number {
    doc.setFontSize(7); doc.setTextColor(100); doc.text(label.toUpperCase(), xPos, yPos)
    doc.setFontSize(10); doc.setTextColor(30)
    const linhas = doc.splitTextToSize(valor || '—', largura - 2)
    doc.text(linhas, xPos, yPos + 4)
    return yPos + 4 + linhas.length * 5
  }
  function paragrafo(texto: string, yPos: number, tamanho = 9): number {
    doc.setFontSize(tamanho); doc.setTextColor(50)
    const linhas = doc.splitTextToSize(texto, W - mg * 2)
    let yy = yPos
    for (const ln of linhas) {
      if (yy > 278) { doc.addPage(); yy = 20 }
      doc.text(ln, mg, yy)
      yy += 4.3
    }
    return yy + 2
  }

  doc.setFillColor(24, 95, 165)
  doc.rect(0, 0, W, 20, 'F')
  if (empresa?.logo_url) {
    try { doc.addImage(empresa.logo_url, 'JPEG', 2, 2, 16, 16) } catch { }
  }
  doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('LAUDO DE INSALUBRIDADE E PERICULOSIDADE', W / 2, 8, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('LIP — NR-15 / NR-16', W / 2, 14, { align: 'center' })
  y = 26

  y = secao('DADOS DA EMPRESA', y)
  const yw = (W - mg * 2)
  campo('Razão Social', empresa?.razao_social, mg, y, yw / 2)
  campo('CNPJ', empresa?.cnpj, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10; linha(y); y += 6

  y = secao('DADOS DO LAUDO', y)
  const dg = dados?.dados_gerais || {}
  const col = (W - mg * 2 - 10) / 3
  campo('Data de Elaboração', dg.data_elaboracao ? new Date(dg.data_elaboracao + 'T00:00').toLocaleDateString('pt-BR') : '—', mg, y, col)
  campo('Próxima Revisão', dg.prox_revisao ? new Date(dg.prox_revisao + 'T00:00').toLocaleDateString('pt-BR') : '—', mg + col + 5, y, col)
  campo(`${dg.resp_conselho || 'CREA'} Nº`, dg.resp_registro, mg + (col + 5) * 2, y, col)
  y += 10; linha(y); y += 6
  campo('Responsável Técnico', dg.resp_nome, mg, y, col * 2)
  campo('CPF', dg.resp_cpf, mg + col * 2 + 5, y, col)
  y += 12; linha(y); y += 6

  // ── Textos legais (CLT / NR-15 / NR-16) ────────────────
  const textosCustomLip = dados?.textos_legais_custom || {}
  for (const secaoTexto of TEXTOS_LEGAIS_LIP) {
    if (y > 250) { doc.addPage(); y = 20 }
    y = secao(secaoTexto.titulo, y)
    const paragrafos = textosCustomLip[secaoTexto.titulo] || secaoTexto.paragrafos
    for (const p of paragrafos) y = paragrafo(p, y)
    y += 2
  }
  if (y > 240) { doc.addPage(); y = 20 }
  linha(y); y += 6

  const funcoes = dados?.funcoes || []
  const grauMap: Record<string, string> = { minimo: 'Mínimo (10%)', medio: 'Médio (20%)', maximo: 'Máximo (40%)' }
  if (y > 230) { doc.addPage(); y = 20 }
  y = secao(`FUNÇÕES AVALIADAS (${funcoes.length})`, y)
  for (const f of funcoes) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFontSize(10); doc.setTextColor(30); doc.setFont('helvetica', 'bold')
    doc.text(`${f.funcao || '—'}${f.setor ? ` — ${f.setor}` : ''}`, mg, y)
    doc.setFont('helvetica', 'normal'); y += 5

    doc.setFontSize(8); doc.setTextColor(80)
    if (f.insalubre) {
      doc.setTextColor(151, 79, 0)
      doc.text(`Insalubre — grau ${grauMap[f.grau_insalubridade] || f.grau_insalubridade || '—'}${f.percentual_insalubridade ? ` (${f.percentual_insalubridade}%)` : ''}`, mg, y)
      y += 4.5
    }
    if (f.periculoso) {
      doc.setTextColor(151, 30, 30)
      doc.text('Periculoso — adicional de 30%', mg, y)
      y += 4.5
    }
    if (!f.insalubre && !f.periculoso) {
      doc.setTextColor(39, 80, 10)
      doc.text('Sem insalubridade ou periculosidade identificada', mg, y)
      y += 4.5
    }
    if (f.fundamentacao) {
      doc.setFontSize(7); doc.setTextColor(100)
      const linhas = doc.splitTextToSize(`Fundamentação: ${f.fundamentacao}`, W - mg * 2)
      doc.text(linhas, mg, y); y += linhas.length * 3.5
    }
    if (f.agentes?.length) {
      doc.setFontSize(7); doc.setTextColor(100)
      doc.text(`Agentes: ${f.agentes.map((a: any) => a.nome).join(', ')}`, mg, y); y += 4
    }
    y += 3; linha(y); y += 5
  }
  if (!funcoes.length) {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhuma função avaliada.', mg + 2, y); y += 6
  }

  // ── Classificação de Insalubridade e Periculosidade (resumo) ──
  if (funcoes.length) {
    y += 2
    if (y > 240) { doc.addPage(); y = 20 }
    y = secao('CLASSIFICAÇÃO DE INSALUBRIDADE E PERICULOSIDADE', y)
    const colF = (W - mg * 2) * 0.4, colS = (W - mg * 2) * 0.22, colI = (W - mg * 2) * 0.19, colP = (W - mg * 2) * 0.19
    doc.setFillColor(230, 241, 251)
    doc.rect(mg, y, W - mg * 2, 5.5, 'F')
    doc.setFontSize(7); doc.setTextColor(12, 68, 124); doc.setFont('helvetica', 'bold')
    doc.text('FUNÇÃO', mg + 2, y + 4)
    doc.text('SETOR', mg + colF + 2, y + 4)
    doc.text('INSALUBRIDADE', mg + colF + colS + 2, y + 4)
    doc.text('PERICULOSIDADE', mg + colF + colS + colI + 2, y + 4)
    doc.setFont('helvetica', 'normal'); y += 7.5
    for (const f of funcoes) {
      if (y > 275) { doc.addPage(); y = 20 }
      doc.setFontSize(8); doc.setTextColor(30)
      doc.text(f.funcao || '—', mg + 2, y)
      doc.text(f.setor || '—', mg + colF + 2, y)
      const insalTexto = f.insalubre ? `SIM — ${f.percentual_insalubridade || grauMap[f.grau_insalubridade]?.match(/\d+/)?.[0] || ''}%`.trim() : 'NÃO'
      doc.setTextColor(...(f.insalubre ? [151, 79, 0] as [number, number, number] : [39, 80, 10] as [number, number, number]))
      doc.text(insalTexto, mg + colF + colS + 2, y)
      const pericTexto = f.periculoso ? 'SIM — 30%' : 'NÃO'
      doc.setTextColor(...(f.periculoso ? [151, 30, 30] as [number, number, number] : [39, 80, 10] as [number, number, number]))
      doc.text(pericTexto, mg + colF + colS + colI + 2, y)
      doc.setDrawColor(240); doc.line(mg, y + 1.8, W - mg, y + 1.8)
      y += 5.5
    }
    y += 3
  }

  if (y > 250) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  y = desenharAssinaturas(doc, y, mg, W,
    {
      tituloBloco: 'RESPONSÁVEL PELA IMPLEMENTAÇÃO DO LIP',
      descricao: 'Será responsável pelo cumprimento e implementação do LIP — Laudo de Insalubridade e Periculosidade, conforme NR-15 e NR-16.',
      nome: empresa?.resp_nome,
    },
    {
      tituloBloco: 'RESPONSÁVEL PELA ELABORAÇÃO DO LIP',
      descricao: 'Laudo de Insalubridade e Periculosidade, conforme NR-15 e NR-16.',
      nome: dg.resp_nome,
      cargo: 'Técnico/Engenheiro de Segurança do Trabalho',
      extra: `${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim() || undefined,
    }
  )

  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const data = dg.data_elaboracao || new Date().toISOString().split('T')[0]
  abrirPdfEmNovaAba(doc, `LIP_${empresa?.cnpj?.replace(/\D/g, '') || 'empresa'}_${data}.pdf`, _pdfTab)
}

export async function gerarPdfPpp(dados: any, empresa: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const mg = 15
  let y = 15

  function linha(yPos: number) {
    doc.setDrawColor(220, 220, 220)
    doc.line(mg, yPos, W - mg, yPos)
  }
  function secao(texto: string, yPos: number): number {
    doc.setFillColor(24, 95, 165)
    doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 10
  }
  function campo(label: string, valor: string, xPos: number, yPos: number, largura: number): number {
    doc.setFontSize(7); doc.setTextColor(100); doc.text(label.toUpperCase(), xPos, yPos)
    doc.setFontSize(10); doc.setTextColor(30)
    const linhas = doc.splitTextToSize(valor || '—', largura - 2)
    doc.text(linhas, xPos, yPos + 4)
    return yPos + 4 + linhas.length * 5
  }
  function paragrafo(texto: string, yPos: number, tamanho = 9): number {
    doc.setFontSize(tamanho); doc.setTextColor(50)
    const linhas = doc.splitTextToSize(texto, W - mg * 2)
    let yy = yPos
    for (const ln of linhas) {
      if (yy > 278) { doc.addPage(); yy = 20 }
      doc.text(ln, mg, yy)
      yy += 4.3
    }
    return yy + 2
  }

  doc.setFillColor(24, 95, 165)
  doc.rect(0, 0, W, 20, 'F')
  if (empresa?.logo_url) {
    try { doc.addImage(empresa.logo_url, 'JPEG', 2, 2, 16, 16) } catch { }
  }
  doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('PERFIL PROFISSIOGRÁFICO PREVIDENCIÁRIO', W / 2, 8, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('PPP', W / 2, 14, { align: 'center' })
  y = 26

  y = secao('DADOS DA EMPRESA', y)
  const yw = (W - mg * 2)
  campo('Razão Social', empresa?.razao_social, mg, y, yw / 2)
  campo('CNPJ', empresa?.cnpj, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10; linha(y); y += 6

  y = secao('DADOS DO TRABALHADOR', y)
  const func = dados?.funcionario || {}
  campo('Nome Completo', func.nome, mg, y, yw / 2)
  campo('CPF', func.cpf, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10
  campo('Matrícula', func.matricula_esocial, mg, y, yw / 3)
  campo('Função Atual', func.funcao, mg + yw / 3 + 5, y, yw / 3 - 5)
  campo('Admissão', func.data_adm ? new Date(func.data_adm + 'T00:00').toLocaleDateString('pt-BR') : '—', mg + (yw / 3 + 5) * 2, y, yw / 3 - 5)
  y += 12; linha(y); y += 6

  const dg = dados?.dados_gerais || {}
  y = secao('DADOS DO DOCUMENTO', y)
  campo('Data de Emissão', dg.data_elaboracao ? new Date(dg.data_elaboracao + 'T00:00').toLocaleDateString('pt-BR') : '—', mg, y, yw / 2)
  campo('Responsável pelo Preenchimento', `${dg.resp_nome || '—'}${dg.resp_cargo ? ` (${dg.resp_cargo})` : ''}`, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 12; linha(y); y += 6

  // ── Textos legais (Lei 8.213/91 / Decreto 3.048/99) ────
  const textosCustomPpp = dados?.textos_legais_custom || {}
  for (const secaoTexto of TEXTOS_LEGAIS_PPP) {
    if (y > 250) { doc.addPage(); y = 20 }
    y = secao(secaoTexto.titulo, y)
    const paragrafos = textosCustomPpp[secaoTexto.titulo] || secaoTexto.paragrafos
    for (const p of paragrafos) y = paragrafo(p, y)
    y += 2
  }
  if (y > 240) { doc.addPage(); y = 20 }
  linha(y); y += 6

  const historico = dados?.historico || []
  if (y > 220) { doc.addPage(); y = 20 }
  y = secao(`HISTÓRICO DE EXPOSIÇÃO OCUPACIONAL (${historico.length})`, y)
  for (const h of historico) {
    if (y > 245) { doc.addPage(); y = 20 }
    doc.setFontSize(10); doc.setTextColor(30); doc.setFont('helvetica', 'bold')
    const periodo = `${h.periodo_inicio ? new Date(h.periodo_inicio + 'T00:00').toLocaleDateString('pt-BR') : '—'} a ${h.periodo_fim ? new Date(h.periodo_fim + 'T00:00').toLocaleDateString('pt-BR') : 'atual'}`
    doc.text(`${h.funcao || '—'}${h.setor ? ` — ${h.setor}` : ''}`, mg, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8); doc.setTextColor(100)
    doc.text(periodo, W - mg, y, { align: 'right' })
    y += 5
    if (h.agentes?.length) {
      doc.setFontSize(8); doc.setTextColor(80)
      const linhas = doc.splitTextToSize(`Agentes de risco: ${h.agentes.map((a: any) => a.nome).join(', ')}`, W - mg * 2)
      doc.text(linhas, mg, y); y += linhas.length * 4
    }
    doc.setFontSize(8); doc.setTextColor(h.epi_eficaz ? 39 : 151, h.epi_eficaz ? 80 : 30, h.epi_eficaz ? 10 : 30)
    doc.text(h.epi_eficaz ? 'EPI eficaz neste período' : 'EPI não eficaz / não fornecido neste período', mg, y)
    y += 6; linha(y); y += 5
  }
  if (!historico.length) {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum período de exposição registrado.', mg + 2, y); y += 6
  }

  if (y > 250) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  y = desenharAssinaturas(doc, y, mg, W,
    {
      tituloBloco: 'RESPONSÁVEL PELA EMISSÃO DO PPP',
      descricao: 'Será responsável pela veracidade das informações do PPP — Perfil Profissiográfico Previdenciário, conforme Instrução Normativa PRES/INSS.',
      nome: empresa?.resp_nome,
    },
    {
      tituloBloco: 'RESPONSÁVEL PELO PREENCHIMENTO',
      descricao: 'Perfil Profissiográfico Previdenciário — PPP.',
      nome: dg.resp_nome,
      cargo: dg.resp_cargo || 'Responsável pelo preenchimento',
    }
  )

  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const data = dg.data_elaboracao || new Date().toISOString().split('T')[0]
  const nome = func?.nome?.replace(/\s+/g, '_') || 'funcionario'
  abrirPdfEmNovaAba(doc, `PPP_${nome}_${data}.pdf`, _pdfTab)
}

// ── Treinamentos NR ─────────────────────────────────────────
export async function gerarPdfTreinamento(treinamento: any, empresa: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const mg = 15
  let y = 15

  function linha(yPos: number) { doc.setDrawColor(220, 220, 220); doc.line(mg, yPos, W - mg, yPos) }
  function secao(texto: string, yPos: number): number {
    doc.setFillColor(24, 95, 165); doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 10
  }
  function campo(label: string, valorTxt: string, xPos: number, yPos: number, largura: number): number {
    doc.setFontSize(7); doc.setTextColor(100); doc.text(label.toUpperCase(), xPos, yPos)
    doc.setFontSize(10); doc.setTextColor(30)
    const linhas = doc.splitTextToSize(valorTxt || '—', largura - 2)
    doc.text(linhas, xPos, yPos + 4)
    return yPos + 4 + linhas.length * 5
  }
  const fmtData = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

  doc.setFillColor(24, 95, 165); doc.rect(0, 0, W, 20, 'F')
  if (empresa?.logo_url) {
    try { doc.addImage(empresa.logo_url, 'JPEG', 2, 2, 16, 16) } catch { }
  }
  doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('REGISTRO DE TREINAMENTO', W / 2, 8, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(treinamento.norma || '', W / 2, 14, { align: 'center' })
  y = 26

  y = secao('EMPRESA', y)
  const yw = W - mg * 2
  campo('Razão Social', empresa?.razao_social, mg, y, yw / 2)
  campo('CNPJ', empresa?.cnpj, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10; linha(y); y += 6

  y = secao('FUNCIONÁRIO', y)
  const func = treinamento.funcionarios || {}
  campo('Nome', func.nome, mg, y, yw / 2)
  campo('CPF', func.cpf, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10
  campo('Função', func.funcao, mg, y, yw / 2)
  campo('Setor', func.setor, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10; linha(y); y += 6

  y = secao('TREINAMENTO', y)
  campo('Nome do treinamento', treinamento.nome, mg, y, yw)
  y += 10
  campo('Carga horária', treinamento.carga_horaria ? `${treinamento.carga_horaria}h` : '—', mg, y, yw / 3)
  campo('Data de realização', fmtData(treinamento.data_realizacao), mg + yw / 3, y, yw / 3)
  campo('Vencimento', treinamento.data_vencimento ? fmtData(treinamento.data_vencimento) : 'Sem reciclagem', mg + (yw / 3) * 2, y, yw / 3)
  y += 10
  campo('Instrutor', treinamento.instrutor, mg, y, yw / 2)
  campo('Instituição', treinamento.instituicao, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 16

  linha(y); y += 12
  const xMed = W / 2
  doc.line(xMed - 45, y, xMed + 45, y)
  y += 4
  doc.setFontSize(8); doc.setTextColor(80)
  doc.text('Assinatura do funcionário', xMed, y, { align: 'center' })

  doc.setFontSize(7); doc.setTextColor(150)
  doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)

  const nomeArq = func?.nome?.replace(/\s+/g, '_') || 'funcionario'
  abrirPdfEmNovaAba(doc, `Treinamento_${treinamento.norma}_${nomeArq}.pdf`, _pdfTab)
}

// ── Ficha de controle de EPI (NR-6) ──────────────────────────
export async function gerarPdfFichaEpi(funcionario: any, entregas: any[], empresa: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const mg = 15
  let y = 15

  function linha(yPos: number) { doc.setDrawColor(220, 220, 220); doc.line(mg, yPos, W - mg, yPos) }
  function secao(texto: string, yPos: number): number {
    doc.setFillColor(24, 95, 165); doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 10
  }
  function campo(label: string, valorTxt: string, xPos: number, yPos: number, largura: number): number {
    doc.setFontSize(7); doc.setTextColor(100); doc.text(label.toUpperCase(), xPos, yPos)
    doc.setFontSize(10); doc.setTextColor(30)
    const linhas = doc.splitTextToSize(valorTxt || '—', largura - 2)
    doc.text(linhas, xPos, yPos + 4)
    return yPos + 4 + linhas.length * 5
  }
  function tabela(colunas: { titulo: string; largura: number }[], linhas: string[][], yPos: number): number {
    const larguraTotal = colunas.reduce((s, c) => s + c.largura, 0)
    function cabecalho(yy: number) {
      doc.setFillColor(24, 95, 165); doc.rect(mg, yy, larguraTotal, 6, 'F')
      doc.setFontSize(6.5); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
      let xx = mg
      for (const c of colunas) { doc.text(c.titulo, xx + 1.5, yy + 4.2); xx += c.largura }
      doc.setFont('helvetica', 'normal')
      return yy + 6
    }
    if (yPos > 265) { doc.addPage(); yPos = 20 }
    let yy = cabecalho(yPos)
    for (const linhaAtual of linhas) {
      const celulas = linhaAtual.map((texto, ci) => doc.splitTextToSize(texto || '—', colunas[ci].largura - 3))
      const maxLinhas = Math.max(...celulas.map((c: string[]) => c.length), 1)
      const alturaLinha = maxLinhas * 3.6 + 3
      if (yy + alturaLinha > 285) { doc.addPage(); yy = cabecalho(20) }
      doc.setFontSize(7.5); doc.setTextColor(50)
      let x = mg
      for (let ci = 0; ci < colunas.length; ci++) { doc.text(celulas[ci], x + 1.5, yy + 3.2); x += colunas[ci].largura }
      doc.setDrawColor(230); doc.line(mg, yy + alturaLinha - 1, mg + larguraTotal, yy + alturaLinha - 1)
      yy += alturaLinha
    }
    return yy + 3
  }
  const fmtData = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

  doc.setFillColor(24, 95, 165); doc.rect(0, 0, W, 20, 'F')
  if (empresa?.logo_url) {
    try { doc.addImage(empresa.logo_url, 'JPEG', 2, 2, 16, 16) } catch { }
  }
  doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('FICHA DE CONTROLE DE EPI', W / 2, 8, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('NR-6', W / 2, 14, { align: 'center' })
  y = 26

  y = secao('EMPRESA', y)
  const yw = W - mg * 2
  campo('Razão Social', empresa?.razao_social, mg, y, yw / 2)
  campo('CNPJ', empresa?.cnpj, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10; linha(y); y += 6

  y = secao('FUNCIONÁRIO', y)
  campo('Nome', funcionario?.nome, mg, y, yw / 2)
  campo('CPF', funcionario?.cpf, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10
  campo('Função', funcionario?.funcao, mg, y, yw / 2)
  campo('Setor', funcionario?.setor, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 12; linha(y); y += 6

  y = secao('EPIs ENTREGUES', y)
  y = tabela(
    [
      { titulo: 'EPI', largura: 55 },
      { titulo: 'CA', largura: 25 },
      { titulo: 'Qtd', largura: 15 },
      { titulo: 'Entrega', largura: 25 },
      { titulo: 'Validade CA', largura: 25 },
      { titulo: 'Troca prevista', largura: 25 },
      { titulo: 'Ciência', largura: 10 },
    ],
    entregas.map(e => [e.epi_nome, e.ca || '—', String(e.quantidade || 1), fmtData(e.data_entrega), fmtData(e.data_validade_ca), fmtData(e.data_troca_prevista), e.ciencia ? 'Sim' : 'Não']),
    y
  )

  if (y > 255) { doc.addPage(); y = 20 }
  y += 10; linha(y); y += 12
  const xMed = W / 2
  doc.line(xMed - 45, y, xMed + 45, y)
  y += 4
  doc.setFontSize(8); doc.setTextColor(80)
  doc.text('Assinatura do funcionário — declaro ter recebido os EPIs acima e treinamento sobre seu uso correto (NR-6)', xMed, y, { align: 'center', maxWidth: 160 })

  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const nomeArq = funcionario?.nome?.replace(/\s+/g, '_') || 'funcionario'
  abrirPdfEmNovaAba(doc, `Ficha_EPI_${nomeArq}.pdf`, _pdfTab)
}

// ── Ordem de Serviço (NR-1, 1.4.1) ───────────────────────────
export async function gerarPdfOrdemServico(os: any, empresa: any): Promise<void> {
  const _pdfTab = reservarAbaPdf()
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const mg = 15
  let y = 15

  function linha(yPos: number) { doc.setDrawColor(220, 220, 220); doc.line(mg, yPos, W - mg, yPos) }
  function secao(texto: string, yPos: number): number {
    if (yPos > 270) { doc.addPage(); yPos = 20 }
    doc.setFillColor(24, 95, 165); doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 10
  }
  function campo(label: string, valorTxt: string, xPos: number, yPos: number, largura: number): number {
    doc.setFontSize(7); doc.setTextColor(100); doc.text(label.toUpperCase(), xPos, yPos)
    doc.setFontSize(10); doc.setTextColor(30)
    const linhas = doc.splitTextToSize(valorTxt || '—', largura - 2)
    doc.text(linhas, xPos, yPos + 4)
    return yPos + 4 + linhas.length * 5
  }
  function lista(titulo2: string, itens: string[], yPos: number): number {
    if (itens.length === 0) return yPos
    if (yPos > 265) { doc.addPage(); yPos = 20 }
    doc.setFontSize(9); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
    doc.text(titulo2, mg, yPos); yPos += 5
    doc.setFont('helvetica', 'normal'); doc.setTextColor(50)
    for (const item of itens) {
      if (yPos > 280) { doc.addPage(); yPos = 20 }
      const linhas = doc.splitTextToSize(`•  ${item}`, W - mg * 2 - 3)
      doc.setFontSize(9)
      doc.text(linhas, mg + 2, yPos)
      yPos += linhas.length * 4.3 + 1
    }
    return yPos + 3
  }
  function tabela(colunas: { titulo: string; largura: number }[], linhas: string[][], yPos: number): number {
    const larguraTotal = colunas.reduce((s, c) => s + c.largura, 0)
    function cabecalho(yy: number) {
      doc.setFillColor(24, 95, 165); doc.rect(mg, yy, larguraTotal, 6, 'F')
      doc.setFontSize(6.5); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
      let xx = mg
      for (const c of colunas) { doc.text(c.titulo, xx + 1.5, yy + 4.2); xx += c.largura }
      doc.setFont('helvetica', 'normal')
      return yy + 6
    }
    if (yPos > 265) { doc.addPage(); yPos = 20 }
    let yy = cabecalho(yPos)
    for (const linhaAtual of linhas) {
      const celulas = linhaAtual.map((texto, ci) => doc.splitTextToSize(texto || '—', colunas[ci].largura - 3))
      const maxLinhas = Math.max(...celulas.map((c: string[]) => c.length), 1)
      const alturaLinha = maxLinhas * 3.6 + 3
      if (yy + alturaLinha > 285) { doc.addPage(); yy = cabecalho(20) }
      doc.setFontSize(7.5); doc.setTextColor(50)
      let x = mg
      for (let ci = 0; ci < colunas.length; ci++) { doc.text(celulas[ci], x + 1.5, yy + 3.2); x += colunas[ci].largura }
      doc.setDrawColor(230); doc.line(mg, yy + alturaLinha - 1, mg + larguraTotal, yy + alturaLinha - 1)
      yy += alturaLinha
    }
    return yy + 3
  }
  const fmtData = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

  doc.setFillColor(24, 95, 165); doc.rect(0, 0, W, 20, 'F')
  if (empresa?.logo_url) {
    try { doc.addImage(empresa.logo_url, 'JPEG', 2, 2, 16, 16) } catch { }
  }
  doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('ORDEM DE SERVIÇO', W / 2, 8, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('NR-1, item 1.4.1', W / 2, 14, { align: 'center' })
  y = 26

  y = secao('EMPRESA', y)
  const yw = W - mg * 2
  campo('Razão Social', empresa?.razao_social, mg, y, yw / 2)
  campo('CNPJ', empresa?.cnpj, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10; linha(y); y += 6

  y = secao('FUNÇÃO', y)
  campo('Função', os.funcao, mg, y, yw / 2)
  campo('Setor', os.setor, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10
  campo('Data de emissão', fmtData(os.data_emissao), mg, y, yw / 2)
  campo('Responsável', [os.resp_nome, os.resp_cargo].filter(Boolean).join(' — '), mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 14

  const riscos: any[] = os.riscos || []
  if (riscos.length > 0) {
    y = secao('RISCOS IDENTIFICADOS NA FUNÇÃO', y)
    y = tabela(
      [{ titulo: 'Tipo', largura: 35 }, { titulo: 'Agente / Risco', largura: yw - 35 }],
      riscos.map(r => [r.tipo || '—', r.nome || '—']),
      y
    )
  }

  y = lista('MEDIDAS PREVENTIVAS E PROCEDIMENTOS DE SEGURANÇA', os.medidas_preventivas || [], y + 4)
  y = lista('EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL OBRIGATÓRIOS', os.epis_obrigatorios || [], y)

  function paragrafo(texto: string, yPos: number): number {
    const linhasTxt = doc.splitTextToSize(texto, yw)
    let yy = yPos
    for (const ln of linhasTxt) {
      if (yy > 280) { doc.addPage(); yy = 20 }
      doc.setFontSize(9); doc.setTextColor(50); doc.text(ln, mg, yy)
      yy += 4.3
    }
    return yy + 2
  }

  y = secao('ORIENTAÇÕES GERAIS', y + 2)
  y = paragrafo(
    'O funcionário deve seguir rigorosamente as normas de segurança da empresa, utilizar corretamente os EPIs fornecidos, comunicar imediatamente qualquer condição de risco não prevista e participar dos treinamentos oferecidos. O descumprimento das orientações desta Ordem de Serviço pode configurar ato inseguro e sujeitar o trabalhador às medidas disciplinares previstas na legislação trabalhista.',
    y
  )

  const ciencias: any[] = os.ciencias || []
  y = secao('CIÊNCIA DOS FUNCIONÁRIOS', y + 6)
  if (ciencias.length > 0) {
    y = tabela(
      [{ titulo: 'Funcionário', largura: 90 }, { titulo: 'Data da ciência', largura: 40 }, { titulo: 'Assinatura', largura: yw - 130 }],
      ciencias.map(c => [c.nome || '—', fmtData(c.data_ciencia), '']),
      y
    )
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum funcionário desta função registrado ainda.', mg + 2, y); y += 6
  }

  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const nomeArq = (os.funcao || 'funcao').replace(/\s+/g, '_')
  abrirPdfEmNovaAba(doc, `Ordem_Servico_${nomeArq}.pdf`, _pdfTab)
}
