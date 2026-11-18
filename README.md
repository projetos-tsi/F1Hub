# F1 Hub 🏎️

Projeto Integrador do curso de **Tecnologia em Sistemas para Internet (Senac)**.

O **F1 Hub** é um e-commerce de produtos das equipes de Fórmula 1 (camisetas, polos, moletons, jaquetas, blusas e bonés) com um **serviço de assinatura mensal — a F1Hub Box**: o cliente escolhe um plano e a equipe favorita e recebe todo mês uma caixa com mimos colecionáveis.

> Projeto acadêmico: os pagamentos são **simulados** (PIX com 5% de desconto). Nenhum valor é cobrado.

## Requisitos do projeto final

| Requisito | Como o F1 Hub atende |
|---|---|
| Tela de login com autenticação via banco | Cadastro e login reais na tabela `users` (`password_hash`/`password_verify`, sessão PHP com cookie `HttpOnly`, "Lembrar de mim") |
| Área administrativa protegida | `frontend/pages/admin/` — só contas com `role = admin` (papel conferido no banco a cada página); visitante vai para o login, cliente comum recebe "Acesso restrito" |
| Pelo menos duas entidades relacionadas | 9 tabelas com chaves estrangeiras: `users`, `plans`, `subscriptions`, `teams`, `categories`, `products`, `product_sizes`, `orders`, `order_items` |
| CRUD completo de uma entidade principal | **Produtos** e **planos**: criar, listar (com filtros), editar, ativar/desativar e excluir no admin |
| Front-end, back-end e banco integrados | A loja lê o catálogo do banco; o checkout grava pedidos; a assinatura é contratada, alterada e cancelada; "Minha conta" mostra pedidos e assinatura; o admin muda a situação dos pedidos |
| Interface funcional e consistente | Mesma identidade visual em loja, conta e admin; responsivo do celular (320 px) ao desktop |

## Funcionalidades

**Loja**
- Home com banner, lançamentos, mais vendidos, pilotos, modelagens e promoções.
- Catálogo completo com filtros (equipe, tamanho, categoria, piloto) e ordenação; páginas das 5 equipes; busca instantânea.
- Página de produto com tamanhos, guia de medidas e produtos similares.
- Carrinho no navegador (até 10 unidades por item); itens que deixam de ser vendidos saem com aviso.
- Checkout com login: endereço de entrega, PIX simulado com 5% de desconto, número do pedido. O total é **sempre recalculado no servidor** com os preços do banco.

**Assinatura F1Hub Box**
- Planos vindos do banco (destaque "Mais escolhido" definido no admin).
- Monte sua box: plano, equipe (ou Surpresa) e tamanho da camiseta; assinar, alterar e cancelar.

**Minha conta**
- Dados do cliente, histórico de pedidos com linha do tempo da situação e a assinatura atual.

**Área administrativa**
- Painel com receita, pedidos a processar, assinaturas ativas e receita mensal.
- CRUD de produtos (prévia ao vivo do card) e de planos (prévia do card da assinatura).
- Pedidos: lista por situação, detalhe e troca de situação (recebido → pago → enviado → entregue, ou cancelado antes do envio).
- Listas de assinaturas e usuários.

## Como rodar (XAMPP)

Requisitos: **XAMPP com PHP 8.1 ou superior** (Apache + MySQL/MariaDB).

1. Clone o repositório dentro de `C:\xampp\htdocs` (ou baixe o ZIP e renomeie a pasta para `F1Hub`):
   ```bash
   git clone https://github.com/projetos-tsi/F1Hub.git
   ```
2. No painel do XAMPP, inicie **Apache** e **MySQL**.
3. Abra **`http://localhost/F1Hub/instalar.php`** e clique em **Instalar banco de dados** (cria o banco `f1hub`, as tabelas e os dados iniciais em um clique).
4. Acesse **`http://localhost/F1Hub/`**.

Instalação manual pelo phpMyAdmin e detalhes do banco: [`database/README.md`](database/README.md).
Publicação em uma hospedagem online (e por que o GitHub Pages não serve para este projeto): [`docs/PUBLICACAO.md`](docs/PUBLICACAO.md).

### Contas para teste (somente ambiente local)

| Perfil | Como acessar |
|---|---|
| Administrador | `admin@f1hub.test` / `F1HubAdmin2026` → abre o painel do admin |
| Cliente | Crie uma conta em "Criar conta" |

## Tecnologias

HTML5, CSS3 e JavaScript (módulos ES, sem frameworks) · PHP 8 (PDO, sessões) · MySQL/MariaDB · Apache (XAMPP).

## Estrutura

```text
backend/
  api/        Endpoints JSON usados pela loja (auth, products, orders, subscriptions)
  core/       Infraestrutura: conexão PDO, sessão, CSRF, respostas, validação
  models/     SQL de cada tabela (PDO com prepared statements)
  services/   Regras de negócio (pedidos, assinatura, CRUDs, acesso ao admin)
  config/     database.php (fora do Git; criado pelo instalador)
database/     database.sql (estrutura) e seeds/dados_iniciais.sql
docs/         Documentação do projeto e do professor
frontend/
  index.php   Home da loja
  pages/admin Área administrativa (PHP renderizado no servidor)
  src/pages   Páginas da loja (HTML)
  src/style   CSS por página
  js/         Módulos JavaScript (serviços, páginas, componentes)
instalar.php  Instalador local do banco
```

Mais detalhes em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) e [`docs/INTEGRACAO_F1_HUB.md`](docs/INTEGRACAO_F1_HUB.md).

## Segurança

Senhas só como hash · consultas com *prepared statements* · token CSRF em toda alteração · saída escapada (`htmlspecialchars` / `escapeHtml`) · sessão com `HttpOnly` e `SameSite=Lax`, ID renovado no login · pastas internas do backend bloqueadas no Apache · preços e totais calculados no servidor · erros técnicos só no log.

## Equipe

Felipe Santana, Douglas Saragoza, Matheus Almeida e Murilo Calixto.

## Status

✅ Funcionalidades do projeto final concluídas (autenticação, admin com CRUDs, loja integrada ao banco, pedidos e assinatura).
