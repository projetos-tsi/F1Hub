-- ==========================================================
-- F1 HUB — ESTRUTURA + DADOS INICIAIS PARA HOSPEDAGEM
-- Gerado a partir de database.sql e seeds/dados_iniciais.sql (não edite à mão:
-- altere os dois arquivos originais e gere este de novo).
--
-- Uso: no phpMyAdmin da hospedagem, SELECIONE o banco que o painel criou para você
-- e importe este arquivo. Ele não cria nem escolhe banco (hospedagens compartilhadas
-- não permitem CREATE DATABASE).
--
-- IMPORTANTE: depois de importar, troque a senha do administrador de teste
-- (veja docs/PUBLICACAO.md).
-- ==========================================================

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

-- ==========================================================
-- F1 HUB — DADOS INICIAIS
-- Gerado a partir dos dados do front-end (products.js e subscription-plans.js).
-- Importe DEPOIS de database/database.sql.
--
-- Pode ser importado mais de uma vez com segurança: cada registro só é inserido
-- se ainda NÃO existir. Nada que já está no banco (inclusive o que foi editado
-- pela área administrativa) é alterado ou apagado.
-- ==========================================================

SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Equipes
INSERT INTO teams (slug, name, label, color) SELECT 'ferrari', 'Ferrari', 'SCUDERIA FERRARI', '#ed1320' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM teams WHERE slug = 'ferrari');
INSERT INTO teams (slug, name, label, color) SELECT 'mercedes', 'Mercedes', 'MERCEDES-AMG PETRONAS', '#078d84' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM teams WHERE slug = 'mercedes');
INSERT INTO teams (slug, name, label, color) SELECT 'rbr', 'Red Bull', 'ORACLE RED BULL RACING', '#021627' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM teams WHERE slug = 'rbr');
INSERT INTO teams (slug, name, label, color) SELECT 'mclaren', 'McLaren', 'McLAREN FORMULA 1 TEAM', '#d47200' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM teams WHERE slug = 'mclaren');
INSERT INTO teams (slug, name, label, color) SELECT 'williams', 'Williams', 'WILLIAMS RACING', '#0442fc' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM teams WHERE slug = 'williams');

-- Categorias
INSERT INTO categories (name, description, details) SELECT 'Camisa Polo', 'Visual inspirado no paddock, com acabamento estruturado e conforto para acompanhar a temporada dentro e fora dos autódromos.', 'Modelagem regular e confortável.
Gola e punhos estruturados.
Acabamento reforçado para maior durabilidade.
Estampa aplicada com alta definição.' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Camisa Polo');
INSERT INTO categories (name, description, details) SELECT 'Camiseta', 'Uma peça leve e versátil para levar as cores da sua equipe a qualquer lugar, com caimento confortável e identidade de pista.', 'Tecido leve e respirável.
Modelagem unissex confortável.
Costuras reforçadas nos ombros.
Estampa resistente ao uso diário.' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Camiseta');
INSERT INTO categories (name, description, details) SELECT 'Boné', 'Proteção e identidade de equipe em um acessório desenvolvido para completar o visual de quem vive a Fórmula 1.', 'Ajuste traseiro regulável.
Aba estruturada.
Bordados e aplicações de alta definição.
Tamanho único.' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Boné');
INSERT INTO categories (name, description, details) SELECT 'Moletom', 'Conforto térmico com visual de equipe para os dias frios, mantendo a presença das pistas em uma peça versátil.', 'Interior macio e confortável.
Punhos e barra canelados.
Modelagem regular.
Aplicações inspiradas na equipe.' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Moletom');
INSERT INTO categories (name, description, details) SELECT 'Jaqueta', 'Construção inspirada nos uniformes de equipe, combinando proteção, presença e acabamento para um visual de paddock.', 'Fechamento frontal por zíper.
Punhos estruturados.
Bolsos laterais funcionais.
Aplicações inspiradas na equipe.' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Jaqueta');
INSERT INTO categories (name, description, details) SELECT 'Blusa', 'Uma camada confortável e marcante para torcer pela equipe, com acabamento pensado para o uso cotidiano.', 'Tecido encorpado e confortável.
Modelagem regular.
Acabamento reforçado.
Aplicações inspiradas na equipe.' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Blusa');

-- Produtos (45) e tamanhos
-- Os tamanhos de um produto só são inseridos se ele ainda não tiver nenhum tamanho.
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'ferrari-polo-hp-unissex', (SELECT id FROM teams WHERE slug = 'ferrari'), (SELECT id FROM categories WHERE name = 'Camisa Polo'), NULL, 'Camisa Scuderia Ferrari HP Unissex', 'polo-ferrari.png', 20990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ferrari-polo-hp-unissex');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'ferrari-polo-hp-unissex' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'ferrari-polo-hypercar-2026', (SELECT id FROM teams WHERE slug = 'ferrari'), (SELECT id FROM categories WHERE name = 'Camisa Polo'), NULL, 'Camisa Polo Ferrari Hypercar Replica 2026', 'polo-ferrari2.png', 13990, 27980 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ferrari-polo-hypercar-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'ferrari-polo-hypercar-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'ferrari-jaqueta-driver', (SELECT id FROM teams WHERE slug = 'ferrari'), (SELECT id FROM categories WHERE name = 'Jaqueta'), NULL, 'Jaqueta Scuderia Ferrari Replica Driver Autêntica Racing', 'blusa-ferrari.png', 36990, 42990 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ferrari-jaqueta-driver');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'ferrari-jaqueta-driver' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'ferrari-bone-leclerc', (SELECT id FROM teams WHERE slug = 'ferrari'), (SELECT id FROM categories WHERE name = 'Boné'), 'Charles Leclerc', 'Boné Scuderia Ferrari LeClerc Juvenil', 'bone-ferrari.png', 11990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ferrari-bone-leclerc');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'Único' AS size) s WHERE p.slug = 'ferrari-bone-leclerc' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'ferrari-polo-replica-2026', (SELECT id FROM teams WHERE slug = 'ferrari'), (SELECT id FROM categories WHERE name = 'Camisa Polo'), NULL, 'Camisa Polo Scuderia Ferrari Replica 2026', 'polo-ferrari3.png', 15990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ferrari-polo-replica-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'ferrari-polo-replica-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'ferrari-jaqueta-hypercar-2026', (SELECT id FROM teams WHERE slug = 'ferrari'), (SELECT id FROM categories WHERE name = 'Jaqueta'), NULL, 'Jaqueta Ferrari Hypercar Replica 2026', 'blusa-ferrari2.png', 27990, 39990 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ferrari-jaqueta-hypercar-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'ferrari-jaqueta-hypercar-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'ferrari-camiseta-drivers', (SELECT id FROM teams WHERE slug = 'ferrari'), (SELECT id FROM categories WHERE name = 'Camiseta'), NULL, 'Camiseta Scuderia Ferrari Replica Drivers Auth', 'camisa-ferrari.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ferrari-camiseta-drivers');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'ferrari-camiseta-drivers' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'ferrari-camiseta-hypercar-2026', (SELECT id FROM teams WHERE slug = 'ferrari'), (SELECT id FROM categories WHERE name = 'Camiseta'), NULL, 'Camiseta Ferrari Hypercar Replica 2026', 'camisa-ferrari2.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ferrari-camiseta-hypercar-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'ferrari-camiseta-hypercar-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'ferrari-camiseta-replica', (SELECT id FROM teams WHERE slug = 'ferrari'), (SELECT id FROM categories WHERE name = 'Camiseta'), NULL, 'Camiseta Scuderia Ferrari Replica', 'camisa-ferrari3.png', 10990, 18990 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ferrari-camiseta-replica');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'ferrari-camiseta-replica' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mercedes-polo-2025-preta', (SELECT id FROM teams WHERE slug = 'mercedes'), (SELECT id FROM categories WHERE name = 'Camisa Polo'), NULL, 'Camisa Polo Mercedes 2025 Preta', 'polo-mercedes.png', 15990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mercedes-polo-2025-preta');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mercedes-polo-2025-preta' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mercedes-bone-mechanics', (SELECT id FROM teams WHERE slug = 'mercedes'), (SELECT id FROM categories WHERE name = 'Boné'), NULL, 'Boné Trucker Mechanics Adidas Mercedes', 'bone-mercedes.png', 11990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mercedes-bone-mechanics');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'Único' AS size) s WHERE p.slug = 'mercedes-bone-mechanics' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mercedes-polo-2026-preta', (SELECT id FROM teams WHERE slug = 'mercedes'), (SELECT id FROM categories WHERE name = 'Camisa Polo'), NULL, 'Camisa Polo Mercedes 2026 Preta', 'polo-mercedes2.png', 16990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mercedes-polo-2026-preta');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mercedes-polo-2026-preta' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mercedes-blusa-2025-preta', (SELECT id FROM teams WHERE slug = 'mercedes'), (SELECT id FROM categories WHERE name = 'Blusa'), NULL, 'Blusa Mercedes 2025 Preta', 'blusa-mercedes.png', 22990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mercedes-blusa-2025-preta');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mercedes-blusa-2025-preta' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mercedes-dryfit-2025-branca', (SELECT id FROM teams WHERE slug = 'mercedes'), (SELECT id FROM categories WHERE name = 'Camiseta'), NULL, 'Dryfit Mercedes 2025 Branca', 'dryfit-mercedes.png', 15990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mercedes-dryfit-2025-branca');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mercedes-dryfit-2025-branca' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mercedes-blusa-2025-branca', (SELECT id FROM teams WHERE slug = 'mercedes'), (SELECT id FROM categories WHERE name = 'Blusa'), NULL, 'Blusa Mercedes 2025 Branca', 'blusa-mercedes2.png', 22990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mercedes-blusa-2025-branca');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mercedes-blusa-2025-branca' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mercedes-jaqueta-2025-preta', (SELECT id FROM teams WHERE slug = 'mercedes'), (SELECT id FROM categories WHERE name = 'Jaqueta'), NULL, 'Jaqueta Mercedes 2025 Preta', 'jaqueta-mercedes.png', 24990, 29990 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mercedes-jaqueta-2025-preta');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mercedes-jaqueta-2025-preta' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mercedes-moletom-2025-preto', (SELECT id FROM teams WHERE slug = 'mercedes'), (SELECT id FROM categories WHERE name = 'Moletom'), NULL, 'Moletom Mercedes 2025 Preto', 'moletom-mercedes.png', 18990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mercedes-moletom-2025-preto');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mercedes-moletom-2025-preto' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mercedes-moletom-2025-branco', (SELECT id FROM teams WHERE slug = 'mercedes'), (SELECT id FROM categories WHERE name = 'Moletom'), NULL, 'Moletom Mercedes 2025 Branco', 'moletom-mercedes2.png', 15990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mercedes-moletom-2025-branco');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mercedes-moletom-2025-branco' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'redbull-polo-equipe-2025', (SELECT id FROM teams WHERE slug = 'rbr'), (SELECT id FROM categories WHERE name = 'Camisa Polo'), NULL, 'Camiseta Polo Red Bull Equipe Azul Marinho 2025', 'polo-redbull.png', 14990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'redbull-polo-equipe-2025');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'redbull-polo-equipe-2025' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'redbull-bone-9fifty', (SELECT id FROM teams WHERE slug = 'rbr'), (SELECT id FROM categories WHERE name = 'Boné'), NULL, 'Boné 9FIFTY Original Fit Red Bull Racing', 'bone-redbull.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'redbull-bone-9fifty');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'Único' AS size) s WHERE p.slug = 'redbull-bone-9fifty' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'redbull-dryfit-verstappen-preto-2025', (SELECT id FROM teams WHERE slug = 'rbr'), (SELECT id FROM categories WHERE name = 'Camiseta'), 'Max Verstappen', 'Camiseta Dryfit Red Bull Max Verstappen Preto 2025', 'camisa-redbull.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'redbull-dryfit-verstappen-preto-2025');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'redbull-dryfit-verstappen-preto-2025' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'redbull-algodao-verstappen-2025', (SELECT id FROM teams WHERE slug = 'rbr'), (SELECT id FROM categories WHERE name = 'Camiseta'), 'Max Verstappen', 'Camiseta Algodão Red Bull Max Verstappen Azul Marinho 2025', 'camisa-redbull2.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'redbull-algodao-verstappen-2025');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'redbull-algodao-verstappen-2025' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'redbull-dryfit-verstappen-2026', (SELECT id FROM teams WHERE slug = 'rbr'), (SELECT id FROM categories WHERE name = 'Camiseta'), 'Max Verstappen', 'Camiseta Dryfit Max Verstappen Red Bull 2026', 'camisa-redbull3.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'redbull-dryfit-verstappen-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'redbull-dryfit-verstappen-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'redbull-dryfit-japao-2025', (SELECT id FROM teams WHERE slug = 'rbr'), (SELECT id FROM categories WHERE name = 'Camiseta'), NULL, 'Camiseta Dryfit Red Bull Racing Edição Especial Japão 2025', 'camisa-redbull4.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'redbull-dryfit-japao-2025');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'redbull-dryfit-japao-2025' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'redbull-dryfit-verstappen-azul-2025', (SELECT id FROM teams WHERE slug = 'rbr'), (SELECT id FROM categories WHERE name = 'Camiseta'), 'Max Verstappen', 'Camiseta Dryfit Red Bull Max Verstappen Azul Marinho 2025', 'camisa-redbull5.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'redbull-dryfit-verstappen-azul-2025');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'redbull-dryfit-verstappen-azul-2025' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'redbull-moletom-turquia-black', (SELECT id FROM teams WHERE slug = 'rbr'), (SELECT id FROM categories WHERE name = 'Moletom'), NULL, 'Moletom Canguru Red Bull Turquia 2021 Black', 'blusa-redbull.png', 20990, 24990 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'redbull-moletom-turquia-black');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'redbull-moletom-turquia-black' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'redbull-moletom-turquia-offwhite', (SELECT id FROM teams WHERE slug = 'rbr'), (SELECT id FROM categories WHERE name = 'Moletom'), NULL, 'Moletom Canguru Red Bull Turquia 2021 Off White', 'blusa-redbull2.png', 20990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'redbull-moletom-turquia-offwhite');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'redbull-moletom-turquia-offwhite' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mclaren-moletom-piastri-2026', (SELECT id FROM teams WHERE slug = 'mclaren'), (SELECT id FROM categories WHERE name = 'Moletom'), 'Oscar Piastri', 'Moletom Canguru Oscar Piastri McLaren F1 2026 Preto', 'blusa-mclaren.png', 20990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mclaren-moletom-piastri-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mclaren-moletom-piastri-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mclaren-polo-equipe-2026', (SELECT id FROM teams WHERE slug = 'mclaren'), (SELECT id FROM categories WHERE name = 'Camisa Polo'), NULL, 'Camisa Polo McLaren F1 Team 2026', 'polo-mclaren.png', 17990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mclaren-polo-equipe-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mclaren-polo-equipe-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mclaren-polo-senna', (SELECT id FROM teams WHERE slug = 'mclaren'), (SELECT id FROM categories WHERE name = 'Camisa Polo'), 'Ayrton Senna', 'Camisa Polo Fanwear McLaren Senna', 'polo-mclaren2.png', 19990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mclaren-polo-senna');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mclaren-polo-senna' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mclaren-polo-norris-2026', (SELECT id FROM teams WHERE slug = 'mclaren'), (SELECT id FROM categories WHERE name = 'Camisa Polo'), 'Lando Norris', 'Camisa Polo Lando Norris McLaren F1 2026', 'polo-mclaren3.png', 15990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mclaren-polo-norris-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mclaren-polo-norris-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mclaren-camiseta-norris-2026', (SELECT id FROM teams WHERE slug = 'mclaren'), (SELECT id FROM categories WHERE name = 'Camiseta'), 'Lando Norris', 'Camiseta Lando Norris McLaren F1 2026 Algodão', 'camisa-mclaren.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mclaren-camiseta-norris-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mclaren-camiseta-norris-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mclaren-dryfit-marlboro-retro', (SELECT id FROM teams WHERE slug = 'mclaren'), (SELECT id FROM categories WHERE name = 'Camiseta'), NULL, 'Camiseta Dryfit McLaren Marlboro Vermelho Retrô', 'camisa-mclaren2.png', 11990, 13990 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mclaren-dryfit-marlboro-retro');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mclaren-dryfit-marlboro-retro' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mclaren-moletom-retro-vermelho', (SELECT id FROM teams WHERE slug = 'mclaren'), (SELECT id FROM categories WHERE name = 'Moletom'), NULL, 'Moletom McLaren Equipe Retrô Vermelho Careca', 'moletom-mclaren.png', 19990, 23990 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mclaren-moletom-retro-vermelho');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mclaren-moletom-retro-vermelho' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mclaren-moletom-2025-preto', (SELECT id FROM teams WHERE slug = 'mclaren'), (SELECT id FROM categories WHERE name = 'Moletom'), NULL, 'Moletom McLaren 2025 Preto', 'moletom-mclaren2.png', 18990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mclaren-moletom-2025-preto');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mclaren-moletom-2025-preto' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'mclaren-jaqueta-norris-2025', (SELECT id FROM teams WHERE slug = 'mclaren'), (SELECT id FROM categories WHERE name = 'Jaqueta'), 'Lando Norris', 'Jaqueta McLaren 2025 Lando Norris', 'jaqueta-mclaren.png', 19990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mclaren-jaqueta-norris-2025');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'mclaren-jaqueta-norris-2025' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'williams-dryfit-sainz-azul-2025', (SELECT id FROM teams WHERE slug = 'williams'), (SELECT id FROM categories WHERE name = 'Camiseta'), 'Carlos Sainz', 'Camiseta Dryfit Williams Carlos Sainz Azul Marinho 2025', 'dryfit-williams.png', 12990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'williams-dryfit-sainz-azul-2025');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'williams-dryfit-sainz-azul-2025' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'williams-jaqueta-rp-hybrid', (SELECT id FROM teams WHERE slug = 'williams'), (SELECT id FROM categories WHERE name = 'Jaqueta'), NULL, 'Jaqueta Williams Racing RP Hybrid Azul Marinho', 'jaqueta-williams.png', 18000, 22990 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'williams-jaqueta-rp-hybrid');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'williams-jaqueta-rp-hybrid' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'williams-polo-equipe-2025', (SELECT id FROM teams WHERE slug = 'williams'), (SELECT id FROM categories WHERE name = 'Camisa Polo'), NULL, 'Camiseta Polo Williams Equipe Azul Marinho 2025', 'polo-williams.png', 15990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'williams-polo-equipe-2025');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'williams-polo-equipe-2025' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'williams-moletom-2026-branco', (SELECT id FROM teams WHERE slug = 'williams'), (SELECT id FROM categories WHERE name = 'Moletom'), NULL, 'Moletom Canguru Williams F1 2026 Branco', 'blusa-williams.png', 20990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'williams-moletom-2026-branco');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'williams-moletom-2026-branco' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'williams-moletom-sainz-2026', (SELECT id FROM teams WHERE slug = 'williams'), (SELECT id FROM categories WHERE name = 'Moletom'), 'Carlos Sainz', 'Moletom Canguru Carlos Sainz Williams 2026 Azul Marinho', 'blusa-williams2.png', 20990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'williams-moletom-sainz-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'williams-moletom-sainz-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'williams-dryfit-team-2026', (SELECT id FROM teams WHERE slug = 'williams'), (SELECT id FROM categories WHERE name = 'Camiseta'), NULL, 'Camiseta Williams Team 2026 Dryfit', 'camisa-williams.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'williams-dryfit-team-2026');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'williams-dryfit-team-2026' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'williams-dryfit-sainz-preto-2025', (SELECT id FROM teams WHERE slug = 'williams'), (SELECT id FROM categories WHERE name = 'Camiseta'), 'Carlos Sainz', 'Camiseta Dryfit Williams Carlos Sainz Preto 2025', 'camisa-williams2.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'williams-dryfit-sainz-preto-2025');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'williams-dryfit-sainz-preto-2025' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'williams-dryfit-sainz-branco-2025', (SELECT id FROM teams WHERE slug = 'williams'), (SELECT id FROM categories WHERE name = 'Camiseta'), 'Carlos Sainz', 'Camiseta Dryfit Williams Carlos Sainz Branco 2025', 'camisa-williams3.png', 10990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'williams-dryfit-sainz-branco-2025');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'williams-dryfit-sainz-branco-2025' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);
INSERT INTO products (slug, team_id, category_id, pilot, name, image, price_cents, old_price_cents) SELECT 'williams-moletom-rothmans-retro', (SELECT id FROM teams WHERE slug = 'williams'), (SELECT id FROM categories WHERE name = 'Moletom'), NULL, 'Moletom Williams Retrô Rothmans Racing Branco', 'moletom-williams.png', 18990, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'williams-moletom-rothmans-retro');
INSERT INTO product_sizes (product_id, size) SELECT p.id, s.size FROM products p CROSS JOIN (SELECT 'P' AS size UNION ALL SELECT 'M' AS size UNION ALL SELECT 'G' AS size UNION ALL SELECT 'GG' AS size) s WHERE p.slug = 'williams-moletom-rothmans-retro' AND NOT EXISTS (SELECT 1 FROM product_sizes x WHERE x.product_id = p.id);

-- Planos da F1Hub Box
INSERT INTO plans (slug, name, tagline, price_cents, items, includes_shirt, highlight) SELECT 'pit-stop', 'Pit Stop', 'Para começar a coleção', 4990, '1 mimo surpresa por mês (chaveiro, pin ou adesivos)
Cartão colecionável exclusivo do mês
Tema da sua equipe favorita', 0, 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'pit-stop');
INSERT INTO plans (slug, name, tagline, price_cents, items, includes_shirt, highlight) SELECT 'podio', 'Pódio', 'O equilíbrio perfeito', 8990, '2 mimos surpresa por mês
1 camiseta exclusiva a cada 3 meses
Cartão colecionável exclusivo do mês
5% OFF extra nas compras da loja', 1, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'podio');
INSERT INTO plans (slug, name, tagline, price_cents, items, includes_shirt, highlight) SELECT 'campeao', 'Campeão', 'Para quem vive a F1 o ano todo', 14990, '1 camiseta exclusiva todo mês
2 mimos surpresa por mês
Caixa edição de colecionador
10% OFF extra nas compras da loja', 1, 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'campeao');

-- Administrador de TESTE (somente ambiente local de desenvolvimento).
-- E-mail e senha documentados em database/README.md. Troque a senha antes de qualquer uso fora do ambiente local.
INSERT INTO users (name, email, password_hash, role) SELECT 'Administrador F1 Hub', 'admin@f1hub.test', '$2y$10$SB2Ou4r15BSsr49sSbq6ku4Fn0BP7CUk1pNE48RcL1q0rUFstFbnC', 'admin' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@f1hub.test');
