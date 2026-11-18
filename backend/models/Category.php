<?php
declare(strict_types=1);

/** Acesso à tabela `categories` (somente leitura nesta fase). */
final class Category
{
    public static function all(): array
    {
        return Database::connection()->query('SELECT id, name FROM categories ORDER BY name')->fetchAll();
    }

    public static function exists(int $id): bool
    {
        $statement = Database::connection()->prepare('SELECT 1 FROM categories WHERE id = ?');
        $statement->execute([$id]);
        return (bool) $statement->fetchColumn();
    }
}
