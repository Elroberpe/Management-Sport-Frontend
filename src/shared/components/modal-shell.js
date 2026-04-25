// src/shared/components/modal-shell.js

/**
 * Motor de Modales Unificado (ModalShell)
 * 
 * @param {Object} options 
 * @param {string} options.id - ID único para el modal
 * @param {string} options.title - Título del modal
 * @param {string} options.subtitle - Subtítulo descriptivo
 * @param {string} options.icon - Clase de icono (Boxicons)
 * @param {string} options.contentHtml - HTML del cuerpo del modal
 * @param {string} options.confirmText - Texto del botón primario
 * @param {string} options.cancelText - Texto del botón secundario
 * @param {Function} options.onConfirm - Callback al presionar el botón primario (async)
 * @param {Function} options.onClose - Callback opcional al cerrar
 */
export function initModalShell(options) {
    const {
        id,
        title,
        subtitle = '',
        icon = 'bx bx-layer',
        contentHtml = '',
        confirmText = 'Guardar Cambios',
        cancelText = 'Cancelar',
        onConfirm = null,
        onClose = null
    } = options;

    // 1. Eliminar si ya existe uno con el mismo ID (evitar duplicados en SPA)
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    // 2. Construir el HTML
    const modalHtml = `
        <div id="${id}" class="modal-shell-overlay">
            <div class="modal-shell-container">
                <!-- Header -->
                <div class="modal-shell-header">
                    <div class="modal-shell-icon"><i class='${icon}'></i></div>
                    <div class="modal-shell-title-group">
                        <h2 class="modal-shell-title">${title}</h2>
                        ${subtitle ? `<p class="modal-shell-subtitle">${subtitle}</p>` : ''}
                    </div>
                    <button class="modal-shell-close" id="${id}-btn-close"><i class='bx bx-x'></i></button>
                </div>

                <!-- Body -->
                <div class="modal-shell-body">
                    <div class="modal-shell-alert-error" id="${id}-err-gen" style="display:none;">
                        <i class='bx bx-error-circle'></i>
                        <span id="${id}-err-gen-msg"></span>
                    </div>
                    ${contentHtml}
                </div>

                <!-- Footer -->
                <div class="modal-shell-footer">
                    <button class="modal-shell-btn modal-shell-btn-secondary" id="${id}-btn-cancel">${cancelText}</button>
                    <button class="modal-shell-btn modal-shell-btn-primary" id="${id}-btn-confirm">
                        <span class="btn-text">${confirmText}</span>
                        <span class="btn-loader" style="display:none;"><div class="modal-shell-spinner"></div> Cargando...</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    // 3. Inyectar en el body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 4. Referencias
    const overlay = document.getElementById(id);
    const btnClose = document.getElementById(`${id}-btn-close`);
    const btnCancel = document.getElementById(`${id}-btn-cancel`);
    const btnConfirm = document.getElementById(`${id}-btn-confirm`);
    const errGen = document.getElementById(`${id}-err-gen`);
    const errGenMsg = document.getElementById(`${id}-err-gen-msg`);
    const btnText = btnConfirm.querySelector('.btn-text');
    const btnLoader = btnConfirm.querySelector('.btn-loader');

    // 5. Funciones de control
    function open() {
        overlay.style.display = 'flex';
        resetErrors();
    }

    function close() {
        overlay.style.display = 'none';
        if (onClose) onClose();
    }

    function setLoading(on) {
        btnConfirm.disabled = on;
        btnText.style.display = on ? 'none' : 'inline';
        btnLoader.style.display = on ? 'flex' : 'none';
    }

    function resetErrors() {
        errGen.style.display = 'none';
        const errorTexts = overlay.querySelectorAll('.modal-shell-error-text');
        errorTexts.forEach(el => el.textContent = '');
        const inputs = overlay.querySelectorAll('.modal-shell-input');
        inputs.forEach(el => el.classList.remove('modal-shell-input-error'));
    }

    function showError(msg) {
        errGenMsg.textContent = msg;
        errGen.style.display = 'flex';
    }

    function showFieldError(fieldId, msg) {
        const input = document.getElementById(fieldId);
        const errSpan = document.getElementById(`${fieldId}-err`);
        if (input) input.classList.add('modal-shell-input-error');
        if (errSpan) errSpan.textContent = msg;
    }

    function showToast(msg) {
        const toastHtml = `
            <div class="modal-shell-toast">
                <i class='bx bx-check-circle' style="color:var(--primary); font-size:20px;"></i>
                <span>${msg}</span>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHtml);
        const toast = document.body.lastElementChild;
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 6. Listeners
    btnClose.onclick = close;
    btnCancel.onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    btnConfirm.onclick = async () => {
        if (onConfirm) {
            resetErrors();
            await onConfirm({
                close,
                setLoading,
                showError,
                showFieldError,
                showToast
            });
        }
    };

    return {
        open,
        close,
        setLoading,
        showError,
        showFieldError,
        showToast,
        resetErrors
    };
}
