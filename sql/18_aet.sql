-- ============================================================
-- MIGRAÇÃO 18 — Tabela aet (Análise Ergonômica do Trabalho, NR-17)
-- Execute no Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS aet (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_elaboracao DATE,
  prox_revisao    DATE,
  resp_nome       TEXT,
  resp_conselho   TEXT DEFAULT 'CREA',
  resp_registro   TEXT,
  resp_cpf        TEXT,
  postos_trabalho JSONB NOT NULL DEFAULT '[]',
  ativo           BOOLEAN NOT NULL DEFAULT true,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aet_empresa ON aet(empresa_id);

ALTER TABLE aet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver aet da empresa" ON aet;
DROP POLICY IF EXISTS "usuarios podem inserir aet" ON aet;
DROP POLICY IF EXISTS "usuarios podem editar aet" ON aet;
DROP POLICY IF EXISTS "usuarios podem deletar aet" ON aet;

CREATE POLICY "usuarios podem ver aet da empresa" ON aet
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = aet.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = aet.empresa_id)
  );

CREATE POLICY "usuarios podem inserir aet" ON aet
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = aet.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = aet.empresa_id)
  );

CREATE POLICY "usuarios podem editar aet" ON aet
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = aet.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = aet.empresa_id)
  );

CREATE POLICY "usuarios podem deletar aet" ON aet
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = aet.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = aet.empresa_id)
  );
