-- ============================================================
-- MIGRAÇÃO 34 — pcmso_programa: unicidade por função + setor
-- A constraint original só considerava `funcao`, mas o app
-- (pages/pcmso.jsx, salvarPrograma) sempre decidiu INSERT vs UPDATE
-- comparando funcao E setor — criar um 2º programa da mesma função em
-- outro setor quebrava com erro de unique constraint no banco.
-- ============================================================

ALTER TABLE pcmso_programa
  DROP CONSTRAINT IF EXISTS pcmso_programa_empresa_funcao;

ALTER TABLE pcmso_programa
  ADD CONSTRAINT pcmso_programa_empresa_funcao_setor UNIQUE (empresa_id, funcao, setor);
