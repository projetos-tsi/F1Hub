import { CART_LIMITS, cartService } from '../services/cart-service.js';
import { catalogService, routes } from '../services/catalog-service.js';
import { catalogErrorTemplate, escapeHtml } from '../ui/product-card.js';

/** Aviso dos itens retirados do carrinho por não estarem mais à venda (ver cartService.prune). */
export function removedItemsNotice(count) {
    if (!count) return '';
    const text = count === 1
        ? '1 item do seu carrinho não está mais disponível e foi removido.'
        : `${count} itens do seu carrinho não estão mais disponíveis e foram removidos.`;
    return `<p class="cart-notice" role="status">${text}</p>`;
}

export async function initCartPage(catalogReady) {
    const root = document.getElementById('cart-content');
    if (!root) return;

    if (!(await catalogReady)) {
        // Sem catálogo não dá para conferir preços nem disponibilidade: o carrinho é mantido como está.
        root.innerHTML = `<div class="cart-layout">${catalogErrorTemplate()}</div>`;
        return;
    }

    let notice = removedItemsNotice(cartService.removedNotice());

    function render() {
        const cartItems = cartService.getItems().map((item) => ({ ...item, product: catalogService.byId(item.productId) })).filter((item) => item.product);
        if (!cartItems.length) {
            root.innerHTML = `${notice}<section class="empty-cart"><span aria-hidden="true">0</span><h1>Seu carrinho está vazio</h1><p>Escolha uma equipe e encontre a peça que vai largar com você.</p><a class="button button-dark" href="${new URL('equipes.html', window.location.href).href}">Explorar produtos</a></section>`;
            return;
        }

        const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        // Economia com produtos em promoção (diferença entre o preço "de" e o preço de venda).
        const savings = cartItems.reduce((sum, item) => sum + (item.product.oldPrice ? (item.product.oldPrice - item.product.price) * item.quantity : 0), 0);
        root.innerHTML = `
            ${notice}
            <div class="cart-layout">
                <section class="cart-list" aria-labelledby="cart-title">
                    <div class="cart-heading"><div><p class="eyebrow">Seu grid</p><h1 id="cart-title">Carrinho</h1></div><button type="button" class="clear-cart">Limpar carrinho</button></div>
                    ${cartItems.map((item) => `
                        <article class="cart-item" data-product-id="${escapeHtml(item.product.id)}" data-size="${escapeHtml(item.size)}">
                            <a href="${item.product.url}"><img src="${item.product.imageUrl}" alt="${escapeHtml(item.product.name)}"></a>
                            <div class="cart-item-copy"><p class="product-team" style="color:${escapeHtml(item.product.teamColor)}">${escapeHtml(item.product.teamName)}</p><h2><a href="${item.product.url}">${escapeHtml(item.product.name)}</a></h2><p>Tamanho: <strong>${escapeHtml(item.size)}</strong></p><button type="button" class="remove-item">Remover</button></div>
                            <div class="quantity-control" aria-label="Quantidade"><button type="button" data-action="decrease" aria-label="Diminuir quantidade">−</button><output>${item.quantity}</output><button type="button" data-action="increase" aria-label="Aumentar quantidade"${item.quantity >= CART_LIMITS.quantity ? ` disabled title="Máximo de ${CART_LIMITS.quantity} unidades por item"` : ''}>+</button></div>
                            <strong class="cart-item-price">${catalogService.formatPrice(item.product.price * item.quantity)}</strong>
                        </article>`).join('')}
                </section>
                <aside class="cart-summary"><h2>Resumo do pedido</h2><div><span>Subtotal</span><strong>${catalogService.formatPrice(subtotal)}</strong></div>${savings ? `<div class="cart-savings"><span>Você economiza</span><strong>${catalogService.formatPrice(savings)}</strong></div>` : ''}<div class="pix-total"><span>Total no PIX</span><strong>${catalogService.pixPrice(subtotal)}</strong></div><p>Pagamento via PIX simulado: o pedido é registrado na sua conta, sem cobrança real. Até ${CART_LIMITS.quantity} unidades por item.</p><a class="checkout-button" href="${routes.checkout}">Ir para finalização</a><a href="${routes.home}">Continuar comprando</a></aside>
            </div>`;
    }

    root.addEventListener('click', (event) => {
        if (event.target.closest('.clear-cart')) { cartService.clear(); notice = ''; render(); return; }
        const item = event.target.closest('.cart-item');
        if (!item) return;
        const { productId, size } = item.dataset;
        const current = cartService.getItems().find((entry) => entry.productId === productId && entry.size === size);
        if (!current) return;
        if (event.target.closest('.remove-item')) cartService.remove(productId, size);
        if (event.target.closest('[data-action="increase"]')) cartService.update(productId, size, current.quantity + 1);
        if (event.target.closest('[data-action="decrease"]')) cartService.update(productId, size, current.quantity - 1);
        notice = '';
        render();
    });

    render();
}
