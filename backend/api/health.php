<?php
/**
 * GET backend/api/health.php
 * Verifica se o PHP consegue conectar ao banco e conta os registros de cada tabela.
 * Usado para validar a instalação local (fase B1).
 * Responde somente a acessos do próprio computador, pois expõe detalhes do banco.
 */
require __DIR__ . '/../bootstrap.php';

Response::allowMethods(['GET']);

if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    Response::error('Disponível somente no computador de desenvolvimento.', 403);
}

$tables = ['users', 'teams', 'categories', 'products', 'product_sizes', 'plans', 'subscriptions', 'orders', 'order_items'];

try {
    $pdo = Database::connection();
    $counts = [];
    foreach ($tables as $table) {
        // Nomes de tabela vêm da lista fixa acima, nunca do usuário.
        $counts[$table] = (int) $pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
    }

    Response::json([
        'database' => $pdo->query('SELECT DATABASE()')->fetchColumn(),
        'server' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
        'tables' => $counts,
    ]);
} catch (Throwable $exception) {
    error_log('[F1Hub] health: ' . $exception->getMessage());
    Response::error('Não foi possível conectar ao banco de dados. Verifique se o MySQL está ativo e se backend/config/database.php existe.', 503);
}
