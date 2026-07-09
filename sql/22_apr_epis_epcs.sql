-- ============================================================
-- MIGRAÇÃO 22 — EPIs/EPCs aplicáveis na APR + novos campos de etapa
-- Execute no Supabase → SQL Editor
-- ============================================================

ALTER TABLE apr ADD COLUMN IF NOT EXISTS epis JSONB NOT NULL DEFAULT '[]';
ALTER TABLE apr ADD COLUMN IF NOT EXISTS epcs JSONB NOT NULL DEFAULT '[]';

-- Nota: os campos de cada item em "etapas" mudam de
--   { etapa, risco, causa, medida_controle, responsavel }
-- para
--   { atividade, perigo, efeito_impacto, acao_preventiva, responsavel_acao }
-- Como "etapas" é JSONB sem schema fixo, não há migração de dados necessária —
-- APRs antigas continuam exibindo os campos antigos como vazios até serem reeditadas.
