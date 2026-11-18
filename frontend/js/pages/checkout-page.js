import { api, ApiError } from '../services/api-client.js';
import { authService } from '../services/auth-service.js';
import { cartService } from '../services/cart-service.js';
import { catalogService, pixDiscount, routes } from '../services/catalog-service.js';
import { catalogErrorTemplate, escapeHtml } from '../ui/product-card.js';
import { removedItemsNotice } from './cart-page.js';

// Finalização do pedido (fase B4b):
// - exige login (quem não está logado entra e volta para cá, com o carrinho intacto);
// - o navegador envia só produto, tamanho e quantidade; o servidor recalcula tudo com os preços do banco;
// - o total exibido vai junto (expectedTotal): se o preço mudou, o servidor recusa e a tela é atualizada;
// - a mesma "chave de finalização" em reenvios (clique duplo) devolve o mesmo pedido.

const STATES = [
    ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'],
    ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'],
    ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
    ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
    ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'],
    ['SE', 'Sergipe'], ['TO', 'Tocantins']
];

// Mesmas regras do servidor (OrderService::address).
const FIELD_RULES = {
    postalCode: { test: (value) => value.replace(/\D/g, '').length === 8, message: 'Informe um CEP com 8 números.' },
    state: { test: (value) => STATES.some(([uf]) => uf === value), message: 'Escolha o estado.' },
    city: { test: (value) => /^[\p{L}\p{M}'’.\- ]{2,80}$/u.test(value.trim()), message: 'Informe a cidade (somente letras).' },
    address: { test: (value) => /^[\p{L}\p{M}\p{N}'’.,ºª°#&()/\- ]{3,160}$/u.test(value.trim()), message: 'Informe o endereço (rua, avenida...), com até 160 caracteres.' },
    number: { test: (value) => /^[0-9A-Za-z/ -]{1,10}$/.test(value.trim()), message: 'Informe o número (ou S/N), com até 10 caracteres.' }
};

/** Identificador desta finalização (o mesmo em reenvios). Funciona também fora de HTTPS. */
function newCheckoutKey() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function cartLines() {
    return cartService.getItems()
        .map((entry) => ({ ...entry, product: catalogService.byId(entry.productId) }))
        .filter((entry) => entry.product);
}

function totals(lines) {
    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const discount = pixDiscount(subtotal);
    return { subtotal, discount, total: subtotal - discount };
}

const price = (cents) => catalogService.formatPrice(cents);

function summaryTemplate(lines, { subtotal, discount, total }, editable = true) {
    return `
        <aside class="checkout-summary" aria-labelledby="checkout-summary-title">
            <h2 id="checkout-summary-title">Resumo</h2>
            ${lines.map((line) => `
                <article>
                    <span class="checkout-thumb" data-team="${escapeHtml(line.product.team)}"><img src="${line.product.imageUrl}" alt=""></span>
                    <div><strong>${escapeHtml(line.product.name)}</strong><span>Tamanho ${escapeHtml(line.size)} · ${line.quantity} ${line.quantity === 1 ? 'unidade' : 'unidades'}</span></div>
                    <b>${price(line.product.price * line.quantity)}</b>
                </article>`).join('')}
            <div class="summary-row"><span>Subtotal</span><strong>${price(subtotal)}</strong></div>
            <div class="summary-row summary-discount"><span>Desconto PIX (5%)</span><strong>− ${price(discount)}</strong></div>
            <div class="summary-row summary-total"><span>Total no PIX</span><strong>${price(total)}</strong></div>
            ${editable ? `<a href="${routes.cart}">Editar carrinho</a>` : ''}
        </aside>`;
}

function headingTemplate(eyebrow, title, text) {
    return `<div class="checkout-heading"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${text}</p></div>`;
}

function loginGateTemplate() {
    const back = encodeURIComponent(new URL(routes.checkout).pathname);
    return `
        <section class="checkout-gate" aria-labelledby="checkout-gate-title">
            <span class="checkout-gate-icon" aria-hidden="true">🔒</span>
            <h2 id="checkout-gate-title">Entre para finalizar</h2>
            <p>Para registrar o pedido na sua conta, entre ou crie uma conta. Seu carrinho fica guardado e você volta direto para cá.</p>
            <div class="checkout-gate-actions">
                <a class="button button-dark" href="${routes.login}?redirect=${back}">Entrar na minha conta</a>
                <a class="button-outline" href="${routes.register}?redirect=${back}">Criar conta</a>
            </div>
        </section>`;
}

function formTemplate(user, amounts) {
    const field = (name, label, attributes, extraClass = '') => `
        <label class="${extraClass}">${label}
            <input name="${name}" ${attributes} aria-describedby="erro-${name}">
            <small class="field-error" id="erro-${name}" hidden></small>
        </label>`;
    return `
        <form class="checkout-form" novalidate>
            <section>
                <div class="checkout-section-title"><span>1</span><div><h2>Sua conta</h2><p>O pedido fica registrado em "Minha conta".</p></div></div>
                <dl class="checkout-account">
                    <div><dt>Nome</dt><dd>${escapeHtml(user.name)}</dd></div>
                    <div><dt>E-mail</dt><dd>${escapeHtml(user.email)}</dd></div>
                </dl>
            </section>
            <section>
                <div class="checkout-section-title"><span>2</span><div><h2>Entrega</h2><p>Endereço para onde o pedido será enviado.</p></div></div>
                <div class="field-grid">
                    ${field('postalCode', 'CEP', 'inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" required')}
                    <label>Estado
                        <select name="state" autocomplete="address-level1" required aria-describedby="erro-state">
                            <option value="">Escolha</option>
                            ${STATES.map(([uf, name]) => `<option value="${uf}">${uf} — ${name}</option>`).join('')}
                        </select>
                        <small class="field-error" id="erro-state" hidden></small>
                    </label>
                    ${field('city', 'Cidade', 'autocomplete="address-level2" maxlength="80" required', 'full-field')}
                    ${field('address', 'Endereço', 'autocomplete="address-line1" maxlength="160" placeholder="Rua, avenida, complemento" required', 'full-field')}
                    ${field('number', 'Número', 'autocomplete="address-line2" maxlength="10" placeholder="123 ou S/N" required')}
                </div>
            </section>
            <section>
                <div class="checkout-section-title"><span>3</span><div><h2>Pagamento</h2><p>PIX com 5% de desconto.</p></div></div>
                <label class="payment-option"><input type="radio" name="payment" value="pix" checked><span><strong>PIX</strong><small>5% de desconto · pagamento simulado (projeto acadêmico, nada é cobrado)</small></span></label>
                <label class="payment-option is-disabled"><input type="radio" name="payment" value="card" disabled><span><strong>Cartão de crédito</strong><small>Em breve</small></span></label>
            </section>
            <p class="checkout-form-status" role="status" aria-live="polite"></p>
            <button class="review-order" type="submit">Finalizar pedido · ${price(amounts.total)} no PIX</button>
        </form>`;
}

function confirmationTemplate(order, lines) {
    const date = new Date(order.createdAt.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    return `
        ${headingTemplate('Pedido recebido', `Pedido #${order.id} registrado!`, `Feito em ${escapeHtml(date)}. Você acompanha a situação em "Minha conta".`)}
        <div class="checkout-layout">
            <section class="checkout-success" aria-labelledby="checkout-success-title">
                <span class="checkout-success-icon" aria-hidden="true">✓</span>
                <h2 id="checkout-success-title">Pagamento via PIX (simulado)</h2>
                <p>Total: <strong>${price(order.total)}</strong> com ${price(order.discount)} de desconto.</p>
                <p>Este é um projeto acadêmico: nenhum valor é cobrado. A equipe da loja confirma o pagamento pela área administrativa e a situação do pedido muda de <strong>Recebido</strong> para <strong>Pago</strong>, <strong>Enviado</strong> e <strong>Entregue</strong>.</p>
                <div class="checkout-gate-actions">
                    <a class="button button-dark" href="${routes.account}#pedidos">Ver meus pedidos</a>
                    <a class="button-outline" href="${routes.catalog}">Continuar comprando</a>
                </div>
            </section>
            ${summaryTemplate(lines, order, false)}
        </div>`;
}

export async function initCheckoutPage(catalogReady) {
    const root = document.querySelector('[data-checkout-page]');
    if (!root) return;

    const [loaded, user] = await Promise.all([catalogReady, authService.me()]);
    if (!loaded) {
        root.innerHTML = catalogErrorTemplate();
        return;
    }

    const notice = removedItemsNotice(cartService.removedNotice());
    let lines = cartLines();
    if (!lines.length) {
        root.innerHTML = `${notice}<section class="empty-cart"><span aria-hidden="true">0</span><h1>Seu carrinho está vazio</h1><p>Adicione um produto antes de acessar a finalização.</p><a class="button button-dark" href="${routes.catalog}">Explorar catálogo</a></section>`;
        return;
    }

    let amounts = totals(lines);
    if (!user) {
        root.innerHTML = `${notice}${headingTemplate('Finalização', 'Quase lá!', 'Confira o resumo e entre na sua conta para concluir o pedido.')}
            <div class="checkout-layout">${loginGateTemplate()}${summaryTemplate(lines, amounts)}</div>`;
        return;
    }

    root.innerHTML = `${notice}${headingTemplate('Finalização', 'Finalize seu pedido', 'Confira seus dados, informe o endereço e conclua com PIX.')}
        <div class="checkout-layout">${formTemplate(user, amounts)}${summaryTemplate(lines, amounts)}</div>`;

    const form = root.querySelector('.checkout-form');
    const status = form.querySelector('.checkout-form-status');
    const submit = form.querySelector('.review-order');
    const submitLabel = submit.textContent;
    const checkoutKey = newCheckoutKey();

    // Máscara do CEP: 00000-000.
    form.elements.postalCode.addEventListener('input', (event) => {
        const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
        event.target.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    });

    function showFieldError(name, message) {
        const input = form.elements[name];
        const error = form.querySelector(`#erro-${name}`);
        if (!input || !error) return;
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        error.textContent = message || '';
        error.hidden = !message;
    }

    function validate() {
        let firstInvalid = null;
        Object.entries(FIELD_RULES).forEach(([name, rule]) => {
            const valid = rule.test(form.elements[name].value);
            showFieldError(name, valid ? '' : rule.message);
            if (!valid && !firstInvalid) firstInvalid = form.elements[name];
        });
        firstInvalid?.focus();
        return !firstInvalid;
    }

    // O erro de um campo some assim que o valor fica válido (enquanto digita ou ao escolher o estado).
    Object.keys(FIELD_RULES).forEach((name) => {
        const clearWhenValid = () => {
            if (form.elements[name].getAttribute('aria-invalid') === 'true' && FIELD_RULES[name].test(form.elements[name].value)) showFieldError(name, '');
        };
        form.elements[name].addEventListener('input', clearWhenValid);
        form.elements[name].addEventListener('change', clearWhenValid);
    });

    function setStatus(message, type = '', action = '') {
        status.className = `checkout-form-status${type ? ` is-${type}` : ''}`;
        status.innerHTML = `${escapeHtml(message)}${action}`;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submit.disabled) return;
        if (!validate()) {
            setStatus('Confira os campos destacados.', 'error');
            return;
        }

        // Releitura do carrinho: pode ter mudado em outra aba.
        lines = cartLines();
        amounts = totals(lines);
        if (!lines.length) {
            window.location.reload();
            return;
        }

        submit.disabled = true;
        submit.textContent = 'Registrando pedido...';
        setStatus('');
        try {
            const data = await api.post('orders.php?action=create', {
                items: lines.map((line) => ({ productId: line.productId, size: line.size, quantity: line.quantity })),
                address: Object.fromEntries(Object.keys(FIELD_RULES).map((name) => [name, form.elements[name].value.trim()])),
                expectedTotal: amounts.total,
                checkoutKey
            });
            cartService.clear();
            document.title = `Pedido #${data.order.id} registrado | F1 Hub`;
            root.innerHTML = confirmationTemplate(data.order, lines);
            root.querySelector('h1')?.setAttribute('tabindex', '-1');
            root.querySelector('h1')?.focus();
            window.scrollTo({ top: 0 });
        } catch (error) {
            submit.disabled = false;
            submit.textContent = submitLabel;
            if (error instanceof ApiError && error.status === 409) {
                setStatus(error.message, 'error', ' <button type="button" class="checkout-refresh" data-refresh>Atualizar resumo</button>');
                form.querySelector('[data-refresh]').addEventListener('click', () => window.location.reload());
                return;
            }
            if (error instanceof ApiError && error.status === 401) {
                setStatus('Sua sessão terminou. ', 'error', `<a href="${routes.login}?redirect=${encodeURIComponent(new URL(routes.checkout).pathname)}">Entre de novo</a> para finalizar — o carrinho continua salvo.`);
                return;
            }
            Object.entries(error.fields || {}).forEach(([name, message]) => showFieldError(name, message));
            setStatus(error.message, 'error');
        }
    });
}
