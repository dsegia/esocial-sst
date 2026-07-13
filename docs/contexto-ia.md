# eSocial SST — Contexto completo do sistema

Você está recebendo o contexto completo de um SaaS real e em produção chamado
**eSocial SST**. Use estas informações para gerar conteúdo, artes, posts ou
qualquer material que precise refletir com precisão o que o sistema realmente
faz — não invente funcionalidades além das listadas aqui.

## O que é
SaaS brasileiro de transmissão eSocial SST (Saúde e Segurança do Trabalho)
com leitura de documentos via Inteligência Artificial. O sistema conecta
diretamente ao Governo Federal (Gov.br) via certificado digital e assina/
envia os eventos obrigatórios do eSocial relacionados à saúde e segurança
do trabalhador.

Frase de efeito atual usada no site: "Transmita o eSocial SST com Inteligência
Artificial" · "Sistema ao vivo · 100% conforme eSocial".

## Público-alvo
- Escritórios de consultoria em Segurança e Saúde no Trabalho (SST) que atendem múltiplos clientes (CNPJs)
- Empresas de todos os portes com empregados CLT no Brasil (obrigadas a transmitir eventos eSocial SST)
- Técnicos e engenheiros de segurança do trabalho, médicos do trabalho (responsáveis técnicos por LTCAT/PCMSO/PGR)

## Proposta de valor / diferenciais
- Elimina digitação manual: a IA lê PDFs de ASO, LTCAT e PCMSO já existentes e preenche o sistema automaticamente
- Transmissão real e assinada digitalmente ao Gov.br (não é só um formulário — assina XML e envia via SOAP com certificado e-CNPJ)
- Suporte a consultorias multi-empresa (um único operador gerencia vários CNPJs clientes)
- Todos os documentos obrigatórios de SST num só lugar, com dados que se conectam entre si (o LTCAT alimenta automaticamente PGR, PCMSO, LIP e PPP)
- Trial de 14 dias grátis, sem cartão de crédito

## Funcionalidades (tudo já implementado e em produção)

### Transmissão eSocial (eventos reais ao Gov.br)
- S-2210 — Comunicação de Acidente de Trabalho (CAT)
- S-2220 — Monitoramento da Saúde do Trabalhador (ASO)
- S-2221 — Exame Toxicológico
- S-2240 — Condições Ambientais do Trabalho (baseado no LTCAT)
- Fila de transmissão, transmissão manual assinada digitalmente, histórico e relatórios de conformidade

### Leitura de documentos por IA
- Importação de PDF (ASO, LTCAT, PCMSO) — a IA extrai os dados e pré-preenche o cadastro automaticamente

### Documentos SST (gestão completa, com PDF exportável)
- **ASO** — Atestado de Saúde Ocupacional
- **CAT** — Comunicação de Acidente de Trabalho
- **LTCAT** — Laudo Técnico das Condições Ambientais do Trabalho (NR-15), com GHEs, agentes de risco, EPI/EPC
- **PCMSO** — Programa de Controle Médico de Saúde Ocupacional (NR-7), com médico coordenador próprio (nome/CPF/CRM) e programa de exames por função
- **PGR** — Programa de Gerenciamento de Riscos (NR-1), inventário de riscos + plano de ação
- **AET** — Análise Ergonômica do Trabalho (NR-17), por posto de trabalho
- **APR** — Análise Preliminar de Risco, por atividade/tarefa, com etapas de risco e equipe
- **LIP** — Laudo de Insalubridade e Periculosidade (NR-15/16), grau e percentual por função
- **PPP** — Perfil Profissiográfico Previdenciário, histórico de exposição ocupacional por funcionário

### Gestão
- Cadastro de funcionários (individual e importação em massa via CSV)
- Multi-empresa: um usuário pode gerenciar várias empresas/CNPJs (típico de consultorias)
- Convite de usuários com perfis: admin, operador, visualizador
- Procuração eCAC — consultorias transmitem eventos em nome de empresas clientes
- Dashboard com KPIs, alertas de vencimento (ASO, LTCAT) e pendências
- Relatórios de conformidade e histórico completo

## Planos e preços
- **Trial**: 14 dias grátis, sem cartão de crédito
- **Micro** — R$ 49/mês — 50 envios incluídos, R$ 1,90/envio excedente — importação por IA, ASO/LTCAT/PCMSO, transmissão, alertas
- **Starter** — R$ 97/mês — 100 envios incluídos, R$ 1,50/envio excedente — tudo do Micro + multi-empresa (até 5 CNPJs) + relatórios avançados
- **Pro** — R$ 197/mês — 400 envios incluídos, R$ 1,20/envio excedente — tudo do Starter + até 10 CNPJs + suporte prioritário

## Stack técnica (para conteúdo técnico/institucional)
Next.js 14, TypeScript, Supabase (Postgres + Auth + Row Level Security),
Stripe (pagamentos), Resend (e-mails transacionais), API Anthropic Claude
(leitura de PDF via IA), certificado digital e-CNPJ A1 com assinatura XML
e comunicação SOAP/mTLS direta com o Gov.br, deploy na Vercel.

## Identidade visual
- Cor primária: **#185FA5** (azul institucional)
- Gradiente usado no branding: #185FA5 → #3b82f6 → #6366f1
- Fundo neutro: #f4f6f9 / #f8fafc
- Tom de voz: confiável, direto, tecnológico — "compliance com IA", nunca informal demais (é um produto de conformidade legal/governamental)
- Cores de status: verde #1D9E75 (em dia/aprovado), amarelo #EF9F27 (atenção), vermelho #E24B4A (crítico/vencido)

## Como usar este prompt
Use as seções acima como fonte única da verdade sobre o produto. Ao gerar
artes, posts, landing pages ou textos institucionais, mantenha a cor #185FA5,
cite apenas as funcionalidades listadas acima, e reforce sempre: (1) IA lê
documentos automaticamente, (2) transmissão real e assinada ao Gov.br, (3)
suporte a múltiplas empresas para consultorias, (4) trial grátis de 14 dias
sem cartão.
