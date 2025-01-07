<script setup lang="ts">
import { ref, watch } from "vue";
import { i18nStore } from "./i18nHost";
const emit = defineEmits(["update:locale"]);

const selectedLanguage = ref("en");
const langOptions = i18nStore.allLanguages.map((lang:string) => {
  return { value: lang, text: lang };
});
watch(selectedLanguage, (newVal:string) => {
  console.log(`Selected language changed to ${newVal}`);
  emit("update:locale", newVal);
});
</script>

<template>
  <BFormSelect v-model="selectedLanguage" :options="langOptions" class="me-2">
  </BFormSelect>
</template>

<style scoped></style>
