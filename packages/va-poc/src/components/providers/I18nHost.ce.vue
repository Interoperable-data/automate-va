<script setup lang="ts">
/**
 * This file sets up the i18n (internationalization) configuration for the application.
 * It uses the vue-i18n library to provide localized messages for different languages.
 *
 * The `i18nHost.ts` file holds a store for information shared with non-custom elements.
 * This store is used to manage the selected locale and provide the corresponding translations.
 *
 * The `createI18n` function is used to create an i18n instance with the specified configuration.
 * The `provide` function is used to make the i18n instance available to the rest of the application.
 *
 * The `watchEffect` function is used to reactively update the i18n configuration when the selected locale changes.
 */
import { provide, watchEffect } from "vue";
import { createI18n, I18nInjectionKey } from "vue-i18n";
import { i18nStore } from "./i18nHost";
const i18n4ce = createI18n<false>({
  legacy: false, // must be set to `false`
  // globalInjection: true,
  locale: i18nStore.selectedLocale,
  messages: i18nStore.messages,
});

const props = defineProps<{ locale: string }>();

/**
 * provide i18n instance with `I18nInjectionKey` for other web components
 */
provide(I18nInjectionKey, i18n4ce); // WARNING: This is only working towards custom elements

watchEffect(() => {
  console.log(`Language captured in watcher, changed to ${props.locale}!`);
  i18n4ce.global.locale.value = props.locale;
  i18nStore.selectedLocale = props.locale;
});
</script>

<template>
  <slot />
</template>
