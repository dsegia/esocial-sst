// lib/gerar-pdf.ts
// Geração de PDF para ASO, LTCAT e PCMSO usando jsPDF

import { TEXTOS_LEGAIS_PGR, TEXTO_PLANO_EMERGENCIA, QUADRO2_INTERPRETACAO, QUADRO4_SEVERIDADE, PROBABILIDADE_OPCOES, nivelRisco } from './pgr-conteudo'
import { TEXTOS_LEGAIS_AET } from './aet-conteudo'
import { TEXTOS_LEGAIS_LTCAT } from './ltcat-conteudo'
import { TEXTOS_LEGAIS_PCMSO } from './pcmso-conteudo'
import { TEXTOS_LEGAIS_LIP } from './lip-conteudo'
import { TEXTOS_LEGAIS_PPP } from './ppp-conteudo'

// Bloco de assinaturas em duas colunas — responsável técnico (esquerda) e
// representante legal da empresa (direita) — usado ao final de todos os
// documentos que têm valor técnico-jurídico (PGR, LTCAT, PCMSO, AET, LIP, PPP).
function desenharAssinaturas(
  doc: any, y: number, mg: number, W: number,
  respTecnico: { label: string; nome?: string; extra?: string },
  respLegal: { nome?: string }
): number {
  y += 16 // espaço em branco acima da linha, para caber a assinatura
  const largura = (W - mg * 2 - 20) / 2
  const xEsq = mg + largura / 2
  const xDir = W - mg - largura / 2
  doc.setDrawColor(120)
  doc.line(xEsq - largura / 2, y, xEsq + largura / 2, y)
  doc.line(xDir - largura / 2, y, xDir + largura / 2, y)
  y += 4
  doc.setFontSize(8); doc.setTextColor(80); doc.setFont('helvetica', 'normal')
  doc.text(respTecnico.label, xEsq, y, { align: 'center' })
  doc.text('Representante legal da empresa', xDir, y, { align: 'center' })
  y += 4
  doc.setFontSize(7); doc.setTextColor(120)
  doc.text(respTecnico.nome || '—', xEsq, y, { align: 'center' })
  doc.text(respLegal.nome || '—', xDir, y, { align: 'center' })
  if (respTecnico.extra) {
    y += 3.5
    doc.text(respTecnico.extra, xEsq, y, { align: 'center' })
  }
  return y
}

export async function gerarPdfAso(dados: any): Promise<void> {
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
  doc.save(`ASO_${nome}_${data}.pdf`)
}

export async function gerarPdfLtcat(dados: any, empresa: any): Promise<void> {
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

  // Cabeçalho
  doc.setFillColor(24, 95, 165)
  doc.rect(0, 0, W, 20, 'F')
  doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('LAUDO TÉCNICO DAS CONDIÇÕES AMBIENTAIS DO TRABALHO', W / 2, 8, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('LTCAT — NR-15 / Decreto 3.048/99 Art. 68', W / 2, 14, { align: 'center' })
  y = 26

  // Empresa
  y = secao('DADOS DA EMPRESA', y)
  const yw = (W - mg * 2)
  campo('Razão Social', empresa?.razao_social, mg, y, yw / 2)
  campo('CNPJ', empresa?.cnpj, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10
  campo('Endereço', empresa?.endereco, mg, y, yw / 2)
  campo('Município/UF', `${empresa?.municipio || '—'}/${empresa?.uf || '—'}`, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10; linha(y); y += 6

  // Dados gerais do laudo
  y = secao('DADOS DO LAUDO', y)
  const dg = dados?.dados_gerais || {}
  const col = (W - mg * 2 - 10) / 3
  campo('Data de Emissão', dg.data_emissao ? new Date(dg.data_emissao + 'T00:00').toLocaleDateString('pt-BR') : '—', mg, y, col)
  campo('Data de Vigência', dg.data_vigencia ? new Date(dg.data_vigencia + 'T00:00').toLocaleDateString('pt-BR') : '—', mg + col + 5, y, col)
  campo('Próxima Revisão', dg.prox_revisao ? new Date(dg.prox_revisao + 'T00:00').toLocaleDateString('pt-BR') : '—', mg + (col + 5) * 2, y, col)
  y += 10; linha(y); y += 6
  const colResp = (W - mg * 2 - 10) / 3
  campo('Responsável Técnico', dg.resp_nome, mg, y, colResp)
  campo(`${dg.resp_conselho || 'CREA'} Nº`, dg.resp_registro, mg + colResp + 5, y, colResp)
  campo('CPF', dg.resp_cpf, mg + (colResp + 5) * 2, y, colResp)
  y += 12; linha(y); y += 6

  // ── Textos legais (NR-15 / Decreto 3.048/99) ──────────
  const textosCustomLtcat = dados?.textos_legais_custom || {}
  for (const secaoTexto of TEXTOS_LEGAIS_LTCAT) {
    if (y > 250) { doc.addPage(); y = 20 }
    y = secao(secaoTexto.titulo, y)
    const paragrafos = textosCustomLtcat[secaoTexto.titulo] || secaoTexto.paragrafos
    for (const p of paragrafos) y = paragrafo(p, y)
    y += 2
  }
  if (y > 240) { doc.addPage(); y = 20 }
  linha(y); y += 6

  // GHEs
  const ghes = dados?.ghes || []
  for (let gi = 0; gi < ghes.length; gi++) {
    const ghe = ghes[gi]
    if (y > 255) { doc.addPage(); y = 20 }
    y = secao(`GHE ${gi + 1}: ${ghe.nome || '—'}`, y)

    if (ghe.setor) {
      campo('Setor', ghe.setor, mg, y, (W - mg * 2) / 2)
    }
    campo('Qtd. Trabalhadores', String(ghe.qtd_trabalhadores || '—'), mg + (W - mg * 2) / 2 + 5, y, (W - mg * 2) / 2 - 5)
    campo('Aposentadoria Especial', ghe.aposentadoria_especial ? 'SIM' : 'NÃO', mg + (W - mg * 2) * 0.75 + 5, y, (W - mg * 2) / 4 - 5)
    y += 10

    if (ghe.funcoes?.length) {
      doc.setFontSize(7); doc.setTextColor(100); doc.text('FUNÇÕES/CARGOS', mg, y); y += 4
      doc.setFontSize(9); doc.setTextColor(30)
      const funcText = ghe.funcoes.join(' • ')
      const linhas = doc.splitTextToSize(funcText, W - mg * 2 - 2)
      doc.text(linhas, mg, y); y += linhas.length * 4 + 3
    }

    if (ghe.agentes?.length) {
      doc.setFontSize(7); doc.setTextColor(100); doc.text('AGENTES DE RISCO', mg, y); y += 4
      for (const ag of ghe.agentes) {
        if (y > 265) { doc.addPage(); y = 20 }
        const tipoMap: Record<string, string> = { fis: 'Físico', qui: 'Químico', bio: 'Biológico', erg: 'Ergonômico' }
        const tipo = tipoMap[ag.tipo] || ag.tipo || ''
        doc.setFontSize(9); doc.setTextColor(30)
        doc.text(`• [${tipo}] ${ag.nome}${ag.valor ? ` — ${ag.valor}` : ''}`, mg + 2, y)
        y += 4.5
      }
      y += 2
    } else {
      doc.setFontSize(9); doc.setTextColor(39, 80, 10)
      doc.text('Sem agentes de risco significativos', mg + 2, y); y += 6
    }

    linha(y); y += 5
  }

  if (y > 250) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  y = desenharAssinaturas(doc, y, mg, W,
    { label: 'Responsável técnico', nome: dg.resp_nome, extra: `${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim() || undefined },
    { nome: empresa?.resp_nome }
  )

  // Rodapé
  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const data = dados?.dados_gerais?.data_emissao || new Date().toISOString().split('T')[0]
  doc.save(`LTCAT_${empresa?.cnpj?.replace(/\D/g, '') || 'empresa'}_${data}.pdf`)
}

export async function gerarPdfPcmso(dados: any, empresa: any): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const mg = 15
  let y = 15

  function secao(texto: string, yPos: number): number {
    doc.setFillColor(39, 80, 10)
    doc.rect(mg, yPos, W - mg * 2, 6, 'F')
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(texto, mg + 3, yPos + 4.2)
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal')
    return yPos + 10
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

  // Cabeçalho
  doc.setFillColor(39, 80, 10)
  doc.rect(0, 0, W, 20, 'F')
  doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('PROGRAMA DE CONTROLE MÉDICO DE SAÚDE OCUPACIONAL', W / 2, 8, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('PCMSO — NR-7 / Portaria MTE 3.214/78', W / 2, 14, { align: 'center' })
  y = 26

  // Empresa
  y = secao('DADOS DA EMPRESA', y)
  doc.setFontSize(7); doc.setTextColor(100); doc.text('RAZÃO SOCIAL', mg, y); y += 4
  doc.setFontSize(11); doc.setTextColor(30); doc.setFont('helvetica', 'bold')
  doc.text(empresa?.razao_social || '—', mg, y); doc.setFont('helvetica', 'normal'); y += 5
  doc.setFontSize(9); doc.setTextColor(80)
  doc.text(`CNPJ: ${empresa?.cnpj || '—'} | ${empresa?.municipio || '—'}/${empresa?.uf || '—'}`, mg, y); y += 8

  const dg = dados?.dados_gerais || {}
  doc.setFontSize(7); doc.setTextColor(100)
  doc.text('MÉDICO COORDENADOR', mg, y); doc.text('CRM', mg + 90, y); doc.text('ELABORAÇÃO', mg + 140, y); y += 4
  doc.setFontSize(10); doc.setTextColor(30)
  doc.text(dg.medico_nome || '—', mg, y)
  doc.text(dg.medico_crm ? `CRM ${dg.medico_crm}` : '—', mg + 90, y)
  doc.text(dg.data_elaboracao ? new Date(dg.data_elaboracao + 'T00:00').toLocaleDateString('pt-BR') : '—', mg + 140, y)
  y += 5
  if (dg.medico_cpf) {
    doc.setFontSize(7); doc.setTextColor(100)
    doc.text(`CPF: ${dg.medico_cpf}`, mg, y)
  }
  y += 5

  // ── Textos legais (NR-7) ────────────────────────────────
  const textosCustomPcmso = dados?.textos_legais_custom || {}
  for (const secaoTexto of TEXTOS_LEGAIS_PCMSO) {
    if (y > 250) { doc.addPage(); y = 20 }
    y = secao(secaoTexto.titulo, y)
    const paragrafos = textosCustomPcmso[secaoTexto.titulo] || secaoTexto.paragrafos
    for (const p of paragrafos) y = paragrafo(p, y)
    y += 2
  }
  if (y > 240) { doc.addPage(); y = 20 }
  y += 4

  // Programas por função
  const programas = dados?.programas || []
  for (let pi = 0; pi < programas.length; pi++) {
    const prog = programas[pi]
    if (y > 245) { doc.addPage(); y = 20 }
    y = secao(`FUNÇÃO: ${prog.funcao || '—'}${prog.setor ? ` — ${prog.setor}` : ''}`, y)

    if (prog.riscos?.length) {
      doc.setFontSize(7); doc.setTextColor(100); doc.text('RISCOS OCUPACIONAIS', mg, y); y += 4
      doc.setFontSize(9); doc.setTextColor(80)
      const riscosText = prog.riscos.join(' • ')
      const linhas = doc.splitTextToSize(riscosText, W - mg * 2)
      doc.text(linhas, mg, y); y += linhas.length * 4 + 3
    }

    if (prog.exames?.length) {
      doc.setFontSize(7); doc.setTextColor(100); doc.text('EXAMES PREVISTOS', mg, y); y += 4
      doc.setFillColor(245, 247, 250)
      doc.rect(mg, y, W - mg * 2, 5.5, 'F')
      doc.setFontSize(8); doc.setTextColor(80); doc.setFont('helvetica', 'bold')
      doc.text('EXAME', mg + 2, y + 4); doc.text('PERIODICIDADE', mg + 110, y + 4)
      doc.setFont('helvetica', 'normal'); y += 7

      for (const ex of prog.exames) {
        if (y > 270) { doc.addPage(); y = 20 }
        const nome = typeof ex === 'string' ? ex : ex.nome
        const period = typeof ex === 'object' ? ex.periodicidade || 'Anual' : 'Anual'
        doc.setFontSize(9); doc.setTextColor(30)
        doc.text(`• ${nome}`, mg + 2, y)
        doc.setTextColor(80); doc.text(period, mg + 110, y)
        doc.setDrawColor(240); doc.line(mg, y + 1.5, W - mg, y + 1.5)
        y += 5.5
      }
    }
    y += 4
  }

  if (y > 250) { doc.addPage(); y = 20 }
  y += 6; doc.setDrawColor(220, 220, 220); doc.line(mg, y, W - mg, y); y += 10
  y = desenharAssinaturas(doc, y, mg, W,
    { label: 'Médico coordenador do PCMSO', nome: dg.medico_nome, extra: dg.medico_crm ? `CRM ${dg.medico_crm}` : undefined },
    { nome: empresa?.resp_nome }
  )

  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const data = dg.data_elaboracao || new Date().toISOString().split('T')[0]
  doc.save(`PCMSO_${empresa?.cnpj?.replace(/\D/g, '') || 'empresa'}_${data}.pdf`)
}

export async function gerarPdfPgr(dados: any, empresa: any): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let W = 210, H = 297
  const mg = 15
  let y = 15
  let indicePages: Array<{titulo: string, pagina: number}> = []
  const paginas = { capa: 1 }

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

  const dg = dados?.dados_gerais || {}
  const ambientes = dados?.ambientes || []
  const inventario = dados?.inventario || []
  const planoAcao = dados?.plano_acao || []
  const tipoMap: Record<string, string> = { fis: 'Físico', qui: 'Químico', bio: 'Biológico', erg: 'Ergonômico', aci: 'Mecânico/Acidentes', psi: 'Psicossocial' }

  // ── PÁGINA 1: CAPA PROFISSIONAL ──────────────────────
  doc.setFillColor(24, 95, 165)
  doc.rect(0, 0, W, 30, 'F')
  doc.setFontSize(18); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('PROGRAMA DE GERENCIAMENTO DE RISCOS', W / 2, 12, { align: 'center' })
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text('PGR — NR-1 / Portaria SEPRT nº 6.730/2020', W / 2, 18, { align: 'center' })
  doc.setFontSize(9)
  doc.text('Conforme Portaria 1.419/2024 (Vigência: 26/05/2026)', W / 2, 24, { align: 'center' })

  y = 50
  doc.setFontSize(12); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
  doc.text(empresa?.razao_social || 'EMPRESA', W / 2, y, { align: 'center' }); y += 8
  doc.setFontSize(9); doc.setTextColor(80); doc.setFont('helvetica', 'normal')
  doc.text(`CNPJ: ${empresa?.cnpj || '—'}`, W / 2, y, { align: 'center' }); y += 20

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

  y += 30
  doc.setFontSize(8); doc.setTextColor(120); doc.setFont('helvetica', 'italic')
  doc.text('Este documento é confidencial e de uso exclusivo da empresa acima identificada.', W / 2, y, { align: 'center' })

  paginas.capa = 1

  // ── PÁGINA 2: CONTRACAPA COM DADOS COMPLETOS ────────
  doc.addPage()
  y = 20
  y = secao('IDENTIFICAÇÃO DA EMPRESA', y)
  const yw = (W - mg * 2)
  y = campo('Razão Social', empresa?.razao_social, mg, y, yw) + 2
  y = campo('Nome Fantasia', empresa?.nome_fantasia || '—', mg, y, yw) + 2
  y = campo('CNPJ', empresa?.cnpj, mg, y, yw / 2)
  y = campo('Inscrição Estadual', empresa?.inscricao_estadual, mg + yw / 2 + 2, y - (yw/2 + 4), yw / 2 - 2) + 2
  y = campo('Inscrição Municipal', empresa?.inscricao_municipal || '—', mg, y, yw / 2)
  y = campo('CNAE', `${empresa?.cnae || '—'}${empresa?.cnae_descricao ? ' — ' + empresa.cnae_descricao : ''}`, mg + yw / 2 + 2, y - (yw/2 + 4), yw / 2 - 2) + 2
  y = campo('Grau de Risco (NR-4)', `Classe ${empresa?.grau_risco || '—'}`, mg, y, yw / 3)
  y = campo('Nº de Empregados', empresa?.numero_empregados != null ? String(empresa.numero_empregados) : '—', mg + yw / 3 + 2, y - (yw/3 + 4), yw / 3 - 2)
  y = campo('Horário de Funcionamento', empresa?.horario_funcionamento || '—', mg + (yw / 3) * 2 + 2, y - (yw/3 + 4), yw / 3 - 2) + 2
  y = campo('Endereço', `${empresa?.endereco || '—'}${empresa?.municipio ? ', ' + empresa.municipio : ''}${empresa?.uf ? '/' + empresa.uf : ''}${empresa?.cep ? ' — ' + empresa.cep : ''}`, mg, y, yw) + 2
  y = campo('Telefone', empresa?.telefone, mg, y, yw / 2)
  y = campo('E-mail', empresa?.email, mg + yw / 2 + 2, y - (yw/2 + 4), yw / 2 - 2) + 2

  y += 4; y = secao('RESPONSÁVEIS PELO PGR', y)
  y = campo('Responsável Legal (Implementação)', `${empresa?.resp_nome || '—'}${empresa?.resp_cargo ? ` — ${empresa.resp_cargo}` : ''}`, mg, y, yw) + 2
  y = campo('Responsável Técnico (Elaboração)', `${dg.resp_nome || '—'} — ${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim(), mg, y, yw) + 2
  if (empresa?.resp_telefone || empresa?.resp_email) {
    y = campo('Contato', `${empresa?.resp_telefone || '—'} — ${empresa?.resp_email || '—'}`, mg, y, yw) + 2
  }

  paginas.contracapa = 2

  // ── PÁGINA 3: HISTÓRICO DE REVISÕES ────────────────
  doc.addPage()
  y = 20
  y = secao('HISTÓRICO DE REVISÕES', y)
  const historicoRevisoes = dados?.historico_revisoes || []
  if (historicoRevisoes.length > 0) {
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
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhuma revisão anterior registrada (Documento inicial).', mg + 2, y); y += 6
  }
  paginas.historico = 3

  // ── PÁGINA 4: OBJETIVOS E RESPONSABILIDADES ────────
  doc.addPage()
  y = 20
  y = secao('OBJETIVOS E RESPONSABILIDADES', y)
  y = subSecao('Objetivo do PGR', y)
  y = paragrafo(
    'Estabelecer e implementar medidas de proteção da saúde e da integridade física dos trabalhadores através da identificação, avaliação, ' +
    'monitoramento e controle dos riscos ambientais presentes nos locais de trabalho, em conformidade com a NR-1 (Portaria 6.730/2020) e legislação correlata.',
    y, 9
  )
  y = subSecao('Responsabilidades da Empresa', y)
  const responsabilidades = [
    'Garantir a implementação das medidas de proteção contra riscos ambientais',
    'Disponibilizar recursos financeiros, materiais e humanos necessários',
    'Manter o PGR atualizado e disponível para consulta dos trabalhadores',
    'Realizar avaliações periódicas dos riscos conforme cronograma estabelecido',
    'Adotar medidas de eliminação ou minimização de riscos',
    'Fornecer equipamentos de proteção individual e coletiva',
  ]
  for (const resp of responsabilidades) {
    doc.setFontSize(9); doc.setTextColor(50)
    doc.text(`• ${resp}`, mg + 5, y); y += 5
  }
  y += 3
  y = subSecao('Responsabilidades do Responsável Técnico', y)
  const respTec = [
    'Elaborar, atualizar e revisar o PGR',
    'Supervisionar a implementação das medidas de controle',
    'Fornecer assessoria técnica à empresa',
    'Acompanhar o cumprimento das obrigações legais',
  ]
  for (const rt of respTec) {
    doc.setFontSize(9); doc.setTextColor(50)
    doc.text(`• ${rt}`, mg + 5, y); y += 5
  }

  paginas.objetivos = 4

  // ── PÁGINA 5: ÍNDICE AUTOMÁTICO ────────────────────
  doc.addPage()
  y = 20
  y = secao('ÍNDICE', y)
  y += 4
  indicePages = [
    { titulo: '1. Identificação da Empresa', pagina: 2 },
    { titulo: '2. Histórico de Revisões', pagina: 3 },
    { titulo: '3. Objetivos e Responsabilidades', pagina: 4 },
    { titulo: '4. Ambientes de Trabalho', pagina: 6 },
    { titulo: '5. Inventário de Riscos', pagina: 7 },
    { titulo: '6. Plano de Ação', pagina: 9 },
    { titulo: '7. Matriz de Riscos', pagina: 10 },
    { titulo: '8. Anexos', pagina: 11 },
  ]
  doc.setFontSize(9); doc.setTextColor(30)
  for (const item of indicePages) {
    doc.text(item.titulo, mg, y)
    doc.text(String(item.pagina), W - mg - 5, y, { align: 'right' })
    y += 6
  }
  y += 6; linha(y); y += 6
  doc.setFontSize(8); doc.setTextColor(100)
  doc.text(`Total de páginas: ${(doc as any).internal.getNumberOfPages()}`, mg, y)

  paginas.indice = 5

  // ── Dados da empresa ──────────────────────────────────
  doc.addPage()
  y = 20
  y = secao('DADOS DA EMPRESA', y)
  yw = (W - mg * 2)
  campo('Razão Social', empresa?.razao_social, mg, y, yw / 2)
  campo('CNPJ', empresa?.cnpj, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10
  campo('CNAE', `${empresa?.cnae || '—'}${empresa?.cnae_descricao ? ' — ' + empresa.cnae_descricao : ''}`, mg, y, yw / 2)
  campo('Grau de Risco', empresa?.grau_risco != null ? String(empresa.grau_risco) : '—', mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10
  campo('Endereço', `${empresa?.endereco || '—'}${empresa?.municipio ? ', ' + empresa.municipio : ''}${empresa?.uf ? '/' + empresa.uf : ''}${empresa?.cep ? ' — ' + empresa.cep : ''}`, mg, y, yw)
  y += 10
  campo('Telefone', empresa?.telefone, mg, y, yw / 2)
  campo('E-mail', empresa?.email, mg + yw / 2 + 5, y, yw / 2 - 5)
  y += 10
  campo('Inscrição Estadual', empresa?.inscricao_estadual, mg, y, yw / 3)
  campo('Inscrição Municipal', empresa?.inscricao_municipal, mg + yw / 3, y, yw / 3)
  campo('Nº de Empregados', empresa?.numero_empregados != null ? String(empresa.numero_empregados) : '—', mg + (yw / 3) * 2, y, yw / 3)
  y += 12
  campo('Representante Legal', `${empresa?.resp_nome || '—'}${empresa?.resp_cargo ? ` (${empresa.resp_cargo})` : ''}`, mg, y, yw)
  y += 12; linha(y); y += 6

  // ── Textos legais (NR-1) ──────────────────────────────
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

  // ── Responsáveis ──────────────────────────────────────
  y = secao('RESPONSÁVEIS PELO PGR', y)
  campo('Responsável pela implementação (representante legal)', empresa?.resp_nome, mg, y, yw)
  y += 12
  campo('Responsável pela elaboração', `${dg.resp_nome || '—'} — ${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim(), mg, y, yw)
  y += 14; linha(y); y += 6

  // ── Ambientes de trabalho ─────────────────────────────
  if (y > 245) { doc.addPage(); y = 20 }
  y = secao(`AMBIENTES DE TRABALHO (${ambientes.length})`, y)
  if (ambientes.length) {
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
  y = secao(`INVENTÁRIO DE RISCOS POR GHE (${inventario.length})`, y)
  if (inventario.length) {
    for (const g of inventario) {
      if (y > H - 30) { doc.addPage(); y = 20 }
      doc.setFontSize(10); doc.setTextColor(24, 95, 165); doc.setFont('helvetica', 'bold')
      doc.text(g.nome || 'GHE', mg, y)
      doc.setFont('helvetica', 'normal')
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
        const funcoesTexto = g.funcoes
          .map((f: any) => (f.atividades ? `${f.nome} (${f.atividades})` : f.nome))
          .filter(Boolean).join('; ')
        if (funcoesTexto) y = paragrafo(`Funções: ${funcoesTexto}`, y, 8)
      }
      y += 1

      if (g.riscos?.length) {
        y = tabela(
          [
            { titulo: 'PERIGO', largura: 26 },
            { titulo: 'FONTES/CIRCUNST.', largura: 31 },
            { titulo: 'TIPO', largura: 17 },
            { titulo: 'CÓD. ESOCIAL', largura: 16 },
            { titulo: 'RISCO', largura: 34 },
            { titulo: 'NÍVEL DE RISCO', largura: 24 },
            { titulo: 'DANOS À SAÚDE', largura: 30 },
            { titulo: 'MEDIÇÃO', largura: 16 },
            { titulo: 'LT/LEO', largura: 14 },
            { titulo: 'EQUIPAMENTO', largura: 20 },
            { titulo: 'TRAJETÓRIA', largura: 18 },
            { titulo: 'EXPOSIÇÃO', largura: 21 },
          ],
          g.riscos.map((r: any) => {
            const nr = nivelRisco(r.severidade, r.probabilidade)
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
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum GHE cadastrado.', mg + 2, y); y += 6
  }

  // ── GRÁFICO: Distribuição de Riscos por Nível ────────
  if (y > H - 50) { doc.addPage(); y = 20 }
  y = subSecao('Distribuição de Riscos por Nível', y)

  // Contar riscos por nível
  const distribuicaoRiscos: Record<string, number> = { 'CRÍTICO': 0, 'ALTO': 0, 'MÉDIO': 0, 'BAIXO': 0, 'IRRELEVANTE': 0 }
  for (const g of inventario) {
    for (const r of (g.riscos || [])) {
      const nr = nivelRisco(r.severidade, r.probabilidade)
      if (nr?.faixa) distribuicaoRiscos[nr.faixa]++
    }
  }

  const totalRiscos = Object.values(distribuicaoRiscos).reduce((a, b) => a + b, 0)
  if (totalRiscos > 0) {
    // Desenhar barras horizontal
    let yy = y
    const corRiscos: Record<string, [number, number, number]> = {
      'CRÍTICO': [220, 20, 20],
      'ALTO': [255, 140, 0],
      'MÉDIO': [255, 193, 7],
      'BAIXO': [100, 200, 50],
      'IRRELEVANTE': [150, 200, 100],
    }

    for (const [nivel, count] of Object.entries(distribuicaoRiscos)) {
      const pct = totalRiscos > 0 ? (count / totalRiscos) * 100 : 0
      const larguraBarra = (pct / 100) * 120
      doc.setFontSize(8); doc.setTextColor(50)
      doc.text(`${nivel}:`, mg, yy);
      const [r, g, b] = corRiscos[nivel]
      doc.setFillColor(r, g, b); doc.rect(mg + 35, yy - 2.5, larguraBarra, 3, 'F')
      doc.setTextColor(50); doc.text(`${count} (${pct.toFixed(0)}%)`, mg + 35 + larguraBarra + 5, yy)
      yy += 6
    }
  } else {
    doc.setFontSize(9); doc.setTextColor(120)
    doc.text('Nenhum risco cadastrado.', mg + 2, y); y += 5
  }
  y += 35

  // volta para retrato para o restante do documento
  doc.addPage('a4', 'portrait'); W = 210; H = 297; y = 20

  // ── Plano de ação ─────────────────────────────────────
  if (y > 230) { doc.addPage(); y = 20 }
  y = secao(`PLANO DE AÇÃO (${planoAcao.length})`, y)
  const statusMap: Record<string, string> = { pendente: 'Pendente', andamento: 'Em andamento', concluida: 'Concluída' }
  const priorMap: Record<string, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
  if (planoAcao.length) {
    y = tabela(
      [
        { titulo: 'RISCO (PRIORIDADE)', largura: 35 },
        { titulo: 'O QUE', largura: 45 },
        { titulo: 'POR QUE', largura: 35 },
        { titulo: 'QUEM / COMO / ONDE', largura: 40 },
        { titulo: 'QUANDO / STATUS', largura: 25 },
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

  // ── Imagens anexas ────────────────────────────────────
  const imagensAnexas = dados?.imagens_anexas || []
  if (imagensAnexas.length) {
    doc.addPage(); y = 20
    y = secao(`IMAGENS ANEXAS (${imagensAnexas.length})`, y)
    y = inserirImagens(
      imagensAnexas.map((im: any) => im.dataUrl),
      y,
      imagensAnexas.map((im: any) => im.legenda),
    )
  }

  // ── Anexo I — Plano de Emergência ─────────────────────
  doc.addPage(); y = 20
  y = secao(TEXTO_PLANO_EMERGENCIA.titulo, y)
  for (const secaoEmerg of TEXTO_PLANO_EMERGENCIA.secoes) {
    if (y > 260) { doc.addPage(); y = 20 }
    y = subSecao(secaoEmerg.subtitulo, y)
    for (const p of secaoEmerg.paragrafos) y = paragrafo(p, y)
    y += 2
  }

  // ── Anexo II — Matriz de Risco Visual (Heatmap) ─────
  doc.addPage(); y = 20
  y = secao('ANEXO — MATRIZ DE RISCO', y)
  y = subSecao('Heatmap Visual — Distribuição de Riscos (Probabilidade × Severidade)', y)

  // Construir matriz 5x5 com riscos
  const matrizRiscos: number[][] = Array(5).fill(0).map(() => Array(5).fill(0))
  for (const g of inventario) {
    for (const r of (g.riscos || [])) {
      const sev = parseInt(r.severidade) || 3
      const prob = parseInt(r.probabilidade) || 3
      if (sev >= 1 && sev <= 5 && prob >= 1 && prob <= 5) {
        matrizRiscos[5 - sev][prob - 1]++
      }
    }
  }

  // Desenhar grid 5x5
  const tamCelula = 12
  const startX = mg + 20
  const startY = y + 10
  const corMatriz = ['#E5F3E5', '#D4EDD4', '#FFF4E6', '#FFE6CC', '#FFB3B3'] // Verde → Vermelho

  doc.setFontSize(7); doc.setTextColor(100)
  doc.text('SEVERIDADE ↓', mg + 2, startY - 5)
  doc.text('PROBABILIDADE →', startX + (tamCelula * 5) / 2 - 20, startY + (tamCelula * 5) + 5)

  // Cabeçalho (Probabilidade)
  for (let p = 1; p <= 5; p++) {
    doc.setFillColor(240, 240, 240)
    doc.rect(startX + (p - 1) * tamCelula, startY - tamCelula, tamCelula, tamCelula)
    doc.setFontSize(6); doc.setTextColor(80)
    doc.text(String(p), startX + (p - 1) * tamCelula + tamCelula / 2, startY - tamCelula / 2 + 2, { align: 'center' })
  }

  // Linhas (Severidade)
  for (let s = 5; s >= 1; s--) {
    doc.setFillColor(240, 240, 240)
    doc.rect(startX - tamCelula, startY + (5 - s) * tamCelula, tamCelula, tamCelula)
    doc.setFontSize(6); doc.setTextColor(80)
    doc.text(String(s), startX - tamCelula / 2, startY + (5 - s) * tamCelula + tamCelula / 2 + 2, { align: 'center' })
  }

  // Preencher matriz
  for (let s = 1; s <= 5; s++) {
    for (let p = 1; p <= 5; p++) {
      const count = matrizRiscos[5 - s][p - 1]
      const idx = Math.min(Math.floor((count / 10) * 5), 4) // Escala de 0-4
      const [r, g, b] = hexRgb(corMatriz[idx])
      doc.setFillColor(r, g, b)
      doc.rect(startX + (p - 1) * tamCelula, startY + (5 - s) * tamCelula, tamCelula, tamCelula, 'FD')
      if (count > 0) {
        doc.setFontSize(7); doc.setTextColor(0)
        doc.text(String(count), startX + (p - 1) * tamCelula + tamCelula / 2, startY + (5 - s) * tamCelula + tamCelula / 2 + 1.5, { align: 'center' })
      }
    }
  }

  y = startY + (tamCelula * 5) + 15

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
  y = subSecao('Quadro 2 — Critério de probabilidade', y)
  for (const p of PROBABILIDADE_OPCOES) {
    if (y > 278) { doc.addPage(); y = 20 }
    doc.setFontSize(8); doc.setTextColor(50)
    doc.text(`${p.v} — ${p.l}`, mg + 2, y); y += 4.5
  }
  y += 3
  y = subSecao('Quadro 3 — Critério de severidade', y)
  for (const sv of QUADRO4_SEVERIDADE) {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.setFontSize(8); doc.setTextColor(50)
    doc.text(`${sv.v} — ${sv.l}: ${sv.efeito}`, mg + 2, y); y += 4.5
  }

  if (y > 250) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  y = desenharAssinaturas(doc, y, mg, W,
    { label: 'Responsável pela elaboração', nome: dg.resp_nome, extra: `${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim() || undefined },
    { nome: empresa?.resp_nome }
  )

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
  doc.save(`PGR_${empresa?.cnpj?.replace(/\D/g, '') || 'empresa'}_${data}.pdf`)
}

export async function gerarPdfAet(dados: any, empresa: any): Promise<void> {
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
    { label: 'Responsável técnico', nome: dg.resp_nome, extra: `${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim() || undefined },
    { nome: empresa?.resp_nome }
  )

  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const data = dg.data_elaboracao || new Date().toISOString().split('T')[0]
  doc.save(`AET_${empresa?.cnpj?.replace(/\D/g, '') || 'empresa'}_${data}.pdf`)
}

export async function gerarPdfApr(dados: any, empresa: any): Promise<void> {
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
  doc.save(`APR_${(dg.atividade || 'atividade').replace(/\s+/g, '_')}_${data}.pdf`)
}

export async function gerarPdfLip(dados: any, empresa: any): Promise<void> {
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
    { label: 'Responsável técnico', nome: dg.resp_nome, extra: `${dg.resp_conselho || 'CREA'} ${dg.resp_registro || ''}`.trim() || undefined },
    { nome: empresa?.resp_nome }
  )

  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
  }

  const data = dg.data_elaboracao || new Date().toISOString().split('T')[0]
  doc.save(`LIP_${empresa?.cnpj?.replace(/\D/g, '') || 'empresa'}_${data}.pdf`)
}

export async function gerarPdfPpp(dados: any, empresa: any): Promise<void> {
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
    { label: 'Responsável pelo preenchimento', nome: dg.resp_nome, extra: dg.resp_cargo || undefined },
    { nome: empresa?.resp_nome }
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
  doc.save(`PPP_${nome}_${data}.pdf`)
}

// ── Treinamentos NR ─────────────────────────────────────────
export async function gerarPdfTreinamento(treinamento: any, empresa: any): Promise<void> {
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
  doc.save(`Treinamento_${treinamento.norma}_${nomeArq}.pdf`)
}

// ── Ficha de controle de EPI (NR-6) ──────────────────────────
export async function gerarPdfFichaEpi(funcionario: any, entregas: any[], empresa: any): Promise<void> {
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
  doc.save(`Ficha_EPI_${nomeArq}.pdf`)
}

// ── Ordem de Serviço (NR-1, 1.4.1) ───────────────────────────
export async function gerarPdfOrdemServico(os: any, empresa: any): Promise<void> {
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
  doc.save(`Ordem_Servico_${nomeArq}.pdf`)
}
