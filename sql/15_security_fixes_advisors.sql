-- MIGRAÇÃO 15 — Correções apontadas pelos advisors de segurança do Supabase
-- Aplicada via MCP em 13/06/2026. Mantida aqui para histórico do repositório.

-- 1. Remove função morta. get_minhas_empresas() não é mais chamada por nenhuma
--    parte do app (os callers foram removidos no commit 879dbba) e ficou órfã no
--    banco como SECURITY DEFINER executável por 'anon'.
DROP FUNCTION IF EXISTS public.get_minhas_empresas();

-- 2. Endurece criar_conta. A versão anterior confiava no p_user_id enviado pelo
--    cliente e fazia UPSERT em usuarios com esse id — um usuário autenticado
--    poderia chamar com o UUID de outro e sequestrar/alterar a conta alheia.
--    Agora exige que p_user_id == auth.uid(). A função só é concedida a
--    'authenticated', então auth.uid() está sempre presente em chamadas legítimas
--    (fluxo de cadastro com sessão ativa) — zero impacto no signup normal.
CREATE OR REPLACE FUNCTION public.criar_conta(p_razao_social text, p_cnpj text, p_user_id uuid, p_user_nome text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_empresa_id UUID;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'user_id nao corresponde ao usuario autenticado';
  END IF;
  INSERT INTO empresas (razao_social, cnpj, tipo_acesso, ativo, plano, trial_inicio, max_funcionarios, creditos_restantes, creditos_incluidos)
  VALUES (p_razao_social, p_cnpj, 'propria', true, 'trial', NOW(), 999999, 10, 10)
  RETURNING id INTO v_empresa_id;
  INSERT INTO usuarios (id, empresa_id, nome, perfil) VALUES (p_user_id, v_empresa_id, p_user_nome, 'admin')
  ON CONFLICT (id) DO UPDATE SET empresa_id = v_empresa_id, perfil = 'admin';
  INSERT INTO usuario_empresas (usuario_id, empresa_id, perfil, tipo_acesso) VALUES (p_user_id, v_empresa_id, 'admin', 'empresa')
  ON CONFLICT (usuario_id, empresa_id) DO NOTHING;
  RETURN jsonb_build_object('empresa_id', v_empresa_id, 'plano', 'trial', 'trial_dias_restantes', 14);
END;
$function$;

REVOKE ALL ON FUNCTION public.criar_conta(text, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_conta(text, text, uuid, text) TO authenticated;

-- NOTA — itens dos advisors que NÃO exigem ação:
-- * verificar_aso_duplicado: SECURITY DEFINER intencional; a função já valida
--   internamente que auth.uid() pertence à empresa do funcionário (não é IDOR).
-- * criar_conta SECURITY DEFINER (necessário p/ criar empresa+usuário no signup).
-- * "unused index" (vários): nível INFO — índices ainda não usados por baixo
--   volume; serão usados conforme os dados crescem. Não remover prematuramente.
-- * Leaked password protection: toggle no painel Supabase (Authentication →
--   Policies), não há como ativar via SQL.
