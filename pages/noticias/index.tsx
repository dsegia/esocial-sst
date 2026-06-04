import Head from 'next/head'
import Link from 'next/link'
import { ARTIGOS } from '../../lib/artigos'

const css = `
* { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f8fafc; color:#0f172a; }
nav { position:sticky; top:0; z-index:50; background:rgba(255,255,255,.92); backdrop-filter:blur(12px); border-bottom:1px solid #e2e8f0; }
.nav-inner { max-width:1100px; margin:0 auto; padding:0 24px; height:60px; display:flex; align-items:center; justify-content:space-between; }
.nav-logo { font-size:15px; font-weight:800; color:#0f172a; text-decoration:none; display:flex; align-items:center; gap:8px; }
.nav-logo span { color:#185FA5; }
.nav-actions { display:flex; gap:10px; align-items:center; }
.nav-actions a { font-size:13px; font-weight:500; color:#475569; text-decoration:none; padding:7px 14px; border-radius:8px; transition:background .15s,color .15s; }
.nav-actions a:hover { background:#f1f5f9; color:#0f172a; }
.nav-btn { background:#185FA5 !important; color:#fff !important; font-weight:600 !important; }
.nav-btn:hover { background:#1e6fc0 !important; }

.hero { background:linear-gradient(135deg,#185FA5 0%,#2d7dd2 100%); padding:72px 24px 60px; text-align:center; position:relative; overflow:hidden; }
.hero::before { content:""; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Ccircle cx='30' cy='30' r='1' fill='rgba(255,255,255,0.06)'/%3E%3C/svg%3E"); }
.hero-inner { max-width:700px; margin:0 auto; position:relative; }
.hero-tag { display:inline-block; background:rgba(255,255,255,.15); color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px; padding:5px 14px; border-radius:99px; margin-bottom:18px; border:1px solid rgba(255,255,255,.25); }
.hero h1 { font-size:clamp(28px,4vw,46px); font-weight:900; color:#fff; line-height:1.15; margin-bottom:14px; letter-spacing:-.5px; }
.hero p { font-size:16px; color:rgba(255,255,255,.8); max-width:520px; margin:0 auto; line-height:1.7; }

.container { max-width:1100px; margin:0 auto; padding:64px 24px; }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:24px; }

.card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; text-decoration:none; color:inherit; transition:box-shadow .2s,transform .2s,border-color .2s; display:flex; flex-direction:column; }
.card:hover { box-shadow:0 12px 40px rgba(24,95,165,.12); transform:translateY(-4px); border-color:#185FA5; }
.card-img { height:8px; background:linear-gradient(90deg,#185FA5,#3b82f6); }
.card-body { padding:28px; flex:1; display:flex; flex-direction:column; }
.card-tags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
.card-tag { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.8px; color:#185FA5; background:rgba(24,95,165,.08); padding:3px 10px; border-radius:99px; }
.card h2 { font-size:17px; font-weight:800; color:#0f172a; line-height:1.4; margin-bottom:10px; }
.card p { font-size:13px; color:#64748b; line-height:1.7; flex:1; }
.card-footer { padding:16px 28px; border-top:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; }
.card-meta { font-size:11px; color:#94a3b8; }
.card-read { font-size:12px; font-weight:600; color:#185FA5; display:flex; align-items:center; gap:4px; }

.section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#185FA5; margin-bottom:8px; }
.section-h2 { font-size:clamp(22px,3vw,34px); font-weight:900; color:#0f172a; margin-bottom:6px; }
.section-sub { font-size:14px; color:#64748b; margin-bottom:40px; }

.cta-strip { background:linear-gradient(135deg,#0f172a,#1e293b); padding:64px 24px; text-align:center; }
.cta-strip h2 { font-size:clamp(22px,3vw,36px); font-weight:900; color:#fff; margin-bottom:12px; }
.cta-strip p { font-size:15px; color:#94a3b8; margin-bottom:28px; }
.cta-btn { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:linear-gradient(135deg,#185FA5,#3b82f6); color:#fff; border-radius:10px; font-size:15px; font-weight:700; text-decoration:none; transition:transform .15s,box-shadow .15s; box-shadow:0 4px 20px rgba(59,130,246,.3); }
.cta-btn:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(59,130,246,.45); }

footer { background:#0f172a; padding:32px 24px; text-align:center; }
footer p { font-size:12px; color:#475569; }
footer a { color:#64748b; text-decoration:none; }
footer a:hover { color:#94a3b8; }

@media(max-width:640px) {
  .grid { grid-template-columns:1fr; }
  .hero { padding:52px 16px 44px; }
  .container { padding:40px 16px; }
}
`

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })
}

export default function Noticias() {
  return (
    <>
      <Head>
        <title>Notícias e Artigos sobre eSocial SST | Dseg Consultoria</title>
        <meta name="description" content="Artigos, tutoriais e novidades sobre eSocial SST, S-2220, S-2240, S-2210, transmissão de eventos e saúde e segurança do trabalho. Conteúdo atualizado semanalmente." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://esocial-sst.vercel.app/noticias" />
        <meta property="og:title" content="Notícias eSocial SST | Dseg Consultoria" />
        <meta property="og:description" content="Artigos sobre eSocial SST, obrigatoriedade, transmissão e uso de IA para automatizar o cumprimento das obrigações de SST." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Blog eSocial SST — Dseg Consultoria',
          url: 'https://esocial-sst.vercel.app/noticias',
          description: 'Artigos e tutoriais sobre eSocial SST, S-2220, S-2240 e automação de saúde e segurança do trabalho.',
          publisher: { '@type': 'Organization', name: 'Dseg Consultoria', url: 'https://esocial-sst.vercel.app' },
        }) }} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </Head>

      <nav>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            eSocial <span>SST</span>
          </Link>
          <div className="nav-actions">
            <Link href="/">← Início</Link>
            <Link href="/login">Entrar</Link>
            <Link href="/cadastro" className="nav-actions nav-btn" style={{ padding:'7px 16px', borderRadius:8, background:'#185FA5', color:'#fff', fontWeight:600, fontSize:13, textDecoration:'none' }}>
              Testar grátis
            </Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-tag">Blog</div>
          <h1>Notícias e Guias sobre eSocial SST</h1>
          <p>Conteúdo atualizado semanalmente para médicos do trabalho, engenheiros de segurança e RH que precisam cumprir o eSocial SST.</p>
        </div>
      </section>

      <div className="container">
        <div className="section-label">Artigos recentes</div>
        <h2 className="section-h2">Tudo sobre eSocial SST</h2>
        <p className="section-sub">Tutoriais, legislação e melhores práticas para transmissão dos eventos S-2210, S-2220, S-2221 e S-2240.</p>

        <div className="grid">
          {ARTIGOS.map(artigo => (
            <Link key={artigo.slug} href={`/noticias/${artigo.slug}`} className="card">
              <div className="card-img" />
              <div className="card-body">
                <div className="card-tags">
                  {artigo.tags.slice(0, 2).map(t => (
                    <span key={t} className="card-tag">{t}</span>
                  ))}
                </div>
                <h2>{artigo.titulo}</h2>
                <p>{artigo.resumo}</p>
              </div>
              <div className="card-footer">
                <span className="card-meta">{formatDate(artigo.data)} · {artigo.leituraMinutos} min de leitura</span>
                <span className="card-read">Ler artigo →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="cta-strip">
        <h2>Pronto para automatizar o eSocial SST?</h2>
        <p>Trial grátis de 14 dias. Sem cartão de crédito.</p>
        <Link href="/cadastro" className="cta-btn">
          Começar agora →
        </Link>
      </div>

      <footer>
        <p>© {new Date().getFullYear()} eSocial SST — Dseg Consultoria · <Link href="/">Início</Link> · <Link href="/login">Entrar</Link></p>
      </footer>
    </>
  )
}
