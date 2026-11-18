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

        if ($error = self::nameError($name)) {
            $errors['name'] = $error;
        }

        if ($email === '') {
            $errors['email'] = 'Informe seu e-mail.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 180) {
            $errors['email'] = 'Digite um e-mail válido, como nome@exemplo.com.';
        }

        if ($error = self::passwordError($password, 'Crie uma senha.')) {
            $errors['password'] = $error;
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
        $email = self::normalizeEmail($email);
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'cli';
        // Limite guardado no servidor (por e-mail + IP e por IP): apagar o cookie não zera as tentativas.
        $locked = LoginThrottle::lockedFor($email, $ip);
        if ($locked > 0) {
            $minutes = (int) ceil($locked / 60);
            throw new AuthException("Muitas tentativas. Tente novamente em {$minutes} min.", 429);
        }

        $user = User::findByEmail($email);

        // Mesma mensagem e mesmo tempo de resposta para e-mail inexistente e senha errada:
        // a senha é sempre conferida (contra um hash fictício quando o e-mail não existe).
        $hash = $user['password_hash'] ?? password_hash('usuario-inexistente', PASSWORD_DEFAULT);
        $passwordOk = password_verify($password, $hash);

        if (!$user || !$passwordOk) {
            LoginThrottle::fail($email, $ip);
            throw new AuthException(self::INVALID_LOGIN, 401);
        }

        LoginThrottle::clear($email, $ip);

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

    /**
     * Altera o nome do cliente logado ("Minha conta").
     * @throws ValidationException
     */
    public static function updateProfile(array $user, array $input): array
    {
        $name = trim(preg_replace('/\s+/u', ' ', Response::text($input, 'name')));
        if ($error = self::nameError($name)) {
            throw new ValidationException('Confira os campos destacados.', ['name' => $error]);
        }
        User::updateName((int) $user['id'], $name);
        $updated = User::findById((int) $user['id']);
        Session::refreshUser($updated);
        return $updated;
    }

    /**
     * Troca a senha do cliente logado: exige a senha atual; a nova segue as regras do cadastro.
     * A sessão ganha um ID novo depois da troca.
     * @throws ValidationException
     */
    public static function changePassword(array $user, array $input): void
    {
        $current = Response::text($input, 'currentPassword');
        $new = Response::text($input, 'newPassword');
        $confirm = Response::text($input, 'confirmPassword');
        $stored = User::findByEmail($user['email']);
        $errors = [];

        if ($current === '' || !$stored || !password_verify($current, $stored['password_hash'])) {
            $errors['currentPassword'] = 'Senha atual incorreta.';
        }
        if ($error = self::passwordError($new, 'Crie a nova senha.')) {
            $errors['newPassword'] = $error;
        } elseif ($current !== '' && hash_equals($current, $new)) {
            $errors['newPassword'] = 'A nova senha precisa ser diferente da atual.';
        }
        if ($confirm === '') {
            $errors['confirmPassword'] = 'Repita a nova senha para confirmar.';
        } elseif (!hash_equals($new, $confirm)) {
            $errors['confirmPassword'] = 'As senhas não coincidem.';
        }
        if ($errors) {
            throw new ValidationException('Confira os campos destacados.', $errors);
        }

        User::updatePasswordHash((int) $user['id'], password_hash($new, PASSWORD_DEFAULT));
        Session::login(User::findById((int) $user['id']), (bool) ($_SESSION['remember'] ?? false));
    }

    /** Mensagem de erro do nome (ou null): letras, 2+ palavras, até 120 caracteres. */
    private static function nameError(string $name): ?string
    {
        return match (true) {
            $name === '' => 'Informe seu nome completo.',
            !preg_match(self::NAME_PATTERN, $name) => 'Use apenas letras, espaços, apóstrofo, hífen ou ponto no nome.',
            count(explode(' ', $name)) < 2 => 'Informe nome e sobrenome.',
            mb_strlen($name) > 120 => 'O nome pode ter no máximo 120 caracteres.',
            default => null,
        };
    }

    /** Mensagem de erro da senha (ou null): 8+ caracteres com letras e números, até 72 (limite do bcrypt). */
    private static function passwordError(string $password, string $emptyMessage): ?string
    {
        return match (true) {
            $password === '' => $emptyMessage,
            mb_strlen($password) < 8 || !preg_match('/\p{L}/u', $password) || !preg_match('/\d/', $password) => 'A senha precisa ter 8 ou mais caracteres, com letras e números.',
            strlen($password) > 72 => 'A senha pode ter no máximo 72 caracteres.',
            default => null,
        };
    }

    private static function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }
}
