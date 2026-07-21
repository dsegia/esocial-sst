-- ============================================================
-- MIGRAÇÃO 54 — Pesquisa de riscos psicossociais (link público +
-- respostas anônimas dos colaboradores, para alimentar a seção
-- "RISCOS PSICOSSOCIAIS" do PGR via análise por IA)
-- Execute no Supabase → SQL Editor
-- Puramente aditiva: nenhuma tabela/coluna existente é tocada.
-- ============================================================

CREATE TABLE IF NOT EXISTS pesquisa_psicossocial_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  criado_por    UUID REFERENCES usuarios(id),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  encerrado_em  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pesquisa_psi_links_empresa ON pesquisa_psicossocial_links(empresa_id);

-- Respostas são intencionalmente ANÔNIMAS: nenhuma FK para funcionarios,
-- nenhum campo de identificação pessoal. "setor" é autodeclarado e opcional,
-- só para permitir agregação — nunca deve ser exibido/analisado abaixo de um
-- tamanho mínimo de grupo (aplicado na camada de API, não no banco).
CREATE TABLE IF NOT EXISTS pesquisa_psicossocial_respostas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  link_id     UUID NOT NULL REFERENCES pesquisa_psicossocial_links(id) ON DELETE CASCADE,
  setor       TEXT,
  respostas   JSONB NOT NULL DEFAULT '{}',
  comentario  TEXT,
  sugestao    TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pesquisa_psi_respostas_empresa ON pesquisa_psicossocial_respostas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pesquisa_psi_respostas_link ON pesquisa_psicossocial_respostas(link_id);

ALTER TABLE pesquisa_psicossocial_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesquisa_psicossocial_respostas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios podem ver links da empresa" ON pesquisa_psicossocial_links;
DROP POLICY IF EXISTS "usuarios podem criar links da empresa" ON pesquisa_psicossocial_links;
DROP POLICY IF EXISTS "usuarios podem editar links da empresa" ON pesquisa_psicossocial_links;

CREATE POLICY "usuarios podem ver links da empresa" ON pesquisa_psicossocial_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = pesquisa_psicossocial_links.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = pesquisa_psicossocial_links.empresa_id)
  );

CREATE POLICY "usuarios podem criar links da empresa" ON pesquisa_psicossocial_links
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = pesquisa_psicossocial_links.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = pesquisa_psicossocial_links.empresa_id)
  );

CREATE POLICY "usuarios podem editar links da empresa" ON pesquisa_psicossocial_links
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = pesquisa_psicossocial_links.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = pesquisa_psicossocial_links.empresa_id)
  );

-- pesquisa_psicossocial_respostas: só SELECT para quem é da empresa (o painel
-- de resultados sempre lê agregado via API, mas a policy fica disponível).
-- Sem policy de INSERT/UPDATE/DELETE — a inserção só acontece pela API pública
-- via service role (mesmo padrão de leads_propostas), nunca direto do browser
-- do colaborador, exatamente para manter o anonimato (o navegador do
-- respondente nunca tem uma sessão Supabase autenticada de empresa).
CREATE POLICY "usuarios podem ver respostas da empresa" ON pesquisa_psicossocial_respostas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuario_empresas WHERE usuario_id = (select auth.uid()) AND empresa_id = pesquisa_psicossocial_respostas.empresa_id)
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = (select auth.uid()) AND empresa_id = pesquisa_psicossocial_respostas.empresa_id)
  );
