<?php
declare(strict_types=1);

/**
 * Acesso à tabela `users`. Somente SQL — as regras ficam em AuthService.
 */
final class User
{
    /** Campos seguros para devolver ao front-end (nunca inclui password_hash). */
    private const PUBLIC_FIELDS = 'id, name, email, role, created_at';

    public static function findByEmail(string $email): ?array
    {
        $statement = Database::connection()->prepare('SELECT id, name, email, role, password_hash, created_at FROM users WHERE email = ?');
        $statement->execute([$email]);
        return $statement->fetch() ?: null;
    }

    public static function findById(int $id): ?array
    {
        $statement = Database::connection()->prepare('SELECT ' . self::PUBLIC_FIELDS . ' FROM users WHERE id = ?');
        $statement->execute([$id]);
        return $statement->fetch() ?: null;
    }

    public static function emailExists(string $email): bool
    {
        $statement = Database::connection()->prepare('SELECT 1 FROM users WHERE email = ?');
        $statement->execute([$email]);
        return (bool) $statement->fetchColumn();
    }

    /** Cria um cliente (role = user) e devolve o id. */
    public static function create(string $name, string $email, string $passwordHash): int
    {
        $statement = Database::connection()->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, \'user\')');
        $statement->execute([$name, $email, $passwordHash]);
        return (int) Database::connection()->lastInsertId();
    }

    public static function updatePasswordHash(int $id, string $passwordHash): void
    {
        $statement = Database::connection()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $statement->execute([$passwordHash, $id]);
    }
}
