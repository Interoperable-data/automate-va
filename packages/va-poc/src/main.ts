// import './assets/main.css'
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";

import { createApp, defineCustomElement } from "vue";
import { createI18n, I18nInjectionKey } from "vue-i18n";
// import { createPinia } from 'pinia'
import { createBootstrap } from "bootstrap-vue-next";
import { i18nStore } from "./components/providers/i18nHost";

import App from "./App.vue";
import router from "./router";

// For non-custom elements, we MUST use the i18n plugin directly
// It will however align the selected locale with the custom element,
// through the I18nStore.
const i18n = createI18n<false>({
  legacy: false, // Composition API: must be set to`false`
  locale: i18nStore.selectedLocale, // default locale for the application COMPONENTS, not the CEs
  // globalInjection: true,
});

// Internationalisation is done in the CE itself (https://vue-i18n.intlify.dev/guide/advanced/wc.html) using a wrapper in App
// import I18nHost from './components/providers/I18nHost.ce.vue'
// const I18nHostElement = defineCustomElement(I18nHost)
// customElements.define('i18n-provider', I18nHostElement)

const app = createApp(App);
// app.use(createPinia())
app.use(createBootstrap());
app.use(router);
app.use(i18n);
// app.provide(I18nInjectionKey, i18n);
app.mount("#app");
