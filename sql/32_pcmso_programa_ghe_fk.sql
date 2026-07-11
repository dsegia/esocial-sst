-- ============================================================
-- MIGRAÇÃO 32 — pcmso_programa.ghe_id (FK para ghes), nullable.
-- Execute no Supabase → SQL Editor
-- ============================================================

ALTER TABLE pcmso_programa ADD COLUMN IF NOT EXISTS ghe_id UUID REFERENCES ghes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pcmso_programa_ghe ON pcmso_programa(ghe_id);
