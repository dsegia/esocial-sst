-- ============================================================
-- MIGRAÇÃO 46 — Horário de funcionamento por GHE, clínica
-- designada + médico examinador e cronograma anual do PCMSO
-- Execute no Supabase → SQL Editor
-- ============================================================

-- Horário de funcionamento do GHE/setor — hoje só existe como
-- "jornada_trabalho" dentro do inventário do PGR (não sincronizado
-- com o cadastro central); passa a viver também em ghes, para que
-- PGR, PCMSO e LTCAT leiam do mesmo lugar.
ALTER TABLE ghes ADD COLUMN IF NOT EXISTS horario_funcionamento TEXT;

-- Clínica designada e médico examinador (distinto do médico
-- coordenador, que já existe em pcmso_dados.medico_nome/cpf/crm) +
-- cronograma anual de atividades do PCMSO.
ALTER TABLE pcmso_dados
  ADD COLUMN IF NOT EXISTS clinica_nome           TEXT,
  ADD COLUMN IF NOT EXISTS clinica_endereco       TEXT,
  ADD COLUMN IF NOT EXISTS clinica_cnpj           TEXT,
  ADD COLUMN IF NOT EXISTS medico_examinador_nome TEXT,
  ADD COLUMN IF NOT EXISTS medico_examinador_crm  TEXT,
  ADD COLUMN IF NOT EXISTS cronograma             JSONB NOT NULL DEFAULT '[]';

COMMENT ON COLUMN pcmso_dados.cronograma IS 'array de 12 posições: [{ mes: 1-12, atividades: string }] — cronograma anual exibido no PDF do PCMSO';
