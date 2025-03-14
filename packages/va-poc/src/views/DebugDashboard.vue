<template>
  <div>
    <h1>{{ t('debugDashboard') }}</h1>
    <lws-pod-logger />
    <lws-process-list />
    <lws-task-list />
    <lws-sources-list />
    <lws-source-adder />
    <!-- {{ sessionStore.ownPodURLs }} -->
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { i18nStore } from '@va-automate/i18n-provider'

const { t, locale } = useI18n()

// Translation
const newLocale = computed(() => i18nStore.selectedLocale)
watchEffect(() => {
  console.log(`Language captured in DashBoard watcher, changed to ${newLocale.value}!`)
  locale.value = newLocale.value
})
</script>

<style scoped>
h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

h2 {
  font-size: 1.5em;
  margin-top: 1em;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 1em;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* lws-pod-logger,
lws-process-list,
lws-task-list {
  margin-bottom: 1em;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 4px;
} */
</style>


<i18n>
  {
    "en": {
      "debugDashboard": "Debug Dashboard",
    },
    "fr": {
    },
    "de": {
      "debugDashboard": "Debug-Dashboard",
    },
    "es": {
    }
  }
  </i18n>
