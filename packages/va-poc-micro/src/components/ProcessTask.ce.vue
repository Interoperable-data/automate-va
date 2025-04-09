<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  fromRdfJsDataset,
  getThing,
  getStringNoLocale,
  getUrl,
  getThingAll,
  type SolidDataset,
  type Thing,
} from '@inrupt/solid-client'
import { RDF, RDFS, DCTERMS } from '@inrupt/vocab-common-rdf'
import { parseTurtleFromUrl } from '../helpers/localFileFetch'

// State variables
const currentStep = ref<Thing | null>(null)
const steps = ref<Thing[]>([])
const isLoading = ref(true) // Loading state
const processFileUrl = new URL('../../public/process/Organisations.ttl', import.meta.url).href

// Function to fetch and parse the process file
async function fetchProcessFile() {
  try {
    // Parse the Turtle content directly from the URL into an RDF/JS dataset
    const rdf = await parseTurtleFromUrl(processFileUrl);

    // Convert the RDF/JS dataset into a SolidDataset
    const dataset: SolidDataset = fromRdfJsDataset(rdf);

    // Extract all Things (steps) from the dataset
    const allThings = getThingAll(dataset);

    // Find the first step using `rdf:first`
    const firstStep = allThings.find((thing) =>
      getUrl(thing, RDF.first)
    );

    if (firstStep) {
      // Extract the sequence of steps
      steps.value = extractSteps(firstStep, dataset);
      currentStep.value = steps.value[0];
    }
  } catch (error) {
    console.error('Error fetching or parsing process file:', error);
  } finally {
    isLoading.value = false; // Set loading state to false
  }
}

// Function to extract steps from the dataset
function extractSteps(firstStep: Thing, dataset: SolidDataset): Thing[] {
  const stepSequence: Thing[] = [];
  let currentStep = firstStep;

  while (currentStep) {
    stepSequence.push(currentStep);

    // Get the next step using `rdf:rest`
    const nextStepUrl = getUrl(currentStep, RDF.rest);
    if (!nextStepUrl || nextStepUrl === RDF.nil) break;

    currentStep = getThing(dataset, nextStepUrl) || null;
  }

  return stepSequence;
}

// Handle step completion and move to the next step
function handleStepCompleted(turtleData: string) {
  console.log('Step completed with data:', turtleData);

  const currentIndex = steps.value.findIndex((step) => step === currentStep.value);
  if (currentIndex < steps.value.length - 1) {
    currentStep.value = steps.value[currentIndex + 1];
  } else {
    console.log('All steps completed!');
  }
}

// Fetch the process file on mount
onMounted(fetchProcessFile);
</script>

<template>
  <header>
    <h1>Welcome to Organisation Management</h1>
  </header>

  <!-- Show loading state -->
  <div v-if="isLoading">Loading process...</div>

  <!-- Dynamically render the ShapeStep component based on the current step -->
  <shape-step
    v-else-if="currentStep"
    :step-label="getStringNoLocale(currentStep, RDFS.label)"
    :step-description="getStringNoLocale(currentStep, DCTERMS.description)"
    :shape-url="getUrl(currentStep, DCTERMS.source)"
    @stepCompleted="handleStepCompleted"
  />

  <!-- Show a message if no steps -->
  <div v-else>No steps available.</div>
</template>

<style scoped>
header {
  margin-bottom: 1rem;
}
</style>
