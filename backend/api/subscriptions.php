<?php
/**
 * API da assinatura F1Hub Box.
 *
 *   GET  subscriptions.php?action=plans      → planos ativos (público)
 *   GET  subscriptions.php?action=mine       → assinatura ativa do cliente (ou null) e a última cancelada
 *   POST subscriptions.php?action=subscribe  → assina ou altera { plan, team ("surpresa" = todas), shirtSize }
 *   POST subscriptions.php?action=cancel     → cancela a assinatura ativa
 *
 * POST exige login e o cabeçalho X-CSRF-Token. Pagamento simulado: nada é cobrado.
 */
require __DIR__ . '/../bootstrap.php';

$action = $_GET['action'] ?? '';

try {
    if ($action === 'plans') {
        Response::allowMethods(['GET']);
        Response::json(['plans' => SubscriptionService::plans()]);
    }

    if (!in_array($action, ['mine', 'subscribe', 'cancel'], true)) {
        Response::error('Ação desconhecida.', 404);
    }

    $user = AuthService::currentUser();

    if ($action === 'mine') {
        Response::allowMethods(['GET']);
        if (!$user) {
            Response::error('Entre na sua conta para ver sua assinatura.', 401);
        }
        Response::json(SubscriptionService::forUser((int) $user['id']));
    }

    Response::allowMethods(['POST']);
    if (!Csrf::isValid(Csrf::fromRequest())) {
        Response::error('Sua sessão expirou. Recarregue a página e tente novamente.', 403);
    }
    if (!$user) {
        Response::error('Entre na sua conta para assinar a F1Hub Box.', 401);
    }

    if ($action === 'subscribe') {
        $result = SubscriptionService::subscribe($user, Response::input());
        Response::json($result, $result['created'] ? 201 : 200);
    }

    Response::json(SubscriptionService::cancel($user));
} catch (ValidationException $exception) {
    Response::error($exception->getMessage(), 422, $exception->fields);
} catch (Throwable $exception) {
    error_log('[F1Hub] subscriptions: ' . $exception->getMessage());
    Response::error('Não foi possível concluir agora. Tente novamente em instantes.', 500);
}
