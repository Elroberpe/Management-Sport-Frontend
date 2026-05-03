import { ReservaService } from '../../reservas/reservas.service.js';
import { ClienteService } from '../../clientes/clientes.service.js';
import { UsuarioService } from '../../usuarios/usuarios.service.js';
import { horarioRowTemplate } from '../eventos.modals.template.js';

export async function _cargarCanchas(selectEl, sucursalId) {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">Cargando canchas...</option>';
    try {
        const params = { size: 100 };
        if (sucursalId) params.sucursalId = sucursalId;
        const data = await ReservaService.listarCanchas(params);
        const arr = Array.isArray(data) ? data : (data.content || []);
        selectEl.innerHTML = '<option value="">— Seleccionar cancha —</option>';
        arr.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.canchaId || c.id;
            opt.textContent = c.nombre;
            selectEl.appendChild(opt);
        });
    } catch {
        selectEl.innerHTML = '<option value="">Error al cargar canchas</option>';
    }
}

export async function _cargarClientes(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">Cargando clientes...</option>';
    try {
        const data = await ClienteService.listar({ size: 200, sort: 'nombre,asc' });
        const arr = Array.isArray(data) ? data : (data.content || []);
        selectEl.innerHTML = '<option value="">— Seleccionar cliente —</option>';
        arr.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.clienteId || c.id;
            opt.textContent = c.nombre;
            selectEl.appendChild(opt);
        });
    } catch {
        selectEl.innerHTML = '<option value="">Error al cargar clientes</option>';
    }
}

export async function _cargarSucursales(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">Cargando sucursales...</option>';
    try {
        const list = await UsuarioService.listarSucursales();
        const activas = Array.isArray(list) ? list.filter(s => s.activo !== false) : [];
        selectEl.innerHTML = '<option value="">— Seleccionar sede —</option>';
        activas.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.sucursalId !== undefined ? s.sucursalId : s.id;
            opt.textContent = s.nombre;
            selectEl.appendChild(opt);
        });
    } catch {
        selectEl.innerHTML = '<option value="">Error al cargar sedes</option>';
    }
}

export function _initHorariosBuilder(containerId, btnAddId, sucursalId = null) {
    const container = document.getElementById(containerId);
    const btnAdd = document.getElementById(btnAddId);
    if (!container || !btnAdd) return;

    let rowIdx = 0;

    async function addRow(defaults = {}) {
        const idx = rowIdx++;
        container.insertAdjacentHTML('beforeend', horarioRowTemplate(idx));
        const row = container.lastElementChild;

        const canchaSelect = row.querySelector('.hc-cancha');
        await _cargarCanchas(canchaSelect, sucursalId);

        if (defaults.canchaId) canchaSelect.value = defaults.canchaId;
        if (defaults.fecha) row.querySelector('.hc-fecha').value = defaults.fecha;
        if (defaults.horaInicio) row.querySelector('.hc-inicio').value = defaults.horaInicio.substring(0, 5);
        if (defaults.horaFin) row.querySelector('.hc-fin').value = defaults.horaFin.substring(0, 5);

        row.querySelector('.hc-remove').addEventListener('click', () => {
            if (container.children.length > 1) {
                row.remove();
            }
        });
    }

    btnAdd.addEventListener('click', () => addRow());

    addRow();

    return {
        getHorarios: () => {
            return Array.from(container.querySelectorAll('.horario-row')).map(row => ({
                canchaId:  parseInt(row.querySelector('.hc-cancha').value),
                fecha:     row.querySelector('.hc-fecha').value,
                horaInicio: row.querySelector('.hc-inicio').value + ':00',
                horaFin:    row.querySelector('.hc-fin').value + ':00',
            }));
        },
        addRow,
    };
}
