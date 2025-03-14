// Translation element
import { defineCustomElement } from 'vue'
import I18nHost from './src/components/I18nHost.ce.vue'
export function register() {
  if (!customElements.get('i18n-provider')) {
    customElements.define('i18n-provider', defineCustomElement(I18nHost))
  }
}

// Translation store
export { i18nStore } from './src/i18nHost'