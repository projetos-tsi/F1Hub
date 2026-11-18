<?php
declare(strict_types=1);

/**
 * O pedido não pode ser concluído porque algo mudou desde que a página foi aberta
 * (ex.: preço alterado pelo admin, produto desativado, situação do pedido já alterada).
 * A API responde 409 e o front-end atualiza a tela antes de tentar de novo.
 */
final class ConflictException extends RuntimeException
{
}
