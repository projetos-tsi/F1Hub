# Integração do F1 Hub

O template do professor foi mantido como base do projeto:

- `backend/` continua reservado para controllers, models e services em PHP;
- `database/` mantém o script SQL, migrations e seeds;
- `docs/` mantém a documentação e o fluxo de Git;
- `frontend/index.php` é a entrada visual e exibe a home do F1 Hub;
- `frontend/src/` contém os arquivos visuais já criados pela equipe (HTML, CSS e imagens).

## Como abrir no XAMPP

1. Copie a pasta do projeto para `C:\xampp\htdocs`.
2. Inicie o Apache no painel do XAMPP.
3. Abra `http://localhost/NOME-DA-PASTA/` no navegador.

O `index.php` da raiz redireciona para `frontend/`, que abre a home do F1 Hub.
O ícone de usuário abre `frontend/src/pages/login.html`.

## Próxima etapa do login

O login atual é apenas visual. Quando a autenticação começar, a rota
`frontend/pages/login.php` já existe e pode receber a validação com MySQL,
`password_verify()` e sessões PHP.
