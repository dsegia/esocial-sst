import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { getEmpresaId, getEmpresaIdValida } from '../lib/empresa'
import {
  ESOCIAL_TABELA13_PARTE_CORPO,
  ESOCIAL_TABELA14_AGENTE_CAUSADOR,
  ESOCIAL_TABELA15_SITUACAO_GERADORA,
  ESOCIAL_TABELA17_NATUREZA_LESAO,
  TP_CAT,
  INICIAT_CAT,
  TP_LOCAL_ACIDENTE,
  LATERALIDADE,
  IDE_OC,
} from '../lib/esocial-tabela-cat'

const TIPOS_CAT = [
  { v: 'tipico', l: 'Acidente típico', desc: 'Ocorreu durante o exercício da atividade profissional' },
  { v: 'trajeto', l: 'Acidente de trajeto', desc: 'Percurso entre residência e trabalho' },
  { v: 'doenca', l: 'Doença ocupacional', desc: 'Doença causada ou agravada pelo trabalho' },
]

const TIPO_LBL = { tipico: 'Acidente típico', trajeto: 'Acidente de trajeto', doenca: 'Doença ocupacional' }
const NATUREZA_LBL = { inicial: 'Inicial', reabertura: 'Reabertura', obito: 'Comunicação de óbito' }

const FORM_INICIAL = {
  funcionario_id: '',
  natureza_cat: 'inicial',
  nr_rec_cat_origem: '',
  dt_acidente: '',
  hora_acidente: '',
  hrs_trab_antes_acid: '',
  cid: '',
  cod_lesao: '',
  descricao: '',
  cod_parte_atingida: '',
  lateralidade: 'na',
  cod_agente_causador: '',
  cod_sit_geradora: '',
  houve_morte: false,
  dt_obito: '',
  ind_comun_policia: false,
  iniciat_cat: 'empregador',
  ult_dia_trab: '',
  ind_afastamento: false,
  dias_afastamento: '',
  ind_internacao: false,
  local_tpLocal: '1',
  local_dscLocal: '',
  local_dscLograd: '',
  local_nrLograd: '',
  local_complemento: '',
  local_bairro: '',
  local_cep: '',
  local_codMunic: '',
  local_uf: '',
  local_pais: '',
  local_codPostal: '',
  med_unidade: '',
  med_data: '',
  med_hora: '',
  med_medico: '',
  med_crm: '',
  conselho_medico: 'crm',
}

export default function S2210() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState('')
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [funcSel, setFuncSel] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const [tipoCat, setTipoCat] = useState('')
  const [cats, setCats] = useState<any[]>([])
  const [abaAtiva, setAbaAtiva] = useState<'lista'|'novo'>('lista')
  const [form, setForm] = useState({ ...FORM_INICIAL })

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: user } = await supabase.from('usuarios').select('empresa_id').eq('id', session.user.id).single()
    if (!user) { router.push('/login'); return }
    const empId = await getEmpresaIdValida(supabase, session.user.id, user.empresa_id)
    setEmpresaId(empId)
    const { data: funcs } = await supabase.from('funcionarios').select('id,nome,cpf,matricula_esocial,funcao,setor').eq('empresa_id', empId).eq('ativo', true).order('nome')
    setFuncionarios(funcs || [])
    await carregarCats(empId)
    setCarregando(false)
  }

  async function carregarCats(eId: string) {
    const { data } = await supabase
      .from('cats')
      .select('id, tipo_cat, natureza_cat, dt_acidente, cid, houve_morte, criado_em, funcionarios(nome, matricula_esocial), transmissoes(status, recibo)')
      .eq('empresa_id', eId)
      .order('dt_acidente', { ascending: false })
      .limit(50)
    setCats(data || [])
  }

  function selecionarFunc(id: string) {
    setForm(f => ({ ...f, funcionario_id: id }))
    setFuncSel(funcionarios.find(x => x.id === id) || null)
  }

  function upd(campo: string, valor: any) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function salvar(e: FormEvent) {
    e.preventDefault(); setErro(''); setSucesso(''); setSalvando(true)
    if (!tipoCat) { setErro('Selecione o tipo de CAT.'); setSalvando(false); return }
    if (!form.funcionario_id) { setErro('Selecione o funcionário.'); setSalvando(false); return }
    if (!form.dt_acidente) { setErro('Informe a data do acidente.'); setSalvando(false); return }
    if (!form.cid) { setErro('Informe o CID-10.'); setSalvando(false); return }
    if (!/^\d{9}$/.test(form.cod_sit_geradora)) { setErro('Selecione a situação geradora (código de 9 dígitos, Tabela 15).'); setSalvando(false); return }
    if (!/^\d{9}$/.test(form.cod_parte_atingida)) { setErro('Selecione a parte do corpo atingida (código de 9 dígitos, Tabela 13).'); setSalvando(false); return }
    if (!/^\d{9}$/.test(form.cod_agente_causador)) { setErro('Selecione o agente causador (código de 9 dígitos, Tabela 14).'); setSalvando(false); return }
    if (!/^\d{9}$/.test(form.cod_lesao)) { setErro('Selecione a natureza da lesão (código de 9 dígitos, Tabela 17).'); setSalvando(false); return }
    if (!form.local_dscLograd.trim()) { setErro('Informe o logradouro do local do acidente.'); setSalvando(false); return }
    if (!form.local_nrLograd.trim()) { setErro('Informe o número do logradouro (use S/N se não houver).'); setSalvando(false); return }
    if (!form.med_hora) { setErro('Informe a hora do atendimento médico.'); setSalvando(false); return }
    if (!form.med_medico.trim()) { setErro('Informe o nome do médico/dentista.'); setSalvando(false); return }
    if (!form.med_crm.trim()) { setErro('Informe o número de inscrição no conselho de classe.'); setSalvando(false); return }
    if (tipoCat !== 'doenca' && !form.hora_acidente) { setErro('Informe a hora do acidente (obrigatória para acidente típico/trajeto).'); setSalvando(false); return }
    if (tipoCat !== 'doenca' && !form.hrs_trab_antes_acid) { setErro('Informe as horas trabalhadas antes do acidente (obrigatório para acidente típico/trajeto).'); setSalvando(false); return }
    if (!form.ult_dia_trab) { setErro('Informe o último dia trabalhado.'); setSalvando(false); return }
    if (form.houve_morte && !form.dt_obito) { setErro('Informe a data do óbito.'); setSalvando(false); return }
    if (form.natureza_cat !== 'inicial' && !/^1\.\d\.\d{19}$/.test(form.nr_rec_cat_origem.trim())) { setErro('Número do recibo da CAT anterior inválido. Formato: 1.N.19 dígitos (ex: 1.2.1234567890123456789).'); setSalvando(false); return }

    const { data: cat, error: catErr } = await supabase.from('cats').insert({
      funcionario_id: form.funcionario_id,
      empresa_id: empresaId,
      tipo_cat: tipoCat,
      natureza_cat: form.natureza_cat,
      nr_rec_cat_origem: form.nr_rec_cat_origem || null,
      dt_acidente: form.dt_acidente,
      hora_acidente: form.hora_acidente || null,
      hrs_trab_antes_acid: form.hrs_trab_antes_acid || null,
      cid: form.cid,
      cod_lesao: form.cod_lesao,
      descricao: form.descricao,
      cod_parte_atingida: form.cod_parte_atingida,
      lateralidade: form.lateralidade,
      cod_agente_causador: form.cod_agente_causador,
      cod_sit_geradora: form.cod_sit_geradora,
      houve_morte: form.houve_morte,
      dt_obito: form.dt_obito || null,
      ind_comun_policia: form.ind_comun_policia,
      iniciat_cat: form.iniciat_cat,
      ult_dia_trab: form.ult_dia_trab || null,
      ind_afastamento: form.ind_afastamento,
      dias_afastamento: form.dias_afastamento ? parseInt(form.dias_afastamento) : null,
      ind_internacao: form.ind_internacao,
      local_acidente: {
        tpLocal: form.local_tpLocal,
        dscLocal: form.local_dscLocal,
        dscLograd: form.local_dscLograd,
        nrLograd: form.local_nrLograd,
        complemento: form.local_complemento,
        bairro: form.local_bairro,
        cep: form.local_cep,
        codMunic: form.local_codMunic,
        uf: form.local_uf,
        pais: form.local_pais,
        codPostal: form.local_codPostal,
      },
      conselho_medico: form.conselho_medico,
      atendimento: { unidade: form.med_unidade, data: form.med_data, hora: form.med_hora, medico: form.med_medico, crm: form.med_crm },
      testemunhas: [],
    }).select().single()

    if (catErr) { setErro('Erro ao salvar: ' + catErr.message); setSalvando(false); return }

    await supabase.from('transmissoes').insert({
      empresa_id: empresaId,
      funcionario_id: form.funcionario_id,
      evento: 'S-2210',
      referencia_id: cat.id,
      referencia_tipo: 'cat',
      status: 'pendente',
      tentativas: 0,
      ambiente: 'producao',
    })

    setSucesso('CAT salva! Transmissão S-2210 criada como pendente.')
    setForm({ ...FORM_INICIAL })
    setFuncSel(null); setTipoCat('')
    setSalvando(false)
    setAbaAtiva('lista')
    carregarCats(empresaId)
  }

  const inp: CSSProperties = { width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #d1d5db', borderRadius:8, background:'#fff', color:'#111', boxSizing:'border-box', fontFamily:'inherit' }
  const lbl: CSSProperties = { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 }
  const card: CSSProperties = { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' }
  const hint: CSSProperties = { fontSize:11, color:'#9ca3af', marginTop:3 }

  if (carregando) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'sans-serif', fontSize:14, color:'#6b7280' }}>Carregando...</div>

  const ST_COR: Record<string,[string,string]> = { enviado:['#EAF3DE','#27500A'], pendente:['#FAEEDA','#633806'], rejeitado:['#FCEBEB','#791F1F'] }

  return (
    <Layout pagina="s2210">
      <Head><title>S-2210 CAT — eSocial SST</title></Head>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'#111' }}>S-2210 — CAT</div>
          <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>Comunicação de Acidente de Trabalho</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ background:'#FCEBEB', color:'#791F1F', padding:'4px 12px', borderRadius:99, fontSize:12, fontWeight:600 }}>S-2210</span>
          <button onClick={() => setAbaAtiva('novo')} style={{ padding:'7px 14px', background:'#E24B4A', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>+ Nova CAT</button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display:'flex', gap:2, marginBottom:16, borderBottom:'1px solid #e5e7eb' }}>
        {(['lista','novo'] as const).map(aba => (
          <button key={aba} onClick={() => setAbaAtiva(aba)}
            style={{ padding:'8px 16px', fontSize:13, fontWeight:500, border:'none', background:'none', cursor:'pointer',
              color: abaAtiva===aba ? '#E24B4A' : '#6b7280',
              borderBottom: abaAtiva===aba ? '2px solid #E24B4A' : '2px solid transparent',
              marginBottom:-1 }}>
            {aba === 'lista' ? `Registros (${cats.length})` : 'Nova CAT'}
          </button>
        ))}
      </div>

      {sucesso && <div style={{ background:'#EAF3DE', color:'#27500A', border:'0.5px solid #C0DD97', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{sucesso} <a href="/historico" style={{ color:'#085041', fontWeight:500 }}>Ver histórico →</a></div>}
      {erro && <div style={{ background:'#FCEBEB', color:'#791F1F', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{erro}</div>}

      {/* Lista de CATs */}
      {abaAtiva === 'lista' && (
        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
          {cats.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
              Nenhuma CAT registrada ainda.
              <div style={{ marginTop:12 }}>
                <button onClick={() => setAbaAtiva('novo')} style={{ padding:'8px 16px', background:'#E24B4A', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>Registrar primeira CAT</button>
              </div>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f9fafb' }}>
                  {['Funcionário','Tipo','Natureza','Data acidente','CID','Óbito','Status','Ações'].map(h => (
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'#6b7280', borderBottom:'0.5px solid #e5e7eb', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cats.map((c: any) => {
                  const tx = Array.isArray(c.transmissoes) ? c.transmissoes[0] : c.transmissoes
                  const [stBg, stCor] = ST_COR[tx?.status] || ['#f3f4f6','#6b7280']
                  return (
                    <tr key={c.id} style={{ borderBottom:'0.5px solid #f3f4f6' }}>
                      <td style={{ padding:'10px 12px' }}>
                        <div style={{ fontWeight:500, color:'#111' }}>{c.funcionarios?.nome || '—'}</div>
                        <div style={{ fontSize:11, color:'#9ca3af' }}>{c.funcionarios?.matricula_esocial || ''}</div>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:'#FCEBEB', color:'#791F1F' }}>
                          {TIPO_LBL[c.tipo_cat as keyof typeof TIPO_LBL] || c.tipo_cat}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:12, color:'#374151' }}>
                        {NATUREZA_LBL[c.natureza_cat as keyof typeof NATUREZA_LBL] || 'Inicial'}
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:12, color:'#374151' }}>
                        {c.dt_acidente ? new Date(c.dt_acidente+'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:12, fontFamily:'monospace', color:'#374151' }}>{c.cid || '—'}</td>
                      <td style={{ padding:'10px 12px', textAlign:'center' }}>
                        {c.houve_morte ? <span style={{ color:'#E24B4A', fontWeight:700, fontSize:12 }}>Sim</span> : <span style={{ color:'#9ca3af', fontSize:12 }}>Não</span>}
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        {tx ? (
                          <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:stBg, color:stCor }}>
                            {tx.status === 'enviado' ? 'Enviado' : tx.status === 'pendente' ? 'Pendente' : 'Rejeitado'}
                          </span>
                        ) : <span style={{ color:'#9ca3af', fontSize:12 }}>—</span>}
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <button onClick={() => router.push('/historico')}
                          style={{ padding:'3px 10px', fontSize:11, background:'transparent', border:'0.5px solid #B5D4F4', borderRadius:6, cursor:'pointer', color:'#185FA5' }}>
                          Ver no histórico
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {abaAtiva === 'novo' && (

      <form onSubmit={salvar}>

        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:14 }}>Tipo de CAT</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            {TIPOS_CAT.map(t => (
              <div key={t.v} onClick={() => setTipoCat(t.v)}
                style={{ padding:14, border: tipoCat===t.v ? '2px solid #E24B4A' : '1px solid #e5e7eb', borderRadius:10, cursor:'pointer', background: tipoCat===t.v ? '#FCEBEB' : '#fff', transition:'all .15s' }}>
                <div style={{ fontSize:13, fontWeight:600, color: tipoCat===t.v ? '#791F1F' : '#374151' }}>{t.l}</div>
                <div style={{ fontSize:11, color:'#6b7280', marginTop:4, lineHeight:1.4 }}>{t.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns: form.natureza_cat === 'inicial' ? '1fr 1fr' : '1fr 1fr 1fr', gap:10 }}>
            <div><label style={lbl}>Natureza da CAT *</label>
              <select style={inp} value={form.natureza_cat} onChange={e=>upd('natureza_cat', e.target.value)}>
                {TP_CAT.map(o => <option key={o.v} value={o.v === '1' ? 'inicial' : o.v === '2' ? 'reabertura' : 'obito'}>{o.l}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Iniciativa da CAT *</label>
              <select style={inp} value={form.iniciat_cat} onChange={e=>upd('iniciat_cat', e.target.value)}>
                {INICIAT_CAT.map(o => <option key={o.v} value={o.v==='1'?'empregador':o.v==='2'?'ordem_judicial':'orgao_fiscalizador'}>{o.l}</option>)}
              </select>
            </div>
            {form.natureza_cat !== 'inicial' && (
              <div><label style={lbl}>Nº do recibo da CAT anterior *</label>
                <input style={inp} value={form.nr_rec_cat_origem} onChange={e=>upd('nr_rec_cat_origem', e.target.value)} placeholder="1.2.1234567890123456789" />
                <div style={hint}>Formato: 1.N.19 dígitos, como consta no recibo de entrega da CAT anterior</div>
              </div>
            )}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:14 }}>Trabalhador acidentado</div>
          <div style={{ marginBottom:10 }}>
            <label style={lbl}>Selecionar funcionário *</label>
            <select style={inp} value={form.funcionario_id} onChange={e => selecionarFunc(e.target.value)} required>
              <option value="">Selecione o funcionário...</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome} — {f.matricula_esocial}</option>)}
            </select>
          </div>
          {funcSel && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#FCEBEB', borderRadius:8 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'#E24B4A', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>
                {funcSel.nome.split(' ').map((p: string)=>p[0]).slice(0,2).join('').toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#111' }}>{funcSel.nome}</div>
                <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{funcSel.funcao} · {funcSel.setor} · {funcSel.matricula_esocial}</div>
              </div>
            </div>
          )}
        </div>

        {tipoCat && (
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:14 }}>
              Dados do {TIPOS_CAT.find(t=>t.v===tipoCat)?.l}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
              <div><label style={lbl}>Data do acidente *</label><input type="date" style={inp} value={form.dt_acidente} onChange={e=>upd('dt_acidente', e.target.value)} required /></div>
              {tipoCat !== 'doenca' && (
                <div><label style={lbl}>Hora do acidente *</label><input type="time" style={inp} value={form.hora_acidente} onChange={e=>upd('hora_acidente', e.target.value)} /></div>
              )}
              {tipoCat !== 'doenca' && (
                <div><label style={lbl}>Horas trabalhadas antes do acidente *</label><input type="time" style={inp} value={form.hrs_trab_antes_acid} onChange={e=>upd('hrs_trab_antes_acid', e.target.value)} /></div>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginBottom:10 }}>
              <div><label style={lbl}>CID-10 *</label><input style={inp} placeholder="Ex: S60.0" value={form.cid} onChange={e=>upd('cid', e.target.value)} required /></div>
              <div><label style={lbl}>Natureza da lesão * (Tabela 17)</label>
                <input style={inp} list="tabela17-lesao" value={form.cod_lesao} onChange={e=>upd('cod_lesao', e.target.value)} placeholder="Código de 9 dígitos" />
                <div style={hint}>{ESOCIAL_TABELA17_NATUREZA_LESAO.find(t=>t.codigo===form.cod_lesao)?.nome || 'Digite ou selecione o código'}</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:10 }}>
              <div><label style={lbl}>Parte do corpo atingida * (Tabela 13)</label>
                <input style={inp} list="tabela13-parte" value={form.cod_parte_atingida} onChange={e=>upd('cod_parte_atingida', e.target.value)} placeholder="Código de 9 dígitos" />
                <div style={hint}>{ESOCIAL_TABELA13_PARTE_CORPO.find(t=>t.codigo===form.cod_parte_atingida)?.nome || 'Digite ou selecione o código'}</div>
              </div>
              <div><label style={lbl}>Lateralidade *</label>
                <select style={inp} value={form.lateralidade} onChange={e=>upd('lateralidade', e.target.value)}>
                  <option value="na">Não aplicável</option>
                  <option value="esquerda">Esquerda</option>
                  <option value="direita">Direita</option>
                  <option value="ambos">Ambas</option>
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div><label style={lbl}>Agente causador * (Tabela 14)</label>
                <input style={inp} list="tabela14-agente" value={form.cod_agente_causador} onChange={e=>upd('cod_agente_causador', e.target.value)} placeholder="Código de 9 dígitos" />
                <div style={hint}>{ESOCIAL_TABELA14_AGENTE_CAUSADOR.find(t=>t.codigo===form.cod_agente_causador)?.nome || 'Digite ou selecione o código'}</div>
              </div>
              <div><label style={lbl}>Situação geradora * (Tabela 15)</label>
                <input style={inp} list="tabela15-situacao" value={form.cod_sit_geradora} onChange={e=>upd('cod_sit_geradora', e.target.value)} placeholder="Código de 9 dígitos" />
                <div style={hint}>{ESOCIAL_TABELA15_SITUACAO_GERADORA.find(t=>t.codigo===form.cod_sit_geradora)?.nome || 'Digite ou selecione o código'}</div>
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={lbl}>Descrição complementar da lesão</label>
              <textarea style={{...inp, minHeight:80, resize:'vertical', lineHeight:1.5}} placeholder="Descreva como ocorreu o acidente..." value={form.descricao} onChange={e=>upd('descricao', e.target.value)} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, alignItems:'center', marginBottom:10 }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#374151', cursor:'pointer' }}>
                <input type="checkbox" checked={form.houve_morte} onChange={e=>upd('houve_morte', e.target.checked)} />
                Houve óbito
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#374151', cursor:'pointer' }}>
                <input type="checkbox" checked={form.ind_comun_policia} onChange={e=>upd('ind_comun_policia', e.target.checked)} />
                Comunicado à polícia
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#374151', cursor:'pointer' }}>
                <input type="checkbox" checked={form.ind_afastamento} onChange={e=>upd('ind_afastamento', e.target.checked)} />
                Houve afastamento
              </label>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {form.houve_morte && (
                <div><label style={lbl}>Data do óbito *</label><input type="date" style={inp} value={form.dt_obito} onChange={e=>upd('dt_obito', e.target.value)} /></div>
              )}
              <div><label style={lbl}>Último dia trabalhado *</label><input type="date" style={inp} value={form.ult_dia_trab} onChange={e=>upd('ult_dia_trab', e.target.value)} /></div>
              <div><label style={lbl}>Dias de afastamento / tratamento</label>
                <input type="number" style={inp} min="0" placeholder="0" value={form.dias_afastamento} onChange={e=>upd('dias_afastamento', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {tipoCat && (
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:14 }}>Local do acidente</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginBottom:10 }}>
              <div><label style={lbl}>Tipo de local *</label>
                <select style={inp} value={form.local_tpLocal} onChange={e=>upd('local_tpLocal', e.target.value)}>
                  {TP_LOCAL_ACIDENTE.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Especificação do local</label>
                <input style={inp} placeholder="Ex: pátio, rampa de acesso, posto de trabalho..." value={form.local_dscLocal} onChange={e=>upd('local_dscLocal', e.target.value)} />
              </div>
            </div>
            {/* Logradouro/número são exigidos pelo XSD independente do tpLocal (mesmo no exterior) */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:10 }}>
              <div><label style={lbl}>Logradouro *</label><input style={inp} value={form.local_dscLograd} onChange={e=>upd('local_dscLograd', e.target.value)} placeholder="Rua, avenida..." /></div>
              <div><label style={lbl}>Número *</label><input style={inp} value={form.local_nrLograd} onChange={e=>upd('local_nrLograd', e.target.value)} placeholder="S/N se não houver" /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div><label style={lbl}>Complemento</label><input style={inp} value={form.local_complemento} onChange={e=>upd('local_complemento', e.target.value)} /></div>
              <div><label style={lbl}>Bairro</label><input style={inp} value={form.local_bairro} onChange={e=>upd('local_bairro', e.target.value)} /></div>
            </div>
            {form.local_tpLocal === '2' ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><label style={lbl}>País (código Tabela 06) *</label><input style={inp} value={form.local_pais} onChange={e=>upd('local_pais', e.target.value)} placeholder="Ex: 249 (EUA)" /></div>
                <div><label style={lbl}>Código postal *</label><input style={inp} value={form.local_codPostal} onChange={e=>upd('local_codPostal', e.target.value)} /></div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <div><label style={lbl}>CEP</label><input style={inp} value={form.local_cep} onChange={e=>upd('local_cep', e.target.value)} placeholder="00000-000" /></div>
                <div><label style={lbl}>Município (código IBGE)</label><input style={inp} value={form.local_codMunic} onChange={e=>upd('local_codMunic', e.target.value)} placeholder="7 dígitos" /></div>
                <div><label style={lbl}>UF</label><input style={inp} maxLength={2} value={form.local_uf} onChange={e=>upd('local_uf', e.target.value.toUpperCase())} placeholder="SP" /></div>
              </div>
            )}
          </div>
        )}

        {tipoCat && (
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:14 }}>Atendimento médico</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
              <div><label style={lbl}>Unidade de atendimento</label><input style={inp} placeholder="UPA, Hospital..." value={form.med_unidade} onChange={e=>upd('med_unidade', e.target.value)} /></div>
              <div><label style={lbl}>Data do atendimento</label><input type="date" style={inp} value={form.med_data} onChange={e=>upd('med_data', e.target.value)} /></div>
              <div><label style={lbl}>Hora do atendimento *</label><input type="time" style={inp} value={form.med_hora} onChange={e=>upd('med_hora', e.target.value)} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10, marginBottom:10 }}>
              <div><label style={lbl}>Médico/dentista assistente *</label><input style={inp} placeholder="Nome" value={form.med_medico} onChange={e=>upd('med_medico', e.target.value)} /></div>
              <div><label style={lbl}>Conselho de classe *</label>
                <select style={inp} value={form.conselho_medico} onChange={e=>upd('conselho_medico', e.target.value)}>
                  {IDE_OC.map(o => <option key={o.v} value={o.v==='1'?'crm':o.v==='2'?'cro':'rms'}>{o.l}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Nº de inscrição *</label><input style={inp} placeholder="Ex: 12345-SP" value={form.med_crm} onChange={e=>upd('med_crm', e.target.value)} /></div>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#374151', cursor:'pointer' }}>
              <input type="checkbox" checked={form.ind_internacao} onChange={e=>upd('ind_internacao', e.target.checked)} />
              Houve internação
            </label>
          </div>
        )}

        <div style={{ display:'flex', gap:10 }}>
          <button type="submit" disabled={salvando || !tipoCat} style={{ padding:'10px 20px', background:'#E24B4A', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', opacity:(salvando||!tipoCat)?0.5:1 }}>
            {salvando ? 'Salvando...' : 'Salvar CAT'}
          </button>
          <button type="button" onClick={() => setAbaAtiva('lista')} style={{ padding:'10px 20px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, color:'#374151', cursor:'pointer' }}>
            Cancelar
          </button>
        </div>

        <datalist id="tabela13-parte">
          {ESOCIAL_TABELA13_PARTE_CORPO.map(t => <option key={t.codigo} value={t.codigo}>{t.nome}</option>)}
        </datalist>
        <datalist id="tabela14-agente">
          {ESOCIAL_TABELA14_AGENTE_CAUSADOR.map(t => <option key={t.codigo} value={t.codigo}>{t.nome}</option>)}
        </datalist>
        <datalist id="tabela15-situacao">
          {ESOCIAL_TABELA15_SITUACAO_GERADORA.map(t => <option key={t.codigo} value={t.codigo}>{t.nome}</option>)}
        </datalist>
        <datalist id="tabela17-lesao">
          {ESOCIAL_TABELA17_NATUREZA_LESAO.map(t => <option key={t.codigo} value={t.codigo}>{t.nome}</option>)}
        </datalist>
      </form>
      )}
    </Layout>
  )
}
