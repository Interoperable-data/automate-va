<script setup lang="ts">
/**
 * Linked Web Storage provision component
 * - presents the option to connect to an LWS provider
 * - supports the language of the application
 */

/**
 * Local terms
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: {
    en: {
      world: 'The world!',
    },
    ja: {
      world: 'ザ・ワールド',
    },
  },
})

/**
 * Props for the
 * - provider?: string[] - Avoid to hard-code the possible providers, but at least we should support Inrupt
 *    More than one provider should be supported, many known issues with ESS - NSS - CSS login stream
 * - redirectURI: URI | null - given the complexities of Web Components, the component itself should catch the call from the OIDC.
 *    if null: the component should serve as the catcher of this call.
 * - ...
 *
 */
const props = defineProps<{ name: string }>()
</script>

<template>
  <h3>{{ props.name }} speaks {{ t('world') }}</h3>
  <slot id="first">Loading...</slot>
</template>

<!-- <i18n>{
  "en": {
    "world": "The world!"
  },
  "ja": {
    "world": "ザ・ワールド"
  }
}</i18n> -->
