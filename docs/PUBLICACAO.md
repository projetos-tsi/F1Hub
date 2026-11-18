# Publicação online do F1 Hub

## Por que não o GitHub Pages

O **GitHub Pages hospeda apenas arquivos estáticos** (HTML, CSS, JavaScript e imagens). Ele **não executa PHP nem tem banco MySQL**. No F1 Hub, tudo o que o professor exige depende do servidor: login, área administrativa, catálogo vindo do banco, pedidos e assinatura. No GitHub Pages a loja abriria, mas mostraria "Não foi possível carregar os produtos" e nenhum login funcionaria.

Para o site ficar **100% funcional** online é preciso uma hospedagem com **PHP 8.1+ e MySQL/MariaDB** (de preferência com **Apache**, que respeita os arquivos `.htaccess` que protegem as pastas internas). Existem opções gratuitas para projetos acadêmicos (por exemplo, InfinityFree) e pagas de baixo custo. A criação da conta é feita pelo responsável do projeto.

## Passo a passo (hospedagem PHP + MySQL com painel e phpMyAdmin)

1. **Crie a conta e o site** na hospedagem escolhida e ative o **SSL gratuito (HTTPS)** no painel.
2. **Crie o banco MySQL** pelo painel e anote: servidor (host), nome do banco, usuário e senha.
3. **Importe o banco:** abra o phpMyAdmin da hospedagem, **selecione o banco criado** e importe `database/f1hub_hospedagem.sql` (estrutura + dados iniciais, sem `CREATE DATABASE`, que hospedagens compartilhadas não permitem).
4. **Envie os arquivos** (Gerenciador de Arquivos do painel ou FTP) para a pasta pública (`htdocs` ou `public_html`):
   - envie `backend/`, `database/`, `frontend/`, `index.php`;
   - **não envie** `instalar.php` nem a pasta `.git`.
5. **Configure a conexão:** em `backend/config/`, crie `database.php` com os dados do passo 2:
   ```php
   <?php
   return [
       'host' => 'SERVIDOR_DO_PAINEL',
       'port' => '3306',
       'database' => 'NOME_DO_BANCO',
       'username' => 'USUARIO_DO_BANCO',
       'password' => 'SENHA_DO_BANCO',
       'charset' => 'utf8mb4',
   ];
   ```
   Hospedagens que configuram o banco por **variáveis de ambiente** também funcionam sem esse arquivo: `F1HUB_DB_HOST`, `F1HUB_DB_PORT`, `F1HUB_DB_NAME`, `F1HUB_DB_USER`, `F1HUB_DB_PASSWORD`.
6. **Troque a senha do administrador de teste** — ela está publicada no README, então **qualquer pessoa poderia entrar no admin** se ela não for trocada:
   1. No seu computador (XAMPP), gere o hash da nova senha:
      ```bash
      php -r "echo password_hash('SUA-NOVA-SENHA-FORTE', PASSWORD_DEFAULT);"
      ```
   2. No phpMyAdmin da hospedagem, aba SQL:
      ```sql
      UPDATE users SET password_hash = 'COLE_O_HASH_AQUI', email = 'seu-email@exemplo.com' WHERE email = 'admin@f1hub.test';
      ```
7. **Teste:** abra o endereço do site → navegue pela loja → crie uma conta → faça um pedido → entre no admin com o novo e-mail/senha e mude a situação do pedido.

## Checklist de segurança antes de divulgar o endereço

- [ ] HTTPS ativo (o cookie da sessão passa a ser `Secure` automaticamente).
- [ ] `instalar.php` **não** está no servidor (mesmo bloqueado fora do `localhost`, é melhor não enviar).
- [ ] Senha e e-mail do administrador trocados (passo 6).
- [ ] `https://SEU-SITE/backend/config/database.php` e `https://SEU-SITE/database/database.sql` respondem **403** (bloqueio dos `.htaccess`). Se responderem 200, a hospedagem não usa Apache/`.htaccess`: escolha outra ou mova `backend/` e `database/` para fora da pasta pública.
- [ ] `https://SEU-SITE/backend/api/health.php` responde 403 (diagnóstico só no computador local).
- [ ] O repositório público não contém `backend/config/database.php` (já está no `.gitignore`).

## O que já vem protegido no código

| Proteção | Onde |
|---|---|
| Senhas com `password_hash` (bcrypt) | `AuthService` |
| *Prepared statements* em todas as consultas | `backend/models/` |
| Token CSRF em toda alteração (API e admin) | `Csrf`, `api-client.js`, formulários do admin |
| Sessão `HttpOnly`, `SameSite=Lax`, `Secure` com HTTPS, ID renovado no login | `Session` |
| Admin conferido no banco a cada página | `AdminAccess` |
| Total do pedido e preços sempre calculados no servidor | `OrderService` |
| Erros técnicos só no log (nada de detalhes na tela) | `bootstrap.php` |
| Pastas internas bloqueadas | `backend/.htaccess`, `database/.htaccess` |
| Cabeçalhos de segurança no admin (`X-Frame-Options`, `nosniff`, `no-store`) | `View::securityHeaders()` |
