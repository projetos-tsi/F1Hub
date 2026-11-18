<?php
/**
 * Admin — criar (sem ?id) ou editar (?id=N) um produto.
 * Em caso de erro, o formulário volta preenchido com as mensagens em cada campo.
 */
require __DIR__ . '/includes/admin.php';

$id = Input::id($_GET, 'id');
$errors = [];

try {
    $product = $id ? Product::find($id) : null;
    if ($id && !$product) {
        Flash::set('error', 'Produto não encontrado. Ele pode ter sido excluído.');
        View::redirect('produtos.php');
    }
    $form = $product ? ProductService::toForm($product) : ProductService::blank();

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        admin_require_valid_post($id ? "produto-form.php?id={$id}" : 'produto-form.php');
        $form = ProductService::formFrom($_POST, $id);
        try {
            ProductService::save($form);
            Flash::set('success', $id ? "\"{$form['name']}\" foi atualizado." : "\"{$form['name']}\" foi cadastrado.");
            View::redirect('produtos.php');
        } catch (ValidationException $exception) {
            $errors = $exception->fields;
        }
    }

    $teams = Team::all();
    $categories = Category::all();
    $images = ProductService::availableImages();
} catch (Throwable $exception) {
    admin_fail($exception, 'produto-form');
}

$title = $id ? 'Editar produto' : 'Novo produto';
$teamSlug = '';
foreach ($teams as $team) {
    if ((int) $team['id'] === $form['team_id']) {
        $teamSlug = $team['slug'];
    }
}

/** Atributos de acessibilidade e mensagem de erro de um campo. */
$invalid = static fn (string $field): string => isset($errors[$field]) ? ' aria-invalid="true" aria-describedby="erro-' . $field . '"' : '';
$error = static fn (string $field): string => isset($errors[$field])
    ? '<p class="field-error" id="erro-' . $field . '">' . View::e($errors[$field]) . '</p>' : '';

admin_page_start($title, 'produtos.php', $adminUser);
?>
<section class="admin-hero">
    <div>
        <a class="admin-back" href="produtos.php"><span aria-hidden="true">←</span> Produtos</a>
        <h1><?= View::e($title) ?></h1>
        <p><?= $id ? 'Atualize as informações exibidas na loja.' : 'Preencha os dados para cadastrar o produto na loja.' ?></p>
    </div>
</section>

<?php if ($errors): ?>
    <p class="admin-alert is-error" role="alert">Confira os campos destacados.</p>
<?php endif; ?>

<form class="admin-form-layout" method="post" action="produto-form.php<?= $id ? '?id=' . $id : '' ?>" novalidate data-product-form>
    <?= admin_csrf_field() ?>
    <div class="admin-form-main">
        <section class="admin-card" aria-labelledby="secao-info">
            <h2 id="secao-info">Informações</h2>
            <div class="admin-grid-2">
                <label class="admin-field admin-span-2">
                    <span>Nome do produto *</span>
                    <input type="text" name="name" value="<?= View::e($form['name']) ?>" maxlength="160" required data-preview-name<?= $invalid('name') ?>>
                    <?= $error('name') ?>
                </label>
                <label class="admin-field admin-span-2">
                    <span>Identificador (slug)</span>
                    <input type="text" name="slug" value="<?= View::e($form['slug']) ?>" maxlength="80" pattern="[a-z0-9]+(-[a-z0-9]+)*" spellcheck="false" autocapitalize="none" placeholder="gerado a partir do nome" data-slug<?= $invalid('slug') ?>>
                    <small>Usado no endereço da página do produto. Deixe em branco para gerar automaticamente.</small>
                    <?= $error('slug') ?>
                </label>
                <label class="admin-field">
                    <span>Equipe *</span>
                    <select name="team_id" required data-preview-team<?= $invalid('team_id') ?>>
                        <option value="">Escolha a equipe</option>
                        <?php foreach ($teams as $team): ?>
                            <option value="<?= (int) $team['id'] ?>" data-slug="<?= View::e($team['slug']) ?>" data-label="<?= View::e($team['label']) ?>"<?= $form['team_id'] === (int) $team['id'] ? ' selected' : '' ?>><?= View::e($team['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                    <?= $error('team_id') ?>
                </label>
                <label class="admin-field">
                    <span>Categoria *</span>
                    <select name="category_id" required<?= $invalid('category_id') ?>>
                        <option value="">Escolha a categoria</option>
                        <?php foreach ($categories as $category): ?>
                            <option value="<?= (int) $category['id'] ?>"<?= $form['category_id'] === (int) $category['id'] ? ' selected' : '' ?>><?= View::e($category['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                    <?= $error('category_id') ?>
                </label>
                <label class="admin-field admin-span-2">
                    <span>Piloto</span>
                    <input type="text" name="pilot" value="<?= View::e($form['pilot']) ?>" maxlength="80" placeholder="Deixe em branco se for um produto da equipe"<?= $invalid('pilot') ?>>
                    <?= $error('pilot') ?>
                </label>
            </div>
        </section>

        <section class="admin-card" aria-labelledby="secao-preco">
            <h2 id="secao-preco">Preço</h2>
            <div class="admin-grid-2">
                <label class="admin-field">
                    <span>Preço *</span>
                    <span class="admin-input-prefix"><b>R$</b><input type="text" name="price" value="<?= View::e($form['price']) ?>" inputmode="decimal" placeholder="209,90" maxlength="12" required data-preview-price<?= $invalid('price') ?>></span>
                    <?= $error('price') ?>
                </label>
                <label class="admin-field">
                    <span>Preço "de" (promoção)</span>
                    <span class="admin-input-prefix"><b>R$</b><input type="text" name="old_price" value="<?= View::e($form['old_price']) ?>" inputmode="decimal" placeholder="opcional" maxlength="12" data-preview-old-price<?= $invalid('old_price') ?>></span>
                    <small>Preencha com um valor maior que o preço para exibir o produto em promoção.</small>
                    <?= $error('old_price') ?>
                </label>
            </div>
        </section>

        <fieldset class="admin-card"<?= $invalid('sizes') ?>>
            <legend><h2>Tamanhos *</h2></legend>
            <div class="size-options" data-sizes>
                <?php foreach (Product::SIZES as $size): ?>
                    <label class="size-option">
                        <input type="checkbox" name="sizes[]" value="<?= View::e($size) ?>"<?= in_array($size, $form['sizes'], true) ? ' checked' : '' ?>>
                        <span><?= View::e($size) ?></span>
                    </label>
                <?php endforeach; ?>
            </div>
            <small class="admin-hint">"Único" é usado em acessórios como bonés e não se combina com os outros tamanhos.</small>
            <?= $error('sizes') ?>
        </fieldset>

        <fieldset class="admin-card"<?= $invalid('image') ?>>
            <legend><h2>Imagem *</h2></legend>
            <p class="admin-hint">Escolha uma das imagens disponíveis no projeto (<?= count($images) ?>).</p>
            <div class="image-picker">
                <?php foreach ($images as $image): ?>
                    <label class="image-option" title="<?= View::e($image) ?>">
                        <input type="radio" name="image" value="<?= View::e($image) ?>"<?= $form['image'] === $image ? ' checked' : '' ?> data-preview-image>
                        <img src="../../src/assets/images/<?= rawurlencode($image) ?>" alt="<?= View::e($image) ?>" loading="lazy">
                    </label>
                <?php endforeach; ?>
            </div>
            <?= $error('image') ?>
        </fieldset>

        <section class="admin-card" aria-labelledby="secao-publicacao">
            <h2 id="secao-publicacao">Publicação</h2>
            <label class="admin-switch">
                <input type="checkbox" name="active" value="1"<?= $form['active'] ? ' checked' : '' ?>>
                <span class="admin-switch-track" aria-hidden="true"></span>
                <span>Produto ativo <small>Produtos inativos não aparecem na loja.</small></span>
            </label>
        </section>

        <div class="admin-form-actions">
            <button type="submit" class="button button-red"><?= $id ? 'Salvar alterações' : 'Cadastrar produto' ?></button>
            <a class="admin-link" href="produtos.php">Cancelar</a>
        </div>
    </div>

    <aside class="admin-preview" aria-label="Prévia do card na loja" data-team="<?= View::e($teamSlug) ?>">
        <p class="eyebrow">Prévia</p>
        <div class="product-image" data-team="<?= View::e($teamSlug) ?>" data-preview-card>
            <span class="product-tag sale" data-preview-tag hidden></span>
            <img src="<?= $form['image'] !== '' ? '../../src/assets/images/' . rawurlencode($form['image']) : '../../src/assets/images/logo.svg' ?>" alt="" data-preview-img>
        </div>
        <p class="admin-preview-team" data-preview-team-label></p>
        <h3 data-preview-title><?= View::e($form['name'] ?: 'Nome do produto') ?></h3>
        <p class="admin-preview-price"><strong data-preview-price-text></strong> <s data-preview-old-text></s></p>
    </aside>
</form>
<?php admin_page_end();
