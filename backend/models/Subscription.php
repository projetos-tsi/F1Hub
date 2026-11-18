<?php
declare(strict_types=1);

/**
 * Acesso à tabela `subscriptions` (somente leitura nesta fase; a contratação chega na B5).
 */
final class Subscription
{
    public const STATUSES = ['ativa' => 'Ativa', 'cancelada' => 'Cancelada'];

    /** Página da lista, da mais recente à mais antiga; $status vazio = todas. */
    public static function search(string $status, int $limit, int $offset): array
    {
        [$where, $params] = self::filter($status);
        $statement = Database::connection()->prepare(
            "SELECT s.id, s.status, s.shirt_size, s.started_at, s.cancelled_at,
                    u.name AS user_name, u.email AS user_email,
                    p.name AS plan_name, p.price_cents,
                    t.slug AS team_slug, t.name AS team_name
             FROM subscriptions s
             JOIN users u ON u.id = s.user_id
             JOIN plans p ON p.id = s.plan_id
             LEFT JOIN teams t ON t.id = s.team_id
             {$where}
             ORDER BY s.started_at DESC, s.id DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $statement->execute($params);
        return $statement->fetchAll();
    }

    public static function count(string $status): int
    {
        [$where, $params] = self::filter($status);
        $statement = Database::connection()->prepare("SELECT COUNT(*) FROM subscriptions s {$where}");
        $statement->execute($params);
        return (int) $statement->fetchColumn();
    }

    /** Totais para o painel: ativas, canceladas e receita mensal das ativas. */
    public static function totals(): array
    {
        $row = Database::connection()->query(
            "SELECT COALESCE(SUM(s.status = 'ativa'), 0) AS active,
                    COALESCE(SUM(s.status = 'cancelada'), 0) AS cancelled,
                    COALESCE(SUM(CASE WHEN s.status = 'ativa' THEN p.price_cents END), 0) AS monthly_cents
             FROM subscriptions s
             JOIN plans p ON p.id = s.plan_id"
        )->fetch();
        return array_map('intval', $row);
    }

    private static function filter(string $status): array
    {
        return isset(self::STATUSES[$status]) ? ['WHERE s.status = ?', [$status]] : ['', []];
    }
}
