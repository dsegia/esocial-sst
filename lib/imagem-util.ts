// Redimensiona uma imagem no navegador (canvas) antes de guardar como data URL,
// pra caber em campos jsonb sem inflar demais a linha no banco.

export function redimensionarImagem(file: File, maxLargura = 1200, qualidade = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'))
    leitor.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Arquivo não é uma imagem válida.'))
      img.onload = () => {
        const escala = Math.min(1, maxLargura / img.width)
        const largura = Math.round(img.width * escala)
        const altura = Math.round(img.height * escala)
        const canvas = document.createElement('canvas')
        canvas.width = largura
        canvas.height = altura
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas não suportado neste navegador.')); return }
        ctx.drawImage(img, 0, 0, largura, altura)
        resolve(canvas.toDataURL('image/jpeg', qualidade))
      }
      img.src = leitor.result as string
    }
    leitor.readAsDataURL(file)
  })
}
