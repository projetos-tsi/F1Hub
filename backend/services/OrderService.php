<?php
declare(strict_types=1);

/**
 * Regras dos pedidos da loja.
 *
 * Checkout (cliente logado):
 * - o navegador envia só produto (slug), tamanho e quantidade — preço e total são SEMPRE
 *   recalculados aqui com os valores do banco (preço enviado pelo navegador é ignorado);
 * - produto inativo/inexistente, tamanho que o produto não tem ou preço diferente do que o
 *   cliente viu na tela → pedido recusado (ConflictException) para a tela ser atualizada;
 * - até 10 unidades por item e 20 itens diferentes;
 * - pagamento PIX simulado com 5% de desconto (arredondado ao centavo);
 * - clique duplo / reenvio com a mesma chave de finalização devolve o MESMO pedido.
 *
 * Situação (área administrativa): só avança — recebido → pago → enviado → entregue;
 * cancelar apenas antes do envio (recebido ou pago); entregue e cancelado são finais.
 */
final class OrderService
{
    public const PIX_DISCOUNT_PERCENT = 5;
    public const MAX_QUANTITY = 10;
    public const MAX_LINES = 20;

    /** Próximas situações permitidas a partir de cada situação. */
    public const TRANSITIONS = [
        'recebido' => ['pago', 'cancelado'],
        'pago' => ['enviado', 'cancelado'],
        'enviado' => ['entregue'],
        'entregue' => [],
        'cancelado' => [],
    ];

    /** Texto do botão de cada mudança de situação (área administrativa). */
    public const TRANSITION_LABELS = [
        'pago' => 'Confirmar pagamento',
        'enviado' => 'Marcar como enviado',
        'entregue' => 'Marcar como entregue',
        'cancelado' => 'Cancelar pedido',
    ];

    public const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

    private const SLUG_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';
    private const CITY_PATTERN = "/^[\\p{L}\\p{M}'’.\\- ]+$/u";
    private const ADDRESS_PATTERN = "/^[\\p{L}\\p{M}\\p{N}'’.,ºª°#&()\\/\\- ]+$/u";
    private const NUMBER_PATTERN = '/^[0-9A-Za-z\/ -]+$/';
    private const KEY_PATTERN = '/^[A-Za-z0-9-]{16,64}$/';

    /** Desconto do PIX: 5% do subtotal, arredondado ao centavo (mesma conta do front-end). */
    public static function pixDiscount(int $subtotalCents): int
    {
        return intdiv($subtotalCents * self::PIX_DISCOUNT_PERCENT + 50, 100);
    }

    /**
     * Fecha o pedido do cliente logado.
     * @throws ValidationException dados inválidos (422)  @throws ConflictException algo mudou (409)
     */
    public static function checkout(array $user, array $input): array
    {
        $key = is_string($input['checkoutKey'] ?? null) && preg_match(self::KEY_PATTERN, $input['checkoutKey']) ? $input['checkoutKey'] : null;

        // Reenvio da mesma finalização (clique duplo, rede lenta): devolve o pedido já criado.
        // As requisições da mesma sessão são atendidas uma de cada vez pelo PHP, então não há corrida aqui.
        Session::start();
        $last = $_SESSION['last_checkout'] ?? null;
        if ($key && is_array($last) && ($last['key'] ?? null) === $key && ($last['user_id'] ?? null) === (int) $user['id']) {
            $order = Order::find((int) $last['order_id']);
            if ($order) {
                return self::confirmation($order) + ['repeated' => true];
            }
        }

        $lines = self::cartLines($input['items'] ?? null);
        $address = self::address(is_array($input['address'] ?? null) ? $input['address'] : []);
        $expected = $input['expectedTotal'] ?? null;
        if (!is_int($expected) || $expected <= 0) {
            throw new ValidationException('Não foi possível conferir o total do pedido. Recarregue a página e tente novamente.');
        }

        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            // Trava as linhas dos produtos: o admin não altera preço/situação no meio do fechamento.
            $products = Product::activeBySlugs(array_unique(array_column($lines, 'slug')), true);

            $items = [];
            $subtotal = 0;
            foreach ($lines as $line) {
                $product = $products[$line['slug']] ?? null;
                if (!$product) {
                    throw new ConflictException('Um item do seu carrinho não está mais disponível. Atualizamos o carrinho: confira antes de finalizar.');
                }
                if (!in_array($line['size'], $product['sizes'], true)) {
                    throw new ConflictException("O tamanho {$line['size']} de \"{$product['name']}\" não está mais disponível. Confira o carrinho antes de finalizar.");
                }
                $price = (int) $product['price_cents'];
                $subtotal += $price * $line['quantity'];
                $items[] = [
                    'product_id' => (int) $product['id'],
                    'product_name' => $product['name'],
                    'unit_price_cents' => $price,
                    'size' => $line['size'],
                    'quantity' => $line['quantity'],
                ];
            }

            $discount = self::pixDiscount($subtotal);
            $total = $subtotal - $discount;
            if ($total !== $expected) {
                throw new ConflictException('Os preços de alguns produtos mudaram desde que você abriu esta página. Confira o novo total antes de finalizar.');
            }

            $orderId = Order::insert([
                'user_id' => (int) $user['id'],
                'subtotal_cents' => $subtotal,
                'discount_cents' => $discount,
                'total_cents' => $total,
            ] + $address, $items);
            $pdo->commit();
        } catch (Throwable $exception) {
            $pdo->rollBack();
            throw $exception;
        }

        if ($key) {
            $_SESSION['last_checkout'] = ['key' => $key, 'user_id' => (int) $user['id'], 'order_id' => $orderId];
        }
        return self::confirmation(Order::find($orderId)) + ['repeated' => false];
    }

    /** Pedidos do cliente, com itens, no formato da API. */
    public static function forUser(int $userId): array
    {
        $orders = Order::forUser($userId);
        $items = Order::itemsFor(array_map('intval', array_column($orders, 'id')));
        return array_map(static fn (array $order): array => self::publicView($order, $items[(int) $order['id']] ?? []), $orders);
    }

    /**
     * Muda a situação do pedido (área administrativa).
     * $from é a situação que o administrador estava vendo: se outra pessoa já mudou, nada é alterado.
     * @return array{order: array, from: string, to: string}
     */
    public static function changeStatus(int $id, string $from, string $to): array
    {
        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $order = $id > 0 ? Order::find($id, true) : null;
            if (!$order) {
                throw new ValidationException('Pedido não encontrado.');
            }
            if ($order['status'] !== $from) {
                $current = Order::STATUSES[$order['status']];
                throw new ConflictException("A situação deste pedido já tinha sido alterada para \"{$current}\". Confira e tente de novo, se for o caso.");
            }
            if (!in_array($to, self::TRANSITIONS[$from] ?? [], true)) {
                $fromLabel = Order::STATUSES[$from] ?? $from;
                $toLabel = Order::STATUSES[$to] ?? $to;
                throw new ValidationException("Não é possível mudar a situação de \"{$fromLabel}\" para \"{$toLabel}\".");
            }
            Order::updateStatus($id, $to);
            $pdo->commit();
        } catch (Throwable $exception) {
            $pdo->rollBack();
            throw $exception;
        }
        return ['order' => $order, 'from' => $from, 'to' => $to];
    }

    /** Linhas do carrinho validadas e somadas (mesmo produto e tamanho viram uma linha). */
    private static function cartLines(mixed $items): array
    {
        if (!is_array($items) || !array_is_list($items) || !$items) {
            throw new ValidationException('Seu carrinho está vazio.');
        }
        $lines = [];
        foreach ($items as $item) {
            $slug = is_array($item) && is_string($item['productId'] ?? null) ? $item['productId'] : '';
            $size = is_array($item) && is_string($item['size'] ?? null) ? $item['size'] : '';
            $quantity = is_array($item) ? ($item['quantity'] ?? null) : null;
            if (!preg_match(self::SLUG_PATTERN, $slug) || strlen($slug) > 80 || !in_array($size, Product::SIZES, true)
                || !is_int($quantity) || $quantity < 1 || $quantity > self::MAX_QUANTITY) {
                throw new ValidationException('O carrinho tem um item inválido. Recarregue a página e tente novamente.');
            }
            $key = "{$slug}|{$size}";
            $lines[$key] ??= ['slug' => $slug, 'size' => $size, 'quantity' => 0];
            $lines[$key]['quantity'] += $quantity;
            if ($lines[$key]['quantity'] > self::MAX_QUANTITY) {
                throw new ValidationException('Cada item pode ter no máximo ' . self::MAX_QUANTITY . ' unidades.');
            }
        }
        if (count($lines) > self::MAX_LINES) {
            throw new ValidationException('O pedido pode ter no máximo ' . self::MAX_LINES . ' itens diferentes.');
        }
        return array_values($lines);
    }

    /** Endereço de entrega validado e normalizado (campos do banco). */
    private static function address(array $input): array
    {
        $errors = [];
        $digits = preg_replace('/\D/', '', Response::text($input, 'postalCode'));
        if (strlen($digits) !== 8) {
            $errors['postalCode'] = 'Informe um CEP com 8 números.';
        }
        $state = strtoupper(Input::line($input, 'state'));
        if (!in_array($state, self::STATES, true)) {
            $errors['state'] = 'Escolha o estado.';
        }
        $city = Input::line($input, 'city');
        if (mb_strlen($city) < 2 || mb_strlen($city) > 80 || !preg_match(self::CITY_PATTERN, $city)) {
            $errors['city'] = 'Informe a cidade (somente letras).';
        }
        $street = Input::line($input, 'address');
        if (mb_strlen($street) < 3 || mb_strlen($street) > 160 || !preg_match(self::ADDRESS_PATTERN, $street)) {
            $errors['address'] = 'Informe o endereço (rua, avenida...), com até 160 caracteres.';
        }
        $number = strtoupper(Input::line($input, 'number'));
        if ($number === '' || strlen($number) > 10 || !preg_match(self::NUMBER_PATTERN, $number)) {
            $errors['number'] = 'Informe o número (ou S/N), com até 10 caracteres.';
        }
        if ($errors) {
            throw new ValidationException('Confira os dados de entrega destacados.', $errors);
        }
        return [
            'postal_code' => substr($digits, 0, 5) . '-' . substr($digits, 5),
            'state' => $state,
            'city' => $city,
            'address' => $street,
            'address_number' => $number,
        ];
    }

    /** Resumo devolvido ao checkout depois de gravar. */
    private static function confirmation(array $order): array
    {
        return [
            'id' => (int) $order['id'],
            'status' => $order['status'],
            'statusLabel' => Order::STATUSES[$order['status']],
            'subtotal' => (int) $order['subtotal_cents'],
            'discount' => (int) $order['discount_cents'],
            'total' => (int) $order['total_cents'],
            'createdAt' => $order['created_at'],
        ];
    }

    /** Pedido no formato da API "Meus pedidos". */
    private static function publicView(array $order, array $items): array
    {
        return self::confirmation($order) + [
            'address' => [
                'postalCode' => $order['postal_code'],
                'state' => $order['state'],
                'city' => $order['city'],
                'address' => $order['address'],
                'number' => $order['address_number'],
            ],
            'items' => array_map(static fn (array $item): array => [
                'productId' => $item['product_slug'],
                'name' => $item['product_name'],
                'image' => $item['product_image'],
                'team' => $item['team_slug'],
                'available' => (bool) $item['product_active'],
                'size' => $item['size'],
                'quantity' => (int) $item['quantity'],
                'unitPrice' => (int) $item['unit_price_cents'],
            ], $items),
        ];
    }
}
