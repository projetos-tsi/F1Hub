<?php
/**
 * Início de toda página da área administrativa:
 *
 *   require __DIR__ . '/includes/admin.php';
 *
 * - Carrega o backend e envia os cabeçalhos de segurança;
 * - Visitante → login (voltando para a página pedida depois de entrar);
 * - Usuário comum → página "Acesso restrito" (HTTP 403);
 * - Administrador → segue, com $adminUser disponível.
 *
 * Esta pasta (includes/) é bloqueada no navegador pelo .htaccess.
 */
require __DIR__ . '/../../../../backend/bootstrap.php';
require __DIR__ . '/layout.php';

View::securityHeaders();

try {
    $adminUser = AdminAccess::requireAdmin();
} catch (AuthException $exception) {
    if ($exception->status === 401) {
        View::redirect('../../src/pages/login.html?redirect=' . rawurlencode($_SERVER['REQUEST_URI'] ?? ''));
    }
    admin_message_page(403, 'Acesso restrito', $exception->getMessage(), true);
} catch (Throwable $exception) {
    error_log('[F1Hub] admin: ' . $exception->getMessage());
    admin_message_page(503, 'Área administrativa indisponível', 'Não foi possível conectar ao banco de dados. Verifique se o MySQL do XAMPP está ativo e tente novamente.');
}

/**
 * Formulários que alteram dados: exige POST com token CSRF válido.
 * Se falhar, volta para $back com uma mensagem de erro.
 */
function admin_require_valid_post(string $back): void
{
    if (!AdminAccess::isValidPost()) {
        Flash::set('error', 'Sua sessão expirou ou o formulário é inválido. Tente novamente.');
        View::redirect($back);
    }
}

/** Erro inesperado em uma página do admin: registra no log e mostra mensagem amigável. */
function admin_fail(Throwable $exception, string $context): never
{
    error_log("[F1Hub] admin {$context}: " . $exception->getMessage());
    admin_message_page(500, 'Algo deu errado', 'Não foi possível concluir agora. Tente novamente em instantes.');
}
