-- Campos exigidos pelo XSD oficial do evtCAT (v_S_01_03_00) que faltavam na tabela
-- cats — mapeados na auditoria de 16-17/07/2026 contra o schema real do eSocial.
-- Colunas booleanas/enumeradas seguem o padrão já usado em tipo_cat (slug em vez
-- de código numérico bruto); a conversão pro código eSocial (1/2/3, S/N etc.)
-- acontece em pages/api/xml-generator.js na hora de montar o XML.

ALTER TABLE cats
  ADD COLUMN IF NOT EXISTS natureza_cat        TEXT NOT NULL DEFAULT 'inicial',
  ADD COLUMN IF NOT EXISTS ind_cat_obito        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ind_comun_policia    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cod_sit_geradora     TEXT,
  ADD COLUMN IF NOT EXISTS iniciat_cat          TEXT NOT NULL DEFAULT 'empregador',
  ADD COLUMN IF NOT EXISTS local_acidente       JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cod_parte_atingida   TEXT,
  ADD COLUMN IF NOT EXISTS lateralidade         TEXT NOT NULL DEFAULT 'na',
  ADD COLUMN IF NOT EXISTS cod_agente_causador  TEXT,
  ADD COLUMN IF NOT EXISTS cod_lesao            TEXT,
  ADD COLUMN IF NOT EXISTS ind_internacao       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ind_afastamento      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS conselho_medico      TEXT NOT NULL DEFAULT 'crm';

COMMENT ON COLUMN cats.natureza_cat IS 'inicial | reabertura | obito — mapeia pra tpCat (1/2/3) no XML';
COMMENT ON COLUMN cats.iniciat_cat IS 'empregador | ordem_judicial | orgao_fiscalizador — mapeia pra iniciatCAT (1/2/3)';
COMMENT ON COLUMN cats.local_acidente IS 'json: { tpLocal, dscLocal, tpLograd, dscLograd, nrLograd, complemento, bairro, cep, codMunic, uf, pais, codPostal }';
COMMENT ON COLUMN cats.lateralidade IS 'na | esquerda | direita | ambos — mapeia pra lateralidade (0/1/2/3), junto com cod_parte_atingida (Tabela 13)';
COMMENT ON COLUMN cats.cod_agente_causador IS 'código de 9 dígitos da Tabela 14/15 do eSocial';
COMMENT ON COLUMN cats.cod_sit_geradora IS 'código de 9 dígitos da Tabela 15 do eSocial (situação geradora)';
COMMENT ON COLUMN cats.cod_lesao IS 'código de 9 dígitos da Tabela 17 do eSocial — substitui natureza_lesao (texto livre) como dscLesao no XML';
COMMENT ON COLUMN cats.conselho_medico IS 'crm | cro | rms — mapeia pra ideOC (1/2/3) do emitente do atestado';
