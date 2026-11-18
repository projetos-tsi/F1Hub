<?php
declare(strict_types=1);

/**
 * Leitura e normalização de campos de formulário (área administrativa).
 */
final class Input
{
    /** Maior valor aceito em campos de preço: R$ 99.999,99. */
    public const MAX_CENTS = 9_999_999;

    /** Texto do campo, sem espaços nas pontas e com espaços repetidos reduzidos a um. Listas viram vazio. */
    public static function line(array $source, string $key): string
    {
        $value = $source[$key] ?? '';
        return is_string($value) ? trim((string) preg_replace('/\s+/u', ' ', $value)) : '';
    }

    /** Texto com várias linhas: limpa cada linha e descarta as vazias. @return string[] */
    public static function lines(array $source, string $key): array
    {
        $value = $source[$key] ?? '';
        if (!is_string($value)) {
            return [];
        }
        $lines = array_map(static fn (string $line): string => trim((string) preg_replace('/\s+/u', ' ', $line)), preg_split('/\R/u', $value) ?: []);
        return array_values(array_filter($lines, static fn (string $line): bool => $line !== ''));
    }

    /** Inteiro positivo (ids de selects) ou 0. */
    public static function id(array $source, string $key): int
    {
        $value = $source[$key] ?? '';
        return is_string($value) && preg_match('/^[1-9]\d{0,9}$/', $value) ? (int) $value : 0;
    }

    /** Lista de textos (checkboxes com name="campo[]"). @return string[] */
    public static function list(array $source, string $key): array
    {
        $value = $source[$key] ?? [];
        return is_array($value) ? array_values(array_filter($value, 'is_string')) : [];
    }

    /** Checkbox marcado. */
    public static function checked(array $source, string $key): bool
    {
        return ($source[$key] ?? '') === '1';
    }

    /**
     * Converte preço digitado em centavos. Aceita "209,90", "209.90", "1.299,90", "R$ 209", "209".
     * Devolve null quando o texto não é um preço válido.
     */
    public static function moneyToCents(string $value): ?int
    {
        $value = preg_replace('/^R\$\s*/u', '', trim($value));
        if (preg_match('/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/', $value)) {
            $value = str_replace(['.', ','], ['', '.'], $value);       // 1.299,90
        } elseif (preg_match('/^\d+,\d{1,2}$/', $value)) {
            $value = str_replace(',', '.', $value);                    // 209,90
        } elseif (!preg_match('/^\d+(\.\d{1,2})?$/', $value)) {
            return null;                                               // 209.90 ou 209 seguem; o resto é inválido
        }

        [$reais, $fraction] = explode('.', $value) + [1 => ''];
        if (strlen(ltrim($reais, '0')) > 5) {
            return null;                                               // evita números gigantes
        }
        return (int) $reais * 100 + (int) str_pad($fraction, 2, '0');
    }

    /** "Camisa Polo Ferrari 2026" → "camisa-polo-ferrari-2026"; com $maxLength, corta no limite sem terminar em hífen. */
    public static function slug(string $text, int $maxLength = 0): string
    {
        $map = [
            'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i', 'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
            'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ç' => 'c', 'ñ' => 'n',
        ];
        $text = strtr(mb_strtolower($text), $map);
        $text = (string) preg_replace('/[^a-z0-9]+/', '-', $text);
        $text = trim($text, '-');
        return $maxLength > 0 ? rtrim(substr($text, 0, $maxLength), '-') : $text;
    }
}
