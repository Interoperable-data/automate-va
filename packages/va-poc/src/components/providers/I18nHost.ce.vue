<script setup lang="ts">
import { provide, watchEffect } from "vue";
import { createI18n, I18nInjectionKey } from "vue-i18n";

/**
 * Define the web components that host the i18n instance.
 *
 * Because the web components environment isn't hosted in a Vue apps by `createApp`, but is provided by itself.
 * The i18n instance created by `createI18n` will be installed with `app.use` in Vue apps,
 * so that you can use i18n features with `useI18n` in Vue components.
 * In order to use `useI18n` in web components, you need to have web components hosted as root to use it.
 */

/**
 * create an i18n instance to host for other web components
 * Terms used in ALL components can be set here
 *
 * NOTE:
 *  In web components only supports the composition API.
 *  It will not work in legacy API mode.
 *
 * TODO: import the translations from the KG
 */
const i18n = createI18n<false>({
  legacy: false, // must be set to `false`
  locale: "en",
  messages: {
    en: {
      hello: "Hello ",
    },
    ja: {
      hello: "こんにちは ",
    },
    fr: {
      hello: "Bonjour",
    },
  },
});

const props = defineProps<{ locale: string }>();

/**
 * provide i18n instance with `I18nInjectionKey` for other web components
 */
provide(I18nInjectionKey, i18n); // FIXME: This is not working

watchEffect(() => {
  console.log(`Language captured in watcher, changed to ${props.locale}!`);
  i18n.global.locale.value = props.locale;
});
</script>

<template>
  <slot />
</template>

<!-- NOT ACTIVE HERE, use messages
<i18n>
{
   "en": {
     "hello": 'Hello'
   },
   ja: {
     "hello": 'こんにちは'
   }
}
</i18n> -->
