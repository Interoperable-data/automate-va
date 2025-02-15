<template>
  <div class="process-controls fixed-top">
    <div class="d-flex justify-content-between align-items-center mx-3">
      <div class="path-display">
        {{ $route.fullPath }}
      </div>

      <div class="status-message">
        <span v-if="sessionStore.rerouting">
          {{ t('redirecting') }}
        </span>
        <span v-else-if="!sessionStore.loggedInWebId">
          <div id="lws-btn">LOG IN TO LWS</div>
          {{ t('support') }}
        </span>
        <span v-else>
          {{ t('las') }}
        </span>
      </div>
    </div>
    <div v-if="sessionStore.loggedInWebId" class="process-selector-wrapper">
      <lws-process-selector
        @process-selected="handleProcessSelected"
        @task-selected="handleTaskSelected"
        @start-task="handleStartTask"
      />
    </div>
  </div>
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

const handleProcessSelected = (process: string) => {
  console.log('Process selected:', process)
}

const handleTaskSelected = (task: string) => {
  console.log('Task selected:', task)
}

const handleStartTask = (data: { process: string; task: string }) => {
  console.log('Starting task:', data)
  // TODO: Implement task execution
}
</script>

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
