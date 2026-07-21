-- ============================================================
-- MIGRAÇÃO 51 — Tabela aep (Atestado de Exposição a Agentes Nocivos)
-- Execute no Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS aep (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  funcionario_id        UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE UNIQUE,
  data_emissao          DATE,
  periodo_inicio        DATE,
  periodo_fim           DATE,
  funcao                TEXT,
  setor                 TEXT,
  agentes               JSONB NOT NULL DEFAULT '[]',
  epc_epi_eficaz        BOOLEAN NOT NULL DEFAULT true,
  conclusao             TEXT,
  resp_nome             TEXT,
  resp_cargo            TEXT,
  resp_conselho         TEXT DEFAULT 'CREA',
  resp_registro         TEXT,
  textos_legais_custom  JSONB NOT NULL DEFAULT '{}',
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aep_empresa ON aep(empresa_id);
CREATE INDEX IF NOT EXISTS idx_aep_funcionario ON aep(funcionario_id);

ALTER TABLE aep ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver aep da empresa" ON aep;
DROP POLICY IF EXISTS "usuarios podem inserir aep" ON aep;
DROP POLICY IF EXISTS "usuarios podem editar aep" ON aep;
DROP POLICY IF EXISTS "usuarios podem deletar aep" ON aep;

CREATE POLICY "usuarios podem ver aep da empresa" ON aep
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = aep.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = aep.empresa_id)
  );

CREATE POLICY "usuarios podem inserir aep" ON aep
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = aep.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = aep.empresa_id)
  );

CREATE POLICY "usuarios podem editar aep" ON aep
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = aep.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = aep.empresa_id)
  );

CREATE POLICY "usuarios podem deletar aep" ON aep
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = aep.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = aep.empresa_id)
  );
