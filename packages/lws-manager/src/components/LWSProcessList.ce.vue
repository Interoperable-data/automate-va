<template>
  <div class="container mb-3">
    <div v-if="Object.keys(processRegistrations).length">
      <h2>{{ t('processRegistrations') }}</h2>
      <ul class="list-group">
        <li
          v-for="(registrations, key) in processRegistrations"
          :key="key"
          class="list-group-item"
        >
          <strong>{{ key }}:</strong>
          <ul class="list-group">
            <li
              v-for="(registration, index) in registrations"
              :key="index"
              class="list-group-item"
            >
              {{ registration.href }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>{{ t('noProcessRegistrations') }}</p>
    </div>
    <div
      v-for="(containers, webId) in typeIndexContainers"
      :key="webId"
      class="card my-3"
    >
      <div class="card-header">
        {{ webId }}
      </div>
      <div class="card-body">
        <ul class="list-group">
          <li
            v-for="container in containers"
            :key="container.href"
            class="list-group-item"
          >
            <h5 class="card-title">{{ container.href }}</h5>
            <ul class="list-group">
              <li
                v-for="registration in typeRegistrations[container.href]"
                :key="registration.forClass"
                class="list-group-item"
              >
                <b>{{ registration.forClass }}</b> -
                {{ registration.inContainer }}
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { processStore } from '../stores/LWSProcessStore'
import { i18nStore } from '@va-automate/i18n-provider'

// Translation
const { t, locale } = useI18n()
const newLocale = computed(() => i18nStore.selectedLocale)
watchEffect(() => {
  console.log(
    `Language captured in DashBoard watcher, changed to ${newLocale.value}!`
  )
  locale.value = newLocale.value
})
const processRegistrations = computed(() => processStore.processRegistrations)
const typeIndexContainers = computed(() => processStore.typeIndexContainers)
const typeRegistrations = computed(() => processStore.typeRegistrations)
</script>

<style scoped>
@import '../LWSStyles.css';
</style>

<i18n>
{
  "en": {
    "processRegistrations": "Process Registrations",
    "noProcessRegistrations": "No process registrations available."
  },
  "fr": {
    "processRegistrations": "Enregistrements de processus",
    "noProcessRegistrations": "Aucun enregistrement de processus disponible."
  },
  "de": {
    "processRegistrations": "Prozessregistrierungen",
    "noProcessRegistrierungen verfügbar."
  },
  "es": {
    "processRegistrations": "Registros de procesos",
    "noProcessRegistrations": "No hay registros de procesos disponibles."
  }
}
</i18n>
