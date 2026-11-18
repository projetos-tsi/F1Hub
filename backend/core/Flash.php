<?php
declare(strict_types=1);

/**
 * Mensagem exibida uma única vez na próxima página (ex.: "Produto salvo.").
 * Usada no padrão POST → redirecionamento → GET dos formulários do admin.
 */
final class Flash
{
    public static function set(string $type, string $message): void
    {
        Session::start();
        $_SESSION['flash'] = ['type' => $type === 'error' ? 'error' : 'success', 'message' => $message];
    }

    /** Devolve a mensagem pendente (ou null) e a apaga. */
    public static function take(): ?array
    {
        Session::start();
        $flash = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);
        return is_array($flash) ? $flash : null;
    }
}
