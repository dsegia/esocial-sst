// Conteúdo estrutural e textos legais padrão do PPP (Perfil Profissiográfico
// Previdenciário) — Lei 8.213/91, Decreto 3.048/99, IN INSS/PRES 128/2022.
// Textos genéricos — os mesmos para qualquer empresa, é o texto da norma.

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
