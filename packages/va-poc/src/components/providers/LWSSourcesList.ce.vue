<template>
  <div class="container mb-3">
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
  </div>
</template>

<script setup lang="ts">
import { processStore } from './LWSProcessStore';
</script>

<style scoped>
@import './LWSStyles.css';
</style>
