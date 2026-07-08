-- ============================================================
-- MIGRAÇÃO 16 — Tabela pgr (Programa de Gerenciamento de Riscos, NR-1)
-- Execute no Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS pgr (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_elaboracao DATE,
  prox_revisao    DATE,
  resp_nome       TEXT,
  resp_conselho   TEXT DEFAULT 'CREA',
  resp_registro   TEXT,
  inventario      JSONB NOT NULL DEFAULT '[]',
  plano_acao      JSONB NOT NULL DEFAULT '[]',
  ativo           BOOLEAN NOT NULL DEFAULT true,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pgr_empresa ON pgr(empresa_id);

-- RLS
ALTER TABLE pgr ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver pgr da empresa" ON pgr;
DROP POLICY IF EXISTS "usuarios podem inserir pgr" ON pgr;
DROP POLICY IF EXISTS "usuarios podem editar pgr" ON pgr;
DROP POLICY IF EXISTS "usuarios podem deletar pgr" ON pgr;

CREATE POLICY "usuarios podem ver pgr da empresa" ON pgr
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuario_empresas
      WHERE usuario_id = auth.uid() AND empresa_id = pgr.empresa_id
    ) OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND empresa_id = pgr.empresa_id
    )
  );

CREATE POLICY "usuarios podem inserir pgr" ON pgr
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuario_empresas
      WHERE usuario_id = auth.uid() AND empresa_id = pgr.empresa_id
    ) OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND empresa_id = pgr.empresa_id
    )
  );

CREATE POLICY "usuarios podem editar pgr" ON pgr
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM usuario_empresas
      WHERE usuario_id = auth.uid() AND empresa_id = pgr.empresa_id
    ) OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND empresa_id = pgr.empresa_id
    )
  );

CREATE POLICY "usuarios podem deletar pgr" ON pgr
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM usuario_empresas
      WHERE usuario_id = auth.uid() AND empresa_id = pgr.empresa_id
    ) OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND empresa_id = pgr.empresa_id
    )
  );
