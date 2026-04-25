// src/features/clientes/clientes.modals.js
import { api } from '../../core/api.js';

export function initClienteModal({ onClienteCreado }) {
    const modal = document.getElementById('modal-nuevo-cliente');
    if (!modal) return null;

    const btnClose = document.getElementById('btn-nc-close');
    const btnCancel = document.getElementById('btn-nc-cancel');
    const btnSubmit = document.getElementById('btn-nc-submit');
    
    const form = {
        tipoDoc: document.getElementById('nc-tipo-doc'),
        numDoc: document.getElementById('nc-num-doc'),
        nombre: document.getElementById('nc-nombre'),
        email: document.getElementById('nc-email'),
        telefono: document.getElementById('nc-telefono'),
        submitText: document.getElementById('nc-submit-text'),
        submitLoader: document.getElementById('nc-submit-loader'),
        errNumDoc: document.getElementById('nc-err-num-doc'),
        errNombre: document.getElementById('nc-err-nombre'),
        errGen: document.getElementById('nc-error-general'),
        errGenMsg: document.getElementById('nc-error-general-msg'),
        toast: document.getElementById('nc-toast'),
        toastMsg: document.getElementById('nc-toast-msg')
    };

    function abrir() {
        resetForm();
        modal.style.display = 'flex';
        form.numDoc.focus();
    }

    function cerrar() {
        modal.style.display = 'none';
    }

    function resetForm() {
        form.numDoc.value = '';
        form.nombre.value = '';
        form.email.value = '';
        form.telefono.value = '';
        limpiarErrores();
        setLoading(false);
    }

    function limpiarErrores() {
        form.errNumDoc.textContent = '';
        form.errNombre.textContent = '';
        form.errGen.style.display = 'none';
        form.numDoc.classList.remove('nc-input-error');
        form.nombre.classList.remove('nc-input-error');
    }

    function setLoading(on) {
        btnSubmit.disabled = on;
        form.submitText.style.display = on ? 'none' : 'flex';
        form.submitLoader.style.display = on ? 'flex' : 'none';
    }

    function mostrarToast(msg) {
        if (!form.toast) return;
        form.toastMsg.textContent = msg;
        form.toast.style.display = 'flex';
        setTimeout(() => { form.toast.style.display = 'none'; }, 3000);
    }

    async function guardar() {
        limpiarErrores();
        let hasError = false;

        if (!form.numDoc.value.trim()) {
            form.numDoc.classList.add('nc-input-error');
            form.errNumDoc.textContent = 'El número de documento es obligatorio.';
            hasError = true;
        }
        if (!form.nombre.value.trim()) {
            form.nombre.classList.add('nc-input-error');
            form.errNombre.textContent = 'El nombre completo es obligatorio.';
            hasError = true;
        }

        if (hasError) return;

        const payload = {
            tipoDocumento: form.tipoDoc.value,
            numDocumento: form.numDoc.value.trim(),
            nombre: form.nombre.value.trim(),
            email: form.email.value.trim(),
            telefono: form.telefono.value.trim()
        };

        setLoading(true);

        try {
            const nuevoCliente = await api.post('/clientes', payload);
            cerrar();
            mostrarToast(`Cliente "${nuevoCliente.nombre}" creado con éxito.`);
            if (onClienteCreado) onClienteCreado(nuevoCliente);
        } catch (err) {
            setLoading(false);
            if (err.status === 400 || err.status === 409) {
                // Error de validación del negocio (ej: DNI duplicado)
                form.errGenMsg.textContent = err.message || 'El número de documento ya existe o los datos son inválidos.';
                form.errGen.style.display = 'flex';
                form.numDoc.classList.add('nc-input-error');
            } else {
                form.errGenMsg.textContent = 'Error al conectar con el servidor.';
                form.errGen.style.display = 'flex';
            }
        }
    }

    // Listeners
    btnClose.onclick = cerrar;
    btnCancel.onclick = cerrar;
    btnSubmit.onclick = guardar;

    modal.onclick = (e) => { if (e.target === modal) cerrar(); };

    // Enter to submit
    [form.numDoc, form.nombre, form.email, form.telefono].forEach(el => {
        el.onkeydown = (e) => { if (e.key === 'Enter') guardar(); };
    });

    return {
        abrir,
        cerrar
    };
}
