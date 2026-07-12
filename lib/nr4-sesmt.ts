// Dimensionamento do SESMT — NR-4, Quadro II (estimativa de referência).
// Esta tabela é uma reconstrução best-effort da tabela oficial, pensada como
// ponto de partida para conversa com um profissional habilitado — não é
// documento legal e não substitui o dimensionamento feito pelo engenheiro/
// técnico de segurança responsável. Sempre exibir o disclaimer na tela.

export type FaixaSesmt = {
  min: number
  max: number | null
  tecnico: number
  engenheiro: number
  auxEnfermagem: number
  enfermeiro: number
  medico: number
  incrementoAcima?: { cada: number; tecnico?: number; engenheiro?: number; auxEnfermagem?: number; enfermeiro?: number; medico?: number }
}

export const QUADRO_II: Record<'1-2' | '3' | '4', FaixaSesmt[]> = {
  '1-2': [
    { min: 101, max: 250,  tecnico: 1, engenheiro: 0, auxEnfermagem: 0, enfermeiro: 0, medico: 0 },
    { min: 251, max: 500,  tecnico: 1, engenheiro: 0, auxEnfermagem: 1, enfermeiro: 0, medico: 0 },
    { min: 501, max: 1000, tecnico: 1, engenheiro: 0, auxEnfermagem: 1, enfermeiro: 0, medico: 0 },
    { min: 1001, max: 2000, tecnico: 2, engenheiro: 1, auxEnfermagem: 1, enfermeiro: 1, medico: 1 },
    { min: 2001, max: 3500, tecnico: 3, engenheiro: 1, auxEnfermagem: 2, enfermeiro: 1, medico: 1 },
    { min: 3501, max: 5000, tecnico: 4, engenheiro: 1, auxEnfermagem: 3, enfermeiro: 1, medico: 1 },
    { min: 5001, max: null, tecnico: 4, engenheiro: 1, auxEnfermagem: 3, enfermeiro: 1, medico: 1,
      incrementoAcima: { cada: 3000, tecnico: 1, engenheiro: 0, auxEnfermagem: 1, enfermeiro: 0, medico: 0 } },
  ],
  '3': [
    { min: 50, max: 100,   tecnico: 1, engenheiro: 0, auxEnfermagem: 1, enfermeiro: 0, medico: 1 },
    { min: 101, max: 250,  tecnico: 1, engenheiro: 0, auxEnfermagem: 1, enfermeiro: 0, medico: 1 },
    { min: 251, max: 500,  tecnico: 2, engenheiro: 1, auxEnfermagem: 1, enfermeiro: 0, medico: 1 },
    { min: 501, max: 1000, tecnico: 3, engenheiro: 1, auxEnfermagem: 2, enfermeiro: 1, medico: 1 },
    { min: 1001, max: 2000, tecnico: 4, engenheiro: 2, auxEnfermagem: 3, enfermeiro: 1, medico: 2 },
    { min: 2001, max: 3500, tecnico: 5, engenheiro: 2, auxEnfermagem: 4, enfermeiro: 2, medico: 2 },
    { min: 3501, max: 5000, tecnico: 6, engenheiro: 3, auxEnfermagem: 5, enfermeiro: 2, medico: 3 },
    { min: 5001, max: null, tecnico: 6, engenheiro: 3, auxEnfermagem: 5, enfermeiro: 2, medico: 3,
      incrementoAcima: { cada: 1500, tecnico: 1, engenheiro: 1, auxEnfermagem: 1, enfermeiro: 0, medico: 1 } },
  ],
  '4': [
    { min: 50, max: 100,   tecnico: 1, engenheiro: 0, auxEnfermagem: 1, enfermeiro: 0, medico: 1 },
    { min: 101, max: 250,  tecnico: 2, engenheiro: 1, auxEnfermagem: 2, enfermeiro: 0, medico: 1 },
    { min: 251, max: 500,  tecnico: 3, engenheiro: 1, auxEnfermagem: 3, enfermeiro: 1, medico: 1 },
    { min: 501, max: 1000, tecnico: 4, engenheiro: 2, auxEnfermagem: 4, enfermeiro: 1, medico: 2 },
    { min: 1001, max: 2000, tecnico: 5, engenheiro: 3, auxEnfermagem: 5, enfermeiro: 2, medico: 3 },
    { min: 2001, max: 3500, tecnico: 6, engenheiro: 4, auxEnfermagem: 6, enfermeiro: 2, medico: 3 },
    { min: 3501, max: 5000, tecnico: 8, engenheiro: 5, auxEnfermagem: 8, enfermeiro: 3, medico: 4 },
    { min: 5001, max: null, tecnico: 8, engenheiro: 5, auxEnfermagem: 8, enfermeiro: 3, medico: 4,
      incrementoAcima: { cada: 1000, tecnico: 1, engenheiro: 1, auxEnfermagem: 1, enfermeiro: 1, medico: 1 } },
  ],
}

export type ResultadoSesmt = {
  faixaEncontrada: boolean
  tecnico: number
  engenheiro: number
  auxEnfermagem: number
  enfermeiro: number
  medico: number
}

export function calcularSesmt(grau: '1' | '2' | '3' | '4', nEmpregados: number): ResultadoSesmt {
  const tabela = QUADRO_II[grau === '1' || grau === '2' ? '1-2' : grau]
  const faixa = tabela.find(f => nEmpregados >= f.min && (f.max === null || nEmpregados <= f.max))
  if (!faixa) return { faixaEncontrada: false, tecnico: 0, engenheiro: 0, auxEnfermagem: 0, enfermeiro: 0, medico: 0 }

  let { tecnico, engenheiro, auxEnfermagem, enfermeiro, medico } = faixa
  if (faixa.max === null && faixa.incrementoAcima) {
    const excedente = nEmpregados - faixa.min
    const multiplos = Math.floor(excedente / faixa.incrementoAcima.cada)
    tecnico       += multiplos * (faixa.incrementoAcima.tecnico || 0)
    engenheiro    += multiplos * (faixa.incrementoAcima.engenheiro || 0)
    auxEnfermagem += multiplos * (faixa.incrementoAcima.auxEnfermagem || 0)
    enfermeiro    += multiplos * (faixa.incrementoAcima.enfermeiro || 0)
    medico        += multiplos * (faixa.incrementoAcima.medico || 0)
  }
  return { faixaEncontrada: true, tecnico, engenheiro, auxEnfermagem, enfermeiro, medico }
}
