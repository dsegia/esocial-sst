# eSocial SST — Instruções para Claude Code

## Sobre o Projeto

SaaS de transmissão eSocial SST (Saúde e Segurança do Trabalho) com leitura de documentos via IA. O usuário é dono do produto e atua em todas as frentes: engenharia, produto, operações, marketing, financeiro e vendas.

## Stack
- Next.js 14 (Pages Router) + TypeScript
- Supabase (auth + banco + RLS)
- Vercel (deploy)
- Stripe (pagamentos)
- Resend (e-mails)
- Anthropic API (leitura de PDF via IA)

## Repositório e Deploy

**REGRA CRÍTICA:** Nunca rodar `vercel deploy` manualmente.

O fluxo correto é sempre:
1. Editar arquivos em `C:\esocial-sst` (repositório principal, branch `main`)
2. `git add` + `git commit` + `git push origin main`
3. O Vercel detecta o push no GitHub e faz o deploy automaticamente

O projeto tem dois locais de código:
- **Repositório principal:** `C:\esocial-sst` — sempre editar aqui
- **Worktrees:** `C:\esocial-sst\.claude\worktrees\*` — NÃO editar, NÃO fazer deploy daqui

## Variáveis de ambiente
Estão em `.env.local` (local) e no painel do Vercel (produção).
Nunca commitar `.env.local`.

## Banco de dados
Projeto Supabase: `nujrhikewkodtemvwske`
Sempre usar RLS. Service role key apenas em API routes server-side.

## Padrões de código
- Inline styles (sem CSS modules, sem Tailwind)
- Cores primárias: `#185FA5` (azul), `#f4f6f9` (fundo)
- Sem comentários desnecessários
- Sem `console.log` em produção

## Áreas de Trabalho

O usuário acumula todas as funções. Ao receber pedidos, considere o contexto:

### Engenharia
- Skills disponíveis: `/engineering:code-review`, `/engineering:debug`, `/engineering:architecture`, `/engineering:deploy-checklist`, `/engineering:testing-strategy`
- Padrão: sem abstrações desnecessárias, sem feature flags, sem backwards-compat hacks

### Produto
- Skills: `/product-management:write-spec`, `/product-management:sprint-planning`, `/product-management:roadmap-update`, `/product-management:brainstorm`
- Backlog gerenciado via memória e conversação

### Operações
- Skills: `/operations:process-doc`, `/operations:risk-assessment`, `/operations:runbook`, `/operations:status-report`

### Financeiro / Vendas
- Skills: `/finance:variance-analysis`, `/finance:reconciliation`, `/sales:forecast`, `/sales:pipeline-review`, `/sales:call-prep`
- Contexto: produto SaaS com modelo de assinatura (Stripe), trial 14 dias

### Marketing
- Skills: `/marketing:content-creation`, `/marketing:campaign-plan`, `/marketing:seo-audit`, `/marketing:draft-content`

### Dados
- Skills: `/data:analyze`, `/data:sql-queries`, `/data:build-dashboard`
- Banco Supabase — sempre usar MCP Supabase para queries diretas

### Produtividade
- Skills: `/productivity:task-management`, `/productivity:start`, `/productivity:update`

## Recursos Externos
- **GitHub:** https://github.com/dsegia/esocial-sst
- **Deploy:** https://esocial-sst.vercel.app
- **Supabase:** projeto `nujrhikewkodtemvwske`
- **Vercel:** projeto conectado ao repo acima

## Projetos Paralelos
O usuário tem múltiplos projetos em mente além do eSocial SST. Ao iniciar um novo projeto, criar CLAUDE.md próprio na pasta do projeto com a mesma estrutura acima.
