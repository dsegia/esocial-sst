import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RedefinirSenha() {
  const router = useRouter()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPronto(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (novaSenha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem.'); return }
    setCarregando(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setCarregando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setInfo('Senha redefinida! Redirecionando...')
    setTimeout(() => router.push('/login'), 2000)
  }

  const s: Record<string, React.CSSProperties> = {
    page:  { minHeight: '100vh', background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    card:  { background: '#fff', borderRadius: 16, border: '0.5px solid #e5e7eb', padding: '2rem', width: '100%', maxWidth: 400 },
    field: { marginBottom: 14 },
    label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 },
    input: { width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#111', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
    btn:   { width: '100%', padding: '11px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  }

  return (
    <>
      <Head><title>eSocial SST — Nova senha</title></Head>
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <img src="/logo-completa.png" alt="DSEG Consultoria" style={{ height: '90px', width: 'auto' }} />
          </div>

          {!pronto ? (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', padding: '1rem 0' }}>
              Verificando link de redefinição...
              <div style={{ fontSize: 12, marginTop: 8, color: '#9ca3af' }}>
                Se demorar, verifique se o link do e-mail está correto.
              </div>
            </div>
          ) : info ? (
            <div style={{ background: '#EAF3DE', color: '#27500A', borderRadius: 8, padding: '14px', fontSize: 14, textAlign: 'center' }}>
              ✅ {info}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 6 }}>Criar nova senha</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>Escolha uma senha segura para sua conta.</div>
              <form onSubmit={handleSubmit}>
                <div style={s.field}>
                  <label style={s.label}>Nova senha</label>
                  <input style={s.input} type="password" placeholder="Mínimo 6 caracteres"
                    value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required autoFocus />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Confirmar senha</label>
                  <input style={s.input} type="password" placeholder="Repita a senha"
                    value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
                </div>
                {erro && (
                  <div style={{ background: '#FCEBEB', color: '#791F1F', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
                    {erro}
                  </div>
                )}
                <button type="submit" disabled={carregando} style={{ ...s.btn, opacity: carregando ? 0.7 : 1 }}>
                  {carregando ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
