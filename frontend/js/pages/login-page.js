import { authService, safeRedirectTarget } from '../services/auth-service.js';
import { routes } from '../services/catalog-service.js';

// Tela de login: envia e-mail e senha para a API PHP e redireciona após entrar.
const form = document.querySelector('.login-form');
const status = document.getElementById('form-status');
const submitButton = form.querySelector('.submit-button');
const destination = safeRedirectTarget(routes.account);

// Mantém o destino ao trocar para a tela de cadastro.
const registerLink = form.querySelector('.create-account a');
if (registerLink && window.location.search) registerLink.href = `cadastro.html${window.location.search}`;

function showStatus(message, type) {
    status.textContent = message;
    status.className = `form-status is-${type}`;
    status.hidden = false;
}

// Quem já está logado não precisa ver o login.
authService.me().then((user) => {
    if (user) window.location.replace(destination);
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;

    if (!email || !password) {
        showStatus('Informe seu e-mail e sua senha.', 'error');
        (email ? form.elements.password : form.elements.email).focus();
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';
    status.hidden = true;

    try {
        const user = await authService.login(email, password, form.elements.remember.checked);
        showStatus(`Olá, ${user.firstName}! Entrando na sua conta...`, 'success');
        window.location.assign(destination);
    } catch (error) {
        showStatus(error.message, 'error');
        form.elements.password.value = '';
        form.elements.password.focus();
        submitButton.disabled = false;
        submitButton.textContent = 'Entrar';
    }
});
