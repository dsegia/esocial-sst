-- O bucket "documentos" é público (public=true), então getPublicUrl() já funciona
-- para download direto por path conhecido, sem depender de nenhuma policy em
-- storage.objects. A policy "Allow public read" (SELECT para o role `public`,
-- sem filtro de path/owner) não é necessária para isso e só adiciona a
-- capacidade de LISTAR todos os arquivos do bucket via storage.list() para
-- qualquer visitante não autenticado — expondo nomes/paths de arquivos de
-- todas as empresas. Remove a policy sem afetar o uso atual (getPublicUrl).
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
