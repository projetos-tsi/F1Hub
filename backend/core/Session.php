<?php
declare(strict_types=1);

/**
 * Sessão PHP do usuário logado.
 *
 * - Cookie HttpOnly (inacessível ao JavaScript) e SameSite=Lax;
 * - ID de sessão renovado a cada login (evita fixação de sessão) e modo estrito
 *   (o PHP não aceita IDs de sessão inventados);
 * - Pasta de sessões própria do F1 Hub, para que outros sistemas do XAMPP
 *   (ex.: phpMyAdmin) não apaguem as sessões do site;
 * - Sem "Lembrar de mim": a sessão termina ao fechar o navegador ou após 2 h sem uso;
 *   com "Lembrar de mim": dura 30 dias;
 * - Guarda apenas id, nome, e-mail e papel do usuário — nunca a senha.
 */
final class Session
{
    private const COOKIE_NAME = 'f1hub_session';
    private const REMEMBER_SECONDS = 60 * 60 * 24 * 30; // 30 dias
    private const IDLE_SECONDS = 60 * 60 * 2;           // 2 horas sem uso

    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $savePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'f1hub_sessions';
        if (!is_dir($savePath)) {
            mkdir($savePath, 0700, true);
        }
        session_save_path($savePath);

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.gc_maxlifetime', (string) self::REMEMBER_SECONDS);

        session_name(self::COOKIE_NAME);
        session_set_cookie_params(self::cookieOptions(0));
        session_start();

        // Sessão sem "Lembrar de mim" expira após um período sem uso.
        $now = time();
        if (isset($_SESSION['user']) && empty($_SESSION['remember'])
            && isset($_SESSION['last_activity']) && $now - $_SESSION['last_activity'] > self::IDLE_SECONDS) {
            $_SESSION = [];
            session_regenerate_id(true);
        }
        $_SESSION['last_activity'] = $now;
    }

    public static function login(array $user, bool $remember = false): void
    {
        self::start();
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
        ];
        $_SESSION['remember'] = $remember;

        if ($remember) {
            setcookie(session_name(), session_id(), self::cookieOptions(time() + self::REMEMBER_SECONDS));
        }
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        setcookie(session_name(), '', self::cookieOptions(time() - 3600));
        session_destroy();
    }

    /** Usuário logado ou null. */
    public static function user(): ?array
    {
        self::start();
        return $_SESSION['user'] ?? null;
    }

    public static function isAdmin(): bool
    {
        return (self::user()['role'] ?? null) === 'admin';
    }

    /** Mesmos atributos de cookie no login, no "Lembrar de mim" e no logout. */
    private static function cookieOptions(int $expires): array
    {
        $options = [
            'path' => '/',
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ];
        // session_set_cookie_params usa "lifetime"; setcookie usa "expires".
        return $expires === 0 ? ['lifetime' => 0] + $options : ['expires' => $expires] + $options;
    }
}
