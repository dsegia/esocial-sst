import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarCadastro, setMostrarCadastro] = useState(false)

  // Campos de cadastro
  const [cadNome, setCadNome] = useState('')
  const [cadCNPJ, setCadCNPJ] = useState('')
  const [cadRazao, setCadRazao] = useState('')
  const [cadEmail, setCadEmail] = useState('')
  const [cadSenha, setCadSenha] = useState('')
  const [cadSucesso, setCadSucesso] = useState(false)

  // ─── LOGIN ────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })

      if (error) {
        if (error.message.includes('Invalid login')) {
          setErro('E-mail ou senha incorretos. Verifique e tente novamente.')
        } else if (error.message.includes('Email not confirmed')) {
          setErro('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.')
        } else {
          setErro('Erro ao entrar: ' + error.message)
        }
        return
      }

      if (data.session) {
        router.push('/dashboard')
      }
    } catch {
      setErro('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  // ─── CADASTRO ─────────────────────────────────────────
  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      // 1. Cria o usuário no Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cadEmail,
        password: cadSenha,
        options: { emailRedirectTo: window.location.origin + '/dashboard' },
      })

      if (authErr || !authData.user) {
        setErro('Erro ao criar conta: ' + (authErr?.message || 'Tente novamente.'))
        return
      }

      // 2. Cria a empresa
      const { data: empresa, error: empErr } = await supabase
        .from('empresas')
        .insert({
          cnpj: cadCNPJ,
          razao_social: cadRazao,
        })
        .select()
        .single()

      if (empErr || !empresa) {
        setErro('Erro ao cadastrar empresa. Verifique se o CNPJ já está cadastrado.')
        return
      }

      // 3. Cria o usuário admin vinculado à empresa
      await supabase.from('usuarios').insert({
        id: authData.user.id,
        empresa_id: empresa.id,
        nome: cadNome,
        perfil: 'admin',
      })

      setCadSucesso(true)
    } catch {
      setErro('Erro inesperado. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  function fmtCNPJ(v: string) {
    return v.replace(/\D/g, '').substring(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
      .replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5')
  }

  // ─── RENDER ───────────────────────────────────────────
  return (
    <>
      <Head>
        <title>eSocial SST — Entrar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.page}>
        <div style={styles.card}>

          {/* Logo */}
          <div style={styles.logoWrap}>
            <div style={styles.logoBox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="14,3 14,8 19,8"/>
              </svg>
            </div>
            <div>
              <div style={styles.logoTitle}>eSocial SST</div>
              <div style={styles.logoSub}>Transmissor · S-2210 · S-2220 · S-2240</div>
            </div>
          </div>

          {/* Tabs login / cadastro */}
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(mostrarCadastro ? {} : styles.tabActive) }}
              onClick={() => { setMostrarCadastro(false); setErro('') }}
            >Entrar</button>
            <button
              style={{ ...styles.tab, ...(mostrarCadastro ? styles.tabActive : {}) }}
              onClick={() => { setMostrarCadastro(true); setErro('') }}
            >Cadastrar empresa</button>
          </div>

          {/* ── FORMULÁRIO DE LOGIN ── */}
          {!mostrarCadastro && (
            <form onSubmit={handleLogin}>
              <div style={styles.field}>
                <label style={styles.label}>E-mail</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="seuemail@empresa.com.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Senha</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
              </div>

              {erro && <div style={styles.erroBox}>{erro}</div>}

              <button
                type="submit"
                style={{ ...styles.btnPrimary, opacity: carregando ? 0.7 : 1 }}
                disabled={carregando}
              >
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>

              <div style={styles.simNote}>
                Ambiente de simulação · Nenhum dado real é transmitido
              </div>
            </form>
          )}

          {/* ── FORMULÁRIO DE CADASTRO ── */}
          {mostrarCadastro && !cadSucesso && (
            <form onSubmit={handleCadastro}>
              <div style={styles.field}>
                <label style={styles.label}>Seu nome completo</label>
                <input style={styles.input} type="text" placeholder="Nome do responsável"
                  value={cadNome} onChange={e => setCadNome(e.target.value)} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>CNPJ da empresa</label>
                <input style={styles.input} type="text" placeholder="00.000.000/0000-00"
                  value={cadCNPJ}
                  onChange={e => setCadCNPJ(fmtCNPJ(e.target.value))}
                  maxLength={18} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Razão social</label>
                <input style={styles.input} type="text" placeholder="Nome da empresa"
                  value={cadRazao} onChange={e => setCadRazao(e.target.value)} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>E-mail de acesso</label>
                <input style={styles.input} type="email" placeholder="seuemail@empresa.com.br"
                  value={cadEmail} onChange={e => setCadEmail(e.target.value)} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Senha (mínimo 8 caracteres)</label>
                <input style={styles.input} type="password" placeholder="••••••••"
                  value={cadSenha} onChange={e => setCadSenha(e.target.value)}
                  minLength={8} required />
              </div>

              {erro && <div style={styles.erroBox}>{erro}</div>}

              <button
                type="submit"
                style={{ ...styles.btnPrimary, opacity: carregando ? 0.7 : 1 }}
                disabled={carregando}
              >
                {carregando ? 'Cadastrando...' : 'Criar conta gratuita'}
              </button>
            </form>
          )}

          {/* ── CADASTRO CONCLUÍDO ── */}
          {mostrarCadastro && cadSucesso && (
            <div style={styles.sucessoBox}>
              <div style={styles.sucessoIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div style={styles.sucessoTitle}>Conta criada com sucesso!</div>
              <div style={styles.sucessoDesc}>
                Enviamos um e-mail de confirmação para <strong>{cadEmail}</strong>.
                Clique no link do e-mail e depois volte aqui para entrar.
              </div>
              <button
                style={{ ...styles.btnPrimary, marginTop: 16 }}
                onClick={() => { setMostrarCadastro(false); setCadSucesso(false) }}
              >
                Ir para o login
              </button>
            </div>
          )}

        </div>

        <div style={styles.rodape}>
          eSocial SST · Versão 1.0 · Dados protegidos por criptografia
        </div>
      </div>
    </>
  )
}

// ─── ESTILOS ──────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f4f6f9',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    border: '0.5px solid #e5e7eb',
    padding: '2rem',
    width: '100%',
    maxWidth: 420,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoBox: {
    width: 44,
    height: 44,
    background: '#185FA5',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111',
  },
  logoSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  tabs: {
    display: 'flex',
    gap: 0,
    border: '0.5px solid #e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: '9px 8px',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'center' as const,
    cursor: 'pointer',
    border: 'none',
    background: '#f9fafb',
    color: '#6b7280',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: '#fff',
    color: '#185FA5',
  },
  field: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    background: '#fff',
    color: '#111',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  erroBox: {
    background: '#FCEBEB',
    color: '#791F1F',
    border: '0.5px solid #F7C1C1',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 1.5,
  },
  btnPrimary: {
    width: '100%',
    padding: '11px',
    background: '#185FA5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  simNote: {
    textAlign: 'center' as const,
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 14,
  },
  sucessoBox: {
    textAlign: 'center' as const,
    padding: '1rem 0',
  },
  sucessoIcon: {
    width: 56,
    height: 56,
    background: '#EAF3DE',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  sucessoTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#085041',
    marginBottom: 8,
  },
  sucessoDesc: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.6,
  },
  rodape: {
    marginTop: 24,
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center' as const,
  },
}
