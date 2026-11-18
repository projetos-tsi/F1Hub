# Arquitetura Inicial

> Este documento explica a função das pastas do template e o fluxo básico entre interface, PHP e banco de dados.

## Para que serve

Use esta referência para orientar a organização do código e evitar misturar interface, regra de negócio e SQL no mesmo arquivo.

## Estrutura

```text
frontend/   → interface e páginas
backend/    → regras de negócio e acesso a dados
database/   → scripts SQL
docs/       → documentação
.github/    → governança do repositório
```

## Princípio da organização

Evite concentrar HTML, consultas SQL, regras de negócio e estilos em um único arquivo. A estrutura poderá evoluir durante a disciplina conforme novos conceitos forem apresentados.

## Fluxo conceitual

```text
Usuário
  ↓
Interface (HTML/CSS/Bootstrap)
  ↓
PHP
  ↓
MySQL
```

## Arquitetura do F1 Hub (implementada)

A organização segue a separação em camadas sugerida acima (interface, regra de negócio e acesso a dados em arquivos diferentes):

```text
Navegador
  │
  ├─ Loja (HTML + CSS + módulos JS) ── fetch JSON ──> backend/api/*.php      ← entrada HTTP (papel de controller)
  │                                                       │
  └─ Área administrativa (frontend/pages/admin/*.php) ────┤                  ← PHP renderizado no servidor
                                                          ▼
                                              backend/services/*.php         ← regras de negócio
                                                          ▼
                                              backend/models/*.php           ← SQL com PDO (prepared statements)
                                                          ▼
                                                       MySQL (banco f1hub)
```

| Camada | Arquivos | Responsabilidade |
|---|---|---|
| Interface da loja | `frontend/src/pages/*.html`, `frontend/js/pages/*.js`, `frontend/js/ui/*.js` | Telas e interação; nunca decide preço ou permissão |
| Serviços do front | `frontend/js/services/*.js` | Única parte do JS que conversa com a API (catálogo, carrinho, autenticação, pedidos, assinatura) |
| API | `backend/api/auth.php`, `products.php`, `orders.php`, `subscriptions.php` | Método HTTP, login, token CSRF, conversão para JSON |
| Admin | `frontend/pages/admin/*.php` + `includes/` | Proteção por sessão antes de qualquer HTML; formulários com token CSRF |
| Regras | `backend/services/*.php` | Validação e regras (ex.: total do pedido, uma assinatura ativa, CRUDs) |
| Dados | `backend/models/*.php` | Somente SQL |
| Núcleo | `backend/core/*.php` | Conexão (modo estrito), sessão, CSRF, respostas, escapes, mensagens |

Decisões técnicas principais:

- **Dinheiro em centavos** (`INT`) para evitar erros de arredondamento.
- **Total do pedido recalculado no servidor**; o banco também confere `total = subtotal − desconto`.
- **Histórico preservado**: produtos e planos usados não são apagados (`ON DELETE RESTRICT`), apenas desativados.
- **Transações** com travas de linha onde há concorrência (fechar pedido, assinar, mudar situação).
