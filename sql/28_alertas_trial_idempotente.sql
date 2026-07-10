-- MIGRAÇÃO 28 — Torna o cron de alertas de trial idempotente e capaz de
-- recuperar um alerta perdido caso o cron falhe no dia exato do limiar.
-- Aplicada via MCP. Ver pages/api/cron/alertas-trial.js para a lógica.

ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS ultimo_alerta_trial_dias integer;
COMMENT ON COLUMN public.empresas.ultimo_alerta_trial_dias IS 'Menor valor de dias_restantes (7/3/0) para o qual já foi enviado e-mail de alerta de trial. Evita duplicidade e permite recuperar alerta perdido se o cron falhar no dia exato.';
