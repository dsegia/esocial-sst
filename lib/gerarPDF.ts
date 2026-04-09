// Geração de PDF via HTML + window.print()
// Abre janela com layout otimizado para impressão/PDF

const BASE_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; }
  h1 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
  h2 { font-size: 13px; font-weight: bold; margin: 14px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { font-size: 11px; font-weight: bold; margin: 10px 0 4px; }
  .header { border-bottom: 2px solid #185FA5; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-left h1 { color: #185FA5; }
  .header-left p { font-size: 10px; color: #555; margin-top: 2px; }
  .header-right { text-align: right; font-size: 10px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
  th { background: #185FA5; color: #fff; padding: 5px 7px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .04em; }
  td { padding: 5px 7px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #f9fafb; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 99px; font-size: 9px; font-weight: bold; }
  .badge-ok { background: #EAF3DE; color: #27500A; }
  .badge-warn { background: #FAEEDA; color: #633806; }
  .badge-err { background: #FCEBEB; color: #791F1F; }
  .badge-gray { background: #f3f4f6; color: #6b7280; }
  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
  .info-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; }
  .info-box .val { font-size: 18px; font-weight: bold; color: #185FA5; }
  .info-box .lbl { font-size: 9px; color: #6b7280; margin-top: 2px; }
  .assinatura { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 6px; text-align: center; font-size: 10px; color: #555; width: 220px; }
  .assinaturas { display: flex; gap: 40px; margin-top: 30px; }
  .footer { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 6px; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; }
  .page-break { page-break-before: always; }
  @media print {
    @page { margin: 15mm 12mm; size: A4; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
`

function abrirJanela(titulo: string, html: string) {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) { alert('Permita pop-ups para gerar o PDF.'); return }
  const agora = new Date().toLocaleString('pt-BR')
  w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${titulo}</title>
  <style>${BASE_STYLE}</style>
</head>
<body>
  <div class="no-print" style="position:fixed;top:10px;right:10px;z-index:9999;display:flex;gap:8px">
    <button onclick="window.print()" style="padding:8px 16px;background:#185FA5;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:Arial">
      🖨 Imprimir / Salvar PDF
    </button>
    <button onclick="window.close()" style="padding:8px 16px;background:#f3f4f6;color:#374151;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:Arial">
      Fechar
    </button>
  </div>
  ${html}
  <div class="footer">
    <span>eSocial SST Transmissor</span>
    <span>Gerado em ${agora}</span>
  </div>
</body>
</html>`)
  w.document.close()
}

// ─── 1. RELATÓRIO DE CONFORMIDADE ASO ────────────────────────────────────────
export function pdfConformidadeASO(empresa: string, cnpj: string, funcionarios: any[]) {
  const hoje = new Date()

  const rows = funcionarios.map(f => {
    const aso = f.ultimoAso
    let status = 'Sem ASO'
    let badge = 'badge-err'
    let diasTxt = '—'

    if (aso?.prox_exame) {
      const dias = Math.ceil((new Date(aso.prox_exame).getTime() - hoje.getTime()) / 86400000)
      if (dias < 0) { status = 'Vencido'; badge = 'badge-err'; diasTxt = `${Math.abs(dias)}d atrás` }
      else if (dias <= 30) { status = 'Crítico'; badge = 'badge-warn'; diasTxt = `${dias}d` }
      else { status = 'Regular'; badge = 'badge-ok'; diasTxt = `${dias}d` }
    } else if (!aso) {
      status = 'Sem ASO'; badge = 'badge-err'
    }

    const dataExame = aso?.data_exame ? new Date(aso.data_exame + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
    const proxExame = aso?.prox_exame ? new Date(aso.prox_exame + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

    return `<tr>
      <td>${f.nome}</td>
      <td style="font-family:monospace">${f.cpf || '—'}</td>
      <td>${f.funcao || '—'}</td>
      <td>${f.setor || '—'}</td>
      <td>${dataExame}</td>
      <td>${proxExame}</td>
      <td>${diasTxt}</td>
      <td><span class="badge ${badge}">${status}</span></td>
    </tr>`
  }).join('')

  const total = funcionarios.length
  const ok    = funcionarios.filter(f => { const d = f.ultimoAso?.prox_exame ? Math.ceil((new Date(f.ultimoAso.prox_exame).getTime() - hoje.getTime()) / 86400000) : -1; return d > 30 }).length
  const conf  = total > 0 ? Math.round((ok / total) * 100) : 0

  const html = `
  <div class="header">
    <div class="header-left">
      <h1>Relatório de Conformidade — ASO</h1>
      <p>${empresa} · CNPJ ${cnpj}</p>
      <p>Referência: ${hoje.toLocaleDateString('pt-BR', { month:'long', year:'numeric' })}</p>
    </div>
    <div class="header-right">
      <div style="font-size:22px;font-weight:bold;color:${conf >= 80 ? '#27500A' : conf >= 50 ? '#633806' : '#791F1F'}">${conf}%</div>
      <div>Conformidade</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box"><div class="val">${total}</div><div class="lbl">Funcionários</div></div>
    <div class="info-box"><div class="val" style="color:#27500A">${ok}</div><div class="lbl">Em dia</div></div>
    <div class="info-box"><div class="val" style="color:#791F1F">${total - ok}</div><div class="lbl">Pendentes / Vencidos</div></div>
  </div>

  <table>
    <thead><tr>
      <th>Funcionário</th><th>CPF</th><th>Função</th><th>Setor</th>
      <th>Último ASO</th><th>Próximo ASO</th><th>Faltam</th><th>Status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="assinaturas">
    <div class="assinatura">Médico Coordenador do PCMSO</div>
    <div class="assinatura">Responsável SST</div>
  </div>`

  abrirJanela('Conformidade ASO', html)
}

// ─── 2. FICHA DE EPI ─────────────────────────────────────────────────────────
export function pdfFichaEPI(empresa: string, cnpj: string, funcionario: any, ghes: any[]) {
  const hoje = new Date().toLocaleDateString('pt-BR')

  // Coleta todos os EPIs de todos os GHEs vinculados ao funcionário
  const todosEpis: any[] = []
  ghes.forEach(ghe => {
    (ghe.epi || []).forEach((epi: any) => {
      if (!todosEpis.find(e => e.nome === epi.nome)) {
        todosEpis.push({ ...epi, ghe: ghe.nome })
      }
    })
  })

  const rowsEpi = todosEpis.length > 0
    ? todosEpis.map(epi => `<tr>
        <td>${epi.nome}</td>
        <td style="text-align:center;font-family:monospace">${epi.ca || '—'}</td>
        <td>${epi.ghe}</td>
        <td><span class="badge ${epi.eficaz ? 'badge-ok' : 'badge-err'}">${epi.eficaz ? 'Eficaz' : 'Não eficaz'}</span></td>
      </tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:#9ca3af">Nenhum EPI cadastrado para este funcionário.</td></tr>'

  // Linhas de recebimento (10 linhas vazias para assinar)
  const rowsReceb = Array.from({length: 10}, (_, i) => `<tr>
    <td style="text-align:center">${i+1}</td>
    <td></td><td></td><td></td><td></td><td></td>
  </tr>`).join('')

  const html = `
  <div class="header">
    <div class="header-left">
      <h1>Ficha de EPI — NR-6</h1>
      <p>${empresa} · CNPJ ${cnpj}</p>
    </div>
    <div class="header-right">Data de emissão: ${hoje}</div>
  </div>

  <h2>Dados do trabalhador</h2>
  <table>
    <tr>
      <th>Nome completo</th><th>CPF</th><th>Matrícula</th><th>Função</th><th>Setor</th><th>Admissão</th>
    </tr>
    <tr>
      <td>${funcionario.nome}</td>
      <td style="font-family:monospace">${funcionario.cpf || '—'}</td>
      <td>${funcionario.matricula_esocial || '—'}</td>
      <td>${funcionario.funcao || '—'}</td>
      <td>${funcionario.setor || '—'}</td>
      <td>${funcionario.data_adm ? new Date(funcionario.data_adm+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
    </tr>
  </table>

  <h2>EPIs necessários</h2>
  <table>
    <thead><tr><th>Equipamento de Proteção Individual</th><th>Nº CA</th><th>GHE / Risco</th><th>Eficácia</th></tr></thead>
    <tbody>${rowsEpi}</tbody>
  </table>

  <h2>Registro de entrega e devolução</h2>
  <p style="font-size:10px;color:#555;margin-bottom:6px">
    Declaro ter recebido os EPIs listados, estando ciente da obrigatoriedade de uso, conservação e devolução (NR-6 item 6.6.1).
  </p>
  <table>
    <thead><tr>
      <th style="width:30px">#</th><th>EPI entregue</th><th>Qtd</th><th>Data entrega</th><th>Assinatura</th><th>Data devolução</th>
    </tr></thead>
    <tbody>${rowsReceb}</tbody>
  </table>`

  abrirJanela(`Ficha EPI — ${funcionario.nome}`, html)
}

// ─── 3. RELATÓRIO PCMSO ──────────────────────────────────────────────────────
export function pdfPCMSO(empresa: string, cnpj: string, medico: string, crmMedico: string, programas: any[]) {
  const hoje = new Date().toLocaleDateString('pt-BR')

  const secoes = programas.map(prog => {
    const exames = (prog.exames || []).map((ex: any) => `<tr>
      <td>${ex.nome}</td>
      <td>${ex.periodicidade || 'Anual'}</td>
      <td><span class="badge ${ex.obrigatorio ? 'badge-ok' : 'badge-gray'}">${ex.obrigatorio ? 'Obrigatório' : 'Complementar'}</span></td>
      <td>${ex.codigo_t27 ? `T27:${ex.codigo_t27}` : '—'}</td>
    </tr>`).join('')

    const riscos = (prog.riscos || []).map((r: any) =>
      `<span class="badge badge-warn" style="margin-right:4px">${r}</span>`
    ).join('')

    return `
    <h2>${prog.funcao} ${prog.setor ? `· ${prog.setor}` : ''}</h2>
    ${riscos ? `<p style="margin-bottom:6px;font-size:10px">Riscos: ${riscos}</p>` : ''}
    <table>
      <thead><tr><th>Exame / Procedimento</th><th>Periodicidade</th><th>Tipo</th><th>Código T27</th></tr></thead>
      <tbody>${exames || '<tr><td colspan="4" style="color:#9ca3af">Nenhum exame cadastrado.</td></tr>'}</tbody>
    </table>`
  }).join('')

  const html = `
  <div class="header">
    <div class="header-left">
      <h1>Programa de Controle Médico de Saúde Ocupacional</h1>
      <p><strong>PCMSO — NR-7</strong> · ${empresa} · CNPJ ${cnpj}</p>
    </div>
    <div class="header-right">Emissão: ${hoje}</div>
  </div>

  <div class="info-grid">
    <div class="info-box"><div class="val">${programas.length}</div><div class="lbl">Funções / programas</div></div>
    <div class="info-box"><div class="val">${programas.reduce((s,p)=>(s+(p.exames||[]).length),0)}</div><div class="lbl">Exames mapeados</div></div>
    <div class="info-box">
      <div style="font-size:11px;font-weight:bold">${medico || '—'}</div>
      <div class="lbl">Médico coordenador · CRM ${crmMedico || '—'}</div>
    </div>
  </div>

  ${secoes}

  <div class="assinaturas">
    <div class="assinatura">${medico || 'Médico Coordenador'}<br><span style="font-size:9px">CRM ${crmMedico || '—'}</span></div>
    <div class="assinatura">Responsável Legal da Empresa</div>
  </div>`

  abrirJanela('PCMSO', html)
}
