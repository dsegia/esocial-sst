// Base de conhecimento estática: ao informar um risco no inventário do PGR,
// sugere o código eSocial (Tabela 24) e uma medida administrativa padrão —
// sempre editável, nunca sobrescreve o que o usuário já preencheu.
// Mesma ideia de normalização (minúsculas + remoção de acento) já usada
// em pages/api/ler-documento.js (TABELA24/TABELA27), sem importar de lá.

const MAPA_ACENTOS: Record<string, string> = {
  'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c', 'ñ': 'n',
}

function normalizar(s: string): string {
  return (s || '').toLowerCase().split('').map(c => MAPA_ACENTOS[c] || c).join('')
}

interface Sugestao {
  chaves: string[]
  codigo_esocial: string
  medida_administrativa: string
}

const BASE_CONHECIMENTO: Sugestao[] = [
  {
    chaves: ['ruido', 'ruido continuo', 'ruido intermitente'],
    codigo_esocial: '01.01.001',
    medida_administrativa: 'Reduzir o tempo de exposição; rotatividade dos trabalhadores; fornecimento e uso obrigatório de protetor auditivo; treinamentos específicos.',
  },
  {
    chaves: ['ruido de impacto', 'impacto'],
    codigo_esocial: '01.01.002',
    medida_administrativa: 'Reduzir o tempo de exposição; uso de protetor auditivo tipo concha; manutenção preventiva de equipamentos.',
  },
  {
    chaves: ['altura', 'trabalho em altura', 'queda de altura'],
    codigo_esocial: '09.01.001',
    medida_administrativa: 'Uso de cinto de segurança com talabarte e trava-quedas; treinamentos na função (NR-35); inspeção periódica dos equipamentos de proteção contra quedas.',
  },
  {
    chaves: ['choque eletrico', 'eletricidade', 'corrente eletrica'],
    codigo_esocial: '09.01.001',
    medida_administrativa: 'Bloqueio e etiquetagem de energia (LOTO); uso de EPI isolante; treinamento NR-10; inspeção periódica das instalações elétricas.',
  },
  {
    chaves: ['calor', 'ibutg', 'estresse termico', 'temperatura elevada'],
    codigo_esocial: '01.02.001',
    medida_administrativa: 'Fornecimento de água potável; pausas para descanso em local climatizado; adequação da jornada de exposição; controle médico.',
  },
  {
    chaves: ['frio', 'temperatura fria', 'camara fria'],
    codigo_esocial: '01.05.001',
    medida_administrativa: 'Fornecimento de vestimenta adequada; pausas periódicas para aquecimento; controle médico.',
  },
  {
    chaves: ['vibracao', 'vibracao de corpo inteiro', 'vibracao maos e bracos'],
    codigo_esocial: '01.04.001',
    medida_administrativa: 'Manutenção preventiva de máquinas e veículos; rotatividade dos trabalhadores; pausas periódicas; controle médico.',
  },
  {
    chaves: ['levantamento de peso', 'transporte manual de carga', 'esforco fisico'],
    codigo_esocial: '09.01.001',
    medida_administrativa: 'Treinamento em levantamento e transporte manual de cargas; uso de equipamentos auxiliares de transporte; rotatividade dos trabalhadores.',
  },
  {
    chaves: ['postura', 'postura inadequada', 'postura de pe'],
    codigo_esocial: '09.01.001',
    medida_administrativa: 'Rotatividade dos trabalhadores; pausas para descanso; ginástica laboral; adequação do mobiliário/posto de trabalho.',
  },
  {
    chaves: ['queda de nivel', 'piso desnivelado', 'queda'],
    codigo_esocial: '09.01.001',
    medida_administrativa: 'Sinalização e manutenção de pisos regulares; uso de calçado antiderrapante; organização e limpeza do ambiente (5S).',
  },
  {
    chaves: ['poeira', 'silica', 'poeira respiravel'],
    codigo_esocial: '02.11.001',
    medida_administrativa: 'Umidificação do ambiente; ventilação/exaustão local; uso de respirador adequado; monitoramento periódico da exposição; controle médico.',
  },
  {
    chaves: ['gasolina', 'solvente', 'hidrocarboneto', 'diesel'],
    codigo_esocial: '02.08.001',
    medida_administrativa: 'Uso de EPI adequado (luva, óculos, respirador); ventilação do ambiente; treinamento sobre manuseio seguro de produtos químicos.',
  },
  {
    chaves: ['agente quimico', 'produto quimico', 'gases e vapores'],
    codigo_esocial: '02.18.001',
    medida_administrativa: 'Uso de EPI adequado; ventilação local exaustora; Ficha de Dados de Segurança (FDS) disponível; treinamento sobre manuseio seguro.',
  },
  {
    chaves: ['biologico', 'agente biologico', 'virus', 'bacteria', 'contaminacao biologica'],
    codigo_esocial: '03.01.001',
    medida_administrativa: 'Vacinação quando aplicável; uso de EPI adequado; higienização das mãos; procedimentos de descarte seguro.',
  },
  {
    chaves: ['corte', 'objeto cortante', 'perfurocortante'],
    codigo_esocial: '09.01.001',
    medida_administrativa: 'Uso de luva de proteção contra agentes mecânicos; treinamento no manuseio de ferramentas; organização do posto de trabalho.',
  },
  {
    chaves: ['incendio', 'explosao', 'inflamavel'],
    codigo_esocial: '09.01.001',
    medida_administrativa: 'Sinalização e extintores adequados; treinamento de brigada de incêndio; armazenamento correto de inflamáveis; plano de emergência.',
  },
  {
    chaves: ['psicossocial', 'assedio', 'sobrecarga', 'burnout', 'estresse ocupacional'],
    codigo_esocial: '09.01.001',
    medida_administrativa: 'Canal de denúncia de assédio; redistribuição de carga de trabalho; apoio psicológico; treinamento de lideranças; pesquisa periódica de clima organizacional.',
  },
  {
    chaves: ['radiacao ionizante', 'raio x'],
    codigo_esocial: '01.03.001',
    medida_administrativa: 'Uso de EPI/blindagem adequada; dosimetria individual; controle médico periódico; treinamento em proteção radiológica.',
  },
  {
    chaves: ['radiacao nao ionizante', 'radiacao solar', 'carga solar', 'raios uv'],
    codigo_esocial: '01.02.001',
    medida_administrativa: 'Uso de protetor solar e vestimenta adequada; rodízio de horários de exposição; hidratação frequente.',
  },
]

export function sugerirParaRisco(nome: string): { codigo_esocial: string; medida_administrativa: string } | null {
  const alvo = normalizar(nome)
  if (!alvo) return null
  for (const item of BASE_CONHECIMENTO) {
    if (item.chaves.some(chave => alvo.includes(chave) || chave.includes(alvo))) {
      return { codigo_esocial: item.codigo_esocial, medida_administrativa: item.medida_administrativa }
    }
  }
  return null
}
