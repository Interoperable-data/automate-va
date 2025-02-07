<template>
  <b-form-group label="Data source URI" class="d-flex align-items-center">
    <b-form-input
      v-model="sourceURI"
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
/**
 * The goal of this component is to add a LINKED DATA SOURCE, which is a URI that can be a WebId, SPARQL endpoint, or Turtle file.
 * Based on the type of URI, the component will process the data source and store the data in the state of the application.
 * The end result is a list of classes and their properties, which will be used to:
 * - enable ThingsFinder, which can then search for literal values.
 * - enable ThingsLister, which lists the found things and allows to store them in the KG as a instance of some Collection class.
 *
 * This component takes a URI from a data source:
 * - if a WebId, potentially the OWN webId
 *  1. Examines <webId> resource for Public/(own only)PrivateTypeIndex:
 *    <Webid> <http://www.w3.org/ns/solid/terms#privateTypeIndex> <IRI-to-Private-Index-container>
 *    <Webid> <http://www.w3.org/ns/solid/terms#publicTypeIndex> <IRI-to-Public-Index-container>
 *  2. Opens Things under the found IRI Container and queries for instances of <http://www.w3.org/ns/solid/terms#TypeRegistration>
 *  3. Stores in state of application:
 *    {
 *      forClass: the type registration ClassName,
 *      instanceContainer: the container at which instances of this Class are located,
 *      literalProps: [],
 *      iriProps: []
 *    }
 * - If not a WebId, but a SPARQL endpoint or TTL file, stores directly in the state of application, for all Classes found (?s a ?class):
 *    {
 *      forClass: the class URI,
 *      instanceContainer: the IRI of the file or KG itself,
 *      literalProps: [],
 *      iriProps: []
 *    }
 *  4. For each class, find and store the properties of the class, both literal and IRI, and stoe in the state of application via object above.
 *
 * NOTE: Special classes representing a process, like a workflow, will be stored in the state of the application as well. No distinction is made.
 */
import { ref } from 'vue'
import { processStore } from '@va-automate/lws-manager'
import { isWebId, loadProcessesFrom } from '@va-automate/lws-manager'
import { isSparqlEndpoint } from '@va-automate/kg-session'
import { TargetType } from '@va-automate/lws-manager'

const sourceURI = ref('')
const errorMessage = ref('')

const validateAndProcessURI = async () => {
  errorMessage.value = ''
  try {
    const uri = new URL(sourceURI.value)
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
