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

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase()

// Busca a descrição de atividade de uma função dentro do mapa `atividades_por_funcao`
// do GHE (sincronizado a partir do PGR), normalizando espaço/maiúscula — o nome da
// função digitado no PCMSO pode diferir trivialmente do usado no PGR.
export function acharAtividadePorFuncao(mapa: Record<string, string> | undefined | null, nomeFuncao: string | undefined | null): string | undefined {
  if (!mapa || !nomeFuncao) return undefined
  const alvo = norm(nomeFuncao)
  for (const [chave, valor] of Object.entries(mapa)) {
    if (norm(chave) === alvo) return valor
  }
  return undefined
}

// Acha o programa PCMSO de um funcionário — cadastro manual grava `funcao` como o
// próprio cargo; import de PDF grava `funcao` como nome do GHE e o cargo real fica
// em `funcoes[]`. Checa os dois formatos, normalizando espaço/maiúscula pra não
// perder o match por diferença trivial de digitação.
export function programaDoFuncionario(programas: any[], func: { funcao?: string | null; setor?: string | null }) {
  if (!func?.funcao) return null
  const funcaoNorm = norm(func.funcao)
  const bate = (p: any) => norm(p.funcao) === funcaoNorm || (p.funcoes || []).some((f: string) => norm(f) === funcaoNorm)
  const candidatos = programas.filter(bate)
  if (candidatos.length === 0) return null

  const comSetor = candidatos.find(p => p.setor && norm(p.setor) === norm(func.setor))
  if (comSetor) return comSetor

  const semSetor = candidatos.filter(p => !p.setor)
  if (semSetor.length) return semSetor[0]

  // Todos os candidatos têm setor definido, mas nenhum bate com o do funcionário —
  // com só 1 candidato mantém o comportamento antigo (assume que é o mesmo programa);
  // com 2+ candidatos de setores diferentes seria um chute, então não escolhe nenhum.
  return candidatos.length === 1 ? candidatos[0] : null
}

// Exames esperados pro funcionário num tipo de ASO específico, a partir do programa PCMSO.
export function examesEsperados(programas: any[], func: any, tipoAso: string): { nome: string; codigo_t27?: string }[] {
  const prog = programaDoFuncionario(programas, func)
  if (!prog) return []
  const chave = TIPO_ASO_PARA_CONSULTA[tipoAso]
  if (!chave) return []
  return normalizeExames(prog)[chave] || []
}
