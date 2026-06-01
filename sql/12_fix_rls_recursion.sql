-- Migration 12: Corrige recursão infinita nas policies RLS
-- Problema: policies de usuarios e usuario_empresas se auto-referenciavam
-- causando "infinite recursion detected in policy for relation"

-- ── usuarios ────────────────────────────────────────────
-- Remove policies recursivas
DROP POLICY IF EXISTS "pol_usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuarios: ver colegas da empresa" ON usuarios;

-- Recria policy de colegas sem recursão (usa usuario_empresas diretamente)
CREATE POLICY "usuarios: ver colegas da empresa" ON usuarios
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuario_empresas
      WHERE usuario_id = auth.uid()
    )
  );

-- ── usuario_empresas ─────────────────────────────────────
-- Remove policy recursiva (se auto-referenciava)
DROP POLICY IF EXISTS "usuario_empresas: ver colegas" ON usuario_empresas;

-- Policies restantes (já corretas):
-- "usuarios: ver proprio perfil"  → id = auth.uid()
-- "usuarios: inserir proprio perfil"
-- "usuarios: editar proprio perfil"
-- "usuario_empresas: ver proprios vinculos" → usuario_id = auth.uid()
-- "pol_ue_select" → usuario_id = auth.uid()
