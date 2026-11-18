import { catalogService, routes } from '../services/catalog-service.js';
import { catalogErrorTemplate, escapeHtml, homeProductCardTemplate, showcaseEmptyTemplate } from '../ui/product-card.js';
import { initProductCarousel } from '../ui/product-carousel.js';

const HERO_INTERVAL = 6000;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Banner principal em carrossel ----------
function initHeroCarousel(root) {
    const track = root.querySelector('.hero-track');
    const slides = [...track.children];
    const dots = root.querySelector('.hero-dots');
    const eyebrow = document.querySelector('[data-hero-eyebrow]');
    const cta = document.querySelector('[data-hero-cta]');
    let index = 0;
    let paused = false;

    dots.innerHTML = slides.map((slide, position) => `
        <button type="button" aria-label="Mostrar ${escapeHtml(slide.dataset.eyebrow)}" data-slide="${position}"></button>`).join('');

    function sync(position) {
        index = position;
        slides.forEach((slide, slidePosition) => {
            const active = slidePosition === position;
            slide.setAttribute('aria-hidden', String(!active));
            slide.tabIndex = active ? 0 : -1;
        });
        dots.querySelectorAll('button').forEach((dot, dotPosition) => dot.setAttribute('aria-current', String(dotPosition === position)));
        const slide = slides[position];
        if (eyebrow) eyebrow.textContent = slide.dataset.eyebrow;
        if (cta) {
            cta.href = slide.href;
            cta.firstChild.textContent = `${slide.dataset.cta} `;
        }
    }

    function goTo(position) {
        const target = (position + slides.length) % slides.length;
        track.scrollTo({ left: track.clientWidth * target, behavior: reducedMotion() ? 'auto' : 'smooth' });
    }

    track.addEventListener('scroll', () => {
        const position = Math.round(track.scrollLeft / track.clientWidth);
        if (position !== index && slides[position]) sync(position);
    }, { passive: true });

    root.querySelector('.hero-arrow.prev').addEventListener('click', () => goTo(index - 1));
    root.querySelector('.hero-arrow.next').addEventListener('click', () => goTo(index + 1));
    dots.addEventListener('click', (event) => {
        const dot = event.target.closest('[data-slide]');
        if (dot) goTo(Number(dot.dataset.slide));
    });

    // Troca automática: pausa com o mouse em cima, com foco dentro do banner ou com a aba oculta.
    root.addEventListener('pointerenter', () => { paused = true; });
    root.addEventListener('pointerleave', () => { paused = false; });
    root.addEventListener('focusin', () => { paused = true; });
    root.addEventListener('focusout', () => { paused = false; });
    window.setInterval(() => {
        if (!paused && !document.hidden && !reducedMotion()) goTo(index + 1);
    }, HERO_INTERVAL);

    window.addEventListener('resize', () => { track.scrollLeft = track.clientWidth * index; });
    sync(0);
}

// ---------- Vitrines de produtos ----------
// Intercala as equipes (Ferrari, Mercedes, Red Bull...) para a vitrine não começar com uma equipe só.
function interleaveByTeam(items) {
    const groups = Object.values(items.reduce((byTeam, item) => {
        (byTeam[item.team] ||= []).push(item);
        return byTeam;
    }, {}));
    const longest = Math.max(0, ...groups.map((group) => group.length));
    return Array.from({ length: longest }, (_, position) => groups.map((group) => group[position])).flat().filter(Boolean);
}

function productsFor(container) {
    const query = container.dataset.homeQuery;
    if (query === 'new') return interleaveByTeam(catalogService.newArrivals());
    if (query === 'sale') return catalogService.onSale();
    return (container.dataset.homeProducts || '')
        .split(',')
        .map((id) => catalogService.byId(id.trim()))
        .filter(Boolean);
}

function tagsFor(container) {
    return Object.fromEntries((container.dataset.homeTags || '')
        .split(',')
        .map((entry) => entry.split(':').map((part) => part.trim()))
        .filter(([id, label]) => id && label));
}

function renderCards(container, items, tags = {}) {
    container.innerHTML = items.length
        ? items.map((item) => homeProductCardTemplate(item, tags[item.id])).join('')
        : showcaseEmptyTemplate();
}

function initProductSections() {
    document.querySelectorAll('[data-home-query], [data-home-products]').forEach((container) => {
        renderCards(container, productsFor(container), tagsFor(container));
        const controls = container.closest('section')?.querySelector('[data-carousel-controls]');
        initProductCarousel(container, controls);
    });
}

// ---------- Abas por modelagem ----------
const CATEGORY_TABS = [
    ['Camiseta', 'Camisetas'],
    ['Camisa Polo', 'Polos'],
    ['Moletom', 'Moletons'],
    ['Jaqueta', 'Jaquetas'],
    ['Boné', 'Bonés'],
    ['Blusa', 'Blusas']
];

function initCategoryTabs(section) {
    const tabs = section.querySelector('[data-home-tabs]');
    const track = section.querySelector('.product-carousel');
    const link = section.querySelector('[data-tab-link]');
    const refresh = initProductCarousel(track, section.querySelector('[data-carousel-controls]'));
    const available = CATEGORY_TABS.filter(([category]) => catalogService.byCategory(category).length);
    if (!available.length) {
        track.innerHTML = showcaseEmptyTemplate();
        return;
    }

    tabs.innerHTML = available.map(([category, label], position) => `
        <button type="button" role="tab" id="tab-${position}" aria-controls="${track.id}" aria-selected="${position === 0}" data-category="${escapeHtml(category)}">${label}</button>`).join('');

    function select(button) {
        tabs.querySelectorAll('[role="tab"]').forEach((tab) => {
            const selected = tab === button;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
        });
        const category = button.dataset.category;
        track.setAttribute('aria-labelledby', button.id);
        renderCards(track, catalogService.byCategory(category));
        if (link) link.href = `${routes.catalog}?category=${encodeURIComponent(category)}`;
        refresh();
    }

    tabs.addEventListener('click', (event) => {
        const tab = event.target.closest('[role="tab"]');
        if (tab) select(tab);
    });
    tabs.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        const all = [...tabs.querySelectorAll('[role="tab"]')];
        const current = all.indexOf(document.activeElement);
        const next = all[(current + (event.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
        next.focus();
        select(next);
    });
    select(tabs.querySelector('[role="tab"]'));
}

// ---------- Escolha seu piloto ----------
function initPilots(container) {
    const pilots = catalogService.pilots();
    if (!pilots.length) {
        container.innerHTML = showcaseEmptyTemplate();
        return;
    }
    container.innerHTML = pilots.map((pilot) => `
        <a class="pilot-card" href="${routes.catalog}?pilot=${encodeURIComponent(pilot.name)}">
            <span class="pilot-avatar" data-team="${escapeHtml(pilot.team)}"><img src="${pilot.imageUrl}" alt="" loading="lazy"></span>
            <strong>${escapeHtml(pilot.name)}</strong>
            <small>${escapeHtml(pilot.teamName)} · ${pilot.count} ${pilot.count === 1 ? 'produto' : 'produtos'}</small>
        </a>`).join('');
    initProductCarousel(container, container.closest('section')?.querySelector('[data-carousel-controls]'));
}

export async function initHomePage(catalogReady) {
    const hero = document.querySelector('[data-hero-carousel]');
    if (hero) initHeroCarousel(hero);

    const showcases = document.querySelectorAll('[data-home-query], [data-home-products], [data-home-pilots], [data-category-tabs] .product-carousel');
    if (!showcases.length) return;
    if (!(await catalogReady)) {
        // Sem catálogo: um aviso no lugar de cada vitrine (as setas dos carrosséis ficam ocultas).
        showcases.forEach((container) => { container.innerHTML = catalogErrorTemplate(); });
        document.querySelectorAll('[data-carousel-controls]').forEach((controls) => { controls.hidden = true; });
        return;
    }

    initProductSections();
    document.querySelectorAll('[data-category-tabs]').forEach(initCategoryTabs);
    document.querySelectorAll('[data-home-pilots]').forEach(initPilots);
}
