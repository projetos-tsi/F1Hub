import { catalogService } from '../services/catalog-service.js';
import { productCardTemplate } from '../ui/product-card.js';
import { enhanceFilterPanel, filterHeadingTemplate } from '../ui/filter-panel.js';

const LOAD_MORE_ENABLED = false;

function teamFromPage() {
    const title = document.querySelector('.main-title');
    return ['ferrari', 'mercedes', 'rbr', 'mclaren', 'williams'].find((team) => title?.classList.contains(team));
}

const facetLabels = {
    sizes: 'Tamanho',
    categories: 'Produto',
    pilots: 'Piloto'
};

function facetOptionLabel(key, value) {
    if (key === 'pilots' && value === 'Equipe') return 'Sem piloto — produto da equipe';
    return value;
}

function filterGroupTemplate(key, values) {
    return `
        <details class="filter-group">
            <summary>${facetLabels[key]} <span aria-hidden="true"></span></summary>
            <div class="filter-options">
                ${values.map((value) => `
                    <label>
                        <input type="checkbox" name="${key}" value="${value}">
                        <span>${facetOptionLabel(key, value)}</span>
                    </label>`).join('')}
            </div>
        </details>`;
}

export function initCatalogPage() {
    const team = teamFromPage();
    const filterBox = document.querySelector('.filter-box');
    const grid = document.querySelector('.main-container > section');
    if (!team || !filterBox || !grid) return;

    const facets = catalogService.facets(team);
    filterBox.innerHTML = `
        ${filterHeadingTemplate()}
        ${Object.entries(facets).map(([key, values]) => filterGroupTemplate(key, values)).join('')}
        <button class="clear-filters" type="button" hidden>Limpar filtros</button>`;
    const updateFilterCount = enhanceFilterPanel(filterBox);

    grid.classList.add('catalog-grid');
    const resultStatus = document.createElement('p');
    resultStatus.className = 'catalog-status';
    resultStatus.setAttribute('aria-live', 'polite');
    grid.before(resultStatus);

    const moreContainer = document.querySelector('.more-btn-contain');
    if (moreContainer) {
        moreContainer.hidden = !LOAD_MORE_ENABLED;
        moreContainer.style.display = LOAD_MORE_ENABLED ? 'flex' : 'none';
        moreContainer.dataset.feature = 'load-more';
    }

    function activeFilters() {
        const selected = { sizes: [], categories: [], pilots: [] };
        filterBox.querySelectorAll('input:checked').forEach((input) => selected[input.name].push(input.value));
        return selected;
    }

    function render() {
        const filters = activeFilters();
        const filtered = catalogService.filter(team, filters);
        const hasFilters = Object.values(filters).some((values) => values.length);

        resultStatus.textContent = `${filtered.length} ${filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
        filterBox.querySelector('.clear-filters').hidden = !hasFilters;
        updateFilterCount();
        grid.innerHTML = filtered.length
            ? filtered.map((item) => productCardTemplate(item)).join('')
            : '<div class="empty-catalog"><strong>Nenhum produto encontrado.</strong><p>Remova algum filtro para ampliar os resultados.</p></div>';
    }

    filterBox.addEventListener('change', render);
    filterBox.querySelector('.clear-filters').addEventListener('click', () => {
        filterBox.querySelectorAll('input:checked').forEach((input) => { input.checked = false; });
        render();
    });

    render();
}
