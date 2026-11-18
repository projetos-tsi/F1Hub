<?php
declare(strict_types=1);

/** Acesso à tabela `categories` (somente leitura nesta fase). */
final class Category
{
    public static function all(): array
    {
        return Database::connection()->query('SELECT id, name FROM categories ORDER BY name')->fetchAll();
    }

    /** Categorias com descrição e detalhes (um por linha), exibidos na página do produto. */
    public static function storefront(): array
    {
        return Database::connection()->query('SELECT name, description, details FROM categories ORDER BY id')->fetchAll();
    }

    public static function exists(int $id): bool
    {
        $statement = Database::connection()->prepare('SELECT 1 FROM categories WHERE id = ?');
        $statement->execute([$id]);
        return (bool) $statement->fetchColumn();
    }
}
