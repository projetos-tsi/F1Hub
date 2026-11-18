<?php
declare(strict_types=1);

/** Acesso à tabela `teams` (somente leitura nesta fase). */
final class Team
{
    public static function all(): array
    {
        return Database::connection()->query('SELECT id, slug, name, label, color FROM teams ORDER BY id')->fetchAll();
    }

    public static function exists(int $id): bool
    {
        $statement = Database::connection()->prepare('SELECT 1 FROM teams WHERE id = ?');
        $statement->execute([$id]);
        return (bool) $statement->fetchColumn();
    }
}
