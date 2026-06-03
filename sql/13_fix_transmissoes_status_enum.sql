-- ============================================================
-- MIGRAÇÃO 13 — Corrige enum de status de transmissões
-- Problema: schema original usava 'erro' mas código usa 'cancelado'
-- Adiciona também coluna resposta_govbr usada em consultar-lote.js
-- Execute no Supabase → SQL Editor
-- ============================================================

-- 1. Remover constraint de check antiga (status IN (..., 'erro'))
DO $$
BEGIN
  ALTER TABLE transmissoes DROP CONSTRAINT IF EXISTS transmissoes_status_check;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. Recriar com valores corretos (adiciona 'cancelado', remove 'erro')
ALTER TABLE transmissoes
  ADD CONSTRAINT transmissoes_status_check
    CHECK (status IN ('pendente', 'enviado', 'rejeitado', 'lote', 'cancelado'));

-- 3. Migrar registros com status='erro' para 'rejeitado' (se existirem)
UPDATE transmissoes SET status = 'rejeitado' WHERE status = 'erro';

-- 4. Adicionar coluna resposta_govbr (usada em consultar-lote.js para armazenar retorno do Gov.br)
ALTER TABLE transmissoes
  ADD COLUMN IF NOT EXISTS resposta_govbr TEXT;
