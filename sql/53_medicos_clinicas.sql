-- ============================================================
-- MIGRAÇÃO 53 — Tabelas medicos e clinicas (cadastros reutilizáveis)
-- Execute no Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS medicos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  cpf            TEXT,
  crm            TEXT,
  especialidade  TEXT DEFAULT 'Medicina do Trabalho',
  telefone       TEXT,
  email          TEXT,
  ativo          BOOLEAN NOT NULL DEFAULT true,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinicas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  cnpj           TEXT,
  endereco       TEXT,
  telefone       TEXT,
  email          TEXT,
  ativo          BOOLEAN NOT NULL DEFAULT true,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicos_empresa ON medicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clinicas_empresa ON clinicas(empresa_id);

ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver medicos da empresa" ON medicos;
DROP POLICY IF EXISTS "usuarios podem inserir medicos" ON medicos;
DROP POLICY IF EXISTS "usuarios podem editar medicos" ON medicos;
DROP POLICY IF EXISTS "usuarios podem deletar medicos" ON medicos;

CREATE POLICY "usuarios podem ver medicos da empresa" ON medicos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = medicos.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = medicos.empresa_id)
  );

CREATE POLICY "usuarios podem inserir medicos" ON medicos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = medicos.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = medicos.empresa_id)
  );

CREATE POLICY "usuarios podem editar medicos" ON medicos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = medicos.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = medicos.empresa_id)
  );

CREATE POLICY "usuarios podem deletar medicos" ON medicos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = medicos.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = medicos.empresa_id)
  );

DROP POLICY IF EXISTS "usuarios podem ver clinicas da empresa" ON clinicas;
DROP POLICY IF EXISTS "usuarios podem inserir clinicas" ON clinicas;
DROP POLICY IF EXISTS "usuarios podem editar clinicas" ON clinicas;
DROP POLICY IF EXISTS "usuarios podem deletar clinicas" ON clinicas;

CREATE POLICY "usuarios podem ver clinicas da empresa" ON clinicas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = clinicas.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = clinicas.empresa_id)
  );

CREATE POLICY "usuarios podem inserir clinicas" ON clinicas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = clinicas.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = clinicas.empresa_id)
  );

CREATE POLICY "usuarios podem editar clinicas" ON clinicas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = clinicas.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = clinicas.empresa_id)
  );

CREATE POLICY "usuarios podem deletar clinicas" ON clinicas
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = clinicas.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = clinicas.empresa_id)
  );
