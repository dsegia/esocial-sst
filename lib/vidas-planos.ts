// Plano único por vidas ativas (funcionários cadastrados e ativos).
// Faixas espelham exatamente os tiers do Price no Stripe (billing_scheme=tiered,
// tiers_mode=volume, aggregate_usage=max) — ver STRIPE_PRICE_VIDAS em .env.local.
export const FAIXAS_VIDAS = [
  { ate: 10,        preco: 69 },
  { ate: 30,        preco: 119 },
  { ate: 75,        preco: 179 },
  { ate: 150,       preco: 279 },
  { ate: 300,       preco: 399 },
  { ate: 500,       preco: 599 },
  { ate: Infinity,  precoPorVida: 1.10 }, // acima de 500 — mesma taxa do Price no Stripe (fallback automático)
] as const

export function faixaAtual(qtdVidas: number) {
  return FAIXAS_VIDAS.find(f => qtdVidas <= f.ate) ?? FAIXAS_VIDAS[FAIXAS_VIDAS.length - 1]
}

export function calcularMensalidade(qtdVidas: number): number {
  const faixa = faixaAtual(qtdVidas)
  if ('preco' in faixa) return faixa.preco
  return Math.round(qtdVidas * faixa.precoPorVida! * 100) / 100
}

export function formatarFaixaLabel(index: number): string {
  const anterior = index > 0 ? FAIXAS_VIDAS[index - 1].ate + 1 : 1
  const faixa = FAIXAS_VIDAS[index]
  if (faixa.ate === Infinity) return `Acima de ${anterior - 1}`
  return anterior === faixa.ate ? `${faixa.ate}` : `${anterior}–${faixa.ate}`
}
