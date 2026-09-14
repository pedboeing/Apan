export type TipoUsuario = 'TECNICO' | 'ATLETA';

export type Sexo = 'MASCULINO' | 'FEMININO';

export const SEXOS: Sexo[] = ['MASCULINO', 'FEMININO'];

export const SEXO_LABEL: Record<Sexo, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
};

// Piscina de 25m (curta) ou 50m (longa) — tempos não são comparáveis entre
// as duas, por isso todo recorde precisa dizer em qual piscina foi feito.
export type TamanhoPiscina = 'M25' | 'M50';

export const PISCINAS: TamanhoPiscina[] = ['M25', 'M50'];

export const PISCINA_LABEL: Record<TamanhoPiscina, string> = {
  M25: '25m',
  M50: '50m',
};

// Categoria por idade (tabela da CBDA usada pela APAN) — sempre calculada
// pelo backend a partir da data de nascimento, nunca escolhida manualmente.
// A idade que conta é a que o atleta completa NO ANO (não a idade exata na
// data de hoje), então a categoria muda quando o ano vira, não no
// aniversário.
export type Categoria =
  | 'PRE_MIRIM'
  | 'MIRIM_1'
  | 'MIRIM_2'
  | 'PETIZ_1'
  | 'PETIZ_2'
  | 'INFANTIL_1'
  | 'INFANTIL_2'
  | 'JUVENIL_1'
  | 'JUVENIL_2'
  | 'JUNIOR_1'
  | 'JUNIOR_2'
  | 'SENIOR';

export const CATEGORIAS: Categoria[] = [
  'PRE_MIRIM',
  'MIRIM_1',
  'MIRIM_2',
  'PETIZ_1',
  'PETIZ_2',
  'INFANTIL_1',
  'INFANTIL_2',
  'JUVENIL_1',
  'JUVENIL_2',
  'JUNIOR_1',
  'JUNIOR_2',
  'SENIOR',
];

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  PRE_MIRIM: 'Pré-Mirim',
  MIRIM_1: 'Mirim I',
  MIRIM_2: 'Mirim II',
  PETIZ_1: 'Petiz I',
  PETIZ_2: 'Petiz II',
  INFANTIL_1: 'Infantil I',
  INFANTIL_2: 'Infantil II',
  JUVENIL_1: 'Juvenil I',
  JUVENIL_2: 'Juvenil II',
  JUNIOR_1: 'Júnior I',
  JUNIOR_2: 'Júnior II',
  SENIOR: 'Sênior',
};

// Faixas de idade (ano de referência − ano de nascimento) só pra dar uma
// prévia no app antes de salvar — quem decide de verdade é o backend.
const FAIXAS_CATEGORIA_POR_IDADE: { idadeMinima: number; categoria: Categoria }[] = [
  { idadeMinima: 0, categoria: 'PRE_MIRIM' },
  { idadeMinima: 9, categoria: 'MIRIM_1' },
  { idadeMinima: 10, categoria: 'MIRIM_2' },
  { idadeMinima: 11, categoria: 'PETIZ_1' },
  { idadeMinima: 12, categoria: 'PETIZ_2' },
  { idadeMinima: 13, categoria: 'INFANTIL_1' },
  { idadeMinima: 14, categoria: 'INFANTIL_2' },
  { idadeMinima: 15, categoria: 'JUVENIL_1' },
  { idadeMinima: 16, categoria: 'JUVENIL_2' },
  { idadeMinima: 17, categoria: 'JUNIOR_1' },
  { idadeMinima: 18, categoria: 'JUNIOR_2' },
  { idadeMinima: 20, categoria: 'SENIOR' },
];

export function calcularCategoriaPrevia(dataNascimentoIso: string): Categoria | null {
  const ano = Number(dataNascimentoIso.slice(0, 4));
  if (!ano || dataNascimentoIso.length < 10) return null;

  const idadeNoAno = new Date().getFullYear() - ano;
  let categoria: Categoria = 'PRE_MIRIM';
  for (const faixa of FAIXAS_CATEGORIA_POR_IDADE) {
    if (idadeNoAno >= faixa.idadeMinima) categoria = faixa.categoria;
  }
  return categoria;
}

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  // Só existe (e só é true) pra um técnico com acesso especial de admin —
  // ver Tecnico.admin no schema do backend. Não tem toggle em lugar nenhum
  // da UI; sempre vem pronto do backend a partir do login/cadastro.
  admin: boolean;
};

export type ProvaPrincipal = {
  id: string;
  estilo: Estilo;
  distancia: number;
  ordem: number;
};

export type ProvasPrincipaisInput = {
  provas: { estilo: Estilo; distancia: number }[];
};

export type ZonaTreinamento = {
  zona: string;
  descricao: string;
  percentualMin: number;
  percentualMax: number;
  tempoRapidoCentesimos: number;
  tempoLentoCentesimos: number;
};

export type ProvaComZonas = {
  estilo: Estilo;
  distancia: number;
  melhorTempoCentesimos: number | null;
  zonas: ZonaTreinamento[];
};

export type TabelaReferenciaPorPiscina = {
  m25: ProvaComZonas[];
  m50: ProvaComZonas[];
};

export type PerfilAtleta = {
  id: string;
  categoria: Categoria;
  dataNascimento: string;
  // Opcional só porque contas cadastradas antes desse campo existir podem
  // não ter — cadastro e edição de perfil exigem o valor daqui pra frente.
  sexo: Sexo | null;
  provasPrincipais: ProvaPrincipal[];
};

export type UsuarioComPerfil = Usuario & {
  atleta: PerfilAtleta | null;
  tecnico: { id: string } | null;
};

export type AtualizarPerfilInput = {
  nome: string;
  email: string;
  dataNascimento?: string;
  sexo?: Sexo;
};

export type AlterarSenhaInput = {
  senhaAtual: string;
  novaSenha: string;
};

export type CadastroAtletaInput = {
  tipo: 'ATLETA';
  nome: string;
  email: string;
  senha: string;
  dataNascimento: string;
  sexo: Sexo;
};

export type CadastroTecnicoInput = {
  tipo: 'TECNICO';
  nome: string;
  email: string;
  senha: string;
  codigoConvite: string;
};

export type CadastroInput = CadastroAtletaInput | CadastroTecnicoInput;

export type FaseCiclo = 'BASE' | 'FORCA' | 'POTENCIA' | 'POLIMENTO';

export const FASES_CICLO: FaseCiclo[] = ['BASE', 'FORCA', 'POTENCIA', 'POLIMENTO'];

export const FASE_CICLO_LABEL: Record<FaseCiclo, string> = {
  BASE: 'Base',
  FORCA: 'Força',
  POTENCIA: 'Potência',
  POLIMENTO: 'Polimento',
};

// Pra criar um treino, o técnico escolhe o "grupo" pelo nome usado no dia a
// dia (ex: "Juvenil") em vez de I/II separado — essa subdivisão existe só
// pra classificação em competição (ver comentário de Categoria acima), não
// pra organizar quem treina junto. Selecionar um grupo marca as duas
// categorias correspondentes de uma vez em Treino.categorias.
export const GRUPOS_TREINO: { label: string; categorias: Categoria[] }[] = [
  { label: 'Pré-Mirim', categorias: ['PRE_MIRIM'] },
  { label: 'Mirim', categorias: ['MIRIM_1', 'MIRIM_2'] },
  { label: 'Petiz', categorias: ['PETIZ_1', 'PETIZ_2'] },
  { label: 'Infantil', categorias: ['INFANTIL_1', 'INFANTIL_2'] },
  { label: 'Juvenil', categorias: ['JUVENIL_1', 'JUVENIL_2'] },
  { label: 'Júnior', categorias: ['JUNIOR_1', 'JUNIOR_2'] },
  { label: 'Sênior', categorias: ['SENIOR'] },
];

const CATEGORIA_PARA_GRUPO: Record<Categoria, string> = GRUPOS_TREINO.reduce(
  (acc, grupo) => {
    for (const c of grupo.categorias) acc[c] = grupo.label;
    return acc;
  },
  {} as Record<Categoria, string>,
);

// Pro atleta, o grupo do treino (ex: "Juvenil") importa mais do que a
// subdivisão I/II — que é só pra classificação em competição. Usado na
// visualização do treino do lado do atleta; o técnico continua vendo a
// categoria exata (CATEGORIA_LABEL), porque ele precisa dessa precisão pra
// montar/gerenciar os treinos.
export function formatarGruposCategorias(categorias: Categoria[]): string {
  const grupos = categorias.map((c) => CATEGORIA_PARA_GRUPO[c]);
  return Array.from(new Set(grupos)).join(', ');
}

export type Treino = {
  id: string;
  data: string;
  categorias: Categoria[];
  objetivoSemana: string;
  faseCiclo: FaseCiclo;
  pseEsperada: number | null;
  aquecimento: string[];
  aquecimentoCronometrado: boolean;
  seriePreparatoria: string[];
  seriePreparatoriaCronometrada: boolean;
  seriePrincipal: string[];
  seriePrincipalCronometrada: boolean;
  soltura: string[];
  solturaCronometrada: boolean;
  // Enquanto falso, o atleta vê o treino na lista normalmente mas o
  // conteúdo (séries, PSE, tempos) fica bloqueado até o técnico liberar —
  // o backend (atleta.routes.ts) já esconde esses campos quando não
  // liberado, então o app do atleta nem chega a receber o conteúdo real.
  liberado: boolean;
  tecnicoId: string;
  criadoEm: string;
  atualizadoEm: string;
  // Só vêm preenchidos nas respostas de listagem/detalhe (GET) — quem criou
  // o treino, pra UI destacar "criado por Fulano" e decidir se mostra
  // edição/exclusão (lado técnico) ou o placeholder de bloqueio (lado
  // atleta). Ausentes nas respostas de criar/editar (POST/PUT), que são
  // sempre do próprio técnico logado.
  criadoPorUsuarioId?: string;
  criadoPorNome?: string;
};

export type TreinoInput = {
  data: string;
  categorias: Categoria[];
  objetivoSemana: string;
  faseCiclo: FaseCiclo;
  pseEsperada: number | null;
  aquecimento: string[];
  aquecimentoCronometrado: boolean;
  seriePreparatoria: string[];
  seriePreparatoriaCronometrada: boolean;
  seriePrincipal: string[];
  seriePrincipalCronometrada: boolean;
  soltura: string[];
  solturaCronometrada: boolean;
  liberado: boolean;
};

export type BlocoTreino = 'AQUECIMENTO' | 'SERIE_PREPARATORIA' | 'SERIE_PRINCIPAL' | 'SOLTURA';

export const BLOCOS: {
  key: BlocoTreino;
  label: string;
  textoField: 'aquecimento' | 'seriePreparatoria' | 'seriePrincipal' | 'soltura';
  cronometradoField:
    | 'aquecimentoCronometrado'
    | 'seriePreparatoriaCronometrada'
    | 'seriePrincipalCronometrada'
    | 'solturaCronometrada';
}[] = [
  { key: 'AQUECIMENTO', label: 'Aquecimento', textoField: 'aquecimento', cronometradoField: 'aquecimentoCronometrado' },
  {
    key: 'SERIE_PREPARATORIA',
    label: 'Série preparatória',
    textoField: 'seriePreparatoria',
    cronometradoField: 'seriePreparatoriaCronometrada',
  },
  {
    key: 'SERIE_PRINCIPAL',
    label: 'Série principal',
    textoField: 'seriePrincipal',
    cronometradoField: 'seriePrincipalCronometrada',
  },
  { key: 'SOLTURA', label: 'Soltura', textoField: 'soltura', cronometradoField: 'solturaCronometrada' },
];

export type QualidadeSono = 'RUIM' | 'REGULAR' | 'BOM' | 'OTIMO';

export const QUALIDADES_SONO: QualidadeSono[] = ['RUIM', 'REGULAR', 'BOM', 'OTIMO'];

export const QUALIDADE_SONO_LABEL: Record<QualidadeSono, string> = {
  RUIM: 'Ruim',
  REGULAR: 'Regular',
  BOM: 'Bom',
  OTIMO: 'Ótimo',
};

export type Estilo = 'LIVRE' | 'COSTAS' | 'PEITO' | 'BORBOLETA' | 'MEDLEY';

export const ESTILOS: Estilo[] = ['LIVRE', 'COSTAS', 'PEITO', 'BORBOLETA', 'MEDLEY'];

export const ESTILO_LABEL: Record<Estilo, string> = {
  LIVRE: 'Livre',
  COSTAS: 'Costas',
  PEITO: 'Peito',
  BORBOLETA: 'Borboleta',
  MEDLEY: 'Medley',
};

export function formatarProva(estilo: Estilo, distancia: number): string {
  return `${distancia}m ${ESTILO_LABEL[estilo]}`;
}

// A biblioteca de educativos é organizada só pelos quatro estilos de nado
// (sem Medley, que é uma mistura dos outros quatro, não um estilo em si).
export const ESTILOS_EDUCATIVO: Estilo[] = ['BORBOLETA', 'COSTAS', 'PEITO', 'LIVRE'];

export type RegistroTempo = {
  id: string;
  atletaId: string;
  treinoId: string;
  bloco: BlocoTreino;
  // Texto livre por escolha deliberada (não é obrigatoriamente um número de
  // metros) — ver comentário de RegistroTempo.distancia no schema do
  // backend. Por causa disso, intensidade/recorde/zona de treinamento só
  // funcionam pros tiros em que o texto bate exatamente com um número.
  distancia: string;
  tempoCentesimos: number;
  estilo: Estilo | null;
  ordem: number;
  criadoEm: string;
};

export type RegistroPSE = {
  id: string;
  atletaId: string;
  treinoId: string;
  pse: number;
  qualidadeSono: QualidadeSono | null;
  criadoEm: string;
  atualizadoEm: string;
};

// PENDENTE: ainda dá tempo de responder (dentro de 48h da criação, sem
// resposta). RESPONDIDO: o atleta anotou tempo e/ou PSE. AUSENTE: passou
// das 48h sem resposta, ou o atleta marcou "Não compareci" — ver
// backend/src/lib/ausencia.ts, que é quem decide isso de verdade; o app só
// exibe o que já vem calculado.
// PRESENTE = o técnico fez a chamada e confirmou que o atleta veio, mas
// ele ainda não lançou tempo nem PSE. É diferente de RESPONDIDO (veio e
// anotou) e continua contando como pendência de registro pro atleta.
export type StatusAtleta = 'PENDENTE' | 'RESPONDIDO' | 'PRESENTE' | 'AUSENTE';

export const STATUS_ATLETA_LABEL: Record<StatusAtleta, string> = {
  PENDENTE: 'Pendente',
  RESPONDIDO: 'Respondido',
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
};

export type TreinoComRegistros = Treino & {
  tempos: RegistroTempo[];
  pse: RegistroPSE | null;
  statusAtleta: StatusAtleta;
};

export function treinoPrecisaResponder(treino: TreinoComRegistros): boolean {
  // PRESENTE entra aqui de propósito: o técnico ter confirmado a presença
  // não substitui o registro do atleta — se saísse da lista, a chamada do
  // técnico silenciaria a pendência dele sem ninguém perceber.
  return treino.statusAtleta === 'PENDENTE' || treino.statusAtleta === 'PRESENTE';
}

export type TiroInput = { distancia: string; tempoCentesimos: number; estilo?: Estilo | null };

export type RegistroTempoInput = { treinoId: string; bloco: BlocoTreino; tiros: TiroInput[] };

export type RegistroPSEInput = { treinoId: string; pse: number; qualidadeSono: QualidadeSono | null };

export type AtletaRegistro = {
  atletaId: string;
  nome: string;
  status: StatusAtleta;
  pse: number | null;
  qualidadeSono: QualidadeSono | null;
  tempos: RegistroTempo[];
};

export type RegistrosTreinoResponse = {
  treino: Treino;
  atletas: AtletaRegistro[];
};

export type FaixaIntensidade = 'LEVE' | 'MODERADO' | 'INTENSO';

export const FAIXA_INTENSIDADE_LABEL: Record<FaixaIntensidade, string> = {
  LEVE: 'Leve',
  MODERADO: 'Moderado',
  INTENSO: 'Intenso',
};

// Mesmos limites usados no backend (src/lib/intensidade.ts) — usado aqui só
// para classificar visualmente números já calculados (ex: a média da
// semana), sem precisar de outra chamada à API.
export function classificarFaixaCliente(intensidade: number): FaixaIntensidade {
  if (intensidade < 85) return 'LEVE';
  if (intensidade <= 95) return 'MODERADO';
  return 'INTENSO';
}

export type ItemIntensidade = {
  registroId: string;
  treinoId: string;
  treinoData: string;
  bloco: BlocoTreino;
  distancia: string;
  tempoCentesimos: number;
  estilo: Estilo | null;
  melhorTempoCentesimos: number | null;
  intensidade: number | null;
  faixa: FaixaIntensidade | null;
  recorde: boolean;
};

export type ResumoIntensidade = {
  mediaSemana: number | null;
  quantidadeTirosSemana: number;
  quantidadeComReferenciaSemana: number;
};

export type IntensidadeResponse = {
  itens: ItemIntensidade[];
  resumo: ResumoIntensidade;
};

export type AtletaResumo = {
  id: string;
  nome: string;
  email: string;
  categoria: Categoria;
};

export type IntensidadeTecnicoResponse = IntensidadeResponse & {
  atleta: { id: string; nome: string; categoria: Categoria };
};

export type PeriodoFrequencia = 'semana' | 'mes';

export const PERIODOS_FREQUENCIA: { valor: PeriodoFrequencia; label: string }[] = [
  { valor: 'semana', label: 'Última semana' },
  { valor: 'mes', label: 'Último mês' },
];

export type FrequenciaAtleta = {
  totalTreinos: number;
  totalPresente: number;
  percentual: number | null;
};

export type FrequenciaGrupoAtleta = {
  atletaId: string;
  nome: string;
  presencasPorTreino: Record<string, boolean>;
  totalPresente: number;
  totalTreinos: number;
  percentual: number | null;
};

export type FrequenciaGrupoResponse = {
  categoria: Categoria;
  periodoTipo: PeriodoFrequencia;
  periodo: { inicio: string; fim: string };
  treinos: { id: string; data: string; objetivoSemana: string }[];
  atletas: FrequenciaGrupoAtleta[];
};

// Limite abaixo do qual a frequência é destacada como baixa no app.
export const LIMITE_FREQUENCIA_BAIXA = 70;

export type RecordeInterno = {
  id: string;
  estilo: Estilo;
  distancia: number;
  categoria: Categoria;
  sexo: Sexo;
  piscina: TamanhoPiscina;
  tempoCentesimos: number;
  nomeAtleta: string;
  data: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type RecordeHistorico = RecordeInterno & { atual: boolean };

export type RecordeInput = {
  estilo: Estilo;
  distancia: number;
  sexo: Sexo;
  piscina: TamanhoPiscina;
  categoria: Categoria;
  tempoCentesimos: number;
  nomeAtleta: string;
  data: string;
};

export type FiltrosRecorde = {
  estilo?: Estilo;
  categoria?: Categoria;
  distancia?: number;
  sexo?: Sexo;
  piscina?: TamanhoPiscina;
};

export type ImportarRecordesResponse = {
  criados: number;
  ignorados: number;
  erros: string[];
};

export type StatusEducativo = 'PENDENTE' | 'PUBLICADO' | 'REJEITADO';

export const STATUS_EDUCATIVO_LABEL: Record<StatusEducativo, string> = {
  PENDENTE: 'Pendente',
  PUBLICADO: 'Publicado',
  REJEITADO: 'Rejeitado',
};

export type Educativo = {
  id: string;
  estilo: Estilo;
  nome: string;
  descricaoObjetivo: string;
  videoUrl: string;
  status: StatusEducativo;
  autorId: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type EducativoPendente = Educativo & { autorNome: string };

export type EducativoInput = {
  estilo: Estilo;
  nome: string;
  descricaoObjetivo: string;
  videoUrl: string;
};

export type Medalha = 'OURO' | 'PRATA' | 'BRONZE';

export const MEDALHAS: Medalha[] = ['OURO', 'PRATA', 'BRONZE'];

export const MEDALHA_LABEL: Record<Medalha, string> = {
  OURO: 'Ouro',
  PRATA: 'Prata',
  BRONZE: 'Bronze',
};

export const MEDALHA_EMOJI: Record<Medalha, string> = {
  OURO: '🥇',
  PRATA: '🥈',
  BRONZE: '🥉',
};

export type Competicao = {
  id: string;
  nome: string;
  data: string;
  local: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type ResultadoCompeticao = {
  id: string;
  atletaId: string;
  competicaoId: string;
  competicao: Competicao;
  estilo: Estilo;
  distancia: number;
  tempoCentesimos: number;
  colocacao: number | null;
  medalha: Medalha | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type ResultadoCompeticaoInput = {
  competicao: {
    nome: string;
    data: string;
    local: string;
  };
  estilo: Estilo;
  distancia: number;
  tempoCentesimos: number;
  colocacao?: number | null;
  medalha?: Medalha | null;
};

export type MelhorTempoPorProva = {
  resultadoId: string;
  estilo: Estilo;
  distancia: number;
  tempoCentesimos: number;
  data: string;
  competicaoNome: string;
};

// Marca pessoal do atleta numa prova (estilo + distância + piscina),
// cadastrada por ele mesmo sem precisar estar ligada a uma competição.
export type MelhorMarca = {
  id: string;
  atletaId: string;
  estilo: Estilo;
  distancia: number;
  piscina: TamanhoPiscina;
  tempoCentesimos: number;
  data: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type MelhorMarcaInput = {
  estilo: Estilo;
  distancia: number;
  piscina: TamanhoPiscina;
  tempoCentesimos: number;
  data?: string | null;
};
