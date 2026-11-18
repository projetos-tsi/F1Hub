<?php
/** Sair da área administrativa (POST com token CSRF). */
require __DIR__ . '/includes/admin.php';

admin_require_valid_post('index.php');
Session::logout();
View::redirect('../../src/pages/login.html');
