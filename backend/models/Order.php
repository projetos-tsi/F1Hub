<?php
declare(strict_types=1);

/**
 * Acesso à tabela `orders` (somente leitura nesta fase; a gravação de pedidos chega na B4).
 */
final class Order
{
    /** Situações do pedido, na ordem do fluxo (mesmas do ENUM do banco). */
    public const STATUSES = ['recebido' => 'Recebido', 'pago' => 'Pago', 'enviado' => 'Enviado', 'entregue' => 'Entregue', 'cancelado' => 'Cancelado'];

    /** Página da lista, do mais recente ao mais antigo; $status vazio = todos. */
    public static function search(string $status, int $limit, int $offset): array
    {
        [$where, $params] = self::filter($status);
        $statement = Database::connection()->prepare(
            "SELECT o.id, o.status, o.payment_method, o.subtotal_cents, o.discount_cents, o.total_cents,
                    o.city, o.state, o.created_at, u.name AS user_name, u.email AS user_email,
                    (SELECT COALESCE(SUM(i.quantity), 0) FROM order_items i WHERE i.order_id = o.id) AS item_count
             FROM orders o
             JOIN users u ON u.id = o.user_id
             {$where}
             ORDER BY o.created_at DESC, o.id DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $statement->execute($params);
        return $statement->fetchAll();
    }

    public static function count(string $status): int
    {
        [$where, $params] = self::filter($status);
        $statement = Database::connection()->prepare("SELECT COUNT(*) FROM orders o {$where}");
        $statement->execute($params);
        return (int) $statement->fetchColumn();
    }

    /** Totais para o painel: pedidos, receita (sem os cancelados) e quantidade por situação. */
    public static function totals(): array
    {
        $row = Database::connection()->query(
            "SELECT COUNT(*) AS total,
                    COALESCE(SUM(CASE WHEN status <> 'cancelado' THEN total_cents END), 0) AS revenue_cents,
                    COALESCE(SUM(status IN ('recebido', 'pago')), 0) AS pending
             FROM orders"
        )->fetch();
        return array_map('intval', $row);
    }

    private static function filter(string $status): array
    {
        return isset(self::STATUSES[$status]) ? ['WHERE o.status = ?', [$status]] : ['', []];
    }
}
