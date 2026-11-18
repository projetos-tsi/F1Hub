// Área administrativa: confirmação de ações irreversíveis e prévias de produto e plano.
// As páginas funcionam sem este script; ele apenas melhora a experiência.

// No celular o menu rola para o lado: mostra a seção atual mesmo quando ela fica no fim do menu.
const currentSection = document.querySelector('.admin-nav [aria-current="page"]');
if (currentSection) currentSection.parentElement.scrollLeft = Math.max(0, currentSection.offsetLeft - 16);

// Formulários com data-confirm pedem confirmação antes de enviar (ex.: excluir).
// Usa uma janela própria (<dialog>) no visual do site, e não o confirm() do navegador:
// alguns navegadores embutidos bloqueiam o confirm() e respondem "Cancelar" sozinhos.
const confirmDialog = document.createElement('dialog');
confirmDialog.className = 'admin-dialog';
confirmDialog.setAttribute('aria-labelledby', 'admin-dialog-title');
confirmDialog.setAttribute('aria-describedby', 'admin-dialog-message');
confirmDialog.innerHTML = `
    <form method="dialog">
        <p class="eyebrow">Confirmação</p>
        <h2 id="admin-dialog-title"></h2>
        <p id="admin-dialog-message"></p>
        <div class="admin-dialog-actions">
            <button type="submit" value="cancel" class="button-outline" autofocus>Cancelar</button>
            <button type="submit" value="confirm" class="button button-red" data-dialog-confirm></button>
        </div>
    </form>`;
document.body.append(confirmDialog);

let pending = null; // { form, submitter } aguardando a resposta

document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form.dataset.confirm) {
        // Clique duplo em "Salvar"/"Ativar" não envia o formulário duas vezes.
        if (form.method.toLowerCase() !== 'post') return;
        if (form.dataset.sending) event.preventDefault();
        form.dataset.sending = 'true';
        return;
    }
    event.preventDefault();
    pending = { form, submitter: event.submitter };
    confirmDialog.querySelector('#admin-dialog-title').textContent = form.dataset.confirmTitle || 'Tem certeza?';
    confirmDialog.querySelector('#admin-dialog-message').textContent = form.dataset.confirm;
    confirmDialog.querySelector('[data-dialog-confirm]').textContent = form.dataset.confirmButton || 'Confirmar';
    confirmDialog.returnValue = '';
    confirmDialog.showModal();
});

// Clique no fundo escuro fecha sem confirmar (Esc também).
confirmDialog.addEventListener('click', (event) => {
    if (event.target === confirmDialog) confirmDialog.close('cancel');
});

confirmDialog.addEventListener('close', () => {
    const request = pending;
    pending = null;
    if (!request || confirmDialog.returnValue !== 'confirm') return;
    // form.submit() envia sem passar de novo pela confirmação; o botão clicado (ex.: action=delete)
    // vai como campo oculto, e o botão fica desabilitado para evitar duplo envio.
    const { form, submitter } = request;
    form.querySelector('[data-confirmed-action]')?.remove();
    if (submitter?.name) {
        form.append(Object.assign(document.createElement('input'), { type: 'hidden', name: submitter.name, value: submitter.value }));
        form.lastElementChild.dataset.confirmedAction = '';
    }
    submitter?.setAttribute('disabled', '');
    form.submit();
});

// Ao voltar para a página pelo histórico, os botões desabilitados voltam a funcionar.
window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    document.querySelectorAll('form[data-sending]').forEach((form) => delete form.dataset.sending);
    document.querySelectorAll('[data-confirmed-action]').forEach((field) => field.remove());
    document.querySelectorAll('form[data-confirm] [disabled]:not([data-locked])').forEach((button) => button.removeAttribute('disabled'));
});

// "209,90", "1.299,90" ou "209.90" → centavos (null se inválido). Mesma regra do servidor (Input::moneyToCents).
function toCents(text) {
    let value = text.trim().replace(/^R\$\s*/, '');
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value)) value = value.replace(/\./g, '').replace(',', '.');
    else if (/^\d+,\d{1,2}$/.test(value)) value = value.replace(',', '.');
    else if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
    const [reais, fraction = ''] = value.split('.');
    return Number(reais) * 100 + Number(fraction.padEnd(2, '0'));
}

const formatPrice = (cents) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const productForm = document.querySelector('[data-product-form]');
if (productForm) {
    const field = (selector) => productForm.querySelector(selector);
    const card = field('[data-preview-card]');
    const previewImage = field('[data-preview-img]');
    const tag = field('[data-preview-tag]');
    const title = field('[data-preview-title]');
    const teamLabel = field('[data-preview-team-label]');
    const priceText = field('[data-preview-price-text]');
    const oldText = field('[data-preview-old-text]');
    const teamSelect = field('[data-preview-team]');
    const nameInput = field('[data-preview-name]');
    const slugInput = field('[data-slug]');

    const updatePreview = () => {
        const team = teamSelect.selectedOptions[0];
        const slug = team?.dataset.slug || '';
        card.dataset.team = slug;
        field('.admin-preview').dataset.team = slug;
        teamLabel.textContent = team?.dataset.label || 'Equipe';
        title.textContent = nameInput.value.trim() || 'Nome do produto';

        const image = productForm.querySelector('[data-preview-image]:checked');
        if (image) previewImage.src = image.nextElementSibling.src;

        const price = toCents(field('[data-preview-price]').value);
        const oldPrice = toCents(field('[data-preview-old-price]').value);
        priceText.textContent = price ? formatPrice(price) : 'R$ —';
        const onSale = price && oldPrice && oldPrice > price;
        oldText.textContent = onSale ? formatPrice(oldPrice) : '';
        tag.hidden = !onSale;
        if (onSale) tag.textContent = `-${Math.round((1 - price / oldPrice) * 100)}%`;
    };

    // Slug sugerido a partir do nome (o servidor gera o mesmo se o campo ficar vazio).
    const updateSlugHint = () => {
        slugInput.placeholder = suggestSlug(nameInput.value, slugInput.maxLength) || 'gerado a partir do nome';
    };

    // "Único" não se combina com P, M, G e GG.
    const sizes = [...productForm.querySelectorAll('[data-sizes] input')];
    sizes.forEach((input) => input.addEventListener('change', () => {
        if (!input.checked) return;
        sizes.filter((other) => other !== input && (input.value === 'Único' || other.value === 'Único'))
            .forEach((other) => { other.checked = false; });
    }));

    productForm.addEventListener('input', updatePreview);
    productForm.addEventListener('change', updatePreview);
    nameInput.addEventListener('input', updateSlugHint);
    updatePreview();
    updateSlugHint();

    // Mantém a imagem escolhida visível dentro da grade de imagens (sem rolar a página).
    const picker = field('.image-picker');
    const chosen = productForm.querySelector('[data-preview-image]:checked')?.closest('label');
    if (picker && chosen) picker.scrollTop = Math.max(0, chosen.offsetTop - 8);
}

// Slug sugerido a partir do nome, com o mesmo limite do campo (o servidor gera o mesmo se o campo ficar vazio).
function suggestSlug(text, maxLength = 0) {
    const slug = text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return maxLength > 0 ? slug.slice(0, maxLength).replace(/-+$/, '') : slug;
}

// Formulário de plano: prévia ao vivo do card exibido na página da assinatura.
const planForm = document.querySelector('[data-plan-form]');
if (planForm) {
    const field = (selector) => planForm.querySelector(selector);
    const nameInput = field('[data-preview-name]');
    const list = field('[data-preview-list]');
    const check = list.dataset.check;

    const updatePlanPreview = () => {
        const name = nameInput.value.trim();
        field('[data-preview-title]').textContent = name || 'Nome do plano';
        field('[data-preview-cta]').textContent = name || 'plano';
        field('[data-preview-tagline-text]').textContent = field('[data-preview-tagline]').value.trim() || 'Frase de apoio';
        const price = toCents(field('[data-preview-price]').value);
        field('[data-preview-price-text]').textContent = price ? formatPrice(price) : 'R$ —';

        const highlight = field('[data-preview-highlight]').checked;
        field('[data-preview-card]').classList.toggle('is-highlight', highlight);
        field('[data-preview-badge]').hidden = !highlight;

        // Benefícios: o texto entra com textContent (nunca como HTML).
        const items = field('[data-preview-items]').value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
        list.replaceChildren(...items.map((item) => {
            const li = document.createElement('li');
            li.innerHTML = check;
            li.append(item);
            return li;
        }));
        field('[data-slug]').placeholder = suggestSlug(name, field('[data-slug]').maxLength) || 'gerado a partir do nome';
    };

    planForm.addEventListener('input', updatePlanPreview);
    planForm.addEventListener('change', updatePlanPreview);
    updatePlanPreview();
}
