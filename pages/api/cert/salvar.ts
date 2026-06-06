import type { NextApiRequest, NextApiResponse } from 'next'
import forge from 'node-forge'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../../lib/auth-middleware'
import { checkRateLimit, getClientIP } from '../../../lib/rate-limit'
import { encryptSenha } from '../../../lib/cert-crypto'
import { uploadCertR2 } from '../../../lib/cert-store'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const user = await requireAuth(req, res)
  if (!user) return

  const ip = getClientIP(req)
  const { limited, retryAfter } = await checkRateLimit(ip, { windowMs: 60_000, max: 5 })
  if (limited) return res.status(429).json({ erro: 'Muitas requisições.', retryAfter })

  const { pfx: pfxBase64, senha, empresa_id: empresaIdBody } = req.body

  if (!pfxBase64 || !senha) return res.status(400).json({ erro: 'Arquivo e senha obrigatórios' })

  // Resolve empresa do usuário
  const { data: usuarioDb } = await sbAdmin
    .from('usuarios').select('empresa_id').eq('id', user.id).single()
  let empresaId: string = usuarioDb?.empresa_id || user.user_metadata?.empresa_id

  if (empresaIdBody && empresaIdBody !== empresaId) {
    const { data: vinculo } = await sbAdmin
      .from('usuario_empresas').select('empresa_id')
      .eq('usuario_id', user.id).eq('empresa_id', empresaIdBody).single()
    if (vinculo) empresaId = empresaIdBody
  }

  if (!empresaId) return res.status(403).json({ erro: 'Empresa não encontrada' })

  try {
    // Validar certificado
    const pfxBuffer = Buffer.from(pfxBase64, 'base64')
    const pfxDer = forge.util.createBuffer(pfxBuffer.toString('binary'))
    let p12: forge.pkcs12.Pkcs12Pfx
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(pfxDer), false, senha)
    } catch {
      return res.status(400).json({ erro: 'Senha incorreta ou arquivo inválido.' })
    }

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const certBag = certBags[forge.pki.oids.certBag]?.[0]
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]

    if (!certBag?.cert || !keyBag?.key) {
      return res.status(400).json({ erro: 'Certificado ou chave privada não encontrados.' })
    }

    const cert = certBag.cert
    const agora = new Date()
    if (agora > cert.validity.notAfter) {
      return res.status(400).json({ erro: `Certificado vencido em ${cert.validity.notAfter.toLocaleDateString('pt-BR')}. Renove o certificado.` })
    }

    const cn = String(cert.subject.attributes.find((a: any) => a.shortName === 'CN')?.value || '')
    const cnpjMatch = cn.match(/\d{14}/)
    const cpfMatch = !cnpjMatch && cn.replace(/\D/g, '').match(/\d{11}/)
    if (!cnpjMatch && cpfMatch) {
      return res.status(400).json({ erro: 'Certificado e-CPF não é aceito. É necessário e-CNPJ correspondente ao CNPJ da empresa.' })
    }

    const titular = cn || String(cert.subject.attributes.find((a: any) => a.shortName === 'O')?.value || 'Não identificado')
    const validade = cert.validity.notAfter.toISOString().split('T')[0]

    // Upload do PFX no R2
    const pfxPath = await uploadCertR2(empresaId, pfxBuffer)

    // Criptografar senha
    const senhaCriptografada = encryptSenha(senha)

    // Salvar no banco
    const { error } = await sbAdmin.from('empresas').update({
      cert_pfx_path: pfxPath,
      cert_senha_enc: senhaCriptografada,
      cert_tipo: 'A1',
      cert_titular: titular,
      cert_digital_validade: validade,
      cert_configurado_em: new Date().toISOString(),
    }).eq('id', empresaId)

    if (error) throw error

    // Zerar referências à chave privada
    if (keyBag) (keyBag as any).key = null

    return res.status(200).json({
      sucesso: true,
      info: { titular, validade, tipo: 'A1', tipo_certificado: 'e-CNPJ' },
    })
  } catch (err: any) {
    console.error('[cert/salvar]', err)
    return res.status(500).json({ erro: 'Erro ao salvar certificado: ' + (err.message || 'erro interno') })
  }
}
