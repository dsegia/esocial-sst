// pages/api/ler-certificado.js
// Lê metadados do .pfx sem armazenar chave privada

import forge from 'node-forge'
import { checkRateLimit, getClientIP } from '../../lib/rate-limit'
import { requireAuth } from '../../lib/auth-middleware'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const user = await requireAuth(req, res)
  if (!user) return

  const ip = getClientIP(req)
  const { limited, retryAfter } = await checkRateLimit(ip, { windowMs: 60_000, max: 10 })
  if (limited) return res.status(429).json({ erro: 'Muitas requisições. Tente novamente em breve.', retryAfter })

  const { pfx, senha } = req.body
  if (!pfx || !senha) return res.status(400).json({ erro: 'Arquivo e senha obrigatórios' })

  try {
    const pfxBuf = Buffer.from(pfx, 'base64')
    const pfxDer = forge.util.createBuffer(pfxBuf.toString('binary'))
    const pfxAsn1 = forge.asn1.fromDer(pfxDer)

    let p12
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, senha)
    } catch {
      return res.status(400).json({ erro: 'Senha incorreta ou arquivo inválido.' })
    }

    const bags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const certBags = bags[forge.pki.oids.certBag]
    if (!certBags?.length) return res.status(400).json({ erro: 'Nenhum certificado encontrado.' })

    const cert = certBags[0].cert
    const getAttr = (shortName) => cert.subject.attributes.find(a => a.shortName === shortName)?.value || null

    const validade = cert.validity.notAfter
    const diasRestantes = Math.round((validade - new Date()) / 86400000)

    // Extrair CNPJ/CPF do CN (formato: NOME:CNPJ, NOME:CPF, ou apenas o número)
    const cn = getAttr('CN') || ''
    const cnpjMatch = cn.match(/\d{14}/) || cn.replace(/\D/g,'').match(/\d{14}/)
    const cpfMatch  = !cnpjMatch && (cn.match(/\d{11}/) || cn.replace(/\D/g,'').match(/\d{11}/))
    const cnpj = cnpjMatch ? cnpjMatch[0] : null

    // Detectar tipo: e-CNPJ (pessoa jurídica) vs e-CPF (pessoa física)
    // e-CNPJ tem OID 2.16.76.1.3.3 (CNPJ) no Subject; e-CPF tem OID 2.16.76.1.3.1 (CPF)
    // Fallback: detectar pelo comprimento do documento extraído
    const tipoCert = cnpjMatch ? 'e-CNPJ' : cpfMatch ? 'e-CPF' : 'desconhecido'
    const avisoEcpf = tipoCert === 'e-CPF'
      ? 'Este certificado é e-CPF (pessoa física). Para transmitir ao eSocial é necessário e-CNPJ (pessoa jurídica) correspondente ao CNPJ da empresa.'
      : null

    return res.status(200).json({
      sucesso: true,
      info: {
        titular: getAttr('CN') || getAttr('O') || 'Não identificado',
        cnpj,
        organizacao: getAttr('O'),
        validade: validade.toISOString().split('T')[0],
        dias_restantes: diasRestantes,
        tipo: 'A1',
        tipo_certificado: tipoCert,
        aviso: avisoEcpf,
        emissor: cert.issuer.attributes.find(a => a.shortName === 'O')?.value || 'AC ICP-Brasil',
        vencido: diasRestantes < 0,
      }
    })
  } catch (err) {
    console.error('[ler-certificado]', err)
    return res.status(500).json({ erro: 'Erro ao processar certificado. Verifique se o arquivo e a senha estão corretos.' })
  }
}
