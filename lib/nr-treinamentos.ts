// Lista de referência de treinamentos por Norma Regulamentadora — usada só para
// sugerir nome/carga horária/validade ao cadastrar. O usuário sempre pode
// digitar livremente ou ajustar os valores sugeridos.

export type NrTreinamento = {
  norma: string
  nome: string
  carga_horaria: number
  validade_meses: number | null // null = sem prazo de reciclagem padrão
}

export const NR_TREINAMENTOS: NrTreinamento[] = [
  { norma: 'NR-1',  nome: 'Integração / Ordem de Serviço',        carga_horaria: 2,  validade_meses: null },
  { norma: 'NR-5',  nome: 'Capacitação de membro da CIPA',        carga_horaria: 20, validade_meses: 12 },
  { norma: 'NR-6',  nome: 'Uso correto de EPI',                   carga_horaria: 2,  validade_meses: null },
  { norma: 'NR-10', nome: 'Segurança em Instalações Elétricas',   carga_horaria: 40, validade_meses: 24 },
  { norma: 'NR-11', nome: 'Operação de empilhadeira',             carga_horaria: 16, validade_meses: 36 },
  { norma: 'NR-12', nome: 'Segurança em Máquinas e Equipamentos', carga_horaria: 8,  validade_meses: 24 },
  { norma: 'NR-17', nome: 'Ergonomia — orientação postural',      carga_horaria: 4,  validade_meses: null },
  { norma: 'NR-18', nome: 'Condições na Indústria da Construção', carga_horaria: 6,  validade_meses: 12 },
  { norma: 'NR-20', nome: 'Inflamáveis e Combustíveis — Básico',  carga_horaria: 8,  validade_meses: 36 },
  { norma: 'NR-23', nome: 'Prevenção e Combate a Incêndio (Brigada)', carga_horaria: 16, validade_meses: 12 },
  { norma: 'NR-33', nome: 'Espaço Confinado — Trabalhador Autorizado', carga_horaria: 16, validade_meses: 12 },
  { norma: 'NR-33', nome: 'Espaço Confinado — Supervisor de Entrada',  carga_horaria: 40, validade_meses: 12 },
  { norma: 'NR-35', nome: 'Trabalho em Altura',                   carga_horaria: 8,  validade_meses: 24 },
]

export const NORMAS_DISPONIVEIS = Array.from(new Set(NR_TREINAMENTOS.map(t => t.norma)))
  .sort((a, b) => (parseInt(a.replace('NR-', '')) || 0) - (parseInt(b.replace('NR-', '')) || 0))

export function sugestoesPorNorma(norma: string): NrTreinamento[] {
  return NR_TREINAMENTOS.filter(t => t.norma === norma)
}

export function calcularVencimento(dataRealizacao: string, validadeMeses: number | null): string | null {
  if (!dataRealizacao || !validadeMeses) return null
  const d = new Date(dataRealizacao + 'T12:00:00')
  d.setMonth(d.getMonth() + validadeMeses)
  return d.toISOString().split('T')[0]
}
