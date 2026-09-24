class ApiError extends Error {
    constructor(message, status) {
        super(message);
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
                return JSON.parse(valor);
            }
            catch {
                storage.removeItem(USER_KEY);
            }
        }
    }
    return null;
}
export function salvarSessao(token, usuario, manterConectado) {
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
async function requisicao(caminho, opcoes = {}, exigeToken = false) {
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
        return undefined;
    }
    return resposta.json();
}
export async function fazerLogin(email, senha) {
    return requisicao('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
    });
}
export function listarCursos() {
    return requisicao('/api/cursos');
}
export function criarCurso(dados) {
    return requisicao('/api/cursos', {
        method: 'POST',
        body: JSON.stringify(dados),
    }, true);
}
export function atualizarCurso(id, dados) {
    return requisicao(`/api/cursos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
    }, true);
}
export function excluirCurso(id) {
    return requisicao(`/api/cursos/${id}`, { method: 'DELETE' }, true);
}
export function listarUniversidades() {
    return requisicao('/api/universidades');
}
export function criarUniversidade(dados) {
    return requisicao('/api/universidades', {
        method: 'POST',
        body: JSON.stringify(dados),
    }, true);
}
export function atualizarUniversidade(id, dados) {
    return requisicao(`/api/universidades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
    }, true);
}
export function excluirUniversidade(id) {
    return requisicao(`/api/universidades/${id}`, { method: 'DELETE' }, true);
}
