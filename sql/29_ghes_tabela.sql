-- ============================================================
-- MIGRAÇÃO 29 — Tabela `ghes` (cadastro central de GHEs/riscos)
-- Execute no Supabase → SQL Editor
-- Puramente aditiva: nenhuma tabela/coluna existente é tocada.
-- ============================================================

CREATE TABLE IF NOT EXISTS ghes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome                    TEXT NOT NULL DEFAULT '',
  setor                   TEXT NOT NULL DEFAULT '',
  qtd_trabalhadores       INTEGER NOT NULL DEFAULT 1,
  aposentadoria_especial  BOOLEAN NOT NULL DEFAULT false,
  funcoes                 JSONB NOT NULL DEFAULT '[]',
  -- cada item de riscos: { id uuid, tipo, nome, valor, limite, unidade, supera_lt,
  --                        medicao_quantitativa bool, metodologia, codigo_esocial, fonte_geradora }
  riscos                  JSONB NOT NULL DEFAULT '[]',
  epc                     JSONB NOT NULL DEFAULT '[]',
  epi                     JSONB NOT NULL DEFAULT '[]',
  ativo                   BOOLEAN NOT NULL DEFAULT true,
  origem_ltcat_id         UUID,      -- rastreabilidade do backfill (migração 30)
  origem_ordem            INTEGER,   -- índice original no array ltcats.ghes no momento do backfill; usado pela migração 31
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghes_empresa ON ghes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ghes_empresa_ativo ON ghes(empresa_id, ativo);

ALTER TABLE ghes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver ghes da empresa" ON ghes;
DROP POLICY IF EXISTS "usuarios podem inserir ghes" ON ghes;
DROP POLICY IF EXISTS "usuarios podem editar ghes" ON ghes;
DROP POLICY IF EXISTS "usuarios podem deletar ghes" ON ghes;

CREATE POLICY "usuarios podem ver ghes da empresa" ON ghes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = ghes.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = ghes.empresa_id)
  );

CREATE POLICY "usuarios podem inserir ghes" ON ghes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = ghes.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = ghes.empresa_id)
  );

CREATE POLICY "usuarios podem editar ghes" ON ghes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = ghes.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = ghes.empresa_id)
  );

CREATE POLICY "usuarios podem deletar ghes" ON ghes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = ghes.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = ghes.empresa_id)
  );
