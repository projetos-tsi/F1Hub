/**
 * Comportamento da tela de cadastro (frontend/src/pages/cadastro.html).
 *
 * - Valida os campos no navegador, com mensagens em português;
 * - Alterna a visibilidade das senhas;
 * - Simula o envio enquanto o backend de cadastro não existe.
 *
 * Campos alinhados com a tabela `users` (database/database.sql):
 * name, email e senha (o PHP gera o password_hash).
 */
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

    form.addEventListener('submit', (event) => {
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

        /*
         * TODO (backend): enviar os dados para o PHP em vez de simular.
         * Quando o cadastro real existir, troque este bloco por um envio de
         * formulário/fetch para `frontend/pages/cadastro.php`, que deve validar
         * os dados de novo, gravar em `users` com password_hash() e tratar
         * e-mail já cadastrado.
         */
        status.textContent = 'Conta criada! Levando você para o login...';
        status.hidden = false;

        window.setTimeout(() => {
            window.location.href = 'login.html';
        }, 1800);
    });
})();
