import { catalogService } from '../services/catalog-service.js';

export const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

// Selo do card: um selo manual tem prioridade; depois promoção (-X%) e, por fim, lançamento 2026.
export function productBadgeTemplate(product, manualTag = '') {
    if (manualTag) return `<span class="product-tag">${escapeHtml(manualTag)}</span>`;
    if (product.discount) return `<span class="product-tag sale">-${product.discount}%</span>`;
    if (product.isNew) return '<span class="product-tag new">Novo</span>';
    return '';
}

export function priceTemplate(product) {
    const oldPrice = product.oldPrice
        ? ` <s class="old-price"><span class="sr-only">De </span>${catalogService.formatPrice(product.oldPrice)}</s>`
        : '';
    return `${product.oldPrice ? '<span class="sr-only">Por </span>' : ''}${catalogService.formatPrice(product.price)}${oldPrice}`;
}

export function productCardTemplate(product, className = 'team-product') {
    return `
        <a href="${product.url}" class="${className}" data-product-id="${escapeHtml(product.id)}" data-team="${escapeHtml(product.team)}">
            <span class="product-visual">${productBadgeTemplate(product)}<img src="${product.imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy"></span>
            <p>${escapeHtml(product.name)}</p>
            <div class="team-product-prices">
                <p>${priceTemplate(product)}</p>
                <p class="pix-note">${catalogService.pixPrice(product.price)} no PIX</p>
            </div>
        </a>`;
}

export function homeProductCardTemplate(product, tag = '') {
    return `
        <article class="product-card">
            <a href="${product.url}" class="product-image" data-team="${escapeHtml(product.team)}" tabindex="-1" aria-hidden="true">
                ${productBadgeTemplate(product, tag)}
                <img src="${product.imageUrl}" alt="" loading="lazy">
                <span class="product-quick">Ver opções</span>
            </a>
            <div class="product-copy">
                <p class="product-team ${escapeHtml(product.team)}-text">${escapeHtml(product.teamName)}</p>
                <h3><a href="${product.url}">${escapeHtml(product.name)}</a></h3>
                <p class="product-price">${priceTemplate(product)}</p>
                <p class="pix-note">${catalogService.pixPrice(product.price)} no PIX</p>
            </div>
        </article>`;
}

export function searchResultTemplate(product) {
    return `
        <a class="search-result" href="${product.url}" data-product-id="${escapeHtml(product.id)}">
            <img src="${product.imageUrl}" alt="">
            <span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.teamName)} · ${escapeHtml(product.category)}</small></span>
            <b>${catalogService.formatPrice(product.price)}</b>
        </a>`;
}
