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
