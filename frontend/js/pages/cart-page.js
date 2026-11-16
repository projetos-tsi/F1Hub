import { cartService } from '../services/cart-service.js';
import { catalogService, routes } from '../services/catalog-service.js';

export function initCartPage() {
    const root = document.getElementById('cart-content');
    if (!root) return;

    function render() {
        const cartItems = cartService.getItems().map((item) => ({ ...item, product: catalogService.byId(item.productId) })).filter((item) => item.product);
        if (!cartItems.length) {
            root.innerHTML = `<section class="empty-cart"><span aria-hidden="true">0</span><h1>Seu carrinho está vazio</h1><p>Escolha uma equipe e encontre a peça que vai largar com você.</p><a class="button button-dark" href="${new URL('equipes.html', window.location.href).href}">Explorar produtos</a></section>`;
            return;
        }

        const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        root.innerHTML = `
            <div class="cart-layout">
                <section class="cart-list" aria-labelledby="cart-title">
                    <div class="cart-heading"><div><p class="eyebrow">Seu grid</p><h1 id="cart-title">Carrinho</h1></div><button type="button" class="clear-cart">Limpar carrinho</button></div>
                    ${cartItems.map((item) => `
                        <article class="cart-item" data-product-id="${item.product.id}" data-size="${item.size}">
                            <a href="${item.product.url}"><img src="${item.product.imageUrl}" alt="${item.product.name}"></a>
                            <div class="cart-item-copy"><p class="product-team" style="color:${item.product.teamColor}">${item.product.teamName}</p><h2><a href="${item.product.url}">${item.product.name}</a></h2><p>Tamanho: <strong>${item.size}</strong></p><button type="button" class="remove-item">Remover</button></div>
                            <div class="quantity-control" aria-label="Quantidade"><button type="button" data-action="decrease" aria-label="Diminuir quantidade">−</button><output>${item.quantity}</output><button type="button" data-action="increase" aria-label="Aumentar quantidade">+</button></div>
                            <strong class="cart-item-price">${catalogService.formatPrice(item.product.price * item.quantity)}</strong>
                        </article>`).join('')}
                </section>
                <aside class="cart-summary"><h2>Resumo do pedido</h2><div><span>Subtotal</span><strong>${catalogService.formatPrice(subtotal)}</strong></div><div class="pix-total"><span>Total no PIX</span><strong>${catalogService.pixPrice(subtotal)}</strong></div><p>A finalização atual é uma demonstração front-end e não processa pedidos ou pagamentos reais.</p><a class="checkout-button" href="${routes.checkout}">Ir para finalização</a><a href="${routes.home}">Continuar comprando</a></aside>
            </div>`;
    }

    root.addEventListener('click', (event) => {
        if (event.target.closest('.clear-cart')) { cartService.clear(); render(); return; }
        const item = event.target.closest('.cart-item');
        if (!item) return;
        const { productId, size } = item.dataset;
        const current = cartService.getItems().find((entry) => entry.productId === productId && entry.size === size);
        if (!current) return;
        if (event.target.closest('.remove-item')) cartService.remove(productId, size);
        if (event.target.closest('[data-action="increase"]')) cartService.update(productId, size, current.quantity + 1);
        if (event.target.closest('[data-action="decrease"]')) cartService.update(productId, size, current.quantity - 1);
        render();
    });

    render();
}
