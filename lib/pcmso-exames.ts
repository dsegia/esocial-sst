// Lógica de exames do PCMSO compartilhada entre pages/pcmso.jsx (dono dos dados)
// e pages/aso.tsx (consome, pra parametrizar exames esperados por tipo de ASO).

export const TIPOS_CONSULTA = [
  { key: 'admissional',      label: 'Admissional', cor: '#1D9E75', bg: '#EAF3DE' },
  { key: 'periodico',        label: 'Periódico',   cor: '#185FA5', bg: '#E6F1FB' },
  { key: 'retorno_trabalho', label: 'Retorno',     cor: '#7C3AED', bg: '#EDE9FE' },
  { key: 'mudanca_risco',    label: 'Mudança',     cor: '#D97706', bg: '#FEF3C7' },
  { key: 'demissional',      label: 'Demissional', cor: '#DC2626', bg: '#FEE2E2' },
] as const

// tipo_aso (usado em asos/s2220/s2240) -> chave de TIPOS_CONSULTA (usada no PCMSO)
export const TIPO_ASO_PARA_CONSULTA: Record<string, string> = {
  admissional: 'admissional', periodico: 'periodico', retorno: 'retorno_trabalho',
  mudanca: 'mudanca_risco', demissional: 'demissional',
}

// Backward compat: converte estrutura antiga de pcmso_programa.exames (array com
// tipos[]/periodicidade, cadastro manual) para a nova (objeto por tipo, formato
// gravado pelo import de PDF) — mesma função usada em pages/pcmso.jsx.
export function normalizeExames(prog: any): Record<string, any[]> {
  if (prog.exames && !Array.isArray(prog.exames)) return prog.exames
  const result: Record<string, any[]> = {}
  for (const t of TIPOS_CONSULTA) result[t.key] = []
  for (const ex of (prog.exames || [])) {
    const tipos = ex.tipos?.length ? ex.tipos
      : ex.periodicidade
        ? [ex.periodicidade.toLowerCase().includes('admissional') ? 'admissional'
          : ex.periodicidade.toLowerCase().includes('demissional') ? 'demissional' : 'periodico']
        : ['periodico']
    for (const t of tipos) { if (result[t]) result[t].push({ nome: ex.nome, codigo_t27: ex.codigo_t27 }) }
  }
  return result
}

// Acha o programa PCMSO de um funcionário — cadastro manual grava `funcao` como o
// próprio cargo; import de PDF grava `funcao` como nome do GHE e o cargo real fica
// em `funcoes[]`. Checa os dois formatos.
export function programaDoFuncionario(programas: any[], func: { funcao?: string | null; setor?: string | null }) {
  if (!func?.funcao) return null
  const bate = (p: any) => p.funcao === func.funcao || (p.funcoes || []).includes(func.funcao)
  return programas.find(p => bate(p) && (!p.setor || p.setor === func.setor))
    || programas.find(p => bate(p))
    || null
}

// Exames esperados pro funcionário num tipo de ASO específico, a partir do programa PCMSO.
export function examesEsperados(programas: any[], func: any, tipoAso: string): { nome: string; codigo_t27?: string }[] {
  const prog = programaDoFuncionario(programas, func)
  if (!prog) return []
  const chave = TIPO_ASO_PARA_CONSULTA[tipoAso]
  if (!chave) return []
  return normalizeExames(prog)[chave] || []
}
