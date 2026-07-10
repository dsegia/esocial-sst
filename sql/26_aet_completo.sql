-- ============================================================
-- MIGRAÇÃO 26 — AET completa (NR-17): textos legais editáveis
-- Execute no Supabase → SQL Editor
-- ============================================================

ALTER TABLE aet ADD COLUMN IF NOT EXISTS textos_legais_custom JSONB NOT NULL DEFAULT '{}';

-- Sem mudança nos campos de postos_trabalho (jsonb já existente) —
-- os novos campos de organização do trabalho (descricao_organizacao_trabalho,
-- controle_rigido_produtividade, trabalho_noturno_turnos, pausas_previstas)
-- entram direto dentro de cada item do array, sem precisar de coluna nova.
