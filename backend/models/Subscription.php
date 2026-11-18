<?php
declare(strict_types=1);

/**
 * Acesso à tabela `subscriptions` (assinaturas da F1Hub Box). Somente SQL — as regras ficam em SubscriptionService.
 */
final class Subscription
{
    public const STATUSES = ['ativa' => 'Ativa', 'cancelada' => 'Cancelada'];

    private const SELECT_FULL = 'SELECT s.id, s.status, s.shirt_size, s.started_at, s.cancelled_at, s.updated_at,
                                        p.slug AS plan_slug, p.name AS plan_name, p.price_cents, p.items, p.includes_shirt, p.active AS plan_active,
                                        t.slug AS team_slug, t.name AS team_name, t.color AS team_color
                                 FROM subscriptions s
                                 JOIN plans p ON p.id = s.plan_id
                                 LEFT JOIN teams t ON t.id = s.team_id';

    /** Assinatura ativa do cliente (ou null). Com $lock = true, trava a linha até o fim da transação. */
    public static function activeForUser(int $userId, bool $lock = false): ?array
    {
        $statement = Database::connection()->prepare(
            self::SELECT_FULL . " WHERE s.user_id = ? AND s.status = 'ativa' ORDER BY s.id DESC LIMIT 1" . ($lock ? ' FOR UPDATE' : '')
        );
        $statement->execute([$userId]);
        return $statement->fetch() ?: null;
    }

    /** Última assinatura cancelada do cliente (para "Minha conta" mostrar o histórico). */
    public static function lastCancelledForUser(int $userId): ?array
    {
        $statement = Database::connection()->prepare(
            self::SELECT_FULL . " WHERE s.user_id = ? AND s.status = 'cancelada' ORDER BY s.cancelled_at DESC, s.id DESC LIMIT 1"
        );
        $statement->execute([$userId]);
        return $statement->fetch() ?: null;
    }

    public static function create(int $userId, int $planId, ?int $teamId, ?string $shirtSize): int
    {
        $pdo = Database::connection();
        $pdo->prepare("INSERT INTO subscriptions (user_id, plan_id, team_id, shirt_size, status) VALUES (?, ?, ?, ?, 'ativa')")
            ->execute([$userId, $planId, $teamId, $shirtSize]);
        return (int) $pdo->lastInsertId();
    }

    public static function change(int $id, int $planId, ?int $teamId, ?string $shirtSize): void
    {
        Database::connection()->prepare('UPDATE subscriptions SET plan_id = ?, team_id = ?, shirt_size = ? WHERE id = ?')
            ->execute([$planId, $teamId, $shirtSize, $id]);
    }

    public static function cancel(int $id): void
    {
        Database::connection()->prepare("UPDATE subscriptions SET status = 'cancelada', cancelled_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'ativa'")
            ->execute([$id]);
    }

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
