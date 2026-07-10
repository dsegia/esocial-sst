-- ============================================================
-- MIGRAÇÃO 25 — PGR: textos legais editáveis + imagens anexas
-- Execute no Supabase → SQL Editor
-- ============================================================

ALTER TABLE pgr ADD COLUMN IF NOT EXISTS textos_legais_custom JSONB NOT NULL DEFAULT '{}';
ALTER TABLE pgr ADD COLUMN IF NOT EXISTS imagens_anexas JSONB NOT NULL DEFAULT '[]';

-- textos_legais_custom: mapa { [titulo_da_secao]: string[] } — só as seções
-- editadas pelo usuário aparecem aqui; o resto usa o texto padrão de
-- lib/pgr-conteudo.ts (TEXTOS_LEGAIS_PGR).
-- imagens_anexas: [{ dataUrl, legenda }] — apêndice geral de imagens.
-- ambientes[i].imagens (dentro do jsonb existente "ambientes"): string[] de
-- data URLs — fotos daquele ambiente específico. Sem migração de dados
-- necessária (mesma lógica das migrações 22/23).
