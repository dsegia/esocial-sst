-- ============================================================
-- MIGRAÇÃO 35 — Desligamento de funcionário sem perda de dados
-- Hoje "Remover" em pages/funcionarios.tsx faz DELETE de verdade,
-- que cascateia (ON DELETE CASCADE) pra asos/cats/ppp — o PPP é
-- documento que a legislação exige manter disponível por décadas
-- (uso em aposentadoria especial). Esta migração só adiciona a
-- coluna; o soft-deactivate (ativo=false sem apagar nada) é feito
-- na aplicação.
-- ============================================================

ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS data_desligamento DATE;

CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa_ativo ON funcionarios(empresa_id, ativo);
