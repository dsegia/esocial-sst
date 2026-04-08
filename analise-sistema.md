# Análise Completa — 9 Pontos

## 1. Dashboard não mostra LTCAT e PCMSO
**Solução:** Adicionar cards de status do LTCAT vigente e conformidade do PCMSO no dashboard.
**Arquivo:** dashboard.tsx — já corrigido na última versão.

---

## 2. Histórico — excluir + lote vs individual
**Solução implementada:**
- Botão 🗑 em cada linha com confirmação antes de excluir
- Modo "Selecionar" para ações em massa
- Toggle lote ↔ individual por transmissão ou em grupo
- Filtros por evento e status
**Arquivo:** historico.tsx — gerado.

---

## 3 e 9. Gemini com erros 503 e 429
**Diagnóstico real:**
- `gemini-2.0-flash` foi APOSENTADO em março/2026 (limit: 0 permanentemente)
- Free tier cortado em dezembro/2025: 20 req/dia para Flash, quase nada para Pro
- **Solução implementada:** cadeia de fallback automática:
  1. `gemini-2.5-flash-lite` (1.000 req/dia grátis — mais generoso)
  2. `gemini-2.5-flash` (250 req/dia)
  3. `claude-haiku` via Anthropic (chave já configurada — ~R$0,02/leitura)
- O sistema tenta cada modelo automaticamente e vai para o próximo se falhar
**Arquivo:** ler-documento.js — gerado.

**Custo real se Gemini esgotar:**
- Claude Haiku: ~$0.25/1M tokens input = ~R$0.02 por PDF lido
- 100 PDFs/mês = ~R$2,00 — negligível

---

## 4. LTCAT manual sem vincular funcionário
**Correto.** LTCAT é da EMPRESA, não do funcionário individualmente.
O S-2240 vincula funcionário ao LTCAT na transmissão, não no laudo em si.
**Solução:** Formulário S-2240 já não tem campo de funcionário obrigatório.

---

## 5. PCMSO sem opção de cadastro manual
**Pendente** — próximo a ser desenvolvido.
O PCMSO é um programa (documento) que define exames por função/risco.
Será uma tabela: Função → Riscos → Exames obrigatórios → Periodicidade.

---

## 6. Um login com várias empresas (escritório contábil)
**Solução implementada via SQL:**
- Tabela `usuario_empresas` vincula 1 usuário a N empresas
- Campo `tipo_acesso`: empresa (normal) | escritório (múltiplas) | admin
- Campo `perfil` por empresa: admin | operador | visualizador
- Função `get_minhas_empresas()` retorna todas as empresas do usuário logado
- Precisará de um seletor de empresa no login (próximo passo de UI)
**Arquivo SQL:** multi-empresa.sql — gerado.

---

## 7. Certificado digital vs Procuração eCAC
**Análise:**

| Opção | Como funciona | Prós | Contras |
|-------|--------------|------|---------|
| Certificado A1 (.pfx) | Upload do arquivo + senha → assina XML localmente | Empresa mantém controle total | Precisa renovar anualmente |
| Procuração eCAC | Empresa autoriza o escritório no Gov.br → escritório transmite | Mais fácil para escritórios | Requer ação manual no Gov.br |

**Recomendação:** implementar as duas opções.
- A1: upload do .pfx + senha no painel (nunca armazenar a senha, apenas o certificado criptografado)
- eCAC: o escritório usa o próprio certificado A1 com procuração

**Custo:** R$0 de infra — a assinatura é feita localmente no servidor com a biblioteca `node-forge`

---

## 8. Análise de concorrentes (eSocial Brasil, Sistema ESO)
**O que oferecem (baseado em conhecimento geral):**
- Leitura de ASO por digitação manual (não IA)
- Transmissão com certificado A1
- Múltiplas empresas por login
- Relatórios de conformidade
- Integração com clínicas

**Diferencial do nosso sistema:**
- Leitura automática de PDF com IA (nenhum concorrente oferece isso)
- Custo zero de infra inicialmente
- Interface mais moderna
- Leitor de LTCAT com IA

**Limitação:** não transmite de fato ainda (sem assinatura ICP-Brasil implementada)

---

## Próximos passos em ordem de prioridade

1. ✅ Corrigir Gemini (ler-documento.js) — FEITO
2. ✅ Histórico com exclusão e lote — FEITO
3. ✅ SQL multi-empresa — FEITO
4. 🔄 Seletor de empresa no login (UI)
5. 🔄 PCMSO com cadastro manual
6. 🔄 Certificado digital A1 + assinatura XML
7. 🔄 Transmissão real via webservice Gov.br
