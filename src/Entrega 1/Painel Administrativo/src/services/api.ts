export type Papel = 'aluno' | 'admin_operador' | 'admin_super';

export interface UsuarioAutenticado {
  id: string;
  nome_completo: string;
  email: string;
  papel: Papel;
}

export interface Universidade {
  id: string;
  nome: string;
  logo_url: string | null;
  site: string | null;
  descricao: string | null;
  criado_em: string;
}

export interface Curso {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  carga_horaria_horas: number;
  universidade_id: string | null;
  modalidade: 'presencial' | 'online' | 'hibrido';
  local: string | null;
  link_online: string | null;
  data_inicio: string;
  data_fim: string | null;
  vagas_total: number;
  vagas_disponiveis: number;
  emite_certificado: number;
  status: 'planejado' | 'em_andamento' | 'encerrado' | 'cancelado';
  banner_url: string | null;
}

export type CursoPayload = Pick<
  Curso,
  | 'titulo'
  | 'descricao'
  | 'categoria'
  | 'carga_horaria_horas'
  | 'universidade_id'
  | 'modalidade'
  | 'local'
  | 'link_online'
  | 'data_inicio'
  | 'data_fim'
  | 'vagas_total'
  | 'emite_certificado'
  | 'status'
  | 'banner_url'
>;

export type UniversidadePayload = Pick<
  Universidade,
  'nome' | 'logo_url' | 'site' | 'descricao'
>;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'proxima-etapa.admin.token';
const USER_KEY = 'proxima-etapa.admin.usuario';

function storageParaLeitura() {
  return [sessionStorage, localStorage];
}

export function obterToken() {
  for (const storage of storageParaLeitura()) {
    const token = storage.getItem(TOKEN_KEY);

    if (token) {
      return token;
    }
  }

  return null;
}

export function obterUsuario() {
  for (const storage of storageParaLeitura()) {
    const valor = storage.getItem(USER_KEY);

    if (valor) {
      try {
        return JSON.parse(valor) as UsuarioAutenticado;
      } catch {
        storage.removeItem(USER_KEY);
      }
    }
  }

  return null;
}

export function salvarSessao(
  token: string,
  usuario: UsuarioAutenticado,
  manterConectado: boolean,
) {
  const destino = manterConectado ? localStorage : sessionStorage;
  const outro = manterConectado ? sessionStorage : localStorage;

  outro.removeItem(TOKEN_KEY);
  outro.removeItem(USER_KEY);
  destino.setItem(TOKEN_KEY, token);
  destino.setItem(USER_KEY, JSON.stringify(usuario));
}

export function limparSessao() {
  for (const storage of storageParaLeitura()) {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
  }
}

async function requisicao<T>(
  caminho: string,
  opcoes: RequestInit = {},
  exigeToken = false,
) {
  const headers = new Headers(opcoes.headers);
  const token = obterToken();

  if (opcoes.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (exigeToken && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers,
  });

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new ApiError(corpo?.erro ?? 'Não foi possível concluir a operação.', resposta.status);
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  return resposta.json() as Promise<T>;
}

export async function fazerLogin(email: string, senha: string) {
  return requisicao<{ token: string; usuario: UsuarioAutenticado }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export function listarCursos() {
  return requisicao<Curso[]>('/api/cursos');
}

export function criarCurso(dados: CursoPayload) {
  return requisicao<Curso>('/api/cursos', {
    method: 'POST',
    body: JSON.stringify(dados),
  }, true);
}

export function atualizarCurso(id: string, dados: CursoPayload) {
  return requisicao<Curso>(`/api/cursos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  }, true);
}

export function excluirCurso(id: string) {
  return requisicao<void>(`/api/cursos/${id}`, { method: 'DELETE' }, true);
}

export function listarUniversidades() {
  return requisicao<Universidade[]>('/api/universidades');
}

export function criarUniversidade(dados: UniversidadePayload) {
  return requisicao<Universidade>('/api/universidades', {
    method: 'POST',
    body: JSON.stringify(dados),
  }, true);
}

export function atualizarUniversidade(id: string, dados: UniversidadePayload) {
  return requisicao<Universidade>(`/api/universidades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  }, true);
}

export function excluirUniversidade(id: string) {
  return requisicao<void>(`/api/universidades/${id}`, { method: 'DELETE' }, true);
}
