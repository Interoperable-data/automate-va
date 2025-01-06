<script setup lang="ts">

import { inject } from 'vue';
import { I18nInjectionKey } from 'vue-i18n';

// As a component, translation is done using the main ts plugin
// OPTION 1 - As a component, translation is done using the plugin
import { useI18n } from "vue-i18n";
const props = defineProps<{ loc: string, justAProp:number }>();
const { t, locale } = useI18n();
// locale.value = props.loc; FAILS

// OPTION 2 FAILS - Direct import does not work in normal components
// const i18n = inject(I18nInjectionKey);
// const t = i18n!.global.t;
// const locale = i18n!.global.locale;

</script>

<template>
  <div class="about">
    <h1>{{ t("welcome") }}</h1>
    <p>[Locale in Authview: {{ props.loc }}]</p>
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
