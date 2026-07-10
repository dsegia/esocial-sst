// Conteúdo estrutural e textos legais padrão da AET (NR-17 — Ergonomia).
// Textos genéricos — os mesmos para qualquer empresa, é o texto da norma.

export interface SecaoLegal { titulo: string; paragrafos: string[] }

export const TEXTOS_LEGAIS_AET: SecaoLegal[] = [
  {
    titulo: '1. INTRODUÇÃO',
    paragrafos: [
      'A Análise Ergonômica do Trabalho — AET é elaborada em atendimento à Norma Regulamentadora nº 17 (NR-17), que estabelece parâmetros que permitam a adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores, de modo a proporcionar conforto, segurança e desempenho eficiente no trabalho.',
      '"17.1.2 Esta Norma Regulamentadora estabelece parâmetros que permitam a identificação, avaliação e intervenção nas situações de trabalho que envolvam riscos ocupacionais, provenientes de aspectos físicos, cognitivos e organizacionais do trabalho, que possam impactar a saúde e segurança do trabalhador." (NR-17)',
      'Esta análise deve ser considerada de forma integrada ao Programa de Gerenciamento de Riscos (PGR) previsto na NR-1, sendo os riscos ergonômicos aqui identificados incorporados ao inventário de riscos ocupacionais da organização.',
    ],
  },
  {
    titulo: '2. OBJETIVOS',
    paragrafos: [
      'Esta análise tem como objetivo identificar os fatores de risco ergonômico presentes nos postos de trabalho avaliados e propor recomendações de adequação, contemplando os aspectos físicos, cognitivos e organizacionais do trabalho, conforme estabelecido pela NR-17.',
    ],
  },
  {
    titulo: '3. LEVANTAMENTO, TRANSPORTE E DESCARGA INDIVIDUAL DE MATERIAIS',
    paragrafos: [
      'Nas atividades que envolvam levantamento, transporte e descarga individual de materiais, devem ser adotadas medidas para reduzir os riscos à saúde do trabalhador, tais como treinamento e orientação quanto a posturas adequadas, utilização de meios técnicos apropriados (equipamentos auxiliares de transporte) e revezamento de trabalhadores, de forma a evitar sobrecarga muscular ou esquelética.',
    ],
  },
  {
    titulo: '4. MOBILIÁRIO DOS POSTOS DE TRABALHO',
    paragrafos: [
      'Sempre que o trabalho puder ser executado na posição sentada, o posto de trabalho deve ser planejado ou adaptado de modo que atenda aos requisitos de conforto do trabalhador, considerando o mobiliário, os espaços e as dimensões que possibilitem postura e movimentação adequadas.',
    ],
  },
  {
    titulo: '5. EQUIPAMENTOS DOS POSTOS DE TRABALHO',
    paragrafos: [
      'Todos os equipamentos que compõem o posto de trabalho devem estar adequados às características psicofisiológicas dos trabalhadores e à natureza da atividade a ser executada, respeitando os princípios da ergonomia.',
    ],
  },
  {
    titulo: '6. CONDIÇÕES AMBIENTAIS DE TRABALHO',
    paragrafos: [
      'As condições ambientais de trabalho devem estar adequadas às características psicofisiológicas dos trabalhadores e à natureza da atividade a ser executada, com atenção a fatores como iluminação, conforto acústico, conforto térmico e condições de umidade do ar.',
    ],
  },
  {
    titulo: '7. ORGANIZAÇÃO DO TRABALHO',
    paragrafos: [
      'A organização do trabalho deve ser adequada às características psicofisiológicas dos trabalhadores e à natureza do trabalho a ser executado, considerando, entre outros aspectos: as normas de produção, o modo operatório, a exigência de tempo, o ritmo de trabalho e o conteúdo das tarefas.',
      'Deve ser avaliada a existência de fatores como controle rígido de produtividade, metas de produção, jornadas de trabalho prolongadas, trabalho em turnos e trabalho noturno, monotonia e repetitividade, que podem gerar sobrecarga física, cognitiva e psíquica ao trabalhador.',
      'Nas atividades que exijam sobrecarga muscular estática ou dinâmica do pescoço, ombros, dorso e membros superiores e inferiores, devem ser previstas pausas para descanso, cuja necessidade, duração e frequência devem ser determinadas em função da natureza da atividade.',
    ],
  },
  {
    titulo: '8. AVALIAÇÃO ERGONÔMICA PRELIMINAR E ANÁLISE ERGONÔMICA DO TRABALHO',
    paragrafos: [
      'A Avaliação Ergonômica Preliminar (AEP) é etapa inicial de reconhecimento dos fatores de risco ergonômico, utilizada para identificar a necessidade de aprofundamento por meio da Análise Ergonômica do Trabalho (AET), quando os riscos identificados assim exigirem.',
      'A Análise Ergonômica do Trabalho, quando elaborada, deve contemplar, no mínimo, a descrição das atividades e dos postos de trabalho analisados e, quando aplicável, indicação dos instrumentos e das técnicas utilizadas na avaliação.',
    ],
  },
  {
    titulo: '9. INTEGRAÇÃO COM O GERENCIAMENTO DE RISCOS OCUPACIONAIS (GRO/NR-1)',
    paragrafos: [
      'Os riscos ergonômicos identificados nesta AET devem ser incorporados ao inventário de riscos ocupacionais do Programa de Gerenciamento de Riscos (PGR), elaborado nos termos da NR-1, garantindo o tratamento integrado entre os fatores de risco ergonômico e os demais riscos ocupacionais da organização.',
      'Quando aplicável à atividade avaliada, devem ser observadas as disposições específicas dos Anexos da NR-17, em especial o Anexo I (trabalho dos operadores de checkout) e o Anexo II (trabalho em teleatendimento/telemarketing).',
    ],
  },
  {
    titulo: '10. CONCLUSÃO',
    paragrafos: [
      'Esta análise tem como fundamento legal a NR-17 e visa subsidiar a adoção de medidas de adequação ergonômica dos postos de trabalho avaliados, devendo ser revisada sempre que houver mudança nos processos de trabalho, no layout, no mobiliário ou nos equipamentos que possa alterar as condições ergonômicas identificadas.',
    ],
  },
]
