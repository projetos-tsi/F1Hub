<?php
declare(strict_types=1);

/**
 * Funções de apoio às páginas PHP renderizadas no servidor (área administrativa).
 *
 * Toda informação vinda do banco ou do usuário passa por View::e() antes de ir para o HTML.
 */
final class View
{
    /** Escapa texto para HTML (conteúdo e atributos). */
    public static function e(mixed $value): string
    {
        return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /** 20990 → "R$ 209,90" */
    public static function money(int|string|null $cents): string
    {
        return 'R$ ' . number_format(((int) $cents) / 100, 2, ',', '.');
    }

    /** 20990 → "209,90" (valor para preencher campos de formulário). */
    public static function moneyInput(int|string|null $cents): string
    {
        return $cents === null || $cents === '' ? '' : number_format(((int) $cents) / 100, 2, ',', '');
    }

    /** "2026-11-18 14:05:00" → "18/11/2026 14:05" */
    public static function dateTime(?string $value): string
    {
        if (!$value) {
            return '—';
        }
        $date = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $value);
        return $date ? $date->format('d/m/Y H:i') : self::e($value);
    }

    /** Redireciona (303: o navegador abre a página com GET, sem reenviar o formulário). */
    public static function redirect(string $url): never
    {
        header('Location: ' . $url, true, 303);
        exit;
    }

    /** Cabeçalhos de segurança das páginas do admin. */
    public static function securityHeaders(): void
    {
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: no-store');           // páginas com dados internos não ficam em cache
        header('X-Frame-Options: DENY');              // impede abrir o admin dentro de outro site (clickjacking)
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: same-origin');
    }
}
