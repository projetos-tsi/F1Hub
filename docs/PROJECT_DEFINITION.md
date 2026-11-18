# Definição do Projeto

> Identidade do grupo, proposta da aplicação e principais dados da Atividade 01.

## Equipe

**Nome da equipe:** F1 Hub

**Integrantes:**

| Nome | GitHub | Responsabilidade |
|---|---|---|
| Felipe Santana | *(a preencher pela equipe)* | *(a preencher pela equipe)* |
| Douglas Saragoza | *(a preencher pela equipe)* | *(a preencher pela equipe)* |
| Matheus Almeida | *(a preencher pela equipe)* | *(a preencher pela equipe)* |
| Murilo Calixto | *(a preencher pela equipe)* | *(a preencher pela equipe)* |

## Aplicação

**Nome:** F1 Hub

**Segmento:** comércio eletrônico de produtos de equipes de Fórmula 1 com serviço de assinatura mensal (F1Hub Box).

**Problema:** fãs de Fórmula 1 no Brasil encontram os produtos das equipes espalhados em lojas diferentes, sem um lugar que reúna todas as equipes, filtros por piloto e uma forma recorrente de colecionar itens da equipe favorita.

**Público-alvo:** torcedores e colecionadores de Fórmula 1, de iniciantes a fãs antigos, que compram pelo celular ou computador.

**Objetivo:** oferecer uma loja única com os produtos das 5 equipes (Ferrari, Mercedes, Red Bull, McLaren e Williams) e o **serviço contratado** F1Hub Box, em que o cliente escolhe um plano mensal e a equipe favorita e recebe uma caixa surpresa todo mês. A equipe da loja gerencia catálogo, planos, pedidos e assinaturas pela área administrativa.

## Funcionalidades

- Cadastro, login e "Minha conta" (pedidos e assinatura);
- Catálogo com filtros, páginas por equipe, busca e página de produto;
- Carrinho e checkout com PIX simulado (5% de desconto);
- Contratação, alteração e cancelamento da assinatura F1Hub Box;
- Área administrativa protegida: painel, CRUD de produtos e de planos, pedidos (com troca de situação), assinaturas e usuários.

## Entidades do banco

1. `users` — clientes e administradores
2. `plans` — planos da F1Hub Box
3. `subscriptions` — assinaturas (contratação do serviço)
4. `products`, `product_sizes`, `teams`, `categories` — catálogo
5. `orders`, `order_items` — pedidos da loja

**Relacionamentos principais:**

```text
users (1) -------- (N) subscriptions (N) -------- (1) plans
users (1) -------- (N) orders (1) -------- (N) order_items (N) -------- (1) products
teams (1) -------- (N) products (N) -------- (1) categories
products (1) ----- (N) product_sizes
teams (1) -------- (N) subscriptions   (equipe favorita; vazio = Surpresa)
```

## Links

- Repositório: https://github.com/projetos-tsi/F1Hub
- Figma: *(a preencher pela equipe)*
- Board: *(a preencher pela equipe)*
- Organization: https://github.com/projetos-tsi
