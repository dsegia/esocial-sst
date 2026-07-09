-- ============================================================
-- MIGRAÇÃO 19 — Tabela apr (Análise Preliminar de Risco)
-- Execute no Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS apr (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  atividade       TEXT NOT NULL,
  local           TEXT,
  data_realizacao DATE,
  resp_nome       TEXT,
  resp_cargo      TEXT,
  etapas          JSONB NOT NULL DEFAULT '[]',
  equipe          JSONB NOT NULL DEFAULT '[]',
  ativo           BOOLEAN NOT NULL DEFAULT true,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apr_empresa ON apr(empresa_id);

ALTER TABLE apr ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver apr da empresa" ON apr;
DROP POLICY IF EXISTS "usuarios podem inserir apr" ON apr;
DROP POLICY IF EXISTS "usuarios podem editar apr" ON apr;
DROP POLICY IF EXISTS "usuarios podem deletar apr" ON apr;

CREATE POLICY "usuarios podem ver apr da empresa" ON apr
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = apr.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = apr.empresa_id)
  );

CREATE POLICY "usuarios podem inserir apr" ON apr
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = apr.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = apr.empresa_id)
  );

CREATE POLICY "usuarios podem editar apr" ON apr
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = apr.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = apr.empresa_id)
  );

CREATE POLICY "usuarios podem deletar apr" ON apr
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = apr.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = apr.empresa_id)
  );
