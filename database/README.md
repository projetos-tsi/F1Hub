# Banco de Dados — F1 Hub

Estrutura MySQL/MariaDB do F1 Hub, versionada para que qualquer integrante (ou o professor) consiga recriar o banco no XAMPP.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `database.sql` | Cria o banco `f1hub` e as 9 tabelas, com chaves primárias, estrangeiras e regras (`CHECK`). |
| `seeds/dados_iniciais.sql` | 5 equipes, 6 categorias, 45 produtos (com tamanhos e promoções), 3 planos da F1Hub Box e 1 administrador de teste. Pode ser importado mais de uma vez: só insere o que **ainda não existe** e nunca altera nem apaga dados já cadastrados (inclusive os editados no admin). |

Requisitos: XAMPP com MySQL/MariaDB e **PHP 8.1 ou superior**. Os scripts e a conexão do PHP ativam o **modo estrito** do MySQL (o XAMPP vem sem ele), para que valores inválidos sejam recusados em vez de gravados "consertados".

## Modelo de dados

```text
users      (1) ──< (N) subscriptions (N) >── (1) plans
users      (1) ──< (N) orders (1) ──< (N) order_items (N) >── (1) products
teams      (1) ──< (N) products (N) >── (1) categories
products   (1) ──< (N) product_sizes
teams      (1) ──< (N) subscriptions   (equipe favorita; NULL = Surpresa)
```

- Valores em dinheiro ficam em **centavos** (`price_cents`), sem erros de arredondamento.
- Senhas ficam somente como **hash** (`password_hash()` do PHP).
- Produtos e planos já usados em pedidos ou assinaturas não podem ser apagados, apenas desativados. Usuários com pedidos ou assinaturas também não podem ser apagados (histórico preservado).
- O banco confere sozinho regras como preço maior que zero, preço "de" maior que o preço e total do pedido = subtotal − desconto.

## Instalação no XAMPP

1. Inicie **Apache** e **MySQL** no painel do XAMPP.
2. Abra `http://localhost/phpmyadmin`, aba **Importar**:
   1. importe `database/database.sql`;
   2. depois importe `database/seeds/dados_iniciais.sql`.

   Pelo terminal (alternativa):

   ```bash
   mysql -u root < database/database.sql
   mysql -u root < database/seeds/dados_iniciais.sql
   ```

3. Copie `backend/config/database.example.php` para `backend/config/database.php` (ajuste usuário e senha se o seu MySQL não usar o padrão do XAMPP).
4. Confira em `http://localhost/F1Hub/backend/api/health.php` (só responde no próprio computador): deve mostrar `"ok": true` com a contagem de cada tabela.

> Use sempre o **Apache** do XAMPP. O servidor embutido do PHP (`php -S`) ignora os arquivos `.htaccess` que bloqueiam as pastas internas do backend e os scripts SQL.

## Administrador de teste (somente ambiente local)

| Campo | Valor |
|---|---|
| E-mail | `admin@f1hub.test` |
| Senha | `F1HubAdmin2026` |

Conta criada para a avaliação da área administrativa no ambiente local. **Não use estas credenciais fora do computador de desenvolvimento**; em qualquer outro ambiente, troque a senha.

Área administrativa: `http://localhost/F1Hub/frontend/pages/admin/` — ao entrar com esta conta pela tela de login, o painel abre automaticamente. Contas comuns (`role = user`) recebem "Acesso restrito"; visitantes são levados ao login.

## Regras

- Não exporte dados pessoais reais;
- Não adicione senhas em texto puro;
- Mantenha `database.sql` e os seeds atualizados quando a estrutura mudar.
