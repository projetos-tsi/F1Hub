import { authService } from '../services/auth-service.js';
import { routes } from '../services/catalog-service.js';
import { escapeHtml } from '../ui/product-card.js';

const formatDate = (isoDate) => new Date(`${isoDate}T12:00:00`).toLocaleDateString('pt-BR');

// Página "Minha conta": exige login. Pedidos (fase B4) e assinatura (fase B5) entram nas próximas etapas.
export async function initAccountPage() {
    const root = document.querySelector('[data-account-page]');
    if (!root) return;

    const user = await authService.me();
    if (!user) {
        window.location.replace(`${routes.login}?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
    }

    root.innerHTML = `
        <section class="account-hero">
            <div>
                <p class="eyebrow">Minha conta${user.role === 'admin' ? ' · <span class="account-badge">Administrador</span>' : ''}</p>
                <h1>Olá, ${escapeHtml(user.firstName)}!</h1>
                <p>Cliente F1 Hub desde ${formatDate(user.memberSince)}.</p>
            </div>
            <button type="button" class="account-logout" data-logout>Sair da conta</button>
        </section>

        <div class="account-grid">
            <section class="account-card" aria-labelledby="account-data-title">
                <h2 id="account-data-title">Meus dados</h2>
                <dl>
                    <div><dt>Nome</dt><dd>${escapeHtml(user.name)}</dd></div>
                    <div><dt>E-mail</dt><dd>${escapeHtml(user.email)}</dd></div>
                    <div><dt>Cliente desde</dt><dd>${formatDate(user.memberSince)}</dd></div>
                </dl>
            </section>

            <section class="account-card" aria-labelledby="account-orders-title">
                <h2 id="account-orders-title">Meus pedidos</h2>
                <p>Ainda não há pedidos registrados na sua conta.</p>
                <a class="button-outline" href="${routes.catalog}">Explorar produtos</a>
            </section>

            <section class="account-card account-card-box" aria-labelledby="account-box-title">
                <h2 id="account-box-title">F1Hub Box</h2>
                <p>Você ainda não assina a F1Hub Box. Receba mimos da sua equipe todo mês.</p>
                <a class="button button-light" href="${routes.subscription}">Conhecer a assinatura <span aria-hidden="true">→</span></a>
            </section>
        </div>
        <p class="account-status" role="status" aria-live="polite"></p>`;

    root.querySelector('[data-logout]').addEventListener('click', async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = 'Saindo...';
        try {
            await authService.logout();
            window.location.assign(routes.home);
        } catch (error) {
            root.querySelector('.account-status').textContent = error.message;
            button.disabled = false;
            button.textContent = 'Sair da conta';
        }
    });
}
