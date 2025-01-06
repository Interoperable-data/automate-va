<script setup lang="ts">
// As a component, translation is done using the main ts plugin
import { useI18n } from "vue-i18n";
const { t } = useI18n();

</script>

<template>
  <div class="about">
    <h1>{{ t("welcome") }}</h1>
    <!-- <p>[Locale in component: {{ locale }}]</p> -->
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
