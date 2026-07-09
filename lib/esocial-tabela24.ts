// Códigos da Tabela 24 do eSocial (Agentes Nocivos) — lista curada e deduplicada
// a partir dos códigos já usados em pages/api/ler-documento.js (TABELA24), só
// para sugestão (datalist) no campo "Código eSocial" do inventário do PGR.
// Não importa nem é importado por ler-documento.js/xml-generator.js.

export const ESOCIAL_TABELA24: { codigo: string; nome: string }[] = [
  { codigo: '01.01.001', nome: 'Ruído contínuo ou intermitente' },
  { codigo: '01.01.002', nome: 'Ruído de impacto' },
  { codigo: '01.02.001', nome: 'Calor' },
  { codigo: '01.03.001', nome: 'Radiações ionizantes' },
  { codigo: '01.04.001', nome: 'Vibração de corpo inteiro' },
  { codigo: '01.04.002', nome: 'Vibração de mãos e braços' },
  { codigo: '01.05.001', nome: 'Frio' },
  { codigo: '01.06.001', nome: 'Pressão hiperbárica (mergulho)' },
  { codigo: '01.07.001', nome: 'Umidade' },
  { codigo: '02.01.001', nome: 'Arsênio e seus compostos' },
  { codigo: '02.02.001', nome: 'Asbesto (amianto)' },
  { codigo: '02.03.001', nome: 'Benzeno e compostos aromáticos (tolueno, xileno)' },
  { codigo: '02.04.001', nome: 'Chumbo e seus compostos' },
  { codigo: '02.05.001', nome: 'Carvão mineral' },
  { codigo: '02.06.001', nome: 'Cromo e seus compostos' },
  { codigo: '02.07.001', nome: 'Fósforo e compostos (organofosforados)' },
  { codigo: '02.08.001', nome: 'Hidrocarbonetos e outros compostos de carbono' },
  { codigo: '02.09.001', nome: 'Manganês e seus compostos' },
  { codigo: '02.10.001', nome: 'Mercúrio e seus compostos' },
  { codigo: '02.11.001', nome: 'Sílica livre cristalizada (poeira)' },
  { codigo: '02.14.001', nome: 'Agrotóxicos / praguicidas' },
  { codigo: '02.18.001', nome: 'Gases e vapores tóxicos' },
  { codigo: '02.21.001', nome: 'Substâncias, compostos ou produtos explosivos' },
  { codigo: '03.01.001', nome: 'Agentes biológicos (vírus, bactérias, fungos, parasitas)' },
  { codigo: '03.01.002', nome: 'Resíduos e/ou objetos infectocontagiantes (lixo, esgoto)' },
  { codigo: '09.01.001', nome: 'Ausência de agente nocivo ou de atividade especial' },
]
