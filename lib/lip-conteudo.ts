// Conteúdo estrutural e textos legais padrão do LIP (Laudo de Insalubridade e
// Periculosidade) — CLT arts. 189 a 197, NR-15 e NR-16. Textos genéricos — os
// mesmos para qualquer empresa, é o texto da norma.

export interface SecaoLegal { titulo: string; paragrafos: string[] }

export const TEXTOS_LEGAIS_LIP: SecaoLegal[] = [
  {
    titulo: '1. INTRODUÇÃO',
    paragrafos: [
      'O presente Laudo de Insalubridade e Periculosidade – LIP tem por finalidade identificar, avaliar e caracterizar tecnicamente as condições de trabalho que sujeitem os empregados a agentes nocivos à saúde acima dos limites de tolerância (insalubridade) ou a risco acentuado em razão de exposição permanente a atividades ou operações legalmente consideradas perigosas (periculosidade), nos termos dos artigos 189 a 197 da Consolidação das Leis do Trabalho – CLT e das Normas Regulamentadoras NR-15 (Atividades e Operações Insalubres) e NR-16 (Atividades e Operações Perigosas).',
      '"Art. 189. Serão consideradas atividades ou operações insalubres aquelas que, por sua natureza, condições ou métodos de trabalho, exponham os empregados a agentes nocivos à saúde, acima dos limites de tolerância fixados em razão da natureza e da intensidade do agente e do tempo de exposição aos seus efeitos." (CLT, art. 189)',
      '"Art. 193. São consideradas atividades ou operações perigosas, na forma da regulamentação aprovada pelo Ministério do Trabalho, aquelas que, por sua natureza ou métodos de trabalho, impliquem risco acentuado em virtude de exposição permanente do trabalhador a: I - inflamáveis, explosivos ou energia elétrica; II - roubos ou outras espécies de violência física nas atividades profissionais de segurança pessoal ou patrimonial." (CLT, art. 193, caput)',
      'Este laudo consolida, para cada função avaliada, a caracterização técnica da existência ou não de insalubridade e/ou periculosidade, o respectivo grau (quando aplicável), a fundamentação normativa e os agentes ou hipóteses legais que embasam a conclusão.',
    ],
  },
  {
    titulo: '2. OBJETIVOS',
    paragrafos: [
      'Constituem objetivos deste laudo: identificar as funções que se enquadram nas hipóteses legais de insalubridade (NR-15) e/ou periculosidade (NR-16); avaliar, por critérios qualitativos e, quando aplicável, quantitativos, a exposição dos trabalhadores; fundamentar tecnicamente o direito ou não ao adicional correspondente; e fornecer subsídio documental para fins trabalhistas, previdenciários (PPP, LTCAT) e para o cumprimento das obrigações do empregador perante o eSocial.',
    ],
  },
  {
    titulo: '3. RESPONSABILIDADE TÉCNICA',
    paragrafos: [
      '"Art. 195, caput. A caracterização e a classificação da insalubridade e da periculosidade [...] far-se-ão através de perícia a cargo de Médico do Trabalho ou Engenheiro do Trabalho, registrados no Ministério do Trabalho." (CLT, art. 195, caput)',
      '"Art. 195, § 2º. Havendo divergência entre o empregador e o empregado quanto à existência de insalubridade ou periculosidade, ou quanto ao grau de intensidade do agente nocivo, será promovida perícia a cargo de médico do trabalho ou engenheiro de segurança do trabalho, registrados no Ministério do Trabalho, e, se for o caso, com a assistência de médico de confiança da parte interessada." (CLT, art. 195, §2º)',
      'O responsável técnico por este laudo declara ter realizado inspeção nos locais e postos de trabalho avaliados, sendo o presente documento firmado com Anotação de Responsabilidade Técnica – ART/RRT quando aplicável.',
    ],
  },
  {
    titulo: '4. METODOLOGIA DE AVALIAÇÃO',
    paragrafos: [
      'A avaliação de insalubridade pode ser qualitativa ou quantitativa, conforme a natureza do agente. Nas avaliações quantitativas, são adotadas, como referência metodológica complementar à NR-15, as Normas de Higiene Ocupacional – NHO da Fundacentro (ex.: NHO-01 para ruído, NHO-06 para calor), com instrumentos calibrados e rastreáveis.',
      'A avaliação de periculosidade é predominantemente qualitativa: verifica-se se a atividade se enquadra nas hipóteses objetivamente descritas nos Anexos da NR-16, sendo irrelevante, para esse fim, a medição de intensidade do risco.',
    ],
  },
  {
    titulo: '5. INSALUBRIDADE — CONCEITO E GRAUS (NR-15)',
    paragrafos: [
      '"Art. 192. O exercício de trabalho em condições insalubres, acima dos limites de tolerância estabelecidos pelo Ministério do Trabalho, assegura a percepção de adicional respectivamente de 40% (quarenta por cento), 20% (vinte por cento) e 10% (dez por cento) do salário mínimo da região, segundo se classifiquem nos graus máximo, médio e mínimo." (CLT, art. 192)',
      'A NR-15 estrutura-se em Anexos, cada um correspondente a um agente ou grupo de agentes nocivos, com seus respectivos critérios de caracterização, limites de tolerância (quando houver) e grau de insalubridade correspondente — entre eles, ruído contínuo/intermitente, ruído de impacto, calor (IBUTG), agentes químicos, poeiras minerais e agentes biológicos.',
      'Conforme a Súmula nº 448 do TST, "não basta a constatação da insalubridade por meio de laudo pericial para que o empregado tenha direito ao respectivo adicional, sendo necessária a classificação da atividade insalubre na relação oficial elaborada pelo Ministério do Trabalho". O simples reconhecimento técnico de exposição a um agente nocivo não gera, por si só, direito ao adicional, se a atividade não estiver expressamente enquadrada nos Anexos da NR-15.',
    ],
  },
  {
    titulo: '6. PERICULOSIDADE — CONCEITO E HIPÓTESES LEGAIS (NR-16)',
    paragrafos: [
      '"Art. 193, § 1º. O trabalho em condições de periculosidade assegura ao empregado salário adicional de 30% (trinta por cento) sobre o salário sem os acréscimos resultantes de gratificações, prêmios ou participação nos lucros da empresa." (CLT, art. 193, §1º)',
      'A NR-16 disciplina as hipóteses legais de periculosidade em Anexos específicos: explosivos, inflamáveis, radiações ionizantes, energia elétrica, segurança pessoal/patrimonial (roubos e violência física), e — desde a Portaria MTE nº 2.021, de 3 de dezembro de 2025 — o Anexo 5, sobre atividades de deslocamento habitual em motocicleta em vias abertas à circulação pública, excluído o trajeto residência-trabalho e o uso meramente eventual.',
      'Nos termos da Súmula nº 361 do TST, o trabalho exercido em condições perigosas, ainda que de forma intermitente, dá direito ao empregado a receber o adicional de periculosidade de forma integral, sem proporcionalidade.',
    ],
  },
  {
    titulo: '7. EFEITO DO EPI SOBRE OS ADICIONAIS',
    paragrafos: [
      '"Art. 191. A eliminação ou a neutralização da insalubridade ocorrerá: I - com a adoção de medidas que conservem o ambiente de trabalho dentro dos limites de tolerância; II - com a utilização de equipamentos de proteção individual ao trabalhador, que diminua a intensidade do agente agressivo a limites de tolerância." (CLT, art. 191)',
      'Para a insalubridade, o fornecimento e o uso efetivo, habitual e eficaz de EPI adequado ao risco pode descaracterizar o direito ao adicional. Nesse sentido, a Súmula nº 289 do TST dispõe que "o simples fornecimento do aparelho de proteção pelo empregador não o exime do pagamento do adicional de insalubridade; cabe-lhe tomar as medidas que conduzam à diminuição ou eliminação da nocividade, entre as quais as relativas ao uso efetivo do equipamento pelo empregado".',
      'Para a periculosidade, a regra é oposta: o simples uso de EPI não afasta o direito ao adicional. Nos termos da Súmula nº 364, item I, do TST, "não afasta o pagamento do adicional de periculosidade o simples uso de equipamento de proteção individual, ou a existência de instalações elétricas com sistema de proteção". Isso porque o risco acentuado decorre da própria natureza da atividade e da exposição permanente ao agente perigoso, não apenas da intensidade de um agente nocivo mensurável.',
    ],
  },
  {
    titulo: '8. CUMULATIVIDADE E DIREITO DE OPÇÃO',
    paragrafos: [
      '"Art. 193, § 2º. O empregado poderá optar pelo adicional de insalubridade que porventura lhe seja devido." (CLT, art. 193, §2º)',
      'A jurisprudência majoritária do TST interpreta esse dispositivo como vedação à cumulação simultânea dos adicionais de insalubridade e de periculosidade, ainda que decorrentes de fatos geradores distintos, cabendo ao empregado optar pelo adicional que lhe for mais vantajoso quando presentes ambas as condições.',
    ],
  },
  {
    titulo: '9. VALIDADE E REVISÃO DO LAUDO',
    paragrafos: [
      'O presente laudo reflete as condições de trabalho verificadas na data da inspeção técnica indicada em sua capa, devendo ser revisado sempre que houver alteração relevante no ambiente, no processo, nos equipamentos de proteção ou na organização do trabalho, ou quando sobrevier alteração normativa que impacte a caracterização de insalubridade ou periculosidade das funções avaliadas.',
    ],
  },
  {
    titulo: '10. CONCLUSÃO',
    paragrafos: [
      'Este Laudo de Insalubridade e Periculosidade tem como fundamento legal os artigos 189 a 197 da CLT e as Normas Regulamentadoras NR-15 e NR-16, e tem por objetivo fornecer, para cada função avaliada, a fundamentação técnica e normativa necessária à caracterização (ou não) do direito aos respectivos adicionais.',
    ],
  },
]
