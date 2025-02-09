<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeMount } from 'vue'
import { i18nStore } from '@va-automate/i18n-provider'
import { BNavItemDropdown, BDropdownItem } from 'bootstrap-vue-next'

const emit = defineEmits(['update:locale'])
const selectedLocale = computed(() => i18nStore.selectedLocale)
const languages = i18nStore.allLanguages

const changeLanguage = (lang: string) => {
  i18nStore.selectedLocale = lang
  emit('update:locale', lang)
}

onBeforeMount(() => {
  console.log(`I18nSelector beforeMount, selectedLocale is: ${selectedLocale.value}`)
})

onMounted(() => {
  console.log(`I18nSelector mounted, selectedLocale is: ${selectedLocale.value}`)
})
</script>

<template>
  <BNavItemDropdown class="me-2">
    <template #button-content>
      <i class="bi bi-globe me-1"></i>
      {{ selectedLocale.toUpperCase() }}
    </template>
    <BDropdownItem
      v-for="lang in languages"
      :key="lang"
      @click="changeLanguage(lang)"
      :active="selectedLocale === lang"
    >
      {{ lang.toUpperCase() }}
    </BDropdownItem>
  </BNavItemDropdown>
</template>

<style scoped></style>
