<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{ name: string }>()

const { t, locale } = useI18n({
  inheritLocale: true,
  useScope: 'local',
})
</script>

<template>
  <h3>{{ props.name }} says [{{ locale }}]: {{ t('hello') + ' ' + t('world') }}</h3>
  <slot id="first">Loading...</slot>
</template>

<i18n>
  {
    "en": {
      "world": " world!"
    },
    "fr": {
      "world": "monde!"
    },
    "de": {
      "world": "welt!"
    },
    "es": {
      "world": "mundo!"
    }
  }
</i18n>
