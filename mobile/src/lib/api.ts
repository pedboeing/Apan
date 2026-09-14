import type {
  AlterarSenhaInput,
  AtletaResumo,
  AtualizarPerfilInput,
  CadastroInput,
  Categoria,
  Educativo,
  EducativoInput,
  EducativoPendente,
  Estilo,
  FiltrosRecorde,
  FrequenciaAtleta,
  FrequenciaGrupoResponse,
  ImportarRecordesResponse,
  IntensidadeResponse,
  IntensidadeTecnicoResponse,
  MelhorMarca,
  MelhorMarcaInput,
  MelhorTempoPorProva,
  PeriodoFrequencia,
  ProvaPrincipal,
  ProvasPrincipaisInput,
  RecordeHistorico,
  RecordeInput,
  RecordeInterno,
  RegistroPSE,
  RegistroPSEInput,
  RegistroTempo,
  RegistroTempoInput,
  RegistrosTreinoResponse,
  ResultadoCompeticao,
  ResultadoCompeticaoInput,
  TabelaReferenciaPorPiscina,
  Treino,
  TreinoComRegistros,
  TreinoInput,
  Usuario,
  UsuarioComPerfil,
} from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333';

// Sem isso, uma requisição que trava (ex: servidor "esfriou" por
// inatividade e está reiniciando) fica pendurada pra sempre — o botão gira
// indefinidamente sem erro nenhum, e só um F5 mata a chamada e libera pra
// tentar de novo. Com o timeout, no pior caso o usuário vê um erro claro
// (com botão de tentar de novo, que toda tela já tem) depois de alguns
// segundos, em vez de uma tela travada.
const TIMEOUT_MS = 20_000;

type AuthResponse = {
  token: string;
  usuario: Usuario;
};

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: timeoutController.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(0, 'O servidor demorou demais para responder. Tente novamente em alguns instantes.');
    }
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua internet.');
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, typeof data.error === 'string' ? data.error : 'Erro inesperado. Tente novamente.');
  }

  return data as T;
}

export const api = {
  cadastro: (dados: CadastroInput) => request<AuthResponse>('/auth/cadastro', { method: 'POST', body: dados }),
  login: (email: string, senha: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, senha } }),
  me: (token: string) => request<{ usuario: UsuarioComPerfil }>('/auth/me', { token }),
  atualizarPerfil: (token: string, dados: AtualizarPerfilInput) =>
    request<{ usuario: UsuarioComPerfil }>('/auth/me', { method: 'PUT', body: dados, token }),
  alterarSenha: (token: string, dados: AlterarSenhaInput) =>
    request<void>('/auth/senha', { method: 'PUT', body: dados, token }),

  listarTreinos: (token: string) => request<{ treinos: Treino[] }>('/treinos', { token }),
  obterTreino: (token: string, id: string) => request<{ treino: Treino }>(`/treinos/${id}`, { token }),
  criarTreino: (token: string, dados: TreinoInput) =>
    request<{ treino: Treino }>('/treinos', { method: 'POST', body: dados, token }),
  atualizarTreino: (token: string, id: string, dados: TreinoInput) =>
    request<{ treino: Treino }>(`/treinos/${id}`, { method: 'PUT', body: dados, token }),
  excluirTreino: (token: string, id: string) =>
    request<void>(`/treinos/${id}`, { method: 'DELETE', token }),
  registrosDoTreino: (token: string, id: string) =>
    request<RegistrosTreinoResponse>(`/treinos/${id}/registros`, { token }),

  meuTreino: (token: string) => request<{ treinos: TreinoComRegistros[] }>('/atleta/meu-treino', { token }),
  meuHistorico: (token: string) => request<{ treinos: TreinoComRegistros[] }>('/atleta/meu-historico', { token }),
  obterTreinoAtleta: (token: string, id: string) =>
    request<{ treino: TreinoComRegistros }>(`/atleta/treinos/${id}`, { token }),
  registrarTempos: (token: string, dados: RegistroTempoInput) =>
    request<{ tempos: RegistroTempo[] }>('/atleta/registros-tempo', { method: 'POST', body: dados, token }),
  registrarPSE: (token: string, dados: RegistroPSEInput) =>
    request<{ registro: RegistroPSE }>('/atleta/registros-pse', { method: 'POST', body: dados, token }),
  naoCompareci: (token: string, treinoId: string) =>
    request<{ presenca: unknown }>('/atleta/nao-compareci', { method: 'POST', body: { treinoId }, token }),
  minhaIntensidade: (token: string) => request<IntensidadeResponse>('/atleta/minha-intensidade', { token }),

  minhaFrequencia: (token: string) => request<FrequenciaAtleta>('/atleta/minha-frequencia', { token }),

  listarAtletas: (token: string) => request<{ atletas: AtletaResumo[] }>('/tecnico/atletas', { token }),
  intensidadeAtleta: (token: string, atletaId: string) =>
    request<IntensidadeTecnicoResponse>(`/tecnico/atletas/${atletaId}/intensidade`, { token }),
  frequenciaGrupo: (token: string, categoria: Categoria, periodo: PeriodoFrequencia) =>
    request<FrequenciaGrupoResponse>(`/tecnico/frequencia?categoria=${categoria}&periodo=${periodo}`, { token }),
  marcarPresenca: (token: string, dados: { atletaId: string; treinoId: string; presente: boolean }) =>
    request<{ presenca: unknown }>('/tecnico/presencas', { method: 'POST', body: dados, token }),
  marcarPresencaEmLote: (token: string, dados: { treinoId: string; presente: boolean }) =>
    request<{ marcados: number; ignorados: number }>('/tecnico/presencas/lote', { method: 'POST', body: dados, token }),

  listarRecordes: (token: string, filtros?: FiltrosRecorde) =>
    request<{ recordes: RecordeInterno[] }>(`/recordes${queryDeFiltros(filtros)}`, { token }),
  listarRecordesHistorico: (token: string, filtros?: FiltrosRecorde) =>
    request<{ recordes: RecordeHistorico[] }>(`/recordes/historico${queryDeFiltros(filtros)}`, { token }),
  obterRecorde: (token: string, id: string) => request<{ recorde: RecordeInterno }>(`/recordes/${id}`, { token }),
  criarRecorde: (token: string, dados: RecordeInput) =>
    request<{ recorde: RecordeInterno }>('/recordes', { method: 'POST', body: dados, token }),
  atualizarRecorde: (token: string, id: string, dados: RecordeInput) =>
    request<{ recorde: RecordeInterno }>(`/recordes/${id}`, { method: 'PUT', body: dados, token }),
  excluirRecorde: (token: string, id: string) => request<void>(`/recordes/${id}`, { method: 'DELETE', token }),
  importarRecordes: (token: string, csv: string) =>
    request<ImportarRecordesResponse>('/recordes/importar', { method: 'POST', body: { csv }, token }),

  listarEducativos: (token: string, estilo?: Estilo) =>
    request<{ educativos: Educativo[] }>(`/educativos${estilo ? `?estilo=${estilo}` : ''}`, { token }),
  obterEducativo: (token: string, id: string) => request<{ educativo: Educativo }>(`/educativos/${id}`, { token }),
  criarEducativo: (token: string, dados: EducativoInput) =>
    request<{ educativo: Educativo }>('/educativos', { method: 'POST', body: dados, token }),
  atualizarEducativo: (token: string, id: string, dados: EducativoInput) =>
    request<{ educativo: Educativo }>(`/educativos/${id}`, { method: 'PUT', body: dados, token }),
  excluirEducativo: (token: string, id: string) => request<void>(`/educativos/${id}`, { method: 'DELETE', token }),
  sugerirEducativo: (token: string, dados: EducativoInput) =>
    request<{ educativo: Educativo }>('/educativos/sugestoes', { method: 'POST', body: dados, token }),
  educativosPendentes: (token: string) =>
    request<{ educativos: EducativoPendente[] }>('/educativos/pendentes', { token }),
  minhasSugestoes: (token: string) => request<{ educativos: Educativo[] }>('/educativos/minhas-sugestoes', { token }),
  aprovarEducativo: (token: string, id: string) =>
    request<{ educativo: Educativo }>(`/educativos/${id}/aprovar`, { method: 'POST', token }),
  rejeitarEducativo: (token: string, id: string) =>
    request<{ educativo: Educativo }>(`/educativos/${id}/rejeitar`, { method: 'POST', token }),

  meusResultadosCompeticao: (token: string) =>
    request<{ resultados: ResultadoCompeticao[] }>('/atleta/resultados-competicao', { token }),
  obterResultadoCompeticao: (token: string, id: string) =>
    request<{ resultado: ResultadoCompeticao }>(`/atleta/resultados-competicao/${id}`, { token }),
  meusMelhoresTempos: (token: string) =>
    request<{ melhores: MelhorTempoPorProva[] }>('/atleta/meus-melhores-tempos', { token }),
  criarResultadoCompeticao: (token: string, dados: ResultadoCompeticaoInput) =>
    request<{ resultado: ResultadoCompeticao }>('/atleta/resultados-competicao', {
      method: 'POST',
      body: dados,
      token,
    }),
  atualizarResultadoCompeticao: (token: string, id: string, dados: ResultadoCompeticaoInput) =>
    request<{ resultado: ResultadoCompeticao }>(`/atleta/resultados-competicao/${id}`, {
      method: 'PUT',
      body: dados,
      token,
    }),
  excluirResultadoCompeticao: (token: string, id: string) =>
    request<void>(`/atleta/resultados-competicao/${id}`, { method: 'DELETE', token }),
  resultadosCompeticaoAtleta: (token: string, atletaId: string) =>
    request<{ atleta: { id: string; nome: string; categoria: Categoria }; resultados: ResultadoCompeticao[] }>(
      `/tecnico/atletas/${atletaId}/resultados-competicao`,
      { token },
    ),

  minhasMelhoresMarcas: (token: string) => request<{ marcas: MelhorMarca[] }>('/atleta/melhores-marcas', { token }),
  melhoresMarcasAtleta: (token: string, atletaId: string) =>
    request<{ atleta: { id: string; nome: string; categoria: Categoria }; marcas: MelhorMarca[] }>(
      `/tecnico/atletas/${atletaId}/melhores-marcas`,
      { token },
    ),
  obterMelhorMarca: (token: string, id: string) =>
    request<{ marca: MelhorMarca }>(`/atleta/melhores-marcas/${id}`, { token }),
  criarMelhorMarca: (token: string, dados: MelhorMarcaInput) =>
    request<{ marca: MelhorMarca }>('/atleta/melhores-marcas', { method: 'POST', body: dados, token }),
  atualizarMelhorMarca: (token: string, id: string, dados: MelhorMarcaInput) =>
    request<{ marca: MelhorMarca }>(`/atleta/melhores-marcas/${id}`, { method: 'PUT', body: dados, token }),
  excluirMelhorMarca: (token: string, id: string) =>
    request<void>(`/atleta/melhores-marcas/${id}`, { method: 'DELETE', token }),

  minhasProvasPrincipais: (token: string) => request<{ provas: ProvaPrincipal[] }>('/atleta/provas-principais', { token }),
  salvarProvasPrincipais: (token: string, dados: ProvasPrincipaisInput) =>
    request<{ provas: ProvaPrincipal[] }>('/atleta/provas-principais', { method: 'PUT', body: dados, token }),

  minhaTabelaReferencia: (token: string) =>
    request<TabelaReferenciaPorPiscina>('/atleta/tabela-referencia', { token }),
  tabelaReferenciaAtleta: (token: string, atletaId: string) =>
    request<{ atleta: { id: string; nome: string; categoria: Categoria } } & TabelaReferenciaPorPiscina>(
      `/tecnico/atletas/${atletaId}/tabela-referencia`,
      { token },
    ),
};

function queryDeFiltros(filtros?: FiltrosRecorde): string {
  if (!filtros) return '';
  const params = new URLSearchParams();
  if (filtros.estilo) params.set('estilo', filtros.estilo);
  if (filtros.categoria) params.set('categoria', filtros.categoria);
  if (filtros.distancia) params.set('distancia', String(filtros.distancia));
  if (filtros.sexo) params.set('sexo', filtros.sexo);
  if (filtros.piscina) params.set('piscina', filtros.piscina);
  const query = params.toString();
  return query ? `?${query}` : '';
}
