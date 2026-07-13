// Conteúdo estrutural e textos legais padrão do PCMSO (NR-7 — Programa de Controle
// Médico de Saúde Ocupacional). Textos genéricos — os mesmos para qualquer empresa,
// é o texto da norma.

export interface SecaoLegal { titulo: string; paragrafos: string[] }

export const TEXTOS_LEGAIS_PCMSO: SecaoLegal[] = [
  {
    titulo: '1. INTRODUÇÃO',
    paragrafos: [
      'O Programa de Controle Médico de Saúde Ocupacional — PCMSO é elaborado em atendimento à Norma Regulamentadora nº 7 (NR-7), aprovada pela Portaria MTb nº 3.214, de 8 de junho de 1978, e atualmente vigente na redação dada pela Portaria SEPRT nº 6.734, de 9 de março de 2020, com a alteração promovida pela Portaria SEPRT nº 8.873, de 23 de julho de 2021.',
      'A NR-7 tem por objetivo estabelecer diretrizes e requisitos para o desenvolvimento do PCMSO, com vistas à promoção e à preservação da saúde dos trabalhadores frente aos riscos ocupacionais a que estejam expostos, avaliados de forma integrada às demais Normas Regulamentadoras, em especial à NR-1 (Disposições Gerais e Gerenciamento de Riscos Ocupacionais).',
      'O PCMSO é parte integrante da gestão de segurança e saúde no trabalho da organização e deve ser executado por médico coordenador, sem prejuízo do disposto no Programa de Gerenciamento de Riscos (PGR), do qual deve receber o inventário de riscos ocupacionais que fundamenta seu planejamento.',
    ],
  },
  {
    titulo: '2. OBJETIVOS',
    paragrafos: [
      'Este programa tem como objetivo a promoção e a preservação da saúde do conjunto de trabalhadores, mediante a antecipação, o reconhecimento, a avaliação e o consequente controle do aparecimento de agravos à saúde relacionados ao trabalho, inclusive de natureza subclínica, além da constatação da existência de casos de doenças profissionais ou danos irreversíveis à saúde dos trabalhadores.',
      'Constituem objetivos específicos do PCMSO: rastrear e diagnosticar precocemente os agravos à saúde relacionados ao trabalho; subsidiar o empregador quanto à aptidão do trabalhador para o exercício de sua função; e produzir, ao longo do tempo, indicadores de saúde que permitam avaliar a eficácia das medidas de prevenção adotadas no âmbito do PGR.',
    ],
  },
  {
    titulo: '3. RESPONSABILIDADES',
    paragrafos: [
      'Compete ao empregador garantir a elaboração e a efetiva implementação do PCMSO, zelando pela sua eficácia, custear sem ônus para o trabalhador todos os procedimentos relacionados a este programa, e indicar médico coordenador do programa.',
      'Ao médico coordenador compete realizar ou coordenar a realização dos exames médicos ocupacionais previstos nesta norma, e elaborar o relatório analítico anual do programa.',
      'Cabe ao trabalhador comparecer aos exames médicos ocupacionais programados, colaborar e participar ativamente dos procedimentos relacionados ao PCMSO, e informar ao médico responsável quando perceber sintomas em si que possam estar relacionados ao trabalho.',
    ],
  },
  {
    titulo: '4. PLANEJAMENTO DO PCMSO COM BASE NO PGR E NO INVENTÁRIO DE RISCOS',
    paragrafos: [
      'O PCMSO deve ser planejado e implementado com base nos riscos à saúde dos trabalhadores identificados nas avaliações previstas na NR-1 e nas demais Normas Regulamentadoras aplicáveis, de modo que os exames médicos ocupacionais, sua periodicidade e os exames complementares exigidos guardem correspondência direta com o inventário de riscos ocupacionais constante do PGR da organização.',
      'Sempre que houver atualização do inventário de riscos ocupacionais do PGR, o PCMSO deve ser revisado para refletir essa atualização, mantendo a coerência entre os riscos gerenciados pela organização e o monitoramento biológico e clínico realizado sobre os trabalhadores expostos.',
    ],
  },
  {
    titulo: '5. EXAMES MÉDICOS OCUPACIONAIS',
    paragrafos: [
      'A NR-7 exige a realização dos seguintes exames médicos ocupacionais: admissional, realizado antes que o trabalhador assuma suas atividades; periódico, com periodicidade determinada em função dos riscos ocupacionais e das características individuais evidenciadas em exames anteriores; de retorno ao trabalho, obrigatório para o trabalhador que se afastar por período igual ou superior a 30 (trinta) dias, a ser realizado antes que reassuma suas funções; de mudança de função ou de riscos ocupacionais, quando a nova atividade implicar exposição a risco diferente; e demissional, realizado no encerramento do contrato de trabalho.',
      'A periodicidade dos exames deve ser estabelecida pelo médico coordenador do PCMSO em função dos riscos identificados no inventário de riscos ocupacionais, das características individuais do trabalhador e da natureza da exposição.',
    ],
  },
  {
    titulo: '6. ATESTADO DE SAÚDE OCUPACIONAL — ASO',
    paragrafos: [
      'Para cada exame médico ocupacional realizado, o médico examinador emitirá o Atestado de Saúde Ocupacional — ASO, em duas vias, sendo a primeira via arquivada no local de trabalho, inclusive por meio digital, e a segunda via obrigatoriamente entregue ao trabalhador, mediante recibo na primeira via.',
      'O ASO deve conter, no mínimo: nome completo do trabalhador, número de registro de identidade e função; riscos ocupacionais especificados no PGR ou a inexistência de riscos identificados; indicação e data de realização dos exames médicos e complementares a que foi submetido o trabalhador; definição de apto ou inapto para a função específica; e nome, número de registro no Conselho Regional de Medicina e assinatura do médico responsável pela realização do exame.',
    ],
  },
  {
    titulo: '7. ENCAMINHAMENTOS E AFASTAMENTOS',
    paragrafos: [
      'Sempre que constatada, durante os exames médicos ocupacionais, alteração que revele qualquer indício de doença profissional ou danos irreversíveis à saúde dos trabalhadores, o médico coordenador ou encarregado emitirá relatório circunstanciado, com o encaminhamento do trabalhador ao órgão competente da Previdência Social, quando aplicável, e a comunicação ao empregador para adoção das medidas cabíveis.',
    ],
  },
  {
    titulo: '8. ACOMPANHAMENTO DA SAÚDE MENTAL E DOS RISCOS PSICOSSOCIAIS RELACIONADOS AO TRABALHO',
    paragrafos: [
      'A Portaria MTE nº 1.419, de 27 de agosto de 2024, alterou a NR-1, incluindo expressamente os fatores de risco psicossociais relacionados ao trabalho no gerenciamento de riscos ocupacionais (GRO/PGR), nos termos da NR-17.',
      'Quando o inventário de riscos ocupacionais do PGR identificar exposição a fatores de risco psicossociais — sobrecarga de trabalho, jornadas excessivas, violência ou assédio, conflitos interpessoais, insegurança quanto à manutenção do emprego —, o PCMSO deve incorporar esse dado ao planejamento dos exames médicos ocupacionais, cabendo ao médico coordenador avaliar a pertinência de acompanhamento clínico voltado à saúde mental do trabalhador exposto.',
    ],
  },
  {
    titulo: '9. RELATÓRIO ANALÍTICO ANUAL',
    paragrafos: [
      'O médico coordenador do PCMSO deve elaborar, ao final de cada período de 12 (doze) meses, o Relatório Analítico, contendo dados coletivos, sem identificação nominal dos trabalhadores, que permitam avaliar o desenvolvimento do PCMSO ao longo do período, correlacionando os agravos à saúde eventualmente identificados com a exposição a riscos ocupacionais registrados no PGR.',
      'As organizações classificadas nos graus de risco 1 e 2 com até 25 (vinte e cinco) empregados, e as organizações classificadas nos graus de risco 3 e 4 com até 10 (dez) empregados, podem elaborar o Relatório Analítico de forma simplificada, contendo apenas o número de exames clínicos realizados e o número e os tipos de exames complementares realizados, nos termos do subitem 7.6.2 da NR-7.',
    ],
  },
  {
    titulo: '10. SIGILO MÉDICO E GUARDA DE PRONTUÁRIOS',
    paragrafos: [
      'Os dados dos exames clínicos e complementares devem ser registrados em prontuário clínico individual, sob a responsabilidade do médico coordenador, resguardado o sigilo médico previsto no Código de Ética Médica.',
      'Os documentos que compõem o PCMSO devem ser mantidos por prazo mínimo determinado pela NR-7, admitida a guarda em meio eletrônico, com garantia de autenticidade, integridade e disponibilidade dos registros pelo período legal exigido.', // [VERIFICAR: prazo exato — fontes convergem para 20 anos após desligamento, mas dispositivo específico não confirmado]
    ],
  },
  {
    titulo: '11. INTEGRAÇÃO COM O ESOCIAL — EVENTO S-2220',
    paragrafos: [
      'As informações relativas aos exames médicos ocupacionais e à emissão de Atestados de Saúde Ocupacional devem ser transmitidas ao eSocial por meio do evento S-2220 (Monitoramento da Saúde do Trabalhador), conforme leiaute e prazos definidos no Manual de Orientação do eSocial vigente.',
    ],
  },
  {
    titulo: '12. CONCLUSÃO',
    paragrafos: [
      'Este programa tem como fundamento legal a NR-7 e visa subsidiar o acompanhamento da saúde dos trabalhadores em face dos riscos ocupacionais identificados no PGR da organização, devendo ser revisado sempre que houver alteração relevante no inventário de riscos ocupacionais, na função exercida pelos trabalhadores ou na legislação aplicável.',
    ],
  },
]
