<template>
  <header id="nav">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/auth">About</RouterLink>
    <I18nSelector @update:locale="emitNewLocale" />
  </header>
</template>

<script setup lang="ts">
import I18nSelector from "./providers/I18nSelector.vue";

const emit = defineEmits(["update:locale"]);
const emitNewLocale = (newLocale: string) => {
  emit("update:locale", newLocale);
};
</script>

<style scoped></style>
