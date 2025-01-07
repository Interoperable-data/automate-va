<script setup lang="ts">
import { ref, watch } from "vue";
import { i18nStore } from "./i18nHost";
const emit = defineEmits(["update:locale"]);

const selectedLanguage = ref(i18nStore.currentLanguage);
const langOptions = i18nStore.allLanguages.map((lang: string) => {
  return { value: lang, text: lang };
});
watch(selectedLanguage, (newVal: string) => {
  console.log(`Selected language changed to ${newVal}`);
  emit("update:locale", newVal);
});
</script>

<template>
  <BNavbarNav>
    <IMdiLanguage class="mt-2 mx-1" />
  </BNavbarNav>
  <BInputGroup>
    <BFormSelect v-model="selectedLanguage" :options="langOptions" class="me-2">
    </BFormSelect>
  </BInputGroup>
</template>

<style scoped></style>
