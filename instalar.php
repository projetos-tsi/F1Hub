<?php
/**
 * Instalador do banco de dados do F1 Hub (somente no computador de desenvolvimento).
 *
 * Abra http://localhost/F1Hub/instalar.php e clique em "Instalar banco de dados":
 * - cria backend/config/database.php (a partir dos dados informados, padrão do XAMPP);
 * - executa database/database.sql (estrutura) e database/seeds/dados_iniciais.sql (dados iniciais).
 *
 * Os dois scripts podem ser executados mais de uma vez: só criam o que ainda não existe.
 * Segurança: responde apenas a acessos do próprio computador (127.0.0.1 / ::1, sem proxy) e
 * toda ação exige o token do formulário. Em hospedagem online, apague este arquivo.
 */
declare(strict_types=1);

require __DIR__ . '/backend/bootstrap.php';

const CONFIG_FILE = __DIR__ . '/backend/config/database.php';
const SQL_FILES = [
    'Estrutura (9 tabelas)' => __DIR__ . '/database/database.sql',
    'Dados iniciais (equipes, categorias, 45 produtos, 3 planos, admin de teste)' => __DIR__ . '/database/seeds/dados_iniciais.sql',
];

View::securityHeaders();
header("Content-Security-Policy: default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; form-action 'self'; frame-ancestors 'none'");

// ---------- Somente no próprio computador ----------
$remote = $_SERVER['REMOTE_ADDR'] ?? '';
$host = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
$proxied = isset($_SERVER['HTTP_X_FORWARDED_FOR']) || isset($_SERVER['HTTP_FORWARDED']) || isset($_SERVER['HTTP_X_REAL_IP']);
if (!in_array($remote, ['127.0.0.1', '::1'], true) || !in_array($host, ['localhost', '127.0.0.1', '[::1]'], true) || $proxied) {
    http_response_code(403);
    exit('Instalador disponível somente no computador de desenvolvimento (http://localhost).');
}

Session::start();

/** Divide um arquivo SQL em comandos, respeitando textos entre aspas e comentários "--". */
function sql_statements(string $sql): array
{
    $statements = [];
    $current = '';
    $length = strlen($sql);
    $quote = null;
    for ($i = 0; $i < $length; $i++) {
        $char = $sql[$i];
        if ($quote !== null) {
            $current .= $char;
            if ($char === '\\') {
                $current .= $sql[++$i] ?? '';
            } elseif ($char === $quote) {
                if (($sql[$i + 1] ?? '') === $quote) {
                    $current .= $sql[++$i];
                } else {
                    $quote = null;
                }
            }
            continue;
        }
        if ($char === '-' && ($sql[$i + 1] ?? '') === '-') {
            $end = strpos($sql, "\n", $i);
            $i = $end === false ? $length : $end;
            $current .= "\n";
            continue;
        }
        if ($char === "'" || $char === '"' || $char === '`') {
            $quote = $char;
        }
        if ($char === ';') {
            if (trim($current) !== '') {
                $statements[] = trim($current);
            }
            $current = '';
            continue;
        }
        $current .= $char;
    }
    if (trim($current) !== '') {
        $statements[] = trim($current);
    }
    return $statements;
}

function config_values(): array
{
    $defaults = ['host' => '127.0.0.1', 'port' => '3306', 'database' => 'f1hub', 'username' => 'root', 'password' => '', 'charset' => 'utf8mb4'];
    if (is_file(CONFIG_FILE)) {
        $config = require CONFIG_FILE;
        if (is_array($config)) {
            return array_merge($defaults, array_intersect_key($config, $defaults));
        }
    }
    return $defaults;
}

/** Conecta ao MySQL (sem escolher banco). */
function server_connection(array $config): PDO
{
    $dsn = sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $config['host'], $config['port']);
    $pdo = new PDO($dsn, $config['username'], $config['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_TIMEOUT => 5]);
    $pdo->exec("SET SESSION sql_mode = '" . Database::STRICT_SQL_MODE . "', time_zone = '-03:00'");
    return $pdo;
}

/** Situação atual: conexão, banco e contagem das tabelas. */
function diagnose(array $config): array
{
    $state = ['connected' => false, 'database' => false, 'counts' => [], 'error' => null];
    try {
        $pdo = server_connection($config);
        $state['connected'] = true;
        $statement = $pdo->prepare('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?');
        $statement->execute([$config['database']]);
        if ($statement->fetchColumn()) {
            $state['database'] = true;
            $pdo->exec('USE `' . str_replace('`', '', $config['database']) . '`');
            foreach (['users', 'teams', 'categories', 'products', 'product_sizes', 'plans', 'subscriptions', 'orders', 'order_items'] as $table) {
                try {
                    $state['counts'][$table] = (int) $pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
                } catch (Throwable) {
                    $state['counts'][$table] = null;
                }
            }
        }
    } catch (Throwable $exception) {
        $state['error'] = $exception->getMessage();
    }
    return $state;
}

$messages = [];
$config = config_values();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!Csrf::isValid(Csrf::fromRequest())) {
        $messages[] = ['error', 'O formulário expirou. Tente de novo.'];
    } else {
        $config = [
            'host' => Input::line($_POST, 'host') ?: '127.0.0.1',
            'port' => preg_match('/^\d{2,5}$/', Input::line($_POST, 'port')) ? Input::line($_POST, 'port') : '3306',
            'database' => 'f1hub',
            'username' => Input::line($_POST, 'username') ?: 'root',
            // Senha em branco mantém a que já estava configurada (o campo nunca é preenchido de volta na tela).
            'password' => is_string($_POST['password'] ?? null) && $_POST['password'] !== '' ? $_POST['password'] : $config['password'],
            'charset' => 'utf8mb4',
        ];
        try {
            $pdo = server_connection($config);

            // Grava a configuração usada (o arquivo fica fora do Git).
            $php = "<?php\n// Gerado pelo instalador (instalar.php) em " . date('d/m/Y H:i') . ". Não versione este arquivo.\nreturn " . var_export($config, true) . ";\n";
            if (@file_put_contents(CONFIG_FILE, $php) === false) {
                throw new RuntimeException('Não foi possível gravar backend/config/database.php. Verifique a permissão da pasta.');
            }

            if (Input::checked($_POST, 'reset')) {
                $pdo->exec('DROP DATABASE IF EXISTS `f1hub`');
                $messages[] = ['success', 'Banco f1hub antigo apagado.'];
            }
            foreach (SQL_FILES as $label => $file) {
                $count = 0;
                // Quebras de linha do Windows (CRLF) viram "\n" para os textos de várias linhas ficarem iguais em qualquer computador.
                foreach (sql_statements(str_replace("\r\n", "\n", (string) file_get_contents($file))) as $statement) {
                    $pdo->exec($statement);
                    $count++;
                }
                $messages[] = ['success', "{$label}: {$count} comandos executados."];
            }
            $messages[] = ['success', 'Pronto! O banco está instalado.'];
        } catch (Throwable $exception) {
            $messages[] = ['error', 'Não foi possível instalar: ' . $exception->getMessage()];
        }
    }
}

$state = diagnose($config);
// "Instalado" = o site consegue usar o banco: configuração gravada + banco com produtos e o administrador.
$installed = is_file(CONFIG_FILE) && $state['database'] && ($state['counts']['products'] ?? 0) > 0 && ($state['counts']['users'] ?? 0) > 0;
$checks = [
    ['PHP ' . PHP_VERSION, version_compare(PHP_VERSION, '8.1.0', '>='), 'É preciso PHP 8.1 ou superior.'],
    ['Extensão pdo_mysql', extension_loaded('pdo_mysql'), 'Ative a extensão pdo_mysql no php.ini do XAMPP.'],
    ['Arquivo backend/config/database.php', is_file(CONFIG_FILE), 'Será criado ao instalar.'],
    ['Conexão com o MySQL', $state['connected'], 'Inicie o MySQL no painel do XAMPP e confira usuário e senha abaixo.'],
    ['Banco f1hub com dados', $state['database'] && ($state['counts']['products'] ?? 0) > 0, 'Clique em "Instalar banco de dados".'],
];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Instalador | F1 Hub</title>
    <link rel="icon" href="frontend/src/assets/images/logo.svg">
    <link rel="stylesheet" href="frontend/src/style/reset.css">
    <link rel="stylesheet" href="frontend/src/style/style-admin.css">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Syncopate:wght@700&display=swap" rel="stylesheet">
</head>
<body class="admin-body">
    <header class="admin-header">
        <a class="admin-brand" href="frontend/index.php" aria-label="F1 Hub — loja"><img src="frontend/src/assets/images/logo.svg" alt=""><span>F1 Hub</span><em>Instalador</em></a>
    </header>
    <main id="conteudo" class="admin-main installer">
        <section class="admin-hero">
            <div>
                <p class="eyebrow">Ambiente local · XAMPP</p>
                <h1>Instalar o banco de dados</h1>
                <p>Cria o banco <strong>f1hub</strong> com as 9 tabelas e os dados iniciais em um clique, sem usar o phpMyAdmin.</p>
            </div>
        </section>

        <?php foreach ($messages as [$type, $text]): ?>
            <p class="admin-alert is-<?= View::e($type) ?>" role="<?= $type === 'error' ? 'alert' : 'status' ?>"><?= View::e($text) ?></p>
        <?php endforeach; ?>

        <div class="installer-grid">
            <section class="admin-card" aria-labelledby="verificacao">
                <div class="admin-card-heading"><h2 id="verificacao">Verificação</h2></div>
                <ul class="installer-checks">
                    <?php foreach ($checks as [$label, $ok, $hint]): ?>
                        <li class="<?= $ok ? 'is-ok' : 'is-pending' ?>">
                            <span aria-hidden="true"><?= $ok ? '✓' : '!' ?></span>
                            <div><strong><?= View::e($label) ?></strong><?php if (!$ok): ?><small><?= View::e($hint) ?></small><?php endif; ?></div>
                        </li>
                    <?php endforeach; ?>
                </ul>
                <?php if ($state['counts']): ?>
                    <p class="admin-hint">Registros: <?= View::e(implode(' · ', array_map(static fn ($t, $c) => "{$t} " . ($c ?? '—'), array_keys($state['counts']), $state['counts']))) ?></p>
                <?php endif; ?>
                <?php if ($installed): ?>
                    <div class="installer-links">
                        <a class="button button-red" href="frontend/index.php">Abrir a loja</a>
                        <a class="button button-dark" href="frontend/pages/admin/index.php">Área administrativa</a>
                    </div>
                    <p class="admin-hint">Administrador de teste: <strong>admin@f1hub.test</strong> / <strong>F1HubAdmin2026</strong> (somente ambiente local).</p>
                <?php endif; ?>
            </section>

            <section class="admin-card" aria-labelledby="instalar">
                <div class="admin-card-heading"><h2 id="instalar"><?= $installed ? 'Reinstalar ou atualizar' : 'Instalar' ?></h2></div>
                <form method="post" action="instalar.php" class="installer-form">
                    <input type="hidden" name="csrf_token" value="<?= View::e(Csrf::token()) ?>">
                    <p class="admin-hint">No XAMPP padrão não precisa mudar nada: usuário <strong>root</strong> sem senha.</p>
                    <div class="admin-grid-2">
                        <label class="admin-field"><span>Servidor</span><input name="host" value="<?= View::e($config['host']) ?>" maxlength="100" required></label>
                        <label class="admin-field"><span>Porta</span><input name="port" value="<?= View::e($config['port']) ?>" inputmode="numeric" maxlength="5" required></label>
                        <label class="admin-field"><span>Usuário do MySQL</span><input name="username" value="<?= View::e($config['username']) ?>" maxlength="80" required autocomplete="off"></label>
                        <label class="admin-field"><span>Senha do MySQL</span><input name="password" type="password" value="" maxlength="200" autocomplete="off" placeholder="em branco no XAMPP"></label>
                    </div>
                    <?php if ($state['database']): ?>
                        <label class="installer-reset"><input type="checkbox" name="reset" value="1"> <span><strong>Apagar o banco f1hub atual e recriar do zero</strong><small>Use se o banco veio de uma versão antiga. Pedidos, assinaturas e contas criadas serão perdidos.</small></span></label>
                    <?php endif; ?>
                    <button type="submit" class="button button-red"><?= $installed ? 'Atualizar banco de dados' : 'Instalar banco de dados' ?></button>
                    <p class="admin-hint">Seguro para repetir: sem a opção acima, nada que já existe é alterado ou apagado.</p>
                </form>
            </section>
        </div>
    </main>
    <footer class="admin-footer"><p>F1 Hub · Instalador local</p><p>Em hospedagem online, apague o arquivo instalar.php.</p></footer>
</body>
</html>
