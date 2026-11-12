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
const API_URL = (import.meta.env?.VITE_API_URL?.trim() || 'http://localhost:3000').replace(/\/+$/, '');
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
        if (resposta.status === 401) {
            limparSessao();
            window.dispatchEvent(new Event('proxima-etapa:sessao-expirada'));
        }
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
export function listarCursos(opcoes) {
    return requisicao('/api/cursos', opcoes ? opcoesDeConsulta(opcoes) : {});
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
export function listarPerfis(opcoes = {}) {
    return requisicao('/api/profiles', opcoesDeConsulta(opcoes), true);
}
export function criarPerfil(dados) {
    return requisicao('/api/profiles', {
        method: 'POST',
        body: JSON.stringify(dados),
    });
}
export function atualizarPerfil(id, dados) {
    return requisicao(`/api/profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
    }, true);
}
export function bloquearPerfil(id, bloqueado, motivo_bloqueio = null) {
    return requisicao(`/api/profiles/${id}/bloqueio`, {
        method: 'PATCH',
        body: JSON.stringify({ bloqueado, motivo_bloqueio }),
    }, true);
}
export function excluirPerfil(id) {
    return requisicao(`/api/profiles/${id}`, { method: 'DELETE' }, true);
}

function opcoesDeConsulta(opcoes) {
    const sinais = [AbortSignal.timeout(15000)];
    if (opcoes.signal) sinais.push(opcoes.signal);
    return {
        ...opcoes,
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.any(sinais),
    };
}

export function listarAtividades(opcoes = {}) {
    return requisicao('/api/atividades', opcoesDeConsulta(opcoes), true);
}

export function salvarAtividade(dados, id, opcoes = {}) {
    const caminho = id ? `/api/atividades/${encodeURIComponent(id)}` : '/api/atividades';
    return requisicao(caminho, {
        ...opcoesDeConsulta(opcoes),
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(dados),
    }, true);
}

export function emitirQrPresenca(janela, opcoes = {}) {
    return requisicao('/api/presencas/qr-token', {
        ...opcoesDeConsulta(opcoes),
        method: 'POST',
        body: JSON.stringify(janela),
    }, true);
}

export function listarPresencasDoAluno(alunoId, opcoes = {}) {
    return requisicao(`/api/presencas/alunos/${encodeURIComponent(alunoId)}`, opcoesDeConsulta(opcoes), true);
}

export function listarCertificados(opcoes = {}) {
    return requisicao('/api/certificados', opcoesDeConsulta(opcoes), true);
}

export function listarMensagens(opcoes = {}) {
    return requisicao('/api/mensagens', opcoesDeConsulta(opcoes), true);
}

export function criarMensagem(body, opcoes = {}) {
    return requisicao('/api/mensagens', {
        ...opcoesDeConsulta(opcoes),
        method: 'POST',
        body: JSON.stringify(body),
    }, true);
}

export function editarMensagem(id, body, opcoes = {}) {
    return requisicao('/api/mensagens/' + encodeURIComponent(id), {
        ...opcoesDeConsulta(opcoes),
        method: 'PUT',
        body: JSON.stringify(body),
    }, true);
}

export function excluirMensagem(id, opcoes = {}) {
    return requisicao('/api/mensagens/' + encodeURIComponent(id), {
        ...opcoesDeConsulta(opcoes),
        method: 'DELETE',
    }, true);
}

export function publicarMensagem(id, opcoes = {}) {
    return requisicao('/api/mensagens/' + encodeURIComponent(id) + '/publicar', {
        ...opcoesDeConsulta(opcoes),
        method: 'POST',
        body: '{}',
    }, true);
}

// Somente rotas administrativas autenticadas; nunca há fallback com dados fictícios.
export function obterDashboardGestao(opcoes = {}) {
    return requisicao('/api/gestao/dashboard', opcoesDeConsulta(opcoes), true);
}
export function obterRelatorioGestao({ periodo = '6m', cursoId = '', signal } = {}) {
    const params = new URLSearchParams({ periodo });
    if (cursoId) params.set('curso_id', cursoId);
    return requisicao(`/api/gestao/relatorios?${params}`, opcoesDeConsulta({ signal }), true);
}
export function listarEventosGestao(opcoes = {}) {
    return requisicao('/api/gestao/eventos', opcoesDeConsulta(opcoes), true);
}
export function listarTestesGestao(opcoes = {}) {
    return requisicao('/api/gestao/testes', opcoesDeConsulta(opcoes), true);
}
export function listarResultadosTestes(opcoes = {}) {
    return requisicao('/api/gestao/testes/resultados', opcoesDeConsulta(opcoes), true);
}
export function criarTesteGestao(dados, opcoes = {}) {
    return requisicao('/api/gestao/testes', {
        ...opcoesDeConsulta(opcoes), method: 'POST', body: JSON.stringify(dados),
    }, true);
}
export function listarAdmins(opcoes = {}) {
    return requisicao('/api/admins', opcoesDeConsulta(opcoes), true);
}
export function listarAuditoria(opcoes = {}) {
    return requisicao('/api/gestao/auditoria', opcoesDeConsulta(opcoes), true);
}
