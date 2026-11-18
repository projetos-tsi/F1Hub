<?php
declare(strict_types=1);

/**
 * Proteção contra CSRF (requisições forjadas por outros sites).
 *
 * Formulários do admin: <input type="hidden" name="csrf_token" value="<?= Csrf::token() ?>">
 * Chamadas da API (fetch): cabeçalho "X-CSRF-Token" com o valor recebido em /api/auth.php?action=me
 */
final class Csrf
{
    public static function token(): string
    {
        Session::start();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function isValid(?string $token): bool
    {
        Session::start();
        return is_string($token)
            && !empty($_SESSION['csrf_token'])
            && hash_equals($_SESSION['csrf_token'], $token);
    }

    /** Token enviado pelo formulário (campo) ou pelo fetch (cabeçalho). */
    public static function fromRequest(): ?string
    {
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        // Um campo enviado como lista (csrf_token[]=...) é tratado como ausente.
        return is_string($token) ? $token : null;
    }
}
