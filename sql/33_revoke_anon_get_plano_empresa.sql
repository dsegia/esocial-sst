-- ============================================================
-- MIGRAÇÃO 33 — Remove EXECUTE órfão de `anon` em get_plano_empresa
-- Todas as migrações anteriores já faziam REVOKE ALL FROM PUBLIC +
-- GRANT TO authenticated, mas o advisor de segurança do Supabase
-- apontou que `anon` ainda tinha EXECUTE (provável resíduo de uma
-- versão anterior à 07_security_fixes.sql, preservado por CREATE OR
-- REPLACE). A função já valida auth.uid() contra usuario_empresas/
-- usuarios internamente, então não havia vazamento de dados — isto
-- é hardening defense-in-depth, não uma correção de exploração ativa.
-- Execute no Supabase → SQL Editor
-- ============================================================

REVOKE ALL ON FUNCTION get_plano_empresa FROM anon;
