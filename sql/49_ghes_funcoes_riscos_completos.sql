-- Expande o cadastro central de GHEs (ghes) para ser a base única de PGR/LTCAT/PCMSO:
-- `funcoes` deixa de ser array de strings e passa a ser array de objetos com
-- CBO/nível/atividades/requisitos (mesmo shape que já existia isolado no PGR).
-- A coluna `atividades_por_funcao` (criada fora de migração versionada) é absorvida
-- em funcoes[].atividades e removida.
-- `riscos[]` e `epi[]` continuam JSONB sem coluna própria — os novos campos
-- (perigo, fontes_circunstancias, severidade, probabilidade, trajetoria,
-- tipo_exposicao, atenuacao) são adicionados pelo aplicativo a partir de agora,
-- sem necessidade de backfill (ausência de chave = undefined no frontend).

update ghes
set funcoes = (
  select coalesce(jsonb_agg(jsonb_build_object(
    'nome', fn, 'cbo', '', 'nivel', 'Pleno',
    'atividades', coalesce(atividades_por_funcao->>fn, ''), 'requisitos', ''
  )), '[]'::jsonb)
  from jsonb_array_elements_text(funcoes) as fn
)
where jsonb_typeof(funcoes) = 'array'
  and (funcoes = '[]'::jsonb or jsonb_typeof(funcoes->0) = 'string');

alter table ghes drop column atividades_por_funcao;
