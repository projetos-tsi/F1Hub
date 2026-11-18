import { api } from '../services/api-client.js';
import { authService } from '../services/auth-service.js';
import { cartService } from '../services/cart-service.js';
import { catalogService, routes } from '../services/catalog-service.js';
import { subscriptionService } from '../services/subscription-service.js';
import { escapeHtml } from '../ui/product-card.js';

const formatDate = (isoDate) => new Date(`${isoDate}T12:00:00`).toLocaleDateString('pt-BR');
const formatDateTime = (value) => new Date(value.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const price = (cents) => catalogService.formatPrice(cents);
const imageUrl = (file) => new URL(`../../src/assets/images/${encodeURIComponent(file)}`, import.meta.url).href;

/** Etapas do pedido, na ordem (cancelado fica fora da linha do tempo). */
const ORDER_STEPS = [['recebido', 'Recebido'], ['pago', 'Pago'], ['enviado', 'Enviado'], ['entregue', 'Entregue']];
const STATUS_TEXT = {
    recebido: 'Aguardando a confirmação do pagamento PIX.',
    pago: 'Pagamento confirmado. Estamos separando seus produtos.',
    enviado: 'Pedido a caminho do endereço de entrega.',
    entregue: 'Pedido entregue. Aproveite!',
    cancelado: 'Este pedido foi cancelado.'
};

function stepsTemplate(status) {
    if (status === 'cancelado') return '';
    const current = ORDER_STEPS.findIndex(([value]) => value === status);
    return `
        <ol class="order-steps" aria-label="Andamento do pedido">
            ${ORDER_STEPS.map(([value, label], index) => `
                <li class="${index < current ? 'is-done' : ''}${index === current ? ' is-current' : ''}"${index === current ? ' aria-current="step"' : ''}>
                    <span aria-hidden="true">${index < current ? '✓' : index + 1}</span>${label}
                </li>`).join('')}
        </ol>`;
}

function orderTemplate(order) {
    const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const address = order.address;
    return `
        <article class="order-card${order.status === 'cancelado' ? ' is-cancelled' : ''}" aria-labelledby="pedido-${order.id}">
            <header class="order-card-header">
                <div>
                    <h3 id="pedido-${order.id}">Pedido #${order.id}</h3>
                    <p>${escapeHtml(formatDateTime(order.createdAt))} · ${units} ${units === 1 ? 'item' : 'itens'}</p>
                </div>
                <span class="order-status is-${escapeHtml(order.status)}">${escapeHtml(order.statusLabel)}</span>
            </header>
            ${stepsTemplate(order.status)}
            <p class="order-status-text">${STATUS_TEXT[order.status] || ''}</p>
            <details class="order-details">
                <summary>Ver itens, entrega e valores</summary>
                <ul class="order-items">
                    ${order.items.map((item) => `
                        <li>
                            <span class="order-thumb" data-team="${escapeHtml(item.team)}"><img src="${imageUrl(item.image)}" alt="" loading="lazy"></span>
                            <span class="order-item-copy">
                                ${item.available ? `<a href="${routes.product(item.productId)}">${escapeHtml(item.name)}</a>` : `<strong>${escapeHtml(item.name)}</strong>`}
                                <small>Tamanho ${escapeHtml(item.size)} · ${item.quantity} × ${price(item.unitPrice)}</small>
                            </span>
                            <b>${price(item.unitPrice * item.quantity)}</b>
                        </li>`).join('')}
                </ul>
                <div class="order-footer">
                    <p class="order-address"><strong>Entrega</strong>${escapeHtml(address.address)}, ${escapeHtml(address.number)}<br>${escapeHtml(address.city)}/${escapeHtml(address.state)} · CEP ${escapeHtml(address.postalCode)}</p>
                    <dl class="order-totals">
                        <div><dt>Subtotal</dt><dd>${price(order.subtotal)}</dd></div>
                        <div class="is-discount"><dt>Desconto PIX</dt><dd>− ${price(order.discount)}</dd></div>
                        <div class="is-total"><dt>Total</dt><dd>${price(order.total)}</dd></div>
                    </dl>
                </div>
                <div class="order-again">
                    <button type="button" class="account-link-button" data-buy-again="${order.id}">Comprar de novo</button>
                    <p class="order-again-status" role="status" aria-live="polite"></p>
                </div>
            </details>
        </article>`;
}

/**
 * "Comprar de novo": coloca no carrinho os itens do pedido que ainda estão à venda (produto ativo e
 * tamanho oferecido), com o preço ATUAL do catálogo, respeitando os limites do carrinho.
 */
async function buyAgain(order) {
    if (!(await catalogService.load())) return 'Não foi possível carregar os produtos agora. Tente de novo em instantes.';
    let added = 0;
    let skipped = 0;
    order.items.forEach((item) => {
        if (!catalogService.isAvailable(item.productId, item.size)) {
            skipped += 1;
            return;
        }
        const result = cartService.add(item.productId, item.size, item.quantity);
        if (result.added) added += 1;
        else skipped += 1;
    });
    if (!added) return 'Nenhum item deste pedido pôde ser adicionado (fora de venda ou carrinho no limite).';
    const extra = skipped ? ` ${skipped} ${skipped === 1 ? 'item ficou' : 'itens ficaram'} de fora (fora de venda ou carrinho no limite).` : '';
    return `${added} ${added === 1 ? 'item adicionado' : 'itens adicionados'} ao carrinho com os preços atuais.${extra} <a href="${routes.cart}">Ver carrinho</a>`;
}

function ordersSummary(orders) {
    if (!orders.length) {
        return `<p>Ainda não há pedidos registrados na sua conta.</p><a class="button-outline" href="${routes.catalog}">Explorar produtos</a>`;
    }
    const last = orders[0];
    const open = orders.filter((order) => !['entregue', 'cancelado'].includes(order.status)).length;
    return `
        <p class="account-number"><strong>${orders.length}</strong> ${orders.length === 1 ? 'pedido' : 'pedidos'}${open ? ` · ${open} em andamento` : ''}</p>
        <p>Último: <strong>#${last.id}</strong> — ${escapeHtml(last.statusLabel)} · ${price(last.total)}</p>
        <a class="button-outline" href="#pedidos">Ver meus pedidos</a>`;
}

// Página "Minha conta": exige login. Mostra dados, pedidos (B4) e assinatura (B5).
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
            <div class="account-actions">
                ${user.role === 'admin' ? `<a class="button button-dark" href="${routes.admin}">Área administrativa <span aria-hidden="true">→</span></a>` : ''}
                <button type="button" class="account-logout" data-logout>Sair da conta</button>
            </div>
        </section>

        <div class="account-grid">
            <section class="account-card" aria-labelledby="account-data-title">
                <h2 id="account-data-title">Meus dados</h2>
                <dl>
                    <div><dt>Nome</dt><dd data-user-name>${escapeHtml(user.name)}</dd></div>
                    <div><dt>E-mail</dt><dd>${escapeHtml(user.email)}</dd></div>
                    <div><dt>Cliente desde</dt><dd>${formatDate(user.memberSince)}</dd></div>
                </dl>
                <div class="account-data-actions" data-profile-actions>
                    <button type="button" class="account-link-button" data-open-form="name">Alterar nome</button>
                    <button type="button" class="account-link-button" data-open-form="password">Trocar senha</button>
                </div>
                <div class="account-forms" data-profile-forms></div>
            </section>

            <section class="account-card" aria-labelledby="account-orders-title">
                <h2 id="account-orders-title">Meus pedidos</h2>
                <div class="account-orders-summary" data-orders-summary><p>Carregando pedidos...</p></div>
            </section>

            <section class="account-card account-card-box" id="assinatura" aria-labelledby="account-box-title" tabindex="-1">
                <h2 id="account-box-title">F1Hub Box</h2>
                <div class="account-box" data-account-box><p>Carregando assinatura...</p></div>
            </section>
        </div>

        <section class="account-orders" id="pedidos" aria-labelledby="orders-title" tabindex="-1">
            <div class="account-section-heading">
                <div><p class="eyebrow">Histórico</p><h2 id="orders-title">Meus pedidos</h2></div>
                <a class="button-outline" href="${routes.catalog}">Continuar comprando</a>
            </div>
            <div data-orders-list><p class="account-loading">Carregando pedidos...</p></div>
        </section>
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

    initProfileForms(root, user);

    // Assinatura e pedidos carregam em paralelo.
    const boxLoaded = initBoxCard(root.querySelector('[data-account-box]'));
    const list = root.querySelector('[data-orders-list]');
    const summary = root.querySelector('[data-orders-summary]');
    try {
        const { orders } = await api.get('orders.php?action=mine');
        summary.innerHTML = ordersSummary(orders);
        list.innerHTML = orders.length
            ? `<div class="order-list">${orders.map(orderTemplate).join('')}</div>`
            : `<div class="account-empty"><strong>Nenhum pedido ainda.</strong><p>Quando você finalizar uma compra, ela aparece aqui com a situação atualizada.</p></div>`;
        // Um único pedido já vem aberto; com vários, o mais recente.
        list.querySelector('.order-details')?.setAttribute('open', '');
        list.addEventListener('click', async (event) => {
            const button = event.target.closest('[data-buy-again]');
            if (!button) return;
            const order = orders.find((entry) => entry.id === Number(button.dataset.buyAgain));
            if (!order) return;
            button.disabled = true;
            button.nextElementSibling.innerHTML = await buyAgain(order);
            button.disabled = false;
        });
    } catch (error) {
        summary.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
        list.innerHTML = `<div class="account-empty"><strong>Não foi possível carregar seus pedidos.</strong><p>${escapeHtml(error.message)}</p></div>`;
    }

    await boxLoaded;

    // Com tudo carregado (alturas definitivas), rola até a seção pedida no endereço.
    const target = ['#pedidos', '#assinatura'].includes(window.location.hash) ? root.querySelector(window.location.hash) : null;
    target?.scrollIntoView();
}

// ---------- Meus dados: alterar nome e trocar senha ----------
const PROFILE_FORMS = {
    name: (user) => `
        <form class="account-form" data-form="name" novalidate>
            <label>Nome completo
                <input name="name" value="${escapeHtml(user.name)}" autocomplete="name" maxlength="120" required aria-describedby="erro-name">
                <small class="account-field-error" id="erro-name" hidden></small>
            </label>
            <div class="account-form-actions"><button type="submit" class="button button-dark">Salvar nome</button><button type="button" class="account-link-button" data-close-form>Cancelar</button></div>
        </form>`,
    password: () => `
        <form class="account-form" data-form="password" novalidate>
            ${[['currentPassword', 'Senha atual', 'current-password'], ['newPassword', 'Nova senha', 'new-password'], ['confirmPassword', 'Repita a nova senha', 'new-password']].map(([name, label, autocomplete]) => `
                <label>${label}
                    <input name="${name}" type="password" autocomplete="${autocomplete}" maxlength="72" required aria-describedby="erro-${name}">
                    <small class="account-field-error" id="erro-${name}" hidden></small>
                </label>`).join('')}
            <p class="account-form-hint">8 ou mais caracteres, com letras e números.</p>
            <div class="account-form-actions"><button type="submit" class="button button-dark">Trocar senha</button><button type="button" class="account-link-button" data-close-form>Cancelar</button></div>
        </form>`
};

function initProfileForms(root, user) {
    const container = root.querySelector('[data-profile-forms]');
    const actions = root.querySelector('[data-profile-actions]');
    const status = document.createElement('p');
    status.className = 'account-form-status';
    status.setAttribute('role', 'status');
    actions.after(status);

    function close() {
        container.innerHTML = '';
        actions.hidden = false;
    }

    actions.addEventListener('click', (event) => {
        const button = event.target.closest('[data-open-form]');
        if (!button) return;
        status.textContent = '';
        actions.hidden = true;
        container.innerHTML = PROFILE_FORMS[button.dataset.openForm](user);
        container.querySelector('input')?.focus();
    });

    container.addEventListener('click', (event) => {
        if (!event.target.closest('[data-close-form]')) return;
        close();
        actions.querySelector('button')?.focus();
    });

    container.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.target;
        const submit = form.querySelector('[type="submit"]');
        const fields = Object.fromEntries(new FormData(form));
        form.querySelectorAll('.account-field-error').forEach((error) => { error.hidden = true; });
        form.querySelectorAll('input').forEach((input) => input.removeAttribute('aria-invalid'));
        submit.disabled = true;
        try {
            if (form.dataset.form === 'name') {
                const data = await api.post('auth.php?action=profile', fields);
                Object.assign(user, data.user);
                root.querySelector('[data-user-name]').textContent = user.name;
                root.querySelector('.account-hero h1').textContent = `Olá, ${user.firstName}!`;
                status.textContent = 'Nome atualizado.';
            } else {
                await api.post('auth.php?action=password', fields);
                status.textContent = 'Senha trocada. Use a nova senha no próximo login.';
            }
            close();
        } catch (error) {
            submit.disabled = false;
            const entries = Object.entries(error.fields || {});
            entries.forEach(([name, message]) => {
                const input = form.elements[name];
                const box = form.querySelector(`#erro-${name}`);
                if (!input || !box) return;
                input.setAttribute('aria-invalid', 'true');
                box.textContent = message;
                box.hidden = false;
            });
            if (!entries.length) status.textContent = error.message;
            form.querySelector('[aria-invalid="true"]')?.focus();
        }
    });
}

// ---------- F1Hub Box em "Minha conta" ----------
function boxTemplate(data) {
    const subscription = data.subscription;
    if (!subscription) {
        const last = data.lastCancelled;
        return `
            <p>${last ? `Sua assinatura do plano ${escapeHtml(last.plan.name)} foi cancelada em ${escapeHtml(formatDateTime(last.cancelledAt))}. Volte quando quiser!` : 'Você ainda não assina a F1Hub Box. Receba mimos da sua equipe todo mês.'}</p>
            <a class="button button-light" href="${routes.subscription}">${last ? 'Assinar de novo' : 'Conhecer a assinatura'} <span aria-hidden="true">→</span></a>`;
    }
    const team = subscription.team;
    return `
        <p class="account-box-plan"><strong>Plano ${escapeHtml(subscription.plan.name)}</strong> · ${price(subscription.plan.price)}/mês</p>
        <dl class="account-box-details">
            <div><dt>Equipe</dt><dd>${team.color ? `<i class="team-dot" style="--dot: ${escapeHtml(team.color)}" aria-hidden="true"></i>` : ''}${escapeHtml(team.name)}</dd></div>
            ${subscription.shirtSize ? `<div><dt>Camiseta</dt><dd>${escapeHtml(subscription.shirtSize)}</dd></div>` : ''}
            <div><dt>Assinante desde</dt><dd>${escapeHtml(formatDateTime(subscription.startedAt).split(',')[0])}</dd></div>
        </dl>
        ${subscription.plan.available ? '' : '<p class="account-box-warning">Este plano não é mais oferecido. Você continua com ele até escolher outro.</p>'}
        <div class="account-box-actions" data-box-actions>
            <a class="button button-light" href="${routes.subscription}#monte-sua-box">Alterar minha box</a>
            <button type="button" class="account-box-cancel" data-box-cancel>Cancelar assinatura</button>
        </div>
        <p class="account-box-status" role="status" aria-live="polite"></p>`;
}

async function initBoxCard(container) {
    let data;
    try {
        data = await subscriptionService.mine();
    } catch (error) {
        container.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
        return;
    }
    const render = () => { container.innerHTML = boxTemplate(data); };
    render();

    // Cancelar pede confirmação na própria página (sem caixas do navegador).
    container.addEventListener('click', async (event) => {
        const actions = container.querySelector('[data-box-actions]');
        if (event.target.closest('[data-box-cancel]')) {
            actions.innerHTML = `
                <p class="account-box-confirm">Cancelar a assinatura do plano ${escapeHtml(data.subscription.plan.name)}? Você deixa de receber as próximas caixas.</p>
                <button type="button" class="account-box-cancel is-confirm" data-box-confirm>Sim, cancelar</button>
                <button type="button" class="button button-light" data-box-keep>Manter assinatura</button>`;
            actions.querySelector('[data-box-keep]').focus();
            return;
        }
        if (event.target.closest('[data-box-keep]')) {
            render();
            container.querySelector('[data-box-cancel]')?.focus();
            return;
        }
        const confirmButton = event.target.closest('[data-box-confirm]');
        if (confirmButton) {
            confirmButton.disabled = true;
            confirmButton.textContent = 'Cancelando...';
            try {
                data = await subscriptionService.cancel();
                render();
                container.insertAdjacentHTML('beforeend', '<p class="account-box-status" role="status">Assinatura cancelada.</p>');
            } catch (error) {
                confirmButton.disabled = false;
                confirmButton.textContent = 'Sim, cancelar';
                container.querySelector('.account-box-status').textContent = error.message;
            }
        }
    });
}
