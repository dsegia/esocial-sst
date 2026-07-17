-- ============================================================
-- MIGRAÇÃO 47 — Suporte a múltiplos médicos examinadores no PCMSO
-- Execute no Supabase → SQL Editor
-- ============================================================

-- Substitui medico_examinador_nome/medico_examinador_crm (um único) por uma
-- lista — a clínica designada pode ter mais de um médico examinador.
ALTER TABLE pcmso_dados ADD COLUMN IF NOT EXISTS medicos_examinadores JSONB NOT NULL DEFAULT '[]';

COMMENT ON COLUMN pcmso_dados.medicos_examinadores IS 'array de { nome, crm } — médicos examinadores da clínica designada';
