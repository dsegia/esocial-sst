// lib/gerar-pdf.ts
// Geração de PDF para ASO, LTCAT e PCMSO usando jsPDF

import { TEXTOS_LEGAIS_PGR, TEXTO_PLANO_EMERGENCIA, QUADRO2_INTERPRETACAO, QUADRO4_SEVERIDADE, PROBABILIDADE_OPCOES, nivelRisco } from './pgr-conteudo'
import { TEXTOS_LEGAIS_AET } from './aet-conteudo'

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
  const W = 210; const mg = 15
  let y = 15

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
    if (yPos > 275) { doc.addPage(); yPos = 20 }
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
      if (yy > 278) { doc.addPage(); yy = 20 }
      doc.text(ln, mg, yy)
      yy += 4.3
    }
    return yy + 2
  }
  function tabela(colunas: { titulo: string; largura: number }[], linhas: string[][], yPos: number): number {
    const larguraTotal = colunas.reduce((s, c) => s + c.largura, 0)
    function cabecalho(yy: number) {
      doc.setFillColor(24, 95, 165)
      doc.rect(mg, yy, larguraTotal, 6, 'F')
      doc.setFontSize(6.5); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
      let xx = mg
      for (const col of colunas) { doc.text(col.titulo, xx + 1.5, yy + 4.2); xx += col.largura }
      doc.setFont('helvetica', 'normal')
      return yy + 6
    }
    if (yPos > 265) { doc.addPage(); yPos = 20 }
    let yy = cabecalho(yPos)
    for (const linha of linhas) {
      const celulas = linha.map((texto, ci) => doc.splitTextToSize(texto || '—', colunas[ci].largura - 3))
      const maxLinhas = Math.max(...celulas.map((c: string[]) => c.length), 1)
      const alturaLinha = maxLinhas * 3.6 + 3
      if (yy + alturaLinha > 285) { doc.addPage(); yy = cabecalho(20) }
      doc.setFontSize(7.5); doc.setTextColor(50)
      let x = mg
      for (let ci = 0; ci < colunas.length; ci++) {
        doc.text(celulas[ci], x + 1.5, yy + 3.2)
        x += colunas[ci].largura
      }
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
      if (yy + tam > 285) { doc.addPage(); yy = 20; x = mg }
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

  // ── Capa ──────────────────────────────────────────────
  doc.setFillColor(24, 95, 165)
  doc.rect(0, 0, W, 24, 'F')
  doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.text('PROGRAMA DE GERENCIAMENTO DE RISCOS', W / 2, 9, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('PGR — NR-1 · Portaria SEPRT nº 6.730/2020', W / 2, 15, { align: 'center' })
  if (dg.data_elaboracao) {
    const periodo = `Período: ${new Date(dg.data_elaboracao + 'T00:00').toLocaleDateString('pt-BR')}${dg.prox_revisao ? ` a ${new Date(dg.prox_revisao + 'T00:00').toLocaleDateString('pt-BR')}` : ''}`
    doc.text(periodo, W / 2, 20.5, { align: 'center' })
  }
  y = 30

  // ── Dados da empresa ──────────────────────────────────
  y = secao('DADOS DA EMPRESA', y)
  const yw = (W - mg * 2)
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

  // ── Inventário de riscos por GHE ──────────────────────
  if (y > 235) { doc.addPage(); y = 20 }
  y = secao(`INVENTÁRIO DE RISCOS POR GHE (${inventario.length})`, y)
  if (inventario.length) {
    for (const g of inventario) {
      if (y > 250) { doc.addPage(); y = 20 }
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
      if (g.imagem) {
        if (y + 35 > 285) { doc.addPage(); y = 20 }
        y = inserirImagens([g.imagem], y)
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
            { titulo: 'PERIGO / RISCO', largura: 45 },
            { titulo: 'FONTES/CIRCUNST.', largura: 35 },
            { titulo: 'CÓD. ESOCIAL', largura: 20 },
            { titulo: 'SEV/PROB/NÍVEL', largura: 30 },
            { titulo: 'MEDIÇÃO', largura: 25 },
            { titulo: 'EXPOSIÇÃO', largura: 25 },
          ],
          g.riscos.map((r: any) => {
            const nr = nivelRisco(r.severidade, r.probabilidade)
            return [
              `[${tipoMap[r.tipo] || r.tipo}] ${r.nome || '—'}${r.perigo ? ` — ${r.perigo}` : ''}`,
              r.fontes_circunstancias || '—',
              r.codigo_esocial || '—',
              nr ? `${r.severidade}/${r.probabilidade} = ${nr.faixa} (${nr.valor})` : '—',
              r.valor ? `${r.valor}${r.unidade ? ' ' + r.unidade : ''}${r.limite ? ' / LT ' + r.limite : ''}` : '—',
              [r.trajetoria, r.tipo_exposicao].filter(Boolean).join(' / ') || '—',
            ]
          }),
          y,
        )
        const danos = g.riscos.filter((r: any) => r.possiveis_danos).map((r: any) => `${r.nome}: ${r.possiveis_danos}`).join(' · ')
        if (danos) y = paragrafo(`Possíveis danos à saúde — ${danos}`, y, 7)
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
  y += 2; linha(y); y += 6

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

  // ── Anexo II — Matriz de Risco ────────────────────────
  doc.addPage(); y = 20
  y = secao('ANEXO — MATRIZ DE RISCO', y)
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

  // ── Rodapé ────────────────────────────────────────────
  const totalPags = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`eSocial SST — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, mg, 292)
    doc.text(`Página ${p}/${totalPags}`, W - mg, 292, { align: 'right' })
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

  if (y > 255) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  const xMed = W / 2
  doc.line(xMed - 45, y, xMed + 45, y)
  y += 4
  doc.setFontSize(8); doc.setTextColor(80)
  doc.text('Assinatura e carimbo do responsável técnico', xMed, y, { align: 'center' })

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

  if (y > 255) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  const xMed = W / 2
  doc.line(xMed - 45, y, xMed + 45, y)
  y += 4
  doc.setFontSize(8); doc.setTextColor(80)
  doc.text('Assinatura e carimbo do responsável técnico', xMed, y, { align: 'center' })

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

  if (y > 255) { doc.addPage(); y = 20 }
  y += 6; linha(y); y += 10
  const xMed = W / 2
  doc.line(xMed - 45, y, xMed + 45, y)
  y += 4
  doc.setFontSize(8); doc.setTextColor(80)
  doc.text('Assinatura do responsável pelo preenchimento', xMed, y, { align: 'center' })

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
