<?php
declare(strict_types=1);

/** Acesso à tabela `teams` (somente leitura nesta fase). */
final class Team
{
    public static function all(): array
    {
        return Database::connection()->query('SELECT id, slug, name, label, color FROM teams ORDER BY id')->fetchAll();
    }

    /** Id da equipe pelo slug (ou null se não existir). */
    public static function idBySlug(string $slug): ?int
    {
        $statement = Database::connection()->prepare('SELECT id FROM teams WHERE slug = ?');
        $statement->execute([$slug]);
        $id = $statement->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    public static function exists(int $id): bool
    {
        $statement = Database::connection()->prepare('SELECT 1 FROM teams WHERE id = ?');
        $statement->execute([$id]);
        return (bool) $statement->fetchColumn();
    }
}
