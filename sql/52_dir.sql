-- ============================================================
-- MIGRAÇÃO 52 — Tabela dir (Declaração de Inexistência de Risco)
-- Execute no Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS dir (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_elaboracao       DATE,
  prox_revisao          DATE,
  resp_nome             TEXT,
  resp_conselho         TEXT DEFAULT 'CREA',
  resp_registro         TEXT,
  resp_cpf              TEXT,
  funcoes               JSONB NOT NULL DEFAULT '[]',
  textos_legais_custom  JSONB NOT NULL DEFAULT '{}',
  ativo                 BOOLEAN NOT NULL DEFAULT true,
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dir_empresa ON dir(empresa_id);

ALTER TABLE dir ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver dir da empresa" ON dir;
DROP POLICY IF EXISTS "usuarios podem inserir dir" ON dir;
DROP POLICY IF EXISTS "usuarios podem editar dir" ON dir;
DROP POLICY IF EXISTS "usuarios podem deletar dir" ON dir;

CREATE POLICY "usuarios podem ver dir da empresa" ON dir
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = dir.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = dir.empresa_id)
  );

CREATE POLICY "usuarios podem inserir dir" ON dir
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = dir.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = dir.empresa_id)
  );

CREATE POLICY "usuarios podem editar dir" ON dir
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = dir.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = dir.empresa_id)
  );

CREATE POLICY "usuarios podem deletar dir" ON dir
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = dir.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = dir.empresa_id)
  );
