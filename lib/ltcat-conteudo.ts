// Conteúdo estrutural e textos legais padrão do LTCAT (Lei 8.213/91 art. 58,
// Decreto 3.048/99 art. 68, NR-15, NR-9, IN INSS/PRES 128/2022).
// Textos genéricos — os mesmos para qualquer empresa, é o texto da norma.

export interface SecaoLegal { titulo: string; paragrafos: string[] }

// Metodologia de avaliação e recomendações técnicas por tipo de agente/risco
// (físico, químico, biológico, ergonômico), exibidas no LTCAT para cada GHE
// conforme os tipos de agente efetivamente identificados naquele grupo.
export interface MetodologiaRisco { titulo: string; metodologia: string; recomendacoes: string }

export const METODOLOGIAS_RISCO: Record<'fis' | 'qui' | 'bio' | 'erg', MetodologiaRisco> = {
  erg: {
    titulo: 'Ergonômico',
    metodologia: 'Qualitativa, mediante observação do posto de trabalho, da postura, do mobiliário e da organização da atividade.',
    recomendacoes: 'Mantenha o local de trabalho limpo e organizado. Ferramentas e materiais desarrumados, além de causar mau aspecto visual, atrasam as atividades e podem causar acidentes. Nunca deixe objetos pesados sobre armários ou arquivos: eles podem cair e lesionar partes do corpo; da mesma forma, não os acomode em gavetas ou prateleiras superiores, pois, ao abri-las, podem comprometer a estabilidade do móvel. Não deixe objetos cortantes ou perfurantes sem proteção dentro de gavetas. As instalações e fiações elétricas devem estar em perfeito estado de conservação: evite sobrecarregar tomadas com adaptadores do tipo "T" ou semelhantes, salvo se a instalação tiver sido projetada para tal, e não deixe fiação espalhada em locais de circulação de pessoas, carrinhos ou equipamentos. Mantenha ao alcance das mãos os materiais de uso mais frequente, evitando deslocamentos desnecessários, estresse e dores lombares. Ajuste os móveis da estação de trabalho à estatura do trabalhador, mantendo pernas e cotovelos em ângulo de aproximadamente 90°, com apoio para os pés quando necessário. Garanta iluminação adequada à atividade desempenhada, já que o excesso ou a falta de luz causam fadiga e podem provocar acidentes e doenças ocupacionais. Não deixe pisos molhados em áreas de circulação; quando não for possível limpá-los de imediato, sinalize o risco. Produtos químicos somente podem ser manuseados por pessoas habilitadas, devendo ser guardados em local adequado e identificado, sem reutilização de embalagens originais. Evite permanecer por longos períodos na mesma posição (sentado ou em pé), alternando pausas e mudanças de postura ao longo da jornada. Comunique toda situação de risco encontrada no ambiente de trabalho: cada trabalhador é o maior responsável por sua própria segurança.',
  },
  fis: {
    titulo: 'Físico',
    metodologia: 'Qualitativa e, quando aplicável, quantitativa, mediante instrumento de medição calibrado, conforme as Normas de Higiene Ocupacional (NHO) da Fundacentro pertinentes ao agente (NHO-01 para ruído, NHO-06 para calor, entre outras) e os Anexos da NR-15.',
    recomendacoes: 'Priorizar medidas de proteção coletiva que atuem na fonte geradora do agente físico — enclausuramento e manutenção preventiva de máquinas e equipamentos ruidosos, isolamento acústico, ventilação e exaustão para controle de calor, anteparos e sinalização para radiação — antes de recorrer ao uso de Equipamento de Proteção Individual. Fornecer e exigir o uso correto de protetor auricular, vestimenta adequada ou demais EPI pertinentes ao agente identificado, com Certificado de Aprovação (CA) válido, treinamento de uso e substituição periódica. Respeitar os limites de tolerância e os tempos máximos de exposição diária estabelecidos na NR-15 e nas NHO da Fundacentro, promovendo pausas e rodízio de funções quando tecnicamente necessário. Realizar avaliações periódicas (audiometria e demais exames clínicos previstos no PCMSO) para monitorar a saúde dos trabalhadores expostos.',
  },
  qui: {
    titulo: 'Químico',
    metodologia: 'Qualitativa e, quando aplicável, quantitativa, mediante dosimetria ou amostragem do ar e comparação com os limites de tolerância da NR-15.',
    recomendacoes: 'Priorizar a substituição do produto químico por outro de menor toxicidade ou pela adoção de processo que dispense o uso do agente, sempre que tecnicamente viável. Manter os ambientes ventilados, reduzindo a concentração do agente no ar, e limitar o tempo de exposição dos trabalhadores. Armazenar produtos químicos em local adequado, identificado e ventilado, mantendo as embalagens originais e as Fichas de Informação de Segurança de Produtos Químicos (FISPQ) acessíveis aos trabalhadores. Fornecer e exigir o uso de EPI adequado ao agente (luvas, respiradores, óculos de proteção), com CA válido, treinamento de uso correto e substituição periódica. Proibir a reutilização de embalagens originais para acondicionamento de outros produtos, evitando reações químicas indesejadas. Realizar monitoramento biológico e demais exames complementares previstos no PCMSO para os trabalhadores expostos.',
  },
  bio: {
    titulo: 'Biológico',
    metodologia: 'Qualitativa, pela identificação da natureza da atividade e do contato permanente com pacientes, material biológico, microrganismos ou animais.',
    recomendacoes: 'Fornecer e exigir o uso de Equipamentos de Proteção Individual adequados ao risco (luvas, máscaras, óculos de proteção, aventais), com descarte correto após o uso. Disponibilizar instalações sanitárias e lavatórios, com materiais para higienização das mãos, em quantidade suficiente e de fácil acesso. Manter atualizado o esquema vacinal dos trabalhadores expostos, conforme orientação do médico coordenador do PCMSO. Adotar procedimentos seguros de manuseio, acondicionamento e descarte de material biológico e perfurocortante, observando a NR-32 quando aplicável às atividades da empresa. Comunicar imediatamente ao serviço de saúde ocupacional qualquer acidente com material biológico, para adoção das medidas profiláticas cabíveis.',
  },
}

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
    titulo: '2. CONDIÇÕES PRELIMINARES DO LEVANTAMENTO AMBIENTAL',
    paragrafos: [
      'O levantamento dos dados ambientais que fundamenta este laudo foi realizado em todos os setores, ambientes e atividades desenvolvidos pela empresa, considerando: (i) a efetiva exposição dos trabalhadores a agentes nocivos químicos, físicos, biológicos ou à associação desses agentes, capazes de causar dano à saúde ou à integridade física; e (ii) as condições especiais que prejudicam a saúde ou a integridade física, conforme definido no Anexo IV do Decreto nº 3.048/99, quando a exposição ocorre em concentração, intensidade ou tempo que ultrapasse os limites de tolerância ou que, dependendo do agente, torne a simples possibilidade de exposição uma condição especial prejudicial à saúde, nos termos do § 4º do art. 68 do mesmo Decreto.',
      'Para efeito deste levantamento, adota-se o conceito de nocividade como a situação, combinada ou não, de substâncias, energias e demais fatores de risco reconhecidos, presentes no ambiente de trabalho, capazes de causar dano à saúde ou à integridade física do trabalhador; e o conceito de permanência como a exposição ao agente nocivo que ocorre de forma habitual, não ocasional nem intermitente, sendo indissociável da produção do bem ou da prestação do serviço.',
      'A avaliação dos agentes nocivos descritos no Anexo IV do Decreto nº 3.048/99 pode ser qualitativa ou quantitativa. Na avaliação qualitativa, a nocividade é reconhecida pela simples presença do agente no ambiente de trabalho, conforme os Anexos 6, 13, 13-A e 14 da NR-15, aprovada pela Portaria nº 3.214, de 1978, do então Ministério do Trabalho. Na avaliação quantitativa, a nocividade decorre da ultrapassagem dos limites de tolerância estabelecidos nos Anexos 1, 2, 3, 4, 8, 9, 11 e 12 da mesma NR-15.',
      'O levantamento ambiental observou a metodologia das Normas de Higiene Ocupacional – NHO da Fundacentro, cuja utilização é facultada desde 19 de novembro de 2003, data de publicação do Decreto nº 4.882/2003, sem prejuízo dos limites de tolerância fixados pela NR-15. A avaliação qualitativa de riscos e agentes nocivos, conforme o art. 68, § 2º, do Decreto nº 3.048/99, na redação dada pelo Decreto nº 8.123/2013, foi comprovada mediante a descrição: (I) das circunstâncias de exposição ocupacional a determinado agente nocivo ou associação de agentes presentes no ambiente de trabalho durante a jornada; (II) de todas as fontes e possibilidades de liberação dos agentes mencionados; e (III) dos meios de contato ou exposição dos trabalhadores, das vias de absorção, da intensidade da exposição e da frequência e duração do contato.',
    ],
  },
  {
    titulo: '3. OBJETIVOS',
    paragrafos: [
      'O LTCAT tem por finalidade cumprir as exigências da legislação previdenciária — art. 58 da Lei nº 8.213, de 1991, na redação dada pela Lei nº 9.528, de 10 de dezembro de 1997 —, dar sustentabilidade técnica às condições ambientais de trabalho existentes na empresa e subsidiar o enquadramento das atividades quanto ao recolhimento das alíquotas suplementares do Seguro de Acidentes do Trabalho (SAT/RAT), instituídas pela Lei nº 9.732, de 11 de dezembro de 1998.',
      'Nos termos do art. 58 da Lei nº 8.213/1991: "§ 1º A comprovação da efetiva exposição do segurado aos agentes nocivos será feita mediante formulário, na forma estabelecida pelo Instituto Nacional do Seguro Social – INSS, emitido pela empresa ou seu preposto, com base em laudo técnico de condições ambientais do trabalho expedido por médico do trabalho ou engenheiro de segurança do trabalho nos termos da legislação trabalhista. § 2º Do laudo técnico referido no parágrafo anterior deverão constar informação sobre a existência de tecnologia de proteção coletiva ou individual que diminua a intensidade do agente agressivo a limites de tolerância e recomendação sobre a sua adoção pelo estabelecimento respectivo."',
      'O LTCAT, previsto na Lei nº 8.213/1991, tem finalidade previdenciária voltada à concessão da aposentadoria especial, não se confundindo com o laudo técnico de insalubridade e/ou periculosidade, de natureza trabalhista: o laudo trabalhista versa sobre periculosidade, nas condições da NR-16, e/ou insalubridade, nas condições da NR-15, quando as atividades se desenvolvem acima dos limites de tolerância dos Anexos 1, 2, 3, 5, 8, 11 e 12 da NR-15 ou nas atividades dos Anexos 6, 13 e 14 da mesma norma — ainda que os dois laudos compartilhem, em parte, a mesma base técnica de identificação de agentes ambientais.',
      'Este laudo tem como objetivo identificar, descrever e avaliar os agentes nocivos físicos, químicos e biológicos presentes nos ambientes e postos de trabalho da empresa, caracterizando a natureza, a intensidade/concentração e o tempo de exposição dos trabalhadores, de modo a subsidiar a emissão do PPP e a correta informação do evento S-2240 do eSocial.',
      'Constituem objetivos específicos deste LTCAT: identificar os agentes nocivos previstos na NR-15 (Atividades e Operações Insalubres) e no Anexo IV do Decreto nº 3.048/99; caracterizar a exposição como habitual e permanente, intermitente ou eventual; indicar a eficácia das medidas de proteção coletiva e individual adotadas; fundamentar tecnicamente o enquadramento, ou não, das atividades e dos trabalhadores para fins de aposentadoria especial; e subsidiar o correto recolhimento (ou a dispensa) das alíquotas suplementares do SAT/RAT.',
      'Nos termos do item 9.3.3 da NR-9, este documento também demonstra o reconhecimento dos agentes nocivos e discrimina a sua natureza, intensidade e concentração, identificando as condições ambientais de trabalho por setor, cargo e Grupo Homogêneo de Exposição (GHE), em consonância com os resultados do inventário de riscos do PGR.',
    ],
  },
  {
    titulo: '4. RESPONSABILIDADE TÉCNICA',
    paragrafos: [
      'O LTCAT deve ser expedido por médico do trabalho ou por engenheiro de segurança do trabalho, nos termos do art. 58 da Lei nº 8.213/1991 e do art. 68 do Decreto nº 3.048/99. Trata-se de exigência legal de habilitação profissional específica: o técnico de segurança do trabalho, ainda que possua registro no Conselho Regional de Engenharia e Agronomia – CREA, não está legalmente habilitado a assinar o laudo como responsável técnico.',
      'Quando o LTCAT é elaborado por engenheiro de segurança do trabalho, é exigível a Anotação de Responsabilidade Técnica – ART junto ao CREA, por se tratar de serviço de engenharia. Quando elaborado por médico do trabalho, a responsabilidade técnica é regida pelo Conselho Regional de Medicina – CRM, não se exigindo ART.',
      'Cabe à empresa a responsabilidade pela implementação das medidas de proteção coletiva e individual recomendadas neste laudo, bem como pela manutenção de sua atualização, permanecendo o profissional signatário responsável tecnicamente pela exatidão das informações levantadas na data da avaliação.',
    ],
  },
  {
    titulo: '5. BASE LEGAL E NORMATIVA',
    paragrafos: [
      'A exigência de laudo técnico para fins de caracterização de condições especiais de trabalho remonta à Lei nº 5.431, de 3 de maio de 1968, que introduziu o § 5º no art. 209 da CLT, e foi posteriormente disciplinada pelo art. 195 da CLT, na redação dada pela Lei nº 6.514, de 22 de dezembro de 1977, segundo o qual a caracterização e a classificação da insalubridade e da periculosidade far-se-ão através de perícia a cargo de médico do trabalho ou engenheiro do trabalho, registrados no Ministério do Trabalho.',
      'Este laudo foi elaborado com fundamento nas seguintes normas: Lei nº 8.213, de 24 de julho de 1991, art. 58, com a redação dada pela Lei nº 9.528, de 10 de dezembro de 1997; Decreto nº 3.048, de 6 de maio de 1999 (Regulamento da Previdência Social), arts. 57 a 68, com as alterações promovidas pelo Decreto nº 4.032, de 26 de novembro de 2001, pelo Decreto nº 8.123, de 16 de outubro de 2013, e pelo Decreto nº 10.410, de 30 de junho de 2020, este último quanto ao Anexo IV; Norma Regulamentadora nº 15 (NR-15) — Atividades e Operações Insalubres, e seus Anexos; Norma Regulamentadora nº 9 (NR-9) — Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos, em vigor desde 3 de janeiro de 2022, integrada à lógica do Gerenciamento de Riscos Ocupacionais – GRO da NR-1; e a Instrução Normativa PRES/INSS nº 128, de 28 de março de 2022, que disciplina os procedimentos relativos à aposentadoria especial, ao LTCAT e ao PPP, com as alterações promovidas pelas Instruções Normativas nº 141, nº 155/2023 e nº 170/2024.',
      'Subsidiariamente, foram observadas as Normas de Higiene Ocupacional – NHO da Fundacentro, adotadas como metodologia técnica de referência para a avaliação quantitativa dos agentes ambientais, conforme expressamente determinado pelo art. 68, § 12, do Decreto nº 3.048/99, e a NR-15 conforme atualizada pela Portaria MTE nº 2.021, de 3 de dezembro de 2025, que inseriu o item 15.4.1.3, exigindo que o laudo caracterizador da insalubridade seja disponibilizado aos trabalhadores, ao sindicato da categoria e à fiscalização do trabalho.',
    ],
  },
  {
    titulo: '6. METODOLOGIA DE AVALIAÇÃO',
    paragrafos: [
      'A avaliação dos agentes ambientais foi realizada por meio de avaliação qualitativa e, quando aplicável, avaliação quantitativa. A avaliação qualitativa consiste na descrição técnica das circunstâncias de exposição ocupacional a um agente ou associação de agentes nocivos presentes no ambiente de trabalho, das fontes geradoras, dos meios de contato ou absorção e da frequência e duração do contato, nos termos do art. 68, § 2º, do Decreto nº 3.048/99. A avaliação quantitativa consiste na mensuração da intensidade ou concentração do agente nocivo, por meio de instrumentos calibrados, comparando-se o resultado aos limites de tolerância estabelecidos na NR-15.',
      'Para a avaliação quantitativa, foram adotadas, no que couber, as Normas de Higiene Ocupacional da Fundacentro como referência metodológica: NHO-01 (Avaliação da Exposição Ocupacional ao Ruído), NHO-06 (Avaliação da Exposição Ocupacional ao Calor), NHO-08 (Coleta de Material Particulado Sólido Suspenso no Ar, aplicável a poeiras minerais, inclusive sílica), NHO-03 (análise gravimétrica de aerodispersóides sólidos), NHO-04 (coleta e análise de fibras, aplicável a asbesto/amianto), NHO-05 (Avaliação da Exposição Ocupacional aos Raios X), NHO-09 e NHO-10 (vibração de corpo inteiro e de mãos e braços) e NHO-11 (Avaliação dos Níveis de Iluminamento em Ambientes Internos de Trabalho), conforme o agente identificado.',
      'A calibração dos equipamentos de medição observou a rastreabilidade metrológica prevista na ABNT NBR ISO/IEC 17025 (Requisitos gerais para a competência de laboratórios de ensaio e calibração), aplicável aos laboratórios e prestadores de serviço de medição de agentes ambientais eventualmente contratados, garantindo a validade técnica dos resultados apresentados neste laudo.',
      'Os agentes de risco identificados por Grupo Homogêneo de Exposição – GHE foram inicialmente reconhecidos no inventário de riscos do PGR (NR-1), sendo aqui reavaliados sob a ótica específica da legislação previdenciária, com foco na nocividade e na permanência da exposição, critérios próprios do reconhecimento de tempo especial, distintos dos critérios de graduação de risco (severidade × probabilidade) utilizados no PGR.',
    ],
  },
  {
    titulo: '7. AGENTES NOCIVOS AVALIADOS',
    paragrafos: [
      'Foram avaliados os agentes nocivos previstos na NR-15 e no Anexo IV do Decreto nº 3.048/99, classificados em: agentes físicos — ruído contínuo ou intermitente e ruído de impacto, calor, radiações ionizantes, condições hiperbáricas, vibração, frio e umidade; agentes químicos — poeiras, fumos, névoas, neblinas, gases ou vapores capazes de penetrar no organismo pela via respiratória, cutânea ou por ingestão, incluindo benzeno, asbestos, sílica livre, chumbo e demais substâncias listadas no Anexo IV; e agentes biológicos — microrganismos como vírus, bactérias, fungos e parasitas, em atividades ou operações em contato permanente com pacientes, material infectocontagiante ou animais.',
      'Nos termos do art. 68, § 1º, do Decreto nº 3.048/99, na redação dada pelo Decreto nº 8.123/2013, as atividades exemplificativas listadas no Anexo IV são meramente exemplificativas — salvo para agentes biológicos, em que a lista é taxativa —, de modo que a análise da nocividade e da permanência deve considerar as condições reais de exposição verificadas no ambiente de trabalho, e não apenas a nomenclatura do cargo ou da atividade.',
      'Para cada agente identificado, este laudo indica a fonte geradora, a trajetória e os meios de propagação no ambiente de trabalho, a intensidade ou concentração (quando mensurável), o tempo de exposição e a eficácia das medidas de proteção coletiva e individual adotadas, conforme detalhado na tabela de Grupos Homogêneos de Exposição – GHE anexa a este documento, com o correspondente código de referência da Tabela 24 do eSocial, quando aplicável.',
    ],
  },
  {
    titulo: '8. CARACTERIZAÇÃO DA EXPOSIÇÃO OCUPACIONAL',
    paragrafos: [
      'Para fins de reconhecimento de tempo de trabalho especial, a exposição a agentes nocivos deve ser caracterizada como habitual e permanente, não ocasional nem intermitente, nos termos do art. 65 do Decreto nº 3.048/99. Considera-se permanente a exposição que é indissociável da produção do bem ou da prestação do serviço — não se exigindo, porém, que o contato com o agente nocivo se dê durante toda a jornada de trabalho.',
      'A exposição classificada como intermitente ou eventual não é, em regra, apta a fundamentar o reconhecimento de atividade especial para fins previdenciários, ainda que deva ser registrada no inventário de riscos para fins de gestão de segurança e saúde no trabalho, nos termos da NR-1 e da NR-9.',
      'Não quebra a permanência o exercício de função de supervisão, controle ou comando em geral, ou outra atividade equivalente, desde que exercida exclusivamente em ambientes de trabalho cuja nocividade tenha sido tecnicamente constatada, aplicando-se o mesmo enquadramento dos demais trabalhadores diretamente expostos.',
    ],
  },
  {
    titulo: '9. LIMITES DE TOLERÂNCIA — RUÍDO E CALOR (NHO E NR-15)',
    paragrafos: [
      'Os limites de tolerância dos agentes físicos, químicos e biológicos avaliados neste laudo têm por base as Normas de Higiene Ocupacional – NHO da Fundacentro e os respectivos Anexos da NR-15, sendo facultada a utilização da metodologia NHO desde a publicação do Decreto nº 4.882, de 18 de novembro de 2003.',
      'Ruído contínuo ou intermitente (Anexo 1 da NR-15 e NHO-01): a Legislação Previdenciária determina o uso da metodologia da NHO-01 da Fundacentro para caracterizar o direito à aposentadoria especial, sendo o Nível de Exposição Normalizado (NEN) apurado com índice de dobra q=3, específico para fins previdenciários. Os limites de tolerância a serem considerados, contudo, permanecem os da tabela do Anexo 1 da NR-15, reconhecendo-se o limite de tolerância somente a partir de 85 dB(A) para jornada de 8 horas. O ruído de impacto, avaliado em decibel Linear ou C, não é considerado para fins de aposentadoria especial, tendo relevância apenas na esfera trabalhista (insalubridade).',
      'Calor (Anexo 3 da NR-15 e NHO-06): a avaliação quantitativa da exposição ocupacional ao calor em ambientes com fonte artificial de calor, ou a céu aberto com carga solar direta, é realizada com base no Índice de Bulbo Úmido Termômetro de Globo (IBUTG), ponderado no tempo, comparado aos limites de exposição estabelecidos em função da taxa metabólica média da atividade (M), diferenciados para trabalhadores aclimatizados e não aclimatizados, conforme as Tabelas 1, 2 e 3 do Anexo 3 da NR-15. O Anexo 3 da NR-15 não se aplica a atividades a céu aberto sem fonte artificial de calor.',
      'Para os demais agentes físicos, químicos e biológicos avaliados neste laudo, aplicam-se, no que couber, os limites de tolerância e a metodologia das demais NHO da Fundacentro pertinentes a cada agente, sempre em cotejo com os respectivos Anexos da NR-15 e com o Anexo IV do Decreto nº 3.048/99.',
    ],
  },
  {
    titulo: '10. ENQUADRAMENTO PARA FINS DE APOSENTADORIA ESPECIAL',
    paragrafos: [
      'A relação dos agentes nocivos considerados para fins de concessão de aposentadoria especial é a constante do Anexo IV do Decreto nº 3.048/99, na redação dada pelo Decreto nº 10.410/2020, reproduzida de forma sintética no Anexo deste laudo. Os prazos de carência especial variam, conforme o agente e a atividade, entre 15, 20 e 25 anos de exposição habitual e permanente.',
      'Os agentes nocivos não arrolados no Anexo IV do Decreto nº 3.048/99 não são considerados para fins de concessão da aposentadoria especial, ainda que devam permanecer geridos no âmbito do PGR/NR-1 para fins de saúde e segurança do trabalho.',
      'A comprovação da efetiva exposição do segurado a agentes nocivos, para fins de concessão do benefício, é feita mediante o Perfil Profissiográfico Previdenciário – PPP, elaborado pela empresa com base neste LTCAT, e transmitido ao INSS por meio do evento S-2240 do eSocial, conforme disciplinado pela Instrução Normativa PRES/INSS nº 128/2022 e alterações.',
    ],
  },
  {
    titulo: '11. CÓDIGOS GFIP/SEFIP/DCTFWEB E ESOCIAL — TABELA 24 E ALÍQUOTAS SUPLEMENTARES (SAT/RAT)',
    paragrafos: [
      'Para classificação da ocorrência de exposição a agentes nocivos, é utilizada a tabela de classificação de Agentes Nocivos do Anexo IV do Regulamento da Previdência Social (Decreto nº 3.048/99). Historicamente, para trabalhadores com um único vínculo empregatício, a GFIP adotava os códigos: 00 (nunca houve exposição a agente nocivo), 01 (houve exposição, posteriormente neutralizada), 02, 03 e 04 (exposição ensejadora de aposentadoria especial aos 15, 20 e 25 anos, respectivamente), aos quais correspondiam as alíquotas suplementares do SAT/RAT de 12%, 9% e 6% sobre a remuneração dos trabalhadores expostos, instituídas pela Lei nº 9.732, de 11 de dezembro de 1998. Para trabalhadores com mais de um vínculo empregatício, a GFIP adotava os códigos 05 a 08, com a mesma lógica de enquadramento.',
      'No ambiente do eSocial, a Tabela 24 (Código de Agentes Nocivos, Ergonômicos e de Risco) relaciona cada agente do Anexo IV do Decreto nº 3.048/99 ao respectivo código informado no evento S-2240, sendo os códigos genéricos de enquadramento: 01 (não ensejador de aposentadoria especial), 02 (ensejador de aposentadoria especial aos 15 anos — alíquota suplementar de 12%), 03 (ensejador de aposentadoria especial aos 20 anos — alíquota suplementar de 9%) e 04 (ensejador de aposentadoria especial aos 25 anos — alíquota suplementar de 6%).',
      'Paralelamente aos eventos de SST do eSocial, a apuração dos tributos e contribuições previdenciárias devidos pela empresa — incluindo as alíquotas suplementares do SAT/RAT decorrentes da exposição a agentes nocivos — é feita por meio da Declaração de Débitos e Créditos Tributários Federais Previdenciários e de Outras Entidades e Fundos (DCTFWeb), gerada a partir das escriturações do eSocial e da EFD-Reinf. A DCTFWeb tem caráter declaratório, constituindo confissão de dívida e instrumento hábil e suficiente para a exigência dos tributos apurados, cabendo à Procuradoria da Fazenda Nacional a inscrição em Dívida Ativa da União dos débitos não liquidados.',
      'Deixar de recolher a alíquota suplementar do SAT/RAT sem lastro em avaliação técnica conclusiva — isto é, presumir informalmente a ausência de exposição a agente nocivo, sem a elaboração deste laudo — expõe a empresa a passivo trabalhista e previdenciário caso a condição especial venha a ser reconhecida posteriormente, inclusive por via judicial, com efeitos retroativos.',
    ],
  },
  {
    titulo: '12. RELAÇÃO DO LTCAT COM O PPP E O ESOCIAL (S-2240)',
    paragrafos: [
      'O LTCAT tem papel central no preenchimento das informações do PPP e dos eventos de Saúde e Segurança do Trabalho do eSocial. As informações deste laudo alimentam diretamente o evento periódico S-2240 (Condições Ambientais do Trabalho — Agentes Nocivos), que registra, para cada trabalhador, o código do agente nocivo (Tabela 24), a técnica de avaliação utilizada, a intensidade ou concentração, os EPC e EPI utilizados e sua eficácia.',
      'Para atividades exercidas até 31 de dezembro de 2022, o PPP pode ser emitido no modelo físico, conforme a Instrução Normativa INSS nº 141/2022. Para atividades exercidas a partir de 1º de janeiro de 2023, o PPP deve ser emitido eletronicamente pelo aplicativo Meu INSS, com base exclusivamente nos eventos de SST do eSocial já transmitidos — não sendo mais possível o preenchimento manual do formulário físico para este período.',
      'O prazo de transmissão do evento S-2240 é até o dia 15 do mês subsequente ao da admissão do trabalhador, da alteração das condições ambientais de trabalho ou do início da obrigatoriedade do evento, sendo os primeiros envios responsáveis por registrar a carga inicial de todos os trabalhadores expostos da empresa. A falta de regularidade nos eventos de SST do eSocial compromete a emissão do PPP eletrônico do trabalhador junto ao INSS, motivo pelo qual este LTCAT deve ser mantido atualizado e utilizado como fonte primária de preenchimento desses eventos.',
    ],
  },
  {
    titulo: '13. EQUIPAMENTOS DE PROTEÇÃO E A DESCARACTERIZAÇÃO DA EXPOSIÇÃO A AGENTES NOCIVOS',
    paragrafos: [
      'Como regra geral, a adoção de Equipamento de Proteção Individual – EPI comprovadamente eficaz, que efetivamente neutralize a nocividade do agente ao qual o trabalhador está exposto, pode descaracterizar a exposição para fins de aposentadoria especial, nos termos da tese fixada pelo Supremo Tribunal Federal no julgamento do Tema 555 de Repercussão Geral (RE nº 664.335/SC): o direito à aposentadoria especial pressupõe a efetiva exposição do trabalhador a agente nocivo à sua saúde, de modo que, se o EPI for realmente capaz de neutralizar a nocividade, não haverá respaldo constitucional à aposentadoria especial.',
      'Há, contudo, uma exceção jurisprudencial relevante quanto ao agente físico ruído: segundo a segunda tese fixada no mesmo Tema 555, a declaração do empregador, no âmbito do PPP, de que o EPI é eficaz não descaracteriza o tempo de serviço especial para aposentadoria quando o agente é o ruído acima dos limites de tolerância. O fundamento é a ausência de comprovação científica e jurídica de EPI capaz de neutralizar integralmente os efeitos nocivos do ruído sobre a audição, ainda que reduza a intensidade percebida.',
      'Este LTCAT, ao avaliar cada agente nocivo, informa expressamente se o uso do EPI fornecido é ou não considerado eficaz para fins de descaracterização da exposição, observando a exceção legal e jurisprudencial aplicável ao agente ruído, de modo a subsidiar corretamente os campos correspondentes do PPP e do evento S-2240.',
    ],
  },
  {
    titulo: '14. RECOMENDAÇÕES TÉCNICAS GERAIS',
    paragrafos: [
      'Priorizar a eliminação dos riscos na fonte. Não sendo possível eliminá-los, neutralizá-los ou minimizá-los primeiramente por meio de Equipamentos de Proteção Coletiva – EPC e, apenas em segundo plano, por meio de Equipamentos de Proteção Individual – EPI apropriados ao fator de risco identificado, observando a ordem de prioridade das medidas de prevenção estabelecida pela NR-1.',
      'Realizar treinamentos de capacitação específicos para cada atividade, em razão dos riscos a que os trabalhadores estão expostos, além dos cursos de capacitação exigidos pelas Normas Regulamentadoras aplicáveis (NR-6, NR-9, NR-15, entre outras conforme o caso).',
      'Realizar auditorias periódicas de segurança e saúde do trabalho, para garantir o cumprimento efetivo dos procedimentos e medidas de proteção adotados, e cumprir rigorosamente o cronograma de ações definido no Programa de Gerenciamento de Riscos – PGR.',
      'Manter rigoroso controle documental quanto aos EPI fornecidos: evidências de compra, registros individuais de entrega e assinatura do trabalhador, periodicidade de substituição, validade e Certificado de Aprovação – CA de cada equipamento, treinamento para uso correto, condições de armazenamento e fiscalização efetiva quanto ao seu uso, de modo a lastrear tecnicamente a informação de eficácia declarada no PPP.',
      'Para os postos de trabalho administrativos e demais atividades de baixo risco ocupacional, recomenda-se ainda, como boa prática de prevenção de riscos ergonômicos e de acidentes: manter o local de trabalho limpo e organizado, evitando o acúmulo de objetos pesados ou cortantes em prateleiras e gavetas; manter as instalações e fiações elétricas em bom estado de conservação, evitando a sobrecarga de tomadas; posicionar ao alcance das mãos os materiais de uso frequente, reduzindo deslocamentos desnecessários; ajustar mobiliário, cadeira e monitor à estatura do trabalhador, mantendo ângulo de aproximadamente 90° entre pernas e tronco e entre antebraço e braço, com apoio para os pés quando necessário; garantir iluminação adequada à atividade desempenhada; sinalizar pisos molhados ou escorregadios; armazenar produtos químicos de limpeza em local identificado e restrito a pessoas habilitadas, sem reutilizar embalagens originais; e evitar a permanência prolongada em posição sentada, alternando pausas e mudanças de postura ao longo da jornada.',
      'Revisar este laudo sempre que houver mudança relevante nos processos, ambientes, tecnologias ou organização do trabalho, e observar atentamente os prazos do evento S-2240 do eSocial, cuja regularidade é condição para a correta emissão do PPP eletrônico dos trabalhadores expostos.',
    ],
  },
  {
    titulo: '15. VALIDADE, REVISÃO E DISPONIBILIZAÇÃO DO LAUDO',
    paragrafos: [
      'A legislação previdenciária não fixa prazo de validade determinado para o LTCAT. Contudo, a empresa tem o dever legal de mantê-lo atualizado, devendo revisá-lo sempre que houver mudança nos processos, ambientes, tecnologias ou organização do trabalho capaz de alterar a natureza, a intensidade ou a caracterização da exposição a agentes nocivos.',
      'Recomenda-se, como boa prática técnica, a revisão periódica deste laudo em prazo não superior a 2 (dois) anos, em alinhamento com o ciclo de revisão do inventário de riscos previsto na NR-1 para o PGR.',
      'Nos termos do item 15.4.1.3 da NR-15, incluído pela Portaria MTE nº 2.021/2025, o laudo caracterizador da insalubridade deve permanecer disponível aos trabalhadores interessados, ao sindicato representativo da categoria profissional e à fiscalização do trabalho, sempre que solicitado.',
    ],
  },
  {
    titulo: '16. CONCLUSÃO',
    paragrafos: [
      'Este Laudo Técnico das Condições Ambientais do Trabalho foi elaborado com fundamento no art. 58 da Lei nº 8.213/1991, no art. 68 do Decreto nº 3.048/99 e na NR-15, com o objetivo de identificar, descrever e avaliar tecnicamente os agentes nocivos presentes nos ambientes de trabalho da empresa, subsidiando a correta emissão do PPP e a informação do evento S-2240 do eSocial.',
      'As conclusões técnicas por Grupo Homogêneo de Exposição — incluindo o enquadramento, ou não, para fins de aposentadoria especial e o respectivo código da Tabela 24 do eSocial — constam de seção específica deste documento, refletindo as condições de trabalho verificadas na data das avaliações realizadas. Este laudo deve ser revisado sempre que ocorrerem alterações relevantes nos processos, ambientes ou medidas de proteção.',
    ],
  },
  {
    titulo: '17. REFERÊNCIAS BIBLIOGRÁFICAS',
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
