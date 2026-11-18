<?php
/**
 * Admin — pedidos da loja (somente leitura nesta fase).
 * Os pedidos passam a ser gravados pelo checkout na fase B4, junto com a troca de situação.
 */
require __DIR__ . '/includes/admin.php';

/** Cor do selo de cada situação. */
const ORDER_TONES = ['recebido' => 'warn', 'pago' => 'info', 'enviado' => 'info', 'entregue' => 'on', 'cancelado' => 'danger'];

$status = Input::line($_GET, 'status');
$status = isset(Order::STATUSES[$status]) ? $status : '';

try {
    $total = Order::count($status);
    $page = admin_page_number($total);
    $orders = Order::search($status, ADMIN_PER_PAGE, ($page - 1) * ADMIN_PER_PAGE);
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
</section>

<?php admin_status_tabs('pedidos.php', Order::STATUSES, $status); ?>

<p class="admin-summary" role="status"><?= $total ?> <?= $total === 1 ? 'pedido' : 'pedidos' ?><?= $status ? ' com a situação "' . View::e(Order::STATUSES[$status]) . '"' : '' ?></p>

<?php if (!$orders): ?>
    <div class="admin-empty">
        <h2>Nenhum pedido <?= $status ? 'nesta situação' : 'ainda' ?></h2>
        <p>Os pedidos aparecem aqui quando os clientes finalizam compras no checkout.</p>
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
                </tr>
            </thead>
            <tbody>
            <?php foreach ($orders as $order): ?>
                <tr>
                    <td data-label="Pedido"><strong class="admin-code">#<?= (int) $order['id'] ?></strong></td>
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
                    <td data-label="Situação"><?= admin_status_pill(Order::STATUSES[$order['status']], ORDER_TONES[$order['status']]) ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php admin_pager('pedidos.php', ['status' => $status], $total, $page); ?>
<?php endif; ?>
<?php admin_page_end();
