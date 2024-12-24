import './assets/main.css'

import { createApp, defineCustomElement } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Internationalisation is done in the CE itself (https://vue-i18n.intlify.dev/guide/advanced/wc.html) using a wrapper in App
import I18nHost from './components/providers/I18nHost.ce.vue'
const I18nHostElement = defineCustomElement(I18nHost)
customElements.define('i18n-provider', I18nHostElement)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
