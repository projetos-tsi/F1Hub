import { catalogService } from '../services/catalog-service.js';
import { searchResultTemplate } from './product-card.js';

function searchPanelMarkup() {
    return `
        <form role="search" class="search-form">
            <label class="sr-only" for="site-search">Pesquisar no catálogo</label>
            <input id="site-search" type="search" placeholder="Busque por produto, equipe ou piloto" autocomplete="off">
            <button type="submit">Buscar</button>
            <button type="button" class="search-close" aria-label="Fechar pesquisa">×</button>
        </form>
        <div class="search-results" aria-live="polite" aria-label="Resultados da pesquisa" tabindex="0"></div>`;
}

export function initSearch() {
    const triggers = document.querySelectorAll('.search-trigger, .header-buttons button:first-child');
    if (!triggers.length) return { close() {} };

    let panel = document.querySelector('.search-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'search-panel';
        panel.hidden = true;
        document.querySelector('body > header')?.after(panel);
    }
    panel.innerHTML = searchPanelMarkup();

    const input = panel.querySelector('input');
    const results = panel.querySelector('.search-results');
    const form = panel.querySelector('form');
    const backgroundScrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
    let catalogLoaded = null; // null = carregando; true/false = resposta da API
    catalogService.load().then((loaded) => {
        catalogLoaded = loaded;
        if (!panel.hidden) render(input.value);
    });

    function setPageScrollLocked(locked) {
        document.documentElement.classList.toggle('search-active', locked);
    }

    function blockBackgroundScroll(event) {
        if (panel.hidden || results.contains(event.target)) return;
        event.preventDefault();
    }

    function blockBackgroundScrollKeys(event) {
        if (panel.hidden || results.contains(event.target) || !backgroundScrollKeys.has(event.key)) return;
        if (event.target === input && !['PageUp', 'PageDown'].includes(event.key)) return;
        event.preventDefault();
    }

    function positionPanelBelowHeader() {
        const header = document.querySelector('body > header, .site-header');
        const headerBottom = Math.max(0, Math.round(header?.getBoundingClientRect().bottom || 0));
        panel.style.setProperty('--search-panel-top', `${headerBottom}px`);
    }

    function close() {
        panel.hidden = true;
        results.innerHTML = '';
        setPageScrollLocked(false);
    }

    function open(query = '') {
        positionPanelBelowHeader();
        panel.hidden = false;
        setPageScrollLocked(true);
        input.value = query;
        render(query);
        input.focus();
    }

    function render(query) {
        // O catálogo vem da API: enquanto não chega (ou se o servidor não respondeu), avisa no painel.
        if (catalogLoaded !== true) {
            results.innerHTML = catalogLoaded === null
                ? '<p class="search-hint">Carregando produtos...</p>'
                : '<p class="search-empty"><strong>Não foi possível carregar os produtos.</strong><span>Verifique se o Apache e o MySQL do XAMPP estão ativos e recarregue a página.</span></p>';
            return [];
        }
        const matches = catalogService.search(query);
        if (!query.trim()) {
            results.innerHTML = '<p class="search-hint">Digite um produto, equipe ou piloto.</p>';
            return matches;
        }
        results.innerHTML = matches.length
            ? `<p class="search-summary">${matches.length} ${matches.length === 1 ? 'resultado' : 'resultados'}</p>${matches.slice(0, 8).map(searchResultTemplate).join('')}`
            : '<p class="search-empty"><strong>Nenhum produto encontrado.</strong><span>Tente outro nome, equipe, piloto ou categoria.</span></p>';
        return matches;
    }

    triggers.forEach((trigger) => {
        trigger.classList.add('search-trigger');
        trigger.addEventListener('click', () => open(input.value));
    });

    panel.querySelector('.search-close').addEventListener('click', close);
    input.addEventListener('input', () => render(input.value));
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const matches = render(input.value);
        if (matches.length === 1) window.location.href = matches[0].url;
    });

    window.addEventListener('resize', () => {
        if (!panel.hidden) positionPanelBelowHeader();
    });
    document.addEventListener('wheel', blockBackgroundScroll, { passive: false });
    document.addEventListener('touchmove', blockBackgroundScroll, { passive: false });
    document.addEventListener('keydown', blockBackgroundScrollKeys);

    return { close, open };
}
