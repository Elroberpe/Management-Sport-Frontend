import { inicioTemplate } from './inicio.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';

export function template() {
    return inicioTemplate();
}

export function mount(container) {

    var session = Auth ? Auth.getSession() : null;

    /* --- Saludo personalizado --- */
    var nombre  = session ? session.nombre.split(' ')[0] : 'Bienvenido';
    var hora    = new Date().getHours();
    var saludo  = hora < 12 ? 'Buenos Días' : hora < 19 ? 'Buenas Tardes' : 'Buenas Noches';

    var subtitulo = (session && session.rol === 'superadmin')
        ? 'Esto es lo que está pasando en todas tus sedes hoy.'
        : (session && session.sucursalNombre)
            ? 'Actividad de tu sede: ' + session.sucursalNombre
            : 'Resumen de operaciones del día.';

    var greetingEl = document.getElementById('inicio-greeting');
    var subtitleEl = document.getElementById('inicio-subtitle');
    if (greetingEl) greetingEl.textContent = saludo + ', ' + nombre;
    if (subtitleEl) subtitleEl.textContent = subtitulo;

    /* --- Ocultar widgets de sedes para roles que no son superadmin --- */
    if (!session || session.rol !== 'superadmin') {
        var statSedes = document.getElementById('inicio-stat-sedes');
        if (statSedes) statSedes.style.display = 'none';

        var btnAddSede = document.getElementById('inicio-btn-add-sede');
        if (btnAddSede) btnAddSede.style.display = 'none';
    }

}

export function unmount() {
    // Cleanup event listeners if needed
}
