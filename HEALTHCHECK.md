# eSocial SST — Checklist de Saúde do Sistema

Execute este checklist antes de cada release ou quando pedir revisão.

## 1. Banco de Dados (Supabase)

### RLS
- [ ] Todas as tabelas com RLS habilitado (`rowsecurity = true`)
- [ ] Sem políticas duplicadas por tabela/operação
- [ ] `auth.uid()` sempre dentro de `(SELECT auth.uid())` nas políticas
- [ ] `WITH CHECK` definido em todas as políticas de INSERT/UPDATE

### Performance
- [ ] Sem FKs sem índice cobrindo (`get_advisors` → unindexed_foreign_keys)
- [ ] Sem índices duplicados (`get_advisors` → duplicate_index)

## 2. Queries no frontend

### Obrigatório
- [ ] Toda query que pode retornar 0 linhas usa `.maybeSingle()`, nunca `.single()`
- [ ] Toda query de lista tem `.limit()` definido
- [ ] Todo `Promise.all()` tem `.catch()` ou está dentro de `try/catch`

### Limites padrão por entidade
| Tabela | Limit recomendado |
|---|---|
| funcionarios | 2000 |
| asos | 5000 |
| transmissoes | 1000 |
| pcmso_programa | 200 |
| ltcats | limit(1).maybeSingle() |

## 3. APIs

### Autenticação
- [ ] Todo endpoint tem `requireAuth(req, res)` antes de processar
- [ ] Endpoints admin verificam `ADMIN_PASSWORD` no header
- [ ] Service role key só em API routes server-side, nunca no frontend

### Rate limiting
- [ ] Todo endpoint tem `checkRateLimit()` com limites adequados

## 4. Segurança

### Campos e formulários
- [ ] CPF/CNPJ validados com dígitos verificadores antes de salvar
- [ ] Uploads de arquivo validam tipo (`f.type === 'application/pdf'`)
- [ ] Nenhum `select('*')` em tabelas com dados sensíveis

### Supabase
- [ ] `anon` role sem EXECUTE em funções sensíveis
- [ ] `api_logs` INSERT com `WITH CHECK (false)`

## 5. Código

### Padrões obrigatórios
- [ ] Nenhum `console.log` em código de produção (apenas `console.error` em catch)
- [ ] Funções de data protegidas com `isNaN()` antes de calcular
- [ ] Imports de `getEmpresaId()` usados para suporte multi-empresa

## 6. Transmissão Gov.br

- [ ] `tpAmb` sempre `'1'` (Produção) — nunca `'2'`
- [ ] Ambiente `producao` em todos os inserts de transmissoes
- [ ] Certificado digital válido carregado em Configurações
- [ ] `cnpj_empregador` recebido no body é validado contra `empresa.cnpj` antes de montar o envelope SOAP — nunca confiar em CNPJ vindo cru do client

## 7. Isolamento entre empresas (regra dura do produto)

Nenhum funcionário, documento (PGR/LTCAT/PCMSO/AET/APR/LIP/PPP/ASO/CAT) ou certificado pode vazar entre empresas/CNPJs, nem entre filiais do mesmo grupo/consultoria.

- [ ] Toda tabela de dados de empresa tem RLS habilitada **e** policy real (não só `rowsecurity=true` sem policy — checar com `get_advisors`/`list_tables`, não só ler o `.sql` local)
- [ ] Policies de INSERT em tabelas de vínculo (`usuario_empresas`) nunca permitem `WITH CHECK (usuario_id = auth.uid())` sozinho — isso deixa qualquer usuário autenticado se auto-conceder acesso a **qualquer** `empresa_id` que ele souber (UUID ou por CNPJ público). Sempre exigir também que a empresa-alvo não tenha vínculo prévio (empresa "órfã") ou outra prova de legitimidade
- [ ] Todo endpoint que vincula um usuário a uma empresa **já existente** (ex: `cadastrar-empregadora`, convites) rejeita a operação se a empresa já tiver um responsável cadastrado e o solicitante não for um deles
- [ ] Funções `SECURITY DEFINER` chamáveis via RPC por `authenticated`/`anon` (ver `get_advisors` → `authenticated_security_definer_function_executable`) nunca confiam em um `p_user_id`/`p_empresa_id` vindo como parâmetro sem validar contra `auth.uid()` ou contra `usuario_empresas`
- [ ] Funções **não**-`SECURITY DEFINER` que checam `auth.uid()` internamente só podem ser chamadas por um client com o JWT do usuário — nunca pela service role key (o contexto de `auth.uid()` fica `NULL` e a função nega acesso sempre). Endpoints de API que usam service role para outras coisas precisam de um client separado com o `Authorization: Bearer <token do usuário>` para essas chamadas
- [ ] Mensagens de erro de constraint única (ex: CNPJ duplicado) nunca expõem ao usuário se o registro já existe em **outra** conta — usar mensagem genérica

## 8. Rotinas cron (`vercel.json` → `pages/api/cron/*`)

- [ ] Todas checam `CRON_SECRET` com o mesmo padrão: `if (!cronSecret || authHeader !== ...)` — nunca só a comparação direta (fica frágil se a env var não estiver setada)
- [ ] Toda query cujo resultado decide uma ação (bloquear, cobrar, enviar e-mail) verifica `error` explicitamente — nunca deixar `undefined` silencioso mascarar uma falha de schema/infra como sucesso
- [ ] `trial_inicio` e `plano_expira_em` são uma única fonte de verdade (populados juntos pelo trigger `set_trial_inicio()`) — nunca calcular vencimento de trial a partir de um campo em um cron e de outro campo em outro cron
- [ ] Rotinas que enviam e-mail (alertas) e rodam por comparação exata de dias (`dias_restantes === N`) devem ter um plano para picos: se o cron falhar no dia exato, aquele alerta é perdido permanentemente. Ao adicionar um novo alerta, considerar faixa cumulativa + controle de "já enviado" em vez de igualdade exata

## 9. Documentos SST (PGR, LTCAT, PCMSO, AET, APR, LIP, PPP)

- [ ] Toda página de documento usa `getEmpresaIdValida()` (`lib/empresa.ts`) para revalidar a "empresa selecionada" do `localStorage` contra `usuario_empresas`/`usuarios` antes de ler/gravar — nunca confiar cegamente no valor salvo no client
- [ ] Upload de imagens/PDFs desses módulos fica dentro do próprio registro (RLS da tabela) ou em bucket com path por `empresaId` e acesso só server-side — nunca signed URL previsível nem bucket público
- [ ] Campos obrigatórios (CPF, matrícula eSocial, CNPJ) validados antes de gerar XML/PDF para envio
- [ ] Ao adicionar um 8º documento SST, repetir esta seção do checklist para ele

## 10. Deploy

- [ ] `git push origin main` (nunca `vercel deploy` manual)
- [ ] Variáveis de ambiente idênticas entre `.env.local` e painel Vercel
- [ ] Sem `producao_restrita` em nenhum arquivo (remover se aparecer)
