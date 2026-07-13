// Anexo IV do Decreto nº 3.048/99 (Regulamento da Previdência Social) — relação de
// agentes nocivos químicos, físicos e biológicos considerados para fins de
// concessão de aposentadoria especial, com o respectivo tempo mínimo de exposição.
//
// Fonte: texto do Anexo IV conforme reproduzido em LTCAT de mercado consultado
// para esta base (Sistema ESO). Os códigos e a relação de atividades exemplificativas
// batem com o texto do decreto, mas a codificação de "Iodo" apareceu duplicada como
// 1.0.12 na fonte consultada (mesmo código do Fósforo) — provável erro de
// transcrição da fonte. Antes de usar este código em um laudo com valor jurídico,
// confirme a numeração exata direto no Anexo IV do Decreto 3.048/99 no Planalto.
//
// Este arquivo é só uma base de SUGESTÃO (mesmo espírito do pgr-sugestoes.ts) —
// nunca sobrescreve o que o usuário já preencheu, e a classificação final de
// aposentadoria especial é sempre uma decisão do responsável técnico.

export type CategoriaAgente = 'quimico' | 'fisico' | 'biologico' | 'associacao'

export interface AgenteAnexoIV {
  codigo: string
  nome: string
  categoria: CategoriaAgente
  tempoExposicaoAnos: 15 | 20 | 25
  chaves: string[]
  atividadesExemplo?: string[]
}

export const ANEXO_IV_AGENTES: AgenteAnexoIV[] = [
  {
    codigo: '1.0.1', nome: 'Arsênio e seus compostos', categoria: 'quimico', tempoExposicaoAnos: 20,
    chaves: ['arsenio', 'arsenico'],
    atividadesExemplo: ['Extração de arsênio e seus compostos tóxicos', 'Metalurgia de minérios arsenicais', 'Fabricação de inseticidas e raticidas com compostos de arsênio'],
  },
  {
    codigo: '1.0.2', nome: 'Asbestos (amianto)', categoria: 'quimico', tempoExposicaoAnos: 20,
    chaves: ['asbesto', 'asbestos', 'amianto'],
    atividadesExemplo: ['Extração, processamento e manipulação de rochas amiantíferas', 'Fabricação de guarnições de freio, embreagens e materiais isolantes contendo asbestos'],
  },
  {
    codigo: '1.0.3', nome: 'Benzeno e seus compostos tóxicos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['benzeno'],
    atividadesExemplo: ['Produção e processamento de benzeno', 'Utilização de benzeno como matéria-prima em sínteses orgânicas', 'Fabricação e recauchutagem de pneumáticos'],
  },
  {
    codigo: '1.0.4', nome: 'Berílio e seus compostos tóxicos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['berilio'],
    atividadesExemplo: ['Extração, trituração e tratamento de berílio', 'Fabricação de tubos fluorescentes e ampolas de raio X'],
  },
  {
    codigo: '1.0.5', nome: 'Bromo e seus compostos tóxicos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['bromo'],
    atividadesExemplo: ['Fabricação e emprego do bromo e do ácido brômico'],
  },
  {
    codigo: '1.0.6', nome: 'Cádmio e seus compostos tóxicos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['cadmio'],
    atividadesExemplo: ['Extração, tratamento e preparação de ligas de cádmio', 'Fabricação de eletrodos de baterias alcalinas de níquel-cádmio'],
  },
  {
    codigo: '1.0.7', nome: 'Carvão mineral e seus derivados', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['carvao mineral', 'piche', 'alcatrao', 'betume', 'breu'],
    atividadesExemplo: ['Extração, fabricação, beneficiamento e utilização de carvão mineral, piche, alcatrão, betume e breu', 'Produção de coque'],
  },
  {
    codigo: '1.0.8', nome: 'Chumbo e seus compostos tóxicos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['chumbo'],
    atividadesExemplo: ['Extração e processamento de minério de chumbo', 'Fabricação de acumuladores elétricos', 'Pintura com pistola empregando tintas com pigmentos de chumbo'],
  },
  {
    codigo: '1.0.9', nome: 'Cloro e seus compostos tóxicos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['cloro'],
    atividadesExemplo: ['Fabricação e emprego de defensivos organoclorados', 'Fabricação e emprego de cloreto de vinil (PVC)'],
  },
  {
    codigo: '1.0.10', nome: 'Cromo e seus compostos tóxicos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['cromo'],
    atividadesExemplo: ['Fabricação, emprego industrial e manipulação de cromo, ácido crômico, cromatos e bicromatos', 'Soldagem de aço inoxidável'],
  },
  {
    codigo: '1.0.11', nome: 'Dissulfeto de carbono', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['dissulfeto de carbono'],
    atividadesExemplo: ['Fabricação e utilização de dissulfeto de carbono', 'Fabricação de viscose e seda artificial (raiom)'],
  },
  {
    codigo: '1.0.12', nome: 'Fósforo e seus compostos tóxicos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['fosforo'],
    atividadesExemplo: ['Extração e preparação de fósforo branco e seus compostos', 'Fabricação de munições e armamentos explosivos'],
  },
  {
    // [VERIFICAR: código exato do Iodo no Anexo IV — a fonte consultada repetiu "1.0.12" (mesmo código do Fósforo)
    codigo: '1.0.12*', nome: 'Iodo', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['iodo'],
    atividadesExemplo: ['Fabricação e emprego industrial do iodo'],
  },
  {
    codigo: '1.0.13', nome: 'Manganês e seus compostos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['manganes'],
    atividadesExemplo: ['Extração e beneficiamento de minérios de manganês', 'Fabricação de pilhas secas e acumuladores'],
  },
  {
    codigo: '1.0.14', nome: 'Mercúrio e seus compostos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['mercurio'],
    atividadesExemplo: ['Extração e utilização de mercúrio', 'Fabricação de lâmpadas, válvulas eletrônicas e ampolas de raio X'],
  },
  {
    codigo: '1.0.15', nome: 'Níquel e seus compostos tóxicos', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['niquel'],
    atividadesExemplo: ['Extração e beneficiamento do níquel', 'Niquelagem de metais'],
  },
  {
    codigo: '1.0.16', nome: 'Petróleo, xisto betuminoso, gás natural e seus derivados', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['petroleo', 'xisto betuminoso', 'gas natural'],
    atividadesExemplo: ['Extração, processamento, beneficiamento e manutenção em unidades de extração, plantas petrolíferas e petroquímicas'],
  },
  {
    codigo: '1.0.17', nome: 'Sílica livre', categoria: 'quimico', tempoExposicaoAnos: 25,
    chaves: ['silica', 'silica livre', 'poeira de silica'],
    atividadesExemplo: ['Extração de minérios a céu aberto', 'Beneficiamento e tratamento de produtos minerais geradores de poeiras contendo sílica livre cristalizada', 'Construção de túneis'],
  },
  {
    codigo: '2.0.1', nome: 'Ruído', categoria: 'fisico', tempoExposicaoAnos: 25,
    chaves: ['ruido', 'ruido continuo', 'ruido intermitente', 'ruido de impacto'],
    atividadesExemplo: ['Exposição a Níveis de Exposição Normalizados (NEN) superiores a 85 dB(A)'],
  },
  {
    codigo: '2.0.2', nome: 'Vibrações', categoria: 'fisico', tempoExposicaoAnos: 25,
    chaves: ['vibracao', 'vibracoes'],
    atividadesExemplo: ['Trabalhos com perfuratrizes e marteletes pneumáticos'],
  },
  {
    codigo: '2.0.3', nome: 'Radiações ionizantes', categoria: 'fisico', tempoExposicaoAnos: 25,
    chaves: ['radiacao ionizante', 'radiacoes ionizantes'],
    atividadesExemplo: ['Extração e beneficiamento de minerais radioativos', 'Operações com reatores nucleares ou fontes radioativas', 'Trabalhos com raios X, alfa, beta e gama'],
  },
  {
    codigo: '2.0.4', nome: 'Temperaturas anormais (calor)', categoria: 'fisico', tempoExposicaoAnos: 25,
    chaves: ['calor', 'temperatura anormal', 'ibutg'],
    atividadesExemplo: ['Trabalhos com exposição ao calor acima dos limites de tolerância estabelecidos na NR-15'],
  },
  {
    codigo: '2.0.5', nome: 'Pressão atmosférica anormal', categoria: 'fisico', tempoExposicaoAnos: 25,
    chaves: ['pressao atmosferica', 'hiperbarico', 'condicoes hiperbaricas'],
    atividadesExemplo: ['Trabalhos em caixões ou câmaras hiperbáricas', 'Operações de mergulho com uso de escafandros'],
  },
  {
    codigo: '3.0.1', nome: 'Microorganismos e parasitas infectocontagiosos vivos e suas toxinas', categoria: 'biologico', tempoExposicaoAnos: 25,
    chaves: ['microorganismo', 'agente biologico', 'agentes biologicos', 'infectocontagiante', 'infecto contagiante'],
    atividadesExemplo: ['Trabalhos em estabelecimentos de saúde em contato com pacientes portadores de doenças infectocontagiosas', 'Trabalhos em galerias, fossas e tanques de esgoto', 'Coleta e industrialização do lixo'],
  },
]

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

// Sugere o agente do Anexo IV cujo nome mais se aproxima do nome do risco
// informado — usado só para exibir uma dica ao usuário, nunca para
// preencher ou sobrescrever campos automaticamente.
export function sugerirAnexoIV(nomeRisco: string): AgenteAnexoIV | null {
  const alvo = normalizar(nomeRisco)
  if (!alvo || alvo.length < 3) return null
  for (const agente of ANEXO_IV_AGENTES) {
    if (agente.chaves.some(chave => alvo.includes(chave))) return agente
  }
  return null
}
