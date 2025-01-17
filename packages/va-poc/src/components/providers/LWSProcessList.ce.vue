<template>
  <div
    v-for="(processContainers, webId) in processStore.processRegistrations"
    :key="webId"
    class="card mb-3"
  >
    <div class="card-header">
      {{ webId }}
    </div>
    <div class="card-body">
      <ul v-if="processContainers.length" class="list-group">
        <li v-for="container in processContainers" :key="container.href" class="list-group-item">
          <h5 class="card-title">{{ container.href }}</h5>
        </li>
      </ul>
      <div v-else>No processes found in {{ webId }}</div>
    </div>
  </div>
  <div v-if="!Object.keys(processStore.processRegistrations).length">
    No process registrations found. Are the processes recorded in the Type Indices?
  </div>
</template>

<script setup lang="ts">
import { processStore } from './LWSProcessStore'
</script>

<style scoped>
@import 'bootstrap/dist/css/bootstrap.min.css';
@import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';

.mb-3 {
  margin-bottom: 1rem;
}
</style>
