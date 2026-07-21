// Conteúdo estrutural e textos legais padrão do AEP (Atestado de Exposição a
// Agentes Nocivos) — Lei 8.213/91, Decreto 3.048/99. Documento complementar ao
// PPP, emitido de forma individualizada por período/função para atestar a
// exposição do trabalhador a agentes nocivos à saúde ou à integridade física.
// Textos genéricos — os mesmos para qualquer empresa, é o texto da norma.

export interface SecaoLegal { titulo: string; paragrafos: string[] }

export const TEXTOS_LEGAIS_AEP: SecaoLegal[] = [
  {
    titulo: '1. INTRODUÇÃO',
    paragrafos: [
      'O presente Atestado de Exposição a Agentes Nocivos – AEP tem por finalidade certificar, de forma individualizada, a efetiva exposição do trabalhador a agentes nocivos à saúde ou à integridade física durante o período e na função indicados, com base nos documentos técnicos de Segurança e Saúde no Trabalho da empresa (LTCAT, PGR e inventário de riscos por GHE).',
      '"Art. 58, § 1º. A comprovação da efetiva exposição do segurado aos agentes nocivos será feita mediante formulário, na forma estabelecida pelo INSS, emitido pela empresa ou seu preposto, com base em laudo técnico de condições ambientais do trabalho expedido por médico do trabalho ou engenheiro de segurança do trabalho." (Lei nº 8.213/1991, art. 58, §1º)',
      'Este atestado não substitui o Perfil Profissiográfico Previdenciário – PPP nem os eventos de SST transmitidos ao eSocial, servindo como documento complementar de comprovação técnica, útil para instrução de processos administrativos e judiciais e para consulta interna da empresa.',
    ],
  },
  {
    titulo: '2. BASE TÉCNICA',
    paragrafos: [
      'As informações constantes deste atestado têm como lastro o Laudo Técnico das Condições Ambientais do Trabalho – LTCAT e o inventário de riscos por Grupo Homogêneo de Exposição – GHE vigentes na empresa, dos quais se extraem a identificação, a intensidade/concentração (quando aplicável) e a metodologia de avaliação dos agentes nocivos a que o trabalhador esteve exposto na função e no período indicados.',
      'Quando houver fornecimento de Equipamento de Proteção Individual e/ou Coletivo, este atestado registra a informação técnica sobre sua eficácia para neutralização do agente nocivo no período avaliado.',
    ],
  },
  {
    titulo: '3. RESPONSABILIDADE TÉCNICA',
    paragrafos: [
      'A caracterização dos agentes nocivos e a conclusão deste atestado são de responsabilidade do profissional legalmente habilitado (médico do trabalho ou engenheiro de segurança do trabalho) indicado ao final do documento, nos termos do art. 195, caput, da CLT.',
      'A empresa declara-se responsável pela veracidade das informações administrativas prestadas (período, função e setor), cabendo ao responsável técnico a fundamentação da caracterização dos agentes nocivos e de sua intensidade.',
    ],
  },
  {
    titulo: '4. VALIDADE E FINALIDADE',
    paragrafos: [
      'Este atestado reflete as condições de exposição verificadas com base na documentação técnica vigente na data de sua emissão, devendo ser reemitido sempre que houver alteração relevante no ambiente de trabalho, na função exercida ou nos documentos técnicos que o fundamentam.',
      'Destina-se a uso administrativo interno, instrução de processos trabalhistas e previdenciários e consulta do trabalhador, não dispensando a empresa do correto preenchimento dos eventos de SST no eSocial (S-2240, S-2220) nem da emissão do PPP quando devido.',
    ],
  },
]
