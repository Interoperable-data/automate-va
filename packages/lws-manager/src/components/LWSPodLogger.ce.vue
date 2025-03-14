<template>
  <div class="container mb-3">
    <div v-if="analysedDatasets.length">
      <h2>{{ t('analysedDatasets') }}</h2>
      <ol class="list-group list-group-numbered">
        <li
          v-for="(dataset, index) in analysedDatasets"
          :key="index"
          class="list-group-item"
        >
          ({{ dataset.url }}) {{ dataset.description }}
        </li>
      </ol>
    </div>
    <div v-else>
      <p>{{ t('noDatasets') }}</p>
    </div>
  </div>
  <!-- <div>
      <h2>Process Store Contents:</h2>
      <pre>{{ processContents }}</pre>
    </div> -->
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { sessionStore } from '../stores/LWSSessionStore'
import { i18nStore } from '@va-automate/i18n-provider'

// import { processStore } from '../stores/LWSProcessStore'
// const processContents = computed(() => processStore) // Correct computed property

// Translation
const { t, locale } = useI18n()
const newLocale = computed(() => i18nStore.selectedLocale)
watchEffect(() => {
  console.log(
    `Language captured in DashBoard watcher, changed to ${newLocale.value}!`
  )
  locale.value = newLocale.value
})
const analysedDatasets = computed(() => sessionStore.analysedDatasets)
</script>

<style scoped>
@import '../LWSStyles.css';
</style>

<i18n>
{
  "en": {
    "analysedDatasets": "Analysed Datasets",
    "url": "URL",
    "description": "Description",
    "noDatasets": "No datasets have been analysed yet."
  },
  "fr": {
    "analysedDatasets": "Datasets analysés",
    "url": "URL",
    "description": "Description",
    "noDatasets": "Aucun jeu de données n'a encore été analysé."
  },
  "de": {
    "analysedDatasets": "Analysierte Datensätze",
    "url": "URL",
    "description": "Beschreibung",
    "noDatasets": "Es wurden noch keine Datensätze analysiert."
  },
  "es": {
    "analysedDatasets": "Conjuntos de datos analizados",
    "url": "URL",
    "description": "Descripción",
    "noDatasets": "Aún no se han analizado conjuntos de datos."
  }
}
</i18n>
