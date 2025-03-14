<script setup lang="ts">
import { ref, computed } from 'vue'
import { processStore } from '../stores/LWSProcessStore'
import LWSProcess from '../LWSProcess'

const selectedProcess = ref('')
const selectedTask = ref('')

// Modified computed properties to use helper functions
const processes = computed(() => {
  const urls = Object.keys(processStore.taskRegistrations)
  return urls.map((url) => {
    const processURL = new URL(url)
    const rootURL = new URL(url.substring(0, url.indexOf('/process/') + 8))
    return {
      uri: url,
      label:
        LWSProcess.extractProcessNamefromPodURL(processURL, rootURL, false) ||
        url,
    }
  })
})

const tasks = computed(() => {
  if (!selectedProcess.value) return []
  const taskUrls = Object.keys(
    processStore.taskRegistrations[selectedProcess.value] || {}
  )
  const processRoot = new URL(
    selectedProcess.value.substring(
      0,
      selectedProcess.value.indexOf('/process/') + 8
    )
  )

  return taskUrls.map((url) => {
    const taskURL = new URL(url)
    return {
      uri: url,
      label:
        LWSProcess.extractTaskNamefromPodURL(taskURL, processRoot, false) ||
        url,
    }
  })
})

const canStart = computed(() => selectedProcess.value && selectedTask.value)

const emits = defineEmits(['process-selected', 'task-selected', 'start-task'])

const selectProcess = (process: { uri: string; label: string }) => {
  selectedProcess.value = process.uri
  selectedTask.value = ''
  emits('process-selected', process.uri)
}

const selectTask = (task: { uri: string; label: string }) => {
  selectedTask.value = task.uri
  emits('task-selected', task.uri)
}

const getSelectedProcessLabel = computed(() => {
  if (!selectedProcess.value) return 'Select Process'
  const process = processes.value.find((p) => p.uri === selectedProcess.value)
  return process?.label || 'Select Process'
})

const getSelectedTaskLabel = computed(() => {
  if (!selectedTask.value) return 'Select Task'
  const task = tasks.value.find((t) => t.uri === selectedTask.value)
  return task?.label || 'Select Task'
})
</script>

<template>
  <div class="d-flex align-items-center">
    <div class="lws-dropdown me-2">
      <button
        class="btn dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {{ getSelectedProcessLabel }}
      </button>
      <ul class="dropdown-menu">
        <li v-for="process in processes" :key="process.uri">
          <a
            class="dropdown-item"
            :class="{ active: process.uri === selectedProcess }"
            href="#"
            @click.prevent="selectProcess(process)"
          >
            {{ process.label }}
          </a>
        </li>
      </ul>
    </div>

    <div class="lws-dropdown me-2">
      <button
        class="btn dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        :disabled="!selectedProcess"
        aria-expanded="false"
      >
        {{ getSelectedTaskLabel }}
      </button>
      <ul class="dropdown-menu">
        <li v-for="task in tasks" :key="task.uri">
          <a
            class="dropdown-item"
            :class="{ active: task.uri === selectedTask }"
            href="#"
            @click.prevent="selectTask(task)"
          >
            {{ task.label }}
          </a>
        </li>
      </ul>
    </div>

    <button
      class="btn btn-sm btn-success"
      :disabled="!canStart"
      @click="startTask"
    >
      <i class="bi bi-play-fill"></i>
    </button>
  </div>
</template>

<style>
@import '../LWSStyles.css';

/* Any component-specific styles can go here */
</style>
