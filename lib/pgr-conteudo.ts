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
  { v: 2, l: 'Raro' },
  { v: 3, l: 'Pouco Provável' },
  { v: 5, l: 'Ocasional' },
  { v: 8, l: 'Provável' },
  { v: 13, l: 'Frequente' },
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
    titulo: '1. INTRODUÇÃO',
    paragrafos: [
      'O Programa de Gerenciamento de Riscos – PGR foi constituído pela Norma Regulamentadora – NR-1, através da Portaria SEPRT nº 6.730, de 09 de março de 2020, do Ministério da Economia. Esta norma estabelece a obrigatoriedade da elaboração e implementação, por parte de todos os empregadores e instituições que admitem trabalhadores como empregados, do Programa de Gerenciamento de Riscos – PGR.',
      'O PGR é parte integrante de um conjunto mais amplo de iniciativas da empresa no campo da preservação da saúde e integridade física dos trabalhadores, devendo estar articulado com o disposto nas demais Normas Regulamentadoras, em especial com o Programa de Controle Médico de Saúde Ocupacional – PCMSO, previsto na NR-7.',
      '"1.5.7.1 O PGR deve conter, no mínimo, os seguintes documentos: a) inventário de riscos; e b) plano de ação. 1.5.7.2 Os documentos integrantes do PGR devem ser elaborados sob a responsabilidade da organização, respeitado o disposto nas demais Normas Regulamentadoras, datados e assinados. 1.5.7.2.1 Os documentos integrantes do PGR devem estar sempre disponíveis aos trabalhadores interessados ou seus representantes e à Inspeção do Trabalho." (NR-1, Portaria SEPRT nº 6.730/2020)',
      'Os riscos identificados e avaliados neste PGR foram formalizados em um inventário de riscos, conforme estabelecido pela NR-1: "1.5.7.3.1 Os dados da identificação dos perigos e das avaliações dos riscos ocupacionais devem ser consolidados em um inventário de riscos ocupacionais."',
      'Após o inventário de riscos, foi consolidado um plano de ação para controle dos riscos ocupacionais necessários: "1.5.5.2.1 A organização deve elaborar plano de ação, indicando as medidas de prevenção a serem introduzidas, aprimoradas ou mantidas. 1.5.5.2.2 Para as medidas de prevenção deve ser definido cronograma, formas de acompanhamento e aferição de resultados."',
    ],
  },
  {
    titulo: '2. OBJETIVOS',
    paragrafos: [
      'Este programa visa a preservação da saúde e integridade física dos trabalhadores, através da antecipação, reconhecimento, avaliação e consequente acompanhamento das medidas de controle da ocorrência de riscos ambientais existentes ou que existam no ambiente de trabalho, tendo em consideração a proteção do meio ambiente e dos recursos naturais.',
      'O Programa de Gerenciamento de Riscos – PGR tem como objetivos principais: garantir a salubridade nos locais de trabalho; prevenir os riscos ocupacionais capazes de provocar doenças profissionais; controlar os riscos ambientais capazes de causar danos à saúde do trabalhador; assegurar aos trabalhadores padrões adequados de saúde e bem-estar no ambiente de trabalho; e proteger o meio ambiente e os recursos naturais.',
      'Para fins de caracterização de atividades ou operações insalubres ou perigosas, devem ser aplicadas as disposições previstas na NR-15 (Atividades e Operações Insalubres) e na NR-16 (Atividades e Operações Perigosas).',
    ],
  },
  {
    titulo: '3. RESPONSABILIDADES',
    paragrafos: [
      '3.1 Organização contratante: implementar o gerenciamento de riscos ocupacionais em suas atividades; identificar os perigos e avaliar os riscos ocupacionais indicando o nível de risco; classificar os riscos para determinar a necessidade de medidas de prevenção; implementar as medidas na ordem estabelecida pela NR-1; considerar as condições de trabalho nos termos da NR-17; comunicar aos trabalhadores os riscos consolidados no inventário e as medidas do plano de ação; e manter os documentos do PGR sempre disponíveis para os trabalhadores e a Inspeção do Trabalho.',
      '3.2 Organizações contratadas: fornecer ao contratante o inventário de riscos ocupacionais específico das atividades realizadas nas dependências da organização contratante.',
      '3.3 SESMT / designado CIPA: informar aos trabalhadores os riscos ambientais e os meios de prevenção e proteção; considerar o conhecimento e a percepção dos trabalhadores sobre o processo de trabalho; programar e aplicar treinamentos; propor e adotar soluções para eliminar ou reduzir a exposição aos riscos; e acompanhar o desenvolvimento do PCMSO.',
      '3.4 Dos empregados: colaborar e participar da implantação e execução do PGR; cumprir as normas e orientações recebidas em treinamentos; informar ao superior hierárquico ocorrências que possam implicar risco à sua saúde e segurança; e participar dos treinamentos programados.',
    ],
  },
  {
    titulo: '4. PROCESSO DE IDENTIFICAÇÃO DE PERIGOS E AVALIAÇÃO DE RISCOS OCUPACIONAIS',
    paragrafos: [
      'O processo de identificação de perigos e avaliação de riscos ocupacionais deve considerar o disposto nas Normas Regulamentadoras e demais exigências legais de segurança e saúde no trabalho.',
      'O processo é conduzido em etapas sequenciais: (i) levantamento preliminar de perigos; (ii) identificação de perigos, com a descrição das fontes ou circunstâncias e do grupo de trabalhadores expostos; (iii) avaliação dos riscos ocupacionais, com a determinação do nível de risco; (iv) classificação dos riscos, para priorização das medidas de prevenção; e (v) elaboração do plano de ação. Este ciclo é contínuo, sendo retroalimentado sempre que houver mudanças nos processos de trabalho, novas evidências de exposição ou resultados de monitoramento que indiquem a necessidade de revisão.',
    ],
  },
  {
    titulo: '5. LEVANTAMENTO PRELIMINAR DE PERIGOS',
    paragrafos: [
      'A etapa de levantamento preliminar de perigos deve seguir os seguintes critérios: ser realizada antes do início do funcionamento do estabelecimento ou de novas instalações; para atividades já existentes; e nas mudanças ou introdução de novos processos ou atividades de trabalho. Quando identificado, ainda nesta etapa, que os riscos não poderão ser evitados, a organização deve implementar o processo completo de identificação de perigos e avaliação de riscos ocupacionais.',
    ],
  },
  {
    titulo: '6. IDENTIFICAÇÃO DE PERIGOS',
    paragrafos: [
      'A etapa de identificação de perigos deve conter: a descrição dos perigos e possíveis lesões ou agravos à saúde; a identificação das fontes ou circunstâncias; e a indicação do grupo de trabalhadores sujeitos aos riscos. A organização também deve mapear os riscos externos previsíveis relacionados ao trabalho que possam afetar a saúde e segurança dos trabalhadores.',
    ],
  },
  {
    titulo: '7. AVALIAÇÃO DE RISCOS OCUPACIONAIS',
    paragrafos: [
      'A partir dos perigos identificados, a organização deve avaliar os riscos ocupacionais relacionados em seus estabelecimentos para a posterior elaboração das medidas de prevenção e controle, indicando para cada risco o nível determinado pela combinação da severidade das possíveis lesões e agravos à saúde com a probabilidade de sua ocorrência.',
      'A gradação da severidade leva em consideração a magnitude da consequência e o número de trabalhadores possivelmente afetados. A gradação da probabilidade considera os requisitos das Normas Regulamentadoras, as medidas de prevenção já implementadas, as exigências da atividade e a comparação do perfil de exposição com valores de referência da NR-9.',
      'A avaliação de riscos deve ser revista a cada 2 (dois) anos, ou antes disso quando: implementadas medidas de prevenção (para avaliação de riscos residuais); houver inovações ou modificações nas tecnologias, ambientes, processos ou organização do trabalho; forem identificadas inadequações ou ineficácias das medidas de prevenção; ocorrerem acidentes ou doenças relacionadas ao trabalho; ou houver mudança nos requisitos legais aplicáveis. Organizações com certificação em sistema de gestão de SST podem ter prazo de até 3 (três) anos.',
    ],
  },
  {
    titulo: '8. METODOLOGIA',
    paragrafos: [
      'Para compor o inventário de riscos foram avaliados os níveis de risco através da matriz de riscos definida (severidade × probabilidade), com base nas tabelas de gradação apresentadas no Anexo II — Matriz de Risco deste documento.',
      'Nas avaliações quantitativas de agentes físicos e químicos realizadas no âmbito deste PGR, foram adotadas, como referência metodológica complementar, as Normas de Higiene Ocupacional da Fundacentro pertinentes a cada agente — como a NHO-01 (ruído), a NHO-06 (calor) e a NHO-08 (poeiras e material particulado) —, sem prejuízo dos critérios e limites de tolerância estabelecidos pela NR-15.',
    ],
  },
  {
    titulo: '9. RISCOS AMBIENTAIS',
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
    titulo: '10. RISCOS PSICOSSOCIAIS',
    paragrafos: [
      'Os riscos psicossociais foram incluídos de forma explícita no GRO/PGR pela NR-1, com alterações dadas pela Portaria MTE nº 1.419/2024 (plenamente exigível desde 26/05/2026). Compreendem fatores relacionados à organização e às relações de trabalho capazes de causar dano à saúde física e mental do trabalhador.',
      'Exemplos de fatores de risco psicossocial: sobrecarga e ritmo de trabalho excessivos, metas inalcançáveis, jornadas extenuantes, assédio moral e sexual, violência no trabalho, conflitos interpessoais, falta de clareza de papéis e responsabilidades, e outras condições organizacionais que gerem estresse ocupacional crônico ou burnout.',
      'Os riscos psicossociais identificados nos ambientes e GHE desta empresa, quando aplicável, estão consolidados no inventário de riscos (categoria "Psicossocial"), com a respectiva avaliação de severidade, probabilidade e nível de risco, e suas medidas de prevenção no plano de ação.',
      'O prazo de 26 de maio de 2026 para a exigibilidade plena das disposições sobre riscos psicossociais foi fixado pela Portaria MTE nº 765, de 15 de maio de 2025, que prorrogou o início da fiscalização de caráter punitivo do capítulo 1.5 da NR-1. O período entre maio de 2025 e maio de 2026 foi definido como fase educativa e orientativa, findo o qual a fiscalização passa a ter caráter plenamente punitivo, sem prorrogações adicionais anunciadas pelo Ministério do Trabalho e Emprego até a presente data.',
    ],
  },
  {
    titulo: '11. FORMAS DE AVALIAÇÃO',
    paragrafos: [
      'A avaliação dos riscos ocupacionais pode ser qualitativa ou quantitativa. A avaliação qualitativa baseia-se na análise técnica da atividade, do ambiente, das fontes geradoras e da percepção dos trabalhadores, sendo suficiente para a maioria dos riscos quando não há dúvida quanto à necessidade e à eficácia das medidas de prevenção. A avaliação quantitativa, por sua vez, é exigida sempre que houver dúvida razoável sobre a exposição dos trabalhadores a agentes físicos e químicos, sendo realizada por meio de medições instrumentais, comparando os resultados obtidos com os limites de tolerância e valores de referência estabelecidos pela NR-15 e pelas Normas de Higiene Ocupacional da Fundacentro.',
      'Em ambos os casos, os resultados obtidos antes e depois da implantação das medidas de controle são comparados por critérios técnicos, permitindo verificar a eficácia das ações adotadas e subsidiar a revisão do nível de risco atribuído no inventário.',
    ],
  },
  {
    titulo: '12. CONTROLE DOS RISCOS',
    paragrafos: [
      '12.1 Medidas de prevenção: serão adotadas medidas necessárias e suficientes para eliminação, minimização ou controle dos riscos ambientais sempre que verificada ao menos uma das situações: exigências das Normas Regulamentadoras e dispositivos legais; determinação pela classificação de riscos ocupacionais; ou evidências de associação, por controle médico, entre lesões/agravos à saúde e os riscos identificados. Quando comprovada a inviabilidade de medidas de proteção coletiva, ou quando insuficientes, devem ser adotadas, na ordem: medidas de caráter administrativo ou de organização do trabalho; e medidas de caráter individual (EPI).',
      '12.2 Implementação e acompanhamento das medidas de prevenção: a empresa, por meio de análise das ações executadas, inspeções nos ambientes de trabalho e monitoramento das condições ambientais e exposições, avaliará a eficácia das medidas existentes e implantadas, estabelecendo novas medidas quando necessário. Quando identificada ineficácia, devem ser realizados ajustes para corrigir as deficiências, com histórico registrado.',
      '12.3 Acompanhamento da saúde ocupacional dos trabalhadores: realizado de forma periódica e contínua, de acordo com os riscos ocupacionais identificados e atendendo às diretrizes da NR-7, integrado às demais medidas de saúde e segurança do trabalho.',
      '12.4 Análise de acidentes e doenças relacionadas ao trabalho: todos os acidentes e doenças relacionadas ao trabalho são analisados e documentados, considerando as fontes causadoras, as atividades desenvolvidas, os materiais utilizados e a organização do ambiente de trabalho, identificando fatores que forneçam evidências para revisar as medidas de prevenção existentes.',
      '12.5 Preparação para emergências: é de responsabilidade da organização elaborar, implementar e manter atualizados os procedimentos de resposta a cenários de emergência, considerando os riscos ocupacionais identificados e as características das atividades desenvolvidas — ver Anexo I (Plano de Emergência).',
    ],
  },
  {
    titulo: '13. EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL DE USO OBRIGATÓRIO',
    paragrafos: [
      'A empresa fornece gratuitamente aos empregados apenas EPI adequado ao risco, em perfeito estado de conservação e funcionamento, sendo estes portadores de Certificado de Aprovação – CA, conforme a NR-6.',
    ],
  },
  {
    titulo: '14. CONCLUSÃO',
    paragrafos: [
      'Este programa tem como fundamento legal a NR-1, e seu objetivo é disciplinar os preceitos a serem observados na organização e no ambiente de trabalho, de forma a tornar compatível o planejamento e desenvolvimento das atividades com a busca permanente da segurança e saúde dos trabalhadores. Este programa estará em constante análise e estudo, visando seu aperfeiçoamento, podendo, portanto, sofrer modificações a qualquer momento.',
    ],
  },
  {
    titulo: '15. REFERÊNCIAS NORMATIVAS COMPLEMENTARES',
    paragrafos: [
      'Além do arcabouço legal obrigatório que fundamenta este PGR (NR-1, NR-7, NR-9, NR-15, NR-16, NR-17 e Portaria MTE nº 1.419/2024), a empresa pode adotar, de forma voluntária e complementar, referências internacionais e nacionais de boas práticas de gestão de saúde e segurança ocupacional, sem que isso substitua ou dispense o cumprimento das exigências legais brasileiras.',
      'A ABNT NBR ISO 45001:2024 (Sistemas de gestão de saúde e segurança ocupacional — Requisitos com orientação para uso), publicada pela Associação Brasileira de Normas Técnicas em 21 de novembro de 2024 e complementada pela Emenda 1:2025 (que incorporou considerações sobre mudanças climáticas aos requisitos de contexto da organização), constitui a norma internacional de referência para sistemas de gestão de SST. Empresas que já estruturaram seu PGR nos moldes da NR-1 possuem base técnica relevante para eventual certificação voluntária nessa norma, cuja adoção não é exigência legal no Brasil, mas complementa e fortalece a gestão de riscos ocupacionais já estabelecida.',
      'A Portaria MTE nº 1.419, de 27 de agosto de 2024, aprovou a nova redação do capítulo "1.5 Gerenciamento de Riscos Ocupacionais" e alterou o Anexo I ("Termos e Definições") da NR-1, incluindo de forma expressa os Fatores de Riscos Psicossociais Relacionados ao Trabalho – FRPRT no inventário de riscos, ao lado dos fatores de risco ergonômico, e determinando a adoção de mecanismos de consulta mais ativa dos trabalhadores no processo de gerenciamento de riscos ocupacionais.',
    ],
  },
  {
    titulo: '16. REFERÊNCIAS BIBLIOGRÁFICAS',
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
