import { subscriptionPlans, surpriseTeam } from '../data/subscription-plans.js';
import { catalogService } from './catalog-service.js';

// Camada de acesso aos planos. Na fase B5 os planos passam a vir da API (tabela `plans`).
// As equipes já vêm do banco, junto com o catálogo (catalogService.load()).
export const subscriptionService = {
    plans() {
        return subscriptionPlans.map((plan) => ({ ...plan, priceLabel: catalogService.formatPrice(plan.price) }));
    },

    byId(id) {
        return this.plans().find((plan) => plan.id === id) || null;
    },

    teams() {
        return [
            ...catalogService.teams().map((team) => ({ id: team.slug, name: team.name, label: team.label, color: team.color })),
            surpriseTeam
        ];
    },

    shirtSizes() {
        return ['P', 'M', 'G', 'GG'];
    }
};
