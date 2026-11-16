import { catalogService } from '../services/catalog-service.js';

const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export function productCardTemplate(product, className = 'team-product') {
    return `
        <a href="${product.url}" class="${className}" data-product-id="${escapeHtml(product.id)}">
            <img src="${product.imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy">
            <p>${escapeHtml(product.name)}</p>
            <div class="team-product-prices">
                <p>${catalogService.formatPrice(product.price)}</p>
                <p class="pix-note">${catalogService.pixPrice(product.price)} no PIX</p>
            </div>
        </a>`;
}

export function searchResultTemplate(product) {
    return `
        <a class="search-result" href="${product.url}" data-product-id="${escapeHtml(product.id)}">
            <img src="${product.imageUrl}" alt="">
            <span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.teamName)} · ${escapeHtml(product.category)}</small></span>
            <b>${catalogService.formatPrice(product.price)}</b>
        </a>`;
}
