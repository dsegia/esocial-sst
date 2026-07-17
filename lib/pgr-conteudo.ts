// Conteúdo estrutural e textos legais padrão do PGR (NR-1, Portaria SEPRT nº 6.730/2020).
// Textos genéricos — os mesmos para qualquer empresa, é o texto da norma.

export const SEVERIDADE_OPCOES = [
  { v: 2, l: 'Leve' },
  { v: 4, l: 'Moderado' },
  { v: 8, l: 'Grave' },
  { v: 16, l: 'Crítica' },
  { v: 32, l: 'Catastrófica' },
]

export const PROBABILIDADE_OPCOES = [
  { v: 2, l: 'Raro', desc: 'Ocorrência praticamente inexistente. Exposição pontual, controle excelente da fonte geradora ou ausência de circunstância relevante de exposição.' },
  { v: 3, l: 'Pouco Provável', desc: 'Ocorrência pouco frequente. Controle da fonte geradora em conformidade legal, mantido de forma adequada.' },
  { v: 5, l: 'Ocasional', desc: 'Ocorrência esporádica. Controle existente com pequenas deficiências de operação ou manutenção.' },
  { v: 8, l: 'Provável', desc: 'Ocorrência frequente. Controle deficiente, incompleto ou com deficiências relevantes.' },
  { v: 13, l: 'Frequente', desc: 'Ocorrência constante ou contínua. Medidas de controle inexistentes ou totalmente inadequadas.' },
]

export const TRAJETORIA_OPCOES = [
  'Corporal', 'Auditiva', 'Ocular', 'Inalação', 'Cutânea',
  'Vias respiratórias', 'Corpo inteiro', 'Mãos', 'Tronco',
]

export const TIPO_EXPOSICAO_OPCOES = [
  'Habitual e Intermitente', 'Habitual e Permanente', 'Intermitente', 'Eventual',
]

export const PRIORIZACAO_OPCOES = [
  { v: 'alta', l: 'Alta', cor: '#791F1F', bg: '#FCEBEB' },
  { v: 'media', l: 'Média', cor: '#633806', bg: '#FAEEDA' },
  { v: 'baixa', l: 'Baixa', cor: '#27500A', bg: '#EAF3DE' },
]

// Grau de certeza da avaliação do risco — usado para orientar a prioridade de
// investigação/controle no plano de ação (quanto mais incerta a estimativa,
// maior a necessidade de aprofundar a avaliação técnica antes de agir).
export const ESTIMATIVA_OPCOES = [
  { v: 'certa', l: 'Certa', num: 0 },
  { v: 'incerta', l: 'Incerta', num: 1 },
  { v: 'altamente_incerta', l: 'Altamente incerta', num: 2 },
]

export interface NivelRisco {
  valor: number
  faixa: 'Baixo' | 'Médio' | 'Alto' | 'Muito Alto'
  cor: string
  bg: string
}

// Quadro 2 — Interpretação da Matriz de Graduação da Exposição Ocupacional
export function nivelRisco(severidade?: number | null, probabilidade?: number | null): NivelRisco | null {
  if (!severidade || !probabilidade) return null
  const valor = severidade * probabilidade
  if (valor > 120) return { valor, faixa: 'Muito Alto', cor: '#791F1F', bg: '#FCEBEB' }
  if (valor >= 60) return { valor, faixa: 'Alto', cor: '#9A3412', bg: '#FDE7D1' }
  if (valor >= 25) return { valor, faixa: 'Médio', cor: '#633806', bg: '#FAEEDA' }
  return { valor, faixa: 'Baixo', cor: '#27500A', bg: '#EAF3DE' }
}

export interface IQCTResultado { valor: number; nBaixo: number; nMedio: number; nAlto: number; nMuitoAlto: number }

// IQCT — Indicador de Qualidade das Condições de Trabalho, adaptado da metodologia
// difundida pela Fundacentro: IQCT = (4·nBaixo + 3·nMédio + nAlto) / ((nBaixo+nMédio+nAlto)×4) × 100.
// Riscos "Muito Alto" exigem ação imediata e ficam fora do índice (assim como riscos
// sem severidade/probabilidade preenchidas). Resultado varia de 25 a 100 — quanto
// maior, melhor a condição de trabalho do grupo avaliado.
export function calcularIQCT(riscos?: { severidade?: number | string | null; probabilidade?: number | string | null }[] | null): IQCTResultado | null {
  if (!riscos?.length) return null
  let nBaixo = 0, nMedio = 0, nAlto = 0, nMuitoAlto = 0
  for (const r of riscos) {
    const nr = nivelRisco(Number(r.severidade) || null, Number(r.probabilidade) || null)
    if (!nr) continue
    if (nr.faixa === 'Baixo') nBaixo++
    else if (nr.faixa === 'Médio') nMedio++
    else if (nr.faixa === 'Alto') nAlto++
    else if (nr.faixa === 'Muito Alto') nMuitoAlto++
  }
  const total = nBaixo + nMedio + nAlto
  if (!total) return null
  const valor = Math.round((4 * nBaixo + 3 * nMedio + nAlto) / (total * 4) * 100)
  return { valor, nBaixo, nMedio, nAlto, nMuitoAlto }
}

export const IQCT_EXPLICACAO = 'IQCT — Indicador de Qualidade das Condições de Trabalho: calculado por GHE a partir da distribuição dos riscos avaliados nos níveis Baixo, Médio e Alto (riscos Muito Alto exigem ação imediata e ficam fora do índice). Varia de 25 a 100 — quanto maior, melhor a condição de trabalho do grupo.'

// ── Critérios técnicos de referência para gradação de severidade e
// probabilidade (AIHA / AS-NZS 4360 / European Commission, recomendadas pela
// Fundacentro) — texto e tabelas completos, usados como base técnica para a
// definição dos níveis de severidade e probabilidade adotados no Quadro 2 e no
// Quadro 3 deste documento (item "Critérios adotados neste documento").
export interface TabelaGraduacao {
  titulo: string
  subtitulo?: string
  intro?: string
  colunas: string[]
  linhas: string[][]
}

export const CRITERIOS_GRADACAO_INTRO: string[] = [
  'As tabelas de gradação de severidade e probabilidade utilizadas como critério técnico de referência para a elaboração deste inventário de riscos são as tabelas da AIHA — American Industrial Hygiene Association, AS/NZS 4360 e European Commission, recomendadas pela Fundacentro. Todas elas possuem gradações de 1 (um) a 5 (cinco), que orientam a classificação da severidade e da probabilidade de cada risco identificado.',
  'As gradações de probabilidade são 5 (cinco): Rara (1); Pouco Provável (2); Possível (3); Provável (4); e Muito Provável (5). Nas avaliações qualitativas, de acordo com o controle e a exposição ao risco, determina-se de 1 a 5 o nível de probabilidade.',
  'A tabela de gradação utilizada como referência é sempre sujeita ao agente nocivo avaliado. Em avaliações quantitativas, a probabilidade é classificada de acordo com a porcentagem do valor de exposição ao LEO — Limite de Exposição Ocupacional. Independentemente do agente nocivo, sempre haverá um limite de exposição, e a tabela a seguir define a probabilidade com base no limite determinado pelas normas vigentes.',
]

export const TABELA_PROBABILIDADE_QUANTITATIVA: TabelaGraduacao = {
  titulo: 'GRADAÇÃO DE PROBABILIDADE — AVALIAÇÕES QUANTITATIVAS',
  subtitulo: 'Estimativa de probabilidade baseada no LEO — Limite de Exposição Ocupacional (sem considerar EPI) | AIHA (2015)',
  colunas: ['Nível', 'Categoria', 'Níveis de Exposição'],
  linhas: [
    ['1', 'Exposição a níveis muito baixos', 'Exposições < 10% do LEO'],
    ['2', 'Exposição baixa', 'Exposições > 10% e < 50% do LEO'],
    ['3', 'Exposição moderada', 'Exposições > 50% e < 100% do LEO'],
    ['4', 'Exposição excessiva', 'Exposições > 100% e até 500% do LEO'],
    ['5', 'Exposição muito excessiva', 'Exposições superiores a 5× o LEO'],
  ],
}

export const TABELA_PROBABILIDADE_QUALITATIVA_QUIMICOS: TabelaGraduacao = {
  titulo: 'GRADAÇÃO DE PROBABILIDADE — AVALIAÇÕES QUALITATIVAS DE AGENTES QUÍMICOS',
  subtitulo: 'Estimativa de probabilidade baseada no sistema de controle da fonte geradora de risco',
  intro: 'A tabela abaixo classifica o nível de probabilidade com base na estimativa de controle da fonte geradora do risco ocupacional. Caso o sistema de controle seja totalmente seguro e controlado, não há possibilidade de inalação ou contato com o agente/substância; à medida que o sistema de controle se torna menos eficiente, a probabilidade aumenta. Esta tabela de gradação é sugerida na avaliação de agentes químicos aos quais o trabalhador está exposto por inalação ou contato com o agente.',
  colunas: ['Nível', 'Possibilidade de Inalação/Contato', 'Sistema de Controle'],
  linhas: [
    ['1', 'Sem possibilidade', 'Sistema totalmente seguro e controlado.'],
    ['2', 'Baixa possibilidade', 'Sistema fechado, com pouca possibilidade de exposição durante a atividade.'],
    ['3', 'Média possibilidade', 'Sistema semiaberto, com barreiras de controle/ventilação aprimorada.'],
    ['4', 'Possibilidade considerável', 'Sistema aberto, com barreiras de controle/ventilação natural.'],
    ['5', 'Alta possibilidade', 'Sistema aberto, sem controle/ventilação.'],
  ],
}

export const TABELA_PROBABILIDADE_QUALITATIVA_GERAL: TabelaGraduacao = {
  titulo: 'GRADAÇÃO DE PROBABILIDADE — AVALIAÇÕES QUALITATIVAS (MECÂNICOS / ERGONÔMICOS / BIOLÓGICOS / OUTROS)',
  subtitulo: 'Estimativa de probabilidade baseada no controle existente e nas medidas de prevenção implementadas',
  intro: 'Para as demais avaliações qualitativas, utiliza-se a tabela de gradação de probabilidade baseada nas medidas de controle existentes. Uma medida de prevenção que representa a melhor tecnologia disponível é considerada uma medida de controle excelente; quanto menos eficientes os métodos de controle, maior o nível de probabilidade. Esta tabela foi pensada para servir de referência a avaliações qualitativas diversas, pois torna possível não apenas categorizar, mas também orientar o aprimoramento das medidas de prevenção até que se reduza a probabilidade ao mínimo possível.',
  colunas: ['Nível', 'Controle Existente', 'Medidas de Prevenção'],
  linhas: [
    ['1', 'Controle excelente', 'Representa a melhor tecnologia ou prática de controle disponível.'],
    ['2', 'Controle em conformidade legal', 'Controle seguindo as normas legais, mantido adequadamente.'],
    ['3', 'Controle com pequenas deficiências', 'Controle adequado, com pequenas deficiências na operação ou manutenção.'],
    ['4', 'Controle deficiente', 'Controle incompleto ou com deficiências relevantes.'],
    ['5', 'Controle inexistente', 'As medidas de controle são inexistentes ou totalmente inadequadas.'],
  ],
}

export const NOTAS_PROBABILIDADE: Definicao[] = [
  { termo: 'Requisitos estabelecidos em NR', definicao: 'Todos os requisitos estabelecidos em Norma Regulamentadora baseiam-se em limites de tolerância (o mesmo que LEO — Limite de Exposição Ocupacional). A tabela quantitativa foi pensada para ser utilizada em todas as avaliações quantitativas, definindo o nível de probabilidade com base no LEO.' },
  { termo: 'Medidas de prevenção implementadas', definicao: 'Para avaliações qualitativas, utiliza-se a tabela baseada nas medidas de prevenção existentes. Na primeira tabela (quantitativa) não é considerado o EPI; já as tabelas qualitativas são baseadas inteiramente considerando o EPI e as demais medidas de controle existentes. Assim como a tabela do LEO, as tabelas qualitativas conseguem estimar o nível em qualquer situação: se há um fator de risco no ambiente, este deve ser controlado, e é com base no controle desse fator que se define o nível de probabilidade.' },
  { termo: 'Exigências da atividade de trabalho', definicao: 'Para avaliações quantitativas, seguem-se as exigências conforme os requisitos estabelecidos em NR — em uma avaliação de ruído, por exemplo, a tabela permite categorizar o nível de probabilidade com base nas exigências da NR-15, já que é baseada no LEO. Para avaliações qualitativas, seguem-se as exigências baseadas em conformidade legal, conforme as medidas de controle existentes: controle em conformidade legal representa, por exemplo, probabilidade de nível 2.' },
  { termo: 'Comparação do perfil de exposição ocupacional com os valores de referência da NR-9', definicao: 'A tabela baseada em LEO permite categorizar o nível de probabilidade a partir da comparação do perfil de exposição ocupacional, sendo o LEO o valor de referência, independentemente da norma aplicável.' },
]

export const TABELA_SEVERIDADE_REFERENCIA: TabelaGraduacao = {
  titulo: 'GRADAÇÃO DE SEVERIDADE — AVALIAÇÕES QUANTITATIVAS/QUALITATIVAS',
  subtitulo: 'Estimativas de severidade | AIHA (2015)',
  intro: 'As gradações de severidade são 5 (cinco): Leve (1); Baixa (2); Moderada (3); Alta (4); e Extrema (5). A severidade é classificada de 1 a 5 de acordo com o nível de consequência da exposição. A tabela abaixo permite categorizar a severidade de qualquer agente nocivo, levando em consideração a lesão/doença e a quantidade de pessoas afetadas, cobrindo, em cinco categorias, desde lesões/doenças triviais até mortes/incapacidades em mais de dez pessoas.',
  colunas: ['Nível', 'Definição'],
  linhas: [
    ['1', 'Lesão leve, sem necessidade de atenção médica, incômodos ou mal-estar.'],
    ['2', 'Lesão ou doenças sérias reversíveis.'],
    ['3', 'Lesão ou doenças críticas irreversíveis, que podem limitar a capacidade funcional.'],
    ['4', 'Lesão ou doença incapacitante ou mortal.'],
    ['5', 'Mortes ou incapacidades múltiplas (mais de dez pessoas).'],
  ],
}

export const NOTAS_SEVERIDADE: Definicao[] = [
  { termo: 'Magnitude da consequência', definicao: 'A classificação da lesão/doença como leve, séria reversível, crítica irreversível, incapacitante/mortal ou fatal múltipla refere-se à magnitude da consequência sobre a saúde do trabalhador.' },
  { termo: 'Número de trabalhadores possivelmente afetados', definicao: 'No nível 5, a referência a "mais de dez pessoas" diz respeito à quantidade de trabalhadores possivelmente afetados por um mesmo evento; nos demais níveis, subentende-se número igual ou inferior a dez.' },
  { termo: 'Consequências de acidentes ampliados', definicao: 'A gradação de severidade também leva em conta a possibilidade de um acidente ampliado — isto é, mesmo quando o dano típico esperado for uma lesão, considera-se também a possibilidade de uma doença associada de gravidade equivalente, classificada no mesmo nível.' },
]

export const TEXTO_MATRIZ_RISCO = {
  intro: [
    'A matriz de risco utilizada como referência técnica neste Programa de Gerenciamento de Riscos é uma matriz no formato 5×5, baseada nas estimativas de gradações de Severidade e Probabilidade da AIHA — American Industrial Hygiene Association, AS/NZS 4360 e European Commission, recomendadas pela Fundacentro. Esta matriz funciona tanto para avaliações qualitativas quanto quantitativas, pois as tabelas de gradação sugeridas possuem estimativas adequadas para ambas.',
    'Os níveis de risco previstos nesta metodologia de referência são 5 (cinco): Trivial; Tolerável; Moderado; Substancial; e Intolerável — consolidados, para fins deste documento, nas 4 (quatro) faixas do Quadro 1 (Baixo, Médio, Alto e Muito Alto). Cada nível de risco possui um método de controle sugerido, baseado na estimativa (grau de certeza) da avaliação, e os riscos de níveis mais altos têm prioridade de ação.',
  ],
  exemplo: [
    'Exemplo de aplicação: a avaliação de um agente nocivo resulta em exposição entre 10% e 50% do LEO — Limite de Exposição Ocupacional, classificando a probabilidade como nível 2 (pouco provável), de acordo com a tabela de gradação AIHA. A severidade de uma doença que possa surgir a partir do agente avaliado é classificada como "lesão ou doenças críticas irreversíveis que podem limitar a capacidade funcional", correspondendo à severidade de nível 3 (moderada). O nível do risco é o produto da probabilidade pela severidade — no caso, 2 × 3 = 6 (moderado), de acordo com a matriz.',
    'Os valores numéricos são apenas uma referência de cálculo; o que importa é o nível/categoria de risco resultante. Caso os valores fossem invertidos (severidade 2 e probabilidade 3), o produto ainda seria 6, mas o nível de risco resultante seria Tolerável, e não Moderado — pois a severidade tem maior peso do que a probabilidade na definição do nível de risco final. Por esse motivo, o resultado numérico do produto não é, isoladamente, o critério de classificação: apenas a categoria de risco resultante da matriz é utilizada.',
  ],
  metodosControle: 'Métodos de controle e ação: os métodos de controle são classificados de acordo com o nível do risco e o grau de certeza da estimativa da avaliação. Os níveis de risco mais altos têm prioridade na ação de controle. A ação de controle é classificada de acordo com a estimativa de certeza da avaliação, que pode ser: Certa (0); Incerta (1); e Altamente incerta (2) — a mesma classificação utilizada, risco a risco, no inventário deste PGR (coluna "Estimativa"). As ações do plano de ação são planejadas com base no inventário, e essas classificações servem para definir a prioridade das ações: quanto maior o nível do risco e quanto mais incerta a estimativa, maior a prioridade de investigação e controle. A tabela utilizada foi recomendada pela Fundacentro.',
  iqct: 'Indicador de Qualidade das Condições de Trabalho — IQCT: para cada Grupo Homogêneo de Exposição (GHE) é calculado um indicador de qualidade, o IQCT — Indicador da Qualidade das Condições de Trabalho, que varia de 25 (todos os riscos avaliados em nível alto) a 100 (todos os riscos avaliados em nível baixo). Apesar de existirem 4 (quatro) faixas de risco no Quadro 1 deste documento, o cálculo do IQCT considera apenas os riscos classificados como Baixo (B), Médio (M) e Alto (A); ficam fora do cálculo os riscos Muito Altos, que exigem atuação imediata independentemente do índice. O cálculo é feito pela fórmula IQCT = (4·nB + 3·nM + nA) / ((nB + nM + nA) × 4) × 100, em que nB, nM e nA são as quantidades de riscos do GHE classificadas, respectivamente, como Baixo, Médio e Alto. O resultado varia de 25 a 100 — quanto maior, melhor a condição de trabalho do grupo avaliado. O IQCT de cada GHE é apresentado junto ao respectivo inventário de riscos.',
}

export const QUADRO2_INTERPRETACAO = [
  {
    faixa: '> 120', label: 'Muito Alto', cor: '#791F1F', bg: '#FCEBEB', prazo: 'Implementação imediata.',
    acao: 'Medidas de controle de redução de risco devem ser adotadas ao menor nível razoavelmente alcançável (ALARA), com aceitação endossada pela direção. Exige acompanhamento médico e avaliação quantitativa da exposição.',
  },
  {
    faixa: '60 a 120', label: 'Alto', cor: '#9A3412', bg: '#FDE7D1', prazo: 'Implementação em até 6 (seis) meses.',
    acao: 'Medidas de controle de redução de risco devem ser adotadas ao menor nível razoavelmente alcançável (ALARA). Exige acompanhamento médico e avaliação quantitativa da exposição.',
  },
  {
    faixa: '25 a 60', label: 'Médio', cor: '#633806', bg: '#FAEEDA', prazo: 'Implementação em até 1 (um) ano.',
    acao: 'Medidas de controle para redução de risco devem ser adotadas ao menor nível razoavelmente alcançável (ALARA), com acompanhamento médico e avaliação quantitativa da exposição.',
  },
  {
    faixa: '< 25', label: 'Baixo', cor: '#27500A', bg: '#EAF3DE', prazo: 'Implementação se o custo/esforço for baixo.',
    acao: 'Devem ser gerenciados na busca por melhoria contínua.',
  },
]

// Quadro 4 (simplificado) — cada opção de severidade corresponde a uma faixa de efeito à saúde
export const QUADRO4_SEVERIDADE = [
  { v: 2, l: 'Leve', efeito: 'Efeitos reversíveis pouco preocupantes ou sem efeitos adversos conhecidos' },
  { v: 4, l: 'Moderado', efeito: 'Efeitos reversíveis preocupantes' },
  { v: 8, l: 'Grave', efeito: 'Efeitos reversíveis severos' },
  { v: 16, l: 'Crítica', efeito: 'Efeitos irreversíveis' },
  { v: 32, l: 'Catastrófica', efeito: 'Risco de vida ou doença/lesão incapacitante' },
]

export interface Definicao { termo: string; definicao: string }

// Glossário técnico do GRO/PGR — baseado no Anexo I "Termos e Definições" da NR-1
// (redação dada pela Portaria MTE nº 1.419/2024) e em conceitos consagrados na
// prática de segurança e saúde do trabalho no Brasil.
export const DEFINICOES_PGR: Definicao[] = [
  { termo: 'Perigo (ou fator de risco ocupacional)', definicao: 'Elemento ou situação que, isoladamente ou em combinação, tem o potencial de dar origem a lesões ou agravos à saúde do trabalhador.' },
  { termo: 'Risco ocupacional', definicao: 'Combinação da probabilidade de ocorrência de um determinado evento indesejado, relacionado a um perigo, com a severidade das lesões ou dos agravos à saúde que dele podem resultar.' },
  { termo: 'Dano', definicao: 'Lesão à integridade física ou mental do trabalhador, ou agravo à sua saúde, inclusive em decorrência de exposição a fatores de risco psicossociais relacionados ao trabalho.' },
  { termo: 'Gerenciamento de Riscos Ocupacionais (GRO)', definicao: 'Processo contínuo e sistemático de identificação de perigos e de avaliação, classificação, tratamento e monitoramento dos riscos ocupacionais, com o objetivo de proporcionar ambientes de trabalho seguros e saudáveis.' },
  { termo: 'Programa de Gerenciamento de Riscos (PGR)', definicao: 'Documento que consolida o GRO em um estabelecimento, formado, no mínimo, pelo inventário de riscos ocupacionais e pelo plano de ação.' },
  { termo: 'Inventário de riscos ocupacionais', definicao: 'Documento que consolida os dados da identificação de perigos e das avaliações de riscos ocupacionais realizadas na organização.' },
  { termo: 'Plano de ação', definicao: 'Documento que indica as medidas de prevenção a serem introduzidas, aprimoradas ou mantidas, definindo cronograma, formas de acompanhamento e de aferição de resultados.' },
  { termo: 'Identificação de perigos', definicao: 'Etapa do GRO em que são reconhecidos os perigos existentes, descritas as possíveis lesões ou agravos à saúde, identificadas as fontes ou circunstâncias e caracterizado o grupo de trabalhadores expostos.' },
  { termo: 'Avaliação de riscos ocupacionais', definicao: 'Processo de determinação do nível de risco, a partir da combinação entre a severidade das possíveis lesões e a probabilidade de sua ocorrência, para subsidiar a definição das medidas de prevenção necessárias.' },
  { termo: 'Levantamento preliminar de perigos', definicao: 'Etapa inicial de reconhecimento de perigos, realizada antes do início de funcionamento do estabelecimento, de novas instalações ou da introdução de novos processos ou atividades de trabalho.' },
  { termo: 'Medidas de prevenção', definicao: 'Ações destinadas a eliminar, minimizar ou controlar riscos ocupacionais, adotadas segundo a ordem de prioridade: eliminação do perigo; medidas de proteção coletiva (EPC); medidas administrativas ou de organização do trabalho; e medidas de proteção individual (EPI).' },
  { termo: 'Severidade', definicao: 'Magnitude esperada das lesões ou dos agravos à saúde decorrentes de um determinado perigo, considerando também o número de trabalhadores potencialmente afetados.' },
  { termo: 'Probabilidade', definicao: 'Chance estimada de ocorrência do dano, considerando a frequência e a duração da exposição, os requisitos normativos e as medidas de prevenção já implementadas.' },
  { termo: 'Nível de risco', definicao: 'Resultado da combinação entre severidade e probabilidade (severidade × probabilidade), utilizado para classificar e priorizar a implementação das medidas de prevenção (Baixo, Médio, Alto ou Muito Alto).' },
  { termo: 'Fatores de Risco Psicossociais Relacionados ao Trabalho (FRPRT)', definicao: 'Fatores relacionados à organização e à gestão do trabalho capazes de causar dano à saúde física e mental do trabalhador, como sobrecarga e ritmo excessivos, jornadas extenuantes, assédio moral e sexual, violência no trabalho e conflitos interpessoais — incluídos de forma expressa no inventário de riscos pela Portaria MTE nº 1.419/2024.' },
  { termo: 'Perigo externo', definicao: 'Perigo alheio às atividades da organização, mas que, em razão do local ou das circunstâncias de trabalho, pode afetar a segurança e a saúde dos trabalhadores.' },
  { termo: 'Risco ocupacional evidente', definicao: 'Risco de fácil constatação, cuja gravidade dispensa avaliação técnica aprofundada para a adoção imediata de medida de prevenção.' },
  { termo: 'Emergência de grande magnitude', definicao: 'Evento inesperado cujas consequências extrapolam os limites da organização, podendo atingir a população ou o meio ambiente do entorno.' },
  { termo: 'Organização contratada', definicao: 'Pessoa jurídica ou física contratada para prestação de serviços nas dependências da organização contratante, responsável pelo gerenciamento dos riscos ocupacionais das próprias atividades.' },
  { termo: 'Grupo Homogêneo de Exposição (GHE)', definicao: 'Agrupamento metodológico de trabalhadores que compartilham, de forma similar, os mesmos perigos, atividades e condições de exposição — termo de uso consagrado na prática de higiene ocupacional (herdado da antiga NR-9/PPRA), que permite tratar riscos em conjunto de forma mais eficiente, embora não conste de forma expressa na redação atual da NR-1.' },
  { termo: 'Equipamento de Proteção Individual (EPI)', definicao: 'Dispositivo de uso individual destinado a proteger a saúde e a integridade física do trabalhador, sujeito às disposições da NR-6.' },
  { termo: 'Equipamento de Proteção Coletiva (EPC)', definicao: 'Dispositivo, sistema ou mecanismo que protege o conjunto de trabalhadores expostos a um risco, atuando na fonte ou na trajetória do perigo, antes que este atinja o trabalhador.' },
]

export interface SecaoLegal { titulo: string; paragrafos: string[] }

export const TEXTOS_LEGAIS_PGR: SecaoLegal[] = [
  {
    titulo: 'INTRODUÇÃO',
    paragrafos: [
      'O Programa de Gerenciamento de Riscos – PGR foi constituído pela Norma Regulamentadora – NR-1, através da Portaria SEPRT nº 6.730, de 09 de março de 2020, do Ministério da Economia. Esta norma estabelece a obrigatoriedade da elaboração e implementação, por parte de todos os empregadores e instituições que admitem trabalhadores como empregados, do Programa de Gerenciamento de Riscos – PGR.',
      'O PGR é parte integrante de um conjunto mais amplo de iniciativas da empresa no campo da preservação da saúde e integridade física dos trabalhadores, devendo estar articulado com o disposto nas demais Normas Regulamentadoras, em especial com o Programa de Controle Médico de Saúde Ocupacional – PCMSO, previsto na NR-7.',
      '"1.5.7.1 O PGR deve conter, no mínimo, os seguintes documentos: a) inventário de riscos; e b) plano de ação. 1.5.7.2 Os documentos integrantes do PGR devem ser elaborados sob a responsabilidade da organização, respeitado o disposto nas demais Normas Regulamentadoras, datados e assinados. 1.5.7.2.1 Os documentos integrantes do PGR devem estar sempre disponíveis aos trabalhadores interessados ou seus representantes e à Inspeção do Trabalho." (NR-1, Portaria SEPRT nº 6.730/2020)',
      'Os riscos identificados e avaliados neste PGR foram formalizados em um inventário de riscos, conforme estabelecido pela NR-1: "1.5.7.3.1 Os dados da identificação dos perigos e das avaliações dos riscos ocupacionais devem ser consolidados em um inventário de riscos ocupacionais."',
      'Após o inventário de riscos, foi consolidado um plano de ação para controle dos riscos ocupacionais necessários: "1.5.5.2.1 A organização deve elaborar plano de ação, indicando as medidas de prevenção a serem introduzidas, aprimoradas ou mantidas. 1.5.5.2.2 Para as medidas de prevenção deve ser definido cronograma, formas de acompanhamento e aferição de resultados."',
    ],
  },
  {
    titulo: 'OBJETIVOS',
    paragrafos: [
      'Este programa visa a preservação da saúde e integridade física dos trabalhadores, através da antecipação, reconhecimento, avaliação e consequente acompanhamento das medidas de controle da ocorrência de riscos ambientais existentes ou que existam no ambiente de trabalho, tendo em consideração a proteção do meio ambiente e dos recursos naturais.',
      'O Programa de Gerenciamento de Riscos – PGR tem como objetivos principais: garantir a salubridade nos locais de trabalho; prevenir os riscos ocupacionais capazes de provocar doenças profissionais; controlar os riscos ambientais capazes de causar danos à saúde do trabalhador; assegurar aos trabalhadores padrões adequados de saúde e bem-estar no ambiente de trabalho; e proteger o meio ambiente e os recursos naturais.',
      'Para fins de caracterização de atividades ou operações insalubres ou perigosas, devem ser aplicadas as disposições previstas na NR-15 (Atividades e Operações Insalubres) e na NR-16 (Atividades e Operações Perigosas).',
    ],
  },
  {
    titulo: 'RESPONSABILIDADES',
    paragrafos: [
      '3.1 Organização contratante: implementar o gerenciamento de riscos ocupacionais em suas atividades; identificar os perigos e avaliar os riscos ocupacionais indicando o nível de risco; classificar os riscos para determinar a necessidade de medidas de prevenção; implementar as medidas na ordem estabelecida pela NR-1; considerar as condições de trabalho nos termos da NR-17; comunicar aos trabalhadores os riscos consolidados no inventário e as medidas do plano de ação; e manter os documentos do PGR sempre disponíveis para os trabalhadores e a Inspeção do Trabalho.',
      '3.2 Organizações contratadas: fornecer ao contratante o inventário de riscos ocupacionais específico das atividades realizadas nas dependências da organização contratante.',
      '3.3 SESMT / designado CIPA: informar aos trabalhadores os riscos ambientais e os meios de prevenção e proteção; considerar o conhecimento e a percepção dos trabalhadores sobre o processo de trabalho; programar e aplicar treinamentos; propor e adotar soluções para eliminar ou reduzir a exposição aos riscos; e acompanhar o desenvolvimento do PCMSO.',
      '3.4 Dos empregados: colaborar e participar da implantação e execução do PGR; cumprir as normas e orientações recebidas em treinamentos; informar ao superior hierárquico ocorrências que possam implicar risco à sua saúde e segurança; e participar dos treinamentos programados.',
    ],
  },
  {
    titulo: 'PROCESSO DE IDENTIFICAÇÃO DE PERIGOS E AVALIAÇÃO DE RISCOS OCUPACIONAIS',
    paragrafos: [
      'O processo de identificação de perigos e avaliação de riscos ocupacionais deve considerar o disposto nas Normas Regulamentadoras e demais exigências legais de segurança e saúde no trabalho.',
      'O processo é conduzido em etapas sequenciais: (i) levantamento preliminar de perigos; (ii) identificação de perigos, com a descrição das fontes ou circunstâncias e do grupo de trabalhadores expostos; (iii) avaliação dos riscos ocupacionais, com a determinação do nível de risco; (iv) classificação dos riscos, para priorização das medidas de prevenção; e (v) elaboração do plano de ação. Este ciclo é contínuo, sendo retroalimentado sempre que houver mudanças nos processos de trabalho, novas evidências de exposição ou resultados de monitoramento que indiquem a necessidade de revisão.',
    ],
  },
  {
    titulo: 'LEVANTAMENTO PRELIMINAR DE PERIGOS',
    paragrafos: [
      'A etapa de levantamento preliminar de perigos deve seguir os seguintes critérios: ser realizada antes do início do funcionamento do estabelecimento ou de novas instalações; para atividades já existentes; e nas mudanças ou introdução de novos processos ou atividades de trabalho. Quando identificado, ainda nesta etapa, que os riscos não poderão ser evitados, a organização deve implementar o processo completo de identificação de perigos e avaliação de riscos ocupacionais.',
    ],
  },
  {
    titulo: 'IDENTIFICAÇÃO DE PERIGOS',
    paragrafos: [
      'A etapa de identificação de perigos deve conter: a descrição dos perigos e possíveis lesões ou agravos à saúde; a identificação das fontes ou circunstâncias; e a indicação do grupo de trabalhadores sujeitos aos riscos. A organização também deve mapear os riscos externos previsíveis relacionados ao trabalho que possam afetar a saúde e segurança dos trabalhadores.',
    ],
  },
  {
    titulo: 'AVALIAÇÃO DE RISCOS OCUPACIONAIS',
    paragrafos: [
      'A partir dos perigos identificados, a organização deve avaliar os riscos ocupacionais relacionados em seus estabelecimentos para a posterior elaboração das medidas de prevenção e controle, indicando para cada risco o nível determinado pela combinação da severidade das possíveis lesões e agravos à saúde com a probabilidade de sua ocorrência.',
      'A gradação da severidade leva em consideração a magnitude da consequência e o número de trabalhadores possivelmente afetados. A gradação da probabilidade considera os requisitos das Normas Regulamentadoras, as medidas de prevenção já implementadas, as exigências da atividade e a comparação do perfil de exposição com valores de referência da NR-9.',
      'A avaliação de riscos deve ser revista a cada 2 (dois) anos, ou antes disso quando: implementadas medidas de prevenção (para avaliação de riscos residuais); houver inovações ou modificações nas tecnologias, ambientes, processos ou organização do trabalho; forem identificadas inadequações ou ineficácias das medidas de prevenção; ocorrerem acidentes ou doenças relacionadas ao trabalho; ou houver mudança nos requisitos legais aplicáveis. Organizações com certificação em sistema de gestão de SST podem ter prazo de até 3 (três) anos.',
    ],
  },
  {
    titulo: 'METODOLOGIA',
    paragrafos: [
      'Para compor o inventário de riscos foram avaliados os níveis de risco através da matriz de riscos definida (severidade × probabilidade), com base nas tabelas de gradação apresentadas no Anexo II — Matriz de Risco deste documento.',
      'Nas avaliações quantitativas de agentes físicos e químicos realizadas no âmbito deste PGR, foram adotadas, como referência metodológica complementar, as Normas de Higiene Ocupacional da Fundacentro pertinentes a cada agente — como a NHO-01 (ruído), a NHO-06 (calor) e a NHO-08 (poeiras e material particulado) —, sem prejuízo dos critérios e limites de tolerância estabelecidos pela NR-15.',
    ],
  },
  {
    titulo: 'RISCOS AMBIENTAIS',
    paragrafos: [
      'Segundo a NR-9, são considerados riscos ambientais os agentes físicos, químicos e biológicos existentes no ambiente de trabalho que, em função de sua natureza, concentração e tempo de exposição, são capazes de causar danos à saúde do trabalhador:',
      'Agentes físicos: as diversas formas de energia a que possam estar expostos os trabalhadores, tais como ruído, vibração, radiações ionizantes e não ionizantes, frio, calor, pressões anormais e umidade.',
      'Agentes químicos: substâncias, compostos ou produtos que possam penetrar no organismo pela via respiratória (poeiras, fumos, névoas, neblinas, gases ou vapores) ou que possam ter contato ou ser absorvidos pelo organismo ou por ingestão.',
      'Agentes biológicos: microrganismos tais como vírus, bactérias, protozoários, fungos, parasitas e bacilos.',
      'Riscos ergonômicos: relacionados ao processo produtivo e às tarefas executadas em situações inadequadas, tais como esforço físico intenso, levantamento e transporte manual de peso, exigência de postura inadequada, controle rígido de produtividade, imposição de ritmos excessivos, trabalho em turno noturno, jornadas prolongadas, monotonia e repetitividade.',
      'Riscos de acidentes: relacionados à execução das atividades, colocando em exposição a saúde e integridade física dos trabalhadores, tais como arranjo físico inadequado, máquinas e equipamentos sem proteção, ferramentas inadequadas ou defeituosas, iluminação inadequada, eletricidade, probabilidade de incêndio ou explosão, armazenamento inadequado e animais peçonhentos.',
    ],
  },
  {
    titulo: 'RISCOS PSICOSSOCIAIS',
    paragrafos: [
      'Os riscos psicossociais foram incluídos de forma explícita no GRO/PGR pela NR-1, com alterações dadas pela Portaria MTE nº 1.419/2024 (plenamente exigível desde 26/05/2026). Compreendem fatores relacionados à organização e às relações de trabalho capazes de causar dano à saúde física e mental do trabalhador.',
      'Exemplos de fatores de risco psicossocial: sobrecarga e ritmo de trabalho excessivos, metas inalcançáveis, jornadas extenuantes, assédio moral e sexual, violência no trabalho, conflitos interpessoais, falta de clareza de papéis e responsabilidades, e outras condições organizacionais que gerem estresse ocupacional crônico ou burnout.',
      'Os riscos psicossociais identificados nos ambientes e GHE desta empresa, quando aplicável, estão consolidados no inventário de riscos (categoria "Psicossocial"), com a respectiva avaliação de severidade, probabilidade e nível de risco, e suas medidas de prevenção no plano de ação.',
      'O prazo de 26 de maio de 2026 para a exigibilidade plena das disposições sobre riscos psicossociais foi fixado pela Portaria MTE nº 765, de 15 de maio de 2025, que prorrogou o início da fiscalização de caráter punitivo do capítulo 1.5 da NR-1. O período entre maio de 2025 e maio de 2026 foi definido como fase educativa e orientativa, findo o qual a fiscalização passa a ter caráter plenamente punitivo, sem prorrogações adicionais anunciadas pelo Ministério do Trabalho e Emprego até a presente data.',
    ],
  },
  {
    titulo: 'FORMAS DE AVALIAÇÃO',
    paragrafos: [
      'A avaliação dos riscos ocupacionais pode ser qualitativa ou quantitativa. A avaliação qualitativa baseia-se na análise técnica da atividade, do ambiente, das fontes geradoras e da percepção dos trabalhadores, sendo suficiente para a maioria dos riscos quando não há dúvida quanto à necessidade e à eficácia das medidas de prevenção. A avaliação quantitativa, por sua vez, é exigida sempre que houver dúvida razoável sobre a exposição dos trabalhadores a agentes físicos e químicos, sendo realizada por meio de medições instrumentais, comparando os resultados obtidos com os limites de tolerância e valores de referência estabelecidos pela NR-15 e pelas Normas de Higiene Ocupacional da Fundacentro.',
      'Em ambos os casos, os resultados obtidos antes e depois da implantação das medidas de controle são comparados por critérios técnicos, permitindo verificar a eficácia das ações adotadas e subsidiar a revisão do nível de risco atribuído no inventário.',
    ],
  },
  {
    titulo: 'CONTROLE DOS RISCOS',
    paragrafos: [
      '12.1 Medidas de prevenção: serão adotadas medidas necessárias e suficientes para eliminação, minimização ou controle dos riscos ambientais sempre que verificada ao menos uma das situações: exigências das Normas Regulamentadoras e dispositivos legais; determinação pela classificação de riscos ocupacionais; ou evidências de associação, por controle médico, entre lesões/agravos à saúde e os riscos identificados. Quando comprovada a inviabilidade de medidas de proteção coletiva, ou quando insuficientes, devem ser adotadas, na ordem: medidas de caráter administrativo ou de organização do trabalho; e medidas de caráter individual (EPI).',
      '12.2 Implementação e acompanhamento das medidas de prevenção: a empresa, por meio de análise das ações executadas, inspeções nos ambientes de trabalho e monitoramento das condições ambientais e exposições, avaliará a eficácia das medidas existentes e implantadas, estabelecendo novas medidas quando necessário. Quando identificada ineficácia, devem ser realizados ajustes para corrigir as deficiências, com histórico registrado.',
      '12.3 Acompanhamento da saúde ocupacional dos trabalhadores: realizado de forma periódica e contínua, de acordo com os riscos ocupacionais identificados e atendendo às diretrizes da NR-7, integrado às demais medidas de saúde e segurança do trabalho.',
      '12.4 Análise de acidentes e doenças relacionadas ao trabalho: todos os acidentes e doenças relacionadas ao trabalho são analisados e documentados, considerando as fontes causadoras, as atividades desenvolvidas, os materiais utilizados e a organização do ambiente de trabalho, identificando fatores que forneçam evidências para revisar as medidas de prevenção existentes.',
      '12.5 Preparação para emergências: é de responsabilidade da organização elaborar, implementar e manter atualizados os procedimentos de resposta a cenários de emergência, considerando os riscos ocupacionais identificados e as características das atividades desenvolvidas — ver Anexo I (Plano de Emergência).',
    ],
  },
  {
    titulo: 'EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL DE USO OBRIGATÓRIO',
    paragrafos: [
      'A empresa fornece gratuitamente aos empregados apenas EPI adequado ao risco, em perfeito estado de conservação e funcionamento, sendo estes portadores de Certificado de Aprovação – CA, conforme a NR-6.',
    ],
  },
  {
    titulo: 'CONCLUSÃO',
    paragrafos: [
      'Este programa tem como fundamento legal a NR-1, e seu objetivo é disciplinar os preceitos a serem observados na organização e no ambiente de trabalho, de forma a tornar compatível o planejamento e desenvolvimento das atividades com a busca permanente da segurança e saúde dos trabalhadores. Este programa estará em constante análise e estudo, visando seu aperfeiçoamento, podendo, portanto, sofrer modificações a qualquer momento.',
    ],
  },
  {
    titulo: 'REFERÊNCIAS NORMATIVAS COMPLEMENTARES',
    paragrafos: [
      'Além do arcabouço legal obrigatório que fundamenta este PGR (NR-1, NR-7, NR-9, NR-15, NR-16, NR-17 e Portaria MTE nº 1.419/2024), a empresa pode adotar, de forma voluntária e complementar, referências internacionais e nacionais de boas práticas de gestão de saúde e segurança ocupacional, sem que isso substitua ou dispense o cumprimento das exigências legais brasileiras.',
      'A ABNT NBR ISO 45001:2024 (Sistemas de gestão de saúde e segurança ocupacional — Requisitos com orientação para uso), publicada pela Associação Brasileira de Normas Técnicas em 21 de novembro de 2024 e complementada pela Emenda 1:2025 (que incorporou considerações sobre mudanças climáticas aos requisitos de contexto da organização), constitui a norma internacional de referência para sistemas de gestão de SST. Empresas que já estruturaram seu PGR nos moldes da NR-1 possuem base técnica relevante para eventual certificação voluntária nessa norma, cuja adoção não é exigência legal no Brasil, mas complementa e fortalece a gestão de riscos ocupacionais já estabelecida.',
      'A Portaria MTE nº 1.419, de 27 de agosto de 2024, aprovou a nova redação do capítulo "1.5 Gerenciamento de Riscos Ocupacionais" e alterou o Anexo I ("Termos e Definições") da NR-1, incluindo de forma expressa os Fatores de Riscos Psicossociais Relacionados ao Trabalho – FRPRT no inventário de riscos, ao lado dos fatores de risco ergonômico, e determinando a adoção de mecanismos de consulta mais ativa dos trabalhadores no processo de gerenciamento de riscos ocupacionais.',
    ],
  },
  {
    titulo: 'REFERÊNCIAS BIBLIOGRÁFICAS',
    paragrafos: [
      'MINISTÉRIO DO TRABALHO E EMPREGO. Norma Regulamentadora nº 1 (NR-1) — Disposições Gerais e Gerenciamento de Riscos Ocupacionais, Portaria SEPRT nº 6.730/2020 e alterações posteriores.',
      'MINISTÉRIO DO TRABALHO E EMPREGO. Normas Regulamentadoras nº 7, 9, 15, 16 e 17, e seus respectivos Anexos.',
      'FUNDACENTRO. Normas de Higiene Ocupacional — NHO. Disponível em: gov.br/fundacentro/pt-br/centrais-de-conteudo/biblioteca/nhos.',
      'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. ABNT NBR ISO 45001:2024 — Sistemas de gestão de saúde e segurança ocupacional.',
      'MINISTÉRIO DO TRABALHO E EMPREGO. Manual sobre o Gerenciamento de Riscos Ocupacionais (GRO) e o Programa de Gerenciamento de Riscos (PGR) da NR-1. Secretaria de Inspeção do Trabalho.',
    ],
  },
]

export const TEXTO_PLANO_EMERGENCIA = {
  titulo: 'ANEXO — PLANO DE EMERGÊNCIA',
  secoes: [
    {
      subtitulo: 'Introdução',
      paragrafos: [
        'Atendendo aos constantes riscos de origem natural e humana, e com a finalidade de estar preparado para uma possível contingência, este plano de emergência consiste na necessidade de proteger o capital máximo da empresa, que são as vidas humanas, as instalações e os equipamentos.',
      ],
    },
    {
      subtitulo: 'Objetivo e Coordenação',
      paragrafos: [
        'Evacuar de forma rápida e segura e atender a cenários de emergência que proporcionem riscos à vida humana.',
      ],
    },
    {
      subtitulo: 'Conceitos Relevantes',
      paragrafos: [
        'Emergência: combinação de fatos decorrentes de defeitos em equipamentos, falhas no controle do processo, fenômenos naturais (tempestades, raios, enchentes) ou falhas humanas, que podem resultar em incêndio, explosão, derramamento ou vazamento de produtos químicos, ou qualquer acidente com lesão, dano à propriedade, ao meio ambiente ou à comunidade.',
        'Plano de Emergência: conjunto de medidas a serem adotadas no caso de uma emergência.',
        'Procedimento de Abandono de Área: prevê os passos para o abandono seguro da localidade pelos empregados e visitantes, de modo que não ocorram atropelos e consequentes acidentes.',
        'Procedimento de Contingência: prevê as ações a serem adotadas quando houver vazamento ou derrame de produtos químicos, de forma que danos aos empregados e ao meio ambiente sejam evitados ou minimizados.',
        'Procedimento de Parada de Emergência: prevê a paralisação de todas as atividades ao ouvir o sistema de comunicação de emergência (alarme, alto-falante, contatos telefônicos, entre outros).',
        'Riscos relativos à segurança, saúde e meio ambiente: probabilidade de ocorrerem danos à saúde e integridade física dos trabalhadores, ao meio ambiente ou ao patrimônio, causados por atitudes, produtos ou serviços.',
      ],
    },
  ],
}
