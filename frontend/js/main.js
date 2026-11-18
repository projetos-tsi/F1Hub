import { initCatalogPage } from './pages/catalog-page.js';
import { initProductPage } from './pages/product-page.js';
import { initCartPage } from './pages/cart-page.js';
import { initGeneralCatalogPage } from './pages/general-catalog-page.js';
import { initCheckoutPage } from './pages/checkout-page.js';
import { cartService } from './services/cart-service.js';
import { catalogService, routes } from './services/catalog-service.js';
import { initHomePage } from './pages/home-page.js';
import { initSubscriptionPage } from './pages/subscription-page.js';
import { initAccountPage } from './pages/account-page.js';
import { authService } from './services/auth-service.js';
import { initSearch } from './ui/search-controller.js';

const dropdowns = Array.from(document.querySelectorAll('.dropdown'));
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.header-nav');

function closeDropdowns(except, releaseFocus = false) {
    dropdowns.forEach((dropdown) => {
        if (dropdown === except) return;
        dropdown.classList.remove('open');
        if (releaseFocus && dropdown.contains(document.activeElement)) document.activeElement?.blur?.();
    });
}

dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector('.dropbtn');
    const menu = dropdown.querySelector('.dropdown-teams, .dropdown-categories');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', (event) => {
        const isCompact = window.matchMedia('(max-width: 800px)').matches;
        const href = toggle.getAttribute('href');
        const hasNavigation = href && href.trim() !== '' && href.trim() !== '#';
        if (!isCompact && hasNavigation) { closeDropdowns(); return; }
        event.preventDefault();
        const willOpen = !dropdown.classList.contains('open');
        closeDropdowns(dropdown);
        dropdown.classList.toggle('open', willOpen);
    });

    dropdown.addEventListener('pointerenter', () => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        closeDropdowns(dropdown, true);
    });

    dropdown.addEventListener('focusin', () => {
        closeDropdowns(dropdown);
    });

    dropdown.addEventListener('pointerleave', () => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        dropdown.classList.remove('open');
        if (dropdown.contains(document.activeElement)) document.activeElement?.blur?.();
    });
});

if (menuToggle && navigation) {
    menuToggle.addEventListener('click', () => {
        const willOpen = !navigation.classList.contains('is-open');
        navigation.classList.toggle('is-open', willOpen);
        menuToggle.setAttribute('aria-expanded', String(willOpen));
    });
}

function updateCartBadge() {
    document.querySelectorAll('.header-buttons button:last-child').forEach((button) => {
        let badge = button.querySelector('.cart-count');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-count';
            button.append(badge);
        }
        const count = cartService.count();
        badge.textContent = count;
        badge.setAttribute('aria-label', `${count} ${count === 1 ? 'item' : 'itens'}`);
    });
}

document.querySelectorAll('.header-buttons button:last-child').forEach((button) => {
    button.setAttribute('aria-label', 'Abrir carrinho');
    button.addEventListener('click', () => { window.location.href = routes.cart; });
});

function upgradeSocialLinks() {
    const platforms = [
        { url: 'https://www.facebook.com/', label: 'Facebook' },
        { url: 'https://www.instagram.com/', label: 'Instagram' },
        { url: 'https://x.com/', label: 'X', icon: new URL('../src/assets/images/X.svg', import.meta.url).href }
    ];
    document.querySelectorAll('.media-footer, .footer-social > div').forEach((group) => {
        group.querySelectorAll('a').forEach((link, index) => {
            const platform = platforms[index];
            if (!platform) return;
            link.href = platform.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', platform.label);
            if (platform.icon) link.querySelector('img')?.setAttribute('src', platform.icon);
        });
    });
}

const search = initSearch();

document.querySelectorAll('.header-nav > a, .link-footer a').forEach((link) => {
    const label = link.textContent.trim().toLowerCase();
    if (label === 'categorias') link.href = routes.catalog;
    if (label === 'lançamentos') link.href = `${routes.home}#lancamentos`;
    if (label === 'promoções') link.href = `${routes.home}#promocoes`;
});

const categoryLabels = {
    'Camisa Polo': 'Camisas polo',
    'Camiseta': 'Camisetas',
    'Boné': 'Bonés',
    'Moletom': 'Moletons',
    'Jaqueta': 'Jaquetas',
    'Blusa': 'Blusas'
};

document.querySelectorAll('.dropdown-categories').forEach((menu) => {
    const categories = catalogService.allFacets().categories;
    menu.innerHTML = categories
        .map((category) => `<a href="${routes.catalog}?category=${encodeURIComponent(category)}">${categoryLabels[category] || category}</a>`)
        .join('') + `<a class="dropdown-all" href="${routes.catalog}">Ver todos os produtos</a>`;
});

// Botão de conta do cabeçalho: "Minha conta" para quem está logado; login (voltando a esta página) para os demais.
function initAccountButton() {
    const button = document.querySelector('.header-buttons button:nth-child(2)');
    if (!button) return;
    button.removeAttribute('onclick');
    let user = null;

    button.addEventListener('click', () => {
        const here = window.location.pathname + window.location.search;
        window.location.href = user ? routes.account : `${routes.login}?redirect=${encodeURIComponent(here)}`;
    });

    authService.me().then((loggedUser) => {
        user = loggedUser;
        button.classList.toggle('is-logged', Boolean(user));
        button.setAttribute('aria-label', user ? `Minha conta — ${user.firstName}` : 'Entrar na minha conta');
        button.title = user ? `Olá, ${user.firstName}` : 'Entrar';
    });
}

initAccountButton();
initHomePage();
initSubscriptionPage();
initAccountPage();
initCatalogPage();
initProductPage();
initCartPage();
initGeneralCatalogPage();
initCheckoutPage();
upgradeSocialLinks();
updateCartBadge();

window.addEventListener('f1hub:cart-updated', updateCartBadge);
document.addEventListener('click', (event) => {
    const openDropdown = document.querySelector('.dropdown.open');
    if (openDropdown && !openDropdown.contains(event.target)) closeDropdowns();
});
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeDropdowns();
    search.close();
    navigation?.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
});
