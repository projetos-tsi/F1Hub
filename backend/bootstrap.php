<?php
/**
 * Ponto de partida de toda requisição ao backend.
 *
 * - Define fuso horário e tratamento de erros;
 * - Carrega automaticamente as classes de core/, models/ e services/.
 *
 * Os arquivos de backend/api/ e frontend/pages/admin/ começam com:
 *     require __DIR__ . '/../bootstrap.php';
 */

declare(strict_types=1);

date_default_timezone_set('America/Sao_Paulo');

// Erros técnicos vão para o log do PHP, nunca para a tela do usuário.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

spl_autoload_register(static function (string $class): void {
    foreach (['core', 'models', 'services'] as $folder) {
        $file = __DIR__ . "/{$folder}/{$class}.php";
        if (is_file($file)) {
            require $file;
            return;
        }
    }
});
