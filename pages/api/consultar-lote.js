// pages/api/consultar-lote.js
// Consulta resultado de um lote transmitido ao Gov.br pelo número de recibo (nrRec)
// Requer mTLS com o certificado A1 da empresa

import https from 'node:https'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP } from '../../lib/rate-limit'
import { requireAuth } from '../../lib/auth-middleware'

const ENDPOINTS = {
  producao: 'https://webservices.esocial.gov.br/servicos/empregador/consultaLoteEventos/consultarLoteEventos/v1_1_0/index.php',
}

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function postSoap(url, headers, body, pfxBuffer, passphrase) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const user = await requireAuth(req, res)
  if (!user) return

  const ip = getClientIP(req)
  const { limited, retryAfter } = checkRateLimit(ip, { windowMs: 60_000, max: 10 })
  if (limited) return res.status(429).json({ erro: 'Muitas requisições.', retryAfter })

  const { nrRec, cnpj_empregador, ambiente = 'producao', pfx: pfxBase64, cert_senha, transmissao_id } = req.body

  if (!nrRec || !cnpj_empregador) {
    return res.status(400).json({ erro: 'nrRec e cnpj_empregador são obrigatórios' })
  }

  const endpoint = ENDPOINTS[ambiente]
  if (!endpoint) return res.status(400).json({ erro: 'Ambiente inválido' })

  const cnpjLimpo = cnpj_empregador.replace(/\D/g, '')

  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:v1="http://www.esocial.gov.br/servicos/empregador/consultaLoteEventos/consultarLoteEventos/v1_1_0">
  <soapenv:Header/>
  <soapenv:Body>
    <v1:ConsultarLoteEventosRequest>
      <consulta>
        <eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/consulta/retornoProcessamento/v1_3_2">
          <consultaLoteEventos>
            <ideEmpregador>
              <tpInsc>1</tpInsc>
              <nrInsc>${cnpjLimpo.substring(0, 8)}</nrInsc>
            </ideEmpregador>
            <consulta>
              <nrRec>${nrRec}</nrRec>
            </consulta>
          </consultaLoteEventos>
        </eSocial>
      </consulta>
    </v1:ConsultarLoteEventosRequest>
  </soapenv:Body>
</soapenv:Envelope>`

  try {
    const pfxBuffer = pfxBase64 ? Buffer.from(pfxBase64, 'base64') : null
    const soapHeaders = {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction': '"consultarLoteEventos"',
      'Content-Length': Buffer.byteLength(soapEnvelope, 'utf8'),
    }

    const response = await postSoap(endpoint, soapHeaders, soapEnvelope, pfxBuffer, cert_senha)
    const resBody = response.body

    // Parseia resposta
    const cdRespLote  = resBody.match(/<cdResposta>([^<]+)<\/cdResposta>/)?.[1]
    const descResp    = resBody.match(/<descResposta>([^<]+)<\/descResposta>/)?.[1]
    const situacao    = resBody.match(/<situacao>([^<]+)<\/situacao>/)?.[1] // 1=Aguardando, 2=Processado, 3=Erro

    // Eventos processados dentro do lote
    const eventos = []
    const eventoRegex = /<evento\b[^>]*>([\s\S]*?)<\/evento>/g
    let match
    while ((match = eventoRegex.exec(resBody)) !== null) {
      const bloco = match[1]
      const nrRecEvt   = bloco.match(/<nrRec>([^<]+)<\/nrRec>/)?.[1]
      const cdResp      = bloco.match(/<cdResp>([^<]+)<\/cdResp>/)?.[1]
      const descEvt     = bloco.match(/<descResp>([^<]+)<\/descResp>/)?.[1]
      const ocorrencias = [...bloco.matchAll(/<dsMsg>([^<]+)<\/dsMsg>/g)].map(m => m[1])
      eventos.push({ nrRec: nrRecEvt, cdResp, descResp: descEvt, ocorrencias })
    }

    const processado = situacao === '2' || (cdRespLote && parseInt(cdRespLote) === 201)
    const aguardando = situacao === '1' || cdRespLote === '101'
    const erro       = !processado && !aguardando

    // Atualiza status da transmissão no banco se transmissao_id fornecido
    if (transmissao_id && processado) {
      const sucesso = eventos.every(e => parseInt(e.cdResp) === 201 || parseInt(e.cdResp) === 202)
      await sbAdmin.from('transmissoes').update({
        status: sucesso ? 'enviado' : 'rejeitado',
        resposta_govbr: resBody.substring(0, 2000),
        erro_codigo: sucesso ? null : cdRespLote,
        erro_descricao: sucesso ? null : (descResp || eventos[0]?.descResp),
      }).eq('id', transmissao_id)
    }

    return res.status(200).json({
      sucesso: true,
      situacao: aguardando ? 'aguardando' : processado ? 'processado' : 'erro',
      cdResposta: cdRespLote,
      descResposta: descResp,
      eventos,
      raw: resBody.substring(0, 1000),
    })

  } catch (err) {
    if (err.name === 'TimeoutError') {
      return res.status(504).json({ erro: 'Timeout ao consultar Gov.br. Tente novamente.' })
    }
    console.error('[consultar-lote]', err)
    return res.status(500).json({ erro: 'Erro ao consultar lote: ' + err.message })
  }
}
