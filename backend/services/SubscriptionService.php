<?php
declare(strict_types=1);

/**
 * Regras da assinatura F1Hub Box (serviço contratado do projeto).
 *
 * - Exige login; pagamento simulado (nada é cobrado);
 * - Uma assinatura ATIVA por cliente: assinar de novo com outro plano/equipe/tamanho ALTERA a atual;
 * - Só planos ativos podem ser escolhidos (quem já assina um plano desativado continua com ele até trocar);
 * - Equipe: uma das equipes do banco ou "surpresa" (todas as equipes; gravada como NULL);
 * - Tamanho da camiseta obrigatório quando o plano inclui camiseta; nos outros planos fica vazio;
 * - Cancelar muda a situação para "cancelada" e registra a data (o histórico é preservado).
 */
final class SubscriptionService
{
    public const SHIRT_SIZES = ['P', 'M', 'G', 'GG'];
    public const SURPRISE = 'surpresa';

    /** Planos ativos no formato da página da assinatura. */
    public static function plans(): array
    {
        return array_map(static fn (array $plan): array => [
            'id' => $plan['slug'],
            'name' => $plan['name'],
            'tagline' => $plan['tagline'],
            'price' => (int) $plan['price_cents'],
            'items' => Input::lines($plan, 'items'),
            'includesShirt' => (bool) $plan['includes_shirt'],
            'highlight' => (bool) $plan['highlight'],
        ], Plan::storefront());
    }

    /** Assinatura ativa do cliente e a última cancelada (para "Minha conta"). */
    public static function forUser(int $userId): array
    {
        $active = Subscription::activeForUser($userId);
        $cancelled = $active ? null : Subscription::lastCancelledForUser($userId);
        return [
            'subscription' => $active ? self::publicView($active) : null,
            'lastCancelled' => $cancelled ? self::publicView($cancelled) : null,
        ];
    }

    /**
     * Assina (ou altera a assinatura ativa).
     * @return array{subscription: array, created: bool, changed: bool}
     */
    public static function subscribe(array $user, array $input): array
    {
        $errors = [];
        $planSlug = Response::text($input, 'plan');
        $plan = preg_match('/^[a-z0-9-]{1,40}$/', $planSlug) ? Plan::activeBySlug($planSlug) : null;
        if (!$plan) {
            $errors['plan'] = 'Escolha um dos planos disponíveis.';
        }

        $teamSlug = Response::text($input, 'team');
        $teamId = null;
        if ($teamSlug !== self::SURPRISE) {
            $teamId = preg_match('/^[a-z0-9-]{1,30}$/', $teamSlug) ? Team::idBySlug($teamSlug) : null;
            if ($teamId === null) {
                $errors['team'] = 'Escolha a equipe favorita (ou Surpresa).';
            }
        }

        $size = Response::text($input, 'shirtSize');
        if ($plan && $plan['includes_shirt']) {
            if (!in_array($size, self::SHIRT_SIZES, true)) {
                $errors['shirtSize'] = 'Escolha o tamanho da camiseta.';
            }
        } else {
            $size = null; // plano sem camiseta: tamanho não se aplica
        }

        if ($errors) {
            throw new ValidationException('Confira as escolhas da sua box.', $errors);
        }

        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            // Trava a linha do cliente: duas abas assinando ao mesmo tempo não criam duas assinaturas ativas.
            $pdo->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE')->execute([(int) $user['id']]);
            $current = Subscription::activeForUser((int) $user['id'], true);

            $created = false;
            $changed = false;
            if (!$current) {
                Subscription::create((int) $user['id'], (int) $plan['id'], $teamId, $size);
                $created = true;
            } elseif ($current['plan_slug'] !== $plan['slug'] || $current['team_slug'] !== ($teamId === null ? null : $teamSlug) || $current['shirt_size'] !== $size) {
                Subscription::change((int) $current['id'], (int) $plan['id'], $teamId, $size);
                $changed = true;
            }
            $pdo->commit();
        } catch (Throwable $exception) {
            $pdo->rollBack();
            throw $exception;
        }

        return [
            'subscription' => self::publicView(Subscription::activeForUser((int) $user['id'])),
            'created' => $created,
            'changed' => $changed,
        ];
    }

    /** Cancela a assinatura ativa do cliente. */
    public static function cancel(array $user): array
    {
        $current = Subscription::activeForUser((int) $user['id']);
        if (!$current) {
            throw new ValidationException('Você não tem uma assinatura ativa para cancelar.');
        }
        Subscription::cancel((int) $current['id']);
        return self::forUser((int) $user['id']);
    }

    private static function publicView(array $subscription): array
    {
        return [
            'id' => (int) $subscription['id'],
            'status' => $subscription['status'],
            'plan' => [
                'id' => $subscription['plan_slug'],
                'name' => $subscription['plan_name'],
                'price' => (int) $subscription['price_cents'],
                'items' => Input::lines($subscription, 'items'),
                'includesShirt' => (bool) $subscription['includes_shirt'],
                'available' => (bool) $subscription['plan_active'],
            ],
            'team' => $subscription['team_slug'] === null
                ? ['id' => self::SURPRISE, 'name' => 'Surpresa', 'color' => null]
                : ['id' => $subscription['team_slug'], 'name' => $subscription['team_name'], 'color' => $subscription['team_color']],
            'shirtSize' => $subscription['shirt_size'],
            'startedAt' => $subscription['started_at'],
            'cancelledAt' => $subscription['cancelled_at'],
        ];
    }
}
