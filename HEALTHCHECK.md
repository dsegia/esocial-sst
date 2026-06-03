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

## 7. Deploy

- [ ] `git push origin main` (nunca `vercel deploy` manual)
- [ ] Variáveis de ambiente idênticas entre `.env.local` e painel Vercel
- [ ] Sem `producao_restrita` em nenhum arquivo (remover se aparecer)
