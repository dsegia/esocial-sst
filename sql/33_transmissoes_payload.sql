-- ============================================================
-- MIGRAÇÃO 33 — transmissoes.payload (JSONB), usado por eventos sem
-- tabela própria (ex: S-2221 exame toxicológico). Idempotente.
-- Já aplicada em produção via MCP Supabase em 11/07/2026.
-- ============================================================

ALTER TABLE transmissoes ADD COLUMN IF NOT EXISTS payload JSONB;
