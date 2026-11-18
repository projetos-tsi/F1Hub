<?php
/**
 * Admin — detalhe de um pedido e troca de situação.
 *
 * A situação só avança (recebido → pago → enviado → entregue); cancelar é possível
 * apenas antes do envio. Cada mudança é um POST com token CSRF e pede confirmação.
 * O formulário envia a situação que o administrador está vendo ("from"): se outra
 * pessoa já tiver mudado o pedido, nada é alterado e aparece um aviso.
 */
require __DIR__ . '/includes/admin.php';

$id = Input::id($_GET, 'id') ?: Input::id($_POST, 'id');
$self = 'pedido.php?id=' . $id;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    admin_require_valid_post($id ? $self : 'pedidos.php');
    try {
        $change = OrderService::changeStatus($id, Input::line($_POST, 'from'), Input::line($_POST, 'to'));
        $to = Order::STATUSES[$change['to']];
        Flash::set('success', "Pedido #{$id}: situação alterada para \"{$to}\".");
    } catch (ValidationException | ConflictException $exception) {
        Flash::set('error', $exception->getMessage());
    } catch (Throwable $exception) {
        admin_fail($exception, 'pedido');
    }
    View::redirect($id ? $self : 'pedidos.php');
}

try {
    $order = $id ? Order::find($id) : null;
    $items = $order ? (Order::itemsFor([$id])[$id] ?? []) : [];
} catch (Throwable $exception) {
    admin_fail($exception, 'pedido');
}
if (!$order) {
    Flash::set('error', 'Pedido não encontrado.');
    View::redirect('pedidos.php');
}

$status = $order['status'];
$next = OrderService::TRANSITIONS[$status];
$steps = ['recebido', 'pago', 'enviado', 'entregue'];
$currentStep = array_search($status, $steps, true);
$units = array_sum(array_map(static fn (array $item): int => (int) $item['quantity'], $items));

/** Mensagem da janela de confirmação para cada mudança. */
$confirmations = [
    'pago' => 'O pagamento PIX deste pedido será registrado como recebido.',
    'enviado' => 'O pedido será marcado como enviado ao endereço do cliente.',
    'entregue' => 'O pedido será marcado como entregue. Depois disso a situação não muda mais.',
    'cancelado' => 'O pedido será cancelado e deixará de contar na receita. Esta ação não pode ser desfeita.',
];

admin_page_start('Pedido #' . $id, 'pedidos.php', $adminUser);
?>
<a class="admin-back" href="pedidos.php">← Pedidos</a>
<section class="admin-hero">
    <div>
        <p class="eyebrow">Pedido da loja</p>
        <h1>Pedido #<?= $id ?> <?= admin_order_pill($status) ?></h1>
        <p>Feito em <?= View::dateTime($order['created_at']) ?> · última atualização em <?= View::dateTime($order['updated_at']) ?></p>
    </div>
</section>

<div class="admin-order-layout">
    <section class="admin-card admin-order-status" aria-labelledby="situacao">
        <div class="admin-card-heading"><h2 id="situacao">Situação</h2></div>
        <?php if ($status === 'cancelado'): ?>
            <p class="admin-order-cancelled">Pedido cancelado. A situação não muda mais e o valor não entra na receita.</p>
        <?php else: ?>
            <ol class="admin-steps" aria-label="Andamento do pedido">
                <?php foreach ($steps as $index => $step): ?>
                    <li class="<?= $index < $currentStep ? 'is-done' : '' ?><?= $index === $currentStep ? ' is-current' : '' ?>"<?= $index === $currentStep ? ' aria-current="step"' : '' ?>>
                        <span aria-hidden="true"><?= $index < $currentStep ? '✓' : $index + 1 ?></span><?= View::e(Order::STATUSES[$step]) ?>
                    </li>
                <?php endforeach; ?>
            </ol>
        <?php endif; ?>

        <?php if ($next): ?>
            <div class="admin-status-actions">
                <?php foreach ($next as $to): ?>
                    <form method="post" action="pedido.php"
                          data-confirm-title="<?= View::e(OrderService::TRANSITION_LABELS[$to]) ?>?"
                          data-confirm-button="<?= View::e(OrderService::TRANSITION_LABELS[$to]) ?>"
                          data-confirm="Pedido #<?= $id ?>: <?= View::e($confirmations[$to]) ?>">
                        <?= admin_csrf_field() ?>
                        <input type="hidden" name="id" value="<?= $id ?>">
                        <input type="hidden" name="from" value="<?= View::e($status) ?>">
                        <input type="hidden" name="to" value="<?= View::e($to) ?>">
                        <button type="submit" class="<?= $to === 'cancelado' ? 'admin-action is-danger' : 'button button-red' ?>"><?= View::e(OrderService::TRANSITION_LABELS[$to]) ?></button>
                    </form>
                <?php endforeach; ?>
            </div>
            <p class="admin-hint">A situação só avança. Cancelar é possível apenas antes do envio.</p>
        <?php elseif ($status === 'entregue'): ?>
            <p class="admin-hint">Pedido entregue: a situação não muda mais.</p>
        <?php endif; ?>
    </section>

    <section class="admin-card" aria-labelledby="cliente">
        <div class="admin-card-heading"><h2 id="cliente">Cliente e entrega</h2></div>
        <dl class="admin-dl">
            <div><dt>Cliente</dt><dd><?= View::e($order['user_name']) ?></dd></div>
            <div><dt>E-mail</dt><dd><a class="admin-link" href="usuarios.php?q=<?= rawurlencode($order['user_email']) ?>"><?= View::e($order['user_email']) ?></a></dd></div>
            <div><dt>Endereço</dt><dd><?= View::e($order['address']) ?>, <?= View::e($order['address_number']) ?></dd></div>
            <div><dt>Cidade</dt><dd><?= View::e($order['city']) ?>/<?= View::e($order['state']) ?> · CEP <?= View::e($order['postal_code']) ?></dd></div>
        </dl>
    </section>

    <section class="admin-card admin-order-items" aria-labelledby="itens">
        <div class="admin-card-heading"><h2 id="itens">Itens (<?= $units ?>)</h2><span class="admin-hint">Preços do momento da compra</span></div>
        <ul class="admin-mini-list">
            <?php foreach ($items as $item): ?>
                <li>
                    <div class="admin-product">
                        <span class="admin-thumb" data-team="<?= View::e($item['team_slug']) ?>"><img src="../../src/assets/images/<?= rawurlencode($item['product_image']) ?>" alt="" loading="lazy"></span>
                        <span>
                            <strong><a class="admin-link" href="produto-form.php?id=<?= (int) $item['product_id'] ?>"><?= View::e($item['product_name']) ?></a></strong>
                            <small>Tamanho <?= View::e($item['size']) ?> · <?= (int) $item['quantity'] ?> × <?= View::money($item['unit_price_cents']) ?><?= $item['product_active'] ? '' : ' · produto inativo' ?></small>
                        </span>
                    </div>
                    <span class="admin-mini-value"><?= View::money((int) $item['unit_price_cents'] * (int) $item['quantity']) ?></span>
                </li>
            <?php endforeach; ?>
        </ul>
        <dl class="admin-totals">
            <div><dt>Subtotal</dt><dd><?= View::money($order['subtotal_cents']) ?></dd></div>
            <div class="is-discount"><dt>Desconto PIX (5%)</dt><dd>− <?= View::money($order['discount_cents']) ?></dd></div>
            <div class="is-total"><dt>Total · PIX simulado</dt><dd><?= View::money($order['total_cents']) ?></dd></div>
        </dl>
    </section>
</div>
<?php admin_page_end();
