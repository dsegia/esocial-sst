// Conteúdo estrutural e textos legais padrão do LTCAT (Lei 8.213/91 art. 58,
// Decreto 3.048/99 art. 68, NR-15, NR-9, IN INSS/PRES 128/2022).
// Textos genéricos — os mesmos para qualquer empresa, é o texto da norma.

export interface SecaoLegal { titulo: string; paragrafos: string[] }

export const TEXTOS_LEGAIS_LTCAT: SecaoLegal[] = [
  {
    titulo: '1. INTRODUÇÃO',
    paragrafos: [
      'O Laudo Técnico das Condições Ambientais do Trabalho – LTCAT é o documento técnico que descreve as condições ambientais de trabalho existentes no estabelecimento, com a finalidade de identificar e caracterizar a exposição do trabalhador a agentes nocivos à saúde, servindo de base para a emissão do Perfil Profissiográfico Previdenciário – PPP e para fins de reconhecimento do direito à aposentadoria especial perante o Instituto Nacional do Seguro Social – INSS.',
      'A obrigatoriedade do LTCAT decorre do art. 58 da Lei nº 8.213, de 24 de julho de 1991 (Lei de Benefícios da Previdência Social), regulamentado pelo art. 68 do Decreto nº 3.048, de 6 de maio de 1999 (Regulamento da Previdência Social), que estabelece que a comprovação da efetiva exposição do segurado aos agentes nocivos será feita mediante formulário emitido pela empresa ou seu preposto, com base em laudo técnico de condições ambientais do trabalho expedido por médico do trabalho ou engenheiro de segurança do trabalho.',
      'O LTCAT não se confunde com o Programa de Gerenciamento de Riscos – PGR, previsto na NR-1. Enquanto o PGR tem natureza preventiva e trabalhista, voltado à eliminação e ao controle dos riscos ocupacionais, o LTCAT tem finalidade eminentemente previdenciária: comprovar, perante o INSS, a existência e a intensidade da exposição a agentes nocivos para fins de conversão de tempo especial e concessão de aposentadoria especial, ainda que os dois documentos compartilhem, em grande parte, a mesma base técnica de identificação de perigos e avaliação de agentes ambientais.',
    ],
  },
  {
    titulo: '2. OBJETIVOS',
    paragrafos: [
      'Este laudo tem como objetivo identificar, descrever e avaliar os agentes nocivos físicos, químicos e biológicos presentes nos ambientes e postos de trabalho da empresa, caracterizando a natureza, a intensidade/concentração e o tempo de exposição dos trabalhadores, de modo a subsidiar a emissão do PPP e a correta informação do evento S-2240 do eSocial.',
      'Constituem objetivos específicos deste LTCAT: identificar os agentes nocivos previstos na NR-15 (Atividades e Operações Insalubres) e no Anexo IV do Decreto nº 3.048/99; caracterizar a exposição como habitual e permanente, intermitente ou eventual; indicar a eficácia das medidas de proteção coletiva e individual adotadas; e fundamentar tecnicamente o enquadramento, ou não, das atividades e dos trabalhadores para fins de aposentadoria especial.',
    ],
  },
  {
    titulo: '3. RESPONSABILIDADE TÉCNICA',
    paragrafos: [
      'O LTCAT deve ser expedido por médico do trabalho ou por engenheiro de segurança do trabalho, nos termos do art. 58 da Lei nº 8.213/1991 e do art. 68 do Decreto nº 3.048/99. Trata-se de exigência legal de habilitação profissional específica: o técnico de segurança do trabalho, ainda que possua registro no Conselho Regional de Engenharia e Agronomia – CREA, não está legalmente habilitado a assinar o laudo como responsável técnico.',
      'Quando o LTCAT é elaborado por engenheiro de segurança do trabalho, é exigível a Anotação de Responsabilidade Técnica – ART junto ao CREA, por se tratar de serviço de engenharia. Quando elaborado por médico do trabalho, a responsabilidade técnica é regida pelo Conselho Regional de Medicina – CRM, não se exigindo ART.',
    ],
  },
  {
    titulo: '4. BASE LEGAL E NORMATIVA',
    paragrafos: [
      'A exigência de laudo técnico para fins de caracterização de condições especiais de trabalho remonta à Lei nº 5.431, de 3 de maio de 1968, que introduziu o § 5º no art. 209 da CLT, e foi posteriormente disciplinada pelo art. 195 da CLT, na redação dada pela Lei nº 6.514, de 22 de dezembro de 1977, segundo o qual a caracterização e a classificação da insalubridade e da periculosidade far-se-ão através de perícia a cargo de médico do trabalho ou engenheiro do trabalho, registrados no Ministério do Trabalho.',
      'Este laudo foi elaborado com fundamento nas seguintes normas: Lei nº 8.213, de 24 de julho de 1991, art. 58; Decreto nº 3.048, de 6 de maio de 1999 (Regulamento da Previdência Social), arts. 57 a 68, com a redação dada ao art. 68 e ao respectivo Anexo IV pelo Decreto nº 10.410, de 30 de junho de 2020; Norma Regulamentadora nº 15 (NR-15) — Atividades e Operações Insalubres, e seus Anexos; Norma Regulamentadora nº 9 (NR-9) — Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos, em vigor desde 3 de janeiro de 2022, integrada à lógica do Gerenciamento de Riscos Ocupacionais – GRO da NR-1; e a Instrução Normativa PRES/INSS nº 128, de 28 de março de 2022, que disciplina os procedimentos relativos à aposentadoria especial, ao LTCAT e ao PPP, com as alterações promovidas pelas Instruções Normativas nº 141, nº 155/2023 e nº 170/2024.',
      'Subsidiariamente, foram observadas as Normas de Higiene Ocupacional – NHO da Fundacentro, adotadas como metodologia técnica de referência para a avaliação quantitativa dos agentes ambientais, e a NR-15 conforme atualizada pela Portaria MTE nº 2.021, de 3 de dezembro de 2025, que inseriu o item 15.4.1.3, exigindo que o laudo caracterizador da insalubridade seja disponibilizado aos trabalhadores, ao sindicato da categoria e à fiscalização do trabalho.',
    ],
  },
  {
    titulo: '5. METODOLOGIA DE AVALIAÇÃO',
    paragrafos: [
      'A avaliação dos agentes ambientais foi realizada por meio de avaliação qualitativa e, quando aplicável, avaliação quantitativa. A avaliação qualitativa consiste na descrição técnica das circunstâncias de exposição ocupacional a um agente ou associação de agentes nocivos presentes no ambiente de trabalho, das fontes geradoras, dos meios de contato ou absorção e da frequência e duração do contato. A avaliação quantitativa consiste na mensuração da intensidade ou concentração do agente nocivo, por meio de instrumentos calibrados, comparando-se o resultado aos limites de tolerância estabelecidos na NR-15.',
      'Para a avaliação quantitativa, foram adotadas, no que couber, as Normas de Higiene Ocupacional da Fundacentro como referência metodológica: NHO-01 (Avaliação da Exposição Ocupacional ao Ruído), NHO-06 (Avaliação da Exposição Ocupacional ao Calor), NHO-08 (Coleta de Material Particulado Sólido Suspenso no Ar, aplicável a poeiras minerais, inclusive sílica), NHO-03 (análise gravimétrica de aerodispersóides sólidos), NHO-04 (coleta e análise de fibras, aplicável a asbesto/amianto), NHO-05 (Avaliação da Exposição Ocupacional aos Raios X), NHO-09 e NHO-10 (vibração de corpo inteiro e de mãos e braços) e NHO-11 (Avaliação dos Níveis de Iluminamento em Ambientes Internos de Trabalho), conforme o agente identificado.',
      'A calibração dos equipamentos de medição observou a rastreabilidade metrológica prevista na ABNT NBR ISO/IEC 17025 (Requisitos gerais para a competência de laboratórios de ensaio e calibração), aplicável aos laboratórios e prestadores de serviço de medição de agentes ambientais eventualmente contratados, garantindo a validade técnica dos resultados apresentados neste laudo.',
    ],
  },
  {
    titulo: '6. AGENTES NOCIVOS AVALIADOS',
    paragrafos: [
      'Foram avaliados os agentes nocivos previstos na NR-15 e no Anexo IV do Decreto nº 3.048/99, classificados em: agentes físicos — ruído contínuo ou intermitente e ruído de impacto, calor, radiações ionizantes, condições hiperbáricas, vibração, frio e umidade; agentes químicos — poeiras, fumos, névoas, neblinas, gases ou vapores capazes de penetrar no organismo pela via respiratória, cutânea ou por ingestão, incluindo benzeno; e agentes biológicos — microrganismos como vírus, bactérias, fungos e parasitas, em atividades ou operações em contato permanente com pacientes, material infectocontagiante ou animais.',
      'Para cada agente identificado, este laudo indica a fonte geradora, a trajetória e os meios de propagação no ambiente de trabalho, a intensidade ou concentração (quando mensurável), o tempo de exposição e a eficácia das medidas de proteção coletiva e individual adotadas, conforme detalhado na tabela de Grupos Homogêneos de Exposição – GHE anexa a este documento.',
    ],
  },
  {
    titulo: '7. CARACTERIZAÇÃO DA EXPOSIÇÃO OCUPACIONAL',
    paragrafos: [
      'Para fins de reconhecimento de tempo de trabalho especial, a exposição a agentes nocivos deve ser caracterizada como habitual e permanente, não ocasional nem intermitente, nos termos do art. 65 do Decreto nº 3.048/99. Considera-se permanente a exposição que é indissociável da produção do bem ou da prestação do serviço — não se exigindo, porém, que o contato com o agente nocivo se dê durante toda a jornada de trabalho.',
      'A exposição classificada como intermitente ou eventual não é, em regra, apta a fundamentar o reconhecimento de atividade especial para fins previdenciários, ainda que deva ser registrada no inventário de riscos para fins de gestão de segurança e saúde no trabalho, nos termos da NR-1 e da NR-9.',
    ],
  },
  {
    titulo: '8. ENQUADRAMENTO PARA FINS DE APOSENTADORIA ESPECIAL',
    paragrafos: [
      'A relação dos agentes nocivos considerados para fins de concessão de aposentadoria especial é a constante do Anexo IV do Decreto nº 3.048/99, na redação dada pelo Decreto nº 10.410/2020. Os prazos de carência especial variam, conforme o agente e a atividade, entre 15, 20 e 25 anos de exposição habitual e permanente.',
      'A comprovação da efetiva exposição do segurado a agentes nocivos, para fins de concessão do benefício, é feita mediante o Perfil Profissiográfico Previdenciário – PPP, elaborado pela empresa com base neste LTCAT, e transmitido ao INSS por meio do evento S-2240 do eSocial, conforme disciplinado pela Instrução Normativa PRES/INSS nº 128/2022 e alterações.',
    ],
  },
  {
    titulo: '9. EQUIPAMENTOS DE PROTEÇÃO E A DESCARACTERIZAÇÃO DA EXPOSIÇÃO A AGENTES NOCIVOS',
    paragrafos: [
      'Como regra geral, a adoção de Equipamento de Proteção Individual – EPI comprovadamente eficaz, que efetivamente neutralize a nocividade do agente ao qual o trabalhador está exposto, pode descaracterizar a exposição para fins de aposentadoria especial, nos termos da tese fixada pelo Supremo Tribunal Federal no julgamento do Tema 555 de Repercussão Geral (RE nº 664.335/SC): o direito à aposentadoria especial pressupõe a efetiva exposição do trabalhador a agente nocivo à sua saúde, de modo que, se o EPI for realmente capaz de neutralizar a nocividade, não haverá respaldo constitucional à aposentadoria especial.', // [VERIFICAR redação literal exata da tese no acórdão]
      'Há, contudo, uma exceção jurisprudencial relevante quanto ao agente físico ruído: segundo a segunda tese fixada no mesmo Tema 555, a declaração do empregador, no âmbito do PPP, de que o EPI é eficaz não descaracteriza o tempo de serviço especial para aposentadoria quando o agente é o ruído acima dos limites de tolerância. O fundamento é a ausência de comprovação científica e jurídica de EPI capaz de neutralizar integralmente os efeitos nocivos do ruído sobre a audição, ainda que reduza a intensidade percebida.', // [VERIFICAR redação literal exata]
      'Este LTCAT, ao avaliar cada agente nocivo, informa expressamente se o uso do EPI fornecido é ou não considerado eficaz para fins de descaracterização da exposição, observando a exceção legal e jurisprudencial aplicável ao agente ruído, de modo a subsidiar corretamente os campos correspondentes do PPP.',
    ],
  },
  {
    titulo: '10. VALIDADE, REVISÃO E DISPONIBILIZAÇÃO DO LAUDO',
    paragrafos: [
      'A legislação previdenciária não fixa prazo de validade determinado para o LTCAT. Contudo, a empresa tem o dever legal de mantê-lo atualizado, devendo revisá-lo sempre que houver mudança nos processos, ambientes, tecnologias ou organização do trabalho capaz de alterar a natureza, a intensidade ou a caracterização da exposição a agentes nocivos.',
      'Recomenda-se, como boa prática técnica, a revisão periódica deste laudo em prazo não superior a 2 (dois) anos, em alinhamento com o ciclo de revisão do inventário de riscos previsto na NR-1 para o PGR.',
      'Nos termos do item 15.4.1.3 da NR-15, incluído pela Portaria MTE nº 2.021/2025, o laudo caracterizador da insalubridade deve permanecer disponível aos trabalhadores interessados, ao sindicato representativo da categoria profissional e à fiscalização do trabalho, sempre que solicitado.',
    ],
  },
  {
    titulo: '11. CONCLUSÃO',
    paragrafos: [
      'Este Laudo Técnico das Condições Ambientais do Trabalho foi elaborado com fundamento no art. 58 da Lei nº 8.213/1991, no art. 68 do Decreto nº 3.048/99 e na NR-15, com o objetivo de identificar, descrever e avaliar tecnicamente os agentes nocivos presentes nos ambientes de trabalho da empresa, subsidiando a correta emissão do PPP e a informação do evento S-2240 do eSocial.',
      'As conclusões aqui apresentadas refletem as condições de trabalho verificadas na data das avaliações realizadas, devendo este laudo ser revisado sempre que ocorrerem alterações relevantes nos processos, ambientes ou medidas de proteção.',
    ],
  },
  {
    titulo: '12. REFERÊNCIAS BIBLIOGRÁFICAS',
    paragrafos: [
      'BRASIL. Consolidação das Leis do Trabalho, arts. 189 a 197. Disponível em: planalto.gov.br/ccivil_03/leis/l6514.htm.',
      'BRASIL. Decreto nº 3.048, de 6 de maio de 1999 — Regulamento da Previdência Social. Disponível em: planalto.gov.br/ccivil_03/decreto/d3048.htm.',
      'BRASIL. Lei nº 8.213, de 24 de julho de 1991 — Lei de Benefícios da Previdência Social. Disponível em: planalto.gov.br.',
      'INSTITUTO NACIONAL DO SEGURO SOCIAL. Instrução Normativa PRES/INSS nº 128, de 28 de março de 2022, e alterações posteriores.',
      'MINISTÉRIO DO TRABALHO E EMPREGO. Norma Regulamentadora nº 15 (NR-15) — Atividades e Operações Insalubres, e seus Anexos.',
      'FUNDACENTRO. Normas de Higiene Ocupacional — NHO. Disponível em: gov.br/fundacentro/pt-br/centrais-de-conteudo/biblioteca/nhos.',
    ],
  },
]
