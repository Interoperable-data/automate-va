<template>
  <div v-for="(containers, webId) in processStore.typeIndexContainers" :key="webId" class="card mb-3">
    <div class="card-header">
      {{ webId }}
    </div>
    <div class="card-body">
      <ul class="list-group">
        <li v-for="container in containers" :key="container.href" class="list-group-item">
          <h5 class="card-title">{{ container.href }}</h5>
          <ul class="list-group">
            <li v-for="registration in processStore.typeRegistrations[container.href]" :key="registration.forClass" class="list-group-item">
              <b>{{ registration.forClass }}</b> - {{ registration.inContainer }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { processStore } from './LWSProcessStore';
</script>

<style scoped>
@import 'bootstrap/dist/css/bootstrap.min.css';
@import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';

.mb-3 {
  margin-bottom: 1rem;
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
