import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarCadastro, setMostrarCadastro] = useState(false)

  const [cadNome, setCadNome] = useState('')
  const [cadCNPJ, setCadCNPJ] = useState('')
  const [cadRazao, setCadRazao] = useState('')
  const [cadEmail, setCadEmail] = useState('')
  const [cadSenha, setCadSenha] = useState('')
  const [cadSucesso, setCadSucesso] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErro('E-mail ou senha incorretos.')
        } else {
          setErro('Erro: ' + error.message)
        }
        setCarregando(false)
        return
      }
      if (data.session) router.push('/dashboard')
    } catch (err) {
      setErro('Erro de conexão: ' + err.message)
      setCarregando(false)
    }
  }

  async function handleCadastro(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cadEmail,
        password: cadSenha,
      })

      if (authErr) {
        setErro('Erro ao criar conta: ' + authErr.message)
        setCarregando(false)
        return
      }

      if (!authData.user) {
        setErro('Usuário não foi criado. Tente novamente.')
        setCarregando(false)
        return
      }

      // 2. Criar empresa — sem RLS (usa service key via API route)
      const { data: empresa, error: empErr } = await supabase
        .from('empresas')
        .insert({ cnpj: cadCNPJ, razao_social: cadRazao })
        .select()
        .single()

      if (empErr) {
        setErro('Erro ao criar empresa: ' + empErr.message + ' — Code: ' + empErr.code)
        setCarregando(false)
        return
      }

      // 3. Criar usuário na tabela usuarios
      const { error: uErr } = await supabase
        .from('usuarios')
        .insert({ id: authData.user.id, empresa_id: empresa.id, nome: cadNome, perfil: 'admin' })

      if (uErr) {
        setErro('Erro ao vincular usuário: ' + uErr.message)
        setCarregando(false)
        return
      }

      setCadSucesso(true)
      setCarregando(false)

      // Login automático
      setTimeout(async () => {
        const { data: loginData } = await supabase.auth.signInWithPassword({ email: cadEmail, password: cadSenha })
        if (loginData.session) router.push('/dashboard')
      }, 1000)

    } catch (err) {
      setErro('Erro inesperado: ' + err.message)
      setCarregando(false)
    }
  }

  function fmtCNPJ(v) {
    return v.replace(/\D/g, '').substring(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
      .replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5')
  }

  return (
    <>
      <Head><title>eSocial SST — Entrar</title></Head>
      <div style={s.page}>
        <div style={s.card}>

          <div style={s.logoWrap}>
            <div style={s.logoBox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="14,3 14,8 19,8"/>
              </svg>
            </div>
            <div>
              <div style={s.logoTitle}>eSocial SST</div>
              <div style={s.logoSub}>Transmissor · S-2210 · S-2220 · S-2240</div>
            </div>
          </div>

          <div style={s.tabs}>
            <button style={{ ...s.tab, ...(mostrarCadastro ? {} : s.tabActive) }}
              onClick={() => { setMostrarCadastro(false); setErro('') }}>Entrar</button>
            <button style={{ ...s.tab, ...(mostrarCadastro ? s.tabActive : {}) }}
              onClick={() => { setMostrarCadastro(true); setErro('') }}>Cadastrar empresa</button>
          </div>

          {!mostrarCadastro && (
            <form onSubmit={handleLogin}>
              <div style={s.field}>
                <label style={s.label}>E-mail</label>
                <input style={s.input} type="email" placeholder="seuemail@empresa.com"
                  value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div style={s.field}>
                <label style={s.label}>Senha</label>
                <input style={s.input} type="password" placeholder="••••••••"
                  value={senha} onChange={e => setSenha(e.target.value)} required />
              </div>
              {erro && <div style={s.erroBox}>{erro}</div>}
              <button type="submit" style={{ ...s.btnPrimary, opacity: carregando ? 0.7 : 1 }} disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {mostrarCadastro && !cadSucesso && (
            <form onSubmit={handleCadastro}>
              <div style={s.field}>
                <label style={s.label}>Seu nome completo</label>
                <input style={s.input} type="text" value={cadNome} onChange={e => setCadNome(e.target.value)} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>CNPJ da empresa</label>
                <input style={s.input} type="text" placeholder="00.000.000/0000-00"
                  value={cadCNPJ} onChange={e => setCadCNPJ(fmtCNPJ(e.target.value))} maxLength={18} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Razão social</label>
                <input style={s.input} type="text" value={cadRazao} onChange={e => setCadRazao(e.target.value)} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>E-mail de acesso</label>
                <input style={s.input} type="email" value={cadEmail} onChange={e => setCadEmail(e.target.value)} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Senha (mínimo 6 caracteres)</label>
                <input style={s.input} type="password" value={cadSenha}
                  onChange={e => setCadSenha(e.target.value)} minLength={6} required />
              </div>
              {erro && <div style={s.erroBox}>{erro}</div>}
              <button type="submit" style={{ ...s.btnPrimary, opacity: carregando ? 0.7 : 1 }} disabled={carregando}>
                {carregando ? 'Cadastrando...' : 'Criar conta gratuita'}
              </button>
            </form>
          )}

          {mostrarCadastro && cadSucesso && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 56, height: 56, background: '#EAF3DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#085041', marginBottom: 6 }}>Conta criada!</div>
              <div style={{ fontSize: 13, color: '#374151' }}>Redirecionando para o dashboard...</div>
            </div>
          )}

        </div>
        <div style={s.rodape}>eSocial SST · Versão 1.0</div>
      </div>
    </>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f4f6f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  card: { background: '#fff', borderRadius: 16, border: '0.5px solid #e5e7eb', padding: '2rem', width: '100%', maxWidth: 420 },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  logoBox: { width: 44, height: 44, background: '#185FA5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoTitle: { fontSize: 16, fontWeight: 600, color: '#111' },
  logoSub: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  tabs: { display: 'flex', border: '0.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  tab: { flex: 1, padding: '9px 8px', fontSize: 13, fontWeight: 500, textAlign: 'center', cursor: 'pointer', border: 'none', background: '#f9fafb', color: '#6b7280' },
  tabActive: { background: '#fff', color: '#185FA5' },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 },
  input: { width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#111', boxSizing: 'border-box', fontFamily: 'inherit' },
  erroBox: { background: '#FCEBEB', color: '#791F1F', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14, lineHeight: 1.5 },
  btnPrimary: { width: '100%', padding: '11px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  rodape: { marginTop: 24, fontSize: 11, color: '#9ca3af', textAlign: 'center' },
}
