-- CRÍTICO: a policy "usuarios: editar proprio perfil" (UPDATE, USING id = auth.uid(),
-- sem WITH CHECK explícito) permite que qualquer usuário autenticado altere as
-- colunas empresa_id e perfil da PRÓPRIA linha para QUALQUER valor, incluindo o
-- id de uma empresa alheia e perfil = 'admin'. Como todas as demais policies de
-- isolamento (funcionarios, asos, ltcats, transmissoes, pgr, pcmso_dados, empresas)
-- confiam em usuarios.empresa_id, isso permitia a qualquer usuário sequestrar acesso
-- total (admin) a dados de qualquer outra empresa do sistema, bastando saber o UUID
-- dela — quebra direta da regra de isolamento entre empresas.
-- Fix: trigger que bloqueia alteração de empresa_id/perfil por qualquer canal que
-- não seja o service_role (usado pelos endpoints server-side que já validam
-- autorização corretamente, ex.: invite-user.js, admin/manage-client.js).

CREATE OR REPLACE FUNCTION public.usuarios_bloquear_auto_alteracao_sensivel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF NEW.empresa_id IS DISTINCT FROM OLD.empresa_id THEN
      RAISE EXCEPTION 'Alteração de empresa_id não permitida por este canal';
    END IF;
    IF NEW.perfil IS DISTINCT FROM OLD.perfil THEN
      RAISE EXCEPTION 'Alteração de perfil não permitida por este canal';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_bloquear_auto_alteracao_sensivel ON public.usuarios;
CREATE TRIGGER trg_usuarios_bloquear_auto_alteracao_sensivel
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.usuarios_bloquear_auto_alteracao_sensivel();

-- Função é apenas um trigger interno, não deve ser chamável diretamente via RPC.
REVOKE EXECUTE ON FUNCTION public.usuarios_bloquear_auto_alteracao_sensivel() FROM PUBLIC, anon, authenticated;
