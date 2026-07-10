-- MIGRAÇÃO 27 — Correções de isolamento entre empresas, encontradas na auditoria
-- completa do sistema (10/07/2026). Aplicada via MCP. Mantida aqui para histórico.

-- 1. Reharden criar_conta: a correção da migração 15 (exigir p_user_id = auth.uid())
--    não estava de fato aplicada no banco de produção — a função ainda aceitava
--    p_user_id do cliente sem validar, permitindo sequestro de conta de outro
--    usuário via RPC direto. Reaplicada aqui.
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

-- 2. RLS de usuario_empresas: a policy de INSERT só exigia usuario_id = auth.uid(),
--    sem restringir empresa_id. Qualquer usuário autenticado podia chamar a REST API
--    do PostgREST direto e se auto-conceder perfil='admin' em QUALQUER empresa cujo
--    UUID conhecesse — quebra total do isolamento entre empresas. Agora só permite
--    o self-insert quando a empresa ainda não tem nenhum vínculo (empresa "órfã",
--    caso legítimo de "criar nova empresa" em pages/empresas.tsx).
DROP POLICY IF EXISTS "usuario_empresas: inserir proprio vinculo" ON public.usuario_empresas;

CREATE POLICY "usuario_empresas: inserir proprio vinculo" ON public.usuario_empresas
FOR INSERT
WITH CHECK (
  usuario_id = (select auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.usuario_empresas ue2 WHERE ue2.empresa_id = usuario_empresas.empresa_id
  )
);

-- 3. set_trial_inicio(): trial_inicio e plano_expira_em eram calculados em lugares
--    diferentes do código (alguns fluxos só setavam um dos dois). O cron
--    bloquear-trials-expirados.js filtra por plano_expira_em — se ficasse NULL,
--    o trial nunca era bloqueado mesmo expirado. Agora o trigger sempre populam
--    os dois juntos a partir da mesma fonte.
CREATE OR REPLACE FUNCTION public.set_trial_inicio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.trial_inicio IS NULL THEN NEW.trial_inicio := NOW(); END IF;
  IF NEW.plano IS NULL THEN NEW.plano := 'trial'; END IF;
  IF NEW.plano_expira_em IS NULL AND NEW.plano = 'trial' THEN
    NEW.plano_expira_em := NEW.trial_inicio + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$function$;

-- NOTA — itens correspondentes no código (mesma auditoria), ver commit:
-- * pages/api/empresa/cadastrar-empregadora.ts: bloqueia vincular-se como admin
--   a uma empresa existente que já tem responsável (mesma lógica de "órfã" acima,
--   mas no código, pois usa service role e não passa pela RLS).
-- * pages/api/transmitir-esocial.js: valida cnpj_empregador do body contra
--   empresa.cnpj antes de montar o envelope SOAP.
-- * pages/api/notificar-vencimento.js: get_alertas_vencimento() não é SECURITY
--   DEFINER e valida auth.uid() internamente — chamar com a service role key
--   fazia auth.uid() ser NULL e a função negar acesso sempre (feature quebrada
--   em produção). Corrigido para chamar com um client autenticado com o JWT
--   do usuário.
