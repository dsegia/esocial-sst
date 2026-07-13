-- Adiciona coluna logo_url na tabela empresas para armazenar a logo do cliente em formato data URL

ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;

-- Adiciona comentário descritivo
COMMENT ON COLUMN public.empresas.logo_url IS 'URL de dados (base64) da logo da empresa para aparecer nos documentos PDF';

-- Criar índice se necessário (opcional)
-- CREATE INDEX IF NOT EXISTS idx_empresas_logo ON public.empresas(logo_url);
