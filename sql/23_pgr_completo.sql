-- ============================================================
-- MIGRAÇÃO 23 — Reconstrução do PGR: dados completos da empresa + ambientes
-- Execute no Supabase → SQL Editor
-- ============================================================

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cnae_descricao TEXT;

ALTER TABLE pgr ADD COLUMN IF NOT EXISTS ambientes JSONB NOT NULL DEFAULT '[]';

-- Nota: os itens de pgr.inventario e pgr.plano_acao ganham novos campos
-- (funcao, perigo, fontes_circunstancias, codigo_esocial, risco, possiveis_danos,
-- severidade, probabilidade, limite, equipamento, trajetoria, tipo_exposicao no
-- inventario; justificativa, como, onde, priorizacao, epis no plano_acao).
-- Como ambos já são JSONB sem schema fixo, não há migração de dados necessária —
-- PGRs antigos continuam funcionando, só sem esses campos até serem reeditados.
