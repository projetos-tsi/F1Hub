import { subscriptionPlans, surpriseTeam } from '../data/subscription-plans.js';
import { teamMeta } from '../data/products.js';
import { catalogService } from './catalog-service.js';

// Camada de acesso aos planos. Quando o backend existir, apenas este arquivo
// passa a buscar os dados da API (tabela `planos`), sem alterar a interface.
export const subscriptionService = {
    plans() {
        return subscriptionPlans.map((plan) => ({ ...plan, priceLabel: catalogService.formatPrice(plan.price) }));
    },

    byId(id) {
        return this.plans().find((plan) => plan.id === id) || null;
    },

    teams() {
        return [
            ...Object.entries(teamMeta).map(([id, team]) => ({ id, name: team.name, label: team.label, color: team.color })),
            surpriseTeam
        ];
    },

    shirtSizes() {
        return ['P', 'M', 'G', 'GG'];
    }
};
