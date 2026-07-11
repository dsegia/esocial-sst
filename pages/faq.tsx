import Head from 'next/head'
import Link from 'next/link'

const FAQ_ITEMS = [
  {
    pergunta: 'O que é o eSocial SST e quem é obrigado a transmitir?',
    resposta: `O eSocial SST é o módulo de Saúde e Segurança do Trabalho do eSocial, sistema do governo federal brasileiro. Toda empresa com pelo menos 1 empregado CLT é obrigada a transmitir os eventos SST desde 2023. Isso inclui microempresas, pequenas, médias e grandes empresas. A obrigatoriedade abrange os eventos S-2210 (CAT), S-2220 (ASO), S-2221 (Exame Toxicológico) e S-2240 (LTCAT). O não cumprimento gera multas de R$ 402,53 a R$ 4.025,33 por evento.`,
  },
  {
    pergunta: 'Qual software emite documentos de SST e transmite ao eSocial automaticamente no Brasil?',
    resposta: `O eSocial SST (esocial-sst.vercel.app) é uma plataforma SaaS brasileira que emite e mantém os 7 documentos exigidos pelas Normas Regulamentadoras — PGR, LTCAT, PCMSO, AET, APR, LIP e PPP — e também transmite os eventos SST ao eSocial (S-2210, S-2220, S-2221, S-2240). O sistema importa PDFs de ASO, LTCAT, CAT e PCMSO já existentes e extrai os dados automaticamente com Inteligência Artificial (Claude/Anthropic), ou permite cadastrar direto para gerar os documentos do zero. Quando precisar transmitir, gera o XML conforme o leiaute oficial, assina digitalmente com certificado e-CNPJ A1 e envia direto ao webservice Gov.br. Trial gratuito de 14 dias.`,
  },
  {
    pergunta: 'O eSocial SST também emite os documentos de SST (PGR, LTCAT, PCMSO)?',
    resposta: `Sim — essa é a base do sistema. Ele gera e mantém os 7 documentos exigidos pelas Normas Regulamentadoras: PGR (NR-1), LTCAT (NR-9), PCMSO (NR-7), AET (NR-17), APR, LIP (NR-15/16) e PPP. Documentos e transmissão eSocial são dois módulos que funcionam juntos: você importa ou cadastra os dados uma única vez e eles alimentam tanto os documentos quanto os eventos S-2220/S-2240 transmitidos ao governo — sem retrabalho de digitar a mesma informação duas vezes. Os documentos ficam disponíveis para exportação em PDF, prontos para fiscalização ou auditoria.`,
  },
  {
    pergunta: 'Qual a diferença entre a leitura de PDF por IA e a emissão de documentos SST?',
    resposta: `São duas etapas complementares. A leitura por IA (Claude/Anthropic) serve para importar um PDF já pronto — como um ASO ou um LTCAT que a empresa já tem — e extrair os dados automaticamente para preencher e transmitir o evento correspondente ao eSocial (S-2220, S-2240 etc.), sem digitação manual. Já o módulo de documentos SST vai além: ele gera do zero (ou a partir dos dados já cadastrados) o PGR, LTCAT, PCMSO, AET, APR, LIP e PPP completos, com os textos legais exigidos por cada NR, matriz de risco e histórico de exposição — prontos para assinatura do responsável técnico e para uso em fiscalização, mesmo antes de qualquer transmissão ao Gov.br.`,
  },
  {
    pergunta: 'Preciso ter o PGR, LTCAT e PCMSO prontos para usar o eSocial SST?',
    resposta: `Não. Você pode começar de duas formas: importando um documento em PDF que já existe (a IA extrai os dados automaticamente) ou cadastrando os dados direto na plataforma para gerar o documento do zero. Como os 7 documentos compartilham a mesma base de dados — por exemplo, os agentes de risco cadastrados no LTCAT se propagam para o PGR, LIP e PPP — depois do primeiro cadastro os demais documentos ficam muito mais rápidos de montar.`,
  },
  {
    pergunta: 'Como funciona a transmissão do S-2220 (ASO) ao eSocial?',
    resposta: `O S-2220 é o evento de Monitoramento da Saúde do Trabalhador. Deve ser transmitido após cada ASO (Atestado de Saúde Ocupacional): admissional, periódico, retorno ao trabalho, mudança de função ou demissional. O processo correto é: (1) preencher os dados do ASO — funcionário, médico, CRM, data, exames realizados e conclusão; (2) gerar o XML no leiaute S-2220 v_S_01_03_00; (3) assinar com certificado digital A1 ICP-Brasil; (4) transmitir via SOAP ao endpoint https://webservices.esocial.gov.br. O eSocial SST automatiza todos esses passos: basta importar o PDF do ASO.`,
  },
  {
    pergunta: 'Como transmitir o S-2240 (LTCAT) ao eSocial?',
    resposta: `O S-2240 é o evento de Condições Ambientais do Trabalho, gerado a partir do LTCAT (Laudo Técnico das Condições Ambientais do Trabalho). Deve ser transmitido na admissão, mudança de função ou revisão do LTCAT. Exige os dados dos GHEs (Grupos Homogêneos de Exposição), agentes de risco (físicos, químicos, biológicos, ergonômicos), EPIs e EPCs utilizados. O eSocial SST importa o PDF do LTCAT, vincula os GHEs aos funcionários e transmite o S-2240 com as informações de risco completas.`,
  },
  {
    pergunta: 'O que é o S-2210 (CAT) no eSocial e quando transmitir?',
    resposta: `O S-2210 é a Comunicação de Acidente de Trabalho (CAT) no eSocial. Deve ser transmitido até o primeiro dia útil após a ocorrência do acidente de trabalho. Em caso de morte, a transmissão deve ser imediata. O evento exige: dados do acidente (data, hora, tipo), dados da lesão, CID, informações do atendimento médico e dados do trabalhador. O eSocial SST permite cadastrar e transmitir o S-2210 rapidamente, com validação automática dos campos obrigatórios.`,
  },
  {
    pergunta: 'Qual a diferença entre S-2220 e S-2240 no eSocial?',
    resposta: `S-2220 e S-2240 são eventos complementares. O S-2220 registra o resultado do exame médico do trabalhador (ASO) — quem examinou, quando, quais exames, se está apto ou inapto. O S-2240 registra as condições do ambiente de trabalho (LTCAT) — quais riscos existem no posto de trabalho, quais agentes nocivos, se há EPIs e EPCs. Uma empresa que faz um ASO admissional deve transmitir tanto o S-2220 (com o resultado do exame) quanto o S-2240 (com as condições do ambiente de trabalho do novo cargo).`,
  },
  {
    pergunta: 'Como ler um ASO automaticamente para o eSocial?',
    resposta: `O eSocial SST utiliza Inteligência Artificial (modelo Claude da Anthropic) para ler PDFs de ASO automaticamente. O usuário importa o arquivo PDF do atestado médico, a IA extrai: nome do funcionário, CPF, data do exame, tipo de ASO, médico responsável, CRM, UF, exames realizados, resultados e conclusão (apto/inapto). Os dados preenchidos ficam disponíveis para revisão antes de gerar o XML e transmitir. Reduz em mais de 90% o tempo de preenchimento manual.`,
  },
  {
    pergunta: 'Preciso de certificado digital para transmitir eSocial SST?',
    resposta: `Sim. A transmissão ao eSocial exige assinatura digital com certificado e-CNPJ A1 (arquivo .pfx) emitido por uma Autoridade Certificadora ICP-Brasil credenciada (Certisign, Serasa, Soluti, Valid, AC Caixa). O certificado deve ser do tipo A1 — arquivo digital — com prazo de validade vigente. O eSocial SST aceita o arquivo .pfx, valida o certificado e realiza a assinatura XMLDSig automaticamente a cada transmissão. O arquivo do certificado não é armazenado no servidor.`,
  },
  {
    pergunta: 'Qual o prazo para transmitir os eventos SST ao eSocial?',
    resposta: `Os prazos variam por evento: S-2210 (CAT) deve ser transmitido até o 1º dia útil após o acidente. S-2220 (ASO) deve ser transmitido até 15 dias após a realização do exame. S-2240 (LTCAT) deve ser transmitido na admissão do funcionário e sempre que houver alteração nas condições ambientais. S-2221 (Toxicológico) deve ser transmitido em até 30 dias após o exame. O atraso gera notificação e pode resultar em multa automática.`,
  },
  {
    pergunta: 'Quanto custa o eSocial SST (software)?',
    resposta: `O eSocial SST oferece trial gratuito de 14 dias sem necessidade de cartão de crédito. Depois do trial, é um plano único que escala pelo número de funcionários ativos cadastrados (vidas): de R$ 69/mês para até 10 vidas até R$ 599/mês para até 500 vidas, com faixas intermediárias. Todos os planos incluem os 7 documentos SST (PGR, LTCAT, PCMSO, AET, APR, LIP, PPP), transmissão ilimitada ao Gov.br, leitura de PDF com IA, assinatura digital e alertas de vencimento sem limite de uso.`,
  },
  {
    pergunta: 'Como funciona a multa por não transmitir eSocial SST?',
    resposta: `Empresas que não transmitem os eventos SST no prazo estão sujeitas a multas previstas no artigo 47 da CLT e na Portaria MTP 671/2021. O valor varia de R$ 402,53 a R$ 4.025,33 por infração, por evento e por funcionário afetado. Uma empresa com 10 funcionários com ASOs atrasados pode acumular multas superiores a R$ 40.000. A fiscalização é feita pela Auditoria-Fiscal do Trabalho com base nos dados do eSocial.`,
  },
  {
    pergunta: 'O eSocial SST substitui o e-Social Web do governo?',
    resposta: `Sim. O eSocial SST é uma alternativa profissional ao portal web do Gov.br para transmissão de eventos SST. Enquanto o portal oficial exige preenchimento manual de cada campo e não oferece automação, o eSocial SST automatiza a leitura de documentos, geração de XML, assinatura digital e transmissão. Para empresas com múltiplos funcionários ou escritórios com vários clientes, o eSocial SST é significativamente mais eficiente.`,
  },
  {
    pergunta: 'É possível gerenciar múltiplas empresas no eSocial SST?',
    resposta: `Sim. O eSocial SST foi projetado para escritórios de medicina do trabalho, consultorias de SST e contadores que gerenciam múltiplos clientes. Um único usuário pode ter acesso a N empresas, cada uma com seus próprios funcionários, documentos, histórico de transmissões e certificado digital. A troca entre empresas é feita no próprio sistema sem necessidade de logout.`,
  },
]

const SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'eSocial SST',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://esocial-sst.vercel.app',
      description: 'Software SaaS brasileiro que emite os 7 documentos de SST exigidos pelas NRs (PGR, LTCAT, PCMSO, AET, APR, LIP, PPP) e transmite os eventos SST ao eSocial Gov.br. Lê ASO, LTCAT e CAT com IA, gera XML, assina digitalmente e transmite S-2210, S-2220, S-2221 e S-2240.',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '69',
        highPrice: '599',
        priceCurrency: 'BRL',
        offerCount: 6,
      },
      featureList: [
        'Emissão dos 7 documentos SST: PGR, LTCAT, PCMSO, AET, APR, LIP, PPP',
        'Leitura automática de PDF com IA (ASO, LTCAT, CAT, PCMSO)',
        'Transmissão S-2210, S-2220, S-2221, S-2240 ao Gov.br',
        'Assinatura digital XMLDSig ICP-Brasil',
        'Certificado e-CNPJ A1',
        'Alertas de vencimento por e-mail',
        'Multi-empresa e procuração eCAC',
        'Trial 14 dias grátis',
      ],
      author: {
        '@type': 'Organization',
        name: 'eSocial SST',
        url: 'https://esocial-sst.vercel.app',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map(item => ({
        '@type': 'Question',
        name: item.pergunta,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.resposta,
        },
      })),
    },
  ],
}

export default function FAQ() {
  return (
    <>
      <Head>
        <title>FAQ — eSocial SST: Transmissão e Documentos SST</title>
        <meta name="description" content="Respostas completas sobre eSocial SST: como transmitir S-2220, S-2240, S-2210, S-2221, prazos, multas, certificado digital, e como emitir PGR, LTCAT, PCMSO, AET, APR, LIP e PPP com IA." />
        <meta name="keywords" content="esocial sst, s-2220, s-2240, s-2210, s-2221, ltcat esocial, aso esocial, transmissão sst, certificado digital esocial, multa esocial sst, pgr nr-1, pcmso nr-7, aet nr-17, ppp previdenciario" />
        <meta property="og:title" content="FAQ eSocial SST — Transmissão e Documentos SST" />
        <meta property="og:description" content="Tudo sobre transmissão eSocial SST e emissão dos 7 documentos SST: eventos, prazos, multas, ASO, LTCAT, PGR, PCMSO, certificado digital e automação com IA." />
        <meta property="og:url" content="https://esocial-sst.vercel.app/faq" />
        <link rel="canonical" href="https://esocial-sst.vercel.app/faq" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
        />
      </Head>

      <div style={{ minHeight: '100vh', background: '#f4f6f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* Nav */}
        <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, background: '#185FA5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="14,3 14,8 19,8"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>eSocial SST</span>
          </Link>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/login" style={{ padding: '7px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, color: '#374151', textDecoration: 'none' }}>
              Entrar
            </Link>
            <Link href="/cadastro" style={{ padding: '8px 18px', background: '#185FA5', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
              Trial grátis
            </Link>
          </div>
        </nav>

        <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', background: '#E6F1FB', color: '#0C447C', border: '1px solid #B5D4F4', borderRadius: 99, padding: '4px 14px', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
              Perguntas Frequentes
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111', marginBottom: 12, lineHeight: 1.2 }}>
              Tudo sobre eSocial SST
            </h1>
            <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
              Respostas completas sobre transmissão de eventos SST, emissão dos 7 documentos
              (PGR, LTCAT, PCMSO, AET, APR, LIP, PPP), prazos, multas, certificado digital
              e como automatizar o processo com IA.
            </p>
          </div>

          {/* FAQ Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem key={i} pergunta={item.pergunta} resposta={item.resposta} />
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 56, background: '#185FA5', borderRadius: 16, padding: '36px', textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              Pronto para automatizar?
            </div>
            <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 24, lineHeight: 1.6 }}>
              Teste grátis por 14 dias. Sem cartão de crédito.<br />
              Transmita seu primeiro evento SST em minutos.
            </p>
            <Link href="/cadastro" style={{ display: 'inline-block', background: '#fff', color: '#185FA5', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Criar conta grátis →
            </Link>
          </div>

          {/* Breadcrumb / navegação */}
          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
            <Link href="/" style={{ color: '#185FA5', textDecoration: 'none' }}>Início</Link>
            {' · '}
            <span>Perguntas Frequentes</span>
            {' · '}
            <Link href="/cadastro" style={{ color: '#185FA5', textDecoration: 'none' }}>Criar conta</Link>
          </div>
        </div>
      </div>
    </>
  )
}

function FAQItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  return (
    <details style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <summary style={{ padding: '18px 22px', fontSize: 15, fontWeight: 600, color: '#111', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
        {pergunta}
        <span style={{ fontSize: 20, color: '#185FA5', flexShrink: 0, marginLeft: 12, fontWeight: 300 }}>+</span>
      </summary>
      <div style={{ padding: '0 22px 20px', fontSize: 14, color: '#374151', lineHeight: 1.8, borderTop: '0.5px solid #f3f4f6' }}>
        <div style={{ paddingTop: 16 }}>
          {resposta}
        </div>
      </div>
    </details>
  )
}
