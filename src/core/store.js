// src/core/store.js
// Gestor de estado global (Zustand/Redux-like state wrapper para Vanilla)

// Intentar recuperar el estado inicial del sessionStorage
const savedState = sessionStorage.getItem('pitchpro_global_store');
const initialState = savedState ? JSON.parse(savedState) : {
    sucursal: null // { sucursalId, nombre }
};

export const Store = {
    state: initialState,
    listeners: [],
    
    subscribe: function(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },
    
    dispatch: function(newState) {
        this.state = { ...this.state, ...newState };
        // Guardar en sessionStorage para persistir entre recargas
        sessionStorage.setItem('pitchpro_global_store', JSON.stringify(this.state));
        this.listeners.forEach(l => l(this.state));
    },
    
    // Selectores útiles
    getSucursal: function() {
        return this.state.sucursal || null;
    },
    
    // Actions útiles
    setSucursal: function(sucursal) {
        // sucursal puede ser un objeto { sucursalId, nombre } o null para modo global
        this.dispatch({ sucursal: sucursal });
    }
};
