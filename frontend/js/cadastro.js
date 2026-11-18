/**
 * Comportamento da tela de cadastro (frontend/src/pages/cadastro.html).
 *
 * - Valida os campos no navegador, com mensagens em português;
 * - Alterna a visibilidade das senhas;
 * - Envia o cadastro para a API PHP (backend/api/auth.php), que valida de novo,
 *   grava em `users` com password_hash() e já inicia a sessão.
 */
import { authService, safeRedirectTarget } from './services/auth-service.js';
import { routes } from './services/catalog-service.js';

(function () {
    'use strict';

    const form = document.getElementById('signup-form');
    if (!form) return;

    const status = document.getElementById('form-status');
    const submitButton = form.querySelector('.submit-button');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const inputs = Array.from(form.querySelectorAll('[data-rule]'));

    /* Cada regra devolve a mensagem de erro ou '' quando o valor é válido. */
    const rules = {
        name(value) {
            const text = value.trim();
            if (!text) return 'Informe seu nome completo.';
            /* Mesma regra do servidor: letras (com acentos), espaços, apóstrofo, hífen e ponto. */
            if (!/^[\p{L}\p{M}'’.\-\s]+$/u.test(text)) return 'Use apenas letras, espaços, apóstrofo, hífen ou ponto no nome.';
            if (text.split(/\s+/).length < 2) return 'Informe nome e sobrenome.';
            return '';
        },
        email(value) {
            const text = value.trim();
            if (!text) return 'Informe seu e-mail.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'Digite um e-mail válido, como nome@exemplo.com.';
            return '';
        },
        password(value) {
            if (!value) return 'Crie uma senha.';
            if (value.length < 8 || !/\p{L}/u.test(value) || !/\d/.test(value)) {
                return 'A senha precisa ter 8 ou mais caracteres, com letras e números.';
            }
            return '';
        },
        confirmPassword(value) {
            if (!value) return 'Repita a senha para confirmar.';
            if (value !== passwordInput.value) return 'As senhas não coincidem.';
            return '';
        },
        terms(_value, input) {
            return input.checked ? '' : 'Aceite os termos para criar sua conta.';
        }
    };

    /* Campos já visitados: só mostramos erro depois que a pessoa passou por eles. */
    const touched = new Set();

    function validate(input) {
        const error = rules[input.dataset.rule](input.value, input);
        const message = document.getElementById(input.id + '-message');

        if (error) {
            input.setAttribute('aria-invalid', 'true');
        } else {
            input.removeAttribute('aria-invalid');
        }

        message.textContent = error || message.dataset.hint || '';
        message.classList.toggle('is-error', Boolean(error));

        return !error;
    }

    inputs.forEach((input) => {
        const changeEvent = input.type === 'checkbox' ? 'change' : 'input';

        input.addEventListener('blur', () => {
            touched.add(input);
            validate(input);
        });

        input.addEventListener(changeEvent, () => {
            if (touched.has(input)) validate(input);

            /* Ao mudar a senha, a confirmação precisa ser conferida de novo. */
            if (input === passwordInput && touched.has(confirmInput)) validate(confirmInput);
        });
    });

    /* Mostrar / ocultar senha (mesmo comportamento da tela de login). */
    document.querySelectorAll('.toggle-password').forEach((button) => {
        const target = document.getElementById(button.dataset.target);

        button.addEventListener('click', () => {
            const hidden = target.type === 'password';
            target.type = hidden ? 'text' : 'password';
            button.textContent = hidden ? '◌' : '◉';
            button.setAttribute('aria-label', (hidden ? 'Ocultar ' : 'Mostrar ') + button.dataset.name);
        });
    });

    const destination = safeRedirectTarget(routes.account);

    // Mantém o destino ao trocar para a tela de login.
    const loginLink = form.querySelector('.create-account a');
    if (loginLink && window.location.search) loginLink.href = `login.html${window.location.search}`;

    // Quem já está logado não precisa criar outra conta.
    authService.me().then((user) => {
        if (user) window.location.replace(destination);
    });

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `form-status is-${type}`;
        status.hidden = false;
    }

    /* Nome do campo na API → id do campo no formulário. */
    const fieldIds = { name: 'name', email: 'email', password: 'password', confirmPassword: 'confirm-password', terms: 'terms' };

    function showServerErrors(fields) {
        let firstInvalid = null;
        Object.entries(fields).forEach(([field, message]) => {
            const input = document.getElementById(fieldIds[field]);
            const messageBox = input && document.getElementById(input.id + '-message');
            if (!input || !messageBox) return;
            input.setAttribute('aria-invalid', 'true');
            messageBox.textContent = message;
            messageBox.classList.add('is-error');
            touched.add(input);
            firstInvalid = firstInvalid || input;
        });
        firstInvalid?.focus();
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        let firstInvalid = null;
        inputs.forEach((input) => {
            touched.add(input);
            if (!validate(input) && !firstInvalid) firstInvalid = input;
        });

        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Criando conta...';
        status.hidden = true;

        try {
            const user = await authService.register({
                name: form.elements.name.value,
                email: form.elements.email.value,
                password: passwordInput.value,
                confirmPassword: confirmInput.value,
                terms: form.elements.terms.checked
            });
            showStatus(`Conta criada! Bem-vindo(a) ao grid, ${user.firstName}.`, 'success');
            window.setTimeout(() => window.location.assign(destination), 1200);
        } catch (error) {
            showStatus(error.message, 'error');
            if (error.fields) showServerErrors(error.fields);
            submitButton.disabled = false;
            submitButton.textContent = 'Criar conta';
        }
    });
})();
