// Conteúdo estrutural e textos legais padrão do LTCAT (Lei 8.213/91 art. 58,
// Decreto 3.048/99 art. 68, NR-15, NR-9, IN INSS/PRES 128/2022).
// Textos genéricos — os mesmos para qualquer empresa, é o texto da norma.

export interface SecaoLegal { titulo: string; paragrafos: string[] }
export interface Definicao { termo: string; definicao: string }

// Glossário técnico do LTCAT — termos de uso consagrado na legislação
// previdenciária (Lei 8.213/91, Decreto 3.048/99) e na prática de higiene
// ocupacional, reunidos para dar ao leitor leigo (RH, contabilidade, auditoria)
// uma referência rápida sem precisar consultar a norma original.
export const DEFINICOES_LTCAT: Definicao[] = [
  { termo: 'LTCAT — Laudo Técnico das Condições Ambientais do Trabalho', definicao: 'Documento técnico-pericial, expedido por médico do trabalho ou engenheiro de segurança do trabalho, que descreve as condições ambientais de trabalho e serve de base para a emissão do PPP e para o reconhecimento de tempo especial perante o INSS (art. 58 da Lei nº 8.213/1991 e art. 68 do Decreto nº 3.048/99).' },
  { termo: 'PPP — Perfil Profissiográfico Previdenciário', definicao: 'Documento histórico-laboral do trabalhador, de emissão obrigatória pela empresa, que reúne dados administrativos, registros ambientais e responsáveis técnicos, elaborado com base no LTCAT e utilizado para comprovar, perante o INSS, a efetiva exposição a agentes nocivos.' },
  { termo: 'PPP Eletrônico', definicao: 'Versão do PPP gerada automaticamente pelo aplicativo Meu INSS a partir dos eventos de Saúde e Segurança do Trabalho do eSocial (S-2210, S-2220 e S-2240), obrigatória para períodos trabalhados a partir de 1º de janeiro de 2023, substituindo o preenchimento manual do formulário físico.' },
  { termo: 'S-2240 — Condições Ambientais do Trabalho — Agentes Nocivos', definicao: 'Evento periódico do eSocial no qual a empresa presta ao Governo, com base no LTCAT, as informações sobre a exposição do trabalhador a agentes nocivos, alimentando o PPP eletrônico e a base de cálculo da aposentadoria especial.' },
  { termo: 'Aposentadoria especial', definicao: 'Benefício previdenciário devido ao segurado que comprove, durante 15, 20 ou 25 anos, exposição habitual e permanente a agentes nocivos químicos, físicos ou biológicos prejudiciais à saúde, nos termos do art. 57 da Lei nº 8.213/1991.' },
  { termo: 'Agente nocivo', definicao: 'Agente físico, químico ou biológico, ou associação de agentes, capaz de causar dano à saúde ou à integridade física do trabalhador, elencado no Anexo IV do Decreto nº 3.048/99, para fins de reconhecimento de tempo especial.' },
  { termo: 'Nocividade', definicao: 'Situação, combinada ou não, de substâncias, energias e demais fatores de risco reconhecidos, presentes no ambiente de trabalho, capazes de causar dano à saúde ou à integridade física do trabalhador (art. 68, § 1º, do Decreto nº 3.048/99).' },
  { termo: 'Exposição habitual e permanente', definicao: 'Exposição indissociável da produção do bem ou da prestação do serviço, não ocasional nem intermitente — não se exigindo, porém, que o contato com o agente nocivo ocorra durante toda a jornada de trabalho, bastando que seja inerente à rotina de trabalho.' },
  { termo: 'Exposição intermitente ou eventual', definicao: 'Exposição esporádica ou não indissociável da atividade-fim do posto de trabalho, insuficiente, em regra, para caracterizar tempo especial para fins de aposentadoria especial, ainda que deva constar do inventário de riscos da NR-1 para fins de gestão de SST.' },
  { termo: 'GHE — Grupo Homogêneo de Exposição', definicao: 'Agrupamento de trabalhadores que compartilham, de forma similar, os mesmos perigos, atividades e condições de exposição ocupacional, usado como unidade de análise do LTCAT e do PGR.' },
  { termo: 'Avaliação qualitativa', definicao: 'Reconhecimento da nocividade pela simples presença do agente no ambiente de trabalho, comprovada por descrição técnica da fonte geradora, da trajetória e dos meios de contato, sem necessidade de mensuração instrumental — aplicável, entre outros, aos agentes iodo e níquel, por força do Anexo IV do Decreto nº 3.048/99.' },
  { termo: 'Avaliação quantitativa', definicao: 'Mensuração instrumental da intensidade ou concentração do agente nocivo, comparada aos limites de tolerância da NR-15, realizada segundo a metodologia das Normas de Higiene Ocupacional (NHO) da Fundacentro.' },
  { termo: 'NHO — Norma de Higiene Ocupacional', definicao: 'Conjunto de normas técnicas editadas pela Fundacentro que estabelecem a metodologia de avaliação quantitativa dos agentes ambientais (ex.: NHO-01 para ruído, NHO-06 para calor, NHO-08 para poeiras minerais), adotadas como referência técnica pelo art. 68, § 12, do Decreto nº 3.048/99.' },
  { termo: 'NEN — Nível de Exposição Normalizado', definicao: 'Indicador estabelecido pela NHO-01 da Fundacentro para a avaliação da exposição ocupacional ao ruído contínuo ou intermitente, calculado para uma jornada padronizada, utilizado para fins de comparação com o limite de tolerância de 85 dB(A) da NR-15 e para fins de caracterização de tempo especial (índice q=3, previdenciário).' },
  { termo: 'IBUTG — Índice de Bulbo Úmido Termômetro de Globo', definicao: 'Indicador de estresse térmico usado na avaliação da exposição ocupacional ao calor, conforme a NHO-06 da Fundacentro e o Anexo 3 da NR-15, calculado a partir das temperaturas de bulbo úmido natural, de globo e, quando aplicável, de bulbo seco, e comparado a limites que variam conforme a taxa metabólica da atividade.' },
  { termo: 'Insalubridade', definicao: 'Instituto de natureza trabalhista (arts. 189 a 197 da CLT e NR-15), relativo ao adicional de salário devido pela exposição a agentes nocivos acima dos limites de tolerância, que não se confunde com o LTCAT: a insalubridade tem finalidade remuneratória, enquanto o LTCAT tem finalidade previdenciária (comprovação de tempo especial).' },
  { termo: 'Periculosidade', definicao: 'Instituto de natureza trabalhista (art. 193 da CLT e NR-16), relativo ao adicional de salário devido pelo contato permanente com atividades ou operações perigosas (inflamáveis, explosivos, energia elétrica, radiação ionizante, roubos e outras formas de violência física), distinto da finalidade previdenciária do LTCAT.' },
  { termo: 'EPI eficaz (para fins de aposentadoria especial)', definicao: 'Equipamento de Proteção Individual comprovadamente capaz de neutralizar a nocividade do agente a que o trabalhador está exposto, cuja adoção pode descaracterizar a exposição para fins de aposentadoria especial (Tema 555 do STF), ressalvada a exceção do agente ruído, para o qual a declaração de eficácia do EPI não descaracteriza o tempo especial.' },
  { termo: 'SAT/RAT — Seguro/Riscos Ambientais do Trabalho', definicao: 'Contribuição previdenciária adicional devida pela empresa em razão do grau de risco de acidente do trabalho da atividade preponderante (1%, 2% ou 3%), à qual se somam as alíquotas suplementares de 6%, 9% ou 12% quando há trabalhadores expostos a agentes que ensejam aposentadoria especial aos 25, 20 ou 15 anos, respectivamente (Lei nº 9.732/1998).' },
  { termo: 'Tabela 24 do eSocial', definicao: 'Tabela de domínio do eSocial que relaciona os agentes nocivos do Anexo IV do Decreto nº 3.048/99 aos respectivos códigos, utilizada no preenchimento do evento S-2240 para indicar qual agente fundamenta o enquadramento em aposentadoria especial e o correspondente prazo de carência (15, 20 ou 25 anos).' },
  { termo: 'Responsável técnico', definicao: 'Médico do trabalho ou engenheiro de segurança do trabalho legalmente habilitado a assinar o LTCAT (art. 58, § 1º, da Lei nº 8.213/1991), com registro no respectivo conselho profissional (CRM ou CREA) e, quando engenheiro, com Anotação de Responsabilidade Técnica (ART) do serviço.' },
]

export const TEXTOS_LEGAIS_LTCAT: SecaoLegal[] = [
  {
    titulo: '1. INTRODUÇÃO',
    paragrafos: [
      'O Laudo Técnico das Condições Ambientais do Trabalho – LTCAT é o documento técnico que descreve as condições ambientais de trabalho existentes no estabelecimento, com a finalidade de identificar e caracterizar a exposição do trabalhador a agentes nocivos à saúde, servindo de base para a emissão do Perfil Profissiográfico Previdenciário – PPP e para fins de reconhecimento do direito à aposentadoria especial perante o Instituto Nacional do Seguro Social – INSS.',
      'A obrigatoriedade do LTCAT decorre do art. 58 da Lei nº 8.213, de 24 de julho de 1991 (Lei de Benefícios da Previdência Social), com a redação dada pela Lei nº 9.528, de 10 de dezembro de 1997, regulamentado pelo art. 68 do Decreto nº 3.048, de 6 de maio de 1999 (Regulamento da Previdência Social), que estabelece que a comprovação da efetiva exposição do segurado aos agentes nocivos será feita mediante formulário emitido pela empresa ou seu preposto, com base em laudo técnico de condições ambientais do trabalho expedido por médico do trabalho ou engenheiro de segurança do trabalho.',
      'O LTCAT não se confunde com o Programa de Gerenciamento de Riscos – PGR, previsto na NR-1. Enquanto o PGR tem natureza preventiva e trabalhista, voltado à eliminação e ao controle dos riscos ocupacionais, o LTCAT tem finalidade eminentemente previdenciária: comprovar, perante o INSS, a existência e a intensidade da exposição a agentes nocivos para fins de conversão de tempo especial e concessão de aposentadoria especial, ainda que os dois documentos compartilhem, em grande parte, a mesma base técnica de identificação de perigos e avaliação de agentes ambientais.',
      'Este laudo é também parte do conjunto mais amplo de iniciativas da empresa no campo da preservação da saúde e da integridade física de seus trabalhadores, articulando-se com o Programa de Gerenciamento de Riscos (PGR/NR-1) e com o Programa de Controle Médico de Saúde Ocupacional (PCMSO/NR-7), cujos resultados quantitativos e qualitativos de reconhecimento de agentes nocivos são aqui consolidados e aprofundados para fins específicos de comprovação previdenciária.',
    ],
  },
  {
    titulo: '2. OBJETIVOS',
    paragrafos: [
      'Este laudo tem como objetivo identificar, descrever e avaliar os agentes nocivos físicos, químicos e biológicos presentes nos ambientes e postos de trabalho da empresa, caracterizando a natureza, a intensidade/concentração e o tempo de exposição dos trabalhadores, de modo a subsidiar a emissão do PPP e a correta informação do evento S-2240 do eSocial.',
      'Constituem objetivos específicos deste LTCAT: identificar os agentes nocivos previstos na NR-15 (Atividades e Operações Insalubres) e no Anexo IV do Decreto nº 3.048/99; caracterizar a exposição como habitual e permanente, intermitente ou eventual; indicar a eficácia das medidas de proteção coletiva e individual adotadas; fundamentar tecnicamente o enquadramento, ou não, das atividades e dos trabalhadores para fins de aposentadoria especial; e subsidiar o correto recolhimento (ou a dispensa) das alíquotas suplementares do SAT/RAT.',
      'Nos termos do item 9.3.3 da NR-9, este documento também demonstra o reconhecimento dos agentes nocivos e discrimina a sua natureza, intensidade e concentração, identificando as condições ambientais de trabalho por setor, cargo e Grupo Homogêneo de Exposição (GHE), em consonância com os resultados do inventário de riscos do PGR.',
    ],
  },
  {
    titulo: '3. RESPONSABILIDADE TÉCNICA',
    paragrafos: [
      'O LTCAT deve ser expedido por médico do trabalho ou por engenheiro de segurança do trabalho, nos termos do art. 58 da Lei nº 8.213/1991 e do art. 68 do Decreto nº 3.048/99. Trata-se de exigência legal de habilitação profissional específica: o técnico de segurança do trabalho, ainda que possua registro no Conselho Regional de Engenharia e Agronomia – CREA, não está legalmente habilitado a assinar o laudo como responsável técnico.',
      'Quando o LTCAT é elaborado por engenheiro de segurança do trabalho, é exigível a Anotação de Responsabilidade Técnica – ART junto ao CREA, por se tratar de serviço de engenharia. Quando elaborado por médico do trabalho, a responsabilidade técnica é regida pelo Conselho Regional de Medicina – CRM, não se exigindo ART.',
      'Cabe à empresa a responsabilidade pela implementação das medidas de proteção coletiva e individual recomendadas neste laudo, bem como pela manutenção de sua atualização, permanecendo o profissional signatário responsável tecnicamente pela exatidão das informações levantadas na data da avaliação.',
    ],
  },
  {
    titulo: '4. BASE LEGAL E NORMATIVA',
    paragrafos: [
      'A exigência de laudo técnico para fins de caracterização de condições especiais de trabalho remonta à Lei nº 5.431, de 3 de maio de 1968, que introduziu o § 5º no art. 209 da CLT, e foi posteriormente disciplinada pelo art. 195 da CLT, na redação dada pela Lei nº 6.514, de 22 de dezembro de 1977, segundo o qual a caracterização e a classificação da insalubridade e da periculosidade far-se-ão através de perícia a cargo de médico do trabalho ou engenheiro do trabalho, registrados no Ministério do Trabalho.',
      'Este laudo foi elaborado com fundamento nas seguintes normas: Lei nº 8.213, de 24 de julho de 1991, art. 58, com a redação dada pela Lei nº 9.528, de 10 de dezembro de 1997; Decreto nº 3.048, de 6 de maio de 1999 (Regulamento da Previdência Social), arts. 57 a 68, com as alterações promovidas pelo Decreto nº 4.032, de 26 de novembro de 2001, pelo Decreto nº 8.123, de 16 de outubro de 2013, e pelo Decreto nº 10.410, de 30 de junho de 2020, este último quanto ao Anexo IV; Norma Regulamentadora nº 15 (NR-15) — Atividades e Operações Insalubres, e seus Anexos; Norma Regulamentadora nº 9 (NR-9) — Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos, em vigor desde 3 de janeiro de 2022, integrada à lógica do Gerenciamento de Riscos Ocupacionais – GRO da NR-1; e a Instrução Normativa PRES/INSS nº 128, de 28 de março de 2022, que disciplina os procedimentos relativos à aposentadoria especial, ao LTCAT e ao PPP, com as alterações promovidas pelas Instruções Normativas nº 141, nº 155/2023 e nº 170/2024.',
      'Subsidiariamente, foram observadas as Normas de Higiene Ocupacional – NHO da Fundacentro, adotadas como metodologia técnica de referência para a avaliação quantitativa dos agentes ambientais, conforme expressamente determinado pelo art. 68, § 12, do Decreto nº 3.048/99, e a NR-15 conforme atualizada pela Portaria MTE nº 2.021, de 3 de dezembro de 2025, que inseriu o item 15.4.1.3, exigindo que o laudo caracterizador da insalubridade seja disponibilizado aos trabalhadores, ao sindicato da categoria e à fiscalização do trabalho.',
    ],
  },
  {
    titulo: '5. METODOLOGIA DE AVALIAÇÃO',
    paragrafos: [
      'A avaliação dos agentes ambientais foi realizada por meio de avaliação qualitativa e, quando aplicável, avaliação quantitativa. A avaliação qualitativa consiste na descrição técnica das circunstâncias de exposição ocupacional a um agente ou associação de agentes nocivos presentes no ambiente de trabalho, das fontes geradoras, dos meios de contato ou absorção e da frequência e duração do contato, nos termos do art. 68, § 2º, do Decreto nº 3.048/99. A avaliação quantitativa consiste na mensuração da intensidade ou concentração do agente nocivo, por meio de instrumentos calibrados, comparando-se o resultado aos limites de tolerância estabelecidos na NR-15.',
      'Para a avaliação quantitativa, foram adotadas, no que couber, as Normas de Higiene Ocupacional da Fundacentro como referência metodológica: NHO-01 (Avaliação da Exposição Ocupacional ao Ruído), NHO-06 (Avaliação da Exposição Ocupacional ao Calor), NHO-08 (Coleta de Material Particulado Sólido Suspenso no Ar, aplicável a poeiras minerais, inclusive sílica), NHO-03 (análise gravimétrica de aerodispersóides sólidos), NHO-04 (coleta e análise de fibras, aplicável a asbesto/amianto), NHO-05 (Avaliação da Exposição Ocupacional aos Raios X), NHO-09 e NHO-10 (vibração de corpo inteiro e de mãos e braços) e NHO-11 (Avaliação dos Níveis de Iluminamento em Ambientes Internos de Trabalho), conforme o agente identificado.',
      'A calibração dos equipamentos de medição observou a rastreabilidade metrológica prevista na ABNT NBR ISO/IEC 17025 (Requisitos gerais para a competência de laboratórios de ensaio e calibração), aplicável aos laboratórios e prestadores de serviço de medição de agentes ambientais eventualmente contratados, garantindo a validade técnica dos resultados apresentados neste laudo.',
      'Os agentes de risco identificados por Grupo Homogêneo de Exposição – GHE foram inicialmente reconhecidos no inventário de riscos do PGR (NR-1), sendo aqui reavaliados sob a ótica específica da legislação previdenciária, com foco na nocividade e na permanência da exposição, critérios próprios do reconhecimento de tempo especial, distintos dos critérios de graduação de risco (severidade × probabilidade) utilizados no PGR.',
    ],
  },
  {
    titulo: '6. AGENTES NOCIVOS AVALIADOS',
    paragrafos: [
      'Foram avaliados os agentes nocivos previstos na NR-15 e no Anexo IV do Decreto nº 3.048/99, classificados em: agentes físicos — ruído contínuo ou intermitente e ruído de impacto, calor, radiações ionizantes, condições hiperbáricas, vibração, frio e umidade; agentes químicos — poeiras, fumos, névoas, neblinas, gases ou vapores capazes de penetrar no organismo pela via respiratória, cutânea ou por ingestão, incluindo benzeno, asbestos, sílica livre, chumbo e demais substâncias listadas no Anexo IV; e agentes biológicos — microrganismos como vírus, bactérias, fungos e parasitas, em atividades ou operações em contato permanente com pacientes, material infectocontagiante ou animais.',
      'Nos termos do art. 68, § 1º, do Decreto nº 3.048/99, na redação dada pelo Decreto nº 8.123/2013, as atividades exemplificativas listadas no Anexo IV são meramente exemplificativas — salvo para agentes biológicos, em que a lista é taxativa —, de modo que a análise da nocividade e da permanência deve considerar as condições reais de exposição verificadas no ambiente de trabalho, e não apenas a nomenclatura do cargo ou da atividade.',
      'Para cada agente identificado, este laudo indica a fonte geradora, a trajetória e os meios de propagação no ambiente de trabalho, a intensidade ou concentração (quando mensurável), o tempo de exposição e a eficácia das medidas de proteção coletiva e individual adotadas, conforme detalhado na tabela de Grupos Homogêneos de Exposição – GHE anexa a este documento, com o correspondente código de referência da Tabela 24 do eSocial, quando aplicável.',
    ],
  },
  {
    titulo: '7. CARACTERIZAÇÃO DA EXPOSIÇÃO OCUPACIONAL',
    paragrafos: [
      'Para fins de reconhecimento de tempo de trabalho especial, a exposição a agentes nocivos deve ser caracterizada como habitual e permanente, não ocasional nem intermitente, nos termos do art. 65 do Decreto nº 3.048/99. Considera-se permanente a exposição que é indissociável da produção do bem ou da prestação do serviço — não se exigindo, porém, que o contato com o agente nocivo se dê durante toda a jornada de trabalho.',
      'A exposição classificada como intermitente ou eventual não é, em regra, apta a fundamentar o reconhecimento de atividade especial para fins previdenciários, ainda que deva ser registrada no inventário de riscos para fins de gestão de segurança e saúde no trabalho, nos termos da NR-1 e da NR-9.',
      'Não quebra a permanência o exercício de função de supervisão, controle ou comando em geral, ou outra atividade equivalente, desde que exercida exclusivamente em ambientes de trabalho cuja nocividade tenha sido tecnicamente constatada, aplicando-se o mesmo enquadramento dos demais trabalhadores diretamente expostos.',
    ],
  },
  {
    titulo: '8. LIMITES DE TOLERÂNCIA — RUÍDO E CALOR (NHO E NR-15)',
    paragrafos: [
      'Os limites de tolerância dos agentes físicos, químicos e biológicos avaliados neste laudo têm por base as Normas de Higiene Ocupacional – NHO da Fundacentro e os respectivos Anexos da NR-15, sendo facultada a utilização da metodologia NHO desde a publicação do Decreto nº 4.882, de 18 de novembro de 2003.',
      'Ruído contínuo ou intermitente (Anexo 1 da NR-15 e NHO-01): a Legislação Previdenciária determina o uso da metodologia da NHO-01 da Fundacentro para caracterizar o direito à aposentadoria especial, sendo o Nível de Exposição Normalizado (NEN) apurado com índice de dobra q=3, específico para fins previdenciários. Os limites de tolerância a serem considerados, contudo, permanecem os da tabela do Anexo 1 da NR-15, reconhecendo-se o limite de tolerância somente a partir de 85 dB(A) para jornada de 8 horas. O ruído de impacto, avaliado em decibel Linear ou C, não é considerado para fins de aposentadoria especial, tendo relevância apenas na esfera trabalhista (insalubridade).',
      'Calor (Anexo 3 da NR-15 e NHO-06): a avaliação quantitativa da exposição ocupacional ao calor em ambientes com fonte artificial de calor, ou a céu aberto com carga solar direta, é realizada com base no Índice de Bulbo Úmido Termômetro de Globo (IBUTG), ponderado no tempo, comparado aos limites de exposição estabelecidos em função da taxa metabólica média da atividade (M), diferenciados para trabalhadores aclimatizados e não aclimatizados, conforme as Tabelas 1, 2 e 3 do Anexo 3 da NR-15. O Anexo 3 da NR-15 não se aplica a atividades a céu aberto sem fonte artificial de calor.',
      'Para os demais agentes físicos, químicos e biológicos avaliados neste laudo, aplicam-se, no que couber, os limites de tolerância e a metodologia das demais NHO da Fundacentro pertinentes a cada agente, sempre em cotejo com os respectivos Anexos da NR-15 e com o Anexo IV do Decreto nº 3.048/99.',
    ],
  },
  {
    titulo: '9. ENQUADRAMENTO PARA FINS DE APOSENTADORIA ESPECIAL',
    paragrafos: [
      'A relação dos agentes nocivos considerados para fins de concessão de aposentadoria especial é a constante do Anexo IV do Decreto nº 3.048/99, na redação dada pelo Decreto nº 10.410/2020, reproduzida de forma sintética no Anexo deste laudo. Os prazos de carência especial variam, conforme o agente e a atividade, entre 15, 20 e 25 anos de exposição habitual e permanente.',
      'Os agentes nocivos não arrolados no Anexo IV do Decreto nº 3.048/99 não são considerados para fins de concessão da aposentadoria especial, ainda que devam permanecer geridos no âmbito do PGR/NR-1 para fins de saúde e segurança do trabalho.',
      'A comprovação da efetiva exposição do segurado a agentes nocivos, para fins de concessão do benefício, é feita mediante o Perfil Profissiográfico Previdenciário – PPP, elaborado pela empresa com base neste LTCAT, e transmitido ao INSS por meio do evento S-2240 do eSocial, conforme disciplinado pela Instrução Normativa PRES/INSS nº 128/2022 e alterações.',
    ],
  },
  {
    titulo: '10. CÓDIGOS GFIP/SEFIP E ESOCIAL — TABELA 24 E ALÍQUOTAS SUPLEMENTARES (SAT/RAT)',
    paragrafos: [
      'Para classificação da ocorrência de exposição a agentes nocivos, é utilizada a tabela de classificação de Agentes Nocivos do Anexo IV do Regulamento da Previdência Social (Decreto nº 3.048/99). Historicamente, para trabalhadores com um único vínculo empregatício, a GFIP adotava os códigos: 00 (nunca houve exposição a agente nocivo), 01 (houve exposição, posteriormente neutralizada), 02, 03 e 04 (exposição ensejadora de aposentadoria especial aos 15, 20 e 25 anos, respectivamente), aos quais correspondiam as alíquotas suplementares do SAT/RAT de 12%, 9% e 6% sobre a remuneração dos trabalhadores expostos, instituídas pela Lei nº 9.732, de 11 de dezembro de 1998.',
      'No ambiente do eSocial, a Tabela 24 (Código de Agentes Nocivos, Ergonômicos e de Risco) relaciona cada agente do Anexo IV do Decreto nº 3.048/99 ao respectivo código informado no evento S-2240, sendo os códigos genéricos de enquadramento: 01 (não ensejador de aposentadoria especial), 02 (ensejador de aposentadoria especial aos 15 anos — alíquota suplementar de 12%), 03 (ensejador de aposentadoria especial aos 20 anos — alíquota suplementar de 9%) e 04 (ensejador de aposentadoria especial aos 25 anos — alíquota suplementar de 6%).',
      'Deixar de recolher a alíquota suplementar do SAT/RAT sem lastro em avaliação técnica conclusiva — isto é, presumir informalmente a ausência de exposição a agente nocivo, sem a elaboração deste laudo — expõe a empresa a passivo trabalhista e previdenciário caso a condição especial venha a ser reconhecida posteriormente, inclusive por via judicial, com efeitos retroativos.',
    ],
  },
  {
    titulo: '11. RELAÇÃO DO LTCAT COM O PPP E O ESOCIAL (S-2240)',
    paragrafos: [
      'O LTCAT tem papel central no preenchimento das informações do PPP e dos eventos de Saúde e Segurança do Trabalho do eSocial. As informações deste laudo alimentam diretamente o evento periódico S-2240 (Condições Ambientais do Trabalho — Agentes Nocivos), que registra, para cada trabalhador, o código do agente nocivo (Tabela 24), a técnica de avaliação utilizada, a intensidade ou concentração, os EPC e EPI utilizados e sua eficácia.',
      'Para atividades exercidas até 31 de dezembro de 2022, o PPP pode ser emitido no modelo físico, conforme a Instrução Normativa INSS nº 141/2022. Para atividades exercidas a partir de 1º de janeiro de 2023, o PPP deve ser emitido eletronicamente pelo aplicativo Meu INSS, com base exclusivamente nos eventos de SST do eSocial já transmitidos — não sendo mais possível o preenchimento manual do formulário físico para este período.',
      'O prazo de transmissão do evento S-2240 é até o dia 15 do mês subsequente ao da admissão do trabalhador, da alteração das condições ambientais de trabalho ou do início da obrigatoriedade do evento, sendo os primeiros envios responsáveis por registrar a carga inicial de todos os trabalhadores expostos da empresa. A falta de regularidade nos eventos de SST do eSocial compromete a emissão do PPP eletrônico do trabalhador junto ao INSS, motivo pelo qual este LTCAT deve ser mantido atualizado e utilizado como fonte primária de preenchimento desses eventos.',
    ],
  },
  {
    titulo: '12. EQUIPAMENTOS DE PROTEÇÃO E A DESCARACTERIZAÇÃO DA EXPOSIÇÃO A AGENTES NOCIVOS',
    paragrafos: [
      'Como regra geral, a adoção de Equipamento de Proteção Individual – EPI comprovadamente eficaz, que efetivamente neutralize a nocividade do agente ao qual o trabalhador está exposto, pode descaracterizar a exposição para fins de aposentadoria especial, nos termos da tese fixada pelo Supremo Tribunal Federal no julgamento do Tema 555 de Repercussão Geral (RE nº 664.335/SC): o direito à aposentadoria especial pressupõe a efetiva exposição do trabalhador a agente nocivo à sua saúde, de modo que, se o EPI for realmente capaz de neutralizar a nocividade, não haverá respaldo constitucional à aposentadoria especial.',
      'Há, contudo, uma exceção jurisprudencial relevante quanto ao agente físico ruído: segundo a segunda tese fixada no mesmo Tema 555, a declaração do empregador, no âmbito do PPP, de que o EPI é eficaz não descaracteriza o tempo de serviço especial para aposentadoria quando o agente é o ruído acima dos limites de tolerância. O fundamento é a ausência de comprovação científica e jurídica de EPI capaz de neutralizar integralmente os efeitos nocivos do ruído sobre a audição, ainda que reduza a intensidade percebida.',
      'Este LTCAT, ao avaliar cada agente nocivo, informa expressamente se o uso do EPI fornecido é ou não considerado eficaz para fins de descaracterização da exposição, observando a exceção legal e jurisprudencial aplicável ao agente ruído, de modo a subsidiar corretamente os campos correspondentes do PPP e do evento S-2240.',
    ],
  },
  {
    titulo: '13. RECOMENDAÇÕES TÉCNICAS GERAIS',
    paragrafos: [
      'Priorizar a eliminação dos riscos na fonte. Não sendo possível eliminá-los, neutralizá-los ou minimizá-los primeiramente por meio de Equipamentos de Proteção Coletiva – EPC e, apenas em segundo plano, por meio de Equipamentos de Proteção Individual – EPI apropriados ao fator de risco identificado, observando a ordem de prioridade das medidas de prevenção estabelecida pela NR-1.',
      'Realizar treinamentos de capacitação específicos para cada atividade, em razão dos riscos a que os trabalhadores estão expostos, além dos cursos de capacitação exigidos pelas Normas Regulamentadoras aplicáveis (NR-6, NR-9, NR-15, entre outras conforme o caso).',
      'Realizar auditorias periódicas de segurança e saúde do trabalho, para garantir o cumprimento efetivo dos procedimentos e medidas de proteção adotados, e cumprir rigorosamente o cronograma de ações definido no Programa de Gerenciamento de Riscos – PGR.',
      'Manter rigoroso controle documental quanto aos EPI fornecidos: evidências de compra, registros individuais de entrega e assinatura do trabalhador, periodicidade de substituição, validade e Certificado de Aprovação – CA de cada equipamento, treinamento para uso correto, condições de armazenamento e fiscalização efetiva quanto ao seu uso, de modo a lastrear tecnicamente a informação de eficácia declarada no PPP.',
      'Revisar este laudo sempre que houver mudança relevante nos processos, ambientes, tecnologias ou organização do trabalho, e observar atentamente os prazos do evento S-2240 do eSocial, cuja regularidade é condição para a correta emissão do PPP eletrônico dos trabalhadores expostos.',
    ],
  },
  {
    titulo: '14. VALIDADE, REVISÃO E DISPONIBILIZAÇÃO DO LAUDO',
    paragrafos: [
      'A legislação previdenciária não fixa prazo de validade determinado para o LTCAT. Contudo, a empresa tem o dever legal de mantê-lo atualizado, devendo revisá-lo sempre que houver mudança nos processos, ambientes, tecnologias ou organização do trabalho capaz de alterar a natureza, a intensidade ou a caracterização da exposição a agentes nocivos.',
      'Recomenda-se, como boa prática técnica, a revisão periódica deste laudo em prazo não superior a 2 (dois) anos, em alinhamento com o ciclo de revisão do inventário de riscos previsto na NR-1 para o PGR.',
      'Nos termos do item 15.4.1.3 da NR-15, incluído pela Portaria MTE nº 2.021/2025, o laudo caracterizador da insalubridade deve permanecer disponível aos trabalhadores interessados, ao sindicato representativo da categoria profissional e à fiscalização do trabalho, sempre que solicitado.',
    ],
  },
  {
    titulo: '15. CONCLUSÃO',
    paragrafos: [
      'Este Laudo Técnico das Condições Ambientais do Trabalho foi elaborado com fundamento no art. 58 da Lei nº 8.213/1991, no art. 68 do Decreto nº 3.048/99 e na NR-15, com o objetivo de identificar, descrever e avaliar tecnicamente os agentes nocivos presentes nos ambientes de trabalho da empresa, subsidiando a correta emissão do PPP e a informação do evento S-2240 do eSocial.',
      'As conclusões técnicas por Grupo Homogêneo de Exposição — incluindo o enquadramento, ou não, para fins de aposentadoria especial e o respectivo código da Tabela 24 do eSocial — constam de seção específica deste documento, refletindo as condições de trabalho verificadas na data das avaliações realizadas. Este laudo deve ser revisado sempre que ocorrerem alterações relevantes nos processos, ambientes ou medidas de proteção.',
    ],
  },
  {
    titulo: '16. REFERÊNCIAS BIBLIOGRÁFICAS',
    paragrafos: [
      'BRASIL. Consolidação das Leis do Trabalho, arts. 189 a 197. Disponível em: planalto.gov.br/ccivil_03/leis/l6514.htm.',
      'BRASIL. Lei nº 8.213, de 24 de julho de 1991 — Lei de Benefícios da Previdência Social, art. 58, com a redação dada pela Lei nº 9.528, de 10 de dezembro de 1997. Disponível em: planalto.gov.br.',
      'BRASIL. Decreto nº 3.048, de 6 de maio de 1999 — Regulamento da Previdência Social, arts. 57 a 68 e Anexo IV. Disponível em: planalto.gov.br/ccivil_03/decreto/d3048.htm.',
      'BRASIL. Decreto nº 4.032, de 26 de novembro de 2001, e Decreto nº 10.410, de 30 de junho de 2020 — alterações ao Decreto nº 3.048/99 e ao seu Anexo IV.',
      'SUPREMO TRIBUNAL FEDERAL. Tema 555 de Repercussão Geral (RE nº 664.335/SC) — eficácia do EPI e descaracterização da exposição para fins de aposentadoria especial.',
      'INSTITUTO NACIONAL DO SEGURO SOCIAL. Instrução Normativa PRES/INSS nº 128, de 28 de março de 2022, e alterações posteriores (IN nº 141/2022, nº 155/2023 e nº 170/2024).',
      'MINISTÉRIO DO TRABALHO E EMPREGO. Norma Regulamentadora nº 15 (NR-15) — Atividades e Operações Insalubres, e seus Anexos, com as alterações da Portaria MTE nº 2.021/2025.',
      'MINISTÉRIO DO TRABALHO E EMPREGO. Normas Regulamentadoras nº 1, nº 9 e nº 16.',
      'FUNDACENTRO. Normas de Higiene Ocupacional — NHO. Disponível em: gov.br/fundacentro/pt-br/centrais-de-conteudo/biblioteca/nhos.',
    ],
  },
]
