# Arquitetura do Sistema — eSocial SST

## Visão Geral

SaaS de transmissão de eventos eSocial SST (Saúde e Segurança do Trabalho) para o governo brasileiro. Empresas cadastram funcionários, geram XMLs assinados digitalmente e transmitem ao webservice SOAP do Gov.br.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend + API | Next.js 14 (Pages Router) + TypeScript |
| Banco de dados | Supabase (PostgreSQL + RLS) |
| Autenticação | Supabase Auth (JWT) |
| Deploy | Vercel (auto-deploy via git push para `main`) |
| Storage (certificados) | Cloudflare R2 |
| Pagamentos | Stripe (assinaturas mensais + créditos) |
| E-mail transacional | Resend |
| IA (leitura de documentos) | Anthropic API (Claude) + Google Gemini |

---

## Estrutura de Pastas

```
/
├── pages/
│   ├── _app.tsx              # Provider global, autenticação Supabase
│   ├── index.tsx             # Landing page pública
│   ├── login.tsx             # Login / cadastro
│   ├── dashboard.tsx         # Painel principal do usuário
│   ├── admin.tsx             # Painel administrativo (restrito)
│   ├── funcionarios.tsx      # Cadastro e listagem de funcionários
│   ├── aso.tsx               # Atestados de Saúde Ocupacional (S-2220)
│   ├── s2210.tsx             # Comunicação de Acidente de Trabalho (CAT)
│   ├── s2220.tsx             # Monitor Saúde Ocupacional
│   ├── s2221.tsx             # Exames Toxicológicos
│   ├── s2240.tsx             # Condições Ambientais de Trabalho
│   ├── configuracoes.tsx     # Configurações da empresa + certificado digital
│   ├── fila-transmissao.tsx  # Fila de eventos pendentes de envio
│   ├── historico.tsx         # Histórico de transmissões
│   ├── transmissao-manual.tsx# Envio manual de XML
│   ├── relatorios.tsx        # Relatórios
│   ├── planos.tsx            # Planos e assinaturas (Stripe)
│   └── api/
│       ├── assinar-xml.js        # Assina XML com certificado digital (node-forge)
│       ├── transmitir-esocial.js # Envia SOAP com mTLS ao Gov.br
│       ├── xml-generator.js      # Gera XML dos eventos eSocial
│       ├── ler-documento.js      # Lê PDFs via IA (Claude/Gemini) e extrai dados SST
│       ├── ler-certificado.js    # Valida e lê metadados do certificado .pfx
│       ├── verificar-duplicidade.js # Verifica eventos duplicados antes de transmitir
│       ├── consultar-lote.js     # Consulta status de lote no Gov.br
│       ├── cert/
│       │   └── salvar.ts         # Upload e salvamento seguro do certificado digital
│       ├── admin/
│       │   ├── dashboard.js      # Dados do painel admin
│       │   ├── manage-client.js  # Excluir / resetar senha de empresa
│       │   ├── invite-client.js  # Convidar nova empresa
│       │   ├── update-client.js  # Atualizar dados da empresa
│       │   └── renovar-creditos.js # Renovar créditos manualmente
│       ├── stripe/
│       │   ├── checkout.js       # Criar sessão de checkout
│       │   └── webhook.ts        # Webhook Stripe (eventos de pagamento)
│       ├── cron/
│       │   ├── keepalive.ts      # Ping para manter projeto Supabase ativo
│       │   ├── reset-creditos.js # Reset mensal de créditos por plano
│       │   └── alertas-trial.js  # E-mails de alerta de trial expirando
│       └── internal/
│           └── log-ia.js         # Log interno de uso de IA (fire-and-forget)
├── lib/
│   ├── auth-middleware.ts    # requireAuth(): valida JWT do Supabase
│   ├── rate-limit.ts         # checkRateLimit(): controle por IP
│   ├── cert-crypto.ts        # encryptSenha/decryptSenha (AES-256-GCM)
│   ├── cert-store.ts         # uploadCertR2/downloadCertR2 (Cloudflare R2)
│   ├── supabase.ts           # Cliente Supabase (anon key, client-side)
│   ├── empresa.ts            # Helpers de empresa
│   └── gerarPDF.ts           # Geração de relatórios PDF
└── public/                   # Assets estáticos
```

---

## Banco de Dados (Supabase — projeto `nujrhikewkodtemvwske`)

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `empresas` | Cadastro das empresas clientes. Contém dados do certificado digital (path R2, senha criptografada, validade) |
| `usuarios` | Usuários do sistema. Vinculados a uma empresa via `empresa_id` |
| `usuario_empresas` | Vínculo N:N entre usuários e empresas (para procuradores) |
| `funcionarios` | Funcionários da empresa (CPF, cargo, vínculo, dados de saúde) |
| `asos` | Atestados de Saúde Ocupacional |
| `cats` | Comunicações de Acidente de Trabalho |
| `ltcats` | Laudos Técnicos de CAT |
| `transmissoes` | Histórico de transmissões ao Gov.br (status, recibo, XML, erros) |
| `pcmso_programa` | Dados do Programa de Controle Médico de Saúde Ocupacional |
| `api_logs` | Log de uso da API de IA (modelo, tokens, custo estimado) |
| `planos` | Configurações de planos disponíveis |

### Segurança
- **RLS (Row Level Security)** ativo em todas as tabelas
- Políticas baseadas em `empresa_id` do usuário autenticado
- API routes server-side usam `SUPABASE_SERVICE_ROLE_KEY` (nunca exposta ao cliente)
- Clientes usam `SUPABASE_ANON_KEY` com RLS como barreira

---

## Fluxo Principal: Transmissão eSocial

```
1. Usuário preenche dados do evento (ex: ASO)
   └─> Página aso.tsx

2. Sistema gera XML do evento
   └─> POST /api/xml-generator (monta XML conforme layout eSocial)

3. Verificação de duplicidade
   └─> POST /api/verificar-duplicidade (checa tabela transmissoes)

4. Assinatura digital do XML
   └─> POST /api/assinar-xml
       ├─ Baixa certificado .pfx do Cloudflare R2
       ├─ Decripta senha (AES-256-GCM)
       └─ Assina com node-forge (RSA + SHA-256)

5. Transmissão ao Gov.br
   └─> POST /api/transmitir-esocial
       ├─ Monta envelope SOAP
       ├─ Envia via HTTPS com mTLS (certificado do cliente)
       └─ Salva recibo/protocolo na tabela transmissoes

6. E-mail de confirmação
   └─> Resend API
```

---

## Fluxo: Leitura de Documentos por IA

```
1. Usuário faz upload de PDF (ex: ASO, PCMSO, PGR)
   └─> /api/ler-documento

2. PDF convertido para base64 e enviado à IA
   ├─ Primário: Claude (Anthropic) — claude-sonnet-3-5
   └─ Fallback: Gemini (Google) — gemini-2.5-flash

3. IA extrai dados estruturados (JSON) do documento

4. Dados preenchidos automaticamente no formulário

5. Log de uso salvo (fire-and-forget)
   └─> POST /api/internal/log-ia
```

---

## Certificado Digital

O certificado e-CNPJ (tipo A1, arquivo .pfx) é tratado com cuidado especial:

1. **Upload:** `POST /api/cert/salvar` — valida o .pfx com node-forge, verifica validade
2. **Armazenamento:** Arquivo binário no Cloudflare R2 (`certificados/{empresa_id}/cert.pfx`)
3. **Senha:** Criptografada com AES-256-GCM antes de salvar no banco (`cert_senha_enc`)
4. **Uso:** Baixado do R2 sob demanda, nunca armazenado em disco no servidor
5. **Chave de criptografia:** `CERT_ENCRYPTION_KEY` (variável de ambiente, 32 bytes hex)

---

## Autenticação e Autorização

```
Usuário → Supabase Auth (JWT)
    └─> requireAuth() [lib/auth-middleware.ts]
        ├─ Valida token JWT
        ├─ Retorna user.id e empresa_id
        └─ Retorna 401 se inválido

Rotas admin:
    └─> Verificam user.email === process.env.ADMIN_EMAIL
```

### Níveis de acesso
| Perfil | Acesso |
|--------|--------|
| `admin` | Todas as funcionalidades da empresa |
| `colaborador` | Somente leitura/inserção, sem configurações |
| Admin do sistema | Painel `/admin` — gestão de todas as empresas |

---

## Variáveis de Ambiente

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública Supabase (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin Supabase (server-side only) |
| `CERT_ENCRYPTION_KEY` | Chave AES-256 para criptografar senhas de certificados |
| `R2_ACCOUNT_ID` | ID da conta Cloudflare R2 |
| `R2_ACCESS_KEY` | Chave de acesso R2 |
| `R2_SECRET_KEY` | Chave secreta R2 |
| `R2_BUCKET` | Nome do bucket R2 |
| `ANTHROPIC_API_KEY` | API key do Claude (Anthropic) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key do Gemini (Google) |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Segredo para validar webhooks Stripe |
| `RESEND_API_KEY` | Chave Resend para e-mails |
| `ADMIN_EMAIL` | E-mail do administrador do sistema |
| `INTERNAL_API_SECRET` | Segredo para endpoint interno de log |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação |

---

## Deploy

- **Repositório:** https://github.com/dsegia/esocial-sst
- **Plataforma:** Vercel (conectado ao GitHub)
- **Fluxo:** `git push origin main` → Vercel detecta e faz deploy automaticamente
- **Nunca** rodar `vercel deploy` manualmente

---

## Como Rodar Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/dsegia/esocial-sst
cd esocial-sst

# 2. Instalar dependências
npm install

# 3. Criar arquivo de variáveis de ambiente
cp .env.example .env.local
# Preencher .env.local com as chaves reais

# 4. Rodar em desenvolvimento
npm run dev
# Acesso em http://localhost:3000
```

---

## Padrões de Código

- **Estilo:** Inline styles (sem Tailwind, sem CSS Modules)
- **Cores:** `#185FA5` (azul primário), `#f4f6f9` (fundo)
- **Sem comentários** desnecessários no código
- **Sem `console.log`** em produção
- **Sem abstrações prematuras** — código direto e legível
