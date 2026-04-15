import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Empresa = {
  id: string
  razao_social: string
  cnpj: string
  plano: string
  trial_restante: number | null
  trans_mes: number
  trans_pendente: number
  trans_erro: number
  trans_transmitido: number
  trans_mes_passado: number
  variacao_pct: number | null
  funcionarios: number
  responsavel: { nome: string; email: string } | null
  created_at: string
}

type Transmissao = {
  id: string
  empresa_id: string
  empresa_nome: string
  evento: string
  status: string
  created_at: string
  erro: string | null
}

type Totais = {
  empresas: number
  trans_mes: number
  pendente: number
  erros: number
  funcionarios: number
}

export default function Admin() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [totais, setTotais] = useState<Totais | null>(null)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [recentes, setRecentes] = useState<Transmissao[]>([])
  const [busca, setBusca] = useState('')
  const [ordenar, setOrdenar] = useState<'trans_mes' | 'razao_social' | 'created_at' | 'trans_erro'>('trans_mes')
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const resp = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await resp.json()

      if (resp.status === 403) { router.push('/dashboard'); return }
      if (!resp.ok) throw new Error(json.erro || 'Erro ao carregar dados')

      setTotais(json.totais)
      setEmpresas(json.empresas)
      setRecentes(json.recentes)
      setAtualizadoEm(new Date())
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  function fmtData(iso: string) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  function fmtDataCurta(iso: string) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('pt-BR')
  }

  function corPlano(plano: string) {
    if (plano === 'starter')      return { bg: '#E6F1FB', cor: '#185FA5' }
    if (plano === 'professional') return { bg: '#EAF3DE', cor: '#27500A' }
    if (plano === 'business')     return { bg: '#FAEEDA', cor: '#633806' }
    if (plano === 'cancelado')    return { bg: '#FCEBEB', cor: '#791F1F' }
    return { bg: '#f3f4f6', cor: '#6b7280' } // trial
  }

  function corStatus(status: string) {
    if (status === 'transmitido') return '#27a048'
    if (status === 'pendente')    return '#EF9F27'
    if (status === 'erro')        return '#dc2626'
    return '#9ca3af'
  }

  const empresasFiltradas = empresas
    .filter(e => {
      if (!busca.trim()) return true
      const t = busca.toLowerCase()
      return e.razao_social.toLowerCase().includes(t)
        || e.cnpj.replace(/\D/g, '').includes(busca.replace(/\D/g, ''))
        || e.responsavel?.email?.toLowerCase().includes(t)
        || e.responsavel?.nome?.toLowerCase().includes(t)
    })
    .sort((a, b) => {
      if (ordenar === 'razao_social') return a.razao_social.localeCompare(b.razao_social)
      if (ordenar === 'trans_erro')   return b.trans_erro - a.trans_erro
      if (ordenar === 'created_at')   return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return b.trans_mes - a.trans_mes
    })

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif', fontSize: 14, color: '#6b7280' }}>
      Carregando painel administrativo...
    </div>
  )

  if (erro) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 14, color: '#dc2626' }}>{erro}</div>
      <button onClick={carregar} style={{ padding: '8px 16px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Tentar novamente</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Head><title>Admin — eSocial SST</title></Head>

      {/* Header */}
      <div style={{ background: '#111827', borderBottom: '1px solid #1f2937', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, background: '#185FA5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="14,3 14,8 19,8"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>eSocial SST</span>
            <span style={{ fontSize: 11, color: '#6b7280', padding: '2px 8px', background: '#1f2937', borderRadius: 4 }}>Admin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {atualizadoEm && (
              <span style={{ fontSize: 11, color: '#6b7280' }}>
                Atualizado às {atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={carregar} style={{ padding: '6px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: 6, color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>
              ↻ Atualizar
            </button>
            <button onClick={() => router.push('/dashboard')} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #374151', borderRadius: 6, color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>
              ← Sair do Admin
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 2rem' }}>

        {/* Cards de totais */}
        {totais && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Empresas ativas', valor: totais.empresas, cor: '#185FA5', bg: '#E6F1FB', icon: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z' },
              { label: 'Envios este mês', valor: totais.trans_mes, cor: '#27500A', bg: '#EAF3DE', icon: 'M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z' },
              { label: 'Pendentes', valor: totais.pendente, cor: '#633806', bg: '#FAEEDA', icon: 'M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zM12 6v6l4 2' },
              { label: 'Com erro', valor: totais.erros, cor: '#791F1F', bg: '#FCEBEB', icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
              { label: 'Funcionários', valor: totais.funcionarios, cor: '#374151', bg: '#f3f4f6', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z' },
            ].map(c => (
              <div key={c.label} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{c.label}</span>
                  <div style={{ width: 28, height: 28, background: c.bg, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.cor} strokeWidth="2">
                      <path d={c.icon}/>
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#111' }}>{c.valor.toLocaleString('pt-BR')}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

          {/* Tabela de empresas */}
          <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 }}>
                  Empresas ({empresasFiltradas.length})
                </div>
              </div>
              <input
                type="text"
                placeholder="Buscar empresa, CNPJ ou responsável..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ padding: '7px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 7, width: 240, fontFamily: 'inherit' }}
              />
              <select
                value={ordenar}
                onChange={e => setOrdenar(e.target.value as any)}
                style={{ padding: '7px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'inherit' }}
              >
                <option value="trans_mes">↓ Mais envios</option>
                <option value="trans_erro">↓ Com erros</option>
                <option value="razao_social">A–Z Nome</option>
                <option value="created_at">↓ Mais recentes</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' }}>
                    {['Empresa', 'Responsável', 'Plano', 'Envios/mês', 'Variação', 'Pendente', 'Erro', 'Funcionários', 'Desde'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empresasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Nenhuma empresa encontrada</td>
                    </tr>
                  ) : empresasFiltradas.map((emp, idx) => {
                    const { bg, cor } = corPlano(emp.plano)
                    return (
                      <tr key={emp.id} style={{ borderBottom: '0.5px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                          <div style={{ fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.razao_social}</div>
                          <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 1 }}>{emp.cnpj}</div>
                        </td>
                        <td style={{ padding: '10px 12px', maxWidth: 160 }}>
                          {emp.responsavel ? (
                            <>
                              <div style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.responsavel.nome}</div>
                              <div style={{ color: '#9ca3af', fontSize: 11 }}>{emp.responsavel.email}</div>
                            </>
                          ) : <span style={{ color: '#9ca3af' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', background: bg, color: cor, borderRadius: 99, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>
                            {emp.plano === 'trial'
                              ? `Trial ${emp.trial_restante !== null ? emp.trial_restante + 'd' : ''}`
                              : emp.plano.charAt(0).toUpperCase() + emp.plano.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111' }}>
                          {emp.trans_mes.toLocaleString('pt-BR')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {emp.variacao_pct === null ? (
                            <span style={{ color: '#9ca3af' }}>—</span>
                          ) : (
                            <span style={{ color: emp.variacao_pct >= 0 ? '#27a048' : '#dc2626', fontWeight: 500 }}>
                              {emp.variacao_pct >= 0 ? '▲' : '▼'} {Math.abs(emp.variacao_pct)}%
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {emp.trans_pendente > 0
                            ? <span style={{ color: '#EF9F27', fontWeight: 600 }}>{emp.trans_pendente}</span>
                            : <span style={{ color: '#9ca3af' }}>0</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {emp.trans_erro > 0
                            ? <span style={{ color: '#dc2626', fontWeight: 600 }}>{emp.trans_erro}</span>
                            : <span style={{ color: '#9ca3af' }}>0</span>}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>
                          {emp.funcionarios.toLocaleString('pt-BR')}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {fmtDataCurta(emp.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feed de transmissões recentes */}
          <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #f3f4f6' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Últimas transmissões</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Todas as empresas</div>
            </div>
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {recentes.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Nenhuma transmissão</div>
              ) : recentes.map(t => (
                <div key={t.id} style={{ padding: '10px 14px', borderBottom: '0.5px solid #f3f4f6', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: corStatus(t.status), flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#111' }}>{t.evento}</span>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>·</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: corStatus(t.status),
                      }}>{t.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.empresa_nome}
                    </div>
                    {t.erro && (
                      <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.erro}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{fmtData(t.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
