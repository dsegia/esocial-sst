// Conteúdo do questionário de riscos psicossociais respondido pelos
// colaboradores (link público, anônimo) e usado para alimentar a seção
// "RISCOS PSICOSSOCIAIS" do PGR (NR-1, Portaria MTE nº 1.419/2024).
//
// Os itens são redigidos de forma ORIGINAL (não são a tradução literal de
// nenhum instrumento com direitos autorais como o COPSOQ), mas as dimensões
// seguem os construtos consolidados na literatura e reconhecidos pelo MTE:
// o modelo demanda-controle-suporte (Karasek/Theorell — base da "Job Stress
// Scale", validada em português) e as categorias de fatores psicossociais
// da NR-1/Portaria 1.419/2024 e da ISO 45003:2021 (assédio, insegurança no
// emprego, equilíbrio trabalho-vida, reconhecimento etc.).
//
// Todos os itens de escala são redigidos no MESMO SENTIDO (quanto maior a
// nota, maior a exposição ao risco) para permitir agregação direta sem
// inversão de escala.

export interface ItemPesquisa {
  id: string
  texto: string
}

export interface DimensaoPesquisa {
  id: string
  nome: string
  itens: ItemPesquisa[]
}

export const ESCALA_LIKERT = [
  { valor: 1, label: 'Nunca' },
  { valor: 2, label: 'Raramente' },
  { valor: 3, label: 'Às vezes' },
  { valor: 4, label: 'Frequentemente' },
  { valor: 5, label: 'Sempre' },
]

export const DIMENSOES_PESQUISA: DimensaoPesquisa[] = [
  {
    id: 'demandas',
    nome: 'Demandas e ritmo de trabalho',
    itens: [
      { id: 'd1', texto: 'Preciso trabalhar em ritmo muito acelerado para dar conta das tarefas.' },
      { id: 'd2', texto: 'Preciso trabalhar além do meu horário normal para conseguir terminar o trabalho.' },
      { id: 'd3', texto: 'Recebo metas ou prazos que considero difíceis de cumprir.' },
      { id: 'd4', texto: 'Falta tempo para fazer pausas durante minha jornada de trabalho.' },
    ],
  },
  {
    id: 'controle',
    nome: 'Autonomia e controle sobre o trabalho',
    itens: [
      { id: 'c1', texto: 'Tenho pouca liberdade para decidir como organizar o meu próprio trabalho.' },
      { id: 'c2', texto: 'Sinto que minhas ideias e sugestões não são levadas em conta.' },
      { id: 'c3', texto: 'Não tenho controle sobre a ordem ou o ritmo das tarefas que preciso cumprir.' },
    ],
  },
  {
    id: 'clareza_papel',
    nome: 'Clareza de papel e organização do trabalho',
    itens: [
      { id: 'p1', texto: 'Não fica claro para mim o que exatamente se espera do meu trabalho.' },
      { id: 'p2', texto: 'Recebo orientações contraditórias de pessoas diferentes sobre o mesmo assunto.' },
      { id: 'p3', texto: 'Tenho tarefas ou responsabilidades que sinto que não deveriam ser minhas.' },
    ],
  },
  {
    id: 'suporte_social',
    nome: 'Suporte social (liderança e colegas)',
    itens: [
      { id: 's1', texto: 'Sinto falta de apoio da minha liderança quando preciso.' },
      { id: 's2', texto: 'Sinto falta de apoio dos meus colegas quando preciso.' },
      { id: 's3', texto: 'Existe um clima de competição ou desconfiança excessiva na minha equipe.' },
      { id: 's4', texto: 'Minha liderança não me dá retorno (feedback) sobre o meu trabalho.' },
    ],
  },
  {
    id: 'reconhecimento',
    nome: 'Reconhecimento e justiça',
    itens: [
      { id: 'r1', texto: 'Sinto que meu esforço no trabalho não é reconhecido.' },
      { id: 'r2', texto: 'Sinto que sou tratado(a) de forma injusta em comparação com colegas.' },
      { id: 'r3', texto: 'As decisões que afetam meu trabalho não são explicadas de forma clara.' },
    ],
  },
  {
    id: 'assedio_conflito',
    nome: 'Assédio moral e conflitos interpessoais',
    itens: [
      { id: 'a1', texto: 'Já fui alvo de humilhação, gritos ou comentários ofensivos no trabalho.' },
      { id: 'a2', texto: 'Já presenciei colegas sendo humilhados, gritados ou tratados de forma ofensiva.' },
      { id: 'a3', texto: 'Existem conflitos frequentes e mal resolvidos entre pessoas no meu ambiente de trabalho.' },
      { id: 'a4', texto: 'Já me senti pressionado(a) ou intimidado(a) por alguém com quem trabalho.' },
    ],
  },
  {
    id: 'assedio_sexual_discriminacao',
    nome: 'Assédio sexual e discriminação',
    itens: [
      { id: 'as1', texto: 'Já presenciei ou recebi comentários, convites ou insinuações de natureza sexual indesejados no ambiente de trabalho.' },
      { id: 'as2', texto: 'Já me senti discriminado(a) (por gênero, raça, idade, orientação, religião, deficiência etc.) no trabalho.' },
      { id: 'as3', texto: 'Se precisasse denunciar algo assim, não saberia a quem recorrer com segurança.' },
    ],
  },
  {
    id: 'seguranca_emprego',
    nome: 'Segurança no emprego e mudanças organizacionais',
    itens: [
      { id: 'e1', texto: 'Tenho receio de perder meu emprego nos próximos meses.' },
      { id: 'e2', texto: 'Mudanças na empresa (processos, chefias, reestruturações) me deixam inseguro(a).' },
      { id: 'e3', texto: 'Não recebo informações claras sobre mudanças que afetam meu trabalho.' },
    ],
  },
  {
    id: 'equilibrio_vida',
    nome: 'Equilíbrio entre trabalho e vida pessoal',
    itens: [
      { id: 'v1', texto: 'Meu trabalho atrapalha minha vida pessoal ou familiar.' },
      { id: 'v2', texto: 'Penso ou me preocupo com o trabalho mesmo fora do horário de expediente.' },
      { id: 'v3', texto: 'Não consigo desconectar do trabalho durante folgas e férias.' },
    ],
  },
  {
    id: 'bem_estar',
    nome: 'Impacto percebido no bem-estar',
    itens: [
      { id: 'b1', texto: 'Sinto cansaço físico ou mental excessivo por causa do trabalho.' },
      { id: 'b2', texto: 'Tenho tido dificuldade para dormir por causa de preocupações com o trabalho.' },
      { id: 'b3', texto: 'Sinto-me desmotivado(a) ou sem energia para o trabalho.' },
    ],
  },
]

// Itens tratados como "prevalência" (fato relatado), não só média — mesmo uma
// minoria de respostas ≥4 aqui é juridicamente relevante e não deve ser
// diluída numa média geral da dimensão.
export const ITENS_PREVALENCIA_CRITICA = ['a1', 'a2', 'as1', 'as2']

export const PERGUNTAS_ABERTAS = [
  { id: 'comentario', texto: 'Há algo específico no seu dia a dia de trabalho que afeta negativamente o seu bem-estar e que não foi coberto pelas perguntas acima?' },
  { id: 'sugestao', texto: 'Você tem alguma sugestão para melhorar o ambiente de trabalho?' },
]

export function todosItens(): ItemPesquisa[] {
  return DIMENSOES_PESQUISA.flatMap(d => d.itens)
}

// Tamanho mínimo "ideal" de respostas para liberar a análise (protege o
// anonimato: abaixo disso, dá para "adivinhar" quem respondeu o quê).
export const MIN_RESPOSTAS_ANALISE = 5
// Tamanho mínimo de um subgrupo (setor) para aparecer segmentado nos
// resultados — abaixo disso, some no agregado geral da empresa. Não escala
// com o tamanho da empresa (diferente de limiteAnaliseEfetivo): segmentar por
// setor uma empresa pequena de qualquer forma expõe demais quem respondeu.
export const MIN_RESPOSTAS_SETOR = 5

// Empresas com menos funcionários que MIN_RESPOSTAS_ANALISE nunca atingiriam
// o mínimo "ideal" (ex.: empresa com 4 funcionários jamais teria 5 respostas).
// O limite efetivo cai para o tamanho do quadro de funcionários da empresa,
// nunca abaixo de 1 — a proteção de anonimato aqui é textual/de contexto
// (aviso na tela), já que com um quadro tão pequeno não há como segmentar
// mais sem já saber quem respondeu.
export function limiteAnaliseEfetivo(totalFuncionariosAtivos: number | null | undefined): number {
  if (!Number.isInteger(totalFuncionariosAtivos) || !totalFuncionariosAtivos || totalFuncionariosAtivos <= 0) {
    return MIN_RESPOSTAS_ANALISE
  }
  return Math.min(MIN_RESPOSTAS_ANALISE, totalFuncionariosAtivos)
}

export function mediaDimensao(respostasAgregadas: Record<string, number[]>, dimensaoId: string): number | null {
  const dimensao = DIMENSOES_PESQUISA.find(d => d.id === dimensaoId)
  if (!dimensao) return null
  const valores: number[] = []
  for (const item of dimensao.itens) {
    const vs = respostasAgregadas[item.id]
    if (vs) valores.push(...vs)
  }
  if (!valores.length) return null
  return valores.reduce((a, b) => a + b, 0) / valores.length
}

export function classificarNivel(media: number | null): { label: string; cor: string; bg: string } {
  if (media == null) return { label: 'Sem dados', cor: '#6b7280', bg: '#f3f4f6' }
  if (media < 2.5) return { label: 'Baixo', cor: '#27500A', bg: '#EAF3DE' }
  if (media <= 3.5) return { label: 'Moderado', cor: '#633806', bg: '#FAEEDA' }
  return { label: 'Elevado', cor: '#791F1F', bg: '#FCEBEB' }
}
