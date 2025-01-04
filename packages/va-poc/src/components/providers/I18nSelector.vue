<script setup lang="ts">
import { inject, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const selectedLanguage = ref("en");
import { i18nStore } from "./i18nHost";

const emit = defineEmits(["update:locale"]);

// FAILS: Use the i18n instance from the parent component
// import { I18nInjectionKey } from "vue-i18n";
// FIXME: const i18n = inject(I18nInjectionKey); NOT FOUND
// let i18nLocale = ref("de");

// if (i18n?.global.locale) {
//   i18nLocale.value = i18n.global.locale.toString();
// } else {
//   console.error("No i18n instance found to set up the language selector. Key used:", I18nInjectionKey);
// }
// watch(selectedLanguage, (newVal) => {
//   if (i18n?.global.locale) {
//     i18n.global.locale = newVal;
//     console.log(`Selected language changed to ${newVal}`);
//   } else {
//     console.error("No i18n instance found to update the language");
//   }
// });
watch(selectedLanguage, (newVal) => {
  console.log(`Selected language changed to ${newVal}`);
  emit("update:locale", newVal);
});
</script>

<template>
  <form>
    <label for="locale-select">select language: </label>
    <select id="locale-select" v-model="selectedLanguage">
      <option v-for="lang in i18nStore.allLanguages" :value="lang">
        {{ lang }}
      </option>
    </select>
  </form>
</template>

<style scoped></style>
