import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { getEmpresaId, setEmpresaId, isMultiEmpresa, limparEmpresa } from '../lib/empresa'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MENU = [
  { href:'/dashboard',       label:'Dashboard',               icon:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { href:'/funcionarios',    label:'Funcionários',             icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z' },
  { sep:true, label:'DOCUMENTOS SST' },
  { href:'/leitor?tipo=aso', label:'ASO',                     icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { href:'/ltcat',           label:'LTCAT',                   icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/pcmso',           label:'PCMSO',                   icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { sep:true, label:'TRANSMISSÕES' },
  { href:'/s2220',           label:'S-2220 Monit. Saúde',     icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/s2240',           label:'S-2240 Cond. Ambientais', icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/s2210',           label:'S-2210 CAT',              icon:'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
  { sep:true, label:'GESTÃO' },
  { href:'/relatorios',      label:'Relatórios',              icon:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href:'/alertas',         label:'Alertas',                 icon:'M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zM12 6v6l4 2' },
  { href:'/configuracoes',   label:'Configurações',           icon:'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z' },
]

type Empresa = { id: string; razao_social: string; cnpj: string; perfil?: string }

export default function Layout({ children, pagina }) {
  const router = useRouter()
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [empresaAtualId, setEmpresaAtualId] = useState('')
  const [nomeUser, setNomeUser] = useState('')
  const [semCert, setSemCert] = useState(false)
  const [multi, setMulti] = useState(false)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMulti(isMultiEmpresa())
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase.from('usuarios').select('nome, empresa_id').eq('id', session.user.id).single()
        .then(({ data: usuario }) => {
          if (!usuario) return
          setNomeUser(usuario.nome)
          const eId = getEmpresaId() || usuario.empresa_id
          setEmpresaAtualId(eId)
          supabase.from('empresas').select('razao_social, cert_digital_validade')
            .eq('id', eId).single()
            .then(({ data: emp }) => {
              if (emp) { setNomeEmpresa(emp.razao_social || ''); setSemCert(!emp.cert_digital_validade) }
            })
          // Carrega lista completa se multi-empresa
          if (isMultiEmpresa()) {
            supabase.rpc('get_minhas_empresas').then(({ data }) => {
              if (data) setEmpresas(data)
            })
          }
        })
    })
  }, [])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function sair() { limparEmpresa(); await supabase.auth.signOut(); router.push('/') }

  function trocarParaEmpresa(emp: Empresa) {
    setEmpresaId(emp.id)
    setDropdownAberto(false)
    // Recarrega a página atual com a nova empresa
    router.reload()
  }

  function initials(nome: string) {
    return nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f4f6f9', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ width:230, flexShrink:0, background:'#fff', borderRight:'0.5px solid #e5e7eb', display:'flex', flexDirection:'column', padding:'1.25rem 0' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 1.25rem .75rem' }}>
          <div style={{ width:32, height:32, background:'#185FA5', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="14,3 14,8 19,8"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:'#111' }}>eSocial SST</div>
            <div style={{ fontSize:10, color:'#9ca3af' }}>Transmissor v1.0</div>
          </div>
        </div>

        {/* Seletor de empresa */}
        <div ref={dropdownRef} style={{ position:'relative', padding:'0 .75rem', marginBottom:'.75rem' }}>
          <button
            onClick={() => multi && setDropdownAberto(v => !v)}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:8,
              padding:'8px 10px', borderRadius:8, border:'0.5px solid #e5e7eb',
              background: dropdownAberto ? '#f5f9ff' : '#f9fafb',
              cursor: multi ? 'pointer' : 'default', textAlign:'left',
            }}
          >
            <div style={{ width:28, height:28, borderRadius:6, background:'#185FA5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:9, fontWeight:700, color:'#fff', lineHeight:1 }}>
                {initials(nomeEmpresa || 'E')}
              </span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {nomeEmpresa || 'Carregando...'}
              </div>
              {multi && (
                <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>Clique para trocar</div>
              )}
            </div>
            {multi && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink:0, transform: dropdownAberto ? 'rotate(180deg)' : 'none', transition:'transform .15s' }}>
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            )}
          </button>

          {/* Dropdown com lista de empresas */}
          {dropdownAberto && empresas.length > 0 && (
            <div style={{
              position:'absolute', top:'calc(100% + 4px)', left:'.75rem', right:'.75rem',
              background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:10,
              boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:100, overflow:'hidden',
            }}>
              <div style={{ padding:'8px 12px 6px', fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.06em' }}>
                Suas empresas
              </div>
              {empresas.map((emp) => {
                const ativa = emp.id === empresaAtualId
                return (
                  <button key={emp.id} onClick={() => trocarParaEmpresa(emp)}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', gap:8,
                      padding:'8px 12px', border:'none', textAlign:'left', cursor:'pointer',
                      background: ativa ? '#E6F1FB' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!ativa) (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb' }}
                    onMouseLeave={e => { if (!ativa) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                  >
                    <div style={{ width:24, height:24, borderRadius:5, background: ativa ? '#185FA5' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:8, fontWeight:700, color: ativa ? '#fff' : '#6b7280' }}>
                        {initials(emp.razao_social)}
                      </span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight: ativa ? 600 : 400, color: ativa ? '#185FA5' : '#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {emp.razao_social}
                      </div>
                      {emp.perfil && (
                        <div style={{ fontSize:9, color:'#9ca3af', marginTop:1, textTransform:'capitalize' }}>{emp.perfil}</div>
                      )}
                    </div>
                    {ativa && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2.5">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    )}
                  </button>
                )
              })}
              <div style={{ borderTop:'0.5px solid #f3f4f6', padding:'6px 12px 8px' }}>
                <button onClick={sair} style={{ background:'none', border:'none', fontSize:11, color:'#9ca3af', cursor:'pointer', padding:0 }}>
                  Sair da conta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menu de navegação */}
        <nav style={{ flex:1, padding:'0 .75rem', overflowY:'auto' }}>
          {MENU.map((item: any, i) => {
            if (item.sep) return (
              <div key={i} style={{ fontSize:9, fontWeight:700, color:'#c4c4c0', textTransform:'uppercase', letterSpacing:'.08em', padding:'10px 10px 4px', marginTop:4 }}>
                {item.label}
              </div>
            )
            const ativo = pagina === item.href.replace('/','').split('?')[0]
            const isCfg = item.href === '/configuracoes'
            return (
              <a key={item.href} href={item.href} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'7px 10px', borderRadius:8, marginBottom:1,
                fontSize:12, textDecoration:'none',
                background: ativo ? '#E6F1FB' : 'transparent',
                color: ativo ? '#185FA5' : '#374151',
                fontWeight: ativo ? 500 : 400,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={ativo ? '#185FA5' : '#9ca3af'} strokeWidth="2" style={{ flexShrink:0 }}>
                  <path d={item.icon}/>
                </svg>
                <span style={{ lineHeight:1.3 }}>{item.label}</span>
                {isCfg && semCert && (
                  <span style={{ marginLeft:'auto', width:7, height:7, borderRadius:'50%', background:'#EF9F27', flexShrink:0 }}></span>
                )}
              </a>
            )
          })}
        </nav>

        {/* Rodapé: usuário + sair */}
        <div style={{ padding:'.75rem 1.25rem 0', borderTop:'0.5px solid #e5e7eb', marginTop:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:500, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nomeUser}</div>
            <div style={{ fontSize:10, color:'#9ca3af' }}>Usuário</div>
          </div>
          <button onClick={sair} title="Sair"
            style={{ background:'transparent', border:'0.5px solid #e5e7eb', borderRadius:7, padding:'5px 8px', cursor:'pointer', fontSize:11, color:'#9ca3af', flexShrink:0 }}>
            Sair
          </button>
        </div>

      </div>

      <div style={{ flex:1, padding:'1.5rem', overflowY:'auto' }}>
        {children}
      </div>
    </div>
  )
}
