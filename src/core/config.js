// src/core/config.js
// Configuración global de la aplicación.
// Permite cambiar la URL base de la API sin tocar el código fuente,
// ya sea inyectando window.__APP_CONFIG__ desde el servidor (producción)
// o usando el valor por defecto (desarrollo local).

export const CONFIG = {
    /**
     * URL base de la API REST.
     * En producción, el servidor puede inyectar window.__APP_CONFIG__.apiUrl
     * en el HTML antes de que cargue el bundle.
     * En desarrollo, apunta a localhost:8080.
     */
    API_BASE_URL: (window.__APP_CONFIG__ && window.__APP_CONFIG__.apiUrl)
        ? window.__APP_CONFIG__.apiUrl
        : 'https://management-sport-api.onrender.com/api/v1', //'http://localhost:8080/api/v1',
};
