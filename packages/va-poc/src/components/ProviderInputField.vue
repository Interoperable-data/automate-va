<template>
  <b-form-group label="Provider URI" class="d-flex align-items-center">
    <b-form-input
      v-model="processProviderURI"
      @blur="validateAndProcessURI"
      placeholder="Enter a Solid Pod WebId, SPARQL endpoint URL, or Turtle file URL"
      class="flex-grow-1"
    ></b-form-input>
    <b-button @click="validateAndProcessURI" variant="primary" class="ml-2">
      <MdiCloudPlus />
    </b-button>
    <b-form-text v-if="errorMessage" class="text-danger">{{ errorMessage }}</b-form-text>
  </b-form-group>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LWSHost, { processStore } from './providers/LWSHost'
const { isWebId, isSparqlEndpoint, isTurtleFile, loadProcessesFrom, TargetType } = LWSHost

const processProviderURI = ref('')
const errorMessage = ref('')

const validateAndProcessURI = async () => {
  errorMessage.value = ''
  try {
    const uri = new URL(processProviderURI.value)
    if (await isWebId(uri)) {
      await processWebId(uri)
    } else if (await isSparqlEndpoint(uri)) {
      await processSparqlEndpoint(uri)
    } else if (isTurtleFile(uri)) {
      await processTurtleFile(uri)
    } else {
      errorMessage.value =
        'Invalid URI. Please enter a valid WebId, SPARQL endpoint URL, or Turtle file URL.'
    }
  } catch (error) {
    errorMessage.value = `Invalid URL format: ${error}`
  }
}

const processWebId = async (uri: URL) => {
  try {
    const data = await loadProcessesFrom(uri, TargetType.WebId)
    if (data) {
      processStore.processProviders.push(data)
    } else {
      errorMessage.value = 'No relevant instances found in the WebId.'
    }
  } catch (error) {
    errorMessage.value = `Error fetching data from WebId: ${error}`
  }
}

const processSparqlEndpoint = async (uri: URL) => {
  try {
    const data = await loadProcessesFrom(uri, TargetType.SparqlEndpoint)
    if (data) {
      processStore.processProviders.push(data)
    } else {
      errorMessage.value = 'No relevant instances found in the SPARQL endpoint.'
    }
  } catch (error) {
    errorMessage.value = `Error fetching data from SPARQL endpoint: ${error}`
  }
}

const processTurtleFile = async (uri: URL) => {
  try {
    const data = await loadProcessesFrom(uri, TargetType.TurtleFile)
    if (data) {
      processStore.processProviders.push(data)
    } else {
      errorMessage.value = 'No relevant instances found in the Turtle file.'
    }
  } catch (error) {
    errorMessage.value = `Error fetching data from Turtle file: ${error}`
  }
}
</script>

<style scoped>
.text-danger {
  color: red;
}
.mdi-icon {
  font-size: 24px;
}
</style>
