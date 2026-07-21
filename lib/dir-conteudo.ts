// Conteúdo estrutural e textos legais padrão do DIR (Declaração de
// Inexistência de Risco) — documento administrativo emitido pela empresa, com
// base no inventário de riscos do PGR (NR-1) e no LTCAT vigente, para
// declarar formalmente a ausência de risco ocupacional em funções/setores
// especificamente avaliados. Não é um documento de envio obrigatório ao
// eSocial — é um registro complementar de uso administrativo e probatório.
// Textos genéricos — os mesmos para qualquer empresa, é o texto da norma.

export interface SecaoLegal { titulo: string; paragrafos: string[] }

export const TEXTOS_LEGAIS_DIR: SecaoLegal[] = [
  {
    titulo: '1. INTRODUÇÃO',
    paragrafos: [
      'A presente Declaração de Inexistência de Risco – DIR tem por finalidade certificar, para as funções e setores nela especificados, que a avaliação técnica realizada com base no inventário de riscos do Programa de Gerenciamento de Riscos – PGR (NR-1) e, quando aplicável, no Laudo Técnico das Condições Ambientais do Trabalho – LTCAT, não identificou exposição a agentes nocivos à saúde ou à integridade física que caracterizasse insalubridade, periculosidade ou risco ocupacional relevante.',
      'Esta declaração é um documento administrativo de emissão da própria empresa, elaborado com apoio técnico especializado, não se confundindo com formulário de envio obrigatório ao eSocial nem substituindo os documentos legalmente exigidos (PGR, LTCAT, PCMSO, PPP) quando a atividade avaliada os demandar.',
    ],
  },
  {
    titulo: '2. OBJETIVOS E FINALIDADE',
    paragrafos: [
      'Constituem objetivos desta declaração: registrar formalmente a conclusão técnica de ausência de risco para as funções nela relacionadas; fundamentar a dispensa ou a simplificação de exames complementares específicos no PCMSO (NR-7) para essas funções, quando tecnicamente justificável; e servir de subsídio documental interno para processos de admissão, auditoria e fiscalização.',
      'A emissão desta declaração não dispensa a empresa de manter atualizado o inventário de riscos do PGR nem de reavaliar as funções sempre que houver alteração relevante no ambiente, no processo produtivo ou na organização do trabalho.',
    ],
  },
  {
    titulo: '3. RESPONSABILIDADE TÉCNICA',
    paragrafos: [
      'A conclusão técnica pela inexistência de risco é de responsabilidade do profissional habilitado indicado ao final deste documento, com base em inspeção e/ou análise documental dos postos de trabalho relacionados às funções avaliadas.',
      'Havendo divergência quanto à existência de risco em função aqui declarada, prevalece a reavaliação técnica atualizada, cabendo à empresa emitir os documentos de caracterização de risco cabíveis (LTCAT, LIP) caso a reavaliação identifique exposição relevante.',
    ],
  },
  {
    titulo: '4. VALIDADE E REVISÃO',
    paragrafos: [
      'Esta declaração reflete a condição das funções e setores avaliados na data de sua elaboração, devendo ser revisada sempre que houver alteração relevante no ambiente de trabalho, no processo produtivo, na organização do trabalho ou quando sobrevier atualização do PGR ou do LTCAT que impacte as funções aqui relacionadas.',
    ],
  },
]
