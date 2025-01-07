<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useI18n } from "vue-i18n";

import { i18nStore } from '../components/providers/i18nHost';

// As a component, translation is done using the main ts plugin
// AuthView is a component, so it MUST use the plugin directly,
// but the locale is available in the store, so it can be watched
const { t, locale } = useI18n();
const newLocale = computed(() => i18nStore.selectedLocale);
watchEffect(() => {
  console.log(`Language captured in HomeView watcher, changed to ${newLocale.value}!`);
  locale.value = newLocale.value;
});

</script>

<template>
  <div class="about">
    <h1>{{ t("welcome") }}</h1>
    <!-- <p>[Locale in Authview: {{ i18n!.global.locale || props.loc  }}]</p> -->
    <p>{{ t("message") }}</p>
    <!-- <slot/> -->
  </div>
</template>

<i18n>
  {
    "en": {
      "welcome": "Welcome to Auth View",
      "message": "Authentication happens not here"
    },
    "fr": {
      "welcome": "Bienvenu a Auth View",
      "message": "Authentication ne se passe pas ici"
    }
  }
</i18n>
