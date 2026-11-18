// Cliente da API PHP do F1 Hub (backend/api/).
// - Envia e recebe JSON;
// - Guarda o token CSRF recebido do servidor e o envia em toda requisição que altera dados;
// - Se o token expirar, busca um novo e repete a requisição uma vez.
const API_BASE = new URL('../../../backend/api/', import.meta.url);

let csrfToken = null;

export class ApiError extends Error {
    constructor(message, status = 0, fields = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.fields = fields;
    }
}

async function refreshCsrfToken() {
    await request('auth.php?action=me');
}

async function request(path, { method = 'GET', body, retried = false } = {}) {
    const headers = { Accept: 'application/json' };
    if (method !== 'GET') {
        if (!csrfToken) await refreshCsrfToken();
        headers['Content-Type'] = 'application/json';
        headers['X-CSRF-Token'] = csrfToken;
    }

    let response;
    try {
        response = await fetch(new URL(path, API_BASE), {
            method,
            headers,
            credentials: 'same-origin',
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    } catch (_error) {
        throw new ApiError('Sem conexão com o servidor. Verifique se o Apache e o MySQL do XAMPP estão ativos.');
    }

    let payload = null;
    try {
        payload = await response.json();
    } catch (_error) {
        payload = null;
    }

    // Token CSRF vencido (ex.: sessão expirou com a página aberta): renova e tenta de novo uma vez.
    if (response.status === 403 && method !== 'GET' && !retried) {
        csrfToken = null;
        return request(path, { method, body, retried: true });
    }

    if (!response.ok || !payload?.ok) {
        throw new ApiError(payload?.error || 'Não foi possível concluir agora. Tente novamente.', response.status, payload?.fields || {});
    }

    if (payload.data && typeof payload.data.csrfToken === 'string') csrfToken = payload.data.csrfToken;
    return payload.data;
}

export const api = {
    get: (path) => request(path),
    post: (path, body = {}) => request(path, { method: 'POST', body })
};
