import { api } from './api-client.js';

// Sessão do usuário no front-end. A fonte da verdade é sempre o servidor (sessão PHP).
let currentUser = null;

export const authService = {
    /** Usuário logado ou null. Consulta o servidor uma vez por página (ou de novo com force = true). */
    me(force = false) {
        if (!currentUser || force) {
            currentUser = api.get('auth.php?action=me')
                .then((data) => data.user)
                .catch(() => null);
        }
        return currentUser;
    },

    async login(email, password, remember = false) {
        const data = await api.post('auth.php?action=login', { email, password, remember });
        currentUser = Promise.resolve(data.user);
        return data.user;
    },

    async register(fields) {
        const data = await api.post('auth.php?action=register', fields);
        currentUser = Promise.resolve(data.user);
        return data.user;
    },

    async logout() {
        await api.post('auth.php?action=logout');
        currentUser = Promise.resolve(null);
    }
};

/**
 * Destino depois do login/cadastro: o parâmetro ?redirect= da página, se apontar para o
 * próprio site (evita redirecionar para sites externos), senão o destino padrão.
 */
export function safeRedirectTarget(fallback) {
    const requested = new URLSearchParams(window.location.search).get('redirect');
    if (!requested) return fallback;
    try {
        const target = new URL(requested, window.location.href);
        return target.origin === window.location.origin ? target.href : fallback;
    } catch (_error) {
        return fallback;
    }
}
