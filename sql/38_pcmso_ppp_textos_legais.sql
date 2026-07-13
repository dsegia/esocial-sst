-- ============================================================
-- MIGRAÇÃO 38 — PCMSO e PPP: textos legais editáveis (mesmo
-- padrão já usado em pgr/aet/ltcat/lip — migrações 25 e 37)
-- Execute no Supabase → SQL Editor
-- ============================================================

ALTER TABLE pcmso_dados ADD COLUMN IF NOT EXISTS textos_legais_custom JSONB NOT NULL DEFAULT '{}';
ALTER TABLE ppp         ADD COLUMN IF NOT EXISTS textos_legais_custom JSONB NOT NULL DEFAULT '{}';

-- textos_legais_custom: mapa { [titulo_da_secao]: string[] } — só as seções
-- editadas pelo usuário aparecem aqui; o resto usa o texto padrão de
-- lib/pcmso-conteudo.ts (TEXTOS_LEGAIS_PCMSO) / lib/ppp-conteudo.ts
-- (TEXTOS_LEGAIS_PPP).
--
-- pcmso_dados: um registro por empresa (upsert onConflict empresa_id) —
-- mesma lógica de "documento único" do LTCAT/LIP.
-- ppp: um registro por funcionário (upsert onConflict funcionario_id) —
-- a edição de texto é por PPP individual, não por empresa; é a mesma
-- granularidade que o restante do documento já tem.
