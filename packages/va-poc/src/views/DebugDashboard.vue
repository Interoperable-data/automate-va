<template>
  <div>
    <h1>{{ t('debugDashboard') }}</h1>
    <lws-pod-logger />
    <lws-process-list />
    <lws-task-list />
    <lws-source-adder />
    <lws-sources-list />
    <!-- {{ sessionStore.ownPodURLs }} -->
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect, defineCustomElement } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

// Stores
import { i18nStore } from '../components/providers/i18nHost'

// Import the custom elements
import LWSPodLogger from '@/components/providers/LWSPodLogger.ce.vue'
import LWSProcessList from '@/components/providers/LWSProcessList.ce.vue'
import LWSTaskList from '@/components/providers/LWSTaskList.ce.vue'
import LWSSourceAdder from "@/components/providers/LWSSourceAdder.ce.vue";
import LWSSourcesList from "@/components/providers/LWSSourcesList.ce.vue";

// Register the custom elements
if (!customElements.get('lws-pod-logger')) {
  customElements.define('lws-pod-logger', defineCustomElement(LWSPodLogger))
}
if (!customElements.get('lws-process-list')) {
  customElements.define('lws-process-list', defineCustomElement(LWSProcessList))
}
if (!customElements.get('lws-task-list')) {
  customElements.define('lws-task-list', defineCustomElement(LWSTaskList))
}
if (!customElements.get('lws-source-adder')) {
  customElements.define('lws-source-adder', defineCustomElement(LWSSourceAdder));
}
if (!customElements.get('lws-sources-list')) {
  customElements.define('lws-sources-list', defineCustomElement(LWSSourcesList));
}

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
