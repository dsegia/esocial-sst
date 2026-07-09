import { useEffect, useState, useRef, type CSSProperties } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import Layout from '../components/Layout'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function formatCnpj(cnpj: string) {
  const d = (cnpj || '').replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

interface CertInfo {
  validade: string
  tipo: string
  titular: string
  tipo_certificado?: string
  aviso?: string
}

export default function Configuracoes() {
  const router = useRouter()
  const inputCertRef = useRef<HTMLInputElement>(null)
  const certEmpRef = useRef<HTMLInputElement>(null)
  const [empresaId, setEmpresaId] = useState('')
  const [empresa, setEmpresa] = useState<any>(null)
  const [aba, setAba] = useState('certificado')

  // Usuários
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [conviteEmail, setConviteEmail] = useState('')
  const [conviteNome, setConviteNome] = useState('')
  const [convitePerfil, setConvitePerfil] = useState('operador')
  const [enviandoConvite, setEnviandoConvite] = useState(false)
  const [conviteMsg, setConviteMsg] = useState('')
  const [conviteErro, setConviteErro] = useState('')
  const [alterandoPerfil, setAlterandoPerfil] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  // Certificado A1
  const [certArquivo, setCertArquivo] = useState<File | null>(null)
  const [certSenha, setCertSenha] = useState('')
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null)
  const [lendoCert, setLendoCert] = useState(false)

  // eCAC
  const [ecacCnpjProcurador, setEcacCnpjProcurador] = useState('')
  const [ecacNomeProcurador, setEcacNomeProcurador] = useState('')

  // Empresas-empregadoras que ESTA empresa (procuradora) transmite
  const [empregadoras, setEmpregadoras] = useState<any[]>([])
  const [novaEmpRazao, setNovaEmpRazao] = useState('')
  const [novaEmpCnpj, setNovaEmpCnpj] = useState('')
  const [cadEmpMsg, setCadEmpMsg] = useState('')

  // Upload de cert por empresa transmitida
  const [certEmpUploadId, setCertEmpUploadId] = useState<string | null>(null)
  const [certEmpFile, setCertEmpFile] = useState<File | null>(null)
  const [certEmpSenha, setCertEmpSenha] = useState('')
  const [certEmpMsgs, setCertEmpMsgs] = useState<Record<string, string>>({})
  const [salvandoCertEmp, setSalvandoCertEmp] = useState(false)

  // Empresa
  const [formEmpresa, setFormEmpresa] = useState({
    razao_social:'', cnpj:'', cnae:'', endereco:'', municipio:'', uf:'SP', cep:'',
    resp_nome:'', resp_cpf:'', resp_cargo:''
  })

  useEffect(() => { init() }, [])

  async function init() {
    const { data:{ session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data:user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)
    setEmpresaId(empId)
    carregarUsuarios(empId)
    const { data:emp } = await supabase.from('empresas').select('*').eq('id', empId).single()
    if (emp) {
      setEmpresa(emp)
      carregarEmpregadoras(emp.cnpj, empId)
      setFormEmpresa({
        razao_social: emp.razao_social || '',
        cnpj: emp.cnpj || '',
        cnae: emp.cnae || '',
        endereco: emp.endereco || '',
        municipio: emp.municipio || '',
        uf: emp.uf || 'SP',
        cep: emp.cep || '',
        resp_nome: emp.resp_nome || '',
        resp_cpf: emp.resp_cpf || '',
        resp_cargo: emp.resp_cargo || '',
      })
      if (emp.cert_digital_validade) {
        setCertInfo({
          validade: emp.cert_digital_validade,
          tipo: emp.cert_tipo || 'A1',
          titular: emp.cert_titular || emp.razao_social,
        })
      }
      if (emp.ecac_cnpj_procurador) {
        setEcacCnpjProcurador(emp.ecac_cnpj_procurador)
        setEcacNomeProcurador(emp.ecac_nome_procurador || '')
      }
    }
    setCarregando(false)
  }

  async function lerCertificado(file: File | null) {
    if (!file) return
    setLendoCert(true); setCertInfo(null); setErro('')
    setCertArquivo(file)
    // Lê metadados básicos do .pfx via API
    try {
      const base64 = await new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => resolve((e.target!.result as string).split(',')[1])
        reader.readAsDataURL(file)
      })
      const resp = await fetch('/api/ler-certificado', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ pfx: base64, senha: certSenha })
      })
      const data = await resp.json()
      if (data.sucesso) {
        setCertInfo(data.info)
        if (data.info?.aviso) {
          setErro(data.info.aviso)
        } else {
          setSucesso('Certificado lido com sucesso!')
        }
      } else {
        setErro(data.erro || 'Erro ao ler certificado. Verifique o arquivo e a senha.')
      }
    } catch (err: any) {
      setErro('Erro ao processar certificado: ' + err.message)
    }
    setLendoCert(false)
  }

  async function salvarCertificado() {
    if (!certInfo) { setErro('Leia o certificado primeiro.'); return }
    if ((certInfo as any).tipo_certificado === 'e-CPF') {
      setErro('Certificado e-CPF não é aceito. É necessário e-CNPJ correspondente ao CNPJ da empresa.')
      return
    }
    if (!certArquivo || !certSenha) { setErro('Selecione o arquivo e informe a senha.'); return }
    setSalvando(true); setErro(''); setSucesso('')
    try {
      const base64 = await new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => resolve((e.target!.result as string).split(',')[1])
        reader.readAsDataURL(certArquivo!)
      })
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch('/api/cert/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ pfx: base64, senha: certSenha, empresa_id: empresaId }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json.erro || 'Erro ao salvar certificado')
      setCertInfo(json.info)
      setSucesso('Certificado salvo com segurança! Próximas transmissões usarão automaticamente.')
    } catch (err: any) {
      setErro('Erro ao salvar: ' + err.message)
    }
    setSalvando(false)
  }

  async function salvarEcac() {
    const cnpjLimpo = ecacCnpjProcurador.replace(/\D/g, '')
    if (cnpjLimpo.length !== 14) { setErro('Informe um CNPJ de procurador válido (14 dígitos).'); return }
    setSalvando(true); setErro(''); setSucesso('')
    const { error } = await supabase.from('empresas').update({
      ecac_cnpj_procurador: cnpjLimpo,
      ecac_nome_procurador: ecacNomeProcurador || null,
    }).eq('id', empresaId)
    if (error) { setErro('Erro: ' + error.message) }
    else {
      setEmpresa((e: any) => ({ ...e, ecac_cnpj_procurador: cnpjLimpo, ecac_nome_procurador: ecacNomeProcurador || null }))
      setSucesso('Procuração salva! As transmissões desta empresa usarão o certificado da consultoria procuradora.')
    }
    setSalvando(false)
  }

  async function removerEcac() {
    if (!confirm('Remover a procuração? Esta empresa precisará de certificado próprio para transmitir.')) return
    setSalvando(true); setErro(''); setSucesso('')
    const { error } = await supabase.from('empresas').update({
      ecac_cnpj_procurador: null,
      ecac_nome_procurador: null,
    }).eq('id', empresaId)
    if (error) { setErro('Erro: ' + error.message) }
    else {
      setEcacCnpjProcurador(''); setEcacNomeProcurador('')
      setEmpresa((e: any) => ({ ...e, ecac_cnpj_procurador: null, ecac_nome_procurador: null }))
      setSucesso('Procuração removida.')
    }
    setSalvando(false)
  }

  async function carregarEmpregadoras(cnpjProcurador: string, selfId: string) {
    const limpo = (cnpjProcurador || '').replace(/\D/g, '')
    if (limpo.length !== 14) { setEmpregadoras([]); return }
    const { data } = await supabase.from('empresas')
      .select('id, razao_social, cnpj, cert_pfx_path, cert_digital_validade, cert_titular')
      .eq('ecac_cnpj_procurador', limpo)
    setEmpregadoras((data || []).filter(e => e.id !== selfId))
  }

  async function cadastrarEmpregadora() {
    const razao = novaEmpRazao.trim()
    const cnpjLimpo = novaEmpCnpj.replace(/\D/g, '')
    const cnpjProc = (empresa?.cnpj || '').replace(/\D/g, '')
    setErro(''); setSucesso(''); setCadEmpMsg('')
    if (!razao) { setErro('Informe a razão social da empregadora.'); return }
    if (cnpjLimpo.length !== 14) { setErro('CNPJ da empregadora inválido (14 dígitos).'); return }
    if (cnpjProc.length !== 14) { setErro('Esta empresa precisa de um CNPJ válido (14 dígitos) para ser procuradora.'); return }
    if (cnpjLimpo === cnpjProc) { setErro('A empregadora não pode ser a própria empresa procuradora.'); return }

    setSalvando(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const r = await fetch('/api/empresa/cadastrar-empregadora', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ razao_social: razao, cnpj: cnpjLimpo, cnpj_procurador: cnpjProc, nome_procurador: empresa?.razao_social }),
    })
    const json = await r.json()
    if (!r.ok) { setErro(json.erro || 'Erro ao cadastrar empregadora.'); setSalvando(false); return }

    setNovaEmpRazao(''); setNovaEmpCnpj('')
    setCadEmpMsg(`"${razao}" cadastrada. Carregue o certificado digital dela para habilitar a transmissão.`)
    carregarEmpregadoras(empresa?.cnpj, empresaId)
    setSalvando(false)
  }

  async function salvarCertEmpregadora(empId: string) {
    if (!certEmpFile || !certEmpSenha) return
    setSalvandoCertEmp(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = (e) => resolve((e.target?.result as string).split(',')[1])
        r.onerror = reject
        r.readAsDataURL(certEmpFile)
      })
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch('/api/cert/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ pfx: base64, senha: certEmpSenha, empresa_id: empId }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        setCertEmpMsgs(prev => ({ ...prev, [empId]: json.erro || 'Erro ao salvar.' }))
      } else {
        setCertEmpMsgs(prev => ({ ...prev, [empId]: 'Certificado salvo com sucesso.' }))
        setCertEmpFile(null); setCertEmpSenha(''); setCertEmpUploadId(null)
        carregarEmpregadoras(empresa?.cnpj, empresaId)
      }
    } catch {
      setCertEmpMsgs(prev => ({ ...prev, [empId]: 'Erro ao enviar o certificado.' }))
    }
    setSalvandoCertEmp(false)
  }

  async function carregarUsuarios(empId: string) {
    setLoadingUsers(true)
    const { data } = await supabase.from('usuarios').select('id, nome, perfil, criado_em')
      .eq('empresa_id', empId).order('criado_em', { ascending: true })
    setUsuarios(data || [])
    setLoadingUsers(false)
  }

  async function alterarPerfil(userId: string, novoPerfil: string) {
    setAlterandoPerfil(userId)
    const { error } = await supabase.from('usuarios').update({ perfil: novoPerfil }).eq('id', userId).eq('empresa_id', empresaId)
    if (error) { setErro('Erro ao alterar perfil: ' + error.message) }
    else { await carregarUsuarios(empresaId) }
    setAlterandoPerfil(null)
  }

  async function removerUsuario(userId: string) {
    if (!confirm('Remover este usuário da empresa?')) return
    const { error } = await supabase.from('usuarios').delete().eq('id', userId).eq('empresa_id', empresaId)
    if (error) { setErro('Erro ao remover: ' + error.message) }
    else { await carregarUsuarios(empresaId) }
  }

  async function enviarConvite(e: React.FormEvent) {
    e.preventDefault()
    if (!conviteEmail || !conviteEmail.includes('@')) { setConviteErro('Informe um e-mail válido.'); return }
    setEnviandoConvite(true); setConviteErro(''); setConviteMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch('/api/empresa/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ email: conviteEmail, nome: conviteNome, perfil: convitePerfil }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json.erro || 'Erro ao enviar convite')
      setConviteMsg(json.mensagem || 'Convite enviado!')
      setConviteEmail(''); setConviteNome(''); setConvitePerfil('operador')
      carregarUsuarios(empresaId)
    } catch (err: any) {
      setConviteErro(err.message)
    }
    setEnviandoConvite(false)
  }

  async function salvarEmpresa() {
    setSalvando(true); setErro(''); setSucesso('')
    const { error } = await supabase.from('empresas').update(formEmpresa).eq('id', empresaId)
    if (error) { setErro('Erro: ' + error.message) }
    else setSucesso('Dados da empresa atualizados!')
    setSalvando(false)
  }

  const certVencendoMs = certInfo?.validade ? new Date(certInfo.validade).getTime() : NaN
  const certVencendo = isNaN(certVencendoMs) ? 999 : Math.round((certVencendoMs - Date.now()) / 86400000)

  if (carregando) return <div style={s.loading}>Carregando...</div>

  return (
    <Layout pagina="configuracoes">
      <Head><title>Configurações — eSocial SST</title></Head>

      <div style={s.header}>
        <div>
          <div style={s.titulo}>Configurações</div>
          <div style={s.sub}>Certificado digital, empresa e transmissão</div>
        </div>
      </div>

      {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
      {erro    && <div style={s.erroBox}>{erro}</div>}

      {/* Abas */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'0.5px solid #e5e7eb', paddingBottom:0 }}>
        {[
          { k:'certificado', l:'🔐 Certificado Digital' },
          { k:'ecac',        l:'📋 Procuração eCAC' },
          { k:'empresa',     l:'🏢 Dados da Empresa' },
          { k:'usuarios',    l:'👥 Usuários' },
        ].map(ab => (
          <button key={ab.k} onClick={() => setAba(ab.k)} style={{
            padding:'8px 16px', fontSize:13, fontWeight: aba===ab.k?600:400,
            background:'transparent', border:'none', cursor:'pointer',
            borderBottom: aba===ab.k?'2px solid #185FA5':'2px solid transparent',
            color: aba===ab.k?'#185FA5':'#6b7280', marginBottom:0,
          }}>{ab.l}</button>
        ))}
      </div>

      {/* ABA: Certificado Digital */}
      {aba === 'certificado' && (
        <div style={s.card}>
          <div style={s.cardTit}>Certificado Digital A1</div>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:16, lineHeight:1.7 }}>
            O certificado A1 é um arquivo <code>.pfx</code> ou <code>.p12</code> emitido por uma Autoridade Certificadora ICP-Brasil.
            Ele é necessário para assinar e transmitir os eventos ao Gov.br.<br/>
            <strong>Segurança:</strong> o arquivo <code>.pfx</code> é armazenado criptografado (AES-256) em storage privado. A senha é criptografada separadamente e nunca fica exposta. Uma vez salvo, as transmissões ocorrem automaticamente sem precisar reenviar o arquivo.
          </div>

          {/* Status atual */}
          {certInfo ? (
            <div style={{ background: certVencendo < 30 ?'#FCEBEB':'#EAF3DE', border:`0.5px solid ${certVencendo < 30?'#F7C1C1':'#C0DD97'}`, borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:6 }}>
                ✅ Certificado configurado
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {[
                  { l:'Titular', v: certInfo.titular },
                  { l:'Tipo', v: certInfo.tipo || 'A1' },
                  { l:'Validade', v: new Date(certInfo.validade).toLocaleDateString('pt-BR') },
                ].map((it,i) => (
                  <div key={i}>
                    <div style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase' }}>{it.l}</div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{it.v}</div>
                  </div>
                ))}
              </div>
              {certVencendo < 30 && (
                <div style={{ marginTop:8, fontSize:12, color:'#E24B4A', fontWeight:500 }}>
                  ⚠ Certificado vence em {certVencendo} dias. Renove com urgência.
                </div>
              )}
            </div>
          ) : (
            <div style={{ background:'#FAEEDA', border:'0.5px solid #FAC775', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#633806' }}>
              ⚠ Nenhum certificado configurado. Suba o certificado abaixo <strong>ou</strong> use a aba <strong>📋 Procuração eCAC</strong> para transmitir sem certificado próprio.
            </div>
          )}

          {/* Upload */}
          <div style={s.row2}>
            <div>
              <label style={s.label}>Arquivo do certificado (.pfx ou .p12) *</label>
              <div style={{ border:'2px dashed #d1d5db', borderRadius:8, padding:'16px', textAlign:'center', cursor:'pointer', marginBottom:8 }}
                onClick={() => inputCertRef.current?.click()}>
                {certArquivo
                  ? <div style={{ fontSize:13, color:'#185FA5' }}>✓ {certArquivo.name}</div>
                  : <div style={{ fontSize:13, color:'#9ca3af' }}>Clique para selecionar o arquivo</div>}
              </div>
              <input ref={inputCertRef} type="file" accept=".pfx,.p12" style={{ display:'none' }}
                onChange={e => setCertArquivo(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <label style={s.label}>Senha do certificado *</label>
              <input style={s.input} type="password" placeholder="Senha do arquivo .pfx"
                value={certSenha} onChange={e => setCertSenha(e.target.value)} />
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>
                A senha não é armazenada — é usada apenas para ler o certificado agora.
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button style={s.btnOutline}
              onClick={() => lerCertificado(certArquivo)}
              disabled={!certArquivo || !certSenha || lendoCert}>
              {lendoCert ? 'Lendo...' : 'Ler certificado'}
            </button>
            {certInfo && (
              <button style={s.btnPrimary} onClick={salvarCertificado} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar configuração'}
              </button>
            )}
          </div>

          <div style={{ marginTop:20, padding:'12px 16px', background:'#f9fafb', borderRadius:8, fontSize:12, color:'#6b7280', lineHeight:1.8 }}>
            <strong>Como obter um certificado A1:</strong><br/>
            • Certisign, Serasa Experian, Soluti, Valid, AC Caixa<br/>
            • Custo: ~R$150 a R$400 por 1 ou 3 anos<br/>
            • O certificado deve ser e-CNPJ A1 (para pessoa jurídica)
          </div>
        </div>
      )}

      {/* ABA: Procuração eCAC */}
      {aba === 'ecac' && (
        <div style={s.card}>
          <div style={s.cardTit}>Empresas Transmitidas</div>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:16, lineHeight:1.7 }}>
            Cadastre as empresas cujos eventos você transmite via procuração. Carregue o certificado digital de cada empresa para habilitar a transmissão.
          </div>

          {empregadoras.length > 0 && (
            <div style={{ border:'0.5px solid #e5e7eb', borderRadius:10, overflow:'hidden', marginBottom:16 }}>
              {empregadoras.map((emp, i) => (
                <div key={emp.id} style={{
                  padding:'10px 14px',
                  borderBottom: i < empregadoras.length - 1 ? '0.5px solid #f3f4f6' : 'none',
                  background:'#fff',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {emp.razao_social}
                      </div>
                      <div style={{ fontSize:11, color:'#6b7280', marginTop:1 }}>{emp.cnpj}</div>
                    </div>
                    <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
                      {emp.cert_pfx_path ? (
                        <>
                          <span style={{ fontSize:11, color:'#27500A', background:'#EAF3DE', padding:'2px 8px', borderRadius:99, fontWeight:600 }}>
                            Cert. ok · {emp.cert_digital_validade ? new Date(emp.cert_digital_validade).toLocaleDateString('pt-BR') : ''}
                          </span>
                          <button onClick={() => { setCertEmpUploadId(certEmpUploadId === emp.id ? null : emp.id); setCertEmpFile(null); setCertEmpSenha('') }}
                            style={{ fontSize:11, color:'#6b7280', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}>
                            trocar
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setCertEmpUploadId(certEmpUploadId === emp.id ? null : emp.id); setCertEmpFile(null); setCertEmpSenha('') }}
                          style={{ fontSize:11, color:'#185FA5', background:'#E6F1FB', border:'0.5px solid #B5D4F4', borderRadius:8, padding:'3px 10px', cursor:'pointer', fontWeight:600 }}>
                          Carregar certificado
                        </button>
                      )}
                    </div>
                  </div>
                  {certEmpMsgs[emp.id] && (
                    <div style={{ fontSize:11, marginTop:6, color: certEmpMsgs[emp.id].includes('sucesso') ? '#27500A' : '#791F1F' }}>
                      {certEmpMsgs[emp.id]}
                    </div>
                  )}
                  {certEmpUploadId === emp.id && (
                    <div style={{ marginTop:10, background:'#f9fafb', border:'0.5px solid #e5e7eb', borderRadius:8, padding:'12px' }}>
                      <div style={s.row2}>
                        <div>
                          <label style={s.label}>Arquivo .pfx da empresa</label>
                          <div style={{ border:'2px dashed #d1d5db', borderRadius:6, padding:'10px', textAlign:'center', cursor:'pointer' }}
                            onClick={() => certEmpRef.current?.click()}>
                            {certEmpFile
                              ? <span style={{ fontSize:12, color:'#185FA5' }}>✓ {certEmpFile.name}</span>
                              : <span style={{ fontSize:12, color:'#9ca3af' }}>Clique para selecionar</span>}
                          </div>
                          <input ref={certEmpRef} type="file" accept=".pfx,.p12" style={{ display:'none' }}
                            onChange={e => setCertEmpFile(e.target.files?.[0] ?? null)} />
                        </div>
                        <div>
                          <label style={s.label}>Senha do certificado</label>
                          <input style={s.input} type="password" placeholder="Senha do arquivo .pfx"
                            value={certEmpSenha} onChange={e => setCertEmpSenha(e.target.value)} />
                        </div>
                      </div>
                      <button style={{ ...s.btnPrimary, marginTop:8, fontSize:12 }}
                        onClick={() => salvarCertEmpregadora(emp.id)}
                        disabled={!certEmpFile || !certEmpSenha || salvandoCertEmp}>
                        {salvandoCertEmp ? 'Salvando...' : 'Salvar certificado'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {empregadoras.length === 0 && (
            <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16, padding:'10px 14px', background:'#f9fafb', borderRadius:8 }}>
              Nenhuma empresa transmitida vinculada a esta conta.
            </div>
          )}

          <div style={{ background:'#f9fafb', border:'0.5px solid #e5e7eb', borderRadius:10, padding:'16px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:12 }}>Cadastrar empresa transmitida</div>
            <div style={s.row2}>
              <div>
                <label style={s.label}>Razão Social *</label>
                <input style={s.input} placeholder="Empresa Transmitida Ltda."
                  value={novaEmpRazao} onChange={e => setNovaEmpRazao(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>CNPJ *</label>
                <input style={s.input} placeholder="00.000.000/0001-00"
                  value={novaEmpCnpj} onChange={e => setNovaEmpCnpj(e.target.value)} />
              </div>
            </div>
            {cadEmpMsg && (
              <div style={{ background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'8px 12px', fontSize:12, margin:'8px 0' }}>
                ✅ {cadEmpMsg}
              </div>
            )}
            <button style={{ ...s.btnPrimary, marginTop:8 }} onClick={cadastrarEmpregadora} disabled={salvando}>
              {salvando ? 'Cadastrando...' : 'Cadastrar empresa transmitida'}
            </button>
          </div>
        </div>
      )}

      {/* ABA: Usuários */}
      {aba === 'usuarios' && (
        <div style={s.card}>
          <div style={s.cardTit}>Usuários da Empresa</div>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:16 }}>
            Convide colaboradores para acessar o sistema com diferentes níveis de acesso.
          </div>

          {/* Formulário de convite */}
          <form onSubmit={enviarConvite} style={{ background:'#f9fafb', border:'0.5px solid #e5e7eb', borderRadius:10, padding:'16px', marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:12 }}>Convidar novo usuário</div>
            <div style={s.row3}>
              <div>
                <label style={s.label}>E-mail *</label>
                <input style={s.input} type="email" placeholder="colaborador@empresa.com"
                  value={conviteEmail} onChange={e => setConviteEmail(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Nome (opcional)</label>
                <input style={s.input} placeholder="Nome do colaborador"
                  value={conviteNome} onChange={e => setConviteNome(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Perfil de acesso *</label>
                <select style={s.input} value={convitePerfil} onChange={e => setConvitePerfil(e.target.value)}>
                  <option value="admin">Admin — acesso total</option>
                  <option value="operador">Operador — cadastro e transmissão</option>
                  <option value="visualizador">Visualizador — somente leitura</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom:12, padding:'8px 12px', background:'#E6F1FB', border:'0.5px solid #B5D4F4', borderRadius:8, fontSize:11, color:'#0C447C' }}>
              <strong>Admin:</strong> pode convidar usuários e alterar configurações · <strong>Operador:</strong> pode cadastrar e transmitir · <strong>Visualizador:</strong> somente consulta
            </div>
            {conviteErro && (
              <div style={{ background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'8px 12px', fontSize:12, marginBottom:10 }}>
                {conviteErro}
              </div>
            )}
            {conviteMsg && (
              <div style={{ background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'8px 12px', fontSize:12, marginBottom:10 }}>
                ✅ {conviteMsg}
              </div>
            )}
            <button type="submit" style={s.btnPrimary} disabled={enviandoConvite}>
              {enviandoConvite ? 'Enviando...' : 'Enviar convite'}
            </button>
          </form>

          {/* Lista de usuários */}
          <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:10 }}>
            Usuários atuais ({usuarios.length})
          </div>
          {loadingUsers ? (
            <div style={{ fontSize:12, color:'#9ca3af', padding:'12px 0' }}>Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div style={{ fontSize:12, color:'#9ca3af', padding:'12px 0' }}>Nenhum usuário cadastrado além de você.</div>
          ) : (
            <div style={{ border:'0.5px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
              {usuarios.map((u, i) => {
                const PERFIL_COR: Record<string,string[]> = {
                  admin:        ['#E6F1FB','#0C447C'],
                  operador:     ['#EAF3DE','#27500A'],
                  visualizador: ['#f3f4f6','#6b7280'],
                }
                const [pbg, ptxt] = PERFIL_COR[u.perfil || 'operador'] || PERFIL_COR.operador
                return (
                  <div key={u.id} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                    borderBottom: i < usuarios.length - 1 ? '0.5px solid #f3f4f6' : 'none',
                    background:'#fff',
                  }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'#E6F1FB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:14, color:'#185FA5', fontWeight:600 }}>
                        {(u.nome || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'#111' }}>
                        {u.nome || <span style={{ color:'#9ca3af' }}>Sem nome</span>}
                      </div>
                      <div style={{ fontSize:11, color:'#6b7280' }}>{u.perfil || 'operador'}</div>
                    </div>
                    <span style={{ padding:'2px 9px', borderRadius:99, fontSize:11, fontWeight:600, background:pbg, color:ptxt, flexShrink:0 }}>
                      {u.perfil || 'operador'}
                    </span>
                    <select
                      disabled={alterandoPerfil === u.id}
                      value={u.perfil || 'operador'}
                      onChange={e => alterarPerfil(u.id, e.target.value)}
                      style={{ fontSize:11, padding:'3px 6px', border:'0.5px solid #d1d5db', borderRadius:6, background:'#fff', cursor:'pointer', color:'#374151' }}>
                      <option value="admin">Admin</option>
                      <option value="operador">Operador</option>
                      <option value="visualizador">Visualizador</option>
                    </select>
                    <button onClick={() => removerUsuario(u.id)}
                      style={{ background:'none', border:'0.5px solid #F09595', borderRadius:6, padding:'3px 8px', fontSize:11, color:'#E24B4A', cursor:'pointer', flexShrink:0 }}>
                      Remover
                    </button>
                    <div style={{ fontSize:11, color:'#9ca3af', flexShrink:0 }}>
                      {u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-BR') : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA: Dados da Empresa */}
      {aba === 'empresa' && (
        <div style={s.card}>
          <div style={s.cardTit}>Dados da Empresa</div>
          <div style={s.row2}>
            <div>
              <label style={s.label}>Razão Social</label>
              <input style={s.input} value={formEmpresa.razao_social} onChange={e => setFormEmpresa({...formEmpresa, razao_social:e.target.value})} />
            </div>
            <div>
              <label style={s.label}>CNPJ</label>
              <input style={s.input} value={formEmpresa.cnpj} onChange={e => setFormEmpresa({...formEmpresa, cnpj:e.target.value})} />
            </div>
          </div>
          <div style={s.row3}>
            <div>
              <label style={s.label}>CNAE Principal</label>
              <input style={s.input} placeholder="0000-0/00" value={formEmpresa.cnae} onChange={e => setFormEmpresa({...formEmpresa, cnae:e.target.value})} />
            </div>
            <div>
              <label style={s.label}>CEP</label>
              <input style={s.input} placeholder="00000-000" value={formEmpresa.cep} onChange={e => setFormEmpresa({...formEmpresa, cep:e.target.value})} />
            </div>
            <div>
              <label style={s.label}>UF</label>
              <select style={s.input} value={formEmpresa.uf} onChange={e => setFormEmpresa({...formEmpresa, uf:e.target.value})}>
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={s.row2}>
            <div>
              <label style={s.label}>Endereço</label>
              <input style={s.input} value={formEmpresa.endereco} onChange={e => setFormEmpresa({...formEmpresa, endereco:e.target.value})} />
            </div>
            <div>
              <label style={s.label}>Município</label>
              <input style={s.input} value={formEmpresa.municipio} onChange={e => setFormEmpresa({...formEmpresa, municipio:e.target.value})} />
            </div>
          </div>
          <div style={{ ...s.cardTit, marginTop:16, marginBottom:12 }}>Responsável pela empresa</div>
          <div style={s.row3}>
            <div>
              <label style={s.label}>Nome</label>
              <input style={s.input} value={formEmpresa.resp_nome} onChange={e => setFormEmpresa({...formEmpresa, resp_nome:e.target.value})} />
            </div>
            <div>
              <label style={s.label}>CPF</label>
              <input style={s.input} value={formEmpresa.resp_cpf} onChange={e => setFormEmpresa({...formEmpresa, resp_cpf:e.target.value})} />
            </div>
            <div>
              <label style={s.label}>Cargo</label>
              <input style={s.input} placeholder="Sócio-administrador" value={formEmpresa.resp_cargo} onChange={e => setFormEmpresa({...formEmpresa, resp_cargo:e.target.value})} />
            </div>
          </div>
          <button style={s.btnPrimary} onClick={salvarEmpresa} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar dados da empresa'}
          </button>
        </div>
      )}
    </Layout>
  )
}

const s: Record<string, CSSProperties> = {
  loading:    { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' },
  titulo:     { fontSize:20, fontWeight:700, color:'#111' },
  sub:        { fontSize:12, color:'#6b7280', marginTop:2 },
  card:       { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' },
  cardTit:    { fontSize:13, fontWeight:600, color:'#111', marginBottom:12 },
  row2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 },
  row3:       { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 },
  label:      { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 },
  input:      { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' },
  btnPrimary: { padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'8px 16px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer', color:'#374151' },
  sucessoBox: { background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  erroBox:    { background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
}
