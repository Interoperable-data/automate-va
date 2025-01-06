<template>
  <header id="nav">
    <RouterLink to="/">{{ t("home") }}</RouterLink>
    <RouterLink to="/auth">{{ t("about") }}</RouterLink>
    <I18nSelector @update:locale="emitNewLocale" />
  </header>
</template>

<script setup lang="ts">
import { onMounted, inject } from "vue";
import { I18nInjectionKey, useI18n } from "vue-i18n";

// OPTION 1 - As a component, translation is done using the plugin
const { t, locale } = useI18n();

// OPTION 2 FAILS - Direct import does not work in normal components
// const i18n = inject(I18nInjectionKey);
// const t = useI18n().t;
// const locale = i18n.global.locale;

import I18nSelector from "./providers/I18nSelector.vue";

const emit = defineEmits(["update:locale"]);
const emitNewLocale = (newLocale: string) => {
  // Update the locale in the CURRENT component
  // OPTION 2 - i18n.global.locale = newLocale;
  locale.value = newLocale; // OPTION 1
  // update the locale in the PARENT component
  emit("update:locale", newLocale);
};

onMounted(() => {
  console.log(
    `NavBar mounted with locale: ${locale.value || i18n.global.locale.value}`
  );
});
</script>

<style scoped></style>

<i18n>
  {
    "en": {
      "home": "Home",
      "about": "About"
    },
    "fr": {
      "home": "Accueil",
      "about": "À propos"
    },
    "de": {
      "home": "Startseite",
      "about": "Über"
    },
    "ja": {
      "home": "ホーム",
      "about": "約"
    }
  }
</i18n>
