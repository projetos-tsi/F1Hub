import { api } from './api-client.js';
import { catalogService } from './catalog-service.js';

// Assinatura F1Hub Box. Planos e assinatura vêm do banco pela API (backend/api/subscriptions.php);
// as equipes vêm junto com o catálogo (catalogService.load()).

/** Opção para quem não quer escolher uma única equipe (gravada como "sem equipe" no banco). */
export const surpriseTeam = { id: 'surpresa', name: 'Surpresa', label: 'Todas as equipes' };

let plansRequest = null;

export const subscriptionService = {
    /** Planos ativos (uma requisição por página). Resolve null se o servidor não respondeu. */
    loadPlans() {
        plansRequest ??= api.get('subscriptions.php?action=plans')
            .then((data) => data.plans.map((plan) => ({ ...plan, priceLabel: catalogService.formatPrice(plan.price) })))
            .catch(() => null);
        return plansRequest;
    },

    teams() {
        return [
            ...catalogService.teams().map((team) => ({ id: team.slug, name: team.name, label: team.label, color: team.color })),
            surpriseTeam
        ];
    },

    shirtSizes() {
        return ['P', 'M', 'G', 'GG'];
    },

    /** { subscription, lastCancelled } do cliente logado. */
    mine() {
        return api.get('subscriptions.php?action=mine');
    },

    subscribe(choice) {
        return api.post('subscriptions.php?action=subscribe', choice);
    },

    cancel() {
        return api.post('subscriptions.php?action=cancel');
    }
};
