<?php
declare(strict_types=1);

/** Erro de validação com mensagens por campo (ex.: ['email' => 'Este e-mail já está cadastrado.']). */
final class ValidationException extends RuntimeException
{
    public function __construct(string $message, public readonly array $fields = [])
    {
        parent::__construct($message);
    }
}
