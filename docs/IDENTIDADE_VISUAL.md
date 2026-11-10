# Identidade Visual

> Registro das decisões visuais do F1 Hub, para manter consistência entre Figma, front-end e documentação.

> **Versão atual: v2 — "Pit Wall Editorial"** (papel + tinta + sinal vermelho, grid suíço de 12 colunas, Anton monumental, Archivo, Instrument Serif, Inter e JetBrains Mono).
> Arquivo: https://www.figma.com/design/cQnOljNCdb8djCTcmurjMO · para completar as seções 05–09, rode o plugin em `design/figma-plugin-v2/` (veja o README).
> O conteúdo abaixo descreve a **v1** (tema escuro), mantida como histórico.

## Arquivo Figma (v1)

**F1Hub — Design System:** https://www.figma.com/design/kSC3Uyj3X9b8apaMIjf9vd

| Página do Figma | Conteúdo |
|---|---|
| 01 — Overview + Foundations | Capa, conceito, princípios e documentação visual dos fundamentos *(em construção)* |
| 02 — Components + Patterns | Seções **PAGE 03 — Components** e **PAGE 04 — Patterns**, além dos assets do repositório |
| 03 — Screens + Responsive | Seções **PAGE 05 — Application Screens** e **PAGE 06 — Responsive Design** *(em construção)* |

> O plano Starter do Figma permite só 3 páginas e 1 modo de variável. As 6 páginas do briefing viraram seções dentro das 3 páginas, e o tema Light ficou documentado na descrição de cada variável de cor.

## Conceito

Loja de produtos de equipes de F1 com estética de **pit wall**: fundo carbono escuro, vermelho de marca usado com moderação nos CTAs e nos destaques, e tipografia condensada nos títulos. Preços em fonte monoespaçada, como dados de telemetria. As fotos de produto ficam sobre um fundo claro "estúdio" (`bg/media`), assim peças pretas e azul-marinho continuam legíveis no tema escuro.

**Princípios**
1. **Produto em primeiro lugar.** A foto e o preço são o centro de cada card.
2. **Cor com função.** Vermelho = ação principal; verde = benefício PIX; cores de equipe só em contexto de equipe.
3. **Precisão.** Grid de 4 px, números tabulares e estados de foco sempre visíveis.
4. **Velocidade.** Transições curtas (120–300 ms) e hierarquia clara para decidir rápido.

## Logo

- Símbolo: `frontend/src/assets/images/logo.svg`, componente `Brand/Logo Mark` no Figma.
- Wordmark: "F1 Hub" em **Syncopate Bold**, cor `primary/default`.
- Arranjos: `Stacked` (header desktop atual), `Horizontal` (header compacto/mobile) e `Mark only`.

## Paleta de cores (tema Dark, padrão)

| Token | HEX | Aplicação |
|---|---|---|
| Primary (`color/primary/default`) | `#ED1320` | CTA principal, marca, indicador ativo |
| Primary hover / pressed | `#BD0D17` / `#A10E16` | Estados do CTA |
| Secondary (`color/secondary/default`) | `#F6F6F6` | Botão "Adicionar ao carrinho" (texto `#1F1F1F`) |
| Accent (`color/accent/default`) | `#FFC21A` | Badge "Lançamento" |
| Background (`color/bg/base`) | `#0B0B0C` | Fundo das páginas |
| Surface (`color/bg/surface`) | `#17171A` | Cards, painéis, campos |
| Surface Elevated (`color/bg/elevated`) | `#1F1F1F` | Header, footer, dropdowns, modais |
| Media (`color/bg/media`) | `#F6F6F6` | Fundo das fotos de produto |
| Border (`color/border/default` / `strong`) | `#2A2A2E` / `#3A3A3F` | Divisores / contornos de controles |
| Text Primary | `#FFFFFF` | Títulos e texto principal |
| Text Secondary | `#B8B8BC` | Descrições |
| Text Muted | `#6B6B6B` | Placeholder, metadados |
| Success | `#26B426` | Desconto PIX, sucesso |
| Warning | `#F59E0B` | Últimas unidades |
| Error | `#FF4D57` | Erros de validação |
| Info | `#4C9AFF` | Avisos neutros |

**Cores de equipe** (`team/*`): Ferrari `#ED1320`, Mercedes `#11CCC0`, Red Bull `#021627`, McLaren `#FF9E17`, Williams `#0442FC`. Mercedes e McLaren usam texto escuro para manter o contraste AA.

O tema Light planejado está registrado na descrição de cada variável no Figma. O arquivo `frontend/src/style/tokens.css` espelha todos os tokens.

## Tipografia

| Estilo | Fonte | Tamanho / altura de linha |
|---|---|---|
| Brand/Wordmark | Syncopate Bold | 22 / 28 |
| Display | Barlow Condensed Bold, caixa alta | 80 / 80 |
| Heading H1 / H2 | Barlow Condensed Bold, caixa alta | 56/60 · 40/44 |
| Heading H3 / H4 | Barlow Condensed SemiBold | 28/32 · 22/26 |
| Body Large / Medium / Small | Inter Regular | 18/28 · 16/24 · 14/20 |
| Caption | Inter Medium | 12 / 16 |
| Label | Inter Bold | 13 / 16 |
| Overline | Inter Extra Bold, caixa alta, +20% | 12 / 16 |
| Button L / M / S | Inter Bold / Bold / SemiBold | 16 · 14 · 12 |
| Data Large / Medium / Small | JetBrains Mono | 28 · 18 · 12 (preços, contagens) |

## Espaçamento, raios e elevação

- **Espaçamento (base 4):** 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
- **Raios:** xs 4 · sm 8 (campos e botões) · md 12 · lg 16 (cards) · xl 24 (banners) · full.
- **Bordas:** 1 / 2 / 4 px (4 px = borda lateral dos alertas).
- **Elevação:** Raised, Overlay (dropdowns), Modal, Focus Ring (`0 0 0 3px` vermelho a 35%), Glow Primary.

## Componentes definidos no Figma

- [x] Navbar (Header Desktop/Mobile, Nav Item, Dropdown Menu, Mobile Navigation)
- [x] Botão principal (Button: 5 hierarquias × 3 tamanhos × 6 estados)
- [x] Botão secundário
- [x] Input (Text/Password × 6 estados), Search Input, Select, Checkbox, Radio, Switch, Size Selector
- [x] Card (Product Card, Team Card, Team Title, Promo Banner)
- [x] Feedback de sucesso (Alert, Toast)
- [x] Feedback de erro (Field Message, Alert, Empty/Error State)
- [x] Extras: Icon set (29), Badge, Price, Filter Chip, Tag, Avatar, Team Logo, Spec List, Breadcrumb, Tabs, Carousel Pager, Footer, Accordion, Divider, Tooltip, Stock Indicator, Modal, Dialog, Spinner, Skeleton

**Fora do escopo:** Data Table, Ranking Table, Position Indicator, Chart Container e Date Picker. O F1 Hub é uma loja e nenhuma tela usa esses padrões.

## Patterns (Figma)

Store Header + Dropdown · Product Carousel Section · Team Page Header + Data Filtering · Product Purchase Box · Authentication & Form Validation · Search and Results + Empty Data · Overlay & Confirmation.

## Inconsistências encontradas no código

- `style.css`, `style-equipes.css` e `style-produto.css` repetem os mesmos blocos de header e footer. Extraia para um `layout.css` comum.
- Header e footer são escuros, mas o conteúdo é branco. Login/cadastro usam outra paleta (`login.css` com variáveis próprias).
- Classes de hover das equipes divergem: `.ferraria:hover` em `style-equipes.css` e `.ferrari:hover` em `style.css`.
- O `id="pix"` é repetido em vários elementos (deveria ser uma classe).
- O rodapé está em inglês e o restante da interface em português.
- Os tamanhos de fonte são fixos em px, sem escala (20, 22, 24, 25, 32, 48, 64 px).
