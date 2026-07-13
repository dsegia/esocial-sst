// PCMSO Completo — 16 seções robustas com normas NBR, NR-7, NR-9, NR-15, NR-17
// Conteúdo estruturado para exibição em abas/seções interativas

export interface SecaoPcmso {
  id: string
  titulo: string
  conteudo: string
  subsecoes?: Array<{ titulo: string; conteudo: string }>
  tabelas?: Array<{ titulo: string; linhas: string[][] }>
  imagem?: string // URL ou data URI
}

export const SECOES_PCMSO: SecaoPcmso[] = [
  {
    id: 'perfil-profissiografico',
    titulo: '1. Perfil Profissiográfico',
    conteudo: `Descrição dos perfis profissionais cadastrados na empresa com suas funções, setores, GHEs (Grupos Homogêneos de Exposição) e riscos associados.`,
    subsecoes: [
      {
        titulo: 'Informações por Função',
        conteudo: `Cada função cadastrada deve conter: nome da função, CBO (Classificação Brasileira de Ocupações), setor/departamento, GHE vinculado e descrição das atividades principais.`
      },
      {
        titulo: 'Mapeamento de Riscos',
        conteudo: `Os riscos identificados no PGR (Programa de Gerenciamento de Riscos) devem estar vinculados ao perfil profissiográfico para estabelecer a base dos exames médicos ocupacionais e monitoramento biológico.`
      }
    ]
  },
  {
    id: 'classificacao-riscos',
    titulo: '2. Classificação dos Riscos',
    conteudo: `Conforme NR-1 e NR-9, os riscos ocupacionais são classificados em:`,
    subsecoes: [
      {
        titulo: 'Riscos Físicos',
        conteudo: `Ruído, vibração, radiações ionizantes, radiações não ionizantes, temperaturas extremas, pressões anormais e iluminação inadequada. Monitorados através de audiometria, espirometria, dosimetria e exames clínicos.`
      },
      {
        titulo: 'Riscos Químicos',
        conteudo: `Poeiras, fumos, gases, vapores e névoas. Monitorados através de dosimetria pessoal, exame toxicológico, hemograma completo e espirometria conforme exposição.`
      },
      {
        titulo: 'Riscos Biológicos',
        conteudo: `Bactérias, vírus, fungos, parasitas e outros agentes biológicos. Monitorados através de sorologia (hepatite B, hepatite C, HIV), hemograma completo e avaliação clínica.`
      },
      {
        titulo: 'Riscos Ergonômicos',
        conteudo: `Postura, repetitividade, esforço físico, levantamento de peso, ritmo de trabalho. Avaliação através de AET (Análise Ergonômica do Trabalho), exame clínico e avaliação psicossocial.`
      },
      {
        titulo: 'Riscos de Acidentes',
        conteudo: `Máquinas inadequadas, equipamentos sem proteção, eletricidade, incêndio, explosão. Monitorados através de inspeções, treinamentos e exame clínico periódico.`
      }
    ],
    tabelas: [
      {
        titulo: 'Classificação de Riscos Segundo NR-1 e NR-9',
        linhas: [
          ['Categoria', 'Exemplos', 'Monitoramento Recomendado'],
          ['Físicos', 'Ruído > 85 dB(A), Vibração, Calor > 30°C, Frio < 0°C', 'Audiometria, Espirometria, Exame Clínico'],
          ['Químicos', 'Solventes, Ácidos, Bases, Fumos Metálicos', 'Dosimetria, Hemograma, Exame Toxicológico'],
          ['Biológicos', 'Vírus, Bactérias, Fungos', 'Sorologia, Hemograma Completo'],
          ['Ergonômicos', 'Postura inadequada, Repetitividade > 2x/min', 'AET, Exame Clínico, Avaliação Psicossocial'],
          ['Acidentes', 'Máquinas sem proteção, Eletricidade', 'Inspeção, Treinamento, Exame Clínico']
        ]
      }
    ]
  },
  {
    id: 'primeiros-socorros',
    titulo: '3. Primeiros Socorros',
    conteudo: `Procedimentos imediatos em caso de acidentes ou emergências ocupacionais.`,
    subsecoes: [
      {
        titulo: 'Procedimentos Básicos',
        conteudo: `1. Manter a calma e afastar o acidentado do agente causador
2. Verificar responsividade e respiração
3. Chamar o SAMU (192) ou orientar encaminhamento para a UPA/Hospital
4. Prestar primeiros socorros conforme treinamento (RCP, compressão abdominal, etc)
5. Registrar todas as ações e hora do atendimento`
      },
      {
        titulo: 'Casos Específicos',
        conteudo: `Intoxicação: remover o agente, arejar local, encaminhar para atendimento médico
Queimadura: esfriar com água por 10-20 minutos, não remover aderências
Fraturas: imobilizar o membro, aplicar gelo local, encaminhar para hospital
Hemorragia: fazer compressão com gaze/pano limpo, elevar membro se possível
Choque Elétrico: desligar fonte, afastar o acidentado, verificar respiração`
      }
    ]
  },
  {
    id: 'cronograma-acoes',
    titulo: '4. Cronograma de Ações',
    conteudo: `Planejamento anual de ações de saúde ocupacional integradas ao calendário da empresa.`,
    tabelas: [
      {
        titulo: 'Exemplo de Cronograma Anual',
        linhas: [
          ['Mês', 'Ação', 'Responsável', 'Meta'],
          ['Jan', 'Exames Admissionais', 'Médico Coordenador', '100% dos novos admitidos'],
          ['Fev', 'Audiometria Periódica (Expostos a Ruído)', 'Médico + Clínica', '100% dos expostos'],
          ['Mar', 'Treinamento de Primeiros Socorros', 'Segurança do Trabalho', '100% da empresa'],
          ['Abr', 'Avaliação Ergonômica (AET)', 'Eng. de Segurança', '50% da empresa'],
          ['Mai', 'Campanhas de Vacinação', 'Médico Coordenador', '100% da empresa'],
          ['Jun', 'Revisão do PGR e PCMSO', 'Médico + SIPA', 'Relatório completo'],
          ['Jul', 'Espirometria (Expostos a Pó/Vapor)', 'Clínica', '100% dos expostos'],
          ['Ago', 'Avaliação Psicossocial (se indicado)', 'Psicólogo/Médico', 'Conforme demanda'],
          ['Set', 'Exames Demissionais', 'Médico Coordenador', '100% dos desligados'],
          ['Out', 'Hemograma Completo (Rotina)', 'Clínica', '50% da empresa'],
          ['Nov', 'Treinamento em Segurança', 'Segurança do Trabalho', '100% da empresa'],
          ['Dez', 'Análise de Resultados e Planejamento Próximo Ano', 'Médico', 'Relatório Anual']
        ]
      }
    ]
  },
  {
    id: 'fluxo-acidente',
    titulo: '5. Fluxo de Atendimento a Acidente do Trabalho',
    conteudo: `Procedimento padrão desde o momento do acidente até o encerramento do caso.`,
    subsecoes: [
      {
        titulo: 'Etapas do Fluxo',
        conteudo: `1. IMEDIATO: Comunicação ao supervisor/gerente
2. PRIMEIROS SOCORROS: Avaliação inicial e estabilização conforme item 3
3. COMUNICAÇÃO: Notificar à segurança e médico coordenador
4. AVALIAÇÃO MÉDICA: Atendimento clínico no dia do acidente
5. CAT: Emissão da Comunicação de Acidente do Trabalho em até 24h
6. ACOMPANHAMENTO: Exames complementares conforme necessidade
7. REABILITAÇÃO: Reintegração gradual às atividades
8. ENCERRAMENTO: Alta médica ou afastamento permanente`
      }
    ]
  },
  {
    id: 'fluxo-emergencias',
    titulo: '6. Fluxo de Atendimento a Emergências e Primeiros Socorros',
    conteudo: `Procedimentos para situações de risco iminente à vida.`,
    subsecoes: [
      {
        titulo: 'Emergências Incluídas',
        conteudo: `Choque Anafilático: adrenalina IM, deitar com pernas elevadas, encaminhar SAMU
Infarto: repouso imediato, nitrato sublingual, oxigênio, ECG, encaminhar SAMU
Acidente Vascular Cerebral (AVC): repouso, verificar hora do início, encaminhar SAMU urgente
Parada Cardiorrespiratória: iniciar RCP imediatamente, chamar SAMU, desfibrilador se disponível
Intoxicação Aguda: remover fonte, descontaminação, encaminhar SAMU com amostra do agente
Queimadura Grave: esfriar água corrente, encaminhar SAMU, não remover roupas aderidas
Trauma Grave: imobilizar, encaminhar SAMU, não movimentar desnecessariamente`
      }
    ]
  },
  {
    id: 'ppr',
    titulo: '7. Programa de Proteção Respiratória (PPR)',
    conteudo: `Conforme NR-6, item 6.5.1 a 6.5.3, estabelece requisitos para uso de equipamentos de proteção respiratória.`,
    subsecoes: [
      {
        titulo: 'Objetivos do PPR',
        conteudo: `1. Proteger trabalhadores contra inhalação de agentes contaminantes
2. Estabelecer critérios para seleção do equipamento adequado
3. Garantir uso correto através de treinamento
4. Realizar testes de vedação (fit test) periódicos
5. Manter inspeção e manutenção dos equipamentos`
      },
      {
        titulo: 'Seleção do Equipamento',
        conteudo: `A seleção baseia-se em:
- Agente contaminante identificado (gás, vapor, partícula)
- Concentração ambiental vs. Limite de Exposição Ocupacional (LEO)
- Fator de Proteção Requerido (FPR)
- Nível de Oxigênio do ambiente (mínimo 19,5%)`
      },
      {
        titulo: 'Tipos de Equipamentos',
        conteudo: `- Respirador Purificador de Ar (filtro P1, P2, P3 ou carvão ativado)
- Respirador de Adução de Ar (tubo com compressor ou cilindro)
- Respirador Autônomo (cilindro de ar contido no equipamento)
- Máscaras Autoadesivas (uso único para particulados)`
      },
      {
        titulo: 'Treinamento e Fit Test',
        conteudo: `ANTES DO USO:
1. Treinamento teórico: partes do equipamento, modo correto de colocação, limitações
2. Treinamento prático: colocação, vedação, respiração, movimento
3. Teste de Vedação Qualitativo (qualitative fit test): isoamyl acetate (smell test) ou sacarina
4. Teste de Vedação Quantitativo (quantitative fit test): equipamento especial, mínimo Fator 100

PERIODICIDADE:
- Anual obrigatório
- Antes do uso se houver alteração na geometria facial (peso, barba, etc)
- Imediatamente após qualquer incidente`
      }
    ]
  },
  {
    id: 'pca',
    titulo: '8. Programa de Conservação Auditiva (PCA)',
    conteudo: `Conforme NR-15, Anexo 1, item 85 dB(A) de ação e 90 dB(A) de limite.`,
    subsecoes: [
      {
        titulo: 'Objetivos',
        conteudo: `1. Identificar trabalhadores expostos a ruído > 80 dB(A)
2. Implementar medidas de controle na fonte e na trajetória
3. Distribuir EPI adequado (protetores auriculares)
4. Realizar monitoramento audiométrico periódico
5. Orientar sobre prevenção de perda auditiva induzida por ruído (PAIR)`
      },
      {
        titulo: 'Definições e Caracterizações',
        conteudo: `Ruído Contínuo: variação < 5 dB(A) ao longo do período
Ruído Intermitente: variação > 5 dB(A) ao longo do período
Ruído de Impacto: picos de pressão sonora com duração < 1 segundo, intervalo > 1 segundo entre picos
Nível de Ação: 80 dB(A) - requer vigilância, treinamento
Limite de Exposição: 90 dB(A) - não pode ser excedido com EPI`
      },
      {
        titulo: 'Interpretação de Resultados Audiométricos',
        conteudo: `AUDIOMETRIA TONAL LIMIAR:
- Limiar Normal: até 20 dB(HL) em todas as frequências
- Perda Auditiva Leve: 21-40 dB(HL)
- Perda Auditiva Moderada: 41-70 dB(HL)
- Perda Auditiva Severa: 71-90 dB(HL)
- Perda Auditiva Profunda: > 90 dB(HL)

PAIR (Perda Auditiva Induzida por Ruído):
- Padrão: entalhe em 3-6 kHz (tipicamente 4 kHz)
- Critério de Diagnóstico: diferença média de 10 dB(HL) entre o lado exposto e não exposto
- Comparação com audiometria anterior: mudança permanente ≥ 10 dB(HL) em frequências ≥ 1 kHz

CONDUTA:
- Aumento > 10 dB(HL): investigar exposição, reforçar EPI, afastar de fonte se possível
- Padrão de PAIR confirmado: iniciar acompanhamento mais frequente (semestral/trimestral)
- Considerar reabilitação auditiva (aparelho auditivo) em casos avançados`
      }
    ]
  },
  {
    id: 'criterios-cat',
    titulo: '9. Critérios para Abertura de CAT',
    conteudo: `A Comunicação de Acidente do Trabalho (CAT) é obrigatória quando ocorre lesão ou doença relacionada ao trabalho.`,
    subsecoes: [
      {
        titulo: 'Situações que Exigem CAT',
        conteudo: `1. ACIDENTE TÍPICO: lesão decorrente de ação súbita do ambiente de trabalho
2. ACIDENTE DE TRAJETO: lesão ocorrida no percurso residência-trabalho ou trabalho-residência
3. DOENÇA OCUPACIONAL: contraída no ambiente de trabalho (comprovada relação com atividade)
4. DOENÇA PROFISSIONAL: inerente a determinadas profissões (ex: PAIR, silicose, asbestose)

OBSERVAÇÃO: Afastamento por qualquer motivo relacionado ao acidente/doença ocupacional exige CAT`
      },
      {
        titulo: 'Procedimento de Abertura',
        conteudo: `1. Comunicação ao empregador dentro de 24h do acidente
2. Emissão da CAT (papel ou digital) em até 24h do conhecimento do acidente
3. Registro na seguradora ou INSS conforme regime
4. Cópia para o trabalhador (protocolo)
5. Documentação: croqui, fotos, testemunhas, avaliação médica

PRAZOS:
- Abertura: até 24h após o acidente
- Entrega ao trabalhador: até 24h da emissão
- Registro no INSS: até 15 dias (se sem afastamento) ou até o retorno (se com afastamento)`
      }
    ]
  },
  {
    id: 'epi-auditiva',
    titulo: '10. EPI para Proteção Auditiva',
    conteudo: `Conforme NR-6, item 6.6.1 a 6.6.7, especifica tipos, seleção e manutenção.`,
    subsecoes: [
      {
        titulo: 'Tipos de Protetores',
        conteudo: `1. CONCHA AURICULAR (headset): cobre toda a orelha, recomendado para ambientes com ruído > 90 dB(A)
   - Vantagens: vedação confortável, reutilizável, fácil colocação
   - Limitações: calor local, desconforto em ambientes quentes

2. INSERÇÃO AURICULAR (plug): entra no conduto auditivo externo, discreto
   - Vantagens: conforto, discreto, acesso fácil a comunicações
   - Limitações: requer ajuste correto, pode perder facilmente, maior variabilidade de vedação

3. MOLDADO CUSTOMIZADO: confeccionado individualmente a partir de molde do ouvido
   - Vantagens: excelente vedação, conforto superior, durável
   - Limitações: custo mais alto, tempo de confecção

4. SEMIINSERTADO: entre inserção e concha, cobre parte da orelha
   - Vantagens: bom conforto, vedação intermediária
   - Limitações: menos vedação que inserção`
      },
      {
        titulo: 'Seleção Baseada em Nível de Ruído',
        conteudo: `NÍVEL DE RUÍDO vs PROTETOR:
- 80-85 dB(A): plug de espuma simples, Atenuação Média ≥ 15 dB
- 85-90 dB(A): plug ou concha, Atenuação Média ≥ 20 dB
- 90-95 dB(A): concha dupla ou inserção moldada, Atenuação Média ≥ 25 dB
- > 95 dB(A): concha + inserção dupla ou respirador com proteção auditiva, Atenuação ≥ 30 dB

OBSERVAÇÃO: Sempre subtrair 7 dB da Atenuação Nominal para conservadorismo (proteção real)`
      },
      {
        titulo: 'Higiene e Manutenção',
        conteudo: `LIMPEZA:
- Diária com pano úmido ou álcool 70%
- Semanal com água morna e sabão (se removível)
- Inspeção visual para trincas, deformações

ARMAZENAMENTO:
- Temperatura ambiente (15-25°C)
- Umidade relativa 45-75%
- Longe de fontes de calor, luz solar direta
- Em caixa ou sacola protetora

SUBSTITUIÇÃO:
- Concha: máximo 12 meses de uso
- Inserção descartável: após cada uso
- Moldado: máximo 24 meses ou quando deteriorado`
      }
    ]
  },
  {
    id: 'condutas-preventivas',
    titulo: '11. Condutas Preventivas',
    conteudo: `Conjunto de medidas para reduzir exposição a riscos ocupacionais conforme Hierarquia ABNT.`,
    subsecoes: [
      {
        titulo: 'Hierarquia de Controles',
        conteudo: `1. ELIMINAÇÃO: remover completamente o risco
   Exemplo: substituir solvente tóxico por menos tóxico

2. SUBSTITUIÇÃO: trocar por processo/substância menos prejudicial
   Exemplo: pintura a pó no lugar de pintura líquida com solvente

3. ENCLAUSURAMENTO/ISOLAMENTO: separar a fonte do trabalhador
   Exemplo: cabine de jato de areia com sucção

4. VENTILAÇÃO: remover o contaminante do ar de respiração
   Exemplo: captação local junto à fonte, ventilação geral diluição

5. CONTROLE ADMINISTRATIVO: procedimentos, rodízio, treinamento
   Exemplo: revezamento de tarefas, trabalho em equipes

6. EPI: último recurso, requer treinamento e supervisão
   Exemplo: respirador, protetor auricular, luva`
      },
      {
        titulo: 'Medidas Específicas por Risco',
        conteudo: `RUÍDO:
- Substituição de máquinas ruidosas por versões silenciosas
- Isolamento acústico de salas de máquinas
- Redução de jornada para expostos > 90 dB(A)
- EPI apropriado (plugue/concha conforme nível)
- Manutenção preventiva para evitar desgaste que aumenta ruído

CALOR:
- Ventilação natural ou artificial adequada
- Redução de jornada em períodos de calor extremo
- Disponibilidade de água e bebidas isotônicas
- Uniforme leve (algodão) em ambientes quentes
- Pausas em locais mais frescos

AGENTES QUÍMICOS:
- Substituição por menos tóxicos
- Ventilação local exaustora junto à fonte
- Contenção de derramamentos
- Rótulos e fichas de segurança visíveis
- EPI (luva nitrílica, avental, máscara)

RISCOS ERGONÔMICOS:
- Ajustes de altura de bancadas (até cotovelo trabalhador)
- Rotação entre tarefas diferentes
- Pausas para alongamento (5-10 min a cada 2 horas)
- Treinamento de postura correta
- Equipamentos auxiliares (luva, cinto de segurança se necessário)`
      }
    ]
  },
  {
    id: 'limites-tolerancia-continuo',
    titulo: '12. Limites de Tolerância para Ruído Contínuo e Intermitente',
    conteudo: `Conforme NR-15, Anexo 1, estabelece limites de exposição diária.`,
    tabelas: [
      {
        titulo: 'Limites de Tolerância - NR-15 Anexo 1',
        linhas: [
          ['Nível Sonoro dB(A)', 'Tempo de Exposição Máxima'],
          ['80', 'Sem limite (mas exige vigilância)'],
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
          ['95', '48 minutos'],
          ['96', '38 minutos'],
          ['97', '30 minutos'],
          ['98', '24 minutos'],
          ['99', '19 minutos'],
          ['100', '15 minutos']
        ]
      }
    ],
    subsecoes: [
      {
        titulo: 'Método de Cálculo (Dose de Ruído)',
        conteudo: `Para jornadas com múltiplos níveis de ruído, calcular dose equivalente:

Dose = (T1/L1) + (T2/L2) + ... + (Tn/Ln) × 100

Onde: T = tempo em cada nível, L = limite máximo naquele nível

Exemplo: 2h a 90 dB + 4h a 85 dB:
Dose = (2/2,5) + (4/8) × 100 = (0,8 + 0,5) × 100 = 130%

Se Dose > 100%, há excesso de exposição e requer medidas corretivas`
      }
    ]
  },
  {
    id: 'limites-tolerancia-impacto',
    titulo: '13. Limites de Tolerância para Ruídos de Impacto',
    conteudo: `Conforme NR-15, Anexo 1, item 6, para ruído de impacto com picos de pressão sonora.`,
    subsecoes: [
      {
        titulo: 'Definição e Características',
        conteudo: `Ruído de Impacto: pressão sonora de pico com duração < 1 segundo, intervalo > 1 segundo entre picos.

Exemplos: martelo pneumático, prensa, bigorna, disparo de arma, porta fechando com força`
      },
      {
        titulo: 'Limites Estabelecidos',
        conteudo: `- Pico de Pressão Sonora: máximo 140 dB(A) (≈ 200 Pa)
- Nível de Exposição: até 6 impactos/dia
- Acima de 6 impactos: requer audiometria trimestral

Para múltiplos impactos, considerar:
- Número total de impactos por jornada
- Nível de pico de cada impacto
- Distribuição temporal dos impactos`
      },
      {
        titulo: 'Medidas de Controle para Ruído de Impacto',
        conteudo: `1. SUBSTITUIÇÃO: usar ferramentas com amortecimento de impacto
2. ISOLAMENTO: separar local de trabalho, cabines acústicas
3. REDUÇÃO DE JORNADA: limitar tempo de exposição
4. EPI DUPLO: concha + inserção auricular de máxima atenuação (mínimo 30 dB de redução)
5. MONITORAMENTO: audiometria semestral ou trimestral conforme exposição`
      }
    ]
  },
  {
    id: 'programa-ergonomico',
    titulo: '14. Programa Ergonômico',
    conteudo: `Programa integrado de análise e melhoria das condições ergonômicas do trabalho conforme NR-17.`,
    subsecoes: [
      {
        titulo: 'Objetivos do Programa',
        conteudo: `1. Realizar Análise Ergonômica do Trabalho (AET) periódica
2. Identificar riscos ergonômicos (posturas inadequadas, repetitividade, sobrecarga)
3. Implementar melhorias na organização do trabalho
4. Capacitar trabalhadores e supervisores
5. Monitorar saúde (afastamentos, queixas músculo-esqueléticas)
6. Avaliar eficácia das ações implementadas`
      },
      {
        titulo: 'Reconhecimento dos Riscos Ergonômicos',
        conteudo: `- POSTURA INADEQUADA: coluna não reta, pescoço estendido, ombros elevados
- REPETITIVIDADE: movimentos > 2 vezes/minuto por > 2 horas contínuas
- SOBRECARGA DINÂMICA: levantamento de peso > 23 kg (mulher) / 25 kg (homem)
- SOBRECARGA ESTÁTICA: posição mantida > 2 horas contínuas
- VIBRAÇÃO: exposição a vibração de corpo inteiro (motoristas) ou localizada (furadeira)
- FALTA DE PAUSAS: jornadas contínuas sem pausa de recuperação`
      },
      {
        titulo: 'Possíveis Lesões Músculo-Esqueléticas',
        conteudo: `- LER/DORT (Lesão por Esforço Repetitivo / Doença Osteomuscular Relacionada ao Trabalho)
  Síndroma do Túnel do Carpo (punho), Epicondilite Lateral (cotovelo), Tendinite (ombro)

- LESÕES DE COLUNA
  Hérnia de Disco (cervical/lombar), Espondilite, Discopatia Degenerativa

- LESÕES DE JOELHO
  Condromalácia Patelar, Síndroma Patelofemoral

- LESÕES DE QUADRIL/BACIA
  Bursite, Artrose Precoce

Fatores de Risco: idade > 40 anos, jornada > 8h, falta de pausas, peso corporal elevado`
      },
      {
        titulo: 'Recomendações para Postura Ergononomicamente Correta',
        conteudo: `TRABALHO SENTADO (ex: digitador, montador):
- Cadeira com altura ajustável (pés apoiados no chão ou apoio de pés)
- Costas apoiadas no encosto (ângulo 95-110°)
- Cotovelos flexionados 90°, antebraço sobre a mesa
- Monitor à altura dos olhos, distância 50-70 cm
- Teclado próximo ao corpo, sem extensão de punho

TRABALHO EM PÉ (ex: vendedor, operador de máquina):
- Distribuição equilibrada do peso entre os dois pés
- Flexão leve dos joelhos para absorver impacto
- Coluna ereta, ombros relaxados
- Antepés voltados levemente para frente
- Sapato com salto 2-3 cm, solado confortável

LEVANTAMENTO DE PESO:
- Manter a coluna reta (não curvar)
- Agachar com flexão de joelho (não cintura)
- Manter o objeto próximo ao corpo
- Levantar com pernas (não costas)
- Nunca girar o tronco com peso nos ombros`
      },
      {
        titulo: 'Procedimento para Aquecimento e Treinamentos',
        conteudo: `AQUECIMENTO PRÉ-TURNO (5 minutos):
- Rotação de pescoço: 10 movimentos circulares para cada lado
- Flexão de ombros: 10 movimentos para frente, 10 para trás
- Alongamento de coluna: inclinação lateral esquerda/direita (15 seg cada)
- Rotação de tronco: 10 rotações para cada lado
- Alongamento de pernas: flexão de quadril, estresse em posterior (15 seg cada)
- Rotação de tornozelos: 10 movimentos em cada pé

EXERCÍCIOS A CADA 2 HORAS (3-5 minutos):
- Alongamento de pescoço (flexão/extensão, inclinação)
- Alongamento de ombros (levantamento, rotação)
- Alongamento de antebraço (extensão/flexão de punho)
- Alongamento de coluna (torção, inclinação)

ESCALA PSICOFÍSICA DE BORG (percepção de esforço):
Escala 0-10:
0 = Repouso completo
2 = Esforço muito leve
4 = Esforço leve
6 = Esforço moderado
8 = Esforço intenso
10 = Esforço máximo absoluto

CONDUTA: Se esforço ≥ 6 durante jornada normal, requer análise e melhoria ergonômica`
      }
    ]
  },
  {
    id: 'cronograma-anual-saude',
    titulo: '15. Cronograma Anual de Ações de Saúde Ocupacional',
    conteudo: `Planejamento e distribuição de ações ao longo do ano para garantir cobertura de todos os monitoramentos e treinamentos.`,
    tabelas: [
      {
        titulo: 'Cronograma de Exames e Ações Conforme Risco',
        linhas: [
          ['Mês', 'Risco Físico (Ruído)', 'Risco Químico', 'Risco Ergonômico', 'Ações Gerais'],
          ['Janeiro', '', '', '', 'Exame Admissional (novos)'],
          ['Fevereiro', 'Audiometria 1º lote', 'Hemograma grupo 1', '', 'Treinamento Primeiros Socorros'],
          ['Março', '', '', 'AET grupo 1', ''],
          ['Abril', '', '', '', 'Revisão PGR/PCMSO'],
          ['Maio', 'Audiometria 2º lote', '', '', 'Vacinação (Hepatite B, Tétano)'],
          ['Junho', '', 'Espirometria grupo 1', 'AET grupo 2', 'Análise de afastamentos'],
          ['Julho', '', '', '', 'Exame Demissional'],
          ['Agosto', 'Audiometria 3º lote', 'Hemograma grupo 2', '', ''],
          ['Setembro', '', '', 'Avaliação Psicossocial', 'Treinamento Ergonomia'],
          ['Outubro', '', '', '', 'Revisão cronograma próximo ano'],
          ['Novembro', 'Audiometria 4º lote', '', '', 'Treinamento Segurança'],
          ['Dezembro', '', 'Espirometria grupo 2', '', 'Relatório Anual PCMSO']
        ]
      }
    ]
  },
  {
    id: 'programa-vacinacao',
    titulo: '16. Programa de Vacinação',
    conteudo: `Programa de imunização conforme calendário recomendado pela Organização Mundial de Saúde (OMS) e regulamentação brasileira (ANVISA/MS).`,
    subsecoes: [
      {
        titulo: 'Vacinas Recomendadas para Trabalhadores',
        conteudo: `ROTINA (todos os trabalhadores):
- TÉTANO: 3 doses iniciais (0, 1, 6 meses), reforço a cada 10 anos
- HEPATITE B: 3 doses (0, 1, 6 meses), sorologias 30 dias após últimas dose
- HEPATITE A: 2 doses (0, 6 meses) ou conforme faixa etária/sorologia
- DIFTERIA/COQUELUCHE: 1 reforço (dTpa)

CONFORME RISCO:
- TUBERCULOSE (BCG): uma dose (se sem cicatriz)
- FEBRE AMARELA: 1 dose (refuerço a cada 10 anos)
- RAIVA: conforme exposição (veterinários, coletores lixo)
- RUBÉOLA/CAXUMBA/SARAMPO (MMR): conforme sorologia
- INFLUENZA (Gripe): anual (outono)
- PNEUMOCOCO: conforme faixa etária`
      },
      {
        titulo: 'Verificação de Status Vacinal',
        conteudo: `ADMISSIONAL:
- Revisar caderneta de vacinação
- Solicitar sorologias se não houver comprovação (Hepatite B, A, Sarampo)
- Atualizar vacinação conforme deficiências encontradas

PERIÓDICO:
- Reforços de Tétano (a cada 10 anos)
- Influenza (anual, campanhas outono/maio)
- Conforme novo calendário recomendado`
      },
      {
        titulo: 'Registro e Acompanhamento',
        conteudo: `- Manter cópia da caderneta ou registro eletrônico
- Documentar sorologias (anti-HBs, anti-HAV, etc)
- Registrar reações adversas (local, duração)
- Encaminhar para vacinação conforme cronograma
- Informar trabalhador sobre próximas doses necessárias`
      }
    ]
  }
]
