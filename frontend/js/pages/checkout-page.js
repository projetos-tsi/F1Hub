import { cartService } from '../services/cart-service.js';
import { catalogService, routes } from '../services/catalog-service.js';
import { catalogErrorTemplate, escapeHtml } from '../ui/product-card.js';

export async function initCheckoutPage(catalogReady) {
    const root = document.querySelector('[data-checkout-page]');
    if (!root) return;
    if (!(await catalogReady)) {
        root.innerHTML = catalogErrorTemplate();
        return;
    }
    const items = cartService.getItems().map((entry) => ({ ...entry, product: catalogService.byId(entry.productId) })).filter((entry) => entry.product);

    if (!items.length) {
        root.innerHTML = `<section class="empty-cart"><span aria-hidden="true">0</span><h1>Seu carrinho está vazio</h1><p>Adicione um produto antes de acessar a finalização.</p><a class="button button-dark" href="${routes.catalog}">Explorar catálogo</a></section>`;
        return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    root.innerHTML = `
        <div class="checkout-heading"><p class="eyebrow">Prévia da finalização</p><h1>Confira como será o checkout</h1><p>Esta tela é apenas uma prévia visual. Nenhum pagamento, pedido ou dado será processado.</p></div>
        <div class="checkout-layout">
            <form class="checkout-form">
                <section><div class="checkout-section-title"><span>1</span><div><h2>Contato</h2><p>Campos ilustrativos para a futura integração.</p></div></div><div class="field-grid"><label class="full-field">Nome completo<input name="name" autocomplete="name"></label><label>E-mail<input name="email" type="email" autocomplete="email"></label><label>Telefone<input name="phone" type="tel" autocomplete="tel" placeholder="(11) 99999-9999"></label></div></section>
                <section><div class="checkout-section-title"><span>2</span><div><h2>Entrega</h2><p>Informe o endereço para simular o resumo do pedido.</p></div></div><div class="field-grid"><label>CEP<input name="postalCode" inputmode="numeric" autocomplete="postal-code" required maxlength="9" placeholder="00000-000"></label><label>Estado<input name="state" autocomplete="address-level1" required maxlength="2" placeholder="SP"></label><label class="full-field">Endereço<input name="address" autocomplete="street-address" required></label><label>Número<input name="number" inputmode="numeric" required></label><label>Cidade<input name="city" autocomplete="address-level2" required></label></div></section>
                <section><div class="checkout-section-title"><span>3</span><div><h2>Pagamento</h2><p>Métodos reais serão conectados somente pelo backend.</p></div></div><label class="payment-option"><input type="radio" name="payment" value="pix" checked><span><strong>PIX</strong><small>5% de desconto · demonstração visual</small></span></label><label class="payment-option is-disabled"><input type="radio" name="payment" value="card" disabled><span><strong>Cartão de crédito</strong><small>Disponível após integração segura</small></span></label></section>
                <p class="checkout-form-status">A conclusão do pedido será disponibilizada somente apó a integração segura com o backend.</p>
                <button class="review-order" type="button" disabled>Finalização indisponível</button>
            </form>
            <aside class="checkout-summary"><h2>Resumo</h2>${items.map((item) => `<article><img src="${item.product.imageUrl}" alt=""><div><strong>${escapeHtml(item.product.name)}</strong><span>${escapeHtml(item.size)} · ${item.quantity} un.</span></div><b>${catalogService.formatPrice(item.product.price * item.quantity)}</b></article>`).join('')}<div class="summary-row"><span>Subtotal</span><strong>${catalogService.formatPrice(subtotal)}</strong></div><div class="summary-row pix-total"><span>Total no PIX</span><strong>${catalogService.pixPrice(subtotal)}</strong></div><a href="${routes.cart}">Editar carrinho</a></aside>
        </div>`;
}
