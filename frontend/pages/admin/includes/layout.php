<?php
/**
 * Layout compartilhado da área administrativa (cabeçalho, menu, mensagens e rodapé).
 * Mesma identidade visual do site: carbono, vermelho F1 Hub, Inter e Syncopate.
 */

/** Itens do menu do admin: arquivo => rótulo. */
const ADMIN_NAV = [
    'index.php' => 'Painel',
    'produtos.php' => 'Produtos',
];

function admin_head(string $title): void
{
    ?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title><?= View::e($title) ?> | Admin F1 Hub</title>
    <link rel="icon" href="../../src/assets/images/logo.svg">
    <link rel="stylesheet" href="../../src/style/reset.css"><link rel="stylesheet" href="../../src/style/style-admin.css">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Syncopate:wght@700&display=swap" rel="stylesheet">
    <script src="../../js/admin.js" defer></script>
</head>
<?php
}

/** Abre a página: cabeçalho com o administrador logado, menu e mensagem pendente. */
function admin_page_start(string $title, string $active, array $user): void
{
    admin_head($title);
    $firstName = explode(' ', (string) $user['name'])[0];
    ?>
<body class="admin-body">
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header class="admin-header">
        <a class="admin-brand" href="index.php" aria-label="Painel do administrador F1 Hub">
            <img src="../../src/assets/images/logo.svg" alt="">
            <span>F1 Hub</span>
            <em>Admin</em>
        </a>
        <div class="admin-user">
            <span class="admin-user-name" title="<?= View::e($user['email']) ?>">Olá, <?= View::e($firstName) ?></span>
            <a class="admin-store-link" href="../../index.php">Ver loja</a>
            <form method="post" action="sair.php">
                <?= admin_csrf_field() ?>
                <button type="submit" class="admin-logout">Sair</button>
            </form>
        </div>
    </header>
    <nav class="admin-nav" aria-label="Área administrativa">
        <?php foreach (ADMIN_NAV as $file => $label): ?>
            <a href="<?= View::e($file) ?>"<?= $file === $active ? ' aria-current="page"' : '' ?>><?= View::e($label) ?></a>
        <?php endforeach; ?>
    </nav>
    <main id="conteudo" class="admin-main">
        <?php admin_flash(); ?>
<?php
}

function admin_page_end(): void
{
    ?>
    </main>
    <footer class="admin-footer">
        <p>F1 Hub · Área administrativa</p>
        <p>Projeto acadêmico • Feito por fãs de velocidade</p>
    </footer>
</body>
</html>
<?php
}

/** Campo oculto com o token CSRF da sessão (obrigatório em todo formulário que altera dados). */
function admin_csrf_field(): string
{
    return '<input type="hidden" name="csrf_token" value="' . View::e(Csrf::token()) . '">';
}

/** Mensagem de sucesso/erro deixada pela ação anterior. */
function admin_flash(): void
{
    $flash = Flash::take();
    if (!$flash) {
        return;
    }
    $role = $flash['type'] === 'error' ? 'alert' : 'status';
    echo '<p class="admin-alert is-' . View::e($flash['type']) . '" role="' . $role . '">' . View::e($flash['message']) . '</p>';
}

/** Página simples de aviso (acesso restrito, erro) — encerra a requisição. */
function admin_message_page(int $status, string $title, string $message, bool $restricted = false): never
{
    http_response_code($status);
    admin_head($title);
    ?>
<body class="admin-body admin-body-message">
    <main id="conteudo" class="admin-message">
        <a class="admin-brand" href="../../index.php" aria-label="F1 Hub — página inicial">
            <img src="../../src/assets/images/logo.svg" alt=""><span>F1 Hub</span>
        </a>
        <p class="eyebrow">Área administrativa</p>
        <h1><?= View::e($title) ?></h1>
        <p><?= View::e($message) ?></p>
        <div class="admin-message-actions">
            <a class="button button-red" href="../../index.php">Ir para a loja</a>
            <?php if ($restricted): ?>
                <a class="button-outline button-outline-light" href="../../src/pages/conta.html">Minha conta</a>
            <?php endif; ?>
        </div>
    </main>
</body>
</html>
<?php
    exit;
}
