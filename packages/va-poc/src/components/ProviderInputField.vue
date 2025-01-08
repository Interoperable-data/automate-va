<template>
  <b-form-group label="Provider URI">
    <b-form-input
      v-model="processProviderURI"
      @blur="validateAndProcessURI"
      placeholder="Enter a Solid Pod WebId, SPARQL endpoint URL, or Turtle file URL"
    ></b-form-input>
    <b-form-text v-if="errorMessage" class="text-danger">{{
      errorMessage
    }}</b-form-text>
  </b-form-group>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useStore } from "vuex";
import {
  isWebId,
  isSparqlEndpoint,
  isTurtleFile,
  fetchData,
} from "./providers/LWSHost";

const processProviderURI = ref("");
const errorMessage = ref("");
const store = useStore();

const validateAndProcessURI = async () => {
  errorMessage.value = "";
  if (isWebId(processProviderURI.value)) {
    await processWebId(processProviderURI.value);
  } else if (isSparqlEndpoint(processProviderURI.value)) {
    await processSparqlEndpoint(processProviderURI.value);
  } else if (isTurtleFile(processProviderURI.value)) {
    await processTurtleFile(processProviderURI.value);
  } else {
    errorMessage.value =
      "Invalid URI. Please enter a valid WebId, SPARQL endpoint URL, or Turtle file URL.";
  }
};

const processWebId = async (uri) => {
  try {
    const data = await fetchData(uri);
    if (data) {
      store.commit("addProviderData", { key: uri, value: data });
    } else {
      errorMessage.value = "No relevant instances found in the WebId.";
    }
  } catch (error) {
    errorMessage.value = "Error fetching data from WebId.";
  }
};

const processSparqlEndpoint = async (uri) => {
  try {
    const data = await fetchData(uri);
    if (data) {
      store.commit("addProviderData", { key: uri, value: data });
    } else {
      errorMessage.value =
        "No relevant instances found in the SPARQL endpoint.";
    }
  } catch (error) {
    errorMessage.value = "Error fetching data from SPARQL endpoint.";
  }
};

const processTurtleFile = async (uri) => {
  try {
    const data = await fetchData(uri);
    if (data) {
      store.commit("addProviderData", { key: uri, value: data });
    } else {
      errorMessage.value = "No relevant instances found in the Turtle file.";
    }
  } catch (error) {
    errorMessage.value = "Error fetching data from Turtle file.";
  }
};
</script>

<style scoped>
.text-danger {
  color: red;
}
</style>
