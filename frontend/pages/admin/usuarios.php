<?php
/**
 * Admin — usuários cadastrados (somente leitura).
 * Não há cadastro público de administradores: o perfil só muda direto no banco.
 */
require __DIR__ . '/includes/admin.php';

$q = mb_substr(Input::line($_GET, 'q'), 0, 80);
$role = Input::line($_GET, 'role');
$role = in_array($role, ['user', 'admin'], true) ? $role : '';
$hasFilters = $q !== '' || $role !== '';

try {
    $total = User::count($q, $role);
    $page = admin_page_number($total);
    $users = User::search($q, $role, ADMIN_PER_PAGE, ($page - 1) * ADMIN_PER_PAGE);
} catch (Throwable $exception) {
    admin_fail($exception, 'usuarios');
}

admin_page_start('Usuários', 'usuarios.php', $adminUser);
?>
<section class="admin-hero">
    <div>
        <p class="eyebrow">Contas</p>
        <h1>Usuários</h1>
        <p>Clientes e administradores cadastrados (somente consulta; senhas nunca são exibidas).</p>
    </div>
</section>

<form class="admin-filters" method="get" action="usuarios.php" role="search" aria-label="Filtrar usuários">
    <label class="admin-field admin-field-grow">
        <span>Buscar</span>
        <input type="search" name="q" value="<?= View::e($q) ?>" placeholder="Nome ou e-mail" maxlength="80">
    </label>
    <label class="admin-field">
        <span>Perfil</span>
        <select name="role">
            <option value="">Todos</option>
            <option value="user"<?= $role === 'user' ? ' selected' : '' ?>>Clientes</option>
            <option value="admin"<?= $role === 'admin' ? ' selected' : '' ?>>Administradores</option>
        </select>
    </label>
    <div class="admin-filters-actions">
        <button type="submit" class="button button-dark">Filtrar</button>
        <?php if ($hasFilters): ?><a class="admin-link" href="usuarios.php">Limpar filtros</a><?php endif; ?>
    </div>
</form>

<p class="admin-summary" role="status"><?= $total ?> <?= $total === 1 ? 'usuário' : 'usuários' ?> <?= $hasFilters ? ($total === 1 ? 'encontrado' : 'encontrados') : ($total === 1 ? 'cadastrado' : 'cadastrados') ?></p>

<?php if (!$users): ?>
    <div class="admin-empty">
        <h2>Nenhum usuário encontrado</h2>
        <p>Tente outra busca ou limpe os filtros.</p>
    </div>
<?php else: ?>
    <div class="admin-table-wrap">
        <table class="admin-table">
            <thead>
                <tr>
                    <th scope="col">Usuário</th>
                    <th scope="col">Perfil</th>
                    <th scope="col">Cadastro</th>
                    <th scope="col">Pedidos</th>
                    <th scope="col">Assinatura</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($users as $user): ?>
                <tr>
                    <td data-label="Usuário">
                        <div class="admin-person">
                            <strong><?= View::e($user['name']) ?><?= (int) $user['id'] === (int) $adminUser['id'] ? ' <span class="admin-tag">Você</span>' : '' ?></strong>
                            <small><?= View::e($user['email']) ?></small>
                        </div>
                    </td>
                    <td data-label="Perfil"><?= $user['role'] === 'admin' ? admin_status_pill('Administrador', 'dark') : admin_status_pill('Cliente', 'off') ?></td>
                    <td data-label="Cadastro" class="admin-nowrap"><?= View::dateTime($user['created_at']) ?></td>
                    <td data-label="Pedidos"><?= (int) $user['order_count'] ?></td>
                    <td data-label="Assinatura"><?= $user['active_plan'] ? View::e($user['active_plan']) : '—' ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php admin_pager('usuarios.php', ['q' => $q, 'role' => $role], $total, $page); ?>
<?php endif; ?>
<?php admin_page_end();
