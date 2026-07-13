import { createServerClient, serialize } from '@supabase/ssr'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' })
  }

  const { logo_url } = req.body as { logo_url: string | null }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() { },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return res.status(401).json({ erro: 'Não autenticado' })
  }

  // Obter empresa_id do usuário
  const { data: user } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', session.user.id)
    .single()

  if (!user?.empresa_id) {
    return res.status(400).json({ erro: 'Empresa não encontrada' })
  }

  // Verificar RLS: usuário deve ser membro da empresa
  const { data: membro } = await supabase
    .from('empresa_membros')
    .select('id')
    .eq('empresa_id', user.empresa_id)
    .eq('usuario_id', session.user.id)
    .single()

  if (!membro) {
    return res.status(403).json({ erro: 'Acesso negado' })
  }

  // Atualizar logo
  const { error } = await supabase
    .from('empresas')
    .update({ logo_url })
    .eq('id', user.empresa_id)

  if (error) {
    console.error('Erro ao atualizar logo:', error)
    return res.status(500).json({ erro: 'Erro ao atualizar logo' })
  }

  res.status(200).json({ sucesso: true })
}
