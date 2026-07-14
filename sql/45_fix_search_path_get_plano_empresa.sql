-- Advisor de segurança do Supabase apontou search_path mutável na função
-- SECURITY DEFINER get_plano_empresa (as demais SECURITY DEFINER já tinham
-- SET search_path). Fixa o schema para evitar hijacking via search_path.
ALTER FUNCTION public.get_plano_empresa(uuid) SET search_path = public;
