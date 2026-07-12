# Pesquisa: textos padrão mais abrangentes (NRs/NBRs) — PGR, LTCAT, PCMSO, AET, LIP, PPP

Documento de trabalho — **rascunho de pesquisa, nada foi alterado no código ainda**. Uso: revisar,
corrigir os pontos marcados `[VERIFICAR]` e decidir o que entra em produção.

Metodologia: pesquisa na internet (fontes oficiais gov.br/planalto.gov.br quando possível, mais
fontes jurídicas/técnicas secundárias) para cada documento, redigindo o texto no mesmo estilo
formal já usado em `lib/pgr-conteudo.ts` e `lib/aet-conteudo.ts` (array `SecaoLegal[]`, parágrafos
formais, citações literais de norma entre aspas com fonte exata).

**Status atual do código, antes desta pesquisa:**

| Documento | Tem texto padrão? | Arquivo |
|---|---|---|
| PGR | Sim — 14 seções | `lib/pgr-conteudo.ts` |
| AET | Sim — 10 seções | `lib/aet-conteudo.ts` |
| LTCAT | Não — só subtítulo estático | — |
| PCMSO | Não — só subtítulo estático | — |
| LIP | Não — só frases curtas de fundamentação por categoria no formulário | — |
| PPP | Não — nenhuma menção normativa | — |

---

## ⚠️ Pontos que precisam de verificação humana antes de qualquer uso em laudo real

Os textos abaixo foram pesquisados com cuidado, mas envolvem citações de portarias, decretos,
súmulas e instruções normativas — matéria em que um erro de número ou data tem consequência
jurídica real. Os agentes de pesquisa marcaram explicitamente tudo que não conseguiram confirmar
com certeza, em vez de inventar. Lista consolidada:

1. **Decreto 3.048/99, art. 68** — numeração exata dos parágrafos (§2º/§3º/§4º) diverge entre fontes secundárias pós-Decreto 10.410/2020.
2. **STF, Tema 555 (RE 664.335/SC)** — a regra do EPI eficaz e a exceção do ruído estão bem consolidadas em múltiplas fontes, mas a redação literal das duas teses não foi conferida direto no acórdão.
3. **NR-7** — numeração fina de itens (ex. item sobre planejamento com base em risco) variou entre fontes secundárias.
4. **NR-7** — prazo de guarda de prontuário/documentos (fontes convergem para 20 anos, mas o item/quadro exato da norma não foi confirmado).
5. **eSocial S-2220/S-2240** — prazos exatos de envio por tipo de evento (houve alteração técnica recente, evitei cravar números de dias sem confirmação).
6. **NR-17** — número exato da portaria de outubro/2021 que deu nova redação (fontes divergiram).
7. **NR-15** — numeração exata dos Anexos 4 a 10 (radiações, condições hiperbáricas, vibração, frio, umidade) — fontes não uniformes.
8. **NR-16** — numeração formal do anexo de radiações ionizantes (sem número de anexo claro nas fontes consultadas).
9. **Base de cálculo do adicional de insalubridade** — salário mínimo (art. 192 CLT) vs. impacto da Súmula Vinculante 4/STF — é controvérsia real, não erro de pesquisa; precisa de posição jurídica da empresa.
10. **Instrução Normativa do INSS vigente** que fixa o prazo de 20 anos de guarda dos documentos-base do PPP — a fonte encontrada citava a IN 95/2003, hoje revogada.
11. **ABNT NBR ISO 6385 e ISO 9241** — não foi confirmada adoção formal idêntica pela ABNT (tratar como referência técnica internacional, não como "norma brasileira", até confirmar).

Recomendação: antes de publicar qualquer um destes textos em um laudo real, baixar o PDF oficial
de cada norma em gov.br/planalto.gov.br e conferir item a item — especialmente os trechos entre
aspas (citação literal), que hoje estão marcados como prováveis mas não 100% conferidos contra o
texto oficial.

---

## Achados que valem destaque (não são só "texto a mais")

- **LTCAT/LIP — EPI x ruído (STF, Tema 555):** EPI eficaz *pode* descaracterizar exposição para
  aposentadoria especial — **exceto para ruído**, onde a declaração de eficácia do EPI no PPP
  **não** descaracteriza o tempo especial. Isso é um ponto jurídico fino que hoje não aparece em
  lugar nenhum do sistema e devia estar explícito no LTCAT e no PPP.
- **LIP — EPI x insalubridade x periculosidade têm efeitos opostos:** para insalubridade, EPI eficaz
  comprovado pode afastar o adicional (Súmula 289/TST); para periculosidade, o simples uso de EPI
  **não afasta** o adicional (Súmula 364, I/TST) — o risco é inerente à atividade, não à intensidade
  de um agente. Essa distinção não existe hoje no LIP.
- **LIP — cumulação vedada:** art. 193 §2º CLT veda cumular insalubridade + periculosidade; o
  trabalhador opta pelo mais vantajoso quando as duas hipóteses coexistem na mesma função.
- **PPP — S-2240 já substituiu o PPP em papel** desde janeiro/2023 para empresas no eSocial; o PPP
  hoje é gerado a partir dos dados do S-2240 e consultável no "Meu INSS". Vale considerar isso no
  texto e possivelmente no produto (ênfase em manter S-2240 consistente, não só o PDF).
- **PGR — psicossocial (Portaria MTE 1.419/2024):** a fiscalização plena começou **26/05/2025**,
  com prorrogação para caráter punitivo em **26/05/2026** pela Portaria MTE nº 765/2025 — ou seja,
  na data de hoje (12/07/2026) a fiscalização já é plenamente punitiva. O texto atual do PGR cita a
  data mas não a portaria de prorrogação nem o fato de já estarmos no regime punitivo.
- **NHO-11 não é sobre poeira mineral** (correção a um erro que eu mesmo cometi ao redigir o brief
  do agente) — é sobre iluminamento. A norma certa para poeira/particulados é a **NHO-08**
  (+ NHO-03 análise gravimétrica, NHO-04 fibras/asbesto).
- **NR-16, Anexo V (motociclistas)** — confirmado: Portaria MTE nº 2.021, de 03/12/2025 (DOU
  04/12/2025), vigência 120 dias após publicação (~abril/2026). É a mesma que o LIP já referencia
  hoje no formulário — bate certo.

---

## 1. PGR — enriquecimento (o texto já existe, isto é adendo)

Confirmações sobre o texto atual: `Portaria SEPRT nº 6.730/2020` está correta. A data
`26/05/2026` também está correta, mas é resultado de uma **prorrogação** pela Portaria MTE nº
765/2025 — vale citar essa portaria explicitamente.

### Novo parágrafo — Seção 8 (Metodologia)

```ts
'Nas avaliações quantitativas de agentes físicos e químicos realizadas no âmbito deste PGR, foram adotadas, como referência metodológica complementar, as Normas de Higiene Ocupacional da Fundacentro pertinentes a cada agente — como a NHO-01 (ruído), a NHO-06 (calor) e a NHO-08 (poeiras e material particulado) —, sem prejuízo dos critérios e limites de tolerância estabelecidos pela NR-15.',
```

### Novo parágrafo — Seção 10 (Riscos Psicossociais)

```ts
'O prazo de 26 de maio de 2026 para a exigibilidade plena das disposições sobre riscos psicossociais foi fixado pela Portaria MTE nº 765, de 15 de maio de 2025, que prorrogou o início da fiscalização de caráter punitivo do capítulo 1.5 da NR-1. O período entre maio de 2025 e maio de 2026 foi definido como fase educativa e orientativa, findo o qual a fiscalização passa a ter caráter plenamente punitivo, sem prorrogações adicionais anunciadas pelo Ministério do Trabalho e Emprego até a presente data.',
```

### Nova seção 15 — Referências Normativas Complementares

```ts
{
  titulo: '15. REFERÊNCIAS NORMATIVAS COMPLEMENTARES',
  paragrafos: [
    'Além do arcabouço legal obrigatório que fundamenta este PGR (NR-1, NR-7, NR-9, NR-15, NR-16, NR-17 e Portaria MTE nº 1.419/2024), a empresa pode adotar, de forma voluntária e complementar, referências internacionais e nacionais de boas práticas de gestão de saúde e segurança ocupacional, sem que isso substitua ou dispense o cumprimento das exigências legais brasileiras.',
    'A ABNT NBR ISO 45001:2024 (Sistemas de gestão de saúde e segurança ocupacional — Requisitos com orientação para uso), publicada pela Associação Brasileira de Normas Técnicas em 21 de novembro de 2024 e complementada pela Emenda 1:2025 (que incorporou considerações sobre mudanças climáticas aos requisitos de contexto da organização), constitui a norma internacional de referência para sistemas de gestão de SST. Empresas que já estruturaram seu PGR nos moldes da NR-1 possuem base técnica relevante para eventual certificação voluntária nessa norma, cuja adoção não é exigência legal no Brasil, mas complementa e fortalece a gestão de riscos ocupacionais já estabelecida.',
    'A Portaria MTE nº 1.419, de 27 de agosto de 2024, aprovou a nova redação do capítulo "1.5 Gerenciamento de Riscos Ocupacionais" e alterou o Anexo I ("Termos e Definições") da NR-1, incluindo de forma expressa os Fatores de Riscos Psicossociais Relacionados ao Trabalho – FRPRT no inventário de riscos, ao lado dos fatores de risco ergonômico, e determinando a adoção de mecanismos de consulta mais ativa dos trabalhadores no processo de gerenciamento de riscos ocupacionais.',
  ],
},
```

---

## 2. AET — enriquecimento (o texto já existe, isto é adendo)

### Nova seção 9 — Métodos e Ferramentas Técnicas de Avaliação

(renumerar a atual seção 9 "Integração GRO/NR-1" para 10, e "Conclusão" para 11)

```ts
{
  titulo: '9. MÉTODOS E FERRAMENTAS TÉCNICAS DE AVALIAÇÃO',
  paragrafos: [
    'Como referência técnica complementar à NR-17 para a avaliação de atividades que envolvam levantamento, transporte, empurrar, puxar e movimentos repetitivos de materiais, podem ser utilizadas as normas técnicas ABNT NBR ISO 11228-1 (Ergonomia — Movimentação manual — Parte 1: Levantamento e transporte de cargas), ABNT NBR ISO 11228-2 (Parte 2: Empurrar e puxar) e ABNT NBR ISO 11228-3 (Parte 3: Movimentação de cargas leves em alta frequência), que estabelecem limites recomendados e critérios técnicos para avaliação do risco biomecânico dessas atividades.',
    'Para a avaliação postural e biomecânica dos postos de trabalho, podem ser empregados métodos e ferramentas técnicas reconhecidas internacionalmente, tais como REBA (Rapid Entire Body Assessment), RULA (Rapid Upper Limb Assessment) e a equação de NIOSH para levantamento de cargas, como instrumentos de apoio técnico à Avaliação Ergonômica Preliminar e à Análise Ergonômica do Trabalho, sem prejuízo da metodologia adotada pelo profissional responsável pela análise.',
  ],
},
```

*(Removi do parágrafo acima a menção a NBR ISO 6385/9241 como "norma brasileira" — não confirmado;
se quiser citá-las, tratar como referência técnica internacional, sem o prefixo ABNT NBR.)*

### Novo parágrafo — Seção 1 (Introdução)

```ts
'A NR-17 teve sua redação atualizada pela Portaria SEPRT/MTP nº 423, de 7 de outubro de 2021, em vigor desde 3 de janeiro de 2022, e posteriormente alterada pela Portaria MTP nº 4.219, de 20 de dezembro de 2022, passando a tratar de forma expressa os fatores de risco físicos, cognitivos e organizacionais do trabalho, incluindo os fatores de risco psicossociais relacionados ao trabalho.', // [VERIFICAR número exato da portaria de out/2021]
```

### Novo parágrafo — Seção 7 (Organização do Trabalho)

```ts
'A Portaria MTE nº 1.419, de 27 de agosto de 2024, alterou o capítulo 1.5 da NR-1, determinando que a organização considere, na gestão de riscos ocupacionais (GRO/PGR), os fatores de risco psicossociais relacionados ao trabalho, nos termos e critérios estabelecidos pela NR-17. Dessa forma, os fatores de risco psicossociais identificados nesta AET — tais como sobrecarga de trabalho, controle rígido de produtividade, jornadas excessivas e conflitos nas relações de trabalho — devem ser incorporados também ao inventário de riscos ocupacionais do PGR, em articulação com o Programa de Controle Médico de Saúde Ocupacional (PCMSO) da organização.',
```

---

## 3. LTCAT — texto novo (hoje não existe nenhum)

Sugestão de arquivo: `lib/ltcat-conteudo.ts`. Base legal principal: Lei 8.213/91 art. 58, Decreto
3.048/99 art. 68, NR-15, NR-9, IN INSS/PRES 128/2022, NHOs Fundacentro, STF Tema 555.

```ts
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
]
```

---

## 4. PCMSO — texto novo (hoje não existe nenhum)

Sugestão de arquivo: `lib/pcmso-conteudo.ts`. Base legal principal: NR-7 (redação Portaria SEPRT
6.734/2020, alterada pela Portaria SEPRT 8.873/2021), integração com NR-1/PGR, Portaria MTE
1.419/2024, eSocial S-2220.

```ts
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
```

---

## 5. LIP — texto novo (hoje não existe nenhum)

Sugestão de arquivo: `lib/lip-conteudo.ts`. Base legal: CLT arts. 189–197, NR-15, NR-16 (Anexos 1–5),
Súmulas TST 289, 361, 364, 448.

```ts
export interface SecaoLegal { titulo: string; paragrafos: string[] }

export const TEXTOS_LEGAIS_LIP: SecaoLegal[] = [
  {
    titulo: '1. INTRODUÇÃO',
    paragrafos: [
      'O presente Laudo de Insalubridade e Periculosidade – LIP tem por finalidade identificar, avaliar e caracterizar tecnicamente as condições de trabalho que sujeitem os empregados a agentes nocivos à saúde acima dos limites de tolerância (insalubridade) ou a risco acentuado em razão de exposição permanente a atividades ou operações legalmente consideradas perigosas (periculosidade), nos termos dos artigos 189 a 197 da CLT e das Normas Regulamentadoras NR-15 e NR-16.',
      '"Art. 189. Serão consideradas atividades ou operações insalubres aquelas que, por sua natureza, condições ou métodos de trabalho, exponham os empregados a agentes nocivos à saúde, acima dos limites de tolerância fixados em razão da natureza e da intensidade do agente e do tempo de exposição aos seus efeitos." (CLT, art. 189)',
      '"Art. 193. São consideradas atividades ou operações perigosas [...] aquelas que, por sua natureza ou métodos de trabalho, impliquem risco acentuado em virtude de exposição permanente do trabalhador a: I - inflamáveis, explosivos ou energia elétrica; II - roubos ou outras espécies de violência física nas atividades profissionais de segurança pessoal ou patrimonial." (CLT, art. 193, caput)',
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
```

---

## 6. PPP — texto novo (hoje não existe nenhum)

Sugestão de arquivo: `lib/ppp-conteudo.ts`. Base legal: Lei 8.213/91 arts. 57–58, Decreto 3.048/99,
IN INSS/PRES 128/2022 (alterada pela IN 141/2022), eSocial S-2240.

```ts
export interface SecaoLegal { titulo: string; paragrafos: string[] }

export const TEXTOS_LEGAIS_PPP: SecaoLegal[] = [
  {
    titulo: '1. INTRODUÇÃO',
    paragrafos: [
      'O Perfil Profissiográfico Previdenciário – PPP é o documento histórico-laboral que reúne, de forma cronológica, os dados administrativos, os registros ambientais e os resultados de monitoração biológica do trabalhador ao longo de todo o seu vínculo empregatício, com a finalidade precípua de comprovar, perante a Previdência Social, a efetiva exposição a agentes nocivos à saúde ou à integridade física.',
      'O PPP foi instituído pela Lei nº 8.213, de 24 de julho de 1991, regulamentado pelo Decreto nº 3.048, de 6 de maio de 1999, e tem seu formulário, conteúdo e procedimentos de preenchimento disciplinados pela Instrução Normativa PRES/INSS nº 128, de 28 de março de 2022, alterada pela Instrução Normativa PRES/INSS nº 141, de 6 de dezembro de 2022.',
    ],
  },
  {
    titulo: '2. OBJETIVOS E FINALIDADE PREVIDENCIÁRIA',
    paragrafos: [
      'O PPP tem por objetivo registrar, de forma individualizada, o histórico laboral do trabalhador, incluindo dados administrativos, atividades exercidas, agentes nocivos a que esteve exposto, intensidade e concentração desses agentes (quando aplicável), técnica utilizada na avaliação, e informação sobre a existência e a eficácia de Equipamento de Proteção Individual e/ou Coletivo para neutralização do risco.',
      'A finalidade principal do PPP é subsidiar o reconhecimento, pelo INSS, do direito à aposentadoria especial e de outros benefícios previdenciários vinculados à exposição a agentes nocivos, bem como servir de prova em ações judiciais e administrativas relacionadas ao tempo de contribuição em condições especiais.',
    ],
  },
  {
    titulo: '3. BASE LEGAL',
    paragrafos: [
      '"Art. 57. A aposentadoria especial será devida [...] ao segurado que tiver trabalhado sujeito a condições especiais que prejudiquem a saúde ou a integridade física, durante 15 (quinze), 20 (vinte) ou 25 (vinte e cinco) anos, conforme dispuser a lei." (Lei nº 8.213/1991, art. 57, caput)',
      '"Art. 58, § 1º. A comprovação da efetiva exposição do segurado aos agentes nocivos será feita mediante formulário, na forma estabelecida pelo INSS, emitido pela empresa ou seu preposto, com base em laudo técnico de condições ambientais do trabalho expedido por médico do trabalho ou engenheiro de segurança do trabalho." (Lei nº 8.213/1991, art. 58, §1º)',
      'O Decreto nº 3.048/99 disciplina, em seu art. 58 e em seu Anexo IV, a classificação dos agentes nocivos considerados para fins de aposentadoria especial, agrupados por período de exposição mínimo exigido (15, 20 ou 25 anos).',
    ],
  },
  {
    titulo: '4. RESPONSABILIDADE DO EMPREGADOR',
    paragrafos: [
      'A emissão, a atualização e a veracidade das informações constantes do PPP são de responsabilidade do empregador, que deve fornecer o documento ao trabalhador por ocasião da rescisão do contrato de trabalho, sempre que solicitado durante ou após o vínculo, e quando requisitado pelo INSS para fins de instrução de processo de benefício.',
      'O não fornecimento do PPP, sua emissão com informações inverídicas ou desatualizadas, e a ausência de laudo técnico que o embase, sujeitam o empregador a penalidades administrativas (art. 133 da Lei nº 8.213/1991), sem prejuízo de eventual responsabilização civil e trabalhista.',
    ],
  },
  {
    titulo: '5. FONTES DE INFORMAÇÃO (LTCAT, PCMSO, PGR)',
    paragrafos: [
      'As informações lançadas no PPP devem ter como lastro documentos técnicos previamente elaborados pela empresa, notadamente o LTCAT, o PCMSO (NR-7) e o PGR (NR-1), dos quais se extraem, respectivamente, a caracterização e intensidade dos agentes ambientais, os dados de monitoração biológica e clínica ocupacional, e o inventário de riscos e as medidas de controle implementadas.',
      'Quando houver fornecimento de EPI, o PPP deve registrar não apenas o fato do fornecimento, mas a informação técnica sobre sua eficácia (EPI eficaz ou não eficaz) para neutralização do agente nocivo, dado essencial para a análise, pelo INSS, do direito à contagem do período como tempo especial.',
    ],
  },
  {
    titulo: '6. RESPONSÁVEL PELOS REGISTROS AMBIENTAIS (REM)',
    paragrafos: [
      'O PPP deve indicar, de forma nominal, o profissional responsável técnico pelos registros ambientais (REM) — o profissional legalmente habilitado (médico do trabalho ou engenheiro de segurança do trabalho) que respondeu tecnicamente pelo LTCAT ou documento equivalente que fundamenta as informações de exposição a agentes nocivos lançadas no perfil.',
      'A ausência dessa informação pode ser considerada vício formal apto a comprometer a força probante do documento perante o INSS ou o Poder Judiciário.',
    ],
  },
  {
    titulo: '7. RELAÇÃO COM O ESOCIAL (EVENTO S-2240)',
    paragrafos: [
      'Desde janeiro de 2023, para as empresas obrigadas ao eSocial, o PPP em papel foi substituído pelo PPP eletrônico, gerado automaticamente a partir dos dados transmitidos pelo empregador nos eventos de Saúde e Segurança do Trabalho, em especial o evento S-2240 (Condições Ambientais do Trabalho - Fator de Risco), que consolida, para cada trabalhador e período, os agentes nocivos a que esteve exposto e a eficácia das medidas de proteção adotadas.',
      'Com a substituição do PPP em papel pelo eletrônico, o trabalhador passou a poder consultar seu perfil profissiográfico diretamente no portal ou aplicativo "Meu INSS", com base nos dados transmitidos pela empresa via eSocial, o que reforça a importância da correção e da tempestividade do preenchimento dos eventos de SST pelo empregador.',
    ],
  },
  {
    titulo: '8. GUARDA E DISPONIBILIZAÇÃO DO DOCUMENTO',
    paragrafos: [
      'A empresa deve manter sob sua guarda os documentos técnicos que fundamentam o PPP (LTCAT, PCMSO, PGR e respectivos registros de monitoração) por prazo mínimo de 20 (vinte) anos contados do desligamento do empregado.', // [VERIFICAR: IN do INSS vigente que fixa esse prazo]
      'Essa obrigação de guarda subsiste mesmo após o encerramento do vínculo empregatício e independentemente de a empresa permanecer em atividade, uma vez que o trabalhador pode necessitar da comprovação de tempo especial anos ou décadas após o desligamento.',
    ],
  },
  {
    titulo: '9. CONCLUSÃO',
    paragrafos: [
      'O Perfil Profissiográfico Previdenciário aqui apresentado foi elaborado com fundamento na Lei nº 8.213/1991, no Decreto nº 3.048/1999 e na Instrução Normativa PRES/INSS nº 128/2022 (alterada pela IN nº 141/2022), a partir dos documentos técnicos de Saúde e Segurança do Trabalho da empresa (LTCAT, PCMSO e PGR), e reflete o histórico de exposição ocupacional do trabalhador nos períodos e funções indicados.',
      'A empresa declara-se responsável pela veracidade das informações aqui prestadas, comprometendo-se a manter os registros ambientais e a documentação de suporte pelo prazo legal exigido.',
    ],
  },
]
```

---

## Fontes pesquisadas (consolidado)

Ver detalhamento completo por documento nas transcrições dos agentes de pesquisa. Fontes
principais usadas:

- gov.br/trabalho-e-emprego — NRs vigentes (1, 7, 9, 15, 16, 17), portarias
- planalto.gov.br — Lei 8.213/91, Decreto 3.048/99
- gov.br/inss — Instruções Normativas PRES/INSS, modelo do PPP (Anexo XVII)
- portal.stf.jus.br — Tema 555 de Repercussão Geral (RE 664.335/SC)
- Súmulas do TST (289, 361, 364, 448) via fontes jurídicas (Jusbrasil, blogs especializados)
- Fundacentro — Normas de Higiene Ocupacional (NHO)
- Fontes jurídicas/técnicas secundárias (Conjur, escritórios de advocacia, consultorias de SST) para
  contextualização e cross-check

---

## Próximos passos sugeridos

1. Revisar este documento e decidir quais seções entram como estão, quais precisam de ajuste.
2. Resolver os 11 pontos `[VERIFICAR]` — idealmente com apoio de um profissional de SST/advogado
   trabalhista-previdenciário, já que envolve interpretação normativa, não só busca de texto.
3. Só depois disso, decidir sobre implementação no código (criar `lib/ltcat-conteudo.ts`,
   `lib/pcmso-conteudo.ts`, `lib/lip-conteudo.ts`, `lib/ppp-conteudo.ts`, replicar padrão de UI
   editável do PGR/AET, e enriquecer os arrays existentes de PGR/AET).
