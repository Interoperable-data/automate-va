<script setup lang="ts">
import { ref } from 'vue'
import { BNavbar, BContainer, useColorMode } from 'bootstrap-vue-next'

// In simple components, the ref target approach for darkmode works.
const target = ref<HTMLElement | null>(null)
useColorMode({
  selector: target,
})
</script>

<template>
  <BNavbar fixed="bottom" ref="target" variant>
    <BContainer>
      <small>JOSEPHA - ERA VA POC</small>
    </BContainer>
  </BNavbar>
</template>

<style scoped></style>
