-- ============================================================
-- MIGRAÇÃO 40 — PCMSO: Imagens por seção
-- ============================================================

ALTER TABLE pcmso_dados ADD COLUMN IF NOT EXISTS secoes_imagens JSONB NOT NULL DEFAULT '{}';

-- secoes_imagens: mapa { [id_secao]: url_imagem }
-- Armazena URLs públicas das imagens de cada seção
-- Ex: { "perfil-profissiografico": "https://...", "pca": "https://..." }
