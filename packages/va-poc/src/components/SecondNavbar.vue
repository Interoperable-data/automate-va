<template>
  <BNavbar variant="secondary" type="light" id="second-navbar">
    <BNavbarBrand href="#">{{ $route.fullPath }} </BNavbarBrand>
    <BNavbarNav>
      <BNavItem v-if="sessionStore.rerouting">
        {{ t('redirecting') }}
      </BNavItem>
      <BNavItem v-else-if="!sessionStore.loggedInWebId">
        <div id="lws-btn">LOG IN TO LWS</div>
        {{ t('support') }}
      </BNavItem>
      <BNavItem v-else>
        {{ t('las') }}
      </BNavItem>
    </BNavbarNav>
  </BNavbar>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { sessionStore } from '@va-automate/lws-manager'
import { i18nStore } from '@va-automate/i18n-provider'

// translate
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({
  inheritLocale: true,
  useScope: 'local',
})

const newLocale = computed(() => i18nStore.selectedLocale)
watchEffect(() => {
  console.log(`Language captured in SecondNavbar watcher, changed to ${newLocale.value}!`)
  locale.value = newLocale.value
})
</script>

<style scoped></style>

<i18n>
  {
    "en": {
      "redirecting": "Redirecting after session storage...",
      "support": "We only support Linked Web Storage from Inrupt for the moment.",
      "las": "Logged in to LWS",
    },
    "fr": {
      "redirecting": "Redirection après stockage de session...",
      "support": "Nous ne supportons que le stockage web lié d'Inrupt pour le moment.",
      "las": "Connecté avec LWS",
    },
    "de": {
      "redirecting": "Weiterleitung...",
      "support": "Wir unterstützen derzeit nur Linked Web Storage von Inrupt.",
      "las": "Angemeldet beim LWS",
    },
    "es": {
      "redirecting": "Redirigiendo después del almacenamiento de la sesión...",
      "support": "Por el momento, solo admitimos almacenamiento web vinculado de Inrupt.",
      "las": "Conectado a LWS",
    }
  }
</i18n>
