// Área administrativa: confirmação de ações irreversíveis e prévia do produto.
// As páginas funcionam sem este script; ele apenas melhora a experiência.

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
    if (!form.dataset.confirm) return;
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
        const suggestion = nameInput.value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        slugInput.placeholder = suggestion || 'gerado a partir do nome';
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
