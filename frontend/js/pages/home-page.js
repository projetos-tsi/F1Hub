import { catalogService } from '../services/catalog-service.js';
import { homeProductCardTemplate } from '../ui/product-card.js';

// Vitrines da home: a ordem e os selos ficam no HTML, mas nome, preço, imagem e link vêm do catálogo central.
export function initHomePage() {
    document.querySelectorAll('[data-home-products]').forEach((row) => {
        const tags = Object.fromEntries((row.dataset.homeTags || '')
            .split(',')
            .map((entry) => entry.split(':').map((part) => part.trim()))
            .filter(([id, label]) => id && label));

        row.innerHTML = row.dataset.homeProducts
            .split(',')
            .map((id) => catalogService.byId(id.trim()))
            .filter(Boolean)
            .map((product) => homeProductCardTemplate(product, tags[product.id]))
            .join('');
    });
}
