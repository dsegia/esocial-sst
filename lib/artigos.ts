export interface Artigo {
  slug: string
  titulo: string
  resumo: string
  conteudo: string[]
  autor: string
  data: string
  tags: string[]
  leituraMinutos: number
}

export const ARTIGOS: Artigo[] = [
  {
    slug: 'o-que-e-esocial-sst',
    titulo: 'O que é o eSocial SST e quem é obrigado a transmitir em 2025',
    resumo: 'Entenda quais empresas devem enviar os eventos de Saúde e Segurança do Trabalho ao eSocial, os prazos e como funciona a obrigatoriedade.',
    autor: 'Dseg Consultoria',
    data: '2025-06-02',
    tags: ['eSocial SST', 'Obrigatoriedade', 'Legislação'],
    leituraMinutos: 5,
    conteudo: [
      'O eSocial SST é o módulo do eSocial dedicado à Saúde e Segurança do Trabalho. Por meio dele, as empresas informam ao governo federal as condições de trabalho dos empregados, os exames médicos realizados, os acidentes ocorridos e os agentes nocivos presentes no ambiente de trabalho.',
      'Desde 2023, a obrigatoriedade se aplica a todas as empresas com empregados CLT registrados — independentemente do porte ou faturamento. Isso inclui MEIs com empregados, microempresas, empresas de médio e grande porte.',
      '## Quais eventos compõem o eSocial SST?',
      'O módulo SST é composto por quatro eventos principais: **S-2210** (Comunicação de Acidente de Trabalho — CAT), **S-2220** (Monitoramento da Saúde do Trabalhador — ASO), **S-2221** (Exame Toxicológico de Longa Janela) e **S-2240** (Condições Ambientais do Trabalho).',
      '## Quando transmitir cada evento?',
      'O S-2220 deve ser enviado após qualquer ASO: admissional, periódico, de retorno ao trabalho, de mudança de função ou demissional. O prazo é de até 15 dias corridos após a realização do exame. Já o S-2240 é exigido na admissão, na mudança de função, no retorno ao trabalho após afastamento e na demissão — sempre que o cargo envolver agentes nocivos.',
      'O S-2210 (CAT) tem prazo de até o primeiro dia útil após o acidente, ou imediatamente em caso de morte. O S-2221 deve ser transmitido após cada exame toxicológico obrigatório para motoristas profissionais.',
      '## Quais são as penalidades?',
      'O não envio ou envio fora do prazo gera multa de R$ 402,53 a R$ 4.025,33 por evento não transmitido, conforme o art. 47 da CLT e a Portaria MTP 671/2021. Autuações do MTE também podem ser aplicadas.',
      'Contar com uma plataforma automatizada como o eSocial SST da Dseg Consultoria elimina o risco de perder prazos, pois o sistema envia alertas automáticos e facilita a transmissão em poucos cliques.',
    ],
  },
  {
    slug: 'como-transmitir-s2220-aso',
    titulo: 'Como transmitir o S-2220 (ASO) ao eSocial: passo a passo completo',
    resumo: 'Guia prático para médicos do trabalho e RH aprenderem a enviar o evento S-2220 corretamente, evitando rejeições e multas.',
    autor: 'Dseg Consultoria',
    data: '2025-06-09',
    tags: ['S-2220', 'ASO', 'Médico do Trabalho', 'Tutorial'],
    leituraMinutos: 6,
    conteudo: [
      'O S-2220 é o evento eSocial que registra o Atestado de Saúde Ocupacional (ASO). Deve ser enviado pelo empregador (ou por quem ele autorizar) ao governo sempre que um exame médico ocupacional for realizado.',
      '## O que precisa constar no S-2220?',
      'O XML do S-2220 exige: CNPJ do empregador, CPF e nome do trabalhador, tipo de exame (admissional, periódico, retorno, mudança de função ou demissional), data do exame, resultado (apto ou inapto), CRM e nome do médico responsável.',
      '## Por que as transmissões são rejeitadas?',
      'Os erros mais comuns de rejeição são: CPF do trabalhador não cadastrado no eSocial (evento S-2200 não enviado antes), data do exame no futuro, CRM inválido, e envio fora do prazo de 15 dias.',
      '## Como usar IA para facilitar o processo',
      'Ferramentas como o eSocial SST da Dseg Consultoria permitem importar o PDF do ASO diretamente. A inteligência artificial lê o documento, identifica o tipo de exame, extrai nome, CPF, CRM e data automaticamente, e preenche todos os campos do S-2220 sem digitação manual.',
      'Esse processo reduz erros humanos e o tempo de transmissão de cerca de 10 minutos por ASO para menos de 1 minuto.',
      '## Passo a passo no sistema',
      '1. Acesse o módulo S-2220 na plataforma. 2. Clique em "Importar PDF" e selecione o ASO. 3. Revise os dados extraídos pela IA. 4. Clique em "Transmitir ao eSocial". 5. Aguarde o recibo do governo — o sistema salva automaticamente.',
      'Com a transmissão automatizada, médicos e RH evitam retrabalho e têm histórico completo de todos os ASOs enviados com recibo e XML disponíveis para download.',
    ],
  },
  {
    slug: 'ia-leitura-pdf-aso-ltcat',
    titulo: 'Como a Inteligência Artificial lê PDFs de ASO e LTCAT para o eSocial',
    resumo: 'Descubra como a IA extrai dados de documentos PDF médico-ocupacionais e preenche automaticamente os eventos do eSocial SST.',
    autor: 'Dseg Consultoria',
    data: '2025-06-16',
    tags: ['Inteligência Artificial', 'PDF', 'ASO', 'LTCAT', 'Automação'],
    leituraMinutos: 5,
    conteudo: [
      'Uma das maiores dificuldades no cumprimento do eSocial SST é a digitação manual de dados que já estão no papel ou em PDF. Médicos do trabalho emitem ASOs com dezenas de campos; engenheiros de segurança produzem LTCATs com tabelas de agentes e EPIs. Toda essa informação precisa ser reproduzida no XML do eSocial.',
      '## Como funciona a leitura por IA?',
      'A plataforma eSocial SST da Dseg usa o modelo Claude da Anthropic — um dos LLMs mais precisos para extração de dados em português. O processo é simples: o usuário faz upload do PDF, e o modelo lê o texto completo do documento, identifica o tipo (ASO, LTCAT ou PCMSO), localiza os campos relevantes e retorna um JSON estruturado com os dados prontos para preencher o evento.',
      '## Quais documentos são suportados?',
      'O sistema suporta ASO (qualquer tipo: admissional, periódico, demissional, retorno e mudança de função), LTCAT (Laudo Técnico das Condições Ambientais do Trabalho) e PCMSO (Programa de Controle Médico de Saúde Ocupacional). PDFs escaneados com boa qualidade também são processados via OCR.',
      '## Precisão e validação',
      'A IA extrai os dados com alta precisão, mas o sistema sempre exibe os campos preenchidos para que o usuário revise antes de transmitir. Campos obrigatórios em falta são destacados em vermelho — nenhum evento sai incompleto.',
      '## Impacto prático',
      'Consultórios de medicina do trabalho que atendem dezenas de empresas relatam redução de até 80% no tempo gasto com lançamento de dados. O investimento no plano paga-se com a produtividade da primeira semana de uso.',
    ],
  },
  {
    slug: 's2240-condicoes-ambientais-trabalho',
    titulo: 'S-2240: quando enviar o evento de Condições Ambientais de Trabalho',
    resumo: 'Entenda as regras do S-2240 — quais cargos exigem o evento, quando transmitir e como o LTCAT se relaciona com o eSocial.',
    autor: 'Dseg Consultoria',
    data: '2025-06-23',
    tags: ['S-2240', 'LTCAT', 'Condições Ambientais', 'Agentes Nocivos'],
    leituraMinutos: 6,
    conteudo: [
      'O evento S-2240 registra as condições ambientais de trabalho do empregado: agentes nocivos a que está exposto (químicos, físicos, biológicos), os EPIs e EPCs fornecidos, a intensidade da exposição e a data de início da atividade de risco. É a base para o reconhecimento de aposentadoria especial.',
      '## Quando o S-2240 é obrigatório?',
      'O S-2240 deve ser enviado nas seguintes situações: na admissão de trabalhadores em cargos com agentes nocivos, quando houver mudança de função que altere as condições de exposição, no retorno ao trabalho após afastamento superior a 30 dias, e no desligamento do empregado.',
      '## O S-2240 substitui o LTCAT?',
      'Não. O LTCAT (Laudo Técnico das Condições Ambientais do Trabalho) continua sendo obrigatório e é o documento técnico que embasa o S-2240. O laudo deve ser elaborado por engenheiro de segurança ou médico do trabalho e fica na empresa. O S-2240 é o registro eletrônico ao governo com os dados do LTCAT aplicados ao trabalhador.',
      '## Erros comuns no S-2240',
      'Os principais erros são: enviar o evento para cargos sem agentes nocivos (criando obrigação desnecessária de aposentadoria especial), não atualizar após mudança de função, usar código de agente nocivo desatualizado, e omitir os EPIs fornecidos.',
      '## Como a plataforma Dseg ajuda?',
      'O sistema permite importar o LTCAT em PDF. A IA identifica os agentes nocivos, os EPIs listados e os cargos afetados, preenchendo automaticamente o S-2240 para cada trabalhador naquele cargo. O histórico de alterações fica registrado, facilitando auditorias.',
    ],
  },
  {
    slug: 'nr-35-atualizacao-2026-portaria-1259',
    titulo: 'NR-35 atualizada: o que muda com a Portaria MTE nº 1.259/2026',
    resumo: 'A NR-35 (trabalho em altura) recebeu nova atualização em julho de 2026, complementando as mudanças de Anexo III e talabarte que já valem desde janeiro. Veja o que revisar na sua empresa.',
    autor: 'Dseg Consultoria',
    data: '2026-07-17',
    tags: ['NR-35', 'Trabalho em Altura', 'Legislação', 'Atualização 2026'],
    leituraMinutos: 6,
    conteudo: [
      'A NR-35 estabelece os requisitos e as medidas de prevenção para trabalho em altura — toda atividade executada acima de 2,0 metros do nível inferior, onde haja risco de queda. Em 2026 a norma passou por mais uma rodada de ajustes, e quem administra PGR, APR e treinamentos de segurança precisa acompanhar de perto.',
      '## O que já valia desde janeiro de 2026',
      'A Portaria MTE nº 1.680/2025, com vigência a partir de 2 de janeiro de 2026, trouxe as mudanças mais estruturais dos últimos anos para a NR-35:',
      '**Anexo III — Escadas de uso individual**: reintroduzido com regras detalhadas de certificação, marcação e inspeção periódica das escadas fixas verticais de uso individual.',
      '**Hierarquia de acesso**: a escada fixa vertical de uso individual só pode ser usada quando houver comprovada inviabilidade técnica de outros meios — rampas, escadas de uso coletivo ou outros acessos mais seguros devem ser avaliados primeiro na análise de risco.',
      '**Talabarte com absorvedor de energia**: o item 35.6.9.1.1 passou a exigir expressamente que, quando o elemento de ligação para retenção de quedas for um talabarte, ele tenha absorvedor de energia integrado — talabartes simples não atendem mais à norma para essa finalidade.',
      '**Zona Livre de Queda (ZLQ)**: formalizada como o espaço mínimo que deve existir abaixo do ponto de ancoragem (talabarte) ou abaixo dos pés do trabalhador (trava-quedas), para evitar impacto com estruturas, obstáculos ou o solo em caso de queda.',
      'Além disso, a reciclagem do treinamento de NR-35 continua obrigatória a cada 2 anos, com carga horária mínima de 8 horas — inclusive para trabalhadores experientes.',
      '## O que a Portaria MTE nº 1.259/2026 adiciona',
      'Publicada em 15 de julho de 2026, a Portaria MTE nº 1.259/2026 inclui o item 35.4.5 na NR-35, revisa a redação do Anexo III sobre escadas de uso individual e altera trechos da própria Portaria nº 1.680/2025. Por ser uma norma recém-publicada, o ideal é que engenheiros de segurança e SESMTs confirmem o texto integral no Diário Oficial da União antes de alterar procedimentos internos — atualizações desse porte costumam vir acompanhadas de prazos de adequação específicos por dispositivo.',
      '## O que revisar na empresa',
      'Independentemente do detalhamento final da Portaria 1.259/2026, três frentes já merecem atenção: (1) conferir se os talabartes em uso têm absorvedor de energia integrado, (2) revisar a análise de risco de atividades que ainda dependem de escada fixa vertical para justificar a inviabilidade de outros acessos, e (3) checar se as escadas de uso individual atendem aos requisitos de certificação e marcação do Anexo III.',
      '## Como isso se conecta ao PGR e à APR',
      'As mudanças na NR-35 não são um documento isolado — elas alimentam o inventário de risco do PGR e as APRs de atividades específicas em altura. Na plataforma eSocial SST, os riscos cadastrados no PGR e os EPIs vinculados a cada função ficam centralizados numa única fonte de dados, o que facilita atualizar o inventário de risco assim que uma NR muda, sem precisar revisar documento por documento manualmente.',
    ],
  },
]

export function getArtigo(slug: string): Artigo | undefined {
  return ARTIGOS.find(a => a.slug === slug)
}
