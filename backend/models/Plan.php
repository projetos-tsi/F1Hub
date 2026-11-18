<?php
declare(strict_types=1);

/**
 * Acesso à tabela `plans` (planos da F1Hub Box). Somente SQL — as regras ficam em PlanService.
 */
final class Plan
{
    /** Todos os planos, do mais barato ao mais caro, com a quantidade de assinaturas (total e ativas). */
    public static function all(): array
    {
        return Database::connection()->query(
            'SELECT p.id, p.slug, p.name, p.tagline, p.price_cents, p.items, p.includes_shirt, p.highlight, p.active,
                    COUNT(s.id) AS subscription_count,
                    COALESCE(SUM(s.status = \'ativa\'), 0) AS active_subscriptions
             FROM plans p
             LEFT JOIN subscriptions s ON s.plan_id = p.id
             GROUP BY p.id
             ORDER BY p.price_cents, p.name'
        )->fetchAll();
    }

    /** Planos ATIVOS para a página da assinatura, do mais barato ao mais caro. */
    public static function storefront(): array
    {
        return Database::connection()->query(
            'SELECT slug, name, tagline, price_cents, items, includes_shirt, highlight
             FROM plans WHERE active = 1
             ORDER BY price_cents, name'
        )->fetchAll();
    }

    /** Plano ativo pelo slug (ou null). */
    public static function activeBySlug(string $slug): ?array
    {
        $statement = Database::connection()->prepare(
            'SELECT id, slug, name, price_cents, includes_shirt FROM plans WHERE slug = ? AND active = 1'
        );
        $statement->execute([$slug]);
        return $statement->fetch() ?: null;
    }

    public static function find(int $id): ?array
    {
        $statement = Database::connection()->prepare(
            'SELECT id, slug, name, tagline, price_cents, items, includes_shirt, highlight, active FROM plans WHERE id = ?'
        );
        $statement->execute([$id]);
        return $statement->fetch() ?: null;
    }

    /** Verifica se outro plano (diferente de $exceptId) já usa o valor na coluna informada. */
    public static function isTaken(string $column, string $value, int $exceptId = 0): bool
    {
        // Coluna vem de uma lista fixa, nunca do usuário.
        if (!in_array($column, ['slug', 'name'], true)) {
            throw new InvalidArgumentException('Coluna inválida.');
        }
        $statement = Database::connection()->prepare("SELECT 1 FROM plans WHERE {$column} = ? AND id <> ?");
        $statement->execute([$value, $exceptId]);
        return (bool) $statement->fetchColumn();
    }

    /** Cria o plano e devolve o id. Se for o destaque, os outros deixam de ser (em uma transação). */
    public static function create(array $data): int
    {
        return self::inTransaction(static function (PDO $pdo) use ($data): int {
            $pdo->prepare(
                'INSERT INTO plans (slug, name, tagline, price_cents, items, includes_shirt, highlight, active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute(self::row($data));
            $id = (int) $pdo->lastInsertId();
            self::keepSingleHighlight($id, $data['highlight']);
            return $id;
        });
    }

    /** Atualiza o plano. Se for o destaque, os outros deixam de ser (em uma transação). */
    public static function update(int $id, array $data): void
    {
        self::inTransaction(static function (PDO $pdo) use ($id, $data): void {
            $pdo->prepare(
                'UPDATE plans SET slug = ?, name = ?, tagline = ?, price_cents = ?, items = ?, includes_shirt = ?, highlight = ?, active = ?
                 WHERE id = ?'
            )->execute([...self::row($data), $id]);
            self::keepSingleHighlight($id, $data['highlight']);
        });
    }

    public static function setActive(int $id, bool $active): void
    {
        $statement = Database::connection()->prepare('UPDATE plans SET active = ? WHERE id = ?');
        $statement->execute([$active ? 1 : 0, $id]);
    }

    /** Quantidade de assinaturas (ativas ou canceladas) ligadas ao plano. */
    public static function subscriptionCount(int $id): int
    {
        $statement = Database::connection()->prepare('SELECT COUNT(*) FROM subscriptions WHERE plan_id = ?');
        $statement->execute([$id]);
        return (int) $statement->fetchColumn();
    }

    public static function delete(int $id): void
    {
        $statement = Database::connection()->prepare('DELETE FROM plans WHERE id = ?');
        $statement->execute([$id]);
    }

    /** Totais para o painel: cadastrados e ativos. */
    public static function totals(): array
    {
        return Database::connection()
            ->query('SELECT COUNT(*) AS total, COALESCE(SUM(active), 0) AS active FROM plans')
            ->fetch();
    }

    /** Só um plano aparece como "Mais escolhido" na página da assinatura. */
    private static function keepSingleHighlight(int $id, bool $highlight): void
    {
        if ($highlight) {
            Database::connection()->prepare('UPDATE plans SET highlight = 0 WHERE id <> ? AND highlight = 1')->execute([$id]);
        }
    }

    private static function inTransaction(callable $work): mixed
    {
        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $result = $work($pdo);
            $pdo->commit();
            return $result;
        } catch (Throwable $exception) {
            $pdo->rollBack();
            throw $exception;
        }
    }

    private static function row(array $data): array
    {
        return [
            $data['slug'], $data['name'], $data['tagline'], $data['price_cents'], implode("\n", $data['items']),
            $data['includes_shirt'] ? 1 : 0, $data['highlight'] ? 1 : 0, $data['active'] ? 1 : 0,
        ];
    }
}
