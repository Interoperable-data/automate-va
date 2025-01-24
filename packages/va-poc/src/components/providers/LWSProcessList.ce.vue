<template>
  <div v-if="Object.keys(processRegistrations).length">
    <h2>{{ t('processRegistrations') }}</h2>
    <ul>
      <li v-for="(registrations, key) in processRegistrations" :key="key">
        <strong>{{ key }}:</strong>
        <ul>
          <li v-for="(registration, index) in registrations" :key="index">
            {{ registration.href }}
          </li>
        </ul>
      </li>
    </ul>
  </div>
  <div v-else>
    <p>{{ t('noProcessRegistrations') }}</p>
  </div>
  <div v-for="(containers, webId) in typeIndexContainers" :key="webId" class="card mb-3">
    <div class="card-header">
      {{ webId }}
    </div>
    <div class="card-body">
      <ul class="list-group">
        <li v-for="container in containers" :key="container.href" class="list-group-item">
          <h5 class="card-title">{{ container.href }}</h5>
          <ul class="list-group">
            <li v-for="registration in typeRegistrations[container.href]" :key="registration.forClass" class="list-group-item">
              <b>{{ registration.forClass }}</b> - {{ registration.inContainer }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { processStore } from './LWSProcessStore';
import { i18nStore } from '@/components/providers/i18nHost'

// Translation
const { t, locale } = useI18n();
const newLocale = computed(() => i18nStore.selectedLocale)
watchEffect(() => {
  console.log(`Language captured in DashBoard watcher, changed to ${newLocale.value}!`)
  locale.value = newLocale.value
})
const processRegistrations = computed(() => processStore.processRegistrations);
const typeIndexContainers = computed(() => processStore.typeIndexContainers);
const typeRegistrations = computed(() => processStore.typeRegistrations);
</script>

<style scoped>
h2 {
  font-size: 1.5em;
  margin-top: 1em;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 1em;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.mb-3 {
  margin-bottom: 1rem;
}
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
    "noProcessRegistrations": "Keine Prozessregistrierungen verfügbar."
  },
  "es": {
    "processRegistrations": "Registros de procesos",
    "noProcessRegistrations": "No hay registros de procesos disponibles."
  }
}
</i18n>
