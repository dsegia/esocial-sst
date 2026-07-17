// PCMSO Completo — Conteúdo robusto baseado em NR-7, NR-9, NR-15, NR-17
export interface SecaoPcmso {
  id: string
  titulo: string
  conteudo: string
  subsecoes?: Array<{ titulo: string; conteudo: string }>
  tabelas?: Array<{ titulo: string; linhas: string[][] }>
}

export const SECOES_PCMSO: SecaoPcmso[] = [
  {
    id: 'perfil-profissiografico',
    titulo: 'Perfil Profissiográfico',
    conteudo: `O Perfil Profissiográfico do trabalhador constando todas as condições a que o mesmo esteve exposto, suas reações e estado físico perante estas exposições a lhe ser entregue quando do desligamento, ou na forma da lei, deverá ser preenchido por preposto administrativo da empresa e as informações de monitoramento biológico serão encaminhadas diretamente ao perito do INSS quando couber em cumprimento à resolução nº 1.715 de 08 de janeiro de 2004 do CFM – Conselho Federal de Medicina.

Descrição dos perfis profissionais cadastrados na empresa com suas funções, setores, GHEs (Grupos Homogêneos de Exposição) e riscos associados.`,
    subsecoes: [
      {
        titulo: 'Informações por Função',
        conteudo: `Cada função cadastrada deve conter:
• Nome da função conforme CBO (Classificação Brasileira de Ocupações)
• Setor/departamento de atuação
• GHE (Grupo Homogêneo de Exposição) vinculado
• Descrição detalhada das atividades principais
• Equipamentos utilizados
• Produtos químicos ou agentes biológicos manipulados`
      },
      {
        titulo: 'Mapeamento de Riscos',
        conteudo: `Os riscos identificados no PGR (Programa de Gerenciamento de Riscos) devem estar vinculados ao perfil profissiográfico para estabelecer a base dos exames médicos ocupacionais e monitoramento biológico.

Cada função deve ter documentado:
• Riscos físicos presentes
• Riscos químicos
• Riscos biológicos
• Riscos ergonômicos
• Riscos de acidentes
• Matriz de exposição por GHE`
      }
    ]
  },
  {
    id: 'classificacao-riscos',
    titulo: 'Classificação dos Riscos',
    conteudo: `O Médico Coordenador do PCMSO deve conhecer todos os setores da empresa, e deve estar apto a realizar análise qualitativa dos ambientes de trabalho, assim como análise das atividades de trabalho, dos produtos e instrumentos de trabalho utilizados nas diversas atividades laborais de forma a identificar os possíveis riscos e/ou situação que possam gerar danos à saúde do empregado.

Conforme NR-1 e NR-9, os riscos ocupacionais são classificados em:`,
    subsecoes: [
      {
        titulo: 'Riscos Físicos',
        conteudo: `DEFINIÇÃO: São as diversas formas de energia a que podem estar submetidos os trabalhadores, como: ruído, calor, frio, umidade, vibrações, radiações, infra-som, ultra-som e pressões anormais.

FONTE GERADORA: São geradas por máquinas, equipamentos, ferramentas elétricas e condições ambientais de trabalho.

DANOS À SAÚDE: PAIR – Perda Auditiva Induzida pelo Ruído, stress, fadiga, mutilamento, queda de nível diferente, queda de mesmo nível, queda de material, corpo estranho nos olhos, cortes e perfurações, entre outros.

MONITORAMENTO: Audiometria, espirometria, dosimetria e exames clínicos periódicos.`
      },
      {
        titulo: 'Riscos Químicos',
        conteudo: `DEFINIÇÃO: São substâncias compostas ou produtos e fórmulas químicas, capazes de penetrar no organismo através da pele, por via respiratória e oral, nas formas de poeira, fumos, névoas, neblina, gases ou vapores.

FONTE GERADORA: Serviços de pintura e preparação de tintas, manuseio de solventes e queima de eletrodos, entre outros.

DANOS À SAÚDE: Irritação respiratória, intoxicação por fumos metálicos, dermatoses, pneumoconioses e outros.

MONITORAMENTO: Dosimetria pessoal, exame toxicológico, hemograma completo e espirometria conforme exposição.`
      },
      {
        titulo: 'Riscos Biológicos',
        conteudo: `DEFINIÇÃO: São as bactérias, fungos, bacilos, parasitas, protozoários, vírus, entre outras formas vivas de penetração no organismo humano.

FONTE GERADORA: Serviços de drenagem e limpeza de canais, esgotos, escavação de aterro sanitário, ausência de fossas sépticas e vasos sanitários no canteiro de obras.

DANOS À SAÚDE: Infecções, diarréias, viroses, leptospirose e outros.

MONITORAMENTO: Sorologia (hepatite B, hepatite C, HIV), hemograma completo e avaliação clínica.`
      },
      {
        titulo: 'Riscos Ergonômicos',
        conteudo: `DEFINIÇÃO: São máquinas, equipamentos e condições de trabalho incompatíveis com as características psicológicas e físicas do trabalhador, ou qualquer outra forma de interação inadequada entre o trabalhador e o seu ambiente laboral.

FONTE GERADORA: São atividades que exigem movimentos repetitivos como operar máquinas de escritório, digitar, transporte de materiais diversos, posturas desconfortáveis e inadequadas, dirigir veículos e/ou operar equipamentos e máquinas.

DANOS À SAÚDE: Lesões por Esforço Repetitivo – LER ou Doença Ósteo-Ligamentar Relacionada ao Trabalho – DORT, tendo como consequência as tenossinovites, epicondilites, lombalgias, cervicalgias e hérnias inguinais.

AVALIAÇÃO: AET (Análise Ergonômica do Trabalho), exame clínico e avaliação psicossocial.`
      },
      {
        titulo: 'Riscos de Acidentes',
        conteudo: `DEFINIÇÃO: São situações favoráveis a ocorrência de acidentes do trabalho, provocada consciente ou inconscientemente pela empresa ou pelos trabalhadores e classificam-se como atos inseguros e condições inseguras de trabalho.

ATOS INSEGUROS: São atos inerentes à personalidade ou estado de bom humor do trabalhador e resulta de vários fatores pessoais como: pressa, preguiça, distrações, desatenção, uso de drogas, problemas familiares, resistência às normas de segurança.

CONDIÇÕES INSEGURAS: São falhas ou situações que podem provocar acidentes ou doenças que dependem exclusivamente da empresa, como: falta de EPI; ferramentas e equipamentos defeituosos; arrumações inadequadas de materiais; falta de sinalização, de ordem e limpeza, falta de proteção quanto à queda de materiais ou intempéries, instalações elétricas deficientes, escadas ou acesso improvisados, falta de proteção em máquinas e equipamentos e contra quedas de altura.`
      }
    ],
    tabelas: [
      {
        titulo: 'Classificação de Riscos Segundo NR-1 e NR-9',
        linhas: [
          ['CATEGORIA', 'EXEMPLOS', 'MONITORAMENTO RECOMENDADO'],
          ['FÍSICOS', 'Ruído > 85 dB(A), Vibração, Calor > 30°C, Frio < 0°C, Pressão anormal', 'Audiometria, Espirometria, Exame Clínico, Dosimetria'],
          ['QUÍMICOS', 'Solventes, Ácidos, Bases, Fumos Metálicos, Poeiras, Nevoas', 'Dosimetria, Hemograma, Exame Toxicológico, Avaliação Respiratória'],
          ['BIOLÓGICOS', 'Vírus, Bactérias, Fungos, Parasitas, Bacilos', 'Sorologia, Hemograma Completo, Cultura, Avaliação Clínica'],
          ['ERGONÔMICOS', 'Postura inadequada, Repetitividade > 2x/min, Levantamento peso', 'AET, Exame Clínico, Avaliação Psicossocial, Rx coluna'],
          ['ACIDENTES', 'Máquinas sem proteção, Eletricidade, Quedas altura, Cortes', 'Inspeção, Treinamento, Exame Clínico, Investigação CAT']
        ]
      }
    ]
  },
  {
    id: 'primeiros-socorros',
    titulo: 'Primeiros Socorros',
    conteudo: `Todo estabelecimento deverá estar equipado com material necessário a prestação dos primeiros socorros, considerando-se as características da atividade desenvolvida; manter esse material guardado em local adequado, e aos cuidados de pessoa treinada para esse fim. (Portaria SSST N° 24, de 29 de dezembro de 1994).

Kit de Primeiros Socorros deve conter:
• Tesoura ponta romba (1 un)
• Termômetro
• Luvas Cirúrgicas descartáveis (5 pares)
• Gaze Estéril (5 pacotes)
• Soro Fisiológico (1 un)
• Atadura de crepe (5 un)
• Band Aid (1 caixa)
• Clorexidina Spray (1 un)
• Micropore (1 un)
• Esparadrapo (1 un)`,
    subsecoes: [
      {
        titulo: 'Procedimentos Básicos',
        conteudo: `1. Manter a calma e afastar o acidentado do agente causador
2. Verificar responsividade e respiração
3. Chamar o SAMU (192) ou orientar encaminhamento para a UPA/Hospital
4. Prestar primeiros socorros conforme treinamento (RCP, compressão abdominal, etc)
5. Registrar todas as ações e hora do atendimento
6. Manter o acidentado em local seguro e aquecido enquanto aguarda resgate`
      },
      {
        titulo: 'Casos Específicos',
        conteudo: `INTOXICAÇÃO: Remover o agente, arejar local, encaminhar para atendimento médico, levar informações sobre o produto.

QUEIMADURA: Esfriar com água por 10-20 minutos, não remover aderências, cobrir com pano limpo estéril, encaminhar imediatamente.

FRATURAS: Imobilizar o membro, aplicar gelo local, elevar se possível, encaminhar para hospital.

HEMORRAGIA: Fazer compressão com gaze/pano limpo, elevar membro se possível, manter pressão até cessar sangramento.

CHOQUE ELÉTRICO: Desligar fonte, afastar o acidentado, verificar respiração, iniciar RCP se necessário.

EMERGÊNCIAS: Sempre acionar o resgate/bombeiros (193) que conduzirá o acidentado ao primeiro atendimento.`
      }
    ]
  },
  {
    id: 'ppr',
    titulo: 'PPR (Programa de Proteção Respiratória)',
    conteudo: `OBJETIVO: Realizar o controle eficaz de uso e indicação do equipamento adequado para o controle das doenças ocupacionais provocadas pela inalação de ar contaminado com poeiras, fungos, nevoas, fumaças, gases e vapores, conforme NR-6, item 6.5.1 a 6.5.3.

SELEÇÃO DE RESPIRADORES: Devemos levar em conta o biótipo do trabalhador, hábitos e costumes, para que possamos avaliar os seguintes itens que podem prejudicar o bom funcionamento do respirador:

• Barba, bigode, costeletas e cabelos longos, cicatrizes profunda, prótese dentária – Dificultam a vedação
• Não deve ser usado bonés ou gorros que comprometam vedação
• Tomar cuidado com os tirantes do respirador para não envolver partes de capacete ou máscaras
• Tomar cuidado com o uso de lentes corretivas, óculos de proteção ou ocular
• Uso de lentes de contato não é indicado devido a contaminação por aerodispersoídes
• Ter cuidado ao falar alto para não deslocar o respirador`,
    subsecoes: [
      {
        titulo: 'Tipos de Respiradores',
        conteudo: `RESPIRADOR PURIFICADOR DE AR:
a) Para proteção contra poeiras e névoas (P1)
b) Para proteção contra poeiras, névoas e fumos (P2)
c) Para proteção contra poeiras, névoas, fumos e radionuclídeos (P3)
d) Para proteção contra vapores orgânicos em concentração < 50 ppm
e) Para proteção contra gases emanados de produtos químicos
f) Para proteção contra partículas e gases químicos
g) Respirador motorizado para proteção contra poeiras, névoas, fumos

RESPIRADOR DE ADUÇÃO DE AR:
a) Linha de ar comprimido para atmosferas IPVS (Imediatamente Perigosa à Vida e Saúde)
b) Máscara autônoma de circuito aberto ou fechado para atmosferas IPVS

RESPIRADOR DE FUGA:
a) Para escape de atmosferas imediatamente perigosas ou com O2 < 18%`
      },
      {
        titulo: 'Treinamento e Testes de Vedação',
        conteudo: `TREINAMENTO deve abranger:
1. Empregado: Conhecer o respirador, aprender a manobrar com o aparelho
2. Líder: Conhecer o aparelho, resolver problemas, treinar, escolher o adequado
3. Almoxarife: Distribuir o respirador adequado

TESTES DE VEDAÇÃO:
1. Teste da sacarina: Filtros P1, P2, P3 para aerodispersoídes
2. Teste Acetato de isoamila (óleo de banana): Para sensibilidade gustativa
3. Teste da fumaça-irritante: Para filtros P3 e vapores

MANUTENÇÃO:
• Verificar validade e vida útil
• Inspecionar peças e borrachas danificadas
• Proteger contra agentes químicos e físicos
• Evitar choque, luz solar, calor, frio, umidade`
      }
    ]
  },
  {
    id: 'pca',
    titulo: 'PCA (Programa de Conservação Auditiva)',
    conteudo: `OBJETIVOS:
1. Estabelecer diretrizes para avaliação e acompanhamento de audição
2. Fornecer subsídios para prevenção da perda auditiva induzida por ruído (PAIR)
3. Conservação da saúde auditiva conforme NR-15, Anexo 1

Todos os empregados em ambientes com níveis de pressão sonora acima dos níveis de ação (80 dB(A)) devem ser submetidos a exames audiométricos de referência e sequenciais.`,
    subsecoes: [
      {
        titulo: 'Definições e Caracterizações',
        conteudo: `RUÍDO CONTÍNUO: Variação < 5 dB(A) ao longo do período
RUÍDO INTERMITENTE: Variação > 5 dB(A) ao longo do período
RUÍDO DE IMPACTO: Picos de pressão sonora com duração < 1 segundo, intervalo > 1 segundo

NÍVEL DE AÇÃO: 80 dB(A) - requer vigilância, treinamento
LIMITE DE EXPOSIÇÃO: 90 dB(A) - não pode ser excedido com EPI

PAIR (Perda Auditiva Induzida por Ruído): Padrão com entalhe em 3-6 kHz (tipicamente 4 kHz)`
      },
      {
        titulo: 'Periodicidade de Exames',
        conteudo: `AUDIOMETRIA OBRIGATÓRIA:
• Admissional
• Anual (tendo como referência exame admissional)
• Demissional (até 120 dias antes da finalização)

INTERVALO: Pode ser reduzido a critério do médico do trabalho

REPOUSO AUDITIVO: Mínimo de 14 horas antes do exame

FREQUÊNCIAS: 500, 1.000, 2.000, 3.000, 4.000, 6.000 e 8.000 Hz

AMBIENTE: Cabina audiométrica conforme ISO 8253-1`
      },
      {
        titulo: 'Interpretação de Resultados',
        conteudo: `LIMITES ACEITÁVEIS:
• Limiares ≤ 25 dB(NA) em todas as frequências = NORMAL

SUGESTIVO DE PAIR:
• Audiograma com limiares > 25 dB(NA) em 3000, 4000 e/ou 6000 Hz
• Entalhe típico em frequências altas

DIAGNÓSTICO:
• Análise clínica e ocupacional
• História ocupacional e pregressa
• Idade e tempo de exposição
• Demanda auditiva do trabalho
• Exposições não ocupacionais
• Capacitação profissional

EVOLUÇÃO SEQUENCIAL:
• Diferença ≥ 10 dB(NA) em frequências 3000, 4000, 6000 Hz = AGRAVAMENTO
• Piora ≥ 15 dB(NA) em frequência isolada = AGRAVAMENTO`
      }
    ],
    tabelas: [
      {
        titulo: 'Limites de Tolerância NR-15 Anexo 1 - Ruído Contínuo/Intermitente',
        linhas: [
          ['NÍVEL SONORO dB(A)', 'TEMPO DE EXPOSIÇÃO MÁXIMA'],
          ['80', 'Sem limite (exige vigilância)'],
          ['82', '16 horas'],
          ['83', '13,6 horas'],
          ['85', '8 horas'],
          ['86', '6,4 horas'],
          ['87', '5,1 horas'],
          ['88', '4,1 horas'],
          ['89', '3,2 horas'],
          ['90', '2,5 horas'],
          ['91', '2 horas'],
          ['92', '1,6 horas'],
          ['93', '1,3 horas'],
          ['94', '1 hora'],
          ['95', '48 minutos']
        ]
      }
    ]
  },
  {
    id: 'programa-ergonomico',
    titulo: 'Programa Ergonômico',
    conteudo: `APRESENTAÇÃO: O Programa Ergonômico visa estabelecer os critérios básicos para prevenção de acidentes e doenças ocupacionais do Trabalho conforme NR-17.

A ergonomia envolve a aplicação dos conhecimentos sobre as características do ser humano para beneficiar seu bem-estar físico e mental e os resultados de seu trabalho e da empresa. Toda atividade industrial pode ser vista como um sistema homem-máquina dentro de um ambiente de produção.

OBJETIVO: Adaptar as condições de trabalho, dando um arranjo à área de trabalho para economia de movimentos, redução de manipulações e repetições, melhora do ritmo do trabalho, adequação do formato ao operador.`,
    subsecoes: [
      {
        titulo: 'Fatores Ergonômicos Principais',
        conteudo: `Conforme NR-17 devem ser avaliados:

1. LEVANTAMENTO, TRANSPORTE E DESCARGA INDIVIDUAL DE MATERIAIS
   • Peso máximo: 23 kg (mulher), 25 kg (homem)
   • Técnica adequada de levantamento
   • Frequência de movimentos

2. MOBILIÁRIO DOS POSTOS DE TRABALHO
   • Mesas com altura adequada
   • Cadeiras com regulagem de altura e encosto
   • Apoio de pés quando necessário

3. EQUIPAMENTOS DOS POSTOS DE TRABALHO
   • Posicionamento do monitor: altura dos olhos
   • Teclado e mouse ergonômicos
   • Suporte para documentos

4. CONDIÇÕES AMBIENTAIS DE TRABALHO
   • Iluminação: 300-500 lux para atividades comuns
   • Temperatura: 20-23°C
   • Umidade relativa: 40-60%
   • Ruído: < 85 dB(A)

5. ORGANIZAÇÃO DO TRABALHO
   • Pausas regulares (5-10 min a cada 2 horas)
   • Rodízio de atividades
   • Ritmo adequado
   • Controle sobre o trabalho`
      },
      {
        titulo: 'Postura Ergonomicamente Correta',
        conteudo: `TRABALHO SENTADO:
• Cadeira com altura ajustável (pés apoiados no chão)
• Costas apoiadas no encosto (ângulo 95-110°)
• Cotovelos flexionados 90°, antebraço sobre a mesa
• Monitor à altura dos olhos, distância 50-70 cm
• Teclado próximo ao corpo, sem extensão de punho

TRABALHO EM PÉ:
• Distribuição equilibrada do peso entre os dois pés
• Flexão leve dos joelhos para absorver impacto
• Coluna ereta, ombros relaxados
• Antepés voltados levemente para frente
• Sapato com salto 2-3 cm, solado confortável

LEVANTAMENTO DE PESO:
• Manter a coluna reta (não curvar)
• Agachar com flexão de joelho (não cintura)
• Manter o objeto próximo ao corpo
• Levantar com pernas (não costas)
• Nunca girar o tronco com peso nos ombros`
      },
      {
        titulo: 'Procedimento para Aquecimento',
        conteudo: `AQUECIMENTO PRÉ-TURNO (5 minutos):
• Rotação de pescoço: 10 movimentos circulares para cada lado
• Flexão de ombros: 10 movimentos para frente, 10 para trás
• Alongamento de coluna: inclinação lateral esquerda/direita (15 seg cada)
• Rotação de tronco: 10 rotações para cada lado
• Alongamento de pernas: flexão de quadril, estresse em posterior (15 seg cada)
• Rotação de tornozelos: 10 movimentos em cada pé

EXERCÍCIOS A CADA 2 HORAS (3-5 minutos):
• Alongamento de pescoço (flexão/extensão, inclinação)
• Alongamento de ombros (levantamento, rotação)
• Alongamento de antebraço (extensão/flexão de punho)
• Alongamento de coluna (torção, inclinação)`
      }
    ]
  },
  {
    id: 'criterios-cat',
    titulo: 'Critérios para Abertura de CAT',
    conteudo: `A Comunicação de Acidente do Trabalho (CAT) é obrigatória quando ocorre lesão ou doença relacionada ao trabalho.

SITUAÇÕES QUE EXIGEM CAT:
1. ACIDENTE TÍPICO: Lesão decorrente de ação súbita do ambiente de trabalho
2. ACIDENTE DE TRAJETO: Lesão ocorrida no percurso residência-trabalho ou trabalho-residência
3. DOENÇA OCUPACIONAL: Contraída no ambiente de trabalho (comprovada relação com atividade)
4. DOENÇA PROFISSIONAL: Inerente a determinadas profissões (PAIR, silicose, asbestose)

OBSERVAÇÃO: Afastamento por qualquer motivo relacionado ao acidente/doença ocupacional exige CAT`,
    subsecoes: [
      {
        titulo: 'Procedimento de Abertura',
        conteudo: `1. Comunicação ao empregador dentro de 24h do acidente
2. Emissão da CAT (papel ou digital) em até 24h do conhecimento
3. Registro na seguradora ou INSS conforme regime
4. Cópia para o trabalhador (protocolo)
5. Documentação: croqui, fotos, testemunhas, avaliação médica

PRAZOS:
• Abertura: até 24h após o acidente
• Entrega ao trabalhador: até 24h da emissão
• Registro no INSS: até 15 dias (sem afastamento) ou até retorno (com afastamento)`
      }
    ]
  },
  {
    id: 'fluxo-atendimento-acidente',
    titulo: 'Fluxo de Atendimento a Acidentes',
    conteudo: `Procedimento padrão desde o momento do acidente até o encerramento do caso.

ETAPAS DO FLUXO:
1. IMEDIATO: Comunicação ao supervisor/gerente
2. PRIMEIROS SOCORROS: Avaliação inicial e estabilização
3. COMUNICAÇÃO: Notificar à segurança e médico coordenador
4. AVALIAÇÃO MÉDICA: Atendimento clínico no dia do acidente
5. CAT: Emissão da Comunicação de Acidente do Trabalho em até 24h
6. ACOMPANHAMENTO: Exames complementares conforme necessidade
7. REABILITAÇÃO: Reintegração gradual às atividades
8. ENCERRAMENTO: Alta médica ou afastamento permanente`,
    subsecoes: [
      {
        titulo: 'Procedimentos do SESMT Após Socorro',
        conteudo: `Em caso de acidente de trabalho Típicos e de trajeto, será feito pelo SESMT da Empresa a Investigação de Acidente do Trabalho registrado em formulário padrão (que ficará sob arquivo do próprio SESMT), para posterior análise e emissão do Comunicado de Acidente do Trabalho (CAT).

O fluxo de atendimento de urgência e emergências deve ser orientado para o Hospital Conveniado com atendimento de emergência mais próximo.

A Empresa oferece plano de saúde para seus funcionários, a fim de garantir Assistência de Saúde integral a seus colaboradores.`
      }
    ]
  },
  {
    id: 'programa-vacinacao',
    titulo: 'Programa de Vacinação',
    conteudo: `Programa de imunização conforme calendário recomendado pela Organização Mundial de Saúde (OMS) e regulamentação brasileira (ANVISA/MS).

VACINAS RECOMENDADAS:

ROTINA (todos os trabalhadores):
• TÉTANO: 3 doses iniciais (0, 1, 6 meses), reforço a cada 10 anos
• HEPATITE B: 3 doses (0, 1, 6 meses), sorologias 30 dias após
• HEPATITE A: 2 doses (0, 6 meses) ou conforme faixa etária
• DIFTERIA/COQUELUCHE: 1 reforço (dTpa)

CONFORME RISCO:
• TUBERCULOSE (BCG): Uma dose (se sem cicatriz)
• FEBRE AMARELA: 1 dose (reforço a cada 10 anos)
• RAIVA: Conforme exposição (veterinários, coletores de lixo)
• RUBÉOLA/CAXUMBA/SARAMPO: Conforme sorologia
• INFLUENZA: Anual (outono)
• PNEUMOCOCO: Conforme faixa etária`,
    subsecoes: [
      {
        titulo: 'Verificação de Status Vacinal',
        conteudo: `ADMISSIONAL:
• Revisar caderneta de vacinação
• Solicitar sorologias se não houver comprovação
• Atualizar vacinação conforme deficiências

PERIÓDICO:
• Reforços de Tétano (a cada 10 anos)
• Influenza (anual)
• Conforme novo calendário recomendado

REGISTRO E ACOMPANHAMENTO:
• Manter cópia da caderneta ou registro eletrônico
• Documentar sorologias (anti-HBs, anti-HAV, etc)
• Registrar reações adversas
• Encaminhar para vacinação conforme cronograma
• Informar trabalhador sobre próximas doses`
      }
    ]
  }
]
