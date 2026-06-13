// pages/api/admin/diagnostico.js
// Diagnóstico completo do sistema (1 clique) — roda verificações em runtime:
// configuração, banco, segurança, transmissão, IA, certificados e dados.
// Acesso restrito ao ADMIN_EMAIL. Cada verificação é isolada e nunca derruba o relatório.

import { createClient } from '@supabase/supabase-js'
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'

export const config = { maxDuration: 30 }

const GOVBR_ENDPOINT = 'https://webservices.esocial.gov.br/servicos/empregador/envioLoteEventos/enviarLoteEventos/v1_1_0/index.php'

// status: 'ok' | 'aviso' | 'erro' | 'info'
function check(nome, status, detalhe) {
  return { nome, status, detalhe }
}

function envConfigurada(nome) {
  const v = process.env[nome]
  return typeof v === 'string' && v.trim().length > 0
}

function fetchTimeout(url, opts = {}, ms = 8000) {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(ms) })
}

// Executa um probe ao vivo e nunca lança — devolve sempre um check
async function probe(nome, naoConfigurada, fn) {
  if (naoConfigurada) return check(nome, 'aviso', 'Não configurado')
  try {
    return await fn()
  } catch (e) {
    return check(nome, 'erro', 'Sem resposta: ' + String(e?.message || e).slice(0, 70))
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido' })

  const adminEmail = process.env.ADMIN_EMAIL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ erro: 'Não autenticado' })

  if (!adminEmail || !supabaseUrl || !serviceKey) {
    return res.status(500).json({ erro: 'Variáveis essenciais (ADMIN_EMAIL/SUPABASE) não configuradas' })
  }

  const sbAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error: authErr } = await sbAnon.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ erro: 'Sessão inválida' })
  if (user.email !== adminEmail) return res.status(403).json({ erro: 'Acesso restrito' })

  const sb = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const agora = new Date()
  const ha24h = new Date(agora.getTime() - 24 * 3600 * 1000).toISOString()
  const ha7d  = new Date(agora.getTime() - 7 * 24 * 3600 * 1000).toISOString()
  const ha2h  = new Date(agora.getTime() - 2 * 3600 * 1000).toISOString()
  const hojeStr = agora.toISOString().split('T')[0]
  const em30Str = new Date(agora.getTime() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]

  const categorias = {}
  const addCat = (nome, checks) => { categorias[nome] = checks.filter(Boolean) }

  // ─── 1. CONFIGURAÇÃO (env vars) ────────────────────────────────
  const configChecks = []
  const essenciais = [
    ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase URL'],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Anon Key'],
    ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase Service Role'],
    ['ADMIN_EMAIL', 'E-mail do admin'],
  ]
  for (const [env, label] of essenciais) {
    configChecks.push(check(label, envConfigurada(env) ? 'ok' : 'erro', envConfigurada(env) ? 'Configurada' : 'AUSENTE — funcionalidade quebrada'))
  }
  const ia = []
  if (envConfigurada('ANTHROPIC_API_KEY')) ia.push('Claude')
  if (envConfigurada('GEMINI_API_KEY')) ia.push('Gemini')
  configChecks.push(check('IA (leitura de PDF)', ia.length > 0 ? 'ok' : 'erro',
    ia.length > 0 ? `Configurada: ${ia.join(' + ')}` : 'Nenhuma key de IA — leitura de documentos não funciona'))
  configChecks.push(check('Stripe (pagamentos)', envConfigurada('STRIPE_SECRET_KEY') ? 'ok' : 'aviso',
    envConfigurada('STRIPE_SECRET_KEY') ? 'Configurada' : 'Sem Stripe — cobrança/excedente desativados'))
  configChecks.push(check('Resend (e-mails)', envConfigurada('RESEND_API_KEY') ? 'ok' : 'aviso',
    envConfigurada('RESEND_API_KEY') ? 'Configurada' : 'Sem Resend — e-mails de alerta/confirmação não saem'))
  const r2ok = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_BUCKET'].every(envConfigurada)
  configChecks.push(check('Storage de certificado (R2)', r2ok ? 'ok' : 'aviso',
    r2ok ? 'Configurado' : 'R2 incompleto — armazenamento de certificado por empresa indisponível'))
  configChecks.push(check('URL pública do app', envConfigurada('NEXT_PUBLIC_APP_URL') ? 'ok' : 'aviso',
    envConfigurada('NEXT_PUBLIC_APP_URL') ? process.env.NEXT_PUBLIC_APP_URL : 'Ausente — links em e-mails podem quebrar'))
  configChecks.push(check('Rate-limit distribuído (Upstash)',
    envConfigurada('UPSTASH_REDIS_REST_URL') && envConfigurada('UPSTASH_REDIS_REST_TOKEN') ? 'ok' : 'info',
    envConfigurada('UPSTASH_REDIS_REST_URL') ? 'Redis ativo (entre workers)' : 'Usando fallback in-memory (ok para volume baixo)'))
  addCat('Configuração', configChecks)

  // ─── 2. SEGURANÇA ──────────────────────────────────────────────
  const segChecks = []
  const certKey = process.env.CERT_ENCRYPTION_KEY || ''
  const certKeyOk = /^[0-9a-fA-F]{64}$/.test(certKey)
  segChecks.push(check('Chave de criptografia do certificado', certKeyOk ? 'ok' : 'erro',
    certKeyOk ? 'AES-256 (64 hex) válida' : certKey ? 'Formato inválido — deve ter 64 caracteres hex' : 'AUSENTE — senhas de certificado não podem ser cifradas'))
  segChecks.push(check('Proteção dos crons', envConfigurada('CRON_SECRET') ? 'ok' : 'erro',
    envConfigurada('CRON_SECRET') ? 'CRON_SECRET configurado (crons fail-closed)' : 'CRON_SECRET ausente — crons recusam execução (fail-closed)'))
  segChecks.push(check('Proteção do log interno de IA', envConfigurada('INTERNAL_API_SECRET') ? 'ok' : 'aviso',
    envConfigurada('INTERNAL_API_SECRET') ? 'INTERNAL_API_SECRET configurado' : 'Ausente — log de uso de IA fica desativado'))
  segChecks.push(check('Assinatura do webhook Stripe', envConfigurada('STRIPE_WEBHOOK_SECRET') ? 'ok' : (envConfigurada('STRIPE_SECRET_KEY') ? 'erro' : 'info'),
    envConfigurada('STRIPE_WEBHOOK_SECRET') ? 'Configurada (eventos validados)' : 'Ausente — webhook Stripe não pode validar assinatura'))
  addCat('Segurança', segChecks)

  // ─── CONEXÃO AO VIVO (serviços externos) ───────────────────────
  // Cada probe faz uma chamada REAL ao provedor para validar credenciais/disponibilidade.
  const githubRepo = process.env.GITHUB_REPO || 'dsegia/esocial-sst'
  const liveChecks = await Promise.all([
    // Anthropic (Claude) — lista de modelos valida a key sem custo
    probe('Anthropic (Claude)', !envConfigurada('ANTHROPIC_API_KEY'), async () => {
      const r = await fetchTimeout('https://api.anthropic.com/v1/models?limit=1', {
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      })
      return check('Anthropic (Claude)', r.ok ? 'ok' : 'erro',
        r.ok ? 'Key válida — API respondendo' : r.status === 401 ? 'Key inválida/revogada (401)' : `Falha HTTP ${r.status}`)
    }),
    // Gemini (Google)
    probe('Gemini (Google)', !envConfigurada('GEMINI_API_KEY'), async () => {
      const r = await fetchTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}&pageSize=1`)
      return check('Gemini (Google)', r.ok ? 'ok' : 'erro',
        r.ok ? 'Key válida — API respondendo' : r.status === 400 || r.status === 403 ? 'Key inválida (HTTP ' + r.status + ')' : `Falha HTTP ${r.status}`)
    }),
    // Stripe — saldo valida a secret key
    probe('Stripe', !envConfigurada('STRIPE_SECRET_KEY'), async () => {
      const r = await fetchTimeout('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      })
      const modo = (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live') ? 'live' : 'test'
      return check('Stripe', r.ok ? 'ok' : 'erro',
        r.ok ? `Key válida (modo ${modo})` : r.status === 401 ? 'Key inválida (401)' : `Falha HTTP ${r.status}`)
    }),
    // Resend — lista de domínios valida a key
    probe('Resend (e-mail)', !envConfigurada('RESEND_API_KEY'), async () => {
      const r = await fetchTimeout('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      })
      return check('Resend (e-mail)', r.ok ? 'ok' : 'erro',
        r.ok ? 'Key válida — API respondendo' : r.status === 401 ? 'Key inválida (401)' : `Falha HTTP ${r.status}`)
    }),
    // Cloudflare R2 — HeadBucket valida credenciais + bucket
    probe('Cloudflare R2 (certificados)', !['R2_ACCOUNT_ID', 'R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_BUCKET'].every(envConfigurada), async () => {
      const r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: process.env.R2_ACCESS_KEY, secretAccessKey: process.env.R2_SECRET_KEY },
      })
      await r2.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET }))
      return check('Cloudflare R2 (certificados)', 'ok', `Bucket "${process.env.R2_BUCKET}" acessível`)
    }),
    // Supabase Auth Admin — valida service role + auth
    probe('Supabase Auth (service role)', false, async () => {
      const { error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1 })
      return check('Supabase Auth (service role)', error ? 'erro' : 'ok',
        error ? 'Falha: ' + error.message.slice(0, 60) : 'Service role válido — auth admin OK')
    }),
    // Vercel — estado do último deploy (requer VERCEL_TOKEN)
    probe('Vercel (deploy)', !envConfigurada('VERCEL_TOKEN'), async () => {
      const params = new URLSearchParams({ limit: '1' })
      if (envConfigurada('VERCEL_PROJECT_ID')) params.set('projectId', process.env.VERCEL_PROJECT_ID)
      if (envConfigurada('VERCEL_TEAM_ID')) params.set('teamId', process.env.VERCEL_TEAM_ID)
      const r = await fetchTimeout(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
      })
      if (!r.ok) return check('Vercel (deploy)', 'erro', r.status === 403 ? 'Token sem permissão (403)' : `Falha HTTP ${r.status}`)
      const j = await r.json()
      const d = j.deployments?.[0]
      if (!d) return check('Vercel (deploy)', 'aviso', 'Token válido, sem deploys encontrados')
      const estado = d.state || d.readyState
      const quando = d.created ? new Date(d.created).toLocaleString('pt-BR') : ''
      return check('Vercel (deploy)', estado === 'READY' ? 'ok' : estado === 'ERROR' ? 'erro' : 'aviso',
        `Último deploy: ${estado}${quando ? ' · ' + quando : ''}`)
    }),
    // GitHub — repositório acessível + último push (público; usa token se houver)
    probe('GitHub (repositório)', false, async () => {
      const headers = { 'User-Agent': 'esocial-sst-diagnostico', Accept: 'application/vnd.github+json' }
      if (envConfigurada('GITHUB_TOKEN')) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
      const r = await fetchTimeout(`https://api.github.com/repos/${githubRepo}`, { headers })
      if (!r.ok) return check('GitHub (repositório)', r.status === 404 ? 'erro' : 'aviso',
        r.status === 404 ? `Repo "${githubRepo}" não encontrado` : `HTTP ${r.status}`)
      const j = await r.json()
      const push = j.pushed_at ? new Date(j.pushed_at).toLocaleString('pt-BR') : '—'
      return check('GitHub (repositório)', 'ok', `${githubRepo} · branch ${j.default_branch} · último push ${push}`)
    }),
  ])
  addCat('Conexão ao vivo (serviços externos)', liveChecks)

  // ─── Executa as verificações que tocam rede/banco em paralelo ──
  const [
    pingGov, empResult, transStuck, transRej, trans7d, logs24h, certVenc, divergencias, semResp,
  ] = await Promise.allSettled([
    // Ping Gov.br
    (async () => {
      const t0 = Date.now()
      const r = await fetch(GOVBR_ENDPOINT, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
      return { acessivel: r.status < 500 || r.status === 405, status: r.status, latencia: Date.now() - t0 }
    })(),
    // Conectividade + contagem de empresas
    sb.from('empresas').select('id, plano', { count: 'exact' }),
    // Transmissões presas (pendente > 2h)
    sb.from('transmissoes').select('id', { count: 'exact', head: true }).eq('status', 'pendente').lt('criado_em', ha2h),
    // Rejeitadas 7d
    sb.from('transmissoes').select('id', { count: 'exact', head: true }).eq('status', 'rejeitado').gte('criado_em', ha7d),
    // Total transmissões 7d (por status)
    sb.from('transmissoes').select('status').gte('criado_em', ha7d),
    // Logs de IA 24h
    sb.from('api_logs').select('status, custo_usd, criado_em').gte('criado_em', ha24h),
    // Certificados vencidos / vencendo
    sb.from('empresas').select('razao_social, cert_digital_validade').not('cert_digital_validade', 'is', null),
    // Divergência de créditos
    sb.from('empresas').select('razao_social, creditos_incluidos, creditos_restantes').gt('creditos_incluidos', 0),
    // Empresas sem responsável (usuarios)
    sb.from('empresas').select('id, razao_social').neq('plano', 'cancelado'),
  ])

  const val = (r) => (r.status === 'fulfilled' ? r.value : null)

  // ─── 3. BANCO DE DADOS ─────────────────────────────────────────
  const dbChecks = []
  if (empResult.status === 'fulfilled' && !empResult.value.error) {
    dbChecks.push(check('Conectividade Supabase', 'ok', `Conectado · ${empResult.value.count ?? 0} empresa(s)`))
  } else {
    dbChecks.push(check('Conectividade Supabase', 'erro', empResult.status === 'fulfilled' ? (empResult.value.error?.message || 'Erro') : 'Falha de conexão'))
  }
  // Verifica tabelas-chave acessíveis
  const tabelas = ['funcionarios', 'asos', 'ltcats', 'transmissoes', 'api_logs', 'usuario_empresas']
  const tabResults = await Promise.allSettled(
    tabelas.map(t => sb.from(t).select('*', { count: 'exact', head: true }))
  )
  const tabFalhas = tabResults
    .map((r, i) => ({ t: tabelas[i], ok: r.status === 'fulfilled' && !r.value.error }))
    .filter(x => !x.ok)
  dbChecks.push(check('Tabelas-chave acessíveis', tabFalhas.length === 0 ? 'ok' : 'erro',
    tabFalhas.length === 0 ? `${tabelas.length} tabelas OK` : `Falha em: ${tabFalhas.map(x => x.t).join(', ')}`))
  addCat('Banco de dados', dbChecks)

  // ─── 4. TRANSMISSÃO ────────────────────────────────────────────
  const txChecks = []
  const gov = val(pingGov)
  if (gov) {
    txChecks.push(check('Webservice eSocial Gov.br', gov.acessivel ? 'ok' : 'aviso',
      gov.acessivel ? `Acessível · ${gov.latencia}ms (HTTP ${gov.status})` : `HTTP ${gov.status} ao HEAD — o webservice espera POST SOAP; transmissão real usa mTLS`))
  } else {
    // O endpoint do eSocial costuma ignorar HEAD; um timeout aqui NÃO confirma
    // indisponibilidade da transmissão real (que é POST SOAP com mTLS).
    txChecks.push(check('Webservice eSocial Gov.br', 'aviso', 'Sem resposta ao HEAD em 10s — não responde a HEAD; não indica necessariamente que a transmissão (POST mTLS) está fora'))
  }
  const stuckCount = transStuck.status === 'fulfilled' ? (transStuck.value.count ?? 0) : null
  txChecks.push(check('Transmissões presas', stuckCount === 0 ? 'ok' : stuckCount == null ? 'aviso' : 'aviso',
    stuckCount == null ? 'Não foi possível verificar' : stuckCount === 0 ? 'Nenhuma pendente há mais de 2h' : `${stuckCount} pendente(s) há mais de 2h — verifique a aba Sistema`))
  const rejCount = transRej.status === 'fulfilled' ? (transRej.value.count ?? 0) : null
  const t7 = val(trans7d) || []
  const enviados7 = Array.isArray(t7) ? t7.filter(t => t.status === 'enviado' || t.status === 'lote').length : 0
  const total7 = Array.isArray(t7) ? t7.length : 0
  const taxa = total7 > 0 ? Math.round((enviados7 / total7) * 100) : null
  txChecks.push(check('Taxa de sucesso (7 dias)', taxa == null ? 'info' : taxa >= 80 ? 'ok' : taxa >= 50 ? 'aviso' : 'erro',
    taxa == null ? 'Sem transmissões nos últimos 7 dias' : `${taxa}% · ${enviados7}/${total7} enviados · ${rejCount ?? 0} rejeitado(s)`))
  addCat('Transmissão', txChecks)

  // ─── 5. INTELIGÊNCIA ARTIFICIAL ────────────────────────────────
  const iaChecks = []
  const logs = val(logs24h) || []
  if (Array.isArray(logs) && logs.length > 0) {
    const ok = logs.filter(l => l.status === 'ok').length
    const fb = logs.filter(l => l.status === 'fallback').length
    const err = logs.filter(l => l.status === 'erro' || l.status === 'timeout').length
    const taxaIa = Math.round((ok / logs.length) * 100)
    iaChecks.push(check('Taxa de sucesso da IA (24h)', taxaIa >= 80 ? 'ok' : taxaIa >= 50 ? 'aviso' : 'erro',
      `${taxaIa}% · ${ok} OK · ${fb} fallback · ${err} erro de ${logs.length} chamadas`))
    const custo = logs.reduce((s, l) => s + (l.custo_usd || 0), 0)
    iaChecks.push(check('Custo de IA (24h)', 'info', `$${custo.toFixed(4)}`))
  } else {
    iaChecks.push(check('Atividade de IA (24h)', 'info', envConfigurada('INTERNAL_API_SECRET') ? 'Nenhuma leitura registrada nas últimas 24h' : 'Log desativado (configure INTERNAL_API_SECRET)'))
  }
  addCat('Inteligência Artificial', iaChecks)

  // ─── 6. CERTIFICADOS DIGITAIS ──────────────────────────────────
  const certChecks = []
  const certs = val(certVenc) || []
  if (Array.isArray(certs)) {
    const vencidos = certs.filter(c => c.cert_digital_validade && c.cert_digital_validade < hojeStr)
    const vencendo = certs.filter(c => c.cert_digital_validade && c.cert_digital_validade >= hojeStr && c.cert_digital_validade <= em30Str)
    certChecks.push(check('Certificados vencidos', vencidos.length === 0 ? 'ok' : 'erro',
      vencidos.length === 0 ? 'Nenhum certificado vencido' : `${vencidos.length}: ${vencidos.slice(0, 3).map(c => c.razao_social).join(', ')}${vencidos.length > 3 ? '…' : ''}`))
    certChecks.push(check('Certificados vencendo (30 dias)', vencendo.length === 0 ? 'ok' : 'aviso',
      vencendo.length === 0 ? 'Nenhum vencimento próximo' : `${vencendo.length}: ${vencendo.slice(0, 3).map(c => c.razao_social).join(', ')}${vencendo.length > 3 ? '…' : ''}`))
  }
  addCat('Certificados digitais', certChecks)

  // ─── 7. DADOS & NEGÓCIO ────────────────────────────────────────
  const negChecks = []
  const div = val(divergencias) || []
  if (Array.isArray(div)) {
    const comDiv = div.filter(e => (e.creditos_restantes ?? 0) > (e.creditos_incluidos ?? 0))
    negChecks.push(check('Créditos consistentes', comDiv.length === 0 ? 'ok' : 'aviso',
      comDiv.length === 0 ? 'Nenhuma empresa com créditos acima do incluído' : `${comDiv.length} empresa(s) com créditos restantes > incluídos`))
  }
  // Empresas ativas sem responsável vinculado
  const ativas = val(semResp) || []
  if (Array.isArray(ativas) && ativas.length > 0) {
    const ids = ativas.map(e => e.id)
    const { data: usuariosDir } = await sb.from('usuarios').select('empresa_id').in('empresa_id', ids)
    const { data: vinc } = await sb.from('usuario_empresas').select('empresa_id').in('empresa_id', ids)
    const comResp = new Set([...(usuariosDir || []).map(u => u.empresa_id), ...(vinc || []).map(v => v.empresa_id)])
    const semRespList = ativas.filter(e => !comResp.has(e.id))
    negChecks.push(check('Empresas com responsável', semRespList.length === 0 ? 'ok' : 'aviso',
      semRespList.length === 0 ? 'Todas as empresas ativas têm responsável' : `${semRespList.length} sem usuário vinculado: ${semRespList.slice(0, 3).map(e => e.razao_social).join(', ')}${semRespList.length > 3 ? '…' : ''}`))
  }
  addCat('Dados & Negócio', negChecks)

  // ─── RESUMO ────────────────────────────────────────────────────
  let ok = 0, aviso = 0, erro = 0
  for (const checks of Object.values(categorias)) {
    for (const c of checks) {
      if (c.status === 'ok') ok++
      else if (c.status === 'aviso') aviso++
      else if (c.status === 'erro') erro++
    }
  }
  const saude = erro > 0 ? 'critico' : aviso > 0 ? 'atencao' : 'saudavel'

  return res.status(200).json({
    gerado_em: agora.toISOString(),
    resumo: { ok, aviso, erro, saude },
    categorias,
  })
}
