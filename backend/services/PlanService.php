<?php
declare(strict_types=1);

/**
 * Regras do CRUD de planos da F1Hub Box (área administrativa).
 *
 * - Nome e slug únicos; slug gerado a partir do nome quando fica em branco;
 * - Frase de apoio obrigatória; preço mensal maior que zero;
 * - De 1 a 8 benefícios (um por linha);
 * - Só um plano é o destaque ("Mais escolhido");
 * - Plano com assinaturas (ativas ou canceladas) não pode ser excluído, apenas desativado.
 */
final class PlanService
{
    public const MAX_ITEMS = 8;
    private const SLUG_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';
    private const NAME_PATTERN = "/^[\\p{L}\\p{M}\\p{N}'’.&+\\- ]+$/u";
    /** Texto livre (frase e benefícios): qualquer caractere visível, sem caracteres de controle. */
    private const TEXT_PATTERN = '/^[^\p{C}]+$/u';
    private const INVISIBLE_CHARS = 'O texto tem caracteres invisíveis ou inválidos. Digite-o novamente, sem colar de outro lugar.';

    public static function blank(): array
    {
        return [
            'id' => 0, 'slug' => '', 'name' => '', 'tagline' => '', 'price' => '', 'items' => '',
            'includes_shirt' => false, 'highlight' => false, 'active' => true,
        ];
    }

    public static function toForm(array $plan): array
    {
        return [
            'id' => (int) $plan['id'],
            'slug' => $plan['slug'],
            'name' => $plan['name'],
            'tagline' => $plan['tagline'],
            'price' => View::moneyInput($plan['price_cents']),
            'items' => $plan['items'],
            'includes_shirt' => (bool) $plan['includes_shirt'],
            'highlight' => (bool) $plan['highlight'],
            'active' => (bool) $plan['active'],
        ];
    }

    public static function formFrom(array $post, int $id): array
    {
        return [
            'id' => $id,
            'slug' => Input::line($post, 'slug'),
            'name' => Input::line($post, 'name'),
            'tagline' => Input::line($post, 'tagline'),
            'price' => Input::line($post, 'price'),
            'items' => implode("\n", Input::lines($post, 'items')),
            'includes_shirt' => Input::checked($post, 'includes_shirt'),
            'highlight' => Input::checked($post, 'highlight'),
            'active' => Input::checked($post, 'active'),
        ];
    }

    /** Benefícios do plano como lista (um por linha). @return string[] */
    public static function items(string $text): array
    {
        return Input::lines(['items' => $text], 'items');
    }

    /**
     * Valida e grava (cria quando id = 0). Devolve o id do plano.
     * @throws ValidationException
     */
    public static function save(array $form): int
    {
        $id = $form['id'];
        $errors = [];

        $name = $form['name'];
        if ($name === '') {
            $errors['name'] = 'Informe o nome do plano.';
        } elseif (mb_strlen($name) < 2 || mb_strlen($name) > 60) {
            $errors['name'] = 'O nome deve ter entre 2 e 60 caracteres.';
        } elseif (!preg_match(self::NAME_PATTERN, $name)) {
            $errors['name'] = 'Use letras, números, espaços e pontuação simples (- . \' & +) no nome.';
        } elseif (Plan::isTaken('name', $name, $id)) {
            $errors['name'] = 'Já existe um plano com este nome.';
        }

        $slug = mb_strtolower($form['slug']) ?: Input::slug($name, 40);
        if ($slug === '') {
            if ($name !== '') {
                $errors['slug'] = 'Informe o identificador (slug) do plano.';
            }
        } elseif (strlen($slug) > 40 || !preg_match(self::SLUG_PATTERN, $slug)) {
            $errors['slug'] = 'Use até 40 caracteres: letras minúsculas sem acento, números e hífens (ex.: pit-stop).';
        } elseif (Plan::isTaken('slug', $slug, $id)) {
            $errors['slug'] = 'Este identificador já é usado por outro plano.';
        }

        $tagline = $form['tagline'];
        if ($tagline === '') {
            $errors['tagline'] = 'Informe a frase de apoio (ex.: Para começar a coleção).';
        } elseif (mb_strlen($tagline) > 120) {
            $errors['tagline'] = 'A frase de apoio pode ter no máximo 120 caracteres.';
        } elseif (!preg_match(self::TEXT_PATTERN, $tagline)) {
            $errors['tagline'] = self::INVISIBLE_CHARS;
        }

        $price = $form['price'] === '' ? null : Input::moneyToCents($form['price']);
        if ($form['price'] === '') {
            $errors['price'] = 'Informe o preço mensal.';
        } elseif ($price === null || $price > Input::MAX_CENTS) {
            $errors['price'] = 'Digite um preço válido, como 89,90 (máximo R$ 99.999,99).';
        } elseif ($price <= 0) {
            $errors['price'] = 'O preço deve ser maior que zero.';
        }

        $items = self::items($form['items']);
        if (!$items) {
            $errors['items'] = 'Informe pelo menos um benefício (um por linha).';
        } elseif (count($items) > self::MAX_ITEMS) {
            $errors['items'] = 'Informe no máximo ' . self::MAX_ITEMS . ' benefícios.';
        } else {
            foreach ($items as $item) {
                if (mb_strlen($item) > 120) {
                    $errors['items'] = 'Cada benefício pode ter no máximo 120 caracteres.';
                    break;
                }
                if (!preg_match(self::TEXT_PATTERN, $item)) {
                    $errors['items'] = self::INVISIBLE_CHARS;
                    break;
                }
            }
        }

        if ($errors) {
            throw new ValidationException('Confira os campos destacados.', $errors);
        }

        $data = [
            'slug' => $slug,
            'name' => $name,
            'tagline' => $tagline,
            'price_cents' => $price,
            'items' => $items,
            'includes_shirt' => $form['includes_shirt'],
            'highlight' => $form['highlight'],
            'active' => $form['active'],
        ];

        try {
            if ($id === 0) {
                return Plan::create($data);
            }
            Plan::update($id, $data);
            return $id;
        } catch (PDOException $exception) {
            // Dois administradores salvando ao mesmo tempo: as restrições UNIQUE do banco decidem.
            if (($exception->errorInfo[1] ?? null) === 1062) {
                $field = str_contains($exception->getMessage(), 'uq_plans_name') ? 'name' : 'slug';
                throw new ValidationException('Confira os campos destacados.', [$field => 'Este valor já é usado por outro plano.']);
            }
            throw $exception;
        }
    }

    /**
     * Ativa ou desativa (plano inativo some da página da assinatura). Devolve o plano atualizado.
     * @throws ValidationException
     */
    public static function toggle(int $id): array
    {
        $plan = Plan::find($id) ?? throw new ValidationException('Plano não encontrado.');
        Plan::setActive($id, !$plan['active']);
        $plan['active'] = !$plan['active'];
        return $plan;
    }

    /**
     * Exclui o plano, se ninguém nunca o assinou. Devolve o nome do plano excluído.
     * @throws ValidationException
     */
    public static function delete(int $id): string
    {
        $plan = Plan::find($id) ?? throw new ValidationException('Plano não encontrado.');
        $blocked = 'Este plano já tem assinaturas e não pode ser excluído. Desative-o para tirá-lo da página da assinatura.';
        if (Plan::subscriptionCount($id) > 0) {
            throw new ValidationException($blocked);
        }
        try {
            Plan::delete($id);
        } catch (PDOException $exception) {
            // Assinatura criada entre a conferência e a exclusão: a chave estrangeira (RESTRICT) impede.
            if (($exception->errorInfo[1] ?? null) === 1451) {
                throw new ValidationException($blocked);
            }
            throw $exception;
        }
        return $plan['name'];
    }
}
