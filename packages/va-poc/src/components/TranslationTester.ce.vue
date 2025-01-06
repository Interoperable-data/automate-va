<script setup lang="ts">

const props = defineProps<{ name: string }>()

/**
 * Local terms, only here works. <i18n>JSON</i18n> fails.
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
})
</script>

<template>
  <h3>{{ props.name }} says: {{ t('hello') + ' ' + t('world') }}</h3>
  <slot id="first">Loading...</slot>
</template>

<i18n>
  {
    "en": {
      "world": " world!"
    },
    "ja": {
      "world": "ザ・ワールド"
    },
    "fr": {
      "world": "monde!"
    },
    "de": {
      "world": "welt!"
    }
  }
</i18n>
