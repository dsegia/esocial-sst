// pages/api/transmitir-esocial.js
// Transmite eventos assinados ao webservice SOAP do eSocial

import https from 'node:https'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP } from '../../lib/rate-limit'
import { requireAuth } from '../../lib/auth-middleware'
import { decryptSenha } from '../../lib/cert-crypto'
import { downloadCertR2 } from '../../lib/cert-store'
import { getMasterCert } from '../../lib/master-cert'

// Envia SOAP com mTLS (certificado A1 do cliente)
function postSoap(url, headers, body, pfxBuffer, passphrase) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      port: 443,
      method: 'POST',
      headers,
      rejectUnauthorized: true,
    }
    if (pfxBuffer && passphrase) {
      options.pfx = pfxBuffer
      options.passphrase = passphrase
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.setTimeout(30000, () => req.destroy(Object.assign(new Error('TimeoutError'), { name: 'TimeoutError' })))
    req.write(body)
    req.end()
  })
}

const ENDPOINTS = {
  producao: 'https://webservices.esocial.gov.br/servicos/empregador/envioLoteEventos/enviarLoteEventos/v1_1_0/index.php',
}

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function enviarConfirmacaoTransmissao(sb, userId, empresaId, recibo, ambiente) {
  if (!process.env.RESEND_API_KEY) return

  const { data: usuario } = await sb.from('usuarios').select('nome').eq('id', userId).maybeSingle()
  const { data: authUser } = await sb.auth.admin.getUserById(userId)
  const email = authUser?.user?.email
  if (!email) return

  const { data: empresa } = await sb.from('empresas').select('razao_social').eq('id', empresaId).maybeSingle()

  const nome = (usuario?.nome || '').split(' ')[0] || 'Olá'
  const razao = empresa?.razao_social || 'sua empresa'
  const ambienteLabel = ambiente === 'producao' ? 'Produção' : 'Homologação'

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'eSocial SST <noreply@esocialsst.com.br>',
      to: email,
      subject: `[eSocial SST] Transmissão enviada — Recibo ${recibo}`,
      html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;margin:0 auto;color:#111">
  <div style="background:#185FA5;padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px;font-weight:700">Transmissão enviada com sucesso</h2>
    <p style="color:#b3d4f0;margin:4px 0 0;font-size:13px">${razao}</p>
  </div>
  <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p style="margin:0 0 16px;font-size:14px">Olá, <strong>${nome}</strong>!</p>
    <p style="margin:0 0 16px;font-size:13px;color:#374151">Seu evento eSocial foi enviado ao Gov.br com sucesso.</p>
    <div style="background:#EAF3DE;border-radius:8px;padding:16px;margin-bottom:20px">
      <div style="font-size:11px;color:#6b7280;margin-bottom:4px">Número do Recibo</div>
      <div style="font-size:18px;font-weight:700;color:#27500A;letter-spacing:0.5px">${recibo}</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:6px">Ambiente: ${ambienteLabel} · ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/historico"
      style="display:inline-block;padding:11px 22px;background:#185FA5;color:#fff;border-radius:7px;text-decoration:none;font-weight:500;font-size:13px">
      Ver histórico de transmissões →
    </a>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
    <p style="font-size:11px;color:#9ca3af;margin:0">eSocial SST Transmissor · Guarde o número do recibo para seus registros.</p>
  </div>
</div>`,
    }),
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const user = await requireAuth(req, res)
  if (!user) return

  const ip = getClientIP(req)
  const { limited, retryAfter } = await checkRateLimit(ip, { windowMs: 60_000, max: 10 })
  if (limited) return res.status(429).json({ erro: 'Muitas requisições. Tente novamente em breve.', retryAfter })

  // Rate limit adicional por usuário (5 transmissões/minuto)
  const { limited: limitedUser, retryAfter: retryUser } = await checkRateLimit(`tx:${user.id}`, { windowMs: 60_000, max: 5 })
  if (limitedUser) return res.status(429).json({ erro: 'Limite de transmissões por minuto atingido. Aguarde alguns segundos.', retryAfter: retryUser })

  // Resolve empresa_id — prioriza empresa_id enviado no body (seleção do UI)
  // Fallback para empresa padrão do usuário
  const { empresa_id: empresaIdBody } = req.body || {}

  const { data: usuarioDb } = await sbAdmin
    .from('usuarios').select('empresa_id').eq('id', user.id).single()
  const empresaIdPadrao = usuarioDb?.empresa_id || user.user_metadata?.empresa_id

  // Se empresaIdBody foi enviado, valida que o usuário tem acesso a ela
  let empresaId = empresaIdPadrao
  if (empresaIdBody && empresaIdBody !== empresaIdPadrao) {
    const { data: vinculo } = await sbAdmin
      .from('usuario_empresas').select('empresa_id')
      .eq('usuario_id', user.id).eq('empresa_id', empresaIdBody).single()
    if (vinculo) empresaId = empresaIdBody
  }

  if (!empresaId) return res.status(403).json({ erro: 'Empresa não encontrada para este usuário' })

  // Verifica e consome crédito de envio
  const { data: empresa } = await sbAdmin
    .from('empresas')
    .select('id, cnpj, plano, creditos_restantes, stripe_customer_id, tipo_acesso, ecac_cnpj_procurador, cert_pfx_path, cert_senha_enc')
    .eq('id', empresaId).single()

  if (!empresa) return res.status(403).json({ erro: 'Empresa não encontrada' })

  if (empresa.plano === 'cancelado') {
    return res.status(403).json({ erro: 'Assinatura cancelada. Acesse /planos para reativar.', sem_creditos: true })
  }

  if (empresa.creditos_restantes > 0) {
    // Dedução atômica — evita race condition com requisições simultâneas
    const { data: deduziu } = await sbAdmin.rpc('consumir_credito', { p_empresa_id: empresaId })
    if (!deduziu) {
      return res.status(402).json({
        erro: 'Créditos de envio esgotados. Acesse Planos para adquirir um plano com mais envios.',
        sem_creditos: true,
      })
    }
  } else if (empresa.stripe_customer_id && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_METER_ENVIOS) {
    // Créditos esgotados — registra evento no meter do Stripe (cobrado no fechamento do ciclo)
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
      await stripe.billing.meterEvents.create({
        event_name: 'esocial_envio',
        payload: {
          value: '1',
          stripe_customer_id: empresa.stripe_customer_id,
        },
      })
    } catch (err) {
      console.error('[transmitir] erro ao registrar uso metered:', err?.message)
      return res.status(500).json({ erro: 'Erro ao registrar envio excedente. Tente novamente.' })
    }
  } else if (empresa.plano !== 'trial' && empresa.plano !== 'enterprise') {
    return res.status(402).json({
      erro: 'Créditos de envio esgotados. Acesse Planos para adquirir um plano com mais envios.',
      sem_creditos: true,
    })
  }

  const { xml_assinado, cnpj_empregador, ambiente = 'producao', transmissao_id: _transmissao_id, pfx: pfxBase64, cert_senha } = req.body

  if (!xml_assinado || !cnpj_empregador) {
    return res.status(400).json({ erro: 'XML assinado e CNPJ são obrigatórios' })
  }

  // Valida que xml_assinado é um XML eSocial legítimo — deve começar com
  // a declaração XML ou com a tag <eSocial e conter a assinatura digital.
  // Rejeita qualquer conteúdo que tente escapar do elemento <evento>.
  const xmlTrimmed = xml_assinado.trim()

  // Validação estrutural com parser real (mais seguro que regex)
  try {
    const { DOMParser } = require('@xmldom/xmldom')
    const doc = new DOMParser({
      errorHandler: { error: () => { throw new Error('parse error') }, fatalError: () => { throw new Error('parse error') } },
    }).parseFromString(xmlTrimmed, 'text/xml')
    const root = doc.documentElement?.tagName
    if (!root || !root.includes('eSocial')) {
      return res.status(400).json({ erro: 'XML inválido: elemento raiz deve ser eSocial.' })
    }
  } catch {
    return res.status(400).json({ erro: 'XML malformado.' })
  }

  // Bloqueia XXE e conteúdo claramente fora do escopo eSocial
  const FORBIDDEN = [
    /<!DOCTYPE/i, /<!ENTITY/i,
    /SYSTEM\s*["']/i, /PUBLIC\s*["']/i,
    /\bfile:\/\//i,
    /<soapenv:/i, /<soap:/i,
  ]
  if (FORBIDDEN.some(re => re.test(xmlTrimmed))) {
    return res.status(400).json({ erro: 'XML inválido.' })
  }
  // Tamanho máximo: 512 KB — previne ataques de payload gigante (Billion Laughs)
  if (Buffer.byteLength(xmlTrimmed, 'utf8') > 512 * 1024) {
    return res.status(400).json({ erro: 'XML excede o tamanho máximo permitido.' })
  }

  const endpoint = ENDPOINTS[ambiente]
  if (!endpoint) return res.status(400).json({ erro: 'Ambiente inválido' })

  try {
    // Resolver certificado e CNPJ do transmissor. Três caminhos:
    //  1. pfx no body (override manual da sessão)  → transmissor = próprio empregador
    //  2. cert próprio armazenado da empresa (R2)  → transmissor = próprio empregador
    //  3. procuração eCAC (sem cert próprio)        → cert mestre do SaaS; transmissor = SaaS (procurador)
    let pfxBuffer = pfxBase64 ? Buffer.from(pfxBase64, 'base64') : null
    let certSenhaResolvida = cert_senha || null
    let cnpjTransmissor = cnpj_empregador.replace(/\D/g, '')

    if (!pfxBuffer) {
      if (empresa.cert_pfx_path && empresa.cert_senha_enc) {
        pfxBuffer = await downloadCertR2(empresa.cert_pfx_path)
        certSenhaResolvida = decryptSenha(empresa.cert_senha_enc)
      } else if (empresa.ecac_cnpj_procurador) {
        const master = getMasterCert()
        if (!master) {
          return res.status(503).json({ erro: 'Transmissão via procuração indisponível: certificado do procurador não está configurado no sistema. Contate o suporte.' })
        }
        pfxBuffer = master.pfxBuffer
        certSenhaResolvida = master.senha
        cnpjTransmissor = master.cnpj
      }
    }

    if (!pfxBuffer || !certSenhaResolvida) {
      return res.status(400).json({ erro: 'Nenhum certificado digital ou procuração eCAC configurado. Acesse Configurações para habilitar a transmissão.' })
    }

    const _nrLote = Date.now().toString()
    const dataHoraTransmissao = new Date().toISOString()

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:v1="http://www.esocial.gov.br/servicos/empregador/envioLoteEventos/enviarLoteEventos/v1_1_0">
  <soapenv:Header/>
  <soapenv:Body>
    <v1:EnviarLoteEventosRequest>
      <loteEventos>
        <eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1">
          <envioLoteEventos grupo="1">
            <ideEmpregador>
              <tpInsc>1</tpInsc>
              <nrInsc>${cnpj_empregador.replace(/\D/g,'').substring(0,8)}</nrInsc>
            </ideEmpregador>
            <ideTransmissor>
              <tpInsc>1</tpInsc>
              <nrInsc>${cnpjTransmissor}</nrInsc>
            </ideTransmissor>
            <eventos>
              <evento Id="ev1">
                ${xml_assinado}
              </evento>
            </eventos>
          </envioLoteEventos>
        </eSocial>
      </loteEventos>
    </v1:EnviarLoteEventosRequest>
  </soapenv:Body>
</soapenv:Envelope>`

    const soapHeaders = {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction': '"enviarLoteEventos"',
      'Content-Length': Buffer.byteLength(soapEnvelope, 'utf8'),
    }

    const response = await postSoap(endpoint, soapHeaders, soapEnvelope, pfxBuffer, certSenhaResolvida)
    const resBody = response.body

    const recibo    = resBody.match(/<nrRec>([^<]+)<\/nrRec>/)?.[1]
    const cdResp    = resBody.match(/<cdResp>([^<]+)<\/cdResp>/)?.[1]
    const descResp  = resBody.match(/<descResp>([^<]+)<\/descResp>/)?.[1]
    const ocorrencias = [...resBody.matchAll(/<dsMsg>([^<]+)<\/dsMsg>/g)].map(m => m[1])

    if (recibo) {
      // Envia email de confirmação em background (sem bloquear resposta)
      enviarConfirmacaoTransmissao(sbAdmin, user.id, empresaId, recibo, ambiente).catch(err => {
        console.error('[transmitir] falha ao enviar e-mail de confirmação:', err?.message || err)
      })

      return res.status(200).json({
        sucesso: true,
        recibo,
        codigo: cdResp,
        descricao: descResp,
        ambiente,
        data_envio: dataHoraTransmissao,
      })
    }

    if (cdResp && parseInt(cdResp) > 0) {
      return res.status(422).json({
        sucesso: false,
        codigo: cdResp,
        descricao: descResp,
        ocorrencias,
        xml_resposta: resBody.substring(0, 1000),
      })
    }

    return res.status(500).json({
      sucesso: false,
      erro: 'Resposta inesperada do Gov.br',
      raw: resBody.substring(0, 500),
    })

  } catch (err) {
    if (err.name === 'TimeoutError' || err.message === 'TimeoutError') {
      return res.status(504).json({ erro: 'Timeout: webservice do Gov.br não respondeu em 30s. Tente novamente.' })
    }
    console.error('[transmitir-esocial]', err)
    return res.status(500).json({ erro: 'Erro na transmissão. Verifique o certificado e tente novamente.' })
  }
}
