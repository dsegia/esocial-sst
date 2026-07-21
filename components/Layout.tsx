import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useEffect, useState, type ReactNode } from 'react'
import { getEmpresaId, isMultiEmpresa, limparEmpresa } from '../lib/empresa'

const MENU_COMPLETO = [
  { href:'/dashboard',       label:'Dashboard',               icon:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { sep:true, label:'EMPRESAS' },
  { href:'/funcionarios',    label:'Funcionários',             icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z' },
  { href:'/ghes',            label:'GHEs e Riscos',           icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { sep:true, label:'DOCUMENTOS' },
  { href:'/documentos',      label:'Todos os Documentos',     icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/ltcat',           label:'LTCAT',                   icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/pcmso',           label:'PCMSO',                   icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/pgr',             label:'PGR',                     icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/aet',             label:'AET',                     icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/apr',             label:'APR',                     icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/lip',             label:'LIP',                     icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/ppp',             label:'PPP',                     icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/aep',             label:'AEP',                     icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/dir',             label:'DIR',                     icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { sep:true, label:'MEDICINA' },
  { href:'/aso',             label:'ASO',                     icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { href:'/clinicas',        label:'Cadastro de Clínicas',    icon:'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M9 9h1m4 0h1m-6 4h1m4 0h1M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4' },
  { href:'/medicos',         label:'Cadastro de Médicos',     icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { sep:true, label:'IMPORTAÇÃO' },
  { href:'/importar',        label:'Importar PDF',            icon:'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  { sep:true, label:'GESTÃO SST' },
  { href:'/ordem-servico',   label:'Ordem de Serviço',        icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/treinamentos',    label:'Treinamentos NR',         icon:'M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.42A12.02 12.02 0 0122 8.9V15M6 12v5c0 1 3 3 6 3s6-2 6-3v-5' },
  { href:'/epis',            label:'Controle de EPI',         icon:'M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z' },
  { href:'/sesmt',           label:'Dimensionamento SESMT',   icon:'M9 3v18M15 3v18M3 9h18M3 15h18' },
  { href:'/indicadores',     label:'Indicadores SST',         icon:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href:'/pesquisa-psicossocial', label:'Pesquisa Psicossocial', icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { sep:true, label:'TRANSMISSÕES' },
  { href:'/s2220',           label:'S-2220 Monit. Saúde',     icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/s2240',           label:'S-2240 Cond. Ambientais', icon:'M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM14 3v5h5' },
  { href:'/s2210',           label:'S-2210 CAT',              icon:'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
  { href:'/s2221',           label:'S-2221 Toxicológico',     icon:'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
  { href:'/fila-transmissao',label:'Fila de Transmissão',     icon:'M4 6h16M4 10h16M4 14h8m-8 4h4' },
  { sep:true, label:'GESTÃO' },
  { href:'/relatorios',      label:'Relatórios',              icon:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href:'/relatorio-conformidade', label:'Conformidade',     icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href:'/alertas',         label:'Alertas',                 icon:'M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zM12 6v6l4 2' },
  { href:'/planos',          label:'Planos',                  icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { href:'/configuracoes',   label:'Configurações',           icon:'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z' },
  { href:'/conta',           label:'Minha Conta',             icon:'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
]

// Descobre a qual grupo (sep) uma rota pertence, para abrir esse grupo por padrão
function grupoDaPagina(pagina: string): string {
  let grupoAtual = ''
  for (const item of MENU_COMPLETO) {
    if (item.sep || !item.href) { grupoAtual = item.label; continue }
    if (item.href.replace('/', '').split('?')[0] === pagina) return grupoAtual
  }
  return ''
}

// Rotas que o Visualizador pode acessar
const ROTAS_VISUALIZADOR = ['/relatorios', '/historico', '/conta', '/planos']

const MENU_VISUALIZADOR = [
  { sep:true, label:'RELATÓRIOS' },
  { href:'/relatorios', label:'Relatórios de Transmissão', icon:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href:'/historico',  label:'Histórico',                 icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href:'/conta',      label:'Minha Conta',               icon:'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
]

export default function Layout({ children, pagina }: { children: ReactNode; pagina: string }) {
  const router = useRouter()
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeUser, setNomeUser] = useState('')
  const [perfil, setPerfil] = useState<string>('admin')
  const [semCert, setSemCert] = useState(false)
  const [multi, setMulti] = useState(false)
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let salvos: Record<string, boolean> = {}
    try { salvos = JSON.parse(localStorage.getItem('menu_grupos_abertos') || '{}') } catch { /* ignora */ }
    const grupoAtual = grupoDaPagina(pagina)
    setGruposAbertos(grupoAtual ? { ...salvos, [grupoAtual]: true } : salvos)
  }, [pagina])

  function toggleGrupo(label: string) {
    setGruposAbertos(prev => {
      const novo = { ...prev, [label]: !prev[label] }
      try { localStorage.setItem('menu_grupos_abertos', JSON.stringify(novo)) } catch { /* ignora */ }
      return novo
    })
  }
  const [plano, setPlano] = useState<string>('trial')
  const [trialDias, setTrialDias] = useState<number>(14)
  const [qtdFuncionarios, setQtdFuncionarios] = useState<number | null>(null)

  const PAGES_SEM_BLOQUEIO = ['/planos', '/conta', '/login', '/cadastro', '/aceitar-convite', '/']
  const CACHE_KEY = 'esst_layout'
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  function lerCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const { data, ts } = JSON.parse(raw)
      if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null }
      return data
    } catch { return null }
  }

  function salvarCache(data: any) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) } catch {}
  }

  function aplicarDados(usuario: any, emp: any, qtdFuncs?: number | null) {
    if (!usuario || !emp) return
    setNomeUser(usuario.nome || '')
    const perfilAtual = usuario.perfil || 'operador'
    setPerfil(perfilAtual)
    setNomeEmpresa(emp.razao_social || '')
    setSemCert(!emp.cert_digital_validade)
    const planoAtual = emp.plano || 'trial'
    setPlano(planoAtual)
    if (qtdFuncs != null) setQtdFuncionarios(qtdFuncs)

    // Visualizador: redireciona para /relatorios se tentar acessar rota proibida
    if (perfilAtual === 'visualizador') {
      const paginaAtual = window.location.pathname
      const permitida = ROTAS_VISUALIZADOR.some(r => paginaAtual.startsWith(r))
      if (!permitida) { router.replace('/relatorios'); return }
    }

    if (planoAtual === 'trial' && emp.trial_inicio) {
      const dias = Math.max(0, 14 - Math.ceil((Date.now() - new Date(emp.trial_inicio).getTime()) / 86400000))
      setTrialDias(dias)
      const paginaAtual = window.location.pathname
      if (dias === 0 && !PAGES_SEM_BLOQUEIO.some(p => paginaAtual.startsWith(p))) {
        router.push('/planos?trial_expirado=1')
      }
    }

    if (planoAtual === 'cancelado') {
      const paginaAtual = window.location.pathname
      if (!PAGES_SEM_BLOQUEIO.some(p => paginaAtual.startsWith(p))) {
        router.push('/planos?cancelado=1')
      }
    }
  }

  useEffect(() => {
    setMulti(isMultiEmpresa())

    // Aplica cache imediatamente — sidebar fica preenchida sem esperar queries
    const cache = lerCache()
    if (cache) {
      aplicarDados(cache.usuario, cache.emp, cache.qtdFuncionarios)
    }

    // Busca dados frescos em paralelo (atualiza em background)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const eId = getEmpresaId()

      // Promise.all: queries em paralelo em vez de sequencial (salva ~300ms)
      const [{ data: usuario }, { data: emp }, funcResp] = await Promise.all([
        supabase.from('usuarios').select('nome, empresa_id, perfil').eq('id', session.user.id).single(),
        eId
          ? supabase.from('empresas').select('razao_social, cert_digital_validade, plano, trial_inicio').eq('id', eId).maybeSingle()
          : Promise.resolve({ data: null }),
        eId
          ? supabase.from('funcionarios').select('id', { count: 'exact', head: true }).eq('empresa_id', eId).eq('ativo', true)
          : Promise.resolve({ count: null }),
      ])
      const qtdFuncs = funcResp.count

      // Se empresa não veio ainda (empresa_id está no usuario), busca agora
      const empFinal = emp || await supabase.from('empresas')
        .select('razao_social, cert_digital_validade, plano, trial_inicio')
        .eq('id', usuario?.empresa_id).maybeSingle().then(r => r.data)

      salvarCache({ usuario, emp: empFinal, qtdFuncionarios: qtdFuncs })
      aplicarDados(usuario, empFinal, qtdFuncs)
    })
  }, [])

  async function sair() {
    limparEmpresa()
    try { sessionStorage.removeItem('esst_layout') } catch {}
    await supabase.auth.signOut()
    router.push('/')
  }

  function initials(nome: string) {
    return nome.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
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

        {/* Empresa atual — clique abre /empresas */}
        <div style={{ padding:'0 .75rem', marginBottom:'.75rem' }}>
          <button onClick={() => router.push('/empresas')}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:8,
              padding:'8px 10px', borderRadius:8, border:'0.5px solid #e5e7eb',
              background: pagina === 'empresas' ? '#E6F1FB' : '#f9fafb',
              cursor:'pointer', textAlign:'left',
            }}>
            <div style={{ width:28, height:28, borderRadius:6, background:'#185FA5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:9, fontWeight:700, color:'#fff', lineHeight:1 }}>
                {initials(nomeEmpresa || 'E')}
              </span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:600, color: pagina === 'empresas' ? '#185FA5' : '#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {nomeEmpresa || 'Carregando...'}
              </div>
              <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>
                {multi ? 'Gerenciar empresas' : 'Ver empresa'}
              </div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink:0 }}>
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>
        </div>

        {/* Menu de navegação — filtrado por perfil */}
        <nav style={{ flex:1, padding:'0 .75rem', overflowY:'auto' }}>
          {(() => {
            let grupoAtual = ''
            return (perfil === 'visualizador' ? MENU_VISUALIZADOR : MENU_COMPLETO).map((item: any, i) => {
              if (item.sep) {
                grupoAtual = item.label
                const aberto = !!gruposAbertos[item.label]
                return (
                  <div key={i} onClick={() => toggleGrupo(item.label)} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, cursor:'pointer',
                    padding:'10px 10px 4px', marginTop:4,
                  }}>
                    <span style={{ fontSize:9, fontWeight:700, color:'#c4c4c0', textTransform:'uppercase', letterSpacing:'.08em' }}>
                      {item.label}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c4c4c0" strokeWidth="3" style={{ flexShrink:0, transform: aberto ? 'rotate(90deg)' : 'none', transition:'transform .15s' }}>
                      <polyline points="9,18 15,12 9,6"/>
                    </svg>
                  </div>
                )
              }
              const grupo = grupoAtual
              if (grupo && !gruposAbertos[grupo]) return null
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
            })
          })()}
        </nav>

        {/* Vidas ativas (assinantes ativos) — cobrança escala com esse número */}
        {qtdFuncionarios != null && !['trial','cancelado'].includes(plano) && (
          <div style={{ padding:'0 .75rem', marginBottom:'.5rem' }}>
            <a href="/planos" style={{ display:'block', padding:'8px 10px', borderRadius:8, background:'#f9fafb', border:'0.5px solid #e5e7eb', textDecoration:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:10, color:'#6b7280' }}>Vidas ativas</span>
                <span style={{ fontSize:11, fontWeight:700, color:'#185FA5' }}>{qtdFuncionarios}</span>
              </div>
            </a>
          </div>
        )}

        {/* Banner trial / upgrade */}
        {(plano === 'trial' || plano === 'cancelado') && (
          <div style={{ padding:'0 .75rem', marginBottom:'.5rem' }}>
            <button onClick={() => router.push('/conta')} style={{
              width:'100%', padding:'9px 10px', borderRadius:8, border:'none', cursor:'pointer',
              background: plano === 'cancelado' ? '#FCEBEB' : trialDias <= 3 ? '#FFF0E6' : '#E6F1FB',
              textAlign:'left', display:'flex', alignItems:'center', gap:8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={plano === 'cancelado' ? '#ef4444' : trialDias <= 3 ? '#d97706' : '#185FA5'} strokeWidth="2">
                <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zM12 8v4M12 16h.01"/>
              </svg>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color: plano === 'cancelado' ? '#ef4444' : trialDias <= 3 ? '#d97706' : '#185FA5' }}>
                  {plano === 'cancelado' ? 'Assinatura cancelada' : `Trial: ${trialDias}d restantes`}
                </div>
                <div style={{ fontSize:10, color:'#6b7280' }}>Clique para ver planos</div>
              </div>
            </button>
          </div>
        )}

        {/* Link de onboarding */}
        <div style={{ padding:'0 .75rem .5rem' }}>
          <a href="/onboarding" style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 10px', borderRadius:8, fontSize:11, color:'#9ca3af', textDecoration:'none', background:'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background='#f9fafb')}
            onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            Primeiros passos
          </a>
        </div>

        {/* Rodapé: usuário + sair */}
        <div style={{ padding:'.75rem 1.25rem 0', borderTop:'0.5px solid #e5e7eb', marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:500, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nomeUser}</div>
            <div style={{ fontSize:10, color: perfil === 'visualizador' ? '#9ca3af' : perfil === 'admin' ? '#185FA5' : '#6b7280', fontWeight: perfil === 'visualizador' ? 400 : 500 }}>
              {perfil === 'admin' ? 'Admin' : perfil === 'operador' ? 'Operador' : 'Visualizador'}
            </div>
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
