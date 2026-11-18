<?php
/**
 * Admin — planos da F1Hub Box.
 * Ações por POST (com token CSRF): ativar/desativar e excluir.
 */
require __DIR__ . '/includes/admin.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    admin_require_valid_post('planos.php');
    $id = Input::id($_POST, 'id');
    try {
        switch (Input::line($_POST, 'action')) {
            case 'toggle':
                $plan = PlanService::toggle($id);
                Flash::set('success', $plan['active']
                    ? "O plano \"{$plan['name']}\" foi ativado e volta a ser oferecido na página da assinatura."
                    : "O plano \"{$plan['name']}\" foi desativado e não é mais oferecido. Assinaturas existentes continuam valendo.");
                break;
            case 'delete':
                $name = PlanService::delete($id);
                Flash::set('success', "O plano \"{$name}\" foi excluído.");
                break;
            default:
                Flash::set('error', 'Ação desconhecida.');
        }
    } catch (ValidationException $exception) {
        Flash::set('error', $exception->getMessage());
    } catch (Throwable $exception) {
        admin_fail($exception, 'planos');
    }
    View::redirect('planos.php');
}

try {
    $plans = Plan::all();
} catch (Throwable $exception) {
    admin_fail($exception, 'planos');
}

$activeCount = count(array_filter($plans, static fn (array $plan): bool => (bool) $plan['active']));

admin_page_start('Planos', 'planos.php', $adminUser);
?>
<section class="admin-hero">
    <div>
        <p class="eyebrow">Assinatura F1Hub Box</p>
        <h1>Planos</h1>
        <p>Cadastre, edite, ative ou desative os planos oferecidos na página da assinatura.</p>
    </div>
    <a class="button button-red" href="plano-form.php"><span aria-hidden="true">+</span> Novo plano</a>
</section>

<p class="admin-summary" role="status">
    <?= count($plans) ?> <?= count($plans) === 1 ? 'plano cadastrado' : 'planos cadastrados' ?> · <?= $activeCount ?> <?= $activeCount === 1 ? 'ativo' : 'ativos' ?>
</p>

<?php if (!$plans): ?>
    <div class="admin-empty">
        <h2>Nenhum plano cadastrado</h2>
        <p>Cadastre o primeiro plano da F1Hub Box.</p>
    </div>
<?php else: ?>
    <div class="admin-table-wrap">
        <table class="admin-table">
            <thead>
                <tr>
                    <th scope="col">Plano</th>
                    <th scope="col">Preço</th>
                    <th scope="col">Benefícios</th>
                    <th scope="col">Camiseta</th>
                    <th scope="col">Assinaturas</th>
                    <th scope="col">Situação</th>
                    <th scope="col"><span class="sr-only">Ações</span></th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($plans as $plan): ?>
                <?php $used = (int) $plan['subscription_count'] > 0; ?>
                <tr class="<?= $plan['active'] ? '' : 'is-inactive' ?>">
                    <td data-label="Plano">
                        <div class="admin-plan-name">
                            <strong><?= View::e($plan['name']) ?><?= $plan['highlight'] ? ' <span class="admin-tag">Mais escolhido</span>' : '' ?></strong>
                            <small><?= View::e($plan['slug']) ?> · <?= View::e($plan['tagline']) ?></small>
                        </div>
                    </td>
                    <td data-label="Preço" class="admin-price"><span><strong><?= View::money($plan['price_cents']) ?></strong><small>/mês</small></span></td>
                    <td data-label="Benefícios"><?= count(PlanService::items($plan['items'])) ?></td>
                    <td data-label="Camiseta"><?= $plan['includes_shirt'] ? 'Sim' : 'Não' ?></td>
                    <td data-label="Assinaturas" class="admin-nowrap"><?= (int) $plan['active_subscriptions'] ?> <?= (int) $plan['active_subscriptions'] === 1 ? 'ativa' : 'ativas' ?><?= $used ? ' · ' . (int) $plan['subscription_count'] . ' no total' : '' ?></td>
                    <td data-label="Situação"><?= $plan['active'] ? admin_status_pill('Ativo', 'on') : admin_status_pill('Inativo', 'off') ?></td>
                    <td class="admin-actions">
                        <a class="admin-action" href="plano-form.php?id=<?= (int) $plan['id'] ?>">Editar</a>
                        <form method="post" action="planos.php">
                            <?= admin_csrf_field() ?>
                            <input type="hidden" name="id" value="<?= (int) $plan['id'] ?>">
                            <button type="submit" class="admin-action" name="action" value="toggle"><?= $plan['active'] ? 'Desativar' : 'Ativar' ?></button>
                        </form>
                        <form method="post" action="planos.php" data-confirm-title="Excluir plano?" data-confirm-button="Excluir plano" data-confirm="O plano &quot;<?= View::e($plan['name']) ?>&quot; será apagado. Esta ação não pode ser desfeita.">
                            <?= admin_csrf_field() ?>
                            <input type="hidden" name="id" value="<?= (int) $plan['id'] ?>">
                            <button type="submit" class="admin-action is-danger" name="action" value="delete"<?= $used ? ' disabled data-locked aria-describedby="assinado-' . (int) $plan['id'] . '"' : '' ?>>Excluir</button>
                        </form>
                        <?php if ($used): ?>
                            <small class="admin-action-note" id="assinado-<?= (int) $plan['id'] ?>">Com assinaturas: só pode ser desativado</small>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
<?php endif; ?>
<?php admin_page_end();
