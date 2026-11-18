<?php
/**
 * Admin — exporta a lista de pedidos em CSV (abre no Excel/Planilhas).
 *
 * Usa os mesmos filtros da tela de pedidos (?status= e ?q=). Somente leitura.
 * - separador ";" e BOM UTF-8: o Excel em português abre com acentos e colunas certas;
 * - valores em reais com vírgula decimal;
 * - células que começam com = + - @ recebem um apóstrofo (evita "injeção de fórmula" no Excel).
 */
require __DIR__ . '/includes/admin.php';

const CSV_MAX_ROWS = 5000;

$status = Input::line($_GET, 'status');
$status = isset(Order::STATUSES[$status]) ? $status : '';
$q = mb_substr(Input::line($_GET, 'q'), 0, 80);

try {
    $orders = Order::search($status, CSV_MAX_ROWS, 0, $q);
} catch (Throwable $exception) {
    admin_fail($exception, 'pedidos-csv');
}

/** Texto seguro para planilha: neutraliza fórmulas e mantém o resto como está. */
function csv_cell(mixed $value): string
{
    $text = (string) ($value ?? '');
    return preg_match('/^[=+\-@\t\r]/', $text) ? "'" . $text : $text;
}

$money = static fn ($cents): string => number_format(((int) $cents) / 100, 2, ',', '');
$file = 'pedidos-f1hub-' . date('Y-m-d') . ($status ? "-{$status}" : '') . '.csv';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $file . '"');

$out = fopen('php://output', 'wb');
fwrite($out, "\xEF\xBB\xBF");
fputcsv($out, ['Pedido', 'Data', 'Situação', 'Cliente', 'E-mail', 'Itens', 'Cidade', 'UF', 'Subtotal (R$)', 'Desconto PIX (R$)', 'Total (R$)', 'Pagamento'], ';');
foreach ($orders as $order) {
    fputcsv($out, [
        (int) $order['id'],
        View::dateTime($order['created_at']),
        Order::STATUSES[$order['status']] ?? $order['status'],
        csv_cell($order['user_name']),
        csv_cell($order['user_email']),
        (int) $order['item_count'],
        csv_cell($order['city']),
        $order['state'],
        $money($order['subtotal_cents']),
        $money($order['discount_cents']),
        $money($order['total_cents']),
        'PIX (simulado)',
    ], ';');
}
fclose($out);
