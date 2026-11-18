import { CART_LIMITS, cartService } from '../services/cart-service.js';
import { catalogService, routes } from '../services/catalog-service.js';
import { escapeHtml, priceTemplate, productCardTemplate } from '../ui/product-card.js';
import { sizeGuide } from '../data/size-guide.js';

// Guia de medidas em uma janela modal nativa (<dialog>): fecha com Esc, com o botão ou clicando fora.
function initSizeGuide(trigger, product) {
    const dialog = document.createElement('dialog');
    dialog.className = 'size-guide';
    dialog.setAttribute('aria-labelledby', 'size-guide-title');
    dialog.innerHTML = `
        <div class="size-guide-header">
            <div><p class="eyebrow">${escapeHtml(product.category)}</p><h2 id="size-guide-title">Guia de medidas</h2></div>
            <button type="button" class="size-guide-close" aria-label="Fechar guia de medidas">×</button>
        </div>
        <table>
            <caption class="sr-only">Medidas da peça em centímetros por tamanho</caption>
            <thead><tr><th scope="col">Tamanho</th><th scope="col">Largura (cm)</th><th scope="col">Comprimento (cm)</th></tr></thead>
            <tbody>${sizeGuide.rows.filter((row) => product.sizes.includes(row.size)).map((row) => `<tr><th scope="row">${row.size}</th><td>${row.chest}</td><td>${row.length}</td></tr>`).join('')}</tbody>
        </table>
        <p class="size-guide-tip"><strong>Como medir:</strong> largura de axila a axila, com a peça esticada; comprimento do ombro até a barra.</p>
        <p class="size-guide-note">${sizeGuide.note}</p>`;
    document.body.append(dialog);

    trigger.addEventListener('click', () => dialog.showModal());
    dialog.querySelector('.size-guide-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
}

export async function initProductPage(catalogReady) {
    const productMedia = document.querySelector('.product-media');
    const productInfo = document.querySelector('.product-infos');
    if (!productMedia || !productInfo) return;

    const loaded = await catalogReady;
    const requestedId = new URLSearchParams(window.location.search).get('id') || 'mercedes-polo-2025-preta';
    // Produto desativado ou excluído no admin não vem na API: a página mostra "não encontrado".
    const product = loaded ? catalogService.byId(requestedId) : null;

    if (!product) {
        document.title = loaded ? 'Produto não encontrado | F1 Hub' : 'Catálogo indisponível | F1 Hub';
        document.querySelector('body > main').innerHTML = `
            <section class="product-not-found">
                <p class="eyebrow">Fora do grid</p><h1>${loaded ? 'Produto não encontrado' : 'Catálogo indisponível'}</h1>
                <p>${loaded ? 'Este item não está disponível no catálogo atual.' : 'Não foi possível carregar os produtos. Verifique se o Apache e o MySQL do XAMPP estão ativos e recarregue a página.'}</p>
                <a class="button button-dark" href="${routes.home}">Voltar para a loja</a>
            </section>`;
        document.querySelectorAll('.carroussel-title, .carroussel-buttons-wrappers, .carroussel').forEach((element) => { element.hidden = true; });
        return;
    }

    document.title = `${product.name} | F1 Hub`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', product.description);
    productMedia.dataset.team = product.team;
    productMedia.innerHTML = `<img src="${product.imageUrl}" alt="${escapeHtml(product.name)}">`;

    const title = productInfo.querySelector('.title');
    title.style.setProperty('--team-color', product.teamColor);
    title.innerHTML = `
        <p class="product-team-label">${escapeHtml(product.teamLabel)}</p>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="prices">
            <p>${priceTemplate(product)}</p>
            ${product.discount ? `<span class="discount-chip">-${product.discount}%</span>` : ''}
            <p class="pix">${catalogService.pixPrice(product.price)} com 5% de desconto no PIX</p>
        </div>`;

    const hasSizeGuide = product.sizes.some((size) => sizeGuide.rows.some((row) => row.size === size));
    const sizes = productInfo.querySelector('.sizes');
    sizes.innerHTML = `
        <div class="size-label-row">
            <p class="size-label">Escolha o tamanho</p>
            ${hasSizeGuide ? '<button type="button" class="size-guide-button" aria-haspopup="dialog">Guia de medidas</button>' : ''}
        </div>
        <div class="size-buttons">${product.sizes.map((size) => `<button type="button" data-size="${size}" aria-pressed="false">${size}</button>`).join('')}</div>
        <button type="button" class="add-to-cart">Adicionar ao carrinho</button>
        <p class="purchase-status" role="status" aria-live="polite"></p>`;

    const description = productInfo.querySelector('.description');
    description.innerHTML = `
        <div class="product-description"><h2>${escapeHtml(product.category)} ${escapeHtml(product.teamName)}: identidade das pistas para o seu estilo</h2><p>${escapeHtml(product.description)}</p></div>
        <div class="product-info"><ul>${product.details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join('')}</ul></div>`;

    if (hasSizeGuide) initSizeGuide(sizes.querySelector('.size-guide-button'), product);

    let selectedSize = null;
    sizes.querySelectorAll('.size-buttons button').forEach((button) => {
        button.addEventListener('click', () => {
            selectedSize = button.dataset.size;
            sizes.querySelectorAll('.size-buttons button').forEach((option) => {
                const selected = option === button;
                option.classList.toggle('is-selected', selected);
                option.setAttribute('aria-pressed', String(selected));
            });
            sizes.querySelector('.purchase-status').textContent = '';
        });
    });

    sizes.querySelector('.add-to-cart').addEventListener('click', () => {
        const status = sizes.querySelector('.purchase-status');
        if (!selectedSize) {
            status.textContent = 'Selecione um tamanho antes de adicionar ao carrinho.';
            status.classList.add('is-error');
            return;
        }
        const result = cartService.add(product.id, selectedSize);
        if (!result.added) {
            status.textContent = result.reason === 'quantity'
                ? `Você já tem o máximo de ${CART_LIMITS.quantity} unidades deste item no carrinho.`
                : `O carrinho aceita até ${CART_LIMITS.lines} itens diferentes por pedido.`;
            status.classList.add('is-error');
            return;
        }
        status.classList.remove('is-error');
        status.innerHTML = `Produto adicionado. <a href="${routes.cart}">Ver carrinho</a>`;
    });

    const carousel = document.querySelector('.carroussel');
    const controls = document.querySelector('.carroussel-buttons-wrappers');
    if (carousel) {
        carousel.innerHTML = `<div class="carroussel-track">${catalogService.similar(product, 8).map((item) => productCardTemplate(item, 'carroussel-product')).join('')}</div>`;
    }
    if (controls && carousel) {
        controls.innerHTML = `
            <button type="button" data-carousel-direction="-1" aria-label="Produtos anteriores"><img src="../assets/images/chevron-left.svg" alt=""></button>
            <button type="button" data-carousel-direction="1" aria-label="Próximos produtos"><img src="../assets/images/chevron-right.svg" alt=""></button>`;
        controls.addEventListener('click', (event) => {
            const button = event.target.closest('[data-carousel-direction]');
            if (!button) return;
            carousel.scrollBy({ left: Number(button.dataset.carouselDirection) * carousel.clientWidth * .82, behavior: 'smooth' });
        });
    }
}
