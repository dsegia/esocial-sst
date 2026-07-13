// lib/logo-util.ts
// Utilitários para upload e gerenciamento de logo da empresa

export async function redimensionarImagemLogo(file: File, maxLargura = 200, maxAltura = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxLargura || height > maxAltura) {
          const ratio = Math.min(maxLargura / width, maxAltura / height)
          width *= ratio
          height *= ratio
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Erro ao processar imagem')); return }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => reject(new Error('Erro ao carregar imagem'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsDataURL(file)
  })
}

export async function processarLogoParaUpload(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Por favor, selecione um arquivo de imagem (PNG, JPG, GIF)')
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 2 MB')
  }
  return redimensionarImagemLogo(file, 300, 300)
}
