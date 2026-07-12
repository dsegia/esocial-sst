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
      'Comparando os resultados obtidos em avaliações quantitativas e/ou qualitativas, antes e depois da implantação das medidas de controle, por critérios técnicos.',
    ],
  },
  {
    titulo: '12. CONTROLE DOS RISCOS',
    paragrafos: [
      '11.1 Medidas de prevenção: serão adotadas medidas necessárias e suficientes para eliminação, minimização ou controle dos riscos ambientais sempre que verificada ao menos uma das situações: exigências das Normas Regulamentadoras e dispositivos legais; determinação pela classificação de riscos ocupacionais; ou evidências de associação, por controle médico, entre lesões/agravos à saúde e os riscos identificados. Quando comprovada a inviabilidade de medidas de proteção coletiva, ou quando insuficientes, devem ser adotadas, na ordem: medidas de caráter administrativo ou de organização do trabalho; e medidas de caráter individual (EPI).',
      '11.2 Implementação e acompanhamento das medidas de prevenção: a empresa, por meio de análise das ações executadas, inspeções nos ambientes de trabalho e monitoramento das condições ambientais e exposições, avaliará a eficácia das medidas existentes e implantadas, estabelecendo novas medidas quando necessário. Quando identificada ineficácia, devem ser realizados ajustes para corrigir as deficiências, com histórico registrado.',
      '11.3 Acompanhamento da saúde ocupacional dos trabalhadores: realizado de forma periódica e contínua, de acordo com os riscos ocupacionais identificados e atendendo às diretrizes da NR-7, integrado às demais medidas de saúde e segurança do trabalho.',
      '11.4 Análise de acidentes e doenças relacionadas ao trabalho: todos os acidentes e doenças relacionadas ao trabalho são analisados e documentados, considerando as fontes causadoras, as atividades desenvolvidas, os materiais utilizados e a organização do ambiente de trabalho, identificando fatores que forneçam evidências para revisar as medidas de prevenção existentes.',
      '11.5 Preparação para emergências: é de responsabilidade da organização elaborar, implementar e manter atualizados os procedimentos de resposta a cenários de emergência, considerando os riscos ocupacionais identificados e as características das atividades desenvolvidas — ver Anexo I (Plano de Emergência).',
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
