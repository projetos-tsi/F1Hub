<?php
declare(strict_types=1);

/**
 * Respostas JSON padronizadas para a API.
 *
 * Sucesso: { "ok": true,  "data": ... }
 * Erro:    { "ok": false, "error": "mensagem para o usuário" }
 */
final class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $status = 400, array $fields = []): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        $body = ['ok' => false, 'error' => $message];
        if ($fields) {
            $body['fields'] = $fields;
        }
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /** Aceita somente os métodos HTTP informados (ex.: ['GET'] ou ['POST']). */
    public static function allowMethods(array $methods): void
    {
        if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', $methods, true)) {
            header('Allow: ' . implode(', ', $methods));
            self::error('Método não permitido.', 405);
        }
    }

    /**
     * Lê um campo de texto do corpo da requisição.
     * Qualquer outro tipo (lista, objeto, número, booleano) é tratado como vazio.
     */
    public static function text(array $input, string $key): string
    {
        $value = $input[$key] ?? '';
        return is_string($value) ? $value : '';
    }

    /** Lê o corpo JSON enviado pelo front-end (fetch). */
    public static function input(): array
    {
        $data = json_decode((string) file_get_contents('php://input'), true);
        return is_array($data) ? $data : [];
    }
}
