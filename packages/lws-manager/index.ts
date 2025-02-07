export * from './src/auth/LWSAuth';
export * from './src/LWSHost.ts';
export * from './src/LWSHelpers.ts';
import type { LWSAuth as LWSAuthType } from './src/types/LWSHost.d';
export type { LWSAuthType };

// Store serving to manage process data as in LWS Containers
import { sessionStore } from './src/stores/LWSSessionStore';
export { sessionStore };
import { processStore } from './src/stores/LWSProcessStore';
export { processStore };

// Custom Elements
import LWSHost from './src/components/LWSHost.ce.vue';
import LWSProcessList from './src/components/LWSProcessList.ce.vue';
import LWSSourceAdder from './src/components/LWSSourceAdder.ce.vue';
import LWSSourcesList from './src/components/LWSSourcesList.ce.vue';
import LWSTaskList from './src/components/LWSTaskList.ce.vue';


import { defineCustomElement } from 'vue';
export function register() {
    if (!customElements.get('lws-provider')) {
        customElements.define('lws-provider', defineCustomElement(LWSHost));
    }
    if (!customElements.get('lws-process-list')) {
        customElements.define('lws-process-list', defineCustomElement(LWSProcessList));
    }
    if (!customElements.get('lws-source-adder')) {
        customElements.define('lws-source-adder', defineCustomElement(LWSSourceAdder));
    }
    if (!customElements.get('lws-sources-list')) {
        customElements.define('lws-sources-list', defineCustomElement(LWSSourcesList));
    }
    if (!customElements.get('lws-task-list')) {
        customElements.define('lws-task-list', defineCustomElement(LWSTaskList));
    }
}
