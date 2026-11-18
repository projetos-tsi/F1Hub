<?php
declare(strict_types=1);

/**
 * Conexão única (PDO) com o MySQL.
 *
 * Uso: $pdo = Database::connection();
 * As configurações vêm de backend/config/database.php (fora do Git).
 */
final class Database
{
    public const STRICT_SQL_MODE = 'STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

    private static ?PDO $connection = null;

    public static function connection(): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        $config = self::config();
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $config['host'],
            $config['port'],
            $config['database'],
            $config['charset']
        );

        $pdo = new PDO($dsn, $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        // Modo estrito: o banco RECUSA valores inválidos em vez de "consertá-los" em silêncio
        // (o MySQL do XAMPP vem sem ele). Fuso de Brasília fixo, independente do computador.
        $pdo->exec("SET SESSION sql_mode = '" . self::STRICT_SQL_MODE . "', time_zone = '-03:00'");

        return self::$connection = $pdo;
    }

    /**
     * Configuração da conexão:
     * 1. backend/config/database.php (XAMPP; criado pelo instalador ou copiado do exemplo);
     * 2. senão, variáveis de ambiente F1HUB_DB_HOST, F1HUB_DB_PORT, F1HUB_DB_NAME, F1HUB_DB_USER e
     *    F1HUB_DB_PASSWORD (hospedagens que configuram o banco pelo painel, sem arquivo).
     */
    private static function config(): array
    {
        $configFile = __DIR__ . '/../config/database.php';
        if (is_file($configFile)) {
            return require $configFile;
        }
        $host = getenv('F1HUB_DB_HOST');
        if ($host === false || $host === '') {
            throw new RuntimeException('Configuração do banco não encontrada: crie backend/config/database.php (instalar.php) ou defina as variáveis F1HUB_DB_*.');
        }
        return [
            'host' => $host,
            'port' => getenv('F1HUB_DB_PORT') ?: '3306',
            'database' => getenv('F1HUB_DB_NAME') ?: 'f1hub',
            'username' => getenv('F1HUB_DB_USER') ?: 'root',
            'password' => getenv('F1HUB_DB_PASSWORD') ?: '',
            'charset' => 'utf8mb4',
        ];
    }
}
