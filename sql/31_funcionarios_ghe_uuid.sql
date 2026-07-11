-- ============================================================
-- MIGRAÇÃO 31 — funcionarios.ghe_uuid (FK real para ghes), convivendo
-- com o ghe_id (integer) legado. Idempotente.
-- Execute no Supabase → SQL Editor
-- ============================================================

ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS ghe_uuid UUID REFERENCES ghes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_funcionarios_ghe_uuid ON funcionarios(ghe_uuid);

-- Backfill: casa pelo índice original preservado em ghes.origem_ordem.
-- Só toca funcionário ainda não migrado (ghe_uuid IS NULL) com ghe_id setado.
UPDATE funcionarios f
SET ghe_uuid = g.id
FROM ghes g
WHERE f.ghe_uuid IS NULL
  AND f.ghe_id IS NOT NULL
  AND g.empresa_id = f.empresa_id
  AND g.origem_ordem = f.ghe_id;
