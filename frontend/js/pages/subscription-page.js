import { subscriptionService } from '../services/subscription-service.js';
import { escapeHtml } from '../ui/product-card.js';

const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function planCardTemplate(plan) {
    return `
        <article class="plan-card${plan.highlight ? ' is-highlight' : ''}">
            ${plan.highlight ? '<span class="plan-badge">Mais escolhido</span>' : ''}
            <p class="plan-tagline">${escapeHtml(plan.tagline)}</p>
            <h3>${escapeHtml(plan.name)}</h3>
            <p class="plan-price"><strong>${plan.priceLabel}</strong><span>/mês</span></p>
            <ul>${plan.items.map((item) => `<li>${check}${escapeHtml(item)}</li>`).join('')}</ul>
            <button type="button" class="plan-cta" data-choose-plan="${escapeHtml(plan.id)}">Quero o ${escapeHtml(plan.name)}</button>
        </article>`;
}

function optionTemplate(name, value, content, extraClass = '', attributes = '') {
    return `
        <label class="builder-option ${extraClass}" ${attributes}>
            <input type="radio" name="${name}" value="${escapeHtml(value)}">
            <span>${content}</span>
        </label>`;
}

export function initSubscriptionPage() {
    const root = document.querySelector('[data-subscription-page]');
    if (!root) return;

    const plans = subscriptionService.plans();
    const teams = subscriptionService.teams();
    const form = root.querySelector('[data-box-builder]');
    const summary = root.querySelector('[data-box-summary]');
    const sizeGroup = root.querySelector('[data-builder-size-group]');

    root.querySelector('[data-plan-grid]').innerHTML = plans.map(planCardTemplate).join('');

    root.querySelector('[data-builder-plans]').innerHTML = plans.map((plan) => optionTemplate(
        'plan', plan.id, `<strong>${escapeHtml(plan.name)}</strong><small>${plan.priceLabel}/mês</small>`
    )).join('');

    root.querySelector('[data-builder-teams]').innerHTML = teams.map((team) => optionTemplate(
        'team', team.id, `<i class="team-dot" aria-hidden="true"></i><strong>${escapeHtml(team.name)}</strong>`,
        'builder-team', `data-team="${escapeHtml(team.id)}" style="--dot: ${team.color || 'transparent'}"`
    )).join('');

    root.querySelector('[data-builder-sizes]').innerHTML = subscriptionService.shirtSizes()
        .map((size) => optionTemplate('size', size, `<strong>${size}</strong>`, 'builder-size'))
        .join('');

    function selection() {
        const data = new FormData(form);
        return { plan: subscriptionService.byId(data.get('plan')), team: teams.find((team) => team.id === data.get('team')), size: data.get('size') };
    }

    function renderSummary() {
        const { plan, team, size } = selection();
        const needsSize = Boolean(plan?.includesShirt);
        sizeGroup.hidden = !needsSize;

        const missing = [];
        if (!team) missing.push('a equipe');
        if (needsSize && !size) missing.push('o tamanho da camiseta');

        summary.innerHTML = `
            <p class="eyebrow">Resumo da sua box</p>
            <h3>${plan ? `Plano ${escapeHtml(plan.name)}` : 'Escolha um plano'}</h3>
            ${plan ? `<p class="summary-price"><strong>${plan.priceLabel}</strong><span>/mês</span></p>` : ''}
            <dl>
                <div><dt>Equipe</dt><dd>${team ? escapeHtml(team.id === 'surpresa' ? `${team.name} · ${team.label}` : team.name) : '—'}</dd></div>
                ${needsSize ? `<div><dt>Camiseta</dt><dd>${size ? escapeHtml(size) : '—'}</dd></div>` : ''}
            </dl>
            ${plan ? `<ul>${plan.items.map((item) => `<li>${check}${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
            <p class="summary-status">${missing.length ? `Falta escolher ${missing.join(' e ')}.` : 'Sua box está pronta!'}</p>
            <button type="button" class="summary-cta" disabled>Assinatura disponível em breve</button>
            <p class="summary-note">Prévia da assinatura: a contratação será liberada junto com o login e o pagamento seguro. Nenhum dado é enviado.</p>`;
    }

    function choosePlan(id, scroll = false) {
        const input = form.querySelector(`input[name="plan"][value="${id}"]`);
        if (!input) return;
        input.checked = true;
        renderSummary();
        if (scroll) root.querySelector('#monte-sua-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    root.addEventListener('click', (event) => {
        const button = event.target.closest('[data-choose-plan]');
        if (button) choosePlan(button.dataset.choosePlan, true);
    });
    form.addEventListener('change', renderSummary);

    const initialPlan = new URLSearchParams(window.location.search).get('plano');
    choosePlan(plans.some((plan) => plan.id === initialPlan) ? initialPlan : plans.find((plan) => plan.highlight)?.id || plans[0].id);
}
