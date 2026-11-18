<?php
declare(strict_types=1);

/**
 * Regra de acesso à área administrativa: somente contas com role = admin.
 *
 * O papel é lido do BANCO a cada página (não só da sessão): se um administrador
 * deixar de ser admin, ou a conta for apagada, o acesso acaba na próxima requisição.
 */
final class AdminAccess
{
    /**
     * Devolve o administrador logado.
     * @throws AuthException 401 (ninguém logado) ou 403 (logado, mas não é admin)
     */
    public static function requireAdmin(): array
    {
        $user = AuthService::currentUser();
        if (!$user) {
            throw new AuthException('Entre com uma conta de administrador para continuar.', 401);
        }
        if ($user['role'] !== 'admin') {
            throw new AuthException('Esta área é restrita aos administradores do F1 Hub.', 403);
        }
        return $user;
    }

    /** Formulários que alteram dados: só POST e com o token CSRF da sessão. */
    public static function isValidPost(): bool
    {
        return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' && Csrf::isValid(Csrf::fromRequest());
    }
}
