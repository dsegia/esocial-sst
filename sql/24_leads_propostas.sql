-- ============================================================
-- MIGRAÇÃO 24 — Tabela leads_propostas (captura de leads do site)
-- Execute no Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS leads_propostas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             TEXT NOT NULL,
  empresa          TEXT,
  email            TEXT NOT NULL,
  telefone         TEXT,
  funcionarios     TEXT,
  plano_interesse  TEXT,
  mensagem         TEXT,
  origem           TEXT NOT NULL DEFAULT 'site',
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_propostas_criado_em ON leads_propostas(criado_em DESC);

ALTER TABLE leads_propostas ENABLE ROW LEVEL SECURITY;

-- Sem políticas: só a service role (API route server-side) lê/grava.
-- Anon e authenticated ficam bloqueados por padrão (RLS deny-all).
