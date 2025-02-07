<template>
  <div class="container mb-3">
    <div v-if="Object.keys(taskRegistrations).length">
      <h2>{{ t('taskRegistrations') }}</h2>
      <ul class="list-group">
        <li
          v-for="(tasks, key) in taskRegistrations"
          :key="key"
          class="list-group-item"
        >
          <strong>{{ key }}:</strong>
          <ul class="list-group">
            <li
              v-for="(task, taskKey) in tasks"
              :key="taskKey"
              class="list-group-item"
            >
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { processStore } from '../stores/LWSProcessStore'

const { t } = useI18n()
const taskRegistrations = computed(() => processStore.taskRegistrations)
</script>

<style scoped>
@import '../LWSStyles.css';
</style>
