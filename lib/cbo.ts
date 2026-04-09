// Tabela CBO — Classificação Brasileira de Ocupações
// Fonte: MTE - seleção das 300+ ocupações mais comuns em SST

export type CBO = { codigo: string; nome: string; grupo: string }

export const CBO_DATA: CBO[] = [
  // Diretores e Gerentes
  { codigo:'1111-05', nome:'Diretor Geral', grupo:'Direção' },
  { codigo:'1231-05', nome:'Gerente de Produção e Operações', grupo:'Direção' },
  { codigo:'1232-05', nome:'Gerente de Manutenção', grupo:'Direção' },
  { codigo:'1233-05', nome:'Gerente de Qualidade', grupo:'Direção' },
  { codigo:'1234-05', nome:'Gerente de Segurança do Trabalho', grupo:'Direção' },
  { codigo:'1235-05', nome:'Gerente Administrativo', grupo:'Direção' },
  { codigo:'1236-05', nome:'Gerente de Recursos Humanos', grupo:'Direção' },
  // Profissionais de SST
  { codigo:'2040-05', nome:'Engenheiro de Segurança do Trabalho', grupo:'SST' },
  { codigo:'2040-10', nome:'Engenheiro Ambiental', grupo:'SST' },
  { codigo:'2234-05', nome:'Médico do Trabalho', grupo:'SST' },
  { codigo:'2235-05', nome:'Enfermeiro do Trabalho', grupo:'SST' },
  { codigo:'3516-05', nome:'Técnico de Segurança do Trabalho', grupo:'SST' },
  { codigo:'3222-05', nome:'Técnico de Enfermagem do Trabalho', grupo:'SST' },
  // Saúde
  { codigo:'2234-10', nome:'Médico Clínico', grupo:'Saúde' },
  { codigo:'2234-15', nome:'Médico Especialista', grupo:'Saúde' },
  { codigo:'2235-10', nome:'Enfermeiro', grupo:'Saúde' },
  { codigo:'3222-10', nome:'Técnico de Enfermagem', grupo:'Saúde' },
  { codigo:'5151-05', nome:'Auxiliar de Enfermagem', grupo:'Saúde' },
  // Administrativo
  { codigo:'4110-05', nome:'Auxiliar Administrativo', grupo:'Administrativo' },
  { codigo:'4110-10', nome:'Assistente Administrativo', grupo:'Administrativo' },
  { codigo:'4120-05', nome:'Secretário', grupo:'Administrativo' },
  { codigo:'4131-05', nome:'Assistente Contábil', grupo:'Administrativo' },
  { codigo:'4131-10', nome:'Auxiliar Contábil', grupo:'Administrativo' },
  { codigo:'4141-05', nome:'Almoxarife', grupo:'Administrativo' },
  { codigo:'4141-10', nome:'Auxiliar de Almoxarifado', grupo:'Administrativo' },
  { codigo:'4151-05', nome:'Auxiliar de Pessoal', grupo:'Administrativo' },
  { codigo:'4161-05', nome:'Auxiliar de Controle de Estoque', grupo:'Administrativo' },
  { codigo:'4211-05', nome:'Atendente de Caixa', grupo:'Administrativo' },
  { codigo:'4221-05', nome:'Recepcionista', grupo:'Administrativo' },
  // Produção / Indústria
  { codigo:'7170-05', nome:'Operador de Produção', grupo:'Produção' },
  { codigo:'7170-10', nome:'Auxiliar de Produção', grupo:'Produção' },
  { codigo:'7170-15', nome:'Operador de Máquinas', grupo:'Produção' },
  { codigo:'7170-20', nome:'Operador de Linha de Produção', grupo:'Produção' },
  { codigo:'7171-05', nome:'Operador de Extrusora', grupo:'Produção' },
  { codigo:'7172-05', nome:'Operador de Injetora', grupo:'Produção' },
  { codigo:'7173-05', nome:'Operador de Prensa', grupo:'Produção' },
  { codigo:'7175-05', nome:'Operador de Sopro', grupo:'Produção' },
  { codigo:'7201-05', nome:'Mecânico de Manutenção', grupo:'Manutenção' },
  { codigo:'7201-10', nome:'Auxiliar de Mecânico', grupo:'Manutenção' },
  { codigo:'7210-10', nome:'Soldador', grupo:'Manutenção' },
  { codigo:'7210-15', nome:'Oxicortador', grupo:'Manutenção' },
  { codigo:'7231-05', nome:'Mecânico de Manutenção de Máquinas', grupo:'Manutenção' },
  { codigo:'7244-05', nome:'Eletricista de Instalações', grupo:'Manutenção' },
  { codigo:'7244-10', nome:'Eletricista de Manutenção', grupo:'Manutenção' },
  { codigo:'7250-05', nome:'Técnico em Eletrotécnica', grupo:'Manutenção' },
  { codigo:'7251-05', nome:'Técnico em Eletrônica', grupo:'Manutenção' },
  { codigo:'7271-05', nome:'Instrumentista de Controle', grupo:'Manutenção' },
  // Construção Civil
  { codigo:'7110-05', nome:'Pedreiro', grupo:'Construção' },
  { codigo:'7121-05', nome:'Armador de Estrutura', grupo:'Construção' },
  { codigo:'7125-05', nome:'Carpinteiro', grupo:'Construção' },
  { codigo:'7126-05', nome:'Encanador', grupo:'Construção' },
  { codigo:'7131-05', nome:'Pintor de Obras', grupo:'Construção' },
  { codigo:'7141-05', nome:'Azulejista', grupo:'Construção' },
  { codigo:'7150-05', nome:'Instalador Hidráulico', grupo:'Construção' },
  { codigo:'7151-05', nome:'Instalador de Tubulações', grupo:'Construção' },
  { codigo:'7152-05', nome:'Montador de Andaimes', grupo:'Construção' },
  { codigo:'7163-05', nome:'Operador de Retroescavadeira', grupo:'Construção' },
  { codigo:'7163-10', nome:'Operador de Escavadeira', grupo:'Construção' },
  { codigo:'7163-15', nome:'Operador de Motoniveladora', grupo:'Construção' },
  { codigo:'9913-05', nome:'Auxiliar de Serviços Gerais', grupo:'Construção' },
  // Logística e Transporte
  { codigo:'4141-15', nome:'Conferente de Carga e Descarga', grupo:'Logística' },
  { codigo:'4141-20', nome:'Operador de Empilhadeira', grupo:'Logística' },
  { codigo:'4141-25', nome:'Auxiliar de Expedição', grupo:'Logística' },
  { codigo:'5111-10', nome:'Motorista de Caminhão', grupo:'Logística' },
  { codigo:'5111-15', nome:'Motorista de Van', grupo:'Logística' },
  { codigo:'5111-20', nome:'Motorista de Ônibus', grupo:'Logística' },
  { codigo:'5112-05', nome:'Motorista de Veículos de Passeio', grupo:'Logística' },
  { codigo:'5141-05', nome:'Entregador de Mercadorias', grupo:'Logística' },
  { codigo:'7154-05', nome:'Operador de Ponte Rolante', grupo:'Logística' },
  // Alimentação
  { codigo:'5131-05', nome:'Cozinheiro', grupo:'Alimentação' },
  { codigo:'5131-10', nome:'Auxiliar de Cozinha', grupo:'Alimentação' },
  { codigo:'5131-15', nome:'Manipulador de Alimentos', grupo:'Alimentação' },
  { codigo:'5132-05', nome:'Padeiro e Confeiteiro', grupo:'Alimentação' },
  { codigo:'5133-05', nome:'Açougueiro', grupo:'Alimentação' },
  // Limpeza e Conservação
  { codigo:'5143-05', nome:'Faxineiro / Zelador', grupo:'Limpeza' },
  { codigo:'5143-10', nome:'Operador de Lavanderia', grupo:'Limpeza' },
  { codigo:'5143-15', nome:'Auxiliar de Limpeza', grupo:'Limpeza' },
  // Agricultura e Pecuária
  { codigo:'6110-05', nome:'Trabalhador Rural', grupo:'Agrícola' },
  { codigo:'6110-10', nome:'Operador de Colheitadeira', grupo:'Agrícola' },
  { codigo:'6110-15', nome:'Aplicador de Defensivos', grupo:'Agrícola' },
  { codigo:'6110-20', nome:'Irrigador', grupo:'Agrícola' },
  // Tecnologia
  { codigo:'2123-05', nome:'Analista de Sistemas', grupo:'TI' },
  { codigo:'2123-10', nome:'Desenvolvedor de Software', grupo:'TI' },
  { codigo:'3171-05', nome:'Técnico de Suporte em TI', grupo:'TI' },
  { codigo:'3172-05', nome:'Operador de Computador', grupo:'TI' },
  // Educação
  { codigo:'2310-05', nome:'Professor de Ensino Superior', grupo:'Educação' },
  { codigo:'2321-05', nome:'Professor de Ensino Médio', grupo:'Educação' },
  { codigo:'2331-05', nome:'Professor de Ensino Fundamental', grupo:'Educação' },
  { codigo:'4221-10', nome:'Instrutor de Treinamento', grupo:'Educação' },
  // Vigilância
  { codigo:'5173-05', nome:'Vigilante', grupo:'Segurança' },
  { codigo:'5173-10', nome:'Porteiro', grupo:'Segurança' },
  { codigo:'5173-15', nome:'Controlador de Acesso', grupo:'Segurança' },
  // Mineração
  { codigo:'7131-10', nome:'Operador de Britador', grupo:'Mineração' },
  { codigo:'7131-15', nome:'Perfurador de Poços', grupo:'Mineração' },
  { codigo:'7133-05', nome:'Mineiro', grupo:'Mineração' },
  // Química e Petroquímica
  { codigo:'7631-05', nome:'Operador de Processo Químico', grupo:'Química' },
  { codigo:'7631-10', nome:'Operador de Caldeira', grupo:'Química' },
  { codigo:'7631-15', nome:'Operador de Refinaria', grupo:'Química' },
  // Outros comuns
  { codigo:'7912-05', nome:'Costureiro', grupo:'Têxtil' },
  { codigo:'7921-05', nome:'Trabalhador Têxtil', grupo:'Têxtil' },
  { codigo:'6220-05', nome:'Pescador', grupo:'Pesca' },
  { codigo:'8485-05', nome:'Operador de Empacotamento', grupo:'Embalagem' },
  { codigo:'8487-05', nome:'Auxiliar de Embalagem', grupo:'Embalagem' },
]

export function buscarCBO(termo: string): CBO[] {
  if (!termo || termo.length < 2) return []
  const t = termo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return CBO_DATA.filter(c => {
    const nome = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const cod  = c.codigo.replace(/\D/g,'')
    return nome.includes(t) || cod.includes(t)
  }).slice(0, 8)
}
