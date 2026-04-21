// src/features/auth/login.page.js
import { loginTemplate } from './auth.template.js';
import { Auth } from '../../core/auth.js';

export function template() {
    return loginTemplate();
}

export function mount(container) {
    const form = document.getElementById('login-form');
    const btn = document.getElementById('login-submit-btn');
    const errBox = document.getElementById('login-error');
    const errMsg = document.getElementById('login-error-msg');

    function showError(msg) {
        errMsg.textContent = msg;
        errBox.style.display = 'flex';
        errBox.style.animation = 'none';
        errBox.offsetHeight; // reflow
        errBox.style.animation = '';
    }

    function hideError() {
        errBox.style.display = 'none';
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        hideError();

        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;

        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Verificando...";
        btn.disabled = true;

        setTimeout(function () {
            const result = Auth.login(email, pass);

            if (!result.ok) {
                showError(result.error);
                btn.innerHTML = "Ingresar al Panel <i class='bx bx-right-arrow-alt'></i>";
                btn.disabled = false;
                return;
            }

            btn.innerHTML = "<i class='bx bx-check'></i> Acceso concedido";
            btn.style.background = '#16a34a';

            setTimeout(function () {
                window.location.hash = '#/dashboard/inicio';
            }, 500);
        }, 600);
    });

    document.querySelectorAll('.demo-card').forEach(function (card) {
        card.addEventListener('click', function () {
            document.getElementById('email').value = card.dataset.email;
            document.getElementById('password').value = card.dataset.pass;
            hideError();
        });
    });
}

export function unmount() {
    // Si tuviéramos event listeners en `window` o `document`, los quitaríamos aquí.
    // Los eventos en `form` se mueren cuando DOM pisa el innerHTML.
}
