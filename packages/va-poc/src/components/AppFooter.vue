<script setup lang="ts">
import { BNavbar, BContainer } from 'bootstrap-vue-next'
</script>

<template>
  <BNavbar fixed="bottom" class="footer-bar py-2">
    <BContainer>
      <small class="text-muted">JOSEPHA - ERA VA POC</small>
    </BContainer>
  </BNavbar>
</template>

<style scoped>
.footer-bar {
  background-color: var(--theme-body-bg);
  border-top: 1px solid var(--theme-border-color);
}
</style>