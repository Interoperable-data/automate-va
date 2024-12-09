<script setup lang="ts">
/**
 * Linked Web Storage provision component
 * - presents the option to connect to an LWS provider
 * - supports the language of the application
 */

/**
 * Props for the
 * - provider?: string[] - Avoid to hard-code the possible providers, but at least we should support Inrupt
 *    More than one provider should be supported, many known issues with ESS - NSS - CSS login stream
 * - redirectURI: URI | null - given the complexities of Web Components, the component itself should catch the call from the OIDC.
 *    if null: the component should serve as the catcher of this call.
 * - TODO: from analysis
 *
 */
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
    }
  }
</i18n>
