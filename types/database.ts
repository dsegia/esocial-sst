export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          cnpj: string
          razao_social: string
          cnae: string | null
          grau_risco: number | null
          resp_tecnico: string | null
          resp_conselho: string | null
          resp_registro: string | null
          resp_nome: string | null
          resp_cpf: string | null
          resp_cargo: string | null
          tipo_acesso: 'propria' | 'terceiro'
          ativo: boolean
          bloqueado: boolean | null
          criado_em: string
          atualizado_em: string
          endereco: string | null
          municipio: string | null
          uf: string | null
          cep: string | null
          plano: 'trial' | 'micro' | 'starter' | 'pro' | 'professional' | 'business' | 'enterprise' | 'cancelado'
          plano_expira_em: string | null
          trial_inicio: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_metered_item_id: string | null
          max_funcionarios: number
          creditos_restantes: number
          creditos_incluidos: number
          cert_digital_validade: string | null
          cert_tipo: string | null
          cert_titular: string | null
          cert_configurado_em: string | null
          ecac_cnpj_procurador: string | null
          ecac_nome_procurador: string | null
          cert_pfx_path: string | null
          cert_senha_enc: string | null
        }
        Insert: Omit<Database['public']['Tables']['empresas']['Row'], 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Database['public']['Tables']['empresas']['Insert']>
        Relationships: []
      }
      funcionarios: {
        Row: {
          id: string
          empresa_id: string
          nome: string
          cpf: string
          data_nasc: string | null
          data_adm: string | null
          matricula_esocial: string
          funcao: string | null
          cbo: string | null
          cod_cbo: string | null
          setor: string | null
          salario: number | null
          vinculo: string | null
          turno: string | null
          ativo: boolean
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['funcionarios']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['funcionarios']['Insert']>
        Relationships: []
      }
      asos: {
        Row: {
          id: string
          funcionario_id: string
          empresa_id: string
          tipo_aso: 'admissional' | 'periodico' | 'retorno' | 'mudanca' | 'demissional' | 'monitoracao'
          data_exame: string
          prox_exame: string | null
          conclusao: 'apto' | 'inapto' | 'apto_restricao'
          medico_nome: string | null
          medico_crm: string | null
          exames: ExameItem[]
          riscos: string[]
          pdf_path: string | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['asos']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['asos']['Insert']>
        Relationships: []
      }
      ltcats: {
        Row: {
          id: string
          empresa_id: string
          data_emissao: string
          data_vigencia: string
          prox_revisao: string | null
          resp_nome: string
          resp_conselho: string | null
          resp_registro: string | null
          ghes: GHE[]
          pdf_path: string | null
          ativo: boolean
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['ltcats']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['ltcats']['Insert']>
        Relationships: []
      }
      cats: {
        Row: {
          id: string
          funcionario_id: string
          empresa_id: string
          tipo_cat: 'tipico' | 'trajeto' | 'doenca'
          dt_acidente: string
          hora_acidente: string | null
          cid: string
          natureza_lesao: string | null
          parte_corpo: string | null
          agente_causador: string | null
          descricao: string | null
          houve_morte: boolean
          dt_obito: string | null
          dias_afastamento: number | null
          atendimento: AtendimentoCAT
          testemunhas: Testemunha[]
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['cats']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['cats']['Insert']>
        Relationships: []
      }
      transmissoes: {
        Row: {
          id: string
          empresa_id: string
          funcionario_id: string | null
          evento: 'S-2210' | 'S-2220' | 'S-2221' | 'S-2240'
          referencia_id: string | null
          referencia_tipo: 'aso' | 'cat' | 'ltcat' | null
          status: 'pendente' | 'enviado' | 'rejeitado' | 'lote' | 'cancelado'
          recibo: string | null
          xml_path: string | null
          resposta_govbr: Record<string, unknown> | null
          erro_codigo: string | null
          erro_descricao: string | null
          tentativas: number
          lote_id: string | null
          ambiente: string | null
          dt_envio: string | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['transmissoes']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['transmissoes']['Insert']>
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          empresa_id: string
          nome: string
          email: string | null
          perfil: 'admin' | 'operador' | 'visualizador'
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['usuarios']['Row'], 'criado_em'>
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>
        Relationships: []
      }
      usuario_empresas: {
        Row: {
          usuario_id: string
          empresa_id: string
          perfil: 'admin' | 'operador' | 'visualizador'
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['usuario_empresas']['Row'], 'criado_em'>
        Update: Partial<Database['public']['Tables']['usuario_empresas']['Insert']>
        Relationships: []
      }
      pcmso_programa: {
        Row: {
          id: string
          empresa_id: string
          funcao: string | null
          atualizado_em: string
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['pcmso_programa']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['pcmso_programa']['Insert']>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_plano_empresa: {
        Args: { p_empresa_id: string }
        Returns: {
          plano: string
          plano_expira_em: string | null
          trial_ativo: boolean
          trial_dias_restantes: number
          qtd_funcionarios: number
          tem_stripe: boolean
        }
      }
      get_alertas_vencimento: {
        Args: { p_empresa_id: string }
        Returns: Array<{
          funcionario_id: string
          nome: string
          matricula: string
          setor: string
          tipo_alerta: string
          data_venc: string
          dias_restantes: number
        }>
      }
      verificar_duplicidade: {
        Args: { p_empresa_id: string; p_funcionario_id: string; p_evento: string }
        Returns: boolean
      }
    }
  }
}

// Tipos auxiliares
export type ExameItem = { nome: string; resultado: 'Normal' | 'Alterado' | 'Pendente' }
export type GHE = {
  id: number
  nome: string
  setor: string
  qtd_trabalhadores: number
  aposentadoria_especial: boolean
  agentes: AgenteRisco[]
  epc: EPC[]
  epi: EPI[]
}
export type AgenteRisco = { tipo: 'fis' | 'qui' | 'bio' | 'erg'; nome: string; valor: string; limite: string; supera_lt: boolean }
export type EPC = { nome: string; eficaz: boolean }
export type EPI = { nome: string; ca: string; eficaz: boolean }
export type AtendimentoCAT = { unidade?: string; cnpj?: string; data?: string; hora?: string; tipo?: string; medico?: string; crm?: string; obs?: string }
export type Testemunha = { nome: string; cpf: string }

// Tipos de retorno frequentes
export type Funcionario = Database['public']['Tables']['funcionarios']['Row']
export type ASO = Database['public']['Tables']['asos']['Row']
export type LTCAT = Database['public']['Tables']['ltcats']['Row']
export type CAT = Database['public']['Tables']['cats']['Row']
export type Transmissao = Database['public']['Tables']['transmissoes']['Row']
export type Empresa = Database['public']['Tables']['empresas']['Row']

// Plano / assinatura — plano único por vidas ativas (ver lib/vidas-planos.ts para as faixas)
export type TipoPlano = 'trial' | 'vidas' | 'cancelado'
export type PlanoStatus = {
  plano: TipoPlano
  plano_expira_em: string | null
  trial_ativo: boolean
  trial_dias_restantes: number
  qtd_funcionarios: number
  tem_stripe: boolean
}

export const PLANOS: Record<TipoPlano, { label: string; cor: string }> = {
  trial:     { label: 'Trial',     cor: '#9ca3af' },
  vidas:     { label: 'Por Vidas', cor: '#185FA5' },
  cancelado: { label: 'Cancelado', cor: '#ef4444' },
}
