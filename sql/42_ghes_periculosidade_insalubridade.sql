-- Adiciona periculosidade e insalubridade ao GHE (ao lado de aposentadoria_especial),
-- para que o LTCAT possa informar as 3 conclusões previdenciárias/trabalhistas por GHE.
ALTER TABLE ghes
  ADD COLUMN IF NOT EXISTS periculosidade BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS insalubridade  BOOLEAN NOT NULL DEFAULT false;

-- Cada item do array riscos (jsonb) passa a poder conter também "danos_saude"
-- (texto livre com os possíveis danos à saúde do agente) — sem alteração de schema,
-- já documentado no comentário da coluna abaixo.
COMMENT ON COLUMN ghes.riscos IS 'cada item: { id uuid, tipo, nome, valor, limite, unidade, supera_lt, medicao_quantitativa bool, metodologia, codigo_esocial, fonte_geradora, danos_saude }';
