<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BNavbar, BContainer } from 'bootstrap-vue-next'

const isDark = ref(document.documentElement.getAttribute('data-bs-theme') === 'dark')

// Watch for theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'data-bs-theme') {
      isDark.value = document.documentElement.getAttribute('data-bs-theme') === 'dark'
    }
  })
})

onMounted(() => {
  observer.observe(document.documentElement, { attributes: true })
})
</script>

<template>
  <BNavbar
    fixed="bottom"
    :variant="isDark ? 'dark' : 'light'"
    :class="['footer-bar py-2', isDark ? 'bg-dark' : 'bg-light']"
  >
    <BContainer>
      <small :class="isDark ? 'text-light' : 'text-muted'">JOSEPHA - ERA VA POC</small>
    </BContainer>
  </BNavbar>
</template>

<style scoped>
.footer-bar {
  background-color: var(--bs-body-bg);
  border-top: 1px solid var(--bs-border-color);
}
</style>
