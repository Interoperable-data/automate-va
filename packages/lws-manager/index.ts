// Type exports
export type {
  LWSAuthType,
  PodProfileAndRegistrations,
  TypeRegistration,
  TaskRegistration,
} from './src/types/LWSHost.d'
export { TargetType } from './src/types/LWSHost.d'

// Core functionality exports
export * from './src/auth/LWSAuth.ts'
export * from './src/LWSHost.ts'
export * from './src/LWSHelpers.ts'
export * from './src/LWSProfileHelpers' // Add this line to export profile helpers

// Store exports
export { sessionStore } from './src/stores/LWSSessionStore'
export { processStore } from './src/stores/LWSProcessStore'

// Custom Elements imports
import LWSHost from './src/components/LWSHost.ce.vue'
import LWSProcessList from './src/components/LWSProcessList.ce.vue'
import LWSSourceAdder from './src/components/LWSSourceAdder.ce.vue'
import LWSSourcesList from './src/components/LWSSourcesList.ce.vue'
import LWSTaskList from './src/components/LWSTaskList.ce.vue'
import LWSProcessSelector from './src/components/LWSProcessSelector.ce.vue'
import { defineCustomElement } from 'vue'

// Component registration function
export function register() {
  if (!customElements.get('lws-provider')) {
    customElements.define('lws-provider', defineCustomElement(LWSHost))
  }
  if (!customElements.get('lws-process-list')) {
    customElements.define(
      'lws-process-list',
      defineCustomElement(LWSProcessList)
    )
  }
  if (!customElements.get('lws-source-adder')) {
    customElements.define(
      'lws-source-adder',
      defineCustomElement(LWSSourceAdder)
    )
  }
  if (!customElements.get('lws-sources-list')) {
    customElements.define(
      'lws-sources-list',
      defineCustomElement(LWSSourcesList)
    )
  }
  if (!customElements.get('lws-task-list')) {
    customElements.define('lws-task-list', defineCustomElement(LWSTaskList))
  }
  if (!customElements.get('lws-process-selector')) {
    customElements.define(
      'lws-process-selector',
      defineCustomElement(LWSProcessSelector)
    )
  }
}
