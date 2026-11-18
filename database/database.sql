-- ==========================================================
-- F1 HUB — ESTRUTURA DO BANCO DE DADOS
-- MySQL / MariaDB · phpMyAdmin · XAMPP
-- ==========================================================
-- Como usar:
--   1. Importe este arquivo no phpMyAdmin (ou: mysql -u root < database.sql).
--   2. Em seguida importe database/seeds/dados_iniciais.sql.
--
-- Relacionamentos principais:
--   users      (1) ──< (N) subscriptions (N) >── (1) plans
--   users      (1) ──< (N) orders (1) ──< (N) order_items (N) >── (1) products
--   teams      (1) ──< (N) products (N) >── (1) categories
--   products   (1) ──< (N) product_sizes
--   teams      (1) ──< (N) subscriptions   (equipe favorita; NULL = Surpresa)
--
-- Valores monetários são guardados em centavos (INT) para evitar
-- erros de arredondamento com números decimais.
--
-- Regras de exclusão:
--   RESTRICT — não apaga o "pai" se houver registros ligados (histórico preservado):
--              usuários com pedidos ou assinaturas, equipes e categorias com produtos,
--              produtos já vendidos, planos com assinaturas, equipes escolhidas em assinaturas.
--   CASCADE  — apaga junto apenas o que não existe sozinho: tamanhos do produto e itens do pedido.
-- Produtos e planos fora de venda são DESATIVADOS (active = 0), não apagados.
-- ==========================================================

-- Modo estrito: valores inválidos geram erro em vez de serem gravados "consertados".
SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS f1hub
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE f1hub;

-- ----------------------------------------------------------
-- Usuários (clientes e administradores)
-- A senha é guardada somente como hash gerado por password_hash().
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Equipes de Fórmula 1
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(30) NOT NULL,
    name VARCHAR(60) NOT NULL,
    label VARCHAR(80) NOT NULL,
    color CHAR(7) NOT NULL,
    CONSTRAINT uq_teams_slug UNIQUE (slug)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Categorias de produto (Camisa Polo, Boné, Jaqueta...)
-- details: um item por linha, exibidos na página do produto.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    description TEXT NOT NULL,
    details TEXT NOT NULL,
    CONSTRAINT uq_categories_name UNIQUE (name)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Produtos da loja
-- slug: identificador usado nas URLs (produto.html?id=slug).
-- old_price_cents: preço "de" (riscado); NULL quando não está em promoção.
-- pilot: NULL quando é um produto da equipe, sem piloto.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(80) NOT NULL,
    team_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    pilot VARCHAR(80) NULL,
    name VARCHAR(160) NOT NULL,
    image VARCHAR(120) NOT NULL,
    price_cents INT UNSIGNED NOT NULL,
    old_price_cents INT UNSIGNED NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_products_slug UNIQUE (slug),
    CONSTRAINT fk_products_team FOREIGN KEY (team_id) REFERENCES teams (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_products_price CHECK (price_cents > 0),
    CONSTRAINT ck_products_old_price CHECK (old_price_cents IS NULL OR old_price_cents > price_cents)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Tamanhos disponíveis por produto (P, M, G, GG ou Único)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_sizes (
    product_id INT UNSIGNED NOT NULL,
    size ENUM('P', 'M', 'G', 'GG', 'Único') NOT NULL,
    PRIMARY KEY (product_id, size),
    CONSTRAINT fk_product_sizes_product FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Planos da assinatura F1Hub Box
-- items: um benefício por linha.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(40) NOT NULL,
    name VARCHAR(60) NOT NULL,
    tagline VARCHAR(120) NOT NULL,
    price_cents INT UNSIGNED NOT NULL,
    items TEXT NOT NULL,
    includes_shirt TINYINT(1) NOT NULL DEFAULT 0,
    highlight TINYINT(1) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_plans_slug UNIQUE (slug),
    CONSTRAINT uq_plans_name UNIQUE (name),
    CONSTRAINT ck_plans_price CHECK (price_cents > 0)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Assinaturas (contratação do serviço F1Hub Box)
-- Regra de negócio (aplicada no PHP): no máximo uma assinatura ativa por usuário.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    plan_id INT UNSIGNED NOT NULL,
    team_id INT UNSIGNED NULL,
    shirt_size ENUM('P', 'M', 'G', 'GG') NULL,
    status ENUM('ativa', 'cancelada') NOT NULL DEFAULT 'ativa',
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX ix_subscriptions_status (status),
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_subscriptions_team FOREIGN KEY (team_id) REFERENCES teams (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Pedidos da loja (pagamento simulado via PIX)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    status ENUM('recebido', 'pago', 'enviado', 'entregue', 'cancelado') NOT NULL DEFAULT 'recebido',
    payment_method ENUM('pix') NOT NULL DEFAULT 'pix',
    subtotal_cents INT UNSIGNED NOT NULL,
    discount_cents INT UNSIGNED NOT NULL DEFAULT 0,
    total_cents INT UNSIGNED NOT NULL,
    postal_code CHAR(9) NOT NULL,
    state CHAR(2) NOT NULL,
    city VARCHAR(80) NOT NULL,
    address VARCHAR(160) NOT NULL,
    address_number VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX ix_orders_status (status),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_orders_subtotal CHECK (subtotal_cents > 0),
    CONSTRAINT ck_orders_discount CHECK (discount_cents <= subtotal_cents),
    CONSTRAINT ck_orders_total CHECK (total_cents = subtotal_cents - discount_cents)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Itens do pedido
-- product_name e unit_price_cents guardam uma cópia do momento da compra,
-- para o histórico não mudar se o produto for editado depois.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    product_name VARCHAR(160) NOT NULL,
    unit_price_cents INT UNSIGNED NOT NULL,
    size ENUM('P', 'M', 'G', 'GG', 'Único') NOT NULL,
    quantity SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT ck_order_items_price CHECK (unit_price_cents > 0)
) ENGINE=InnoDB;
