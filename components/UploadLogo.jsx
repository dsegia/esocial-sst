import { useState } from 'react'
import { processarLogoParaUpload } from '../lib/logo-util'

export default function UploadLogo({ empresa, onUpdate, isLoading }) {
  const [preview, setPreview] = useState(empresa?.logo_url || '')
  const [erro, setErro] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErro('')
    setUploading(true)
    try {
      const dataUrl = await processarLogoParaUpload(file)
      setPreview(dataUrl)
      await onUpdate(dataUrl)
    } catch (err) {
      setErro(err.message || 'Erro ao processar imagem')
    } finally {
      setUploading(false)
    }
  }

  const handleRemover = async () => {
    setPreview('')
    await onUpdate(null)
  }

  return (
    <div style={s.container}>
      <div style={s.label}>Logo da Empresa</div>
      <div style={s.uploadArea}>
        {preview ? (
          <div style={s.preview}>
            <img src={preview} alt="Logo" style={s.img} />
            <button
              type="button"
              style={s.btnRemover}
              onClick={handleRemover}
              disabled={uploading || isLoading}
            >
              ✕ Remover
            </button>
          </div>
        ) : (
          <label style={s.label2}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading || isLoading}
              style={{ display: 'none' }}
            />
            <div style={s.dropZone}>
              📤 Clique ou arraste uma imagem aqui
              <div style={s.hint}>PNG, JPG, GIF (máx 2 MB)</div>
            </div>
          </label>
        )}
      </div>
      {erro && <div style={s.erro}>{erro}</div>}
    </div>
  )
}

const s = {
  container: { marginBottom: '1.25rem' },
  label: { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' },
  label2: { cursor: 'pointer' },
  uploadArea: {
    padding: '1rem',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    background: '#f9fafb',
    minHeight: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  img: { maxWidth: '100px', maxHeight: '100px', borderRadius: 4 },
  dropZone: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
  },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  btnRemover: {
    padding: '4px 12px',
    fontSize: 11,
    background: '#E24B4A',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  erro: {
    marginTop: 8,
    padding: '8px 12px',
    background: '#FCEBEB',
    color: '#791F1F',
    fontSize: 12,
    borderRadius: 4,
  }
}
