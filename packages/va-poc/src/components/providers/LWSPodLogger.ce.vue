<template>
  <div v-if="analysedDatasets.length">
    <h2>{{ t('analysedDatasets') }}</h2>
    <ul>
      <li v-for="(dataset, index) in analysedDatasets" :key="index">
        <strong>{{ t('url') }}:</strong> {{ dataset.url }}<br>
        <strong>{{ t('description') }}:</strong> {{ dataset.description }}
      </li>
    </ul>
  </div>
  <div v-else>
    <p>{{ t('noDatasets') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { sessionStore } from './LWSSessionStore';
import { i18nStore } from '@/components/providers/i18nHost'

// Translation
const { t, locale } = useI18n();
const newLocale = computed(() => i18nStore.selectedLocale)
watchEffect(() => {
  console.log(`Language captured in DashBoard watcher, changed to ${newLocale.value}!`)
  locale.value = newLocale.value
})
const analysedDatasets = computed(() => sessionStore.analysedDatasets);
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
