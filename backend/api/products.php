<?php
/**
 * API do catálogo da loja (somente leitura, pública).
 *
 *   GET products.php → { teams: [...], categories: [...], products: [...] }
 *
 * - Só produtos ATIVOS: o que o admin desativa ou exclui some da loja;
 * - Preços em centavos (os mesmos que o checkout usa para recalcular o pedido no servidor);
 * - pilot = null quando é um produto da equipe, sem piloto.
 */
require __DIR__ . '/../bootstrap.php';

Response::allowMethods(['GET']);

try {
    $teams = array_map(static fn (array $team): array => [
        'slug' => $team['slug'],
        'name' => $team['name'],
        'label' => $team['label'],
        'color' => $team['color'],
    ], Team::all());

    $categories = array_map(static fn (array $category): array => [
        'name' => $category['name'],
        'description' => $category['description'],
        'details' => Input::lines($category, 'details'),
    ], Category::storefront());

    $products = array_map(static fn (array $product): array => [
        'id' => $product['slug'],
        'team' => $product['team_slug'],
        'category' => $product['category_name'],
        'pilot' => $product['pilot'],
        'name' => $product['name'],
        'image' => $product['image'],
        'price' => (int) $product['price_cents'],
        'oldPrice' => $product['old_price_cents'] === null ? null : (int) $product['old_price_cents'],
        'sizes' => $product['sizes'] === null ? [] : explode(',', $product['sizes']),
    ], Product::storefront());

    Response::json(['teams' => $teams, 'categories' => $categories, 'products' => $products]);
} catch (Throwable $exception) {
    error_log('[F1Hub] products: ' . $exception->getMessage());
    Response::error('Não foi possível carregar os produtos agora. Tente novamente em instantes.', 503);
}
