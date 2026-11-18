<?php
/**
 * Configuração de banco para ambiente local com XAMPP.
 *
 * 1. Copie este arquivo para: backend/config/database.php
 * 2. Ajuste os valores se o seu MySQL usar outro usuário ou senha.
 * 3. NÃO versione database.php (ele já está no .gitignore).
 */

return [
    'host' => '127.0.0.1',
    'port' => '3306',
    'database' => 'f1hub',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4',
];
