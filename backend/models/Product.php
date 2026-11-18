<?php
declare(strict_types=1);

/**
 * Acesso às tabelas `products` e `product_sizes`. Somente SQL — as regras ficam em ProductService.
 */
final class Product
{
    /** Ordem de exibição dos tamanhos (a mesma do ENUM do banco). */
    public const SIZES = ['P', 'M', 'G', 'GG', 'Único'];

    /**
     * Lista com filtros opcionais: q (nome, slug ou piloto), team (slug), category (id), status (ativos|inativos).
     * Inclui equipe, categoria, tamanhos e quantidade de itens vendidos.
     */
    public static function search(array $filters): array
    {
        $where = [];
        $params = [];

        if ($filters['q'] !== '') {
            $where[] = '(p.name LIKE ? OR p.slug LIKE ? OR p.pilot LIKE ?)';
            $like = '%' . addcslashes($filters['q'], '\\%_') . '%';
            array_push($params, $like, $like, $like);
        }
        if ($filters['team'] !== '') {
            $where[] = 't.slug = ?';
            $params[] = $filters['team'];
        }
        if ($filters['category'] > 0) {
            $where[] = 'p.category_id = ?';
            $params[] = $filters['category'];
        }
        if ($filters['status'] === 'ativos') {
            $where[] = 'p.active = 1';
        } elseif ($filters['status'] === 'inativos') {
            $where[] = 'p.active = 0';
        }

        $sql = 'SELECT p.id, p.slug, p.name, p.pilot, p.image, p.price_cents, p.old_price_cents, p.active,
                       t.slug AS team_slug, t.name AS team_name, c.name AS category_name,
                       (SELECT GROUP_CONCAT(s.size ORDER BY s.size SEPARATOR \' · \') FROM product_sizes s WHERE s.product_id = p.id) AS sizes,
                       (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) AS order_count
                FROM products p
                JOIN teams t ON t.id = p.team_id
                JOIN categories c ON c.id = p.category_id'
            . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
            . ' ORDER BY t.id, c.name, p.name';

        $statement = Database::connection()->prepare($sql);
        $statement->execute($params);
        return $statement->fetchAll();
    }

    /**
     * Produtos ATIVOS para a loja (catálogo, busca, páginas de equipe e produto, carrinho), na ordem de cadastro.
     * Tamanhos vêm na ordem do ENUM (P, M, G, GG, Único).
     */
    public static function storefront(): array
    {
        return Database::connection()->query(
            "SELECT p.slug, p.name, p.pilot, p.image, p.price_cents, p.old_price_cents,
                    t.slug AS team_slug, c.name AS category_name,
                    (SELECT GROUP_CONCAT(s.size ORDER BY s.size SEPARATOR ',') FROM product_sizes s WHERE s.product_id = p.id) AS sizes
             FROM products p
             JOIN teams t ON t.id = p.team_id
             JOIN categories c ON c.id = p.category_id
             WHERE p.active = 1 AND EXISTS (SELECT 1 FROM product_sizes s WHERE s.product_id = p.id)
             ORDER BY p.id"
        )->fetchAll();
    }

    /**
     * Produtos ativos pelos slugs informados (usado ao fechar o pedido), indexados pelo slug.
     * Com $lock = true, as linhas ficam travadas até o fim da transação (o admin não altera o preço no meio do pedido).
     */
    public static function activeBySlugs(array $slugs, bool $lock = false): array
    {
        if (!$slugs) {
            return [];
        }
        $marks = implode(', ', array_fill(0, count($slugs), '?'));
        $statement = Database::connection()->prepare(
            "SELECT p.id, p.slug, p.name, p.price_cents,
                    (SELECT GROUP_CONCAT(s.size ORDER BY s.size SEPARATOR ',') FROM product_sizes s WHERE s.product_id = p.id) AS sizes
             FROM products p
             WHERE p.active = 1 AND p.slug IN ({$marks})"
            . ($lock ? ' FOR UPDATE' : '')
        );
        $statement->execute(array_values($slugs));
        $products = [];
        foreach ($statement->fetchAll() as $row) {
            $row['sizes'] = $row['sizes'] === null ? [] : explode(',', $row['sizes']);
            $products[$row['slug']] = $row;
        }
        return $products;
    }

    public static function find(int $id): ?array
    {
        $statement = Database::connection()->prepare(
            'SELECT id, slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents, active, created_at, updated_at
             FROM products WHERE id = ?'
        );
        $statement->execute([$id]);
        $product = $statement->fetch();
        if (!$product) {
            return null;
        }
        $product['sizes'] = self::sizes($id);
        return $product;
    }

    /** @return string[] */
    public static function sizes(int $id): array
    {
        $statement = Database::connection()->prepare('SELECT size FROM product_sizes WHERE product_id = ? ORDER BY size');
        $statement->execute([$id]);
        return $statement->fetchAll(PDO::FETCH_COLUMN);
    }

    /** Verifica se outro produto (diferente de $exceptId) já usa o valor na coluna informada. */
    public static function isTaken(string $column, string $value, int $exceptId = 0): bool
    {
        // Coluna vem de uma lista fixa, nunca do usuário.
        if (!in_array($column, ['slug', 'name'], true)) {
            throw new InvalidArgumentException('Coluna inválida.');
        }
        $statement = Database::connection()->prepare("SELECT 1 FROM products WHERE {$column} = ? AND id <> ?");
        $statement->execute([$value, $exceptId]);
        return (bool) $statement->fetchColumn();
    }

    /** Cria o produto com seus tamanhos (em uma transação) e devolve o id. */
    public static function create(array $data, array $sizes): int
    {
        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $statement = $pdo->prepare(
                'INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents, active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $statement->execute(self::row($data));
            $id = (int) $pdo->lastInsertId();
            self::replaceSizes($id, $sizes);
            $pdo->commit();
            return $id;
        } catch (Throwable $exception) {
            $pdo->rollBack();
            throw $exception;
        }
    }

    /** Atualiza o produto e substitui os tamanhos (em uma transação). */
    public static function update(int $id, array $data, array $sizes): void
    {
        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $statement = $pdo->prepare(
                'UPDATE products SET slug = ?, team_id = ?, category_id = ?, pilot = ?, name = ?, image = ?,
                        price_cents = ?, old_price_cents = ?, active = ?
                 WHERE id = ?'
            );
            $statement->execute([...self::row($data), $id]);
            self::replaceSizes($id, $sizes);
            $pdo->commit();
        } catch (Throwable $exception) {
            $pdo->rollBack();
            throw $exception;
        }
    }

    public static function setActive(int $id, bool $active): void
    {
        $statement = Database::connection()->prepare('UPDATE products SET active = ? WHERE id = ?');
        $statement->execute([$active ? 1 : 0, $id]);
    }

    /** Quantidade de itens de pedido ligados ao produto. */
    public static function orderCount(int $id): int
    {
        $statement = Database::connection()->prepare('SELECT COUNT(*) FROM order_items WHERE product_id = ?');
        $statement->execute([$id]);
        return (int) $statement->fetchColumn();
    }

    /** Apaga o produto (os tamanhos saem junto, por CASCADE). */
    public static function delete(int $id): void
    {
        $statement = Database::connection()->prepare('DELETE FROM products WHERE id = ?');
        $statement->execute([$id]);
    }

    /** Totais para o painel: cadastrados e ativos. */
    public static function totals(): array
    {
        return Database::connection()
            ->query('SELECT COUNT(*) AS total, COALESCE(SUM(active), 0) AS active FROM products')
            ->fetch();
    }

    private static function replaceSizes(int $id, array $sizes): void
    {
        $pdo = Database::connection();
        $pdo->prepare('DELETE FROM product_sizes WHERE product_id = ?')->execute([$id]);
        $insert = $pdo->prepare('INSERT INTO product_sizes (product_id, size) VALUES (?, ?)');
        foreach ($sizes as $size) {
            $insert->execute([$id, $size]);
        }
    }

    private static function row(array $data): array
    {
        return [
            $data['slug'], $data['team_id'], $data['category_id'], $data['pilot'], $data['name'], $data['image'],
            $data['price_cents'], $data['old_price_cents'], $data['active'] ? 1 : 0,
        ];
    }
}
