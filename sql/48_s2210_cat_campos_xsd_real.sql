-- Baixei o XSD oficial real do evtCAT (github.com/nfephp-org/sped-esocial,
-- v_S_01_03_00) e o bloco <cat> tem mais campos obrigatórios do que o mapeado
-- na auditoria original: hrsTrabAntesAcid, ultDiaTrab, houveAfast, dtObito
-- (filho direto de cat, não dentro de um wrapper infoObito) e catOrigem/
-- nrRecCatOrig (obrigatório se tpCat = reabertura/óbito). ind_cat_obito
-- (migração 47) duplicava a coluna houve_morte já existente — removida.

ALTER TABLE cats
  DROP COLUMN IF EXISTS ind_cat_obito,
  ADD COLUMN IF NOT EXISTS dt_obito             DATE,
  ADD COLUMN IF NOT EXISTS hrs_trab_antes_acid  TEXT,
  ADD COLUMN IF NOT EXISTS ult_dia_trab         DATE,
  ADD COLUMN IF NOT EXISTS nr_rec_cat_origem    TEXT;

COMMENT ON COLUMN cats.dt_obito IS 'data real do óbito — obrigatório e exclusivo quando houve_morte = true (mapeia indCatObito=S)';
COMMENT ON COLUMN cats.hrs_trab_antes_acid IS 'HHMM — horas trabalhadas antes do acidente; obrigatório se tipo_cat = tipico ou trajeto';
COMMENT ON COLUMN cats.ult_dia_trab IS 'último dia trabalhado — obrigatório para acidentes a partir de 2023-01-16';
COMMENT ON COLUMN cats.nr_rec_cat_origem IS 'número do recibo da CAT anterior — obrigatório quando natureza_cat = reabertura ou obito';
