# Setup - Logo da Empresa nos Documentos

## Descrição
Adicionada a funcionalidade de incluir a logo/marca do cliente em TODOS os documentos PDF gerados (PGR, LTCAT, PCMSO, ASO, AET, APR, LIP, PPP, Treinamentos, Ficha EPI, Ordem de Serviço).

## Como configurar

### 1. Adicionar coluna `logo_url` no Supabase

Acesse a dashboard do Supabase do projeto `nujrhikewkodtemvwske` e execute a seguinte query no SQL Editor:

```sql
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;
```

Ou execute via CLI local (se tiver Supabase CLI instalado):

```bash
supabase db push  # Se tiver migrations criadas localmente
```

### 2. Como usar

A logo agora aparecerá automaticamente em todos os PDFs quando:

1. O usuário faz upload de uma logo na seção "Logo da Empresa" (página de empresa/configurações)
2. A logo é armazenada em formato data URL (base64) no banco de dados
3. Ao gerar qualquer PDF, a logo aparecerá no canto superior esquerdo do cabeçalho

### 3. Funcionalidades

- **Upload de imagem**: Suporta PNG, JPG, GIF
- **Tamanho máximo**: 2 MB
- **Redimensionamento automático**: Imagens são redimensionadas para caber bem no PDF (máx 300x300px)
- **Qualidade**: Comprimidas em JPEG com 85% de qualidade para manter tamanho gerenciável
- **Remover logo**: Botão para remover a logo já enviada

### 4. Arquivos adicionados/modificados

- `lib/gerar-pdf.ts` — Modificado: Adicionado suporte a logo em todas as 11 funções de geração de PDF
- `lib/logo-util.ts` — Novo: Utilitários para processar e redimensionar imagens
- `components/UploadLogo.jsx` — Novo: Componente React para upload da logo
- `pages/api/empresa/atualizar-logo.ts` — Novo: API endpoint para salvar logo no Supabase
- `supabase/add-logo-column.sql` — Novo: Script SQL para adicionar coluna

### 5. Integração em outras páginas

Para adicionar o upload de logo em qualquer página de edição de empresa:

```jsx
import UploadLogo from '../components/UploadLogo'

// Dentro do componente:
<UploadLogo
  empresa={empresaData}
  onUpdate={async (logoUrl) => {
    const res = await fetch('/api/empresa/atualizar-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo_url: logoUrl })
    })
    if (!res.ok) throw new Error('Erro ao atualizar logo')
  }}
  isLoading={carregando}
/>
```

## Observações

- A logo é armazenada como data URL (base64) diretamente no banco de dados
- Não requer storage externo (Supabase Storage)
- Funciona offline uma vez que a logo está no banco
- Tamanho máximo recomendado no banco: ~500-600KB por empresa (com a compressão)
- A logo aparece em **todos os PDFs** sem necessidade de configuração adicional por documento
