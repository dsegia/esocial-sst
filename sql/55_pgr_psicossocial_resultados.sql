-- ============================================================
-- MIGRAÇÃO 55 — PGR: tabela de resultados da pesquisa psicossocial
-- Execute no Supabase → SQL Editor
-- Puramente aditiva: nenhuma tabela/coluna existente é tocada.
-- ============================================================

ALTER TABLE pgr ADD COLUMN IF NOT EXISTS psicossocial_resultados JSONB NOT NULL DEFAULT '{}';

-- psicossocial_resultados: snapshot dos agregados no momento em que a
-- análise por IA foi gerada (pages/api/gerar-analise-psicossocial-ia.js),
-- usado só para desenhar a tabela de resultados no PDF (lib/gerar-pdf.ts),
-- sem que o gerador de PDF precise consultar o Supabase.
-- Formato: { gerado_em, total_respostas,
--            dimensoes: [{ nome, media, nivel_label, nivel_cor, nivel_bg }],
--            itens_criticos: [{ texto, percentual }] }
