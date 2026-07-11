-- ============================================================
-- MIGRAÇÃO 30 — Backfill de `ghes` a partir do LTCAT ativo de cada empresa
-- Idempotente: só insere para empresa_id sem nenhuma linha em `ghes` ainda.
-- Execute no Supabase → SQL Editor
-- ============================================================

WITH ltcat_ativo AS (
  SELECT DISTINCT ON (empresa_id) id, empresa_id, ghes
  FROM ltcats
  WHERE ativo = true
  ORDER BY empresa_id, data_emissao DESC NULLS LAST
),
elementos AS (
  SELECT
    la.empresa_id,
    la.id                     AS ltcat_id,
    (t.ord - 1)::int          AS ordem_original,   -- ordinality é 1-based; índice do array JS é 0-based
    t.elem                    AS ghe_json
  FROM ltcat_ativo la
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(la.ghes, '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
  WHERE NOT EXISTS (SELECT 1 FROM ghes g WHERE g.empresa_id = la.empresa_id)
)
INSERT INTO ghes (
  empresa_id, nome, setor, qtd_trabalhadores, aposentadoria_especial,
  funcoes, riscos, epc, epi, ativo, origem_ltcat_id, origem_ordem, criado_em, atualizado_em
)
SELECT
  empresa_id,
  COALESCE(ghe_json->>'nome', ''),
  COALESCE(ghe_json->>'setor', ''),
  COALESCE((ghe_json->>'qtd_trabalhadores')::int, 1),
  COALESCE((ghe_json->>'aposentadoria_especial')::boolean, false),
  COALESCE(ghe_json->'funcoes', '[]'::jsonb),
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', gen_random_uuid(),
        'tipo', ag->>'tipo',
        'nome', ag->>'nome',
        'valor', COALESCE(ag->>'valor', ''),
        'limite', COALESCE(ag->>'limite', ''),
        'unidade', COALESCE(ag->>'unidade', ''),
        'supera_lt', COALESCE((ag->>'supera_lt')::boolean, false),
        'medicao_quantitativa', COALESCE(ag->>'valor', '') <> '',
        'metodologia', '',
        'codigo_esocial', COALESCE(ag->>'codigo_t24', ''),
        'fonte_geradora', ''
      )
    )
    FROM jsonb_array_elements(COALESCE(ghe_json->'agentes', '[]'::jsonb)) ag
  ), '[]'::jsonb),
  COALESCE(ghe_json->'epc', '[]'::jsonb),
  COALESCE(ghe_json->'epi', '[]'::jsonb),
  true,
  ltcat_id,
  ordem_original,
  NOW(), NOW()
FROM elementos;
