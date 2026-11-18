<?php
/**
 * API de pedidos da loja (exige login).
 *
 *   GET  orders.php?action=mine    → pedidos do cliente logado, com itens
 *   POST orders.php?action=create  → fecha o pedido (PIX simulado)
 *        corpo: { items: [{productId, size, quantity}], address: {postalCode, state, city, address, number},
 *                 expectedTotal: centavos exibidos na tela, checkoutKey: identificador da finalização }
 *
 * Respostas: 401 sem login · 403 token CSRF inválido · 422 dados inválidos · 409 algo mudou (preço, produto).
 * O total é sempre recalculado no servidor (OrderService).
 */
require __DIR__ . '/../bootstrap.php';

$action = $_GET['action'] ?? '';

try {
    $user = AuthService::currentUser();

    if ($action === 'mine') {
        Response::allowMethods(['GET']);
        if (!$user) {
            Response::error('Entre na sua conta para ver seus pedidos.', 401);
        }
        Response::json(['orders' => OrderService::forUser((int) $user['id'])]);
    }

    if ($action === 'create') {
        Response::allowMethods(['POST']);
        if (!Csrf::isValid(Csrf::fromRequest())) {
            Response::error('Sua sessão expirou. Recarregue a página e tente novamente.', 403);
        }
        if (!$user) {
            Response::error('Entre na sua conta para finalizar o pedido.', 401);
        }
        $order = OrderService::checkout($user, Response::input());
        Response::json(['order' => $order], $order['repeated'] ? 200 : 201);
    }

    Response::error('Ação desconhecida.', 404);
} catch (ValidationException $exception) {
    Response::error($exception->getMessage(), 422, $exception->fields);
} catch (ConflictException $exception) {
    Response::error($exception->getMessage(), 409);
} catch (Throwable $exception) {
    error_log('[F1Hub] orders: ' . $exception->getMessage());
    Response::error('Não foi possível concluir agora. Tente novamente em instantes.', 500);
}
