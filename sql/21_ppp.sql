-- ============================================================
-- MIGRAÇÃO 21 — Tabela ppp (Perfil Profissiográfico Previdenciário)
-- Execute no Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS ppp (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  funcionario_id  UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE UNIQUE,
  data_emissao    DATE,
  resp_nome       TEXT,
  resp_cargo      TEXT,
  historico       JSONB NOT NULL DEFAULT '[]',
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ppp_empresa ON ppp(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ppp_funcionario ON ppp(funcionario_id);

ALTER TABLE ppp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver ppp da empresa" ON ppp;
DROP POLICY IF EXISTS "usuarios podem inserir ppp" ON ppp;
DROP POLICY IF EXISTS "usuarios podem editar ppp" ON ppp;
DROP POLICY IF EXISTS "usuarios podem deletar ppp" ON ppp;

CREATE POLICY "usuarios podem ver ppp da empresa" ON ppp
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = ppp.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = ppp.empresa_id)
  );

CREATE POLICY "usuarios podem inserir ppp" ON ppp
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = ppp.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = ppp.empresa_id)
  );

CREATE POLICY "usuarios podem editar ppp" ON ppp
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = ppp.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = ppp.empresa_id)
  );

CREATE POLICY "usuarios podem deletar ppp" ON ppp
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = ppp.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = ppp.empresa_id)
  );
