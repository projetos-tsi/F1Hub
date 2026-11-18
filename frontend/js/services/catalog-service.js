import { api } from './api-client.js';

// Catálogo da loja. A fonte da verdade é o banco: os produtos ATIVOS chegam pela API
// (backend/api/products.php) uma única vez por página, em catalogService.load().
// Depois de carregado, todos os métodos abaixo respondem na hora, sem novas requisições.

const normalize = (value) => String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const frontendRoot = new URL('../../', import.meta.url);

/** Desconto do PIX: 5%, arredondado ao centavo — a mesma conta do servidor (OrderService). */
export const PIX_DISCOUNT_PERCENT = 5;
export const pixDiscount = (cents) => Math.round((cents * PIX_DISCOUNT_PERCENT) / 100);

export const routes = {
    home: new URL('index.php', frontendRoot).href,
    product: (id) => `${new URL('src/pages/produto.html', frontendRoot).href}?id=${encodeURIComponent(id)}`,
    cart: new URL('src/pages/carrinho.html', frontendRoot).href,
    catalog: new URL('src/pages/catalogo.html', frontendRoot).href,
    checkout: new URL('src/pages/checkout.html', frontendRoot).href,
    subscription: new URL('src/pages/assinatura.html', frontendRoot).href,
    account: new URL('src/pages/conta.html', frontendRoot).href,
    login: new URL('src/pages/login.html', frontendRoot).href,
    register: new URL('src/pages/cadastro.html', frontendRoot).href,
    admin: new URL('pages/admin/index.php', frontendRoot).href,
    team: (team) => new URL(`src/pages/${team}.html`, frontendRoot).href
};

// Dados carregados da API.
let products = [];
let teamsBySlug = new Map();
let categoriesByName = new Map();
let loading = null;

function enrich(item) {
    const team = teamsBySlug.get(item.team) || { name: item.team, label: item.team, color: '#1f1f1f' };
    const category = categoriesByName.get(item.category) || { description: '', details: [] };
    const oldPrice = item.oldPrice > item.price ? item.oldPrice : null;
    return {
        ...item,
        // No front-end, produto sem piloto aparece como "Equipe" (filtros e vitrines).
        pilot: item.pilot || 'Equipe',
        oldPrice,
        discount: oldPrice ? Math.round((1 - item.price / oldPrice) * 100) : 0,
        isNew: /\b2026\b/.test(item.name),
        teamName: team.name,
        teamLabel: team.label,
        teamColor: team.color,
        description: category.description,
        details: category.details,
        imageUrl: new URL(`../../src/assets/images/${encodeURIComponent(item.image)}`, import.meta.url).href,
        url: routes.product(item.id)
    };
}

export const catalogService = {
    /**
     * Carrega o catálogo da API (uma vez por página). Resolve true quando os produtos chegaram
     * e false quando o servidor não respondeu — nesse caso as páginas mostram um aviso.
     */
    load() {
        if (!loading) {
            loading = api.get('products.php')
                .then((data) => {
                    teamsBySlug = new Map(data.teams.map((team) => [team.slug, team]));
                    categoriesByName = new Map(data.categories.map((category) => [category.name, category]));
                    products = data.products.map(enrich);
                    return true;
                })
                .catch(() => false);
        }
        return loading;
    },

    all() {
        return [...products];
    },

    teams() {
        return [...teamsBySlug.values()];
    },

    byId(id) {
        return products.find((item) => item.id === id) || null;
    },

    /** O item do carrinho ainda pode ser comprado (produto ativo e tamanho oferecido)? */
    isAvailable(id, size) {
        return Boolean(this.byId(id)?.sizes.includes(size));
    },

    byTeam(team) {
        return products.filter((item) => item.team === team);
    },

    /** Busca sem diferenciar acentos/maiúsculas; com várias palavras, o produto precisa ter todas (em qualquer ordem). */
    search(query) {
        const words = normalize(query).split(/\s+/).filter(Boolean);
        if (!words.length) return [];
        return products.filter((item) => {
            const text = normalize(`${item.name} ${item.category} ${item.pilot} ${item.teamName} ${item.teamLabel}`);
            return words.every((word) => text.includes(word));
        });
    },

    filter(team, filters = {}) {
        return this.byTeam(team).filter((item) => {
            const sizeMatch = !filters.sizes?.length || filters.sizes.some((size) => item.sizes.includes(size));
            const categoryMatch = !filters.categories?.length || filters.categories.includes(item.category);
            const pilotMatch = !filters.pilots?.length || filters.pilots.includes(item.pilot);
            return sizeMatch && categoryMatch && pilotMatch;
        });
    },

    facets(team) {
        const teamProducts = this.byTeam(team);
        return {
            sizes: [...new Set(teamProducts.flatMap((item) => item.sizes))],
            categories: [...new Set(teamProducts.map((item) => item.category))].sort(),
            pilots: [...new Set(teamProducts.map((item) => item.pilot))].sort()
        };
    },

    filterAll(filters = {}) {
        return this.all().filter((item) => {
            const teamMatch = !filters.teams?.length || filters.teams.includes(item.team);
            const sizeMatch = !filters.sizes?.length || filters.sizes.some((size) => item.sizes.includes(size));
            const categoryMatch = !filters.categories?.length || filters.categories.includes(item.category);
            const pilotMatch = !filters.pilots?.length || filters.pilots.includes(item.pilot);
            return teamMatch && sizeMatch && categoryMatch && pilotMatch;
        });
    },

    allFacets() {
        const allProducts = this.all();
        return {
            teams: [...new Set(allProducts.map((item) => item.team))],
            sizes: [...new Set(allProducts.flatMap((item) => item.sizes))],
            categories: [...new Set(allProducts.map((item) => item.category))].sort(),
            pilots: [...new Set(allProducts.map((item) => item.pilot))].sort()
        };
    },

    newArrivals() {
        return this.all().filter((item) => item.isNew);
    },

    onSale() {
        return this.all().filter((item) => item.oldPrice).sort((a, b) => b.discount - a.discount);
    },

    byCategory(category) {
        return this.all().filter((item) => item.category === category);
    },

    // Um resumo por piloto: equipe, quantidade de produtos e uma imagem representativa.
    pilots() {
        const summary = new Map();
        this.all().filter((item) => item.pilot !== 'Equipe').forEach((item) => {
            const entry = summary.get(item.pilot) || { name: item.pilot, team: item.team, teamName: item.teamName, imageUrl: item.imageUrl, count: 0 };
            entry.count += 1;
            summary.set(item.pilot, entry);
        });
        return [...summary.values()];
    },

    similar(productItem, limit = 5) {
        return this.all()
            .filter((item) => item.id !== productItem.id)
            .sort((a, b) => Number(b.team === productItem.team) - Number(a.team === productItem.team))
            .slice(0, limit);
    },

    formatPrice(price) {
        return (price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    /** Preço com o desconto do PIX, já formatado. */
    pixPrice(price) {
        return this.formatPrice(price - pixDiscount(price));
    }
};
