import { pagosTemplate } from './pagos.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';

export function template() {
    return pagosTemplate();
}

export function mount(container) {

}

export function unmount() {
    // Cleanup event listeners if needed
}
