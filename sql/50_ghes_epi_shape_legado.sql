-- Corrige um formato legado de `ghes.epi` encontrado em produção — nunca escrito
-- por nenhum código deste repositório (confirmado via `git log -p`), então
-- provavelmente inserido manualmente ou por uma ferramenta externa ao projeto.
-- Formato legado: [{ funcao, legenda, protecao: [nome, nome, ...] }] (um item
-- por função, repetindo a mesma lista de proteção).
-- Formato esperado pelo app inteiro: [{ nome, ca, eficaz }] (lista única por GHE).
-- Como os itens de `protecao` já eram idênticos entre as funções de cada GHE
-- (mesma lista repetida), a conversão para lista única e deduplicada não perde
-- informação. `funcao`/`legenda` não têm equivalente no modelo atual e são descartados.
update ghes
set epi = (
  select coalesce(jsonb_agg(jsonb_build_object('nome', item, 'ca', '', 'eficaz', true)), '[]'::jsonb)
  from (
    select distinct item
    from jsonb_array_elements(epi) as elem,
         jsonb_array_elements_text(elem->'protecao') as item
  ) distintos
)
where jsonb_typeof(epi) = 'array'
  and exists (
    select 1 from jsonb_array_elements(epi) as elem
    where elem ? 'protecao' and not (elem ? 'nome')
  );
