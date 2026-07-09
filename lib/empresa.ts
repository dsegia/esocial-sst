// Helpers para gerenciar empresa selecionada (multi-empresa)

export function getEmpresaId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('esocial_empresa_id')
}

export function setEmpresaId(id: string) {
  localStorage.setItem('esocial_empresa_id', id)
}

export function isMultiEmpresa(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('esocial_multi_empresa') === 'true'
}

export function setMultiEmpresa(value: boolean) {
  localStorage.setItem('esocial_multi_empresa', value ? 'true' : 'false')
}

export function limparEmpresa() {
  localStorage.removeItem('esocial_empresa_id')
  localStorage.removeItem('esocial_multi_empresa')
}

// Empresa selecionada no navegador pode ficar apontando para uma empresa à qual
// o usuário perdeu acesso (ou nunca teve). Confirma o vínculo antes de usar,
// senão cai para a empresa própria do usuário e limpa a seleção inválida.
export async function getEmpresaIdValida(supabase: any, userId: string, empresaIdPropria: string): Promise<string> {
  const armazenada = getEmpresaId()
  if (!armazenada || armazenada === empresaIdPropria) return empresaIdPropria

  const { data: vinculo } = await supabase.from('usuario_empresas')
    .select('empresa_id').eq('usuario_id', userId).eq('empresa_id', armazenada).maybeSingle()

  if (vinculo) return armazenada

  limparEmpresa()
  return empresaIdPropria
}
