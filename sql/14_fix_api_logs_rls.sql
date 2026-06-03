-- ============================================================
-- MIGRAÇÃO 14 — Restringe acesso SELECT à tabela api_logs
-- Problema: api_logs tinha RLS habilitado mas sem policy de SELECT,
--   permitindo que qualquer usuário autenticado lesse todos os logs
--   de IA de todas as empresas (violação de isolamento multi-tenant)
-- Execute no Supabase → SQL Editor
-- ============================================================

-- Bloqueia SELECT via RLS para usuários normais (apenas service_role lê)
DROP POLICY IF EXISTS "api_logs: apenas service role" ON api_logs;
CREATE POLICY "api_logs: apenas service role" ON api_logs
  FOR SELECT USING (false);

-- INSERT: permite apenas via service_role (já era o comportamento)
DROP POLICY IF EXISTS "api_logs: insert service role" ON api_logs;
CREATE POLICY "api_logs: insert service role" ON api_logs
  FOR INSERT WITH CHECK (true);
