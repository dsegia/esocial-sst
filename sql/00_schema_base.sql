-- ============================================================
-- SCHEMA BASE — eSocial SST
-- Cria todas as tabelas, índices, RLS e RPCs do zero
-- Execute no Supabase → SQL Editor quando o banco estiver vazio
-- ============================================================

-- ─── 1. EMPRESAS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresas (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social            TEXT NOT NULL,
  cnpj                    TEXT,
  tipo_acesso             TEXT NOT NULL DEFAULT 'propria'
                            CHECK (tipo_acesso IN ('propria', 'escritorio', 'admin')),
  ativo                   BOOLEAN NOT NULL DEFAULT true,
  bloqueado               BOOLEAN NOT NULL DEFAULT false,
  plano                   TEXT NOT NULL DEFAULT 'trial'
                            CHECK (plano IN ('trial','micro','starter','pro','professional','business','enterprise','cancelado')),
  plano_expira_em         TIMESTAMPTZ,
  trial_inicio            TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at           TIMESTAMPTZ GENERATED ALWAYS AS (trial_inicio + INTERVAL '14 days') STORED,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  stripe_metered_item_id  TEXT,
  max_funcionarios        INTEGER NOT NULL DEFAULT 999999,
  creditos_restantes      INTEGER NOT NULL DEFAULT 10,
  creditos_incluidos      INTEGER NOT NULL DEFAULT 10,
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — anon/authenticated uses policies
CREATE POLICY "empresas: leitura pelo proprio usuario" ON empresas
  FOR SELECT USING (
    id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
      UNION
      SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    )
  );

-- Trigger: garante trial_inicio ao criar empresa
CREATE OR REPLACE FUNCTION set_trial_inicio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_inicio IS NULL THEN NEW.trial_inicio := NOW(); END IF;
  IF NEW.plano IS NULL THEN NEW.plano := 'trial'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_trial_inicio ON empresas;
CREATE TRIGGER trg_set_trial_inicio
  BEFORE INSERT ON empresas
  FOR EACH ROW EXECUTE FUNCTION set_trial_inicio();


-- ─── 2. USUARIOS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id  UUID REFERENCES empresas(id) ON DELETE SET NULL,
  nome        TEXT NOT NULL DEFAULT '',
  email       TEXT,
  perfil      TEXT NOT NULL DEFAULT 'operador'
                CHECK (perfil IN ('admin', 'operador', 'visualizador')),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios: ver proprio perfil" ON usuarios
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "usuarios: ver colegas da empresa" ON usuarios
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
      UNION
      SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "usuarios: editar proprio perfil" ON usuarios
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "usuarios: inserir proprio perfil" ON usuarios
  FOR INSERT WITH CHECK (id = auth.uid());


-- ─── 3. USUARIO_EMPRESAS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuario_empresas (
  usuario_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  perfil       TEXT NOT NULL DEFAULT 'operador'
                 CHECK (perfil IN ('admin', 'operador', 'visualizador')),
  tipo_acesso  TEXT NOT NULL DEFAULT 'empresa'
                 CHECK (tipo_acesso IN ('empresa', 'escritorio', 'admin')),
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_empresas_empresa ON usuario_empresas(empresa_id);

ALTER TABLE usuario_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_empresas: ver proprios vinculos" ON usuario_empresas
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "usuario_empresas: ver colegas" ON usuario_empresas
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    )
  );


-- ─── 4. FUNCIONARIOS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funcionarios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome              TEXT NOT NULL,
  cpf               TEXT,
  matricula_esocial TEXT,
  funcao            TEXT,
  cod_cbo           TEXT,
  setor             TEXT,
  ghe_id            INTEGER,
  data_adm          DATE,
  data_nasc         DATE,
  ativo             BOOLEAN NOT NULL DEFAULT true,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa ON funcionarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON funcionarios(cpf);

ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funcionarios: acesso pela empresa" ON funcionarios
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
      UNION
      SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    )
  );


-- ─── 5. ASOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  funcionario_id  UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo_aso        TEXT,
  data_exame      DATE,
  prox_exame      DATE,
  conclusao       TEXT,
  medico_nome     TEXT,
  medico_crm      TEXT,
  exames          JSONB NOT NULL DEFAULT '[]',
  riscos          JSONB NOT NULL DEFAULT '[]',
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asos_empresa ON asos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_asos_funcionario ON asos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_asos_prox_exame ON asos(prox_exame);

ALTER TABLE asos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asos: acesso pela empresa" ON asos
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
      UNION
      SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    )
  );


-- ─── 6. LTCATS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ltcats (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_emissao   DATE,
  data_vigencia  DATE,
  prox_revisao   DATE,
  resp_nome      TEXT,
  resp_conselho  TEXT,
  resp_registro  TEXT,
  ghes           JSONB NOT NULL DEFAULT '[]',
  dados_gerais   JSONB,
  ativo          BOOLEAN NOT NULL DEFAULT true,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ltcats_empresa ON ltcats(empresa_id);

ALTER TABLE ltcats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ltcats: acesso pela empresa" ON ltcats
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
      UNION
      SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    )
  );


-- ─── 7. CATS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cats (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  funcionario_id   UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo_cat         TEXT,
  dt_acidente      DATE,
  hora_acidente    TEXT,
  cid              TEXT,
  natureza_lesao   TEXT,
  parte_corpo      TEXT,
  agente_causador  TEXT,
  descricao        TEXT,
  houve_morte      BOOLEAN NOT NULL DEFAULT false,
  dias_afastamento INTEGER,
  atendimento      JSONB,
  testemunhas      JSONB NOT NULL DEFAULT '[]',
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cats_empresa ON cats(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cats_funcionario ON cats(funcionario_id);

ALTER TABLE cats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cats: acesso pela empresa" ON cats
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
      UNION
      SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    )
  );


-- ─── 8. TRANSMISSOES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transmissoes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  funcionario_id   UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  evento           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente','enviado','rejeitado','lote','erro')),
  referencia_id    UUID,
  referencia_tipo  TEXT,
  payload          TEXT,
  recibo           TEXT,
  dt_envio         TIMESTAMPTZ,
  tentativas       INTEGER NOT NULL DEFAULT 0,
  erro_codigo      TEXT,
  erro_descricao   TEXT,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transmissoes_empresa ON transmissoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transmissoes_status ON transmissoes(status);
CREATE INDEX IF NOT EXISTS idx_transmissoes_referencia ON transmissoes(referencia_id);

ALTER TABLE transmissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transmissoes: acesso pela empresa" ON transmissoes
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
      UNION
      SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    )
  );


-- ─── 9. API_LOGS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico     TEXT NOT NULL,
  modelo      TEXT,
  status      TEXT NOT NULL,
  duracao_ms  INTEGER,
  tipo        TEXT,
  erro        TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_criado ON api_logs(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_servico ON api_logs(servico);

-- Sem RLS — só acessível via service role (log interno)
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;


-- ─── 10. PCMSO_PROGRAMA ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS pcmso_programa (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  funcao         TEXT NOT NULL,
  setor          TEXT,
  riscos         JSONB NOT NULL DEFAULT '[]',
  exames         JSONB NOT NULL DEFAULT '[]',
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pcmso_programa_empresa_funcao UNIQUE (empresa_id, funcao)
);

CREATE INDEX IF NOT EXISTS idx_pcmso_programa_empresa ON pcmso_programa(empresa_id);

ALTER TABLE pcmso_programa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pcmso: acesso pela empresa" ON pcmso_programa
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
      UNION
      SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    )
  );


-- ─── RPCS ───────────────────────────────────────────────────

-- criar_conta: chamada no cadastro self-service
CREATE OR REPLACE FUNCTION criar_conta(
  p_razao_social  TEXT,
  p_cnpj          TEXT,
  p_user_id       UUID,
  p_user_nome     TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_empresa_id UUID;
BEGIN
  INSERT INTO empresas (razao_social, cnpj, tipo_acesso, ativo, plano, trial_inicio, max_funcionarios, creditos_restantes, creditos_incluidos)
  VALUES (p_razao_social, p_cnpj, 'propria', true, 'trial', NOW(), 999999, 10, 10)
  RETURNING id INTO v_empresa_id;

  INSERT INTO usuarios (id, empresa_id, nome, perfil)
  VALUES (p_user_id, v_empresa_id, p_user_nome, 'admin')
  ON CONFLICT (id) DO UPDATE SET empresa_id = v_empresa_id, perfil = 'admin';

  INSERT INTO usuario_empresas (usuario_id, empresa_id, perfil, tipo_acesso)
  VALUES (p_user_id, v_empresa_id, 'admin', 'empresa')
  ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

  RETURN jsonb_build_object('empresa_id', v_empresa_id, 'plano', 'trial', 'trial_dias_restantes', 14);
END;
$$;
REVOKE ALL ON FUNCTION criar_conta FROM PUBLIC;
GRANT EXECUTE ON FUNCTION criar_conta TO authenticated;

-- get_plano_empresa: retorna status do plano + créditos
CREATE OR REPLACE FUNCTION get_plano_empresa(p_empresa_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_empresa RECORD;
  v_dias_trial INT;
  v_trial_ativo BOOLEAN;
  v_qtd_funcionarios INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = auth.uid() AND empresa_id = p_empresa_id)
  AND NOT EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND empresa_id = p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso não autorizado a esta empresa';
  END IF;

  SELECT plano, plano_expira_em, trial_inicio, max_funcionarios, stripe_customer_id,
         creditos_restantes, creditos_incluidos
  INTO v_empresa FROM empresas WHERE id = p_empresa_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada'; END IF;

  v_dias_trial := GREATEST(0, 14 - EXTRACT(DAY FROM (NOW() - COALESCE(v_empresa.trial_inicio, NOW())))::INT);
  v_trial_ativo := (v_empresa.plano = 'trial' AND v_dias_trial > 0);

  SELECT COUNT(*) INTO v_qtd_funcionarios FROM funcionarios WHERE empresa_id = p_empresa_id AND ativo = true;

  RETURN jsonb_build_object(
    'plano',                v_empresa.plano,
    'plano_expira_em',      v_empresa.plano_expira_em,
    'trial_ativo',          v_trial_ativo,
    'trial_dias_restantes', v_dias_trial,
    'max_funcionarios',     v_empresa.max_funcionarios,
    'qtd_funcionarios',     v_qtd_funcionarios,
    'pode_adicionar',       true,
    'tem_stripe',           (v_empresa.stripe_customer_id IS NOT NULL),
    'creditos_restantes',   v_empresa.creditos_restantes,
    'creditos_incluidos',   v_empresa.creditos_incluidos
  );
END;
$$;
REVOKE ALL ON FUNCTION get_plano_empresa FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_plano_empresa TO authenticated;

-- consumir_credito: deduz crédito de forma atômica
CREATE OR REPLACE FUNCTION consumir_credito(p_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_rows INT;
BEGIN
  UPDATE empresas SET creditos_restantes = creditos_restantes - 1
  WHERE id = p_empresa_id AND creditos_restantes > 0;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- get_alertas_vencimento: ASOs vencidos ou a vencer em 60 dias
CREATE OR REPLACE FUNCTION get_alertas_vencimento(p_empresa_id UUID)
RETURNS TABLE (
  funcionario_id UUID, nome TEXT, matricula TEXT, setor TEXT,
  tipo_alerta TEXT, data_venc DATE, dias_restantes INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = auth.uid() AND empresa_id = p_empresa_id)
  AND NOT EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND empresa_id = p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso não autorizado';
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (f.id)
    f.id, f.nome, f.matricula_esocial, f.setor,
    CASE
      WHEN a.prox_exame < CURRENT_DATE       THEN 'vencido'
      WHEN a.prox_exame <= CURRENT_DATE + 30 THEN 'vence_30'
      ELSE 'vence_60'
    END,
    a.prox_exame,
    (a.prox_exame - CURRENT_DATE)::INTEGER
  FROM funcionarios f
  JOIN asos a ON a.funcionario_id = f.id
  WHERE f.empresa_id = p_empresa_id AND f.ativo = true
    AND a.prox_exame IS NOT NULL
    AND a.prox_exame <= CURRENT_DATE + INTERVAL '60 days'
  ORDER BY f.id, a.data_exame DESC;
END;
$$;
REVOKE ALL ON FUNCTION get_alertas_vencimento(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_alertas_vencimento(UUID) TO authenticated;

-- verificar_aso_duplicado: verifica duplicidade antes de salvar
CREATE OR REPLACE FUNCTION verificar_aso_duplicado(
  p_funcionario_id UUID, p_tipo_aso TEXT, p_data_exame DATE, p_aso_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_aso_id UUID; v_empresa_id UUID;
BEGIN
  SELECT empresa_id INTO v_empresa_id FROM funcionarios WHERE id = p_funcionario_id;

  IF NOT EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = auth.uid() AND empresa_id = v_empresa_id)
  AND NOT EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND empresa_id = v_empresa_id) THEN
    RAISE EXCEPTION 'Acesso não autorizado';
  END IF;

  SELECT id INTO v_aso_id FROM asos
  WHERE funcionario_id = p_funcionario_id AND tipo_aso = p_tipo_aso AND data_exame = p_data_exame
    AND (p_aso_id IS NULL OR id <> p_aso_id)
  LIMIT 1;

  IF v_aso_id IS NOT NULL THEN
    RETURN jsonb_build_object('duplicado', true, 'aso_id', v_aso_id);
  END IF;
  RETURN jsonb_build_object('duplicado', false, 'aso_id', NULL);
END;
$$;
REVOKE ALL ON FUNCTION verificar_aso_duplicado(UUID, TEXT, DATE, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verificar_aso_duplicado(UUID, TEXT, DATE, UUID) TO authenticated;
