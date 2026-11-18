export const filterHeadingTemplate = () => `
    <button type="button" class="filter-heading filter-toggle" aria-expanded="false">
        Filtrar por <span class="filter-count" hidden></span>
    </button>`;

// No mobile, o painel de filtros fica recolhido atrás do botão "Filtrar por".
export function enhanceFilterPanel(filterBox) {
    const toggle = filterBox.querySelector('.filter-toggle');
    const count = filterBox.querySelector('.filter-count');
    if (!toggle || !count) return () => {};

    toggle.addEventListener('click', () => {
        const willOpen = !filterBox.classList.contains('is-open');
        filterBox.classList.toggle('is-open', willOpen);
        toggle.setAttribute('aria-expanded', String(willOpen));
    });

    return function updateFilterCount() {
        const selected = filterBox.querySelectorAll('input:checked').length;
        count.textContent = selected;
        count.hidden = selected === 0;
        count.setAttribute('aria-label', `${selected} ${selected === 1 ? 'filtro ativo' : 'filtros ativos'}`);
    };
}
