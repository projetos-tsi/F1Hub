<?php
/**
 * Admin — pedidos da loja (gravados pelo checkout), com filtro por situação.
 * O detalhe e a troca de situação ficam em pedido.php.
 */
require __DIR__ . '/includes/admin.php';

$status = Input::line($_GET, 'status');
$status = isset(Order::STATUSES[$status]) ? $status : '';
$q = mb_substr(Input::line($_GET, 'q'), 0, 80);

try {
    $total = Order::count($status, $q);
    $page = admin_page_number($total);
    $orders = Order::search($status, ADMIN_PER_PAGE, ($page - 1) * ADMIN_PER_PAGE, $q);
} catch (Throwable $exception) {
    admin_fail($exception, 'pedidos');
}

admin_page_start('Pedidos', 'pedidos.php', $adminUser);
?>
<section class="admin-hero">
    <div>
        <p class="eyebrow">Loja</p>
        <h1>Pedidos</h1>
        <p>Pedidos feitos na loja, do mais recente ao mais antigo (pagamento PIX simulado).</p>
    </div>
    <?php if ($total > 0): ?>
        <a class="button button-dark" href="<?= View::e('pedidos-csv.php' . (($query = http_build_query(array_filter(['status' => $status, 'q' => $q]))) ? "?{$query}" : '')) ?>" download>Exportar planilha (CSV)</a>
    <?php endif; ?>
</section>

<?php admin_status_tabs('pedidos.php', Order::STATUSES, $status); ?>

<form class="admin-filters" method="get" action="pedidos.php" role="search" aria-label="Buscar pedidos">
    <?php if ($status): ?><input type="hidden" name="status" value="<?= View::e($status) ?>"><?php endif; ?>
    <label class="admin-field admin-field-grow">
        <span>Buscar</span>
        <input type="search" name="q" value="<?= View::e($q) ?>" placeholder="Nº do pedido, nome ou e-mail do cliente" maxlength="80">
    </label>
    <div class="admin-filters-actions">
        <button type="submit" class="button button-dark">Buscar</button>
        <?php if ($q !== ''): ?><a class="admin-link" href="pedidos.php<?= $status ? '?status=' . rawurlencode($status) : '' ?>">Limpar busca</a><?php endif; ?>
    </div>
</form>

<p class="admin-summary" role="status"><?= $total ?> <?= $total === 1 ? 'pedido' : 'pedidos' ?><?= $status ? ' com a situação "' . View::e(Order::STATUSES[$status]) . '"' : '' ?><?= $q !== '' ? ' para "' . View::e($q) . '"' : '' ?></p>

<?php if (!$orders): ?>
    <div class="admin-empty">
        <h2>Nenhum pedido <?= $q !== '' ? 'encontrado' : ($status ? 'nesta situação' : 'ainda') ?></h2>
        <p><?= $q !== '' ? 'Confira o número ou tente outra parte do nome ou do e-mail.' : 'Os pedidos aparecem aqui quando os clientes finalizam compras no checkout.' ?></p>
    </div>
<?php else: ?>
    <div class="admin-table-wrap">
        <table class="admin-table">
            <thead>
                <tr>
                    <th scope="col">Pedido</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Data</th>
                    <th scope="col">Itens</th>
                    <th scope="col">Entrega</th>
                    <th scope="col">Total</th>
                    <th scope="col">Situação</th>
                    <th scope="col"><span class="sr-only">Ações</span></th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($orders as $order): ?>
                <tr>
                    <td data-label="Pedido"><a class="admin-code" href="pedido.php?id=<?= (int) $order['id'] ?>">#<?= (int) $order['id'] ?></a></td>
                    <td data-label="Cliente">
                        <div class="admin-person"><strong><?= View::e($order['user_name']) ?></strong><small><?= View::e($order['user_email']) ?></small></div>
                    </td>
                    <td data-label="Data" class="admin-nowrap"><?= View::dateTime($order['created_at']) ?></td>
                    <td data-label="Itens"><?= (int) $order['item_count'] ?></td>
                    <td data-label="Entrega"><?= View::e($order['city']) ?>/<?= View::e($order['state']) ?></td>
                    <td data-label="Total" class="admin-price">
                        <span>
                            <strong><?= View::money($order['total_cents']) ?></strong>
                            <?php if ((int) $order['discount_cents'] > 0): ?><small><?= View::money($order['discount_cents']) ?> de desconto PIX</small><?php endif; ?>
                        </span>
                    </td>
                    <td data-label="Situação"><?= admin_order_pill($order['status']) ?></td>
                    <td class="admin-actions"><a class="admin-action" href="pedido.php?id=<?= (int) $order['id'] ?>">Ver detalhes</a></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php admin_pager('pedidos.php', ['status' => $status, 'q' => $q], $total, $page); ?>
<?php endif; ?>
<?php admin_page_end();
