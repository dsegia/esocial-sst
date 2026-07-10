import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { getEmpresaId } from '../lib/empresa'
import { PLANOS, PlanoStatus } from '../types/database'
import { calcularMensalidade } from '../lib/vidas-planos'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Conta() {
  const router = useRouter()
  const [status, setStatus] = useState<PlanoStatus | null>(null)
  const [email, setEmail] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    if (router.query.sucesso) {
      setMsg('Assinatura ativada com sucesso!')
      try { sessionStorage.removeItem('esst_layout') } catch {}
    }
    if (router.query.cancelado) setMsg('Checkout cancelado. Seu plano não foi alterado.')
    init()
  }, [router.isReady])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setEmail(session.user.email || '')

    const empresaId = getEmpresaId()
    if (!empresaId) { router.push('/empresas'); return }

    const { data } = await supabase.rpc('get_plano_empresa', { p_empresa_id: empresaId })
    setStatus(data as PlanoStatus)
    setCarregando(false)
  }

  if (carregando) return (
    <Layout pagina="conta">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#9ca3af', fontSize: 13 }}>Carregando...</div>
    </Layout>
  )

  const planoAtual = status?.plano || 'trial'
  const mensalidadeAtual = calcularMensalidade(status?.qtd_funcionarios || 0)

  return (
    <Layout pagina="conta">
      <Head><title>Minha Conta — eSocial SST</title></Head>

      <div style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 4 }}>Minha Conta</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 24 }}>{email}</div>

      {msg && (
        <div style={{
          background: router.query.sucesso ? '#EAF3DE' : '#FCEBEB',
          color: router.query.sucesso ? '#27500A' : '#791F1F',
          border: `0.5px solid ${router.query.sucesso ? '#C0DD97' : '#F7C1C1'}`,
          borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20,
        }}>{msg}</div>
      )}

      {/* Status atual */}
      <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 12 }}>Plano atual</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            padding: '4px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700,
            background: PLANOS[planoAtual]?.cor + '18',
            color: PLANOS[planoAtual]?.cor,
            border: `1px solid ${PLANOS[planoAtual]?.cor}40`,
          }}>
            {PLANOS[planoAtual]?.label || planoAtual.toUpperCase()}
          </div>

          {status?.trial_ativo && (
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Trial: <strong>{status.trial_dias_restantes} dias restantes</strong>
            </div>
          )}
          {status?.plano_expira_em && !status.trial_ativo && (
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Renova em: <strong>{new Date(status.plano_expira_em).toLocaleDateString('pt-BR')}</strong>
            </div>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
            Funcionários ativos: <strong>{status?.qtd_funcionarios ?? 0}</strong>
          </div>
        </div>

        {planoAtual === 'vidas' && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
            Mensalidade da faixa atual: <strong style={{ color: '#111' }}>R$ {mensalidadeAtual}/mês</strong>
          </div>
        )}

        {(planoAtual === 'trial' || planoAtual === 'cancelado') && (
          <div style={{ marginTop: 12, background: '#FFF8E6', border: '0.5px solid #F5D78A', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#7a4f00' }}>
            {planoAtual === 'trial'
              ? `Você tem ${status?.trial_dias_restantes} dias de trial. Assine para continuar sem interrupções.`
              : 'Sua assinatura foi cancelada. Assine novamente para reativar o acesso.'}
          </div>
        )}

        <Link href="/planos" style={{
          display: 'inline-block', marginTop: 16, padding: '9px 18px',
          background: planoAtual === 'vidas' ? '#fff' : '#185FA5',
          color: planoAtual === 'vidas' ? '#185FA5' : '#fff',
          border: '1.5px solid #185FA5', borderRadius: 8, fontSize: 13, fontWeight: 600,
          textDecoration: 'none',
        }}>
          {planoAtual === 'vidas' ? 'Ver faixas de preço' : 'Assinar agora'}
        </Link>
      </div>

      {/* Informações adicionais */}
      <div style={{ background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>
        <strong style={{ color: '#374151' }}>Sobre a cobrança:</strong><br/>
        • Plano único, cobrado pelo número de funcionários ativos (vidas) — sem escolha manual de faixa<br/>
        • A faixa é recalculada diariamente pelo pico de vidas no ciclo, não pelo valor no fechamento<br/>
        • Transmissão eSocial e os 7 documentos SST inclusos, sem limite de envios<br/>
        • Pagamento mensal via cartão de crédito — sem fidelidade, cancele quando quiser<br/>
        • Nota fiscal emitida mensalmente por e-mail<br/>
        • Dúvidas: <a href="mailto:suporte@esocialsst.com.br" style={{ color: '#185FA5' }}>suporte@esocialsst.com.br</a>
      </div>

    </Layout>
  )
}
