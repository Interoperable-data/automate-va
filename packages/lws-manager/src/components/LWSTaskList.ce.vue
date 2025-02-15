<template>
  <div class="container mb-3">
    <h4>{{ t('taskRegistrations') }}</h4>
    <div v-if="Object.keys(taskRegistrations).length">
      <ul class="list-group">
        <div
          v-for="(tasks, key) in taskRegistrations"
          :key="key"
          class="card"
        >
          <div class="card-header">{{ key }}</div>
          <div class="card-body">
            <ul class="list-group" v-if="tasks.length">
              <li
                v-for="(task, taskKey) in tasks"
                :key="taskKey"
                class="list-group-item"
              >
                <strong>{{ taskKey }}:</strong> {{ task.label }}
              </li>
            </ul>
            <span v-else> {{ t('noTaskRegistrationsForWebId') + ` [WebId: ${key}]` }}</span>
          </div>
          <div class="card-footer">
            {{ taskRegistrations  }}
          </div>
        </div>
      </ul>
    </div>
    <div v-else>
      <p>{{ t('noTaskRegistrations') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { processStore } from '../stores/LWSProcessStore'

const { t } = useI18n()
const taskRegistrations = computed(() => processStore.taskRegistrations)
</script>

<style scoped>
@import '../LWSStyles.css';
</style>

<i18n>
{
  "en": {
    "taskRegistrations": "Task Registrations List",
    "noTaskRegistrations": "No Task Registration found",
    "noTaskRegistrationsForWebId": "No Task Registration found for"
  },
  "es": {
    "taskRegistrations": "Registro de tareas",
    "noTaskRegistrations": "No se encontraron registros de tareas"
  }
}
</i18n>
