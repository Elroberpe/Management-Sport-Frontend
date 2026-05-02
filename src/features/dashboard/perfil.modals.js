import { initModalShell } from '../../shared/components/modal-shell.js';
import { perfilDetailTemplate } from './perfil.template.js';
import { Auth } from '../../core/auth.js';
import { api } from '../../core/api.js';

export function initPerfilModal({ onPerfilActualizado }) {
    let currentUserId = null;

    const modal = initModalShell({
        id: 'modal-mi-perfil',
        title: 'Mi Perfil',
        subtitle: 'Gestiona tu información personal y seguridad',
        icon: 'bx bx-user-circle',
        contentHtml: perfilDetailTemplate(),
        // Ocultamos los botones por defecto del shell, los formularios tienen sus propios botones
        hideFooter: true 
    });

    return {
        ...modal,
        abrir: async () => {
            modal.open();
            
            // Lógica de Tabs
            const contentWrapper = document.getElementById('modal-mi-perfil');
            const btns = contentWrapper.querySelectorAll('.prof-tab-btn');
            btns.forEach(b => {
                b.onclick = () => {
                    btns.forEach(x => x.classList.remove('active'));
                    b.classList.add('active');
                    contentWrapper.querySelectorAll('.prof-tab-content').forEach(c => c.style.display = 'none');
                    contentWrapper.querySelector('#' + b.dataset.tab).style.display = 'block';
                };
            });

            const session = Auth.getSession();
            if (!session || !session.username) {
                modal.close();
                return;
            }

            // Bloquear formularios temporalmente mientras carga
            const infoForm = document.getElementById('form-perfil-info');
            const pwdForm = document.getElementById('form-perfil-pwd');
            
            infoForm.style.opacity = '0.5';
            infoForm.style.pointerEvents = 'none';

            try {
                let myId = session.usuarioId || session.id;
                let user;

                if (myId) {
                    user = await api.get(`/usuarios/${myId}`);
                } else {
                    const usuariosList = await api.get('/usuarios');
                    const allUsers = Array.isArray(usuariosList) ? usuariosList : (usuariosList.content || []);
                    user = allUsers.find(u => u.username === session.username);
                    if (!user) throw new Error("No se pudo localizar el perfil del usuario actual.");
                    myId = user.id;
                }

                currentUserId = myId;
                
                // Setear info
                document.getElementById('prof-nombre').value = user.nombre || '';
                document.getElementById('prof-username').value = user.username || '';
                document.getElementById('prof-email').value = user.email || '';
                document.getElementById('prof-rol').value = user.rol || 'N/A';
                document.getElementById('prof-sucursal').value = user.sucursalId ? `Sucursal #${user.sucursalId}` : 'Global';

                // Habilitar form
                infoForm.style.opacity = '1';
                infoForm.style.pointerEvents = 'auto';

            } catch (err) {
                console.error('Error cargando perfil:', err);
                modal.close();
                // O idealmente un toast de error, lo dejamos simple aquí
                alert('No se pudo cargar la información del perfil.');
            }

            // Manejar Guardado de Información Personal
            infoForm.onsubmit = async (e) => {
                e.preventDefault();
                const btnSave = document.getElementById('btn-save-prof-info');
                const prevText = btnSave.innerHTML;
                
                const nombre = document.getElementById('prof-nombre').value;
                const username = document.getElementById('prof-username').value;
                const email = document.getElementById('prof-email').value;

                if (!nombre || !username || !email) return;

                btnSave.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Guardando...`;
                btnSave.disabled = true;

                try {
                    const actualizado = await api.put(`/usuarios/${currentUserId}`, {
                        nombre, username, email
                        // Ojo: asumiendo que el backend ignora rol y sucursalId si no somos superadmin, 
                        // o requiere que no los enviemos. Enviaremos solo estos 3.
                    });
                    
                    btnSave.innerHTML = `<i class='bx bx-check'></i> Guardado`;
                    setTimeout(() => {
                        btnSave.innerHTML = prevText;
                        btnSave.disabled = false;
                    }, 2000);

                    // Pequeña alerta o toast (asumiendo que modalShell proveería ctx, pero aquí lo hacemos manual o con el DOM local)
                    // Podríamos crear una forma de Toast si existiera globalmente.
                    
                    if (onPerfilActualizado) onPerfilActualizado(actualizado);

                } catch (err) {
                    btnSave.innerHTML = prevText;
                    btnSave.disabled = false;
                    alert('Error al actualizar: ' + err.message);
                }
            };

            // Manejar Actualización de Contraseña
            pwdForm.onsubmit = async (e) => {
                e.preventDefault();
                const actual = document.getElementById('prof-pwd-actual').value;
                const nueva = document.getElementById('prof-pwd-nueva').value;
                const conf = document.getElementById('prof-pwd-conf').value;

                if (nueva !== conf) {
                    alert('Las contraseñas nuevas no coinciden.');
                    return;
                }
                if (nueva.length < 6) {
                    alert('La nueva contraseña debe tener al menos 6 caracteres.');
                    return;
                }

                const btnSave = document.getElementById('btn-save-prof-pwd');
                const prevText = btnSave.innerHTML;
                btnSave.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Actualizando...`;
                btnSave.disabled = true;

                try {
                    await api.patch(`/usuarios/${currentUserId}/password`, {
                        passwordActual: actual,
                        passwordNueva: nueva
                    });

                    modal.close();
                    
                    // Logout flow
                    alert('Contraseña actualizada con éxito. Por favor, inicia sesión nuevamente por seguridad.');
                    Auth.logout();
                    
                } catch (err) {
                    btnSave.innerHTML = prevText;
                    btnSave.disabled = false;
                    alert('Error al actualizar contraseña: ' + err.message);
                }
            };
            
            // Limpiar formulario de contraseña cada vez que abre
            document.getElementById('prof-pwd-actual').value = '';
            document.getElementById('prof-pwd-nueva').value = '';
            document.getElementById('prof-pwd-conf').value = '';
        }
    };
}
