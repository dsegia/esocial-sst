// Auth middleware — validates JWT and checks empresa-level access (RBAC)
// Roles: 'admin' | 'operador' | 'visualizador'

import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

export async function getAuthUser(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return { user: null as null, error: 'Não autenticado' as string }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return { user: null as null, error: 'Sessão inválida' as string }

  return { user, error: null as null }
}

export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const { user, error } = await getAuthUser(req)
  if (!user) {
    res.status(401).json({ erro: error })
    return null
  }
  return user
}

// Verifica se o usuário autenticado tem acesso à empresa com o perfil mínimo exigido
export async function requireEmpresaAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  empresaId: string,
  perfisPermitidos: string[] = ['admin', 'operador']
) {
  const { user, error } = await getAuthUser(req)
  if (!user) {
    res.status(401).json({ erro: error })
    return null
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: acesso } = await sb
    .from('usuario_empresas')
    .select('perfil')
    .eq('usuario_id', user.id)
    .eq('empresa_id', empresaId)
    .single()

  if (!acesso) {
    res.status(403).json({ erro: 'Acesso não autorizado a esta empresa' })
    return null
  }

  if (!perfisPermitidos.includes(acesso.perfil)) {
    res.status(403).json({ erro: 'Permissão insuficiente' })
    return null
  }

  return { user, perfil: acesso.perfil as string }
}

// Acesso restrito ao admin do sistema (via ADMIN_EMAIL)
export async function requireSystemAdmin(req: NextApiRequest, res: NextApiResponse) {
  const { user, error } = await getAuthUser(req)
  if (!user) {
    res.status(401).json({ erro: error })
    return null
  }
  if (user.email !== process.env.ADMIN_EMAIL) {
    res.status(403).json({ erro: 'Acesso restrito' })
    return null
  }
  return user
}
