<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { BButton } from 'bootstrap-vue-next'

const isDark = ref(false)

onMounted(() => {
  isDark.value =
    localStorage.getItem('theme') === 'dark' ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme()
})

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  applyTheme()
}

const applyTheme = () => {
  document.documentElement.setAttribute('data-bs-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

watch(isDark, () => {
  applyTheme()
})
</script>

<template>
  <BButton
    @click="toggleDarkMode"
    variant="outline-secondary"
    class="d-flex align-items-center ms-2"
  >
    <i :class="isDark ? 'bi bi-moon-fill' : 'bi bi-sun-fill'"></i>
  </BButton>
</template>

<style scoped></style>
