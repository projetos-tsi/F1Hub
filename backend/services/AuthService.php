<?php
declare(strict_types=1);

/**
 * Regras de cadastro e login.
 *
 * As validações repetem as do front-end (frontend/js/cadastro.js), porque o
 * navegador pode ser contornado: o servidor é quem decide.
 */
final class AuthService
{
    private const MAX_ATTEMPTS = 5;            // tentativas de login erradas...
    private const LOCK_SECONDS = 5 * 60;       // ...bloqueiam novas tentativas por 5 minutos
    private const INVALID_LOGIN = 'E-mail ou senha incorretos.';
    // Letras (inclusive acentuadas), espaço, apóstrofo, hífen e ponto. Ex.: "Ana D'Ávila", "José da Silva-Neto Jr."
    private const NAME_PATTERN = "/^[\\p{L}\\p{M}'’.\\- ]+$/u";

    /**
     * Valida e cria a conta. Devolve o usuário criado (campos públicos).
     * @throws ValidationException
     */
    public static function register(array $input): array
    {
        $name = trim(preg_replace('/\s+/u', ' ', Response::text($input, 'name')));
        $email = self::normalizeEmail(Response::text($input, 'email'));
        $password = Response::text($input, 'password');
        $confirm = Response::text($input, 'confirmPassword');
        $errors = [];

        if ($name === '') {
            $errors['name'] = 'Informe seu nome completo.';
        } elseif (!preg_match(self::NAME_PATTERN, $name)) {
            $errors['name'] = 'Use apenas letras, espaços, apóstrofo, hífen ou ponto no nome.';
        } elseif (count(explode(' ', $name)) < 2) {
            $errors['name'] = 'Informe nome e sobrenome.';
        } elseif (mb_strlen($name) > 120) {
            $errors['name'] = 'O nome pode ter no máximo 120 caracteres.';
        }

        if ($email === '') {
            $errors['email'] = 'Informe seu e-mail.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 180) {
            $errors['email'] = 'Digite um e-mail válido, como nome@exemplo.com.';
        }

        if ($password === '') {
            $errors['password'] = 'Crie uma senha.';
        } elseif (mb_strlen($password) < 8 || !preg_match('/\p{L}/u', $password) || !preg_match('/\d/', $password)) {
            $errors['password'] = 'A senha precisa ter 8 ou mais caracteres, com letras e números.';
        } elseif (strlen($password) > 72) {
            // Limite do algoritmo bcrypt usado por password_hash().
            $errors['password'] = 'A senha pode ter no máximo 72 caracteres.';
        }

        if ($confirm === '') {
            $errors['confirmPassword'] = 'Repita a senha para confirmar.';
        } elseif (!hash_equals($password, $confirm)) {
            $errors['confirmPassword'] = 'As senhas não coincidem.';
        }

        if (($input['terms'] ?? false) !== true) {
            $errors['terms'] = 'Aceite os termos para criar sua conta.';
        }

        if (!isset($errors['email']) && User::emailExists($email)) {
            $errors['email'] = 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.';
        }

        if ($errors) {
            throw new ValidationException('Confira os campos destacados.', $errors);
        }

        try {
            $id = User::create($name, $email, password_hash($password, PASSWORD_DEFAULT));
        } catch (PDOException $exception) {
            // Dois cadastros simultâneos com o mesmo e-mail: a restrição UNIQUE do banco decide.
            if (($exception->errorInfo[1] ?? null) === 1062) {
                throw new ValidationException('Confira os campos destacados.', ['email' => 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.']);
            }
            throw $exception;
        }

        return User::findById($id);
    }

    /**
     * Confere e-mail e senha. Devolve o usuário (campos públicos).
     * @throws AuthException
     */
    public static function login(string $email, string $password): array
    {
        Session::start();
        $lockedUntil = $_SESSION['login_locked_until'] ?? 0;
        if ($lockedUntil > time()) {
            $minutes = (int) ceil(($lockedUntil - time()) / 60);
            throw new AuthException("Muitas tentativas. Tente novamente em {$minutes} min.", 429);
        }

        $user = User::findByEmail(self::normalizeEmail($email));

        // Mesma mensagem e mesmo tempo de resposta para e-mail inexistente e senha errada:
        // a senha é sempre conferida (contra um hash fictício quando o e-mail não existe).
        $hash = $user['password_hash'] ?? password_hash('usuario-inexistente', PASSWORD_DEFAULT);
        $passwordOk = password_verify($password, $hash);

        if (!$user || !$passwordOk) {
            $_SESSION['login_failures'] = ($_SESSION['login_failures'] ?? 0) + 1;
            if ($_SESSION['login_failures'] >= self::MAX_ATTEMPTS) {
                $_SESSION['login_locked_until'] = time() + self::LOCK_SECONDS;
                $_SESSION['login_failures'] = 0;
            }
            throw new AuthException(self::INVALID_LOGIN, 401);
        }

        unset($_SESSION['login_failures'], $_SESSION['login_locked_until']);

        // Se o PHP passar a usar um algoritmo mais forte, a senha é atualizada no próximo login.
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            User::updatePasswordHash((int) $user['id'], password_hash($password, PASSWORD_DEFAULT));
        }

        unset($user['password_hash']);
        return $user;
    }

    /** Dados públicos do usuário logado, lidos do banco (ou null). */
    public static function currentUser(): ?array
    {
        $sessionUser = Session::user();
        if (!$sessionUser) {
            return null;
        }

        $user = User::findById($sessionUser['id']);
        if (!$user) {
            // A conta deixou de existir: encerra a sessão.
            Session::logout();
            return null;
        }
        return $user;
    }

    public static function publicView(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'firstName' => explode(' ', $user['name'])[0],
            'email' => $user['email'],
            'role' => $user['role'],
            'memberSince' => substr((string) $user['created_at'], 0, 10),
        ];
    }

    private static function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }
}
