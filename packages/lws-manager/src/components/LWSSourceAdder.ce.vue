<template>
  <div class="container mb-3">
    <div class="input-group d-flex align-items-center">
      <input
        v-model="sourceUri"
        @blur="addSource"
        placeholder="Enter WebId, SparqlEndpoint URL, or Turtle File URI"
        class="form-control flex-grow-1"
      />
      <button @click="addSource" class="btn btn-primary ml-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-cloud-plus"
          viewBox="0 0 16 16"
        >
          <path
            fill-rule="evenodd"
            d="M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5"
          />
          <path
            d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383m.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z"
          />
        </svg>
      </button>
    </div>
    <small v-if="errorMessage" class="form-text text-danger">{{
      errorMessage
    }}</small>
    <small v-if="successMessage" class="form-text text-success">{{
      successMessage
    }}</small>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  getTypeIndexContainers,
  getTypeRegistrationsFromContainers,
} from '../LWSHelpers.ts'
import { isWebId } from '../LWSHost.ts'
import { TargetType } from '../types/LWSHost.d'
import { isSparqlEndpoint } from '@va-automate/kg-session'
import { processStore } from '../stores/LWSProcessStore'

// LWSSourceAdder will present the user with a textfield form, with a + button aside,
// allowing to enter a WebId, SparqlEndpoint URL or the URI of a Turtle File.
// The component must then examine the type indices and add the found typeRegistrations
// and typeIndexContainers under that WebId key in the processStore.

const sourceUri = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const addSource = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const uri = new URL(sourceUri.value)
    let targetType: TargetType | null = null

    // Determine the target type based on the URI
    if (await isWebId(uri)) {
      targetType = TargetType.WebId
      // Fetch data through the LWS containers containing the Type Indices and
      // if a process, then also update processStore.processRegistrations[]
      const typeIndexContainers = await getTypeIndexContainers(uri)
      await getTypeRegistrationsFromContainers(uri, typeIndexContainers)
    } else if (await isSparqlEndpoint(uri)) {
      targetType = TargetType.SparqlEndpoint
      // TODO: Fetch data from the SPARQL endpoint
    } else if (uri.pathname.endsWith('.ttl')) {
      targetType = TargetType.TurtleFile
    }

    if (targetType) {
      if (processStore.typeRegistrations[uri.href]) {
        successMessage.value = `Data source from LWS added successfully for URI: ${uri.href}`
      } else {
        errorMessage.value = `No relevant instances found for the provided URI: ${uri.href}`
      }
    } else {
      errorMessage.value = `Invalid URI. Please enter a valid WebId, SPARQL endpoint URL, or Turtle file URL: ${uri.href}`
    }
  } catch (error) {
    errorMessage.value = `Invalid URL format or unable to process: ${sourceUri.value}. Error: ${error}`
  } finally {
    sourceUri.value = ''
  }
}
</script>

<style scoped>
@import '../LWSStyles.css';

.text-danger {
  color: red;
}

.text-success {
  color: green;
}
</style>
