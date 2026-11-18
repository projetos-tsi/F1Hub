<?php
/**
 * Admin — assinaturas da F1Hub Box (somente leitura nesta fase).
 * A contratação, a troca e o cancelamento pelo cliente chegam na fase B5.
 */
require __DIR__ . '/includes/admin.php';

$status = Input::line($_GET, 'status');
$status = isset(Subscription::STATUSES[$status]) ? $status : '';

try {
    $total = Subscription::count($status);
    $page = admin_page_number($total);
    $subscriptions = Subscription::search($status, ADMIN_PER_PAGE, ($page - 1) * ADMIN_PER_PAGE);
} catch (Throwable $exception) {
    admin_fail($exception, 'assinaturas');
}

admin_page_start('Assinaturas', 'assinaturas.php', $adminUser);
?>
<section class="admin-hero">
    <div>
        <p class="eyebrow">F1Hub Box</p>
        <h1>Assinaturas</h1>
        <p>Assinantes, plano escolhido, equipe favorita e tamanho da camiseta.</p>
    </div>
</section>

<?php admin_status_tabs('assinaturas.php', ['ativa' => 'Ativas', 'cancelada' => 'Canceladas'], $status, 'Todas'); ?>

<p class="admin-summary" role="status"><?= $total ?> <?= $total === 1 ? 'assinatura' : 'assinaturas' ?><?= $status ? ($total === 1 ? ' ' . $status : ' ' . $status . 's') : '' ?></p>

<?php if (!$subscriptions): ?>
    <div class="admin-empty">
        <h2>Nenhuma assinatura <?= $status ? ($status === 'ativa' ? 'ativa' : 'cancelada') : 'ainda' ?></h2>
        <p>As assinaturas aparecem aqui quando os clientes assinam a F1Hub Box.</p>
    </div>
<?php else: ?>
    <div class="admin-table-wrap">
        <table class="admin-table">
            <thead>
                <tr>
                    <th scope="col">Assinante</th>
                    <th scope="col">Plano</th>
                    <th scope="col">Equipe</th>
                    <th scope="col">Camiseta</th>
                    <th scope="col">Início</th>
                    <th scope="col">Situação</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($subscriptions as $subscription): ?>
                <tr>
                    <td data-label="Assinante">
                        <div class="admin-person"><strong><?= View::e($subscription['user_name']) ?></strong><small><?= View::e($subscription['user_email']) ?></small></div>
                    </td>
                    <td data-label="Plano" class="admin-price"><span><strong><?= View::e($subscription['plan_name']) ?></strong><small><?= View::money($subscription['price_cents']) ?>/mês</small></span></td>
                    <td data-label="Equipe">
                        <?php if ($subscription['team_slug']): ?>
                            <span class="team-badge" data-team="<?= View::e($subscription['team_slug']) ?>"><?= View::e($subscription['team_name']) ?></span>
                        <?php else: ?>
                            <span class="team-badge">Surpresa</span>
                        <?php endif; ?>
                    </td>
                    <td data-label="Camiseta"><?= View::e($subscription['shirt_size'] ?? '—') ?></td>
                    <td data-label="Início" class="admin-nowrap"><?= View::dateTime($subscription['started_at']) ?></td>
                    <td data-label="Situação">
                        <?php if ($subscription['status'] === 'ativa'): ?>
                            <?= admin_status_pill('Ativa', 'on') ?>
                        <?php else: ?>
                            <?= admin_status_pill('Cancelada', 'off') ?>
                            <small class="admin-cell-note">em <?= View::dateTime($subscription['cancelled_at']) ?></small>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php admin_pager('assinaturas.php', ['status' => $status], $total, $page); ?>
<?php endif; ?>
<?php admin_page_end();
