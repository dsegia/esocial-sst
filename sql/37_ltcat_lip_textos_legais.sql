-- ============================================================
-- MIGRAÇÃO 37 — LTCAT e LIP: textos legais editáveis (mesmo
-- padrão já usado em pgr/aet — migração 25)
-- Execute no Supabase → SQL Editor
-- ============================================================

ALTER TABLE ltcats ADD COLUMN IF NOT EXISTS textos_legais_custom JSONB NOT NULL DEFAULT '{}';
ALTER TABLE lip    ADD COLUMN IF NOT EXISTS textos_legais_custom JSONB NOT NULL DEFAULT '{}';

-- textos_legais_custom: mapa { [titulo_da_secao]: string[] } — só as seções
-- editadas pelo usuário aparecem aqui; o resto usa o texto padrão de
-- lib/ltcat-conteudo.ts (TEXTOS_LEGAIS_LTCAT) / lib/lip-conteudo.ts
-- (TEXTOS_LEGAIS_LIP). Sem migração de dados necessária (mesma lógica
-- da migração 25).
--
-- PCMSO e PPP também ganharam textos padrão mais abrangentes
-- (lib/pcmso-conteudo.ts, lib/ppp-conteudo.ts) e já aparecem no PDF,
-- mas sem editor de UI nesta rodada — o modelo de dados desses dois
-- documentos (pcmso_programa por função / ppp por funcionário) não tem
-- um registro único "documento" para pendurar a coluna, diferente de
-- pgr/aet/ltcat/lip.
