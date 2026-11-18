import { authService } from '../services/auth-service.js';
import { routes } from '../services/catalog-service.js';
import { subscriptionService } from '../services/subscription-service.js';
import { escapeHtml } from '../ui/product-card.js';

// Página da assinatura F1Hub Box (fase B5): planos do banco; assinar, alterar a box e ver a assinatura atual.
// Pagamento simulado: nada é cobrado. Cancelar fica em "Minha conta".

const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function planCardTemplate(plan, currentPlanId) {
    const isCurrent = plan.id === currentPlanId;
    return `
        <article class="plan-card${plan.highlight ? ' is-highlight' : ''}${isCurrent ? ' is-current' : ''}">
            ${plan.highlight ? '<span class="plan-badge">Mais escolhido</span>' : ''}
            <p class="plan-tagline">${escapeHtml(plan.tagline)}</p>
            <h3>${escapeHtml(plan.name)}</h3>
            <p class="plan-price"><strong>${plan.priceLabel}</strong><span>/mês</span></p>
            <ul>${plan.items.map((item) => `<li>${check}${escapeHtml(item)}</li>`).join('')}</ul>
            <button type="button" class="plan-cta" data-choose-plan="${escapeHtml(plan.id)}">${isCurrent ? 'Seu plano atual' : `Quero o ${escapeHtml(plan.name)}`}</button>
        </article>`;
}

function optionTemplate(name, value, content, extraClass = '', attributes = '') {
    return `
        <label class="builder-option ${extraClass}" ${attributes}>
            <input type="radio" name="${name}" value="${escapeHtml(value)}">
            <span>${content}</span>
        </label>`;
}

function currentBannerTemplate(subscription) {
    const parts = [subscription.team.name, subscription.shirtSize ? `camiseta ${subscription.shirtSize}` : ''].filter(Boolean);
    return `
        <div class="box-current" role="status">
            <span class="box-current-icon" aria-hidden="true">✓</span>
            <p><strong>Você assina o plano ${escapeHtml(subscription.plan.name)}</strong> · ${escapeHtml(parts.join(' · '))}.
            ${subscription.plan.available ? 'Altere as escolhas abaixo quando quiser.' : 'Este plano não é mais oferecido: você continua com ele até escolher outro.'}
            <a href="${routes.account}#assinatura">Gerenciar em Minha conta</a></p>
        </div>`;
}

export async function initSubscriptionPage(catalogReady) {
    const root = document.querySelector('[data-subscription-page]');
    if (!root) return;

    const form = root.querySelector('[data-box-builder]');
    const summary = root.querySelector('[data-box-summary]');
    const sizeGroup = root.querySelector('[data-builder-size-group]');
    const planGrid = root.querySelector('[data-plan-grid]');

    // Equipes vêm com o catálogo; planos e usuário, das APIs. Tudo em paralelo.
    const [, plans, user] = await Promise.all([catalogReady, subscriptionService.loadPlans(), authService.me()]);
    if (!plans || !plans.length) {
        const message = `<div class="catalog-notice" role="alert"><strong>${plans ? 'Nenhum plano disponível no momento.' : 'Não foi possível carregar os planos.'}</strong><p>${plans ? 'Volte em breve: novos planos estão a caminho.' : 'Verifique se o Apache e o MySQL do XAMPP estão ativos e recarregue a página.'}</p></div>`;
        planGrid.innerHTML = message;
        root.querySelector('.box-builder').innerHTML = message;
        return;
    }

    let current = null;
    if (user) {
        try {
            current = (await subscriptionService.mine()).subscription;
        } catch (_error) {
            current = null;
        }
    }

    const teams = subscriptionService.teams();
    const byId = (id) => plans.find((plan) => plan.id === id) || null;

    function renderPlans() {
        planGrid.innerHTML = plans.map((plan) => planCardTemplate(plan, current?.plan.id)).join('');
        root.querySelector('.box-current')?.remove();
        if (current) root.querySelector('#monte-sua-box .box-heading').insertAdjacentHTML('afterend', currentBannerTemplate(current));
    }

    root.querySelector('[data-builder-plans]').innerHTML = plans.map((plan) => optionTemplate(
        'plan', plan.id, `<strong>${escapeHtml(plan.name)}</strong><small>${plan.priceLabel}/mês</small>`
    )).join('');
    root.querySelector('[data-builder-teams]').innerHTML = teams.map((team) => optionTemplate(
        'team', team.id, `<i class="team-dot" aria-hidden="true"></i><strong>${escapeHtml(team.name)}</strong>`,
        'builder-team', `data-team="${escapeHtml(team.id)}" style="--dot: ${escapeHtml(team.color || 'transparent')}"`
    )).join('');
    root.querySelector('[data-builder-sizes]').innerHTML = subscriptionService.shirtSizes()
        .map((size) => optionTemplate('size', size, `<strong>${size}</strong>`, 'builder-size'))
        .join('');

    let message = null; // { type: 'success' | 'error', html }
    let sending = false;

    function selection() {
        const data = new FormData(form);
        return { plan: byId(data.get('plan')), team: teams.find((team) => team.id === data.get('team')), size: data.get('size') };
    }

    function sameAsCurrent({ plan, team, size }) {
        if (!current || !plan || !team) return false;
        return current.plan.id === plan.id && current.team.id === team.id && (plan.includesShirt ? current.shirtSize === size : true);
    }

    function ctaTemplate(sel, missing) {
        const { plan } = sel;
        if (!user) {
            const back = encodeURIComponent(`${new URL(routes.subscription).pathname}?plano=${plan?.id || ''}#monte-sua-box`);
            return `<a class="summary-cta is-ready" href="${routes.login}?redirect=${back}">Entrar para assinar</a>
                    <p class="summary-note">Você precisa de uma conta para assinar. <a href="${routes.register}?redirect=${back}">Criar conta</a></p>`;
        }
        const unchanged = sameAsCurrent(sel);
        const label = sending ? 'Salvando...' : current ? (unchanged ? 'Sua box já está assim' : 'Salvar alterações') : `Assinar o ${escapeHtml(plan?.name || 'plano')}`;
        const disabled = sending || missing.length || unchanged;
        return `<button type="button" class="summary-cta${disabled ? '' : ' is-ready'}" data-subscribe${disabled ? ' disabled' : ''}>${label}</button>
                <p class="summary-note">Pagamento simulado: este é um projeto acadêmico e nenhum valor é cobrado. ${current ? 'Para cancelar, use "Minha conta".' : 'Você pode alterar ou cancelar quando quiser em "Minha conta".'}</p>`;
    }

    function renderSummary() {
        const sel = selection();
        const { plan, team, size } = sel;
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
            ${message ? `<p class="summary-message is-${message.type}" role="${message.type === 'error' ? 'alert' : 'status'}">${message.html}</p>`
                : `<p class="summary-status">${missing.length ? `Falta escolher ${missing.join(' e ')}.` : 'Sua box está pronta!'}</p>`}
            ${ctaTemplate(sel, missing)}`;
    }

    function choosePlan(id, scroll = false) {
        const input = form.querySelector(`input[name="plan"][value="${CSS.escape(id)}"]`);
        if (!input) return;
        input.checked = true;
        message = null;
        renderSummary();
        if (scroll) root.querySelector('#monte-sua-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function preselect(name, value) {
        const input = value ? form.querySelector(`input[name="${name}"][value="${CSS.escape(value)}"]`) : null;
        if (input) input.checked = true;
    }

    async function submit() {
        const { plan, team, size } = selection();
        if (!plan || !team || sending) return;
        sending = true;
        message = null;
        renderSummary();
        try {
            const result = await subscriptionService.subscribe({ plan: plan.id, team: team.id, shirtSize: plan.includesShirt ? size : '' });
            const wasNew = !current;
            current = result.subscription;
            message = {
                type: 'success',
                html: `${wasNew ? `Assinatura confirmada! Sua primeira box do plano ${escapeHtml(current.plan.name)} está a caminho.` : 'Assinatura atualizada!'} <a href="${routes.account}#assinatura">Ver em Minha conta</a>`
            };
            renderPlans();
        } catch (error) {
            const fieldText = Object.values(error.fields || {}).map(escapeHtml).join(' ');
            message = { type: 'error', html: `${escapeHtml(error.message)}${fieldText ? ` ${fieldText}` : ''}` };
        } finally {
            sending = false;
            renderSummary();
        }
    }

    root.addEventListener('click', (event) => {
        const button = event.target.closest('[data-choose-plan]');
        if (button) choosePlan(button.dataset.choosePlan, true);
        if (event.target.closest('[data-subscribe]')) submit();
    });
    form.addEventListener('change', () => {
        message = null;
        renderSummary();
    });

    renderPlans();
    // Escolhas iniciais: a assinatura atual; senão o plano do endereço (?plano=) ou o destaque.
    const requested = new URLSearchParams(window.location.search).get('plano');
    if (current) {
        preselect('team', current.team.id);
        preselect('size', current.shirtSize);
    }
    const initialPlan = byId(requested)?.id || (current && byId(current.plan.id)?.id) || plans.find((plan) => plan.highlight)?.id || plans[0].id;
    choosePlan(initialPlan);
    if (window.location.hash === '#monte-sua-box') root.querySelector('#monte-sua-box').scrollIntoView();
}
