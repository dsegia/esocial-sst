# eSocial SST Transmissor — Contexto para Projeto Claude

## Sobre este documento
Este arquivo é o contexto completo do sistema eSocial SST para uso em Projetos Claude.
Cole este arquivo em um Projeto Claude para que todas as conversas futuras já comecem com o contexto correto.

---

## 1. IDENTIDADE DO PROJETO

**Nome:** eSocial SST Transmissor  
**URL produção:** https://esocial-sst.vercel.app  
**Repositório:** https://github.com/dsegia/esocial-sst  
**Login teste:** admin@esocial.com / Esocial@123  
**Empresa teste:** AMBIENTAL TREINAMENTOS — CNPJ 20.520.396/0001-05  

---

## 2. STACK TÉCNICA

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 + React + TypeScript/JSX |
| Banco de dados | Supabase PostgreSQL |
| Autenticação | Supabase Auth |
| Storage | Cloudflare R2 |
| IA leitura PDF | Gemini 2.5-flash-lite (ASO) → Claude Haiku (LTCAT/PCMSO) |
| Assinatura XML | node-forge (XMLDSig ICP-Brasil) |
| Deploy | Vercel |
| Custo atual | R$0/mês |

---

## 3. ESTRUTURA DE ARQUIVOS

```
C:\esocial-sst\
├── components/
│   └── Layout.tsx              ← menu lateral, nav, logout
├── pages/
│   ├── index.tsx               ← login
│   ├── dashboard.tsx           ← KPIs reais, alertas, ações rápidas
│   ├── funcionarios.tsx        ← CRUD + importar planilha CSV
│   ├── leitor.jsx              ← leitor PDF/XML por tipo (ASO/LTCAT/PCMSO)
│   ├── ltcat.jsx               ← LTCAT: GHEs, agentes, EPI/EPC, edição inline
│   ├── pcmso.jsx               ← PCMSO: programas por função + monitoramento
│   ├── s2220.tsx               ← S-2220: status ASO por funcionário
│   ├── s2240.tsx               ← S-2240: vínculo GHE + transmissão por funcionário
│   ├── s2210.tsx               ← S-2210: CAT (parcial)
│   ├── relatorios.tsx          ← relatórios de transmissão com filtros
│   ├── alertas.tsx             ← alertas de vencimento
│   ├── configuracoes.tsx       ← certificado A1, dados empresa
│   ├── transmissao-manual.tsx  ← assinar XML + transmitir Gov.br
│   └── api/
│       ├── ler-documento.js    ← Gemini (ASO) / Claude (LTCAT/PCMSO) + fallback
│       ├── verificar-duplicidade.js
│       ├── xml-generator.js    ← gera XML S-2210/S-2220/S-2240
│       ├── ler-certificado.js  ← metadados do .pfx
│       ├── assinar-xml.js      ← XMLDSig ICP-Brasil
│       └── transmitir-esocial.js ← SOAP Gov.br
├── lib/supabase.ts
└── types/database.ts
```

---

## 4. BANCO DE DADOS (Supabase)

### Tabelas principais
```sql
empresas          -- empresa_id, razao_social, cnpj, cert_digital_validade, cert_titular
usuarios          -- id, empresa_id, nome, perfil
funcionarios      -- id, empresa_id, nome, cpf, data_nasc, data_adm, matricula_esocial,
                  --   funcao, setor, vinculo, turno, ghe_id, ativo
asos              -- id, empresa_id, funcionario_id, tipo_aso, data_exame, prox_exame,
                  --   conclusao, medico_nome, medico_crm, exames(JSONB), riscos(JSONB)
ltcats            -- id, empresa_id, data_emissao, data_vigencia, prox_revisao,
                  --   resp_nome, resp_conselho, resp_registro, ghes(JSONB), ativo
cats              -- id, empresa_id, funcionario_id (S-2210 CAT)
transmissoes      -- id, empresa_id, funcionario_id, evento, status, recibo,
                  --   dt_envio, tentativas, erro_descricao, referencia_id, referencia_tipo
pcmso_programa    -- id, empresa_id, funcao, setor, riscos(array), exames(JSONB)
agentes_tabela24  -- codigo, grupo, nome, tipo, sinonimos (39 agentes nocivos)
exames_tabela27   -- codigo, nome, sinonimos (70 procedimentos diagnósticos)
usuario_empresas  -- multi-empresa (SQL criado, UI pendente)
```

### Estrutura GHE (JSONB em ltcats.ghes)
```json
{
  "nome": "GHE 01",
  "setor": "Produção",
  "qtd_trabalhadores": 10,
  "aposentadoria_especial": false,
  "funcoes": ["Operador de Produção", "Soldador"],
  "agentes": [
    {"tipo": "fis", "nome": "Ruído contínuo", "valor": "85dB", "limite": "85dB", "supera_lt": false, "codigo_t24": "01.01.001"}
  ],
  "epc": [{"nome": "Protetor auricular", "eficaz": true}],
  "epi": [{"nome": "Protetor auricular", "ca": "12345", "eficaz": true}]
}
```

### Estrutura exames ASO (JSONB em asos.exames)
```json
[
  {"nome": "Audiometria tonal", "resultado": "Normal", "codigo_t27": "0040"},
  {"nome": "Espirometria", "resultado": "Normal", "codigo_t27": "0060"}
]
```

### Estrutura riscos ASO (JSONB em asos.riscos + riscos_codificados)
```json
[
  {"nome": "Ruído contínuo ou intermitente", "codigo_t24": "01.01.001", "tipo": "fis"},
  {"nome": "Poeira respirável sílica", "codigo_t24": "02.11.001", "tipo": "qui"}
]
```

### Funções SQL importantes
```sql
get_alertas_vencimento(empresa_id)
get_kpis_dashboard(empresa_id)
verificar_aso_duplicado(func_id, tipo, data, aso_id?)
mapear_exame(nome) → código Tabela 27
mapear_agente(nome) → código Tabela 24
get_minhas_empresas() → empresas do usuário logado
```

### Segurança
- RLS ativo em todas as tabelas por `empresa_id`
- Certificado digital NUNCA armazenado — apenas metadados (titular, validade, CNPJ)

---

## 5. VARIÁVEIS DE AMBIENTE (Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
GEMINI_API_KEY         # gemini-2.5-flash-lite (ASO) → gemini-2.5-flash (fallback)
ANTHROPIC_API_KEY      # claude-haiku-4-5 (LTCAT/PCMSO primário)
R2_ACCOUNT_ID
R2_ACCESS_KEY
R2_SECRET_KEY
R2_BUCKET
NEXT_PUBLIC_VERSION=2
```

---

## 6. FUNCIONALIDADES — STATUS

### ✅ Concluído e no ar

**Dashboard**
- KPIs reais: funcionários, conformidade ASO %, ASOs vencidos, pendentes, enviados
- Alertas priorizados por criticidade com botão de ação direto
- Painel LTCAT com status de vigência
- Ações rápidas em grid
- Últimas 8 transmissões com nome do funcionário

**Leitor de documentos** (`/leitor?tipo=aso|ltcat|pcmso`)
- Tipo fixo por página — sem detecção automática
- ASO: Gemini primário → Claude fallback
- LTCAT/PCMSO: Claude primário → Gemini fallback
- Exames mapeados para Tabela 27 com badge `T27:xxxx`
- Riscos mapeados para Tabela 24 com badge `T24:xx.xx.xxx` colorido por tipo
- Alerta de aposentadoria especial quando agentes nocivos detectados
- Detecção de duplicidade ASO (3 níveis: UI + API + constraint DB)
- Atualiza função/setor do funcionário existente se vazio ao salvar

**LTCAT** (`/ltcat`)
- Visualização de múltiplos laudos com seleção lateral
- 21+ GHEs com agentes, EPI/EPC, funções/cargos
- Edição inline completa: nome, setor, qtd, aposentadoria especial, agentes, EPI, EPC, funções
- Funções/cargos por GHE com counter de funcionários vinculados
- Excluir (permanente) e Arquivar

**Funcionários** (`/funcionarios`)
- CRUD completo
- Importar planilha CSV (detecta separador `;` ou `,`, colunas flexíveis)
- Baixar modelo CSV com 2 exemplos preenchidos
- Aviso de dados incompletos para transmissão

**S-2220** (`/s2220`)
- Status real por funcionário: Sem ASO / Dados incompletos / Pendente / Transmitido / Rejeitado / ASO vencido
- Dias para vencer com alerta de cor
- Modal edição de funcionário inline
- Filtros: todos / pendentes / transmitidos / problemas

**S-2240** (`/s2240`)
- Vínculo GHE por prioridade: manual (ghe_id) → função → setor → único GHE
- Modal "Vincular GHE" com preview de agentes, funções e aposentadoria especial
- Ações: Vincular GHE / Criar S-2240 / Transmitir / Trocar GHE / Editar / Excluir
- Vínculo automático por função cadastrada no GHE

**Relatórios** (`/relatorios`)
- Filtros: evento (S-2210/2220/2240), status, mês, ano, busca por nome/CPF/recibo
- KPIs: total, enviados, pendentes, rejeitados
- Exclusão com confirmação (aviso se já transmitido ao Gov.br)

**Configurações** (`/configuracoes`)
- Certificado A1: upload .pfx + leitura de metadados (titular, validade, CNPJ)
- Procuração eCAC
- Dados da empresa

**Transmissão manual** (`/transmissao-manual`)
- Carregar .pfx + senha
- Assinar XMLDSig ICP-Brasil com node-forge
- Enviar SOAP ao Gov.br (produção restrita / produção)
- Resultado por evento com recibo

**Banco**
- Tabela 24: 39 agentes nocivos com sinônimos e função `mapear_agente()`
- Tabela 27: 70 procedimentos diagnósticos com função `mapear_exame()`
- Gerador XML S-2210/S-2220/S-2240 com códigos corretos

**Menu lateral**
```
Dashboard
Funcionários
DOCUMENTOS SST
  ASO → /leitor?tipo=aso
  LTCAT → /ltcat
  PCMSO → /pcmso
TRANSMISSÕES
  S-2220 Monit. Saúde
  S-2240 Cond. Ambientais
  S-2210 CAT
GESTÃO
  Relatórios
  Alertas
  Configurações
```

### 🔄 Parcial / Em ajuste

- **PCMSO** — visualização e cadastro manual OK; leitura de PDF salva no banco parcialmente
- **S-2210 CAT** — página existe, sem formulário de cadastro manual
- **Leitura LTCAT** — Claude lê corretamente mas API sem crédito; Gemini como fallback
- **Funções nos GHEs** — campo existe, vínculo automático funcionando; leitura automática do PDF depende do Claude

### 📋 Backlog

- Seletor de empresa no login (SQL multi-empresa já criado)
- Geração de PDF (PCMSO, LTCAT, Ficha EPI) com jsPDF
- Integração real Gov.br (código pronto, falta certificado A1 para testar)
- Notificações por e-mail de vencimento
- Tabela CBO completa (2.500+ ocupações)
- Convite de usuários por empresa
- Limite de funcionários por plano (validação no middleware)
- Trial de 14 dias automatizado
- Cobrança via Stripe

---

## 7. FLUXO GIT

**URL:** `https://github.com/dsegia/esocial-sst.git`

```bash
# Configurar token
git remote set-url origin https://SEU_TOKEN@github.com/dsegia/esocial-sst.git

# Deploy
git add -A && git commit -m "descrição" && git push origin main

# Se rejeitado
git pull origin main --rebase
git push origin main

# Atalho
esocial-terminal.bat (em C:\esocial-sst\)
```

---

## 8. LEITOR DE DOCUMENTOS — DETALHES TÉCNICOS

### Fluxo ASO
1. PDF digital → extrai texto (pdfjs) → Gemini 2.5-flash-lite
2. PDF escaneado → converte imagens → Gemini 2.5-flash
3. Fallback: quota Gemini → Claude Haiku
4. Mapeia exames → Tabela 27 (código `T27:xxxx`)
5. Mapeia riscos → Tabela 24 (código `T24:xx.xx.xxx`)
6. Verifica duplicidade antes de salvar
7. Atualiza dados do funcionário se campos vazios

### Fluxo LTCAT
1. PDF → extrai texto (pdfjs)
2. Pré-processa: marca seções "===FUNÇÕES DO GRUPO==="
3. Claude Haiku (primário) → extrai GHEs com funções/cargos
4. Fallback: Gemini com prompt reforçado
5. Salva em `ltcats.ghes` (JSONB) — sem criar funcionário

### Fluxo PCMSO
1. Detectado pelo tipo=pcmso na URL
2. Claude extrai: médico coordenador, CRM, programas por função, exames com periodicidade
3. Salva em `pcmso_programa`

---

## 9. TRANSMISSÃO ESOCIAL — DETALHES TÉCNICOS

### Endpoints Gov.br
```
Produção restrita: https://webservices.producaorestrita.esocial.gov.br/...
Produção:          https://webservices.esocial.gov.br/...
```

### Fluxo de transmissão
1. Carregar .pfx + senha (nunca sai do browser)
2. Verificar validade do certificado
3. Gerar XML com códigos corretos (T27/T24)
4. Assinar com XMLDSig (SHA-1 + RSA, ICP-Brasil)
5. Envelope SOAP
6. POST ao webservice
7. Parsear resposta: recibo ou erro
8. Atualizar `transmissoes` no banco

### Status de transmissão
- `pendente` — criada, aguardando envio
- `enviado` — recibo recebido do Gov.br
- `rejeitado` — Gov.br retornou erro (salvo em `erro_descricao`)

---

## 10. MODELO DE NEGÓCIO (SAAS)

### Planos
| Plano | Preço | Funcionários | Usuários |
|-------|-------|-------------|---------|
| Starter | R$ 97/mês | até 10 | 1 |
| Profissional | R$ 247/mês | até 50 | 3 |
| Enterprise | R$ 597/mês | ilimitado | ilimitado |

Adicional: R$ 2/funcionário/mês acima do limite

### Canais de venda
- LinkedIn orgânico (conteúdo eSocial SST)
- Google Ads (palavras de intenção alta)
- Parceiros: consultorias SST, médicos do trabalho, contadores
- White-label para revendas

### Métricas-alvo
- Mês 3: R$ 2k MRR (10 clientes)
- Mês 6: R$ 6–16k MRR (30–80 clientes)
- Mês 12: R$ 35k MRR (150 clientes)

---

## 11. REGRAS PARA O CLAUDE AO AJUDAR NESTE PROJETO

1. **Stack:** Next.js 14, Supabase, TypeScript/JSX, Vercel. Não sugerir outras tecnologias sem justificativa.
2. **Custo zero:** Manter custo de infra R$0 enquanto possível. Não adicionar serviços pagos sem necessidade.
3. **Segurança:** Certificado digital NUNCA armazenado. Chave privada apenas em memória durante assinatura.
4. **Multi-tenant:** Sempre incluir `empresa_id` em queries e RLS. Jamais expor dados de outra empresa.
5. **UX:** Feedback imediato ao usuário. Modais de confirmação antes de excluir. Erros claros e em português.
6. **Arquivos:** Gerar arquivos completos prontos para copiar/colar. Não gerar trechos parciais.
7. **eSocial:** Seguir leiaute S-1.3. Usar códigos corretos da Tabela 24 e 27. Respeitar prazos legais.
8. **Estilo de código:** Componentes funcionais React. Estilos inline com objeto `s`. Sem CSS externo.
9. **Banco:** Usar Supabase client. RLS sempre ativo. Não usar service_key no frontend.
10. **Deploy:** Sempre verificar se o build passa antes de confirmar. Corrigir erros de TypeScript/JSX.

---

## 12. PROBLEMAS CONHECIDOS E SOLUÇÕES

| Problema | Causa | Solução |
|----------|-------|---------|
| Gemini não lê funções do GHE | Tabelas complexas no PDF | Usar Claude (primário para LTCAT) |
| `null value in column "data_nasc"` | LTCAT tentava criar funcionário | Corrigido: LTCAT salva só na empresa |
| Build falha com funções duplicadas | Edições múltiplas no mesmo arquivo | Verificar com `grep -n "function X"` antes do commit |
| `accept` sem `=` no JSX | Erro de sintaxe no input | Sempre usar `accept={...}` não `{...}` sem atributo |
| Gemini 429 quota | Free tier 20 req/dia | Fallback automático para Claude Haiku |
| GitHub connection refused | Token expirado ou rede | `git remote set-url origin https://TOKEN@github.com/...` |

---

*Última atualização: Abril 2026 — eSocial SST Transmissor v1.0*
