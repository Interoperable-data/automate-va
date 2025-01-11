import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * The stores created in this file should be limited to those needed for the playground app.
 *
 * Have their own reactive store:
 * 1. Linked web Storage provider, in LWSHost.ts: LWS-session and Downloaded ProcessTask resources
 * 2. Translation provider, in i18nHosts.ts
 */

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
