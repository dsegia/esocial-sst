-- ============================================================
-- MIGRAÇÃO 20 — Tabela lip (Laudo de Insalubridade e Periculosidade, NR-15/16)
-- Execute no Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS lip (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_elaboracao DATE,
  prox_revisao    DATE,
  resp_nome       TEXT,
  resp_conselho   TEXT DEFAULT 'CREA',
  resp_registro   TEXT,
  resp_cpf        TEXT,
  funcoes         JSONB NOT NULL DEFAULT '[]',
  ativo           BOOLEAN NOT NULL DEFAULT true,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lip_empresa ON lip(empresa_id);

ALTER TABLE lip ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver lip da empresa" ON lip;
DROP POLICY IF EXISTS "usuarios podem inserir lip" ON lip;
DROP POLICY IF EXISTS "usuarios podem editar lip" ON lip;
DROP POLICY IF EXISTS "usuarios podem deletar lip" ON lip;

CREATE POLICY "usuarios podem ver lip da empresa" ON lip
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = lip.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = lip.empresa_id)
  );

CREATE POLICY "usuarios podem inserir lip" ON lip
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = lip.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = lip.empresa_id)
  );

CREATE POLICY "usuarios podem editar lip" ON lip
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = lip.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = lip.empresa_id)
  );

CREATE POLICY "usuarios podem deletar lip" ON lip
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = lip.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = lip.empresa_id)
  );
