-- ============================================================
-- MIGRAÇÃO 17 — resp_cpf em ltcats + tabela pcmso_dados (médico coordenador)
-- Execute no Supabase → SQL Editor
-- ============================================================

ALTER TABLE ltcats ADD COLUMN IF NOT EXISTS resp_cpf TEXT;

CREATE TABLE IF NOT EXISTS pcmso_dados (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE UNIQUE,
  medico_nome     TEXT,
  medico_cpf      TEXT,
  medico_crm      TEXT,
  data_elaboracao DATE,
  prox_revisao    DATE,
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pcmso_dados_empresa ON pcmso_dados(empresa_id);

ALTER TABLE pcmso_dados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver pcmso_dados da empresa" ON pcmso_dados;
DROP POLICY IF EXISTS "usuarios podem inserir pcmso_dados" ON pcmso_dados;
DROP POLICY IF EXISTS "usuarios podem editar pcmso_dados" ON pcmso_dados;
DROP POLICY IF EXISTS "usuarios podem deletar pcmso_dados" ON pcmso_dados;

CREATE POLICY "usuarios podem ver pcmso_dados da empresa" ON pcmso_dados
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = pcmso_dados.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = pcmso_dados.empresa_id)
  );

CREATE POLICY "usuarios podem inserir pcmso_dados" ON pcmso_dados
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = pcmso_dados.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = pcmso_dados.empresa_id)
  );

CREATE POLICY "usuarios podem editar pcmso_dados" ON pcmso_dados
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = pcmso_dados.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = pcmso_dados.empresa_id)
  );

CREATE POLICY "usuarios podem deletar pcmso_dados" ON pcmso_dados
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = pcmso_dados.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = pcmso_dados.empresa_id)
  );
