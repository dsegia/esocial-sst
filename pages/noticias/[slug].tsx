import Head from 'next/head'
import Link from 'next/link'
import { GetStaticPaths, GetStaticProps } from 'next'
import { ARTIGOS, getArtigo, Artigo } from '../../lib/artigos'

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

.hero-bar { background:linear-gradient(135deg,#185FA5 0%,#2d7dd2 100%); height:6px; }

.article-wrap { max-width:740px; margin:0 auto; padding:56px 24px 80px; }
.breadcrumb { display:flex; align-items:center; gap:6px; font-size:12px; color:#94a3b8; margin-bottom:32px; }
.breadcrumb a { color:#185FA5; text-decoration:none; font-weight:500; }
.breadcrumb a:hover { text-decoration:underline; }

.article-tags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:18px; }
.tag { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.8px; color:#185FA5; background:rgba(24,95,165,.1); padding:4px 12px; border-radius:99px; }
h1 { font-size:clamp(26px,4vw,40px); font-weight:900; color:#0f172a; line-height:1.2; margin-bottom:16px; letter-spacing:-.5px; }
.article-meta { font-size:13px; color:#94a3b8; margin-bottom:36px; padding-bottom:28px; border-bottom:2px solid #e2e8f0; display:flex; gap:16px; flex-wrap:wrap; }
.article-meta strong { color:#475569; }

.article-body p { font-size:16px; color:#334155; line-height:1.85; margin-bottom:20px; }
.article-body h2 { font-size:22px; font-weight:800; color:#0f172a; margin:36px 0 14px; padding-top:8px; border-top:1px solid #e2e8f0; }
.article-body strong { color:#0f172a; }

.cta-box { background:linear-gradient(135deg,#185FA5,#2d7dd2); border-radius:16px; padding:36px 32px; margin-top:56px; text-align:center; }
.cta-box h3 { font-size:22px; font-weight:800; color:#fff; margin-bottom:10px; }
.cta-box p { font-size:14px; color:rgba(255,255,255,.8); margin-bottom:22px; }
.cta-btn { display:inline-flex; align-items:center; gap:8px; padding:13px 26px; background:#fff; color:#185FA5; border-radius:10px; font-size:14px; font-weight:700; text-decoration:none; transition:transform .15s; }
.cta-btn:hover { transform:translateY(-2px); }

.related-section { max-width:740px; margin:0 auto; padding:0 24px 64px; }
.related-section h3 { font-size:18px; font-weight:800; color:#0f172a; margin-bottom:20px; }
.related-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
.related-card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-decoration:none; color:inherit; transition:border-color .2s,box-shadow .2s; display:block; }
.related-card:hover { border-color:#185FA5; box-shadow:0 6px 24px rgba(24,95,165,.1); }
.related-card h4 { font-size:14px; font-weight:700; color:#0f172a; line-height:1.4; margin-bottom:6px; }
.related-card p { font-size:12px; color:#94a3b8; }

footer { background:#0f172a; padding:32px 24px; text-align:center; }
footer p { font-size:12px; color:#475569; }
footer a { color:#64748b; text-decoration:none; }
footer a:hover { color:#94a3b8; }

@media(max-width:640px) {
  .article-wrap { padding:36px 16px 56px; }
  .related-section { padding:0 16px 48px; }
  .related-grid { grid-template-columns:1fr; }
}
`

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })
}

function renderParagraph(text: string, i: number) {
  if (text.startsWith('## ')) {
    return <h2 key={i}>{text.slice(3)}</h2>
  }
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <p key={i}>
      {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
    </p>
  )
}

interface Props { artigo: Artigo; relacionados: Artigo[] }

export default function ArtigoPage({ artigo, relacionados }: Props) {
  const url = `https://esocial-sst.vercel.app/noticias/${artigo.slug}`
  return (
    <>
      <Head>
        <title>{artigo.titulo} | eSocial SST Dseg</title>
        <meta name="description" content={artigo.resumo} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={artigo.titulo} />
        <meta property="og:description" content={artigo.resumo} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: artigo.titulo,
          description: artigo.resumo,
          datePublished: artigo.data,
          author: { '@type': 'Organization', name: artigo.autor },
          publisher: { '@type': 'Organization', name: 'Dseg Consultoria', url: 'https://esocial-sst.vercel.app' },
          url,
          keywords: artigo.tags.join(', '),
        }) }} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </Head>

      <nav>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">eSocial <span>SST</span></Link>
          <div className="nav-actions">
            <Link href="/noticias">← Blog</Link>
            <Link href="/cadastro" style={{ padding:'7px 16px', borderRadius:8, background:'#185FA5', color:'#fff', fontWeight:600, fontSize:13, textDecoration:'none' }}>
              Testar grátis
            </Link>
          </div>
        </div>
      </nav>
      <div className="hero-bar" />

      <article className="article-wrap">
        <div className="breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>
          <Link href="/noticias">Blog</Link>
          <span>/</span>
          <span style={{ color:'#64748b' }}>{artigo.titulo.slice(0, 40)}…</span>
        </div>

        <div className="article-tags">
          {artigo.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>

        <h1>{artigo.titulo}</h1>

        <div className="article-meta">
          <span>Por <strong>{artigo.autor}</strong></span>
          <span>{formatDate(artigo.data)}</span>
          <span>{artigo.leituraMinutos} min de leitura</span>
        </div>

        <div className="article-body">
          {artigo.conteudo.map((p, i) => renderParagraph(p, i))}
        </div>

        <div className="cta-box">
          <h3>Automatize o eSocial SST com IA</h3>
          <p>Importe PDFs de ASO, LTCAT e PCMSO e transmita eventos em segundos. Trial grátis por 14 dias.</p>
          <Link href="/cadastro" className="cta-btn">Começar agora →</Link>
        </div>
      </article>

      {relacionados.length > 0 && (
        <div className="related-section">
          <h3>Artigos relacionados</h3>
          <div className="related-grid">
            {relacionados.map(r => (
              <Link key={r.slug} href={`/noticias/${r.slug}`} className="related-card">
                <h4>{r.titulo}</h4>
                <p>{formatDate(r.data)} · {r.leituraMinutos} min</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <footer>
        <p>© {new Date().getFullYear()} eSocial SST — Dseg Consultoria · <Link href="/noticias">Blog</Link> · <Link href="/">Início</Link></p>
      </footer>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: ARTIGOS.map(a => ({ params: { slug: a.slug } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const artigo = getArtigo(params!.slug as string)
  if (!artigo) return { notFound: true }
  const relacionados = ARTIGOS.filter(a => a.slug !== artigo.slug).slice(0, 3)
  return { props: { artigo, relacionados } }
}
