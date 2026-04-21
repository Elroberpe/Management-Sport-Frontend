// src/core/api.js
const BASE_URL = 'http://localhost:8080/api/v1';

export const api = {
    async get(endpoint) {
        return this.request(endpoint, 'GET');
    },

    async post(endpoint, data) {
        return this.request(endpoint, 'POST', data);
    },

    async put(endpoint, data) {
        return this.request(endpoint, 'PUT', data);
    },

    async patch(endpoint, data) {
        return this.request(endpoint, 'PATCH', data);
    },

    async request(endpoint, method, data = null) {
        const url = `${BASE_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json'
        };

        // Inyectar Token de Auth si es necesario en el futuro
        // const token = localStorage.getItem('token');
        // if (token) headers['Authorization'] = `Bearer ${token}`;

        const options = {
            method,
            headers
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error((errorData && errorData.message) || `Error HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`[API] Error en ${method} ${endpoint}:`, error);
            throw error;
        }
    }
};
