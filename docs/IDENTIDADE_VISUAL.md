# Identidade Visual

> Referência visual do F1 Hub para manter a consistência entre front-end, área administrativa e documentação.
> Os valores abaixo são os tokens reais usados no CSS (`frontend/src/style/style.css`, bloco `:root`).

## Conceito

Visual de **paddock**: fundo claro e limpo para os produtos, faixas e cabeçalho em **carbono** e acentos em **vermelho de corrida**. Cada equipe tem sua cor e um fundo próprio atrás das fotos dos produtos.

## Logo

- Arquivo: `frontend/src/assets/images/logo.svg` (carro de F1 em vermelho), usado no cabeçalho, rodapé, favicon e área administrativa.
- Nome "F1 Hub" em **Syncopate** (700), vermelho, ao lado do logo no desktop.

## Paleta de cores

| Token (CSS) | HEX | Aplicação |
|---|---|---|
| Primary — `--red` | `#ed1320` | Botões principais, selos de promoção, destaques, barra de avisos |
| Primary escuro — `--red-dark` | `#bd0d17` | Hover dos botões, mensagens de erro |
| Secondary — `--carbon` | `#1f1f1f` | Cabeçalho, rodapé, textos, botões escuros, card da F1Hub Box |
| Background — `--canvas` | `#f0f0f0` | Fundo das páginas |
| Superfície — `--surface` | `#ffffff` | Cards, formulários, resumo do pedido |
| Text secundário — `--muted` | `#686868` | Descrições, legendas, ajudas |
| Bordas — `--line` | `#d9d9d9` | Divisórias e bordas de campos |
| Success — `--green` | `#268f3d` | Preço no PIX, desconto, confirmações, etapas concluídas |
| Error | `#bd0d17` sobre `#fff5f5` | Erros de formulário e avisos |

Cores das equipes (bolinhas, faixas e fundos dos produtos):

| Equipe | HEX |
|---|---|
| Ferrari | `#ed1320` |
| Mercedes | `#078d84` (detalhe `#11ccc0`) |
| Red Bull | `#021627` |
| McLaren | `#d47200` (detalhe `#ff9e17`) |
| Williams | `#0442fc` |

## Tipografia

**Títulos:** Inter 800–900, espaçamento de letras negativo (−0,05em a −0,06em), tamanhos fluidos com `clamp()`.

**Textos:** Inter 400–600, 13–16 px, altura de linha 1,5–1,6.

**Botões/interface:** Inter 800–900; rótulos pequenos ("eyebrow") em caixa alta com espaçamento de 0,14–0,18em, em vermelho.

**Marca:** Syncopate 700 (nome "F1 Hub").

## Formas e espaçamento

- Cantos: 10 px (botões e campos), 14–18 px (cards), `--radius: 18px`.
- Sombra suave: `--shadow: 0 18px 60px rgba(31,31,31,.10)`.
- Largura máxima do conteúdo: 1440 px (`--page`), com margens de 32 px (desktop) e 14 px (celular).

## Componentes

- [x] Navbar (cabeçalho carbono fixo, menu suspenso de equipes/categorias, busca, conta e carrinho; menu "hambúrguer" até 800 px)
- [x] Botão principal (vermelho) e botões escuro, claro e contornado
- [x] Input (48 px de altura, foco com borda vermelha; erro com ⚠ e texto vermelho escuro)
- [x] Card de produto (foto sobre o fundo da equipe, selo de desconto/novo, preço "de/por" e preço no PIX)
- [x] Feedback de sucesso (verde) e de erro (vermelho), com `role="status"`/`role="alert"`
- [x] Janela de confirmação própria da área administrativa (sem caixas do navegador)
- [x] Linha do tempo da situação do pedido (Recebido → Pago → Enviado → Entregue)
