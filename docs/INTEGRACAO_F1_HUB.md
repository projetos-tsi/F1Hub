# Integração do F1 Hub

O template do professor foi mantido como base do projeto e completado com o back-end e o banco.

| Pasta | Conteúdo |
|---|---|
| `frontend/` | Loja (HTML + CSS + módulos JavaScript) e área administrativa (`frontend/pages/admin/`, PHP renderizado no servidor) |
| `backend/api/` | Endpoints JSON usados pela loja — fazem o papel dos *controllers* do template |
| `backend/services/` | Regras de negócio |
| `backend/models/` | SQL de cada tabela (PDO) |
| `backend/core/` | Conexão, sessão, CSRF, respostas, validação |
| `database/` | `database.sql` (estrutura) e `seeds/dados_iniciais.sql` |
| `instalar.php` | Instalador local do banco em um clique |

## Como abrir no XAMPP

1. Coloque a pasta do projeto em `C:\xampp\htdocs\F1Hub`.
2. Inicie **Apache** e **MySQL** no painel do XAMPP.
3. Abra `http://localhost/F1Hub/instalar.php` e clique em **Instalar banco de dados**.
4. Abra `http://localhost/F1Hub/`. O `index.php` da raiz redireciona para `frontend/`, que abre a home.

## Como as partes conversam

```text
Página da loja (HTML) ── módulo JS ── fetch JSON ──> backend/api/*.php ──> services ──> models ──> MySQL
Área administrativa (PHP) ─────────────────────────────────────────────> services ──> models ──> MySQL
```

| Fluxo | Front-end | API / página | Tabelas |
|---|---|---|---|
| Cadastro, login, sair | `cadastro.js`, `login-page.js`, `auth-service.js` | `api/auth.php` | `users` |
| Catálogo, busca, equipes, produto | `catalog-service.js` + páginas | `api/products.php` | `products`, `product_sizes`, `teams`, `categories` |
| Checkout e "Meus pedidos" | `checkout-page.js`, `account-page.js` | `api/orders.php` | `orders`, `order_items` |
| Assinatura F1Hub Box | `subscription-page.js`, `account-page.js` | `api/subscriptions.php` | `plans`, `subscriptions` |
| Administração | — | `frontend/pages/admin/*.php` | todas |

## Regras importantes

- O carrinho fica no navegador; no checkout o servidor recalcula o total com os preços do banco (preço enviado pelo navegador é ignorado).
- Toda requisição que altera dados exige login e token CSRF.
- Produto ou plano já usado em pedidos/assinaturas não é excluído, só desativado (histórico preservado).
- Pagamentos são simulados (projeto acadêmico).

## Antigo x atual

As rotas `frontend/pages/login.php` e `frontend/pages/cadastro.php` do template continuam existindo como atalhos; o login e o cadastro reais acontecem pelas páginas `frontend/src/pages/login.html` e `cadastro.html`, que conversam com `backend/api/auth.php`.
