<?php
/** Admin — painel com os totais da loja e da assinatura. */
require __DIR__ . '/includes/admin.php';

try {
    $products = Product::totals();
    $plans = Plan::totals();
    $users = User::totals();
    $orders = Order::totals();
    $subscriptions = Subscription::totals();
    $latestOrders = Order::search('', 5, 0);
    $latestSubscriptions = Subscription::search('', 5, 0);
} catch (Throwable $exception) {
    admin_fail($exception, 'painel');
}

/** "1 pedido" / "2 pedidos" */
$plural = static fn (int $count, string $one, string $many): string => $count . ' ' . ($count === 1 ? $one : $many);

admin_page_start('Painel', 'index.php', $adminUser);
?>
<section class="admin-hero">
    <div>
        <p class="eyebrow">Área administrativa</p>
        <h1>Painel</h1>
        <p>Visão geral da loja F1 Hub e da assinatura F1Hub Box.</p>
    </div>
    <div class="admin-hero-actions">
        <a class="button button-red" href="produto-form.php"><span aria-hidden="true">+</span> Novo produto</a>
        <a class="button button-dark" href="plano-form.php"><span aria-hidden="true">+</span> Novo plano</a>
    </div>
</section>

<div class="admin-stats">
    <a class="admin-stat admin-stat-dark" href="pedidos.php">
        <span>Receita da loja</span>
        <strong class="admin-stat-money"><?= View::money($orders['revenue_cents']) ?></strong>
        <small><?= $plural($orders['total'], 'pedido', 'pedidos') ?> · <?= $orders['pending'] ?> a processar · cancelados não somam</small>
    </a>
    <a class="admin-stat admin-stat-dark" href="assinaturas.php?status=ativa">
        <span>Assinaturas ativas</span>
        <strong><?= $subscriptions['active'] ?></strong>
        <small><?= View::money($subscriptions['monthly_cents']) ?>/mês recorrentes · <?= $plural($subscriptions['cancelled'], 'cancelada', 'canceladas') ?></small>
    </a>
    <a class="admin-stat" href="usuarios.php?role=user">
        <span>Clientes</span>
        <strong><?= $users['clients'] ?></strong>
        <small><?= $plural($users['admins'], 'administrador', 'administradores') ?></small>
    </a>
    <a class="admin-stat" href="produtos.php">
        <span>Produtos</span>
        <strong><?= (int) $products['total'] ?></strong>
        <small><?= $plural((int) $products['active'], 'ativo', 'ativos') ?> na loja</small>
    </a>
    <a class="admin-stat" href="planos.php">
        <span>Planos</span>
        <strong><?= (int) $plans['total'] ?></strong>
        <small><?= $plural((int) $plans['active'], 'ativo', 'ativos') ?> na assinatura</small>
    </a>
</div>

<div class="admin-panels">
    <section class="admin-card" aria-labelledby="ultimos-pedidos">
        <div class="admin-card-heading">
            <h2 id="ultimos-pedidos">Últimos pedidos</h2>
            <a class="admin-link" href="pedidos.php">Ver todos</a>
        </div>
        <?php if (!$latestOrders): ?>
            <p class="admin-hint">Nenhum pedido ainda. Eles aparecem aqui quando os clientes finalizam compras.</p>
        <?php else: ?>
            <ul class="admin-mini-list">
                <?php foreach ($latestOrders as $order): ?>
                    <li>
                        <div class="admin-person"><strong>#<?= (int) $order['id'] ?> · <?= View::e($order['user_name']) ?></strong><small><?= View::dateTime($order['created_at']) ?></small></div>
                        <span class="admin-mini-value"><?= View::money($order['total_cents']) ?></span>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </section>
    <section class="admin-card" aria-labelledby="ultimas-assinaturas">
        <div class="admin-card-heading">
            <h2 id="ultimas-assinaturas">Últimas assinaturas</h2>
            <a class="admin-link" href="assinaturas.php">Ver todas</a>
        </div>
        <?php if (!$latestSubscriptions): ?>
            <p class="admin-hint">Nenhuma assinatura ainda. Elas aparecem aqui quando os clientes assinam a F1Hub Box.</p>
        <?php else: ?>
            <ul class="admin-mini-list">
                <?php foreach ($latestSubscriptions as $subscription): ?>
                    <li>
                        <div class="admin-person"><strong><?= View::e($subscription['user_name']) ?></strong><small>Plano <?= View::e($subscription['plan_name']) ?> · <?= View::dateTime($subscription['started_at']) ?></small></div>
                        <?= $subscription['status'] === 'ativa' ? admin_status_pill('Ativa', 'on') : admin_status_pill('Cancelada', 'off') ?>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </section>
</div>
<?php admin_page_end();
