-- ============================================================
-- MIGRAÇÃO 36 — Módulos de gestão SST: Treinamentos NR, Ficha de
-- EPI e Ordem de Serviço. Todas as tabelas são NOVAS e aditivas —
-- não alteram nenhuma tabela/coluna existente, não afetam
-- documentos SST, transmissão eSocial ou billing já em produção.
-- ============================================================

-- ─── Treinamentos NR ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treinamentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  funcionario_id    UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  norma             TEXT NOT NULL,
  nome              TEXT NOT NULL,
  carga_horaria     INTEGER,
  data_realizacao   DATE NOT NULL,
  validade_meses    INTEGER,
  data_vencimento   DATE,
  instrutor         TEXT,
  instituicao       TEXT,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treinamentos_empresa ON treinamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_treinamentos_funcionario ON treinamentos(funcionario_id);

ALTER TABLE treinamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treinamentos: acesso pela empresa" ON treinamentos;
CREATE POLICY "treinamentos: acesso pela empresa" ON treinamentos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = auth.uid() AND empresa_id = treinamentos.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND empresa_id = treinamentos.empresa_id)
  );

-- ─── Ficha de EPI ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS epis_entregues (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  funcionario_id      UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  epi_nome            TEXT NOT NULL,
  ca                  TEXT,
  data_entrega        DATE NOT NULL,
  data_validade_ca    DATE,
  data_troca_prevista DATE,
  quantidade          INTEGER NOT NULL DEFAULT 1,
  ciencia             BOOLEAN NOT NULL DEFAULT false,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_epis_entregues_empresa ON epis_entregues(empresa_id);
CREATE INDEX IF NOT EXISTS idx_epis_entregues_funcionario ON epis_entregues(funcionario_id);

ALTER TABLE epis_entregues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "epis_entregues: acesso pela empresa" ON epis_entregues;
CREATE POLICY "epis_entregues: acesso pela empresa" ON epis_entregues
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = auth.uid() AND empresa_id = epis_entregues.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND empresa_id = epis_entregues.empresa_id)
  );

-- ─── Ordem de Serviço (NR-1, 1.4.1) — por função, não por pessoa ──
CREATE TABLE IF NOT EXISTS ordens_servico (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id           UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  funcao               TEXT NOT NULL,
  setor                TEXT NOT NULL DEFAULT '',
  riscos               JSONB NOT NULL DEFAULT '[]',
  medidas_preventivas  JSONB NOT NULL DEFAULT '[]',
  epis_obrigatorios    JSONB NOT NULL DEFAULT '[]',
  data_emissao         DATE,
  resp_nome            TEXT,
  resp_cargo           TEXT,
  ciencias             JSONB NOT NULL DEFAULT '[]',
  ativo                BOOLEAN NOT NULL DEFAULT true,
  atualizado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ordens_servico_empresa_funcao_setor UNIQUE (empresa_id, funcao, setor)
);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_empresa ON ordens_servico(empresa_id);

ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ordens_servico: acesso pela empresa" ON ordens_servico;
CREATE POLICY "ordens_servico: acesso pela empresa" ON ordens_servico
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = auth.uid() AND empresa_id = ordens_servico.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND empresa_id = ordens_servico.empresa_id)
  );
