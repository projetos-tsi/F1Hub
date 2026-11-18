<?php
declare(strict_types=1);

/** Falha de autenticação ou de permissão, com o status HTTP correspondente (401, 403, 429). */
final class AuthException extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 401)
    {
        parent::__construct($message);
    }
}
