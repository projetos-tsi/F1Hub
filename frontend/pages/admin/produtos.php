<?php
/**
 * Admin — lista de produtos com filtros.
 * Ações por POST (com token CSRF): ativar/desativar e excluir.
 */
require __DIR__ . '/includes/admin.php';

$filters = ProductService::filtersFrom($_GET);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    // Volta para a lista com os mesmos filtros que estavam aplicados.
    $back = 'produtos.php' . (($query = http_build_query(array_filter(ProductService::filtersFrom($_POST)))) ? "?{$query}" : '');
    admin_require_valid_post($back);
    $id = Input::id($_POST, 'id');
    try {
        switch (Input::line($_POST, 'action')) {
            case 'toggle':
                $product = ProductService::toggle($id);
                Flash::set('success', $product['active']
                    ? "\"{$product['name']}\" foi ativado e volta a aparecer na loja."
                    : "\"{$product['name']}\" foi desativado e não aparece mais na loja.");
                break;
            case 'delete':
                $name = ProductService::delete($id);
                Flash::set('success', "\"{$name}\" foi excluído.");
                break;
            default:
                Flash::set('error', 'Ação desconhecida.');
        }
    } catch (ValidationException $exception) {
        Flash::set('error', $exception->getMessage());
    } catch (Throwable $exception) {
        admin_fail($exception, 'produtos');
    }
    View::redirect($back);
}

try {
    $products = Product::search($filters);
    $teams = Team::all();
    $categories = Category::all();
} catch (Throwable $exception) {
    admin_fail($exception, 'produtos');
}

$activeCount = count(array_filter($products, static fn (array $product): bool => (bool) $product['active']));
$hasFilters = (bool) array_filter($filters);

/** Campos ocultos que preservam os filtros nos formulários de ação. */
$filterFields = '';
foreach (array_filter($filters) as $key => $value) {
    $filterFields .= '<input type="hidden" name="' . View::e($key) . '" value="' . View::e($value) . '">';
}

admin_page_start('Produtos', 'produtos.php', $adminUser);
?>
<section class="admin-hero">
    <div>
        <p class="eyebrow">Catálogo da loja</p>
        <h1>Produtos</h1>
        <p>Cadastre, edite, ative ou desative os produtos da loja.</p>
    </div>
    <a class="button button-red" href="produto-form.php"><span aria-hidden="true">+</span> Novo produto</a>
</section>

<form class="admin-filters" method="get" action="produtos.php" role="search" aria-label="Filtrar produtos">
    <label class="admin-field admin-field-grow">
        <span>Buscar</span>
        <input type="search" name="q" value="<?= View::e($filters['q']) ?>" placeholder="Nome, slug ou piloto" maxlength="80">
    </label>
    <label class="admin-field">
        <span>Equipe</span>
        <select name="team">
            <option value="">Todas</option>
            <?php foreach ($teams as $team): ?>
                <option value="<?= View::e($team['slug']) ?>"<?= $filters['team'] === $team['slug'] ? ' selected' : '' ?>><?= View::e($team['name']) ?></option>
            <?php endforeach; ?>
        </select>
    </label>
    <label class="admin-field">
        <span>Categoria</span>
        <select name="category">
            <option value="">Todas</option>
            <?php foreach ($categories as $category): ?>
                <option value="<?= (int) $category['id'] ?>"<?= $filters['category'] === (int) $category['id'] ? ' selected' : '' ?>><?= View::e($category['name']) ?></option>
            <?php endforeach; ?>
        </select>
    </label>
    <label class="admin-field">
        <span>Situação</span>
        <select name="status">
            <option value="">Todos</option>
            <option value="ativos"<?= $filters['status'] === 'ativos' ? ' selected' : '' ?>>Ativos</option>
            <option value="inativos"<?= $filters['status'] === 'inativos' ? ' selected' : '' ?>>Inativos</option>
        </select>
    </label>
    <div class="admin-filters-actions">
        <button type="submit" class="button button-dark">Filtrar</button>
        <?php if ($hasFilters): ?><a class="admin-link" href="produtos.php">Limpar filtros</a><?php endif; ?>
    </div>
</form>

<p class="admin-summary" role="status">
    <?php $one = count($products) === 1; ?>
    <?= count($products) ?> <?= $one ? 'produto' : 'produtos' ?>
    <?= ($hasFilters ? 'encontrado' : 'cadastrado') . ($one ? '' : 's') ?> · <?= $activeCount ?> <?= $activeCount === 1 ? 'ativo' : 'ativos' ?>
</p>

<?php if (!$products): ?>
    <div class="admin-empty">
        <h2>Nenhum produto encontrado</h2>
        <p><?= $hasFilters ? 'Tente outros filtros ou limpe a busca.' : 'Cadastre o primeiro produto da loja.' ?></p>
    </div>
<?php else: ?>
    <div class="admin-table-wrap">
        <table class="admin-table admin-table-products">
            <thead>
                <tr>
                    <th scope="col">Produto</th>
                    <th scope="col">Equipe</th>
                    <th scope="col">Categoria</th>
                    <th scope="col">Preço</th>
                    <th scope="col">Tamanhos</th>
                    <th scope="col">Situação</th>
                    <th scope="col"><span class="sr-only">Ações</span></th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($products as $product): ?>
                <?php $sold = (int) $product['order_count'] > 0; ?>
                <tr class="<?= $product['active'] ? '' : 'is-inactive' ?>">
                    <td data-label="Produto">
                        <div class="admin-product">
                            <span class="admin-thumb" data-team="<?= View::e($product['team_slug']) ?>">
                                <img src="../../src/assets/images/<?= rawurlencode($product['image']) ?>" alt="" loading="lazy">
                            </span>
                            <span>
                                <strong><?= View::e($product['name']) ?></strong>
                                <small><?= View::e($product['slug']) ?><?= $product['pilot'] ? ' · ' . View::e($product['pilot']) : '' ?></small>
                            </span>
                        </div>
                    </td>
                    <td data-label="Equipe"><span class="team-badge" data-team="<?= View::e($product['team_slug']) ?>"><?= View::e($product['team_name']) ?></span></td>
                    <td data-label="Categoria"><?= View::e($product['category_name']) ?></td>
                    <td data-label="Preço" class="admin-price">
                        <span>
                            <strong><?= View::money($product['price_cents']) ?></strong>
                            <?php if ($product['old_price_cents'] !== null): ?><s><?= View::money($product['old_price_cents']) ?></s><?php endif; ?>
                        </span>
                    </td>
                    <td data-label="Tamanhos" class="admin-nowrap"><?= View::e($product['sizes'] ?? '—') ?></td>
                    <td data-label="Situação">
                        <span class="status-pill <?= $product['active'] ? 'is-on' : 'is-off' ?>"><?= $product['active'] ? 'Ativo' : 'Inativo' ?></span>
                    </td>
                    <td class="admin-actions">
                        <a class="admin-action" href="produto-form.php?id=<?= (int) $product['id'] ?>">Editar</a>
                        <form method="post" action="produtos.php">
                            <?= admin_csrf_field() . $filterFields ?>
                            <input type="hidden" name="id" value="<?= (int) $product['id'] ?>">
                            <button type="submit" class="admin-action" name="action" value="toggle"><?= $product['active'] ? 'Desativar' : 'Ativar' ?></button>
                        </form>
                        <form method="post" action="produtos.php" data-confirm-title="Excluir produto?" data-confirm-button="Excluir produto" data-confirm="&quot;<?= View::e($product['name']) ?>&quot; será apagado do catálogo. Esta ação não pode ser desfeita.">
                            <?= admin_csrf_field() . $filterFields ?>
                            <input type="hidden" name="id" value="<?= (int) $product['id'] ?>">
                            <button type="submit" class="admin-action is-danger" name="action" value="delete"<?= $sold ? ' disabled data-locked aria-describedby="vendido-' . (int) $product['id'] . '"' : '' ?>>Excluir</button>
                        </form>
                        <?php if ($sold): ?>
                            <small class="admin-action-note" id="vendido-<?= (int) $product['id'] ?>">Com pedidos: só pode ser desativado</small>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
<?php endif; ?>
<?php admin_page_end();
