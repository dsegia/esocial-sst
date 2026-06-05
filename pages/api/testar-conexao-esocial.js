// pages/api/testar-conexao-esocial.js
// Testa conectividade com o webservice eSocial Gov.br usando mTLS real com o certificado do cliente

import https from 'node:https'
import { checkRateLimit, getClientIP } from '../../lib/rate-limit'
import { requireAuth } from '../../lib/auth-middleware'

const ENDPOINT = 'https://webservices.esocial.gov.br/servicos/empregador/envioLoteEventos/enviarLoteEventos/v1_1_0/index.php'

const SOAP_MINIMO = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:v1="http://www.esocial.gov.br/servicos/empregador/envioLoteEventos/enviarLoteEventos/v1_1_0">
  <soapenv:Header/>
  <soapenv:Body>
    <v1:EnviarLoteEventosRequest>
      <loteEventos>
        <eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1">
          <envioLoteEventos grupo="1">
            <ideEmpregador><tpInsc>1</tpInsc><nrInsc>00000000000000</nrInsc></ideEmpregador>
            <ideTransmissor><tpInsc>1</tpInsc><nrInsc>00000000000000</nrInsc></ideTransmissor>
            <eventos/>
          </envioLoteEventos>
        </eSocial>
      </loteEventos>
    </v1:EnviarLoteEventosRequest>
  </soapenv:Body>
</soapenv:Envelope>`

function postComCert(pfxBuffer, passphrase) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT)
    const body = Buffer.from(SOAP_MINIMO, 'utf-8')
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': '"enviarLoteEventos"',
        'Content-Length': body.length,
      },
      pfx: pfxBuffer,
      passphrase,
      rejectUnauthorized: true,
    }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.setTimeout(15000, () => req.destroy(Object.assign(new Error('TimeoutError'), { name: 'TimeoutError' })))
    req.write(body)
    req.end()
  })
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' })
  }

  const user = await requireAuth(req, res)
  if (!user) return

  const ip = getClientIP(req)
  const { limited, retryAfter } = await checkRateLimit(ip, { windowMs: 60_000, max: 5 })
  if (limited) return res.status(429).json({ erro: 'Muitas requisições.', retryAfter })

  const { pfx: pfxBase64, cert_senha } = req.body || {}

  if (!pfxBase64 || !cert_senha) {
    return res.status(200).json({
      conectado: false,
      erro: 'Carregue e valide o certificado digital antes de testar a conexão.',
    })
  }

  const inicio = Date.now()

  try {
    const pfxBuffer = Buffer.from(pfxBase64, 'base64')
    const { status, body } = await postComCert(pfxBuffer, cert_senha)
    const latencia = Date.now() - inicio

    const cdResp    = body.match(/<cdResp>([^<]+)<\/cdResp>/)?.[1]
    const descResp  = body.match(/<descResp>([^<]+)<\/descResp>/)?.[1]
    const fault     = body.match(/<faultstring>([^<]+)<\/faultstring>/)?.[1]

    return res.status(200).json({
      conectado: true,
      latencia_ms: latencia,
      http_status: status,
      codigo: cdResp || null,
      descricao: descResp || fault || 'Webservice respondeu',
    })
  } catch (err) {
    const latencia = Date.now() - inicio
    const msg = err.message || ''

    if (err.name === 'TimeoutError') {
      return res.status(200).json({ conectado: false, latencia_ms: latencia, erro: 'Timeout: Gov.br não respondeu em 15s' })
    }
    if (/mac verify failure|bad decrypt|invalid password|wrong password/i.test(msg)) {
      return res.status(200).json({ conectado: false, latencia_ms: latencia, erro: 'Senha do certificado incorreta.' })
    }
    if (/certificate expired|cert.*expir/i.test(msg)) {
      return res.status(200).json({ conectado: false, latencia_ms: latencia, erro: 'Certificado digital vencido. Renove o e-CNPJ.' })
    }

    return res.status(200).json({
      conectado: false, latencia_ms: latencia,
      erro: `Erro na conexão: ${msg.substring(0, 120)}`,
    })
  }
}
