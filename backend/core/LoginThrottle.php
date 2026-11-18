<?php
declare(strict_types=1);

/**
 * Limite de tentativas de login guardado no SERVIDOR (não na sessão, que o atacante pode descartar
 * apagando o cookie).
 *
 * - 5 senhas erradas para o mesmo e-mail vindas do mesmo IP → bloqueio de 5 minutos;
 * - 20 senhas erradas vindas do mesmo IP (qualquer e-mail) → bloqueio de 5 minutos;
 * - as falhas contam dentro de uma janela de 15 minutos; login certo zera o contador do e-mail.
 *
 * Os contadores ficam em arquivos pequenos na pasta temporária do sistema (nomes com hash, sem
 * guardar e-mail ou IP em texto), com trava de arquivo para pedidos simultâneos.
 */
final class LoginThrottle
{
    private const WINDOW = 15 * 60;
    private const LOCK = 5 * 60;
    private const LIMITS = ['account' => 5, 'ip' => 20];

    /** Segundos restantes de bloqueio (0 = liberado). */
    public static function lockedFor(string $email, string $ip): int
    {
        $now = time();
        $remaining = 0;
        foreach (self::keys($email, $ip) as $key) {
            $state = self::read($key);
            $remaining = max($remaining, ($state['locked_until'] ?? 0) - $now);
        }
        return max(0, $remaining);
    }

    public static function fail(string $email, string $ip): void
    {
        foreach (self::keys($email, $ip) as $type => $key) {
            self::update($key, static function (array $state) use ($type): array {
                $now = time();
                if (($state['first'] ?? 0) < $now - self::WINDOW) {
                    $state = ['first' => $now, 'failures' => 0, 'locked_until' => 0];
                }
                $state['failures']++;
                if ($state['failures'] >= self::LIMITS[$type]) {
                    $state = ['first' => $now, 'failures' => 0, 'locked_until' => $now + self::LOCK];
                }
                return $state;
            });
        }
    }

    public static function clear(string $email, string $ip): void
    {
        @unlink(self::path(self::keys($email, $ip)['account']));
    }

    /** @return array{account: string, ip: string} */
    private static function keys(string $email, string $ip): array
    {
        return [
            'account' => hash('sha256', 'account|' . mb_strtolower($email) . '|' . $ip),
            'ip' => hash('sha256', 'ip|' . $ip),
        ];
    }

    private static function path(string $key): string
    {
        $folder = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'f1hub_login';
        if (!is_dir($folder)) {
            @mkdir($folder, 0700, true);
        }
        return $folder . DIRECTORY_SEPARATOR . $key . '.json';
    }

    private static function read(string $key): array
    {
        $content = @file_get_contents(self::path($key));
        $state = $content ? json_decode($content, true) : null;
        return is_array($state) ? $state : [];
    }

    private static function update(string $key, callable $change): void
    {
        $handle = @fopen(self::path($key), 'c+');
        if (!$handle) {
            return; // sem pasta temporária gravável: o login continua funcionando, só sem o limite
        }
        try {
            flock($handle, LOCK_EX);
            $state = json_decode((string) stream_get_contents($handle), true);
            $state = $change(is_array($state) ? $state : ['first' => 0, 'failures' => 0, 'locked_until' => 0]);
            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, (string) json_encode($state));
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
