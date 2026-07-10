-- ============================================================
-- MIGRAÇÃO 28 — Plano único por vidas (funcionários ativos)
-- Substitui o modelo de créditos por envio. Cobrança passa a ser
-- por número de funcionários ativos (Stripe: billing_scheme=tiered,
-- tiers_mode=volume, aggregate_usage=max — ver STRIPE_PRICE_VIDAS).
-- Execute no Supabase → SQL Editor
-- ============================================================

-- 1. Snapshot diário de vidas — base do usage record enviado ao Stripe
--    e do relatório agregado do admin.
CREATE TABLE IF NOT EXISTS vidas_uso_diario (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data             DATE NOT NULL DEFAULT CURRENT_DATE,
  qtd_funcionarios INTEGER NOT NULL,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, data)
);

CREATE INDEX IF NOT EXISTS idx_vidas_uso_diario_empresa ON vidas_uso_diario(empresa_id);

ALTER TABLE vidas_uso_diario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vidas_uso_diario: leitura pelo proprio usuario" ON vidas_uso_diario;
CREATE POLICY "vidas_uso_diario: leitura pelo proprio usuario" ON vidas_uso_diario
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
      UNION
      SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    )
  );
-- Sem policy de escrita para authenticated: só o cron (service role,
-- que ignora RLS) grava o snapshot diário.

-- 2. Simplifica o plano — sem clientes ativos com funcionários cadastrados,
--    migração direta sem período de transição. Normaliza ANTES de recriar
--    o CHECK (senão a constraint rejeita linhas com plano antigo).
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_plano_check;

UPDATE empresas SET plano = 'trial' WHERE plano NOT IN ('trial', 'vidas', 'cancelado');

ALTER TABLE empresas ADD CONSTRAINT empresas_plano_check
  CHECK (plano IN ('trial', 'vidas', 'cancelado'));

-- 3. Créditos/limite de funcionários não são mais usados — transmissão e
--    documentos SST passam a ser ilimitados dentro do plano por vidas.
ALTER TABLE empresas
  ALTER COLUMN creditos_restantes SET DEFAULT 0,
  ALTER COLUMN creditos_incluidos SET DEFAULT 0,
  ALTER COLUMN max_funcionarios   SET DEFAULT 999999;

UPDATE empresas SET max_funcionarios = 999999;

-- 4. RPC get_plano_empresa — remove créditos e limite de funcionários
CREATE OR REPLACE FUNCTION get_plano_empresa(p_empresa_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresa RECORD;
  v_dias_trial INT;
  v_trial_ativo BOOLEAN;
  v_qtd_funcionarios INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM usuario_empresas
    WHERE usuario_id = auth.uid() AND empresa_id = p_empresa_id
  ) AND NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND empresa_id = p_empresa_id
  ) THEN
    RAISE EXCEPTION 'Acesso não autorizado a esta empresa';
  END IF;

  SELECT plano, plano_expira_em, trial_inicio, stripe_customer_id
  INTO v_empresa
  FROM empresas
  WHERE id = p_empresa_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empresa não encontrada';
  END IF;

  v_dias_trial := GREATEST(0,
    14 - EXTRACT(DAY FROM (NOW() - COALESCE(v_empresa.trial_inicio, NOW())))::INT
  );
  v_trial_ativo := (v_empresa.plano = 'trial' AND v_dias_trial > 0);

  SELECT COUNT(*) INTO v_qtd_funcionarios
  FROM funcionarios
  WHERE empresa_id = p_empresa_id AND ativo = true;

  RETURN jsonb_build_object(
    'plano',                v_empresa.plano,
    'plano_expira_em',      v_empresa.plano_expira_em,
    'trial_ativo',          v_trial_ativo,
    'trial_dias_restantes', v_dias_trial,
    'qtd_funcionarios',     v_qtd_funcionarios,
    'tem_stripe',           (v_empresa.stripe_customer_id IS NOT NULL)
  );
END;
$$;

REVOKE ALL ON FUNCTION get_plano_empresa FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_plano_empresa TO authenticated;
