<?php
/**
 * API de autenticação do F1 Hub.
 *
 *   GET  auth.php?action=me        → usuário logado (ou null) + token CSRF
 *   POST auth.php?action=register  → cria a conta e já entra
 *   POST auth.php?action=login     → entra (campos: email, password, remember)
 *   POST auth.php?action=logout    → sai
 *
 * Requisições POST exigem o cabeçalho X-CSRF-Token (recebido em "me").
 */
require __DIR__ . '/../bootstrap.php';

$action = $_GET['action'] ?? '';

try {
    if ($action === 'me') {
        Response::allowMethods(['GET']);
        $user = AuthService::currentUser();
        Response::json([
            'user' => $user ? AuthService::publicView($user) : null,
            'csrfToken' => Csrf::token(),
        ]);
    }

    Response::allowMethods(['POST']);
    if (!Csrf::isValid(Csrf::fromRequest())) {
        Response::error('Sua sessão expirou. Recarregue a página e tente novamente.', 403);
    }
    $input = Response::input();

    switch ($action) {
        case 'register':
            $user = AuthService::register($input);
            Session::login($user);
            Response::json(['user' => AuthService::publicView($user), 'csrfToken' => Csrf::token()], 201);

        case 'login':
            $user = AuthService::login(Response::text($input, 'email'), Response::text($input, 'password'));
            Session::login($user, ($input['remember'] ?? false) === true);
            Response::json(['user' => AuthService::publicView($user), 'csrfToken' => Csrf::token()]);

        case 'logout':
            Session::logout();
            Response::json(['user' => null]);

        default:
            Response::error('Ação desconhecida.', 404);
    }
} catch (ValidationException $exception) {
    Response::error($exception->getMessage(), 422, $exception->fields);
} catch (AuthException $exception) {
    Response::error($exception->getMessage(), $exception->status);
} catch (Throwable $exception) {
    error_log('[F1Hub] auth: ' . $exception->getMessage());
    Response::error('Não foi possível concluir agora. Tente novamente em instantes.', 500);
}
