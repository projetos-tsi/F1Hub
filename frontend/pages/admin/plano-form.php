<?php
/**
 * Admin — criar (sem ?id) ou editar (?id=N) um plano da F1Hub Box.
 * Em caso de erro, o formulário volta preenchido com as mensagens em cada campo.
 */
require __DIR__ . '/includes/admin.php';

$id = Input::id($_GET, 'id');
$errors = [];

try {
    $plan = $id ? Plan::find($id) : null;
    if ($id && !$plan) {
        Flash::set('error', 'Plano não encontrado. Ele pode ter sido excluído.');
        View::redirect('planos.php');
    }
    $form = $plan ? PlanService::toForm($plan) : PlanService::blank();

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        admin_require_valid_post($id ? "plano-form.php?id={$id}" : 'plano-form.php');
        $form = PlanService::formFrom($_POST, $id);
        try {
            PlanService::save($form);
            Flash::set('success', $id ? "O plano \"{$form['name']}\" foi atualizado." : "O plano \"{$form['name']}\" foi cadastrado.");
            View::redirect('planos.php');
        } catch (ValidationException $exception) {
            $errors = $exception->fields;
        }
    }
} catch (Throwable $exception) {
    admin_fail($exception, 'plano-form');
}

$title = $id ? 'Editar plano' : 'Novo plano';
$items = PlanService::items($form['items']);
$check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

$invalid = static fn (string $field): string => isset($errors[$field]) ? ' aria-invalid="true" aria-describedby="erro-' . $field . '"' : '';
$error = static fn (string $field): string => isset($errors[$field])
    ? '<p class="field-error" id="erro-' . $field . '">' . View::e($errors[$field]) . '</p>' : '';

admin_page_start($title, 'planos.php', $adminUser, ['style-assinatura.css']);
?>
<section class="admin-hero">
    <div>
        <a class="admin-back" href="planos.php"><span aria-hidden="true">←</span> Planos</a>
        <h1><?= View::e($title) ?></h1>
        <p><?= $id ? 'Atualize o plano exibido na página da assinatura.' : 'Preencha os dados do novo plano da F1Hub Box.' ?></p>
    </div>
</section>

<?php if ($errors): ?>
    <p class="admin-alert is-error" role="alert">Confira os campos destacados.</p>
<?php endif; ?>

<form class="admin-form-layout" method="post" action="plano-form.php<?= $id ? '?id=' . $id : '' ?>" novalidate data-plan-form>
    <?= admin_csrf_field() ?>
    <div class="admin-form-main">
        <section class="admin-card" aria-labelledby="secao-plano">
            <h2 id="secao-plano">Informações</h2>
            <div class="admin-grid-2">
                <label class="admin-field">
                    <span>Nome do plano *</span>
                    <input type="text" name="name" value="<?= View::e($form['name']) ?>" maxlength="60" required data-preview-name<?= $invalid('name') ?>>
                    <?= $error('name') ?>
                </label>
                <label class="admin-field">
                    <span>Preço mensal *</span>
                    <span class="admin-input-prefix"><b>R$</b><input type="text" name="price" value="<?= View::e($form['price']) ?>" inputmode="decimal" placeholder="89,90" maxlength="12" required data-preview-price<?= $invalid('price') ?>></span>
                    <?= $error('price') ?>
                </label>
                <label class="admin-field admin-span-2">
                    <span>Identificador (slug)</span>
                    <input type="text" name="slug" value="<?= View::e($form['slug']) ?>" maxlength="40" pattern="[a-z0-9]+(-[a-z0-9]+)*" spellcheck="false" autocapitalize="none" placeholder="gerado a partir do nome" data-slug<?= $invalid('slug') ?>>
                    <small>Usado no endereço da página da assinatura (ex.: assinatura.html?plano=podio). Deixe em branco para gerar automaticamente.</small>
                    <?= $error('slug') ?>
                </label>
                <label class="admin-field admin-span-2">
                    <span>Frase de apoio *</span>
                    <input type="text" name="tagline" value="<?= View::e($form['tagline']) ?>" maxlength="120" placeholder="Ex.: Para começar a coleção" required data-preview-tagline<?= $invalid('tagline') ?>>
                    <?= $error('tagline') ?>
                </label>
            </div>
        </section>

        <section class="admin-card" aria-labelledby="secao-beneficios">
            <h2 id="secao-beneficios">Benefícios *</h2>
            <label class="admin-field">
                <span>Um benefício por linha (até <?= PlanService::MAX_ITEMS ?>)</span>
                <textarea name="items" rows="5" maxlength="1200" placeholder="2 mimos surpresa por mês&#10;Cartão colecionável exclusivo do mês" data-preview-items<?= $invalid('items') ?>><?= View::e($form['items']) ?></textarea>
                <?= $error('items') ?>
            </label>
        </section>

        <section class="admin-card" aria-labelledby="secao-opcoes">
            <h2 id="secao-opcoes">Opções</h2>
            <div class="admin-switches">
                <label class="admin-switch">
                    <input type="checkbox" name="includes_shirt" value="1"<?= $form['includes_shirt'] ? ' checked' : '' ?>>
                    <span class="admin-switch-track" aria-hidden="true"></span>
                    <span>Inclui camiseta <small>O assinante precisa escolher o tamanho da camiseta.</small></span>
                </label>
                <label class="admin-switch">
                    <input type="checkbox" name="highlight" value="1"<?= $form['highlight'] ? ' checked' : '' ?> data-preview-highlight>
                    <span class="admin-switch-track" aria-hidden="true"></span>
                    <span>Destaque "Mais escolhido" <small>Só um plano fica em destaque: marcar este tira o destaque do atual.</small></span>
                </label>
                <label class="admin-switch">
                    <input type="checkbox" name="active" value="1"<?= $form['active'] ? ' checked' : '' ?>>
                    <span class="admin-switch-track" aria-hidden="true"></span>
                    <span>Plano ativo <small>Planos inativos não aparecem na página da assinatura; assinaturas existentes continuam valendo.</small></span>
                </label>
            </div>
        </section>

        <div class="admin-form-actions">
            <button type="submit" class="button button-red"><?= $id ? 'Salvar alterações' : 'Cadastrar plano' ?></button>
            <a class="admin-link" href="planos.php">Cancelar</a>
        </div>
    </div>

    <aside class="admin-preview admin-plan-preview" aria-label="Prévia do card na página da assinatura">
        <p class="eyebrow">Prévia</p>
        <article class="plan-card<?= $form['highlight'] ? ' is-highlight' : '' ?>" data-preview-card>
            <span class="plan-badge" data-preview-badge<?= $form['highlight'] ? '' : ' hidden' ?>>Mais escolhido</span>
            <p class="plan-tagline" data-preview-tagline-text><?= View::e($form['tagline'] ?: 'Frase de apoio') ?></p>
            <h3 data-preview-title><?= View::e($form['name'] ?: 'Nome do plano') ?></h3>
            <p class="plan-price"><strong data-preview-price-text>R$ —</strong><span>/mês</span></p>
            <ul data-preview-list data-check="<?= View::e($check) ?>">
                <?php foreach ($items as $item): ?><li><?= $check . View::e($item) ?></li><?php endforeach; ?>
            </ul>
            <span class="plan-cta" aria-hidden="true"><span>Quero o <span data-preview-cta><?= View::e($form['name'] ?: 'plano') ?></span></span></span>
        </article>
    </aside>
</form>
<?php admin_page_end();
