-- ============================================================
-- MIGRAÇÃO 41 — Storage: Bucket para documentos e imagens
-- Execute no Supabase → SQL Editor
-- ============================================================

-- Criar bucket público para armazenar documentos e imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: permitir upload para usuários autenticados
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos');

-- RLS policy: permitir leitura pública (qualquer pessoa pode ver as imagens)
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documentos');

-- RLS policy: permitir delete de arquivos próprios
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documentos' AND auth.uid()::text = owner);
