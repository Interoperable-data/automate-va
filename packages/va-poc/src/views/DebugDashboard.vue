<template>
  <div>
    <h1>{{ t('debugDashboard') }}</h1>
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
    <div v-if="processProviders.length">
      <h2>{{ t('processProviders') }}</h2>
      <ul>
        <li v-for="(provider, index) in processProviders" :key="index">
          {{ provider }}
        </li>
      </ul>
    </div>
    <div v-else>
      <p>{{ t('noProcessProviders') }}</p>
    </div>
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
    <div v-if="Object.keys(taskRegistrations).length">
      <h2>{{ t('taskRegistrations') }}</h2>
      <ul>
        <li v-for="(tasks, key) in taskRegistrations" :key="key">
          <strong>{{ key }}:</strong>
          <ul>
            <li v-for="(task, taskKey) in tasks" :key="taskKey">
              <strong>{{ taskKey }}:</strong> {{ task.label }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>{{ t('noTaskRegistrations') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();

//Stores
import { i18nStore } from "../components/providers/i18nHost";
import { sessionStore } from '../components/providers/LWSSessionStore';
import { processStore } from '../components/providers/LWSProcessStore';


// Computed properties
const analysedDatasets = computed(() => sessionStore.analysedDatasets);
const processProviders = computed(() => processStore.processProviders);
const processRegistrations = computed(() => processStore.processRegistrations);
const taskRegistrations = computed(() => processStore.taskRegistrations);

// Translation
const newLocale = computed(() => i18nStore.selectedLocale);
watchEffect(() => {
  console.log(
    `Language captured in DashBoard watcher, changed to ${newLocale.value}!`
  );
  locale.value = newLocale.value;
});
</script>

<style scoped>
h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

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
    "debugDashboard": "Debug Dashboard",
    "analysedDatasets": "Analysed Datasets",
    "url": "URL",
    "description": "Description",
    "noDatasets": "No datasets have been analysed yet.",
    "processProviders": "Process Providers",
    "noProcessProviders": "No process providers available.",
    "processRegistrations": "Process Registrations",
    "noProcessRegistrations": "No process registrations available.",
    "taskRegistrations": "Task Registrations",
    "noTaskRegistrations": "No task registrations available."
  },
  "fr": {
    "debugDashboard": "Tableau de bord de débogage",
    "analysedDatasets": "Jeux de données analysés",
    "url": "URL",
    "description": "Description",
    "noDatasets": "Aucun jeu de données n'a encore été analysé.",
    "processProviders": "Fournisseurs de processus",
    "noProcessProviders": "Aucun fournisseur de processus disponible.",
    "processRegistrations": "Enregistrements de processus",
    "noProcessRegistrations": "Aucun enregistrement de processus disponible.",
    "taskRegistrations": "Enregistrements de tâches",
    "noTaskRegistrations": "Aucun enregistrement de tâche disponible."
  },
  "de": {
    "debugDashboard": "Debug-Dashboard",
    "analysedDatasets": "Analysierte Datensätze",
    "url": "URL",
    "description": "Beschreibung",
    "noDatasets": "Es wurden noch keine Datensätze analysiert.",
    "processProviders": "Prozessanbieter",
    "noProcessProviders": "Keine Prozessanbieter verfügbar.",
    "processRegistrations": "Prozessregistrierungen",
    "noProcessRegistrations": "Keine Prozessregistrierungen verfügbar.",
    "taskRegistrations": "Aufgabenregistrierungen",
    "noTaskRegistrations": "Keine Aufgabenregistrierungen verfügbar."
  },
  "es": {
    "debugDashboard": "Panel de depuración",
    "analysedDatasets": "Conjuntos de datos analizados",
    "url": "URL",
    "description": "Descripción",
    "noDatasets": "Aún no se han analizado conjuntos de datos.",
    "processProviders": "Proveedores de procesos",
    "noProcessProviders": "No hay proveedores de procesos disponibles.",
    "processRegistrations": "Registros de procesos",
    "noProcessRegistrations": "No hay registros de procesos disponibles.",
    "taskRegistrations": "Registros de tareas",
    "noTaskRegistrations": "No hay registros de tareas disponibles."
  }
}
</i18n>
