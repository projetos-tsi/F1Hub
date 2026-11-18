import { catalogService } from '../services/catalog-service.js';
import { productCardTemplate } from '../ui/product-card.js';
import { enhanceFilterPanel, filterHeadingTemplate } from '../ui/filter-panel.js';

const labels = { teams: 'Equipe', sizes: 'Tamanho', categories: 'Produto', pilots: 'Piloto' };

function optionLabel(key, value) {
    if (key === 'teams') return catalogService.all().find((item) => item.team === value)?.teamName || value;
    if (key === 'pilots' && value === 'Equipe') return 'Sem piloto — produto da equipe';
    return value;
}

function groupTemplate(key, values) {
    return `<details class="filter-group"><summary>${labels[key]} <span aria-hidden="true"></span></summary><div class="filter-options">${values.map((value) => `<label><input type="checkbox" name="${key}" value="${value}"><span>${optionLabel(key, value)}</span></label>`).join('')}</div></details>`;
}

export function initGeneralCatalogPage() {
    const root = document.querySelector('[data-general-catalog]');
    if (!root) return;
    const filters = root.querySelector('.catalog-filter-box');
    const grid = root.querySelector('.general-product-grid');
    const status = root.querySelector('.catalog-status');
    const sort = root.querySelector('#catalog-sort');
    const facets = catalogService.allFacets();

    filters.innerHTML = `${filterHeadingTemplate()}${Object.entries(facets).map(([key, values]) => groupTemplate(key, values)).join('')}<button class="clear-filters" type="button" hidden>Limpar filtros</button>`;
    const updateFilterCount = enhanceFilterPanel(filters);

    const initialCategory = new URLSearchParams(window.location.search).get('category');
    if (initialCategory) {
        const input = [...filters.querySelectorAll('input[name="categories"]')].find((item) => item.value.toLowerCase() === initialCategory.toLowerCase());
        if (input) input.checked = true;
    }

    function selectedFilters() {
        const selected = { teams: [], sizes: [], categories: [], pilots: [] };
        filters.querySelectorAll('input:checked').forEach((input) => selected[input.name].push(input.value));
        return selected;
    }

    function render() {
        const selected = selectedFilters();
        const hasFilters = Object.values(selected).some((values) => values.length);
        let items = catalogService.filterAll(selected);
        if (sort.value === 'price-asc') items.sort((a, b) => a.price - b.price);
        if (sort.value === 'price-desc') items.sort((a, b) => b.price - a.price);
        if (sort.value === 'name') items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        status.textContent = `${items.length} ${items.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
        filters.querySelector('.clear-filters').hidden = !hasFilters;
        updateFilterCount();
        grid.innerHTML = items.length ? items.map((item) => productCardTemplate(item)).join('') : '<div class="empty-catalog"><strong>Nenhum produto encontrado.</strong><p>Remova algum filtro para ampliar os resultados.</p></div>';
    }

    filters.addEventListener('change', render);
    sort.addEventListener('change', render);
    filters.querySelector('.clear-filters').addEventListener('click', () => {
        filters.querySelectorAll('input:checked').forEach((input) => { input.checked = false; });
        history.replaceState({}, '', window.location.pathname);
        render();
    });
    render();
}
