<template>
  <div class="about">
    <h1>About JOSEPHA</h1>
    <section>
      {{ t('intro') }}
      <ul>
        <li>{{ t('o1') }}</li>
        <li>{{ t('o2') }}</li>
        <li>{{ t('o3') }}</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { i18nStore } from '@va-automate/i18n-provider'
import { sessionStore } from '@va-automate/lws-manager'

// As a component, translation is done using the main ts plugin
// AuthView is a component, so it MUST use the plugin directly,
// but the locale is available in the store, so it can be watched
const { t, locale } = useI18n()
const newLocale = computed(() => i18nStore.selectedLocale)
watchEffect(() => {
  console.log(`Language captured in AboutView watcher, changed to ${newLocale.value}!`)
  locale.value = newLocale.value
})
</script>

<i18n>
  {
    en: {
      intro: "JOSEPHA allows stakeholders in the register processes to:",
      o1: "Introduce new linked data using sequentially shown forms;",
      o2: "View existing linked data to link to;",
      o3: "Represent data in the forms in human-readable formats;",
    }
  }
</i18n>
