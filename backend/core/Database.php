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

        $configFile = __DIR__ . '/../config/database.php';
        if (!is_file($configFile)) {
            throw new RuntimeException('Arquivo backend/config/database.php não encontrado. Copie database.example.php.');
        }

        $config = require $configFile;
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
}
