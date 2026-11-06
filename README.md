# 🏎️ F1 Hub

> E-commerce de produtos das equipes da Fórmula 1: camisetas, polos, moletons, jaquetas e bonés.

Projeto Integrador desenvolvido para o curso de **Tecnologia em Sistemas para Internet (TSI)**.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![PHP](https://img.shields.io/badge/PHP-777BB4?logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## 📖 Sobre o projeto

O **F1 Hub** é uma loja virtual pensada para os fãs de Fórmula 1. Em vez de procurar produtos da sua equipe favorita em várias lojas diferentes, o usuário encontra tudo em um só lugar, navegando por **equipe** ou por **categoria de produto**.

### 🎯 Objetivo

Construir uma aplicação web de comércio eletrônico, aplicando na prática front-end (HTML, CSS e JavaScript), back-end (PHP) e modelagem de banco de dados (MySQL). O projeto segue o fluxo de uma loja online: do catálogo até a finalização da compra.

### 👤 Público-alvo

Fãs e entusiastas da Fórmula 1 que querem vestuário e acessórios das equipes que acompanham.

## ✨ Funcionalidades

### ✅ Já disponíveis (front-end)

- **Página inicial** com banner promocional e carrosséis de produtos em destaque.
- **Navbar com menus suspensos** de Equipes e Categorias (abrem ao clicar, fecham ao clicar fora ou ao pressionar `Esc`).
- **Página "Equipes"** para escolher a equipe.
- **Uma página para cada equipe**: Ferrari, Mercedes, Red Bull, McLaren e Williams.
- **Página de produto** com preço, seleção de tamanho (P, M, G, GG) e botão de adicionar ao carrinho.
- **Tela de login** com campo de e-mail, senha com botão de mostrar/ocultar e opção "lembrar de mim".
- **Banco de dados inicial** com a tabela `users` (senha armazenada como hash).

### 🚧 Em desenvolvimento

- Autenticação de usuários com PHP e MySQL (`password_verify()` e sessões).
- Cadastro de produtos, categorias e equipes no banco de dados.
- Carrinho de compras funcional.
- Finalização de pedido.
- Área administrativa (`frontend/pages/admin/`).
- Busca de produtos, "Lançamentos" e "Promoções".

> Hoje o login, o carrinho e o botão de adicionar ao carrinho são **apenas visuais**. A integração com o back-end e o banco é a próxima etapa.

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Interface | HTML5, CSS3 |
| Interatividade | JavaScript |
| Back-end | PHP (conexão via PDO) |
| Banco de dados | MySQL |
| Ambiente local | XAMPP (Apache, MySQL e phpMyAdmin) |
| Versionamento | Git e GitHub (fluxo com Issues, branches e Pull Requests) |

## 📦 Pré-requisitos

- [XAMPP](https://www.apachefriends.org/) com **Apache** e **MySQL** funcionando
- [Git](https://git-scm.com/)
- Navegador atualizado

## 🚀 Como executar

1. **Clone o repositório** dentro da pasta `htdocs` do XAMPP:

   ```bash
   cd C:\xampp\htdocs
   git clone https://github.com/projetos-tsi/F1Hub.git
   ```

2. **Inicie o Apache e o MySQL** pelo painel do XAMPP.

3. **Crie o banco de dados:**
   1. Acesse `http://localhost/phpmyadmin`.
   2. Importe o arquivo `database/database.sql`.

4. **Configure a conexão com o banco:**
   1. Copie `backend/config/database.example.php` para `backend/config/database.php`.
   2. Ajuste os dados, se necessário. No XAMPP padrão, o usuário é `root` e a senha é vazia:

      ```php
      return [
          'host'     => 'localhost',
          'port'     => '3306',
          'database' => 'projeto_integrador',
          'username' => 'root',
          'password' => '',
          'charset'  => 'utf8mb4',
      ];
      ```

   > O arquivo `database.php` está no `.gitignore` e **não deve ser enviado ao GitHub**.

5. **Acesse o projeto:** `http://localhost/F1Hub/`

   O `index.php` da raiz redireciona automaticamente para `frontend/`, onde fica a home.

## 📁 Estrutura do projeto

```text
F1Hub/
├── backend/
│   ├── config/          # Exemplos de configuração e conexão (PDO)
│   ├── controllers/     # Controladores PHP
│   ├── models/          # Modelos de dados
│   └── services/        # Regras de negócio
├── database/
│   ├── database.sql     # Script de criação do banco
│   ├── migrations/      # Evolução da estrutura do banco
│   └── seeds/           # Dados iniciais
├── docs/                # Documentação (arquitetura, setup, Git, identidade visual)
├── frontend/
│   ├── home.html        # Página inicial
│   ├── index.php        # Entrada do front-end
│   ├── css/ e js/       # Estilos e scripts globais (main.js: menus suspensos)
│   ├── pages/           # Rotas PHP (login.php) e área admin
│   └── src/
│       ├── pages/       # equipes, ferrari, mercedes, rbr, mclaren, williams, produto, login
│       ├── style/       # Folhas de estilo de cada página
│       └── assets/      # Imagens dos produtos, logos das equipes e ícones
├── .github/             # Templates de Issue e Pull Request
└── index.php            # Ponto de entrada (redireciona para frontend/)
```

## 🗺️ Fluxo da aplicação

```text
Usuário → Interface (HTML/CSS/JS) → PHP → MySQL
```

A separação em `frontend/`, `backend/` e `database/` evita misturar interface, regras de negócio e SQL no mesmo arquivo. Mais detalhes em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## 📸 Capturas de tela

> Adicione aqui prints da home, da página de equipes, da página de produto e do login.
> Sugestão: salve as imagens em `docs/screenshots/` e referencie assim:
>
> `![Home do F1 Hub](docs/screenshots/home.png)`

## 🤝 Fluxo de trabalho da equipe

O time segue o fluxo **Issue → Branch → Commit → Pull Request → Review → Merge**. Os passos completos estão em [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md).

## 📚 Documentação

- [Arquitetura](docs/ARQUITETURA.md)
- [Setup com XAMPP](docs/SETUP_XAMPP.md)
- [Fluxo de Git](docs/GIT_WORKFLOW.md)
- [Identidade visual](docs/IDENTIDADE_VISUAL.md)
- [Integração do F1 Hub](docs/INTEGRACAO_F1_HUB.md)
- [Banco de dados](database/README.md)

## 👥 Equipe

- Felipe Santana
- Douglas Saragoza
- Matheus Almeida
- Murilo Calixto

## 📄 Licença

Projeto desenvolvido para fins acadêmicos. As marcas e logos das equipes de Fórmula 1 pertencem aos seus respectivos proprietários.
