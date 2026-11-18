<?php
declare(strict_types=1);

/**
 * Regras do CRUD de produtos (área administrativa).
 *
 * - Nome e slug únicos; slug gerado a partir do nome quando fica em branco;
 * - Preço maior que zero; preço "de" (promoção) opcional e maior que o preço;
 * - Pelo menos um tamanho; "Único" não se mistura com P, M, G e GG;
 * - Imagem escolhida entre as que já existem em frontend/src/assets/images/;
 * - Produto com pedidos não pode ser excluído, apenas desativado (histórico preservado).
 */
final class ProductService
{
    private const IMAGE_FOLDER = __DIR__ . '/../../frontend/src/assets/images';
    /** Imagens da pasta que não são fotos de produto (redes sociais, banner). */
    private const NOT_PRODUCT_IMAGES = ['facebook.png', 'instagram.png', 'twitter.png', 'imagem-promocional.png'];
    private const SLUG_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';
    private const NAME_PATTERN = "/^[\\p{L}\\p{M}\\p{N}'’.,&+()\\/\\- ]+$/u";
    private const PILOT_PATTERN = "/^[\\p{L}\\p{M}'’.\\- ]+$/u";

    /** Filtros da lista, lidos da URL e limitados a valores válidos. */
    public static function filtersFrom(array $query): array
    {
        $status = Input::line($query, 'status');
        $team = Input::line($query, 'team');
        return [
            'q' => mb_substr(Input::line($query, 'q'), 0, 80),
            'team' => preg_match('/^[a-z0-9-]{1,30}$/', $team) ? $team : '',
            'category' => Input::id($query, 'category'),
            'status' => in_array($status, ['ativos', 'inativos'], true) ? $status : '',
        ];
    }

    /** Nomes dos arquivos de imagem de produto disponíveis, em ordem alfabética. @return string[] */
    public static function availableImages(): array
    {
        $images = [];
        foreach (scandir(self::IMAGE_FOLDER) ?: [] as $file) {
            if (preg_match('/^[a-z0-9][a-z0-9-]*\.(png|jpe?g|webp)$/', $file)
                && !str_ends_with(pathinfo($file, PATHINFO_FILENAME), '-logo')
                && !in_array($file, self::NOT_PRODUCT_IMAGES, true)
                && is_file(self::IMAGE_FOLDER . '/' . $file)) {
                $images[] = $file;
            }
        }
        natsort($images);
        return array_values($images);
    }

    /** Valores iniciais do formulário de novo produto. */
    public static function blank(): array
    {
        return [
            'id' => 0, 'slug' => '', 'team_id' => 0, 'category_id' => 0, 'pilot' => '', 'name' => '', 'image' => '',
            'price' => '', 'old_price' => '', 'active' => true, 'sizes' => ['P', 'M', 'G', 'GG'],
        ];
    }

    /** Produto do banco no formato do formulário. */
    public static function toForm(array $product): array
    {
        return [
            'id' => (int) $product['id'],
            'slug' => $product['slug'],
            'team_id' => (int) $product['team_id'],
            'category_id' => (int) $product['category_id'],
            'pilot' => (string) $product['pilot'],
            'name' => $product['name'],
            'image' => $product['image'],
            'price' => View::moneyInput($product['price_cents']),
            'old_price' => View::moneyInput($product['old_price_cents']),
            'active' => (bool) $product['active'],
            'sizes' => $product['sizes'],
        ];
    }

    /** Campos enviados no formulário (para exibir de novo quando há erro). */
    public static function formFrom(array $post, int $id): array
    {
        return [
            'id' => $id,
            'slug' => Input::line($post, 'slug'),
            'team_id' => Input::id($post, 'team_id'),
            'category_id' => Input::id($post, 'category_id'),
            'pilot' => Input::line($post, 'pilot'),
            'name' => Input::line($post, 'name'),
            'image' => Input::line($post, 'image'),
            'price' => Input::line($post, 'price'),
            'old_price' => Input::line($post, 'old_price'),
            'active' => Input::checked($post, 'active'),
            'sizes' => array_values(array_intersect(Product::SIZES, Input::list($post, 'sizes'))),
        ];
    }

    /**
     * Valida e grava (cria quando id = 0). Devolve o id do produto.
     * @throws ValidationException
     */
    public static function save(array $form): int
    {
        $id = $form['id'];
        $errors = [];

        $name = $form['name'];
        if ($name === '') {
            $errors['name'] = 'Informe o nome do produto.';
        } elseif (mb_strlen($name) < 3 || mb_strlen($name) > 160) {
            $errors['name'] = 'O nome deve ter entre 3 e 160 caracteres.';
        } elseif (!preg_match(self::NAME_PATTERN, $name)) {
            $errors['name'] = 'Use letras, números, espaços e pontuação simples (- . , \' & + ( ) /) no nome.';
        } elseif (Product::isTaken('name', $name, $id)) {
            $errors['name'] = 'Já existe um produto com este nome.';
        }

        $slug = mb_strtolower($form['slug']) ?: Input::slug($name, 80);
        if ($slug === '') {
            if ($name !== '') {
                $errors['slug'] = 'Informe o identificador (slug) do produto.';
            }
        } elseif (strlen($slug) > 80 || !preg_match(self::SLUG_PATTERN, $slug)) {
            $errors['slug'] = 'Use até 80 caracteres: letras minúsculas sem acento, números e hífens (ex.: camisa-ferrari-2026).';
        } elseif (Product::isTaken('slug', $slug, $id)) {
            $errors['slug'] = 'Este identificador já é usado por outro produto.';
        }

        if (!$form['team_id'] || !Team::exists($form['team_id'])) {
            $errors['team_id'] = 'Escolha a equipe.';
        }
        if (!$form['category_id'] || !Category::exists($form['category_id'])) {
            $errors['category_id'] = 'Escolha a categoria.';
        }

        $pilot = $form['pilot'];
        if ($pilot !== '' && (mb_strlen($pilot) > 80 || !preg_match(self::PILOT_PATTERN, $pilot))) {
            $errors['pilot'] = 'Use apenas letras, espaços, apóstrofo, hífen ou ponto (até 80 caracteres).';
        }

        $price = $form['price'] === '' ? null : Input::moneyToCents($form['price']);
        if ($form['price'] === '') {
            $errors['price'] = 'Informe o preço.';
        } elseif ($price === null || $price > Input::MAX_CENTS) {
            $errors['price'] = 'Digite um preço válido, como 209,90 (máximo R$ 99.999,99).';
        } elseif ($price <= 0) {
            $errors['price'] = 'O preço deve ser maior que zero.';
        }

        $oldPrice = $form['old_price'] === '' ? null : Input::moneyToCents($form['old_price']);
        if ($form['old_price'] !== '') {
            if ($oldPrice === null || $oldPrice > Input::MAX_CENTS) {
                $errors['old_price'] = 'Digite um preço válido, como 279,90, ou deixe em branco.';
            } elseif ($price !== null && $oldPrice <= $price) {
                $errors['old_price'] = 'O preço "de" precisa ser maior que o preço atual (ou fique em branco, sem promoção).';
            }
        }

        $sizes = $form['sizes'];
        if (!$sizes) {
            $errors['sizes'] = 'Escolha pelo menos um tamanho.';
        } elseif (in_array('Único', $sizes, true) && count($sizes) > 1) {
            $errors['sizes'] = 'O tamanho "Único" não pode ser combinado com P, M, G ou GG.';
        }

        if (!in_array($form['image'], self::availableImages(), true)) {
            $errors['image'] = 'Escolha uma das imagens disponíveis.';
        }

        if ($errors) {
            throw new ValidationException('Confira os campos destacados.', $errors);
        }

        $data = [
            'slug' => $slug,
            'team_id' => $form['team_id'],
            'category_id' => $form['category_id'],
            'pilot' => $pilot === '' ? null : $pilot,
            'name' => $name,
            'image' => $form['image'],
            'price_cents' => $price,
            'old_price_cents' => $oldPrice,
            'active' => $form['active'],
        ];

        try {
            if ($id === 0) {
                return Product::create($data, $sizes);
            }
            Product::update($id, $data, $sizes);
            return $id;
        } catch (PDOException $exception) {
            // Dois administradores salvando ao mesmo tempo: a restrição UNIQUE do banco decide.
            if (($exception->errorInfo[1] ?? null) === 1062) {
                throw new ValidationException('Confira os campos destacados.', ['slug' => 'Este identificador já é usado por outro produto.']);
            }
            throw $exception;
        }
    }

    /**
     * Ativa ou desativa (produto inativo some da loja). Devolve o produto atualizado.
     * @throws ValidationException
     */
    public static function toggle(int $id): array
    {
        $product = Product::find($id) ?? throw new ValidationException('Produto não encontrado.');
        Product::setActive($id, !$product['active']);
        $product['active'] = !$product['active'];
        return $product;
    }

    /**
     * Exclui o produto, se ele nunca foi vendido. Devolve o nome do produto excluído.
     * @throws ValidationException
     */
    public static function delete(int $id): string
    {
        $product = Product::find($id) ?? throw new ValidationException('Produto não encontrado.');
        $blocked = 'Este produto já aparece em pedidos e não pode ser excluído. Desative-o para tirá-lo da loja.';
        if (Product::orderCount($id) > 0) {
            throw new ValidationException($blocked);
        }
        try {
            Product::delete($id);
        } catch (PDOException $exception) {
            // Pedido gravado entre a conferência e a exclusão: a chave estrangeira (RESTRICT) impede.
            if (($exception->errorInfo[1] ?? null) === 1451) {
                throw new ValidationException($blocked);
            }
            throw $exception;
        }
        return $product['name'];
    }
}
