<?php
declare(strict_types=1);

/**
 * Acesso às tabelas `orders` e `order_items`. Somente SQL — as regras ficam em OrderService.
 */
final class Order
{
    /** Situações do pedido, na ordem do fluxo (mesmas do ENUM do banco). */
    public const STATUSES = ['recebido' => 'Recebido', 'pago' => 'Pago', 'enviado' => 'Enviado', 'entregue' => 'Entregue', 'cancelado' => 'Cancelado'];

    /**
     * Grava o pedido e seus itens. Deve ser chamado DENTRO de uma transação aberta pelo serviço
     * (que também travou as linhas dos produtos). Devolve o número do pedido.
     *
     * @param array $order  user_id, subtotal_cents, discount_cents, total_cents, postal_code, state, city, address, address_number
     * @param array $items  [product_id, product_name, unit_price_cents, size, quantity]
     */
    public static function insert(array $order, array $items): int
    {
        $pdo = Database::connection();
        $statement = $pdo->prepare(
            "INSERT INTO orders (user_id, status, payment_method, subtotal_cents, discount_cents, total_cents,
                                 postal_code, state, city, address, address_number)
             VALUES (?, 'recebido', 'pix', ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $statement->execute([
            $order['user_id'], $order['subtotal_cents'], $order['discount_cents'], $order['total_cents'],
            $order['postal_code'], $order['state'], $order['city'], $order['address'], $order['address_number'],
        ]);
        $id = (int) $pdo->lastInsertId();

        $insertItem = $pdo->prepare(
            'INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, size, quantity) VALUES (?, ?, ?, ?, ?, ?)'
        );
        foreach ($items as $item) {
            $insertItem->execute([$id, $item['product_id'], $item['product_name'], $item['unit_price_cents'], $item['size'], $item['quantity']]);
        }
        return $id;
    }

    /** Pedido com cliente (ou null). Com $lock = true, trava a linha até o fim da transação. */
    public static function find(int $id, bool $lock = false): ?array
    {
        $statement = Database::connection()->prepare(
            'SELECT o.*, u.name AS user_name, u.email AS user_email
             FROM orders o JOIN users u ON u.id = o.user_id
             WHERE o.id = ?' . ($lock ? ' FOR UPDATE' : '')
        );
        $statement->execute([$id]);
        $order = $statement->fetch();
        return $order ?: null;
    }

    /** Itens de um ou mais pedidos, com a imagem e o slug atuais do produto, agrupados por pedido. */
    public static function itemsFor(array $orderIds): array
    {
        if (!$orderIds) {
            return [];
        }
        $marks = implode(', ', array_fill(0, count($orderIds), '?'));
        $statement = Database::connection()->prepare(
            "SELECT i.order_id, i.product_id, i.product_name, i.unit_price_cents, i.size, i.quantity,
                    p.slug AS product_slug, p.image AS product_image, p.active AS product_active, t.slug AS team_slug
             FROM order_items i
             JOIN products p ON p.id = i.product_id
             JOIN teams t ON t.id = p.team_id
             WHERE i.order_id IN ({$marks})
             ORDER BY i.id"
        );
        $statement->execute(array_values($orderIds));
        $grouped = [];
        foreach ($statement->fetchAll() as $item) {
            $grouped[(int) $item['order_id']][] = $item;
        }
        return $grouped;
    }

    /** Pedidos de um cliente, do mais recente ao mais antigo (limitado para não pesar a página). */
    public static function forUser(int $userId, int $limit = 50): array
    {
        $statement = Database::connection()->prepare(
            "SELECT id, status, payment_method, subtotal_cents, discount_cents, total_cents,
                    postal_code, state, city, address, address_number, created_at, updated_at
             FROM orders WHERE user_id = ?
             ORDER BY created_at DESC, id DESC
             LIMIT {$limit}"
        );
        $statement->execute([$userId]);
        return $statement->fetchAll();
    }

    public static function updateStatus(int $id, string $status): void
    {
        $statement = Database::connection()->prepare('UPDATE orders SET status = ? WHERE id = ?');
        $statement->execute([$status, $id]);
    }

    /**
     * Página da lista, do mais recente ao mais antigo; $status vazio = todos.
     * $q: número do pedido ("12" ou "#12") ou parte do nome/e-mail do cliente.
     */
    public static function search(string $status, int $limit, int $offset, string $q = ''): array
    {
        [$where, $params] = self::filter($status, $q);
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

    public static function count(string $status, string $q = ''): int
    {
        [$where, $params] = self::filter($status, $q);
        $statement = Database::connection()->prepare("SELECT COUNT(*) FROM orders o JOIN users u ON u.id = o.user_id {$where}");
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

    private static function filter(string $status, string $q = ''): array
    {
        $where = [];
        $params = [];
        if (isset(self::STATUSES[$status])) {
            $where[] = 'o.status = ?';
            $params[] = $status;
        }
        if (preg_match('/^#?(\d{1,10})$/', $q, $match)) {
            $where[] = 'o.id = ?';
            $params[] = (int) $match[1];
        } elseif ($q !== '') {
            // % e _ digitados viram texto comum (não curingas).
            $like = '%' . addcslashes($q, '\\%_') . '%';
            $where[] = '(u.name LIKE ? OR u.email LIKE ?)';
            array_push($params, $like, $like);
        }
        return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
    }
}
