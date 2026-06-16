import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '../../../lib/auth-middleware'
import { masterCertConfigurado } from '../../../lib/master-cert'

// Informa ao frontend se o certificado mestre do procurador (SaaS) está
// configurado no servidor — usado para avisar quando a procuração está ativa
// mas a transmissão via procuração ainda não pode funcionar.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth(req, res)
  if (!user) return
  return res.status(200).json({ configurado: masterCertConfigurado() })
}
