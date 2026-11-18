<?php
/** Admin — painel com os totais da loja. */
require __DIR__ . '/includes/admin.php';

try {
    $productTotals = Product::totals();
} catch (Throwable $exception) {
    admin_fail($exception, 'painel');
}

admin_page_start('Painel', 'index.php', $adminUser);
?>
<section class="admin-hero">
    <div>
        <p class="eyebrow">Área administrativa</p>
        <h1>Painel</h1>
        <p>Visão geral da loja F1 Hub e da assinatura F1Hub Box.</p>
    </div>
</section>

<div class="admin-stats">
    <a class="admin-stat" href="produtos.php">
        <span>Produtos cadastrados</span>
        <strong><?= (int) $productTotals['total'] ?></strong>
        <small><?= (int) $productTotals['active'] ?> ativos na loja</small>
    </a>
</div>

<section class="admin-shortcuts" aria-labelledby="atalhos">
    <h2 id="atalhos">Atalhos</h2>
    <div>
        <a class="button button-red" href="produto-form.php"><span aria-hidden="true">+</span> Novo produto</a>
        <a class="button-outline" href="produtos.php?status=inativos">Produtos inativos</a>
    </div>
</section>
<?php admin_page_end();
