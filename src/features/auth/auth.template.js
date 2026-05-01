// src/features/auth/login.template.js

export const loginTemplate = () => `
<!-- Background elements for Login dynamic blur effect -->
<div class="bg-shape bg-shape-1"></div>
<div class="bg-shape bg-shape-2"></div>

<div class="login-wrapper">
    <div class="login-card">
        <div class="login-header">
            <div class="logo-circle">
                <i class='bx bx-football'></i>
            </div>
            <h1>Pitch Pro</h1>
            <p class="subtitle">Panel de Administración</p>
        </div>

        <!-- Error message -->
        <div id="login-error" class="login-error-box" style="display:none;">
            <i class='bx bx-error-circle'></i>
            <span id="login-error-msg">Correo o contraseña incorrectos.</span>
        </div>

        <form id="login-form" autocomplete="off">
            <div class="input-group">
                <label for="username">Usuario</label>
                <div class="input-wrapper">
                    <i class='bx bx-user'></i>
                    <input type="text" id="username" name="username" placeholder="superadmin" required autocomplete="username">
                </div>
            </div>

            <div class="input-group">
                <div class="label-row">
                    <label for="password">Contraseña</label>
                    <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
                </div>
                <div class="input-wrapper">
                    <i class='bx bx-lock-alt'></i>
                    <input type="password" id="password" name="password" placeholder="••••••••" required>
                </div>
            </div>

            <div class="checkbox-group">
                <label class="custom-checkbox">
                    <input type="checkbox" name="remember" id="remember">
                    <span class="checkmark"></span>
                    <span class="cb-text">Recordarme</span>
                </label>
            </div>

            <button type="submit" class="btn btn-primary" id="login-submit-btn">
                Ingresar al Panel <i class='bx bx-right-arrow-alt'></i>
            </button>
        </form>

        <!-- Demo Credentials -->
        <div class="demo-credentials">
            <p class="demo-title"><i class='bx bx-info-circle'></i> Credenciales de Demo</p>
            <div class="demo-cards">
                <div class="demo-card" data-username="superadmin" data-pass="admin123">
                    <span class="demo-role-badge badge-super">SUPER ADMIN</span>
                    <strong>superadmin</strong>
                    <span>admin123</span>
                </div>
            </div>
        </div>

        <p class="login-footer">
            ¿Necesitas ayuda? <a href="#">Contactar Soporte</a>
        </p>
    </div>
</div>
`;
