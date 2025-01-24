<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { i18nStore } from "../components/providers/i18nHost";

// As a component, translation is done using the main ts plugin
// AuthView is a component, so it MUST use the plugin directly,
// but the locale is available in the store, so it can be watched
const { t, locale } = useI18n();
const newLocale = computed(() => i18nStore.selectedLocale);
watchEffect(() => {
  console.log(`Language captured in HomeView watcher, changed to ${newLocale.value}!`);
  locale.value = newLocale.value;
});

import { sessionStore } from "../components/providers/LWSHost";
</script>

<template>
  <div class="home">
    <h1>{{ t("welcome") }}</h1>
    <p>{{ t("message") }}</p>
  </div>
</template>

<i18n>
  {
    "en": {
      "welcome": "Welcome to Josepha",
      "message": "Joined Ontology System for Enhanced Process Handling and Automation.",
    },
    "fr": {
      "welcome": "Bienvenu a Josepha",
    },
    "de": {
      "welcome": "Willkommen zu Josepha"
    },
    "es": {
      "welcome": "Bienvenido a Josepha",
    }
  }
</i18n>
