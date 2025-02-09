<script setup lang="ts">
import { defineCustomElement, ref } from 'vue'
import { RouterView } from 'vue-router'

// import the Custom Element components
import TranslationTester from './components/TranslationTester.ce.vue'
import { register as registerI18n } from '@va-automate/i18n-provider'
import { register as registerLWS } from '@va-automate/lws-manager'
import { register as registerTypeIndex } from '@va-automate/lws-manager'
import AppFooter from './components/AppFooter.vue'

// Register all custom elements
registerI18n()
registerLWS()
registerTypeIndex()

// Import application components
import NavBar from './components/NavBar.vue'
import SecondNavbar from './components/SecondNavbar.vue'
import { i18nStore } from '@va-automate/i18n-provider'

// convert into custom element constructor and register the custom elements
const TesterElement = defineCustomElement(TranslationTester)
customElements.define('translation-tester', TesterElement)

// Locale should be set through component as well.
const locale = ref<string>(i18nStore.selectedLocale)
const updateLocale = (newLocale: string) => {
  locale.value = newLocale
  console.log(`Locale updated to ${locale.value}`)
}

// Add the new element type to Vue's GlobalComponents type.
declare module 'vue' {
  interface GlobalComponents {
    // Be sure to pass in the Vue component type here (SomeComponent, *not* SomeElement).
    // Custom Elements require a hyphen in their name, so use the hyphenated element name here.
    'translation-tester': typeof TranslationTester
    'i18n-provider': typeof I18nHost
    'lws-provider': typeof LWSHost
    'lws-process-list': typeof LWSProcessList
    'lws-source-adder': typeof LWSSourceAdder
    'lws-sources-list': typeof LWSSourcesList
  }
}
</script>

<template>
  <i18n-provider .locale="locale">
    <lws-provider :routeInfo="$route" target="#lws-btn">
      <div class="d-flex h-100 text-center" :data-bs-theme="isDark ? 'dark' : 'light'">
        <div class="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
          <header class="mb-auto">
            <NavBar @update:locale="updateLocale" />
            <SecondNavbar />
          </header>

          <main class="px-3 mb-5">
            <RouterView />
          </main>

          <AppFooter />
        </div>
      </div>
    </lws-provider>
  </i18n-provider>
</template>
