import { categoryMeta, products, promotions, teamMeta } from '../data/products.js';

const normalize = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const frontendRoot = new URL('../../', import.meta.url);

export const routes = {
    home: new URL('index.php', frontendRoot).href,
    product: (id) => `${new URL('src/pages/produto.html', frontendRoot).href}?id=${encodeURIComponent(id)}`,
    cart: new URL('src/pages/carrinho.html', frontendRoot).href,
    catalog: new URL('src/pages/catalogo.html', frontendRoot).href,
    checkout: new URL('src/pages/checkout.html', frontendRoot).href,
    team: (team) => new URL(`src/pages/${team}.html`, frontendRoot).href
};

export const catalogService = {
    all() {
        return products.map((item) => this.enrich(item));
    },

    enrich(item) {
        const oldPrice = promotions[item.id] > item.price ? promotions[item.id] : null;
        return {
            ...item,
            oldPrice,
            discount: oldPrice ? Math.round((1 - item.price / oldPrice) * 100) : 0,
            isNew: /\b2026\b/.test(item.name),
            teamName: teamMeta[item.team].name,
            teamLabel: teamMeta[item.team].label,
            teamColor: teamMeta[item.team].color,
            description: categoryMeta[item.category].description,
            details: categoryMeta[item.category].details,
            imageUrl: new URL(`../../src/assets/images/${item.image}`, import.meta.url).href,
            url: routes.product(item.id)
        };
    },

    byId(id) {
        const item = products.find((productItem) => productItem.id === id);
        return item ? this.enrich(item) : null;
    },

    byTeam(team) {
        return products.filter((item) => item.team === team).map((item) => this.enrich(item));
    },

    search(query) {
        const term = normalize(query);
        if (!term) return [];
        return products
            .filter((item) => normalize(`${item.name} ${item.category} ${item.pilot} ${teamMeta[item.team].name}`).includes(term))
            .map((item) => this.enrich(item));
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

    pixPrice(price) {
        return this.formatPrice(Math.round(price * .95));
    }
};
