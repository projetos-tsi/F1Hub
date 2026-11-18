import { cartService } from '../services/cart-service.js';
import { catalogService, routes } from '../services/catalog-service.js';
import { priceTemplate, productCardTemplate } from '../ui/product-card.js';

export function initProductPage() {
    const productMedia = document.querySelector('.product-media');
    const productInfo = document.querySelector('.product-infos');
    if (!productMedia || !productInfo) return;

    const requestedId = new URLSearchParams(window.location.search).get('id') || 'mercedes-polo-2025-preta';
    const product = catalogService.byId(requestedId);

    if (!product) {
        document.title = 'Produto não encontrado | F1 Hub';
        document.querySelector('body > main').innerHTML = `
            <section class="product-not-found">
                <p class="eyebrow">Fora do grid</p><h1>Produto não encontrado</h1>
                <p>Este item não está disponível no catálogo atual.</p>
                <a class="button button-dark" href="${routes.home}">Voltar para a loja</a>
            </section>`;
        return;
    }

    document.title = `${product.name} | F1 Hub`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', product.description);
    productMedia.dataset.team = product.team;
    productMedia.innerHTML = `<img src="${product.imageUrl}" alt="${product.name}">`;

    const title = productInfo.querySelector('.title');
    title.style.setProperty('--team-color', product.teamColor);
    title.innerHTML = `
        <p class="product-team-label">${product.teamLabel}</p>
        <h1>${product.name}</h1>
        <div class="prices">
            <p>${priceTemplate(product)}</p>
            ${product.discount ? `<span class="discount-chip">-${product.discount}%</span>` : ''}
            <p class="pix">${catalogService.pixPrice(product.price)} com 5% de desconto no PIX</p>
        </div>`;

    const sizes = productInfo.querySelector('.sizes');
    sizes.innerHTML = `
        <p class="size-label">Escolha o tamanho</p>
        <div class="size-buttons">${product.sizes.map((size) => `<button type="button" data-size="${size}" aria-pressed="false">${size}</button>`).join('')}</div>
        <button type="button" class="add-to-cart">Adicionar ao carrinho</button>
        <p class="purchase-status" role="status" aria-live="polite"></p>`;

    const description = productInfo.querySelector('.description');
    description.innerHTML = `
        <div class="product-description"><h2>${product.category} ${product.teamName}: identidade das pistas para o seu estilo</h2><p>${product.description}</p></div>
        <div class="product-info"><ul>${product.details.map((detail) => `<li>${detail}</li>`).join('')}</ul></div>`;

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
        cartService.add(product.id, selectedSize);
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
