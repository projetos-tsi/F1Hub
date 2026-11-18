<?php
declare(strict_types=1);

/**
 * Acesso à tabela `users`. Somente SQL — as regras ficam em AuthService.
 */
final class User
{
    /** Campos seguros para devolver ao front-end (nunca inclui password_hash). */
    private const PUBLIC_FIELDS = 'id, name, email, role, created_at';

    public static function findByEmail(string $email): ?array
    {
        $statement = Database::connection()->prepare('SELECT id, name, email, role, password_hash, created_at FROM users WHERE email = ?');
        $statement->execute([$email]);
        return $statement->fetch() ?: null;
    }

    public static function findById(int $id): ?array
    {
        $statement = Database::connection()->prepare('SELECT ' . self::PUBLIC_FIELDS . ' FROM users WHERE id = ?');
        $statement->execute([$id]);
        return $statement->fetch() ?: null;
    }

    public static function emailExists(string $email): bool
    {
        $statement = Database::connection()->prepare('SELECT 1 FROM users WHERE email = ?');
        $statement->execute([$email]);
        return (bool) $statement->fetchColumn();
    }

    /** Cria um cliente (role = user) e devolve o id. */
    public static function create(string $name, string $email, string $passwordHash): int
    {
        $statement = Database::connection()->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, \'user\')');
        $statement->execute([$name, $email, $passwordHash]);
        return (int) Database::connection()->lastInsertId();
    }

    public static function updatePasswordHash(int $id, string $passwordHash): void
    {
        $statement = Database::connection()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $statement->execute([$passwordHash, $id]);
    }

    /**
     * Lista da área administrativa (somente leitura), do cadastro mais recente ao mais antigo.
     * Filtros: q (nome ou e-mail) e role (user|admin). Inclui pedidos e plano da assinatura ativa.
     */
    public static function search(string $q, string $role, int $limit, int $offset): array
    {
        [$where, $params] = self::filter($q, $role);
        $statement = Database::connection()->prepare(
            "SELECT u.id, u.name, u.email, u.role, u.created_at,
                    (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
                    (SELECT p.name FROM subscriptions s JOIN plans p ON p.id = s.plan_id
                     WHERE s.user_id = u.id AND s.status = 'ativa' ORDER BY s.started_at DESC LIMIT 1) AS active_plan
             FROM users u
             {$where}
             ORDER BY u.created_at DESC, u.id DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $statement->execute($params);
        return $statement->fetchAll();
    }

    public static function count(string $q, string $role): int
    {
        [$where, $params] = self::filter($q, $role);
        $statement = Database::connection()->prepare("SELECT COUNT(*) FROM users u {$where}");
        $statement->execute($params);
        return (int) $statement->fetchColumn();
    }

    /** Totais para o painel: clientes e administradores. */
    public static function totals(): array
    {
        $row = Database::connection()->query(
            "SELECT COALESCE(SUM(role = 'user'), 0) AS clients, COALESCE(SUM(role = 'admin'), 0) AS admins FROM users"
        )->fetch();
        return array_map('intval', $row);
    }

    private static function filter(string $q, string $role): array
    {
        $where = [];
        $params = [];
        if ($q !== '') {
            $where[] = '(u.name LIKE ? OR u.email LIKE ?)';
            $like = '%' . addcslashes($q, '\\%_') . '%';
            array_push($params, $like, $like);
        }
        if (in_array($role, ['user', 'admin'], true)) {
            $where[] = 'u.role = ?';
            $params[] = $role;
        }
        return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
    }
}
