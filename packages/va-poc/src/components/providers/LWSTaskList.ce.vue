<template>
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { processStore } from './LWSProcessStore';

const { t } = useI18n();
const taskRegistrations = computed(() => processStore.taskRegistrations);
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
    "taskRegistrations": "Task Registrations",
    "noTaskRegistrations": "No task registrations available."
  },
  "fr": {
    "taskRegistrations": "Enregistrements de tâches",
    "noTaskRegistrations": "Aucun enregistrement de tâche disponible."
  },
  "de": {
    "taskRegistrations": "Aufgabenregistrierungen",
    "noTaskRegistrations": "Keine Aufgabenregistrierungen verfügbar."
  },
  "es": {
    "taskRegistrations": "Registros de tareas",
    "noTaskRegistrations": "No hay registros de tareas disponibles."
  }
}
</i18n>
