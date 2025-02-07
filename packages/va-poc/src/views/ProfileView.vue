<script setup lang="ts">
import { computed, watchEffect, defineCustomElement } from 'vue'

// stores
import { sessionStore } from '@va-automate/lws-manager'
import { i18nStore } from '@va-automate/i18n-provider'

// translation
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
const newLocale = computed(() => i18nStore.selectedLocale)
watchEffect(() => {
  console.log(`Language captured in ProfileView watcher, changed to ${newLocale.value}!`)
  locale.value = newLocale.value
})

import TranslationTester from '@/components/TranslationTester.ce.vue'

if (!customElements.get('translation-tester')) {
  customElements.define('translation-tester', defineCustomElement(TranslationTester))
}
</script>

<template>
  <section class="about">
    <h1>{{ t('welcome') }}</h1>
    <p>{{ t('message') }}</p>
    <BContainer>
      <translation-tester name="Karel">Nothing to report</translation-tester>
      Todo: allow editing orgs and sites!
    </BContainer>
  </section>
</template>

<i18n>
  {
    "en": {
      "welcome": "LWS Storage Manager",
      "message": "Manage the Containers to store Linked data Class instances in.",
      "all": "All other web components here as they use storage.",
      "notConnected": "Not connected to LWS."
    },
    "fr": {
      "message": "Gérez les conteneurs pour stocker les instances de classe de données liées.",
      "all": "Tous les autres composants Web ici car ils utilisent le stockage.",
      "notConnected": "Pas connecté à LWS."
    },
    "de": {
      "message": "Verwalten Sie die Container zum Speichern von Linked Data-Klasseninstanzen.",
      "all": "Alle anderen Webkomponenten hier, da sie den Speicher verwenden.",
      "notConnected": "Nicht mit LWS verbunden."
    },
    "es": {
      "message": "Administre los contenedores para almacenar instancias de clase de datos vinculados.",
      "all": "Todos los demás componentes web aquí ya que usan almacenamiento.",
      "notConnected": "No conectado a LWS."
    }
  }
</i18n>
