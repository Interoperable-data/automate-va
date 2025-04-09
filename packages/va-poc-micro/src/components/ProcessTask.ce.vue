<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import {
    getThing,
    getStringNoLocale,
    getUrl,
    getThingAll,
    type SolidDataset,
    type Thing,
  } from '@inrupt/solid-client';
  import { RDF, RDFS, DCTERMS } from '@inrupt/vocab-common-rdf';
  import { fetchTurtleFile, parseTurtleToSolidDataset } from '../helpers/localFileFetch';

  // Props
  const props = defineProps<{
    processFileUrl: string; // URL of the process file
  }>();

  // Emits
  const emit = defineEmits(['turtleContentUpdated']);

  // State variables
  const currentStep = ref<Thing | null>(null);
  const steps = ref<Thing[]>([]);
  const isLoading = ref(true); // Loading state
  const tasks = ref<Thing[]>([]); // List of tasks
  const selectedTask = ref<Thing | null>(null); // User-selected task

  // Process and task details
  const processLabel = ref('');
  const processComment = ref('');
  const taskComment = ref('');

  // Internal state for the fully qualified URL
  const resolvedProcessFileUrl = ref('');

  // Add a reactive variable to store the dataset
  const dataset = ref<SolidDataset | null>(null);

  // Resolve the process file URL internally
  function resolveProcessFileUrl() {
    try {
      resolvedProcessFileUrl.value = new URL(props.processFileUrl, import.meta.url).href;
      console.log('Resolved process file URL:', resolvedProcessFileUrl.value);
    } catch (error) {
      console.error('Error resolving process file URL:', error);
      resolvedProcessFileUrl.value = props.processFileUrl; // Fallback to the provided value
    }
  }

  // Function to fetch and parse the process file
  async function fetchProcessFile() {
    try {
      console.log('Fetching Turtle content from:', resolvedProcessFileUrl.value);

      // Fetch the Turtle content
      const turtleContent = await fetchTurtleFile(resolvedProcessFileUrl.value);
      console.log('Fetched Turtle content:', turtleContent);

      // Emit the Turtle content to the parent
      emit('turtleContentUpdated', turtleContent);
      console.log('Emitted Turtle content to parent.');

      // Convert the RDF/JS dataset into a SolidDataset and store it in the reactive variable
      dataset.value = await parseTurtleToSolidDataset(turtleContent);
      console.log('Converted Turtle content into SolidDataset:', dataset.value);

      // Discover process-level metadata
      discoverProcessData();

      // Discover tasks dynamically
      tasks.value = discoverTasks();
      if (tasks.value.length === 0) {
        console.warn('No tasks found in the dataset.');
        return;
      }

      console.log('Discovered tasks:', tasks.value);
    } catch (error) {
      console.error('Error fetching or parsing process file:', error);
    } finally {
      isLoading.value = false; // Set loading state to false
      console.log('Loading state set to false.');
    }
  }

  // Function to handle task selection
  function handleTaskSelection(task: Thing) {
    if (!dataset.value) {
      console.error('Dataset is not available. Cannot handle task selection.');
      return;
    }

    selectedTask.value = task;
    taskComment.value = getStringNoLocale(task, RDFS.comment) || '';

    // Discover the first step of the selected task
    const firstStep = getFirstStep(task);
    if (!firstStep) {
      console.warn('No steps found for the selected task.');
      steps.value = [];
      currentStep.value = null;
      return;
    }

    // Extract the sequence of steps
    steps.value = extractSteps(firstStep);
    currentStep.value = steps.value[0];
    console.log('Extracted steps:', steps.value);
  }

  // Function to dynamically discover the first step of a task
  function getFirstStep(taskThing: Thing): Thing | null {
    if (!dataset.value) {
      console.error('Dataset is not available. Cannot get the first step.');
      return null;
    }

    const firstStepUrl = getUrl(taskThing, RDF.first);
    if (!firstStepUrl) {
      console.warn('No first step found for task:', taskThing);
      return null;
    }
    return getThing(dataset.value, firstStepUrl);
  }

  // Function to extract steps dynamically
  function extractSteps(firstStep: Thing): Thing[] {
    if (!dataset.value) {
      console.error('Dataset is not available. Cannot extract steps.');
      return [];
    }

    const stepSequence: Thing[] = [];
    let currentStep = firstStep;

    while (currentStep) {
      stepSequence.push(currentStep);

      // Get the next step using `rdf:rest`
      const nextStepUrl = getUrl(currentStep, RDF.rest);
      if (!nextStepUrl || nextStepUrl === RDF.nil) break;

      currentStep = getThing(dataset.value, nextStepUrl) || null;
    }

    console.log('Extracted step sequence:', stepSequence);
    return stepSequence;
  }

  // Function to discover process-level metadata
  function discoverProcessData(): void {
    if (!dataset.value) {
      console.error('Dataset is not available. Cannot discover process data.');
      return;
    }

    const allThings = getThingAll(dataset.value);

    // Find the process Thing (assumes it's the first Thing of type `dul:Process`)
    const processThing = allThings.find((thing) => {
      const type = getUrl(thing, RDF.type);
      return type === 'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Process';
    });

    if (processThing) {
      processLabel.value = getStringNoLocale(processThing, RDFS.label) || 'Unknown Process';
      processComment.value = getStringNoLocale(processThing, RDFS.comment) || '';
      console.log('Discovered process data:', {
        processLabel: processLabel.value,
        processComment: processComment.value,
      });
    } else {
      console.warn('No process data found in the dataset.');
    }
  }

  // Function to dynamically discover tasks in the dataset
  function discoverTasks(): Thing[] {
    if (!dataset.value) {
      console.error('Dataset is not available. Cannot discover tasks.');
      return [];
    }

    const allThings = getThingAll(dataset.value);
    return allThings.filter((thing) => {
      const type = getUrl(thing, RDF.type);
      return (
        type === 'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Task' ||
        type === 'http://www.w3.org/ns/prov#Action'
      );
    });
  }

  // Resolve the process file URL and fetch the process file on mount
  onMounted(() => {
    resolveProcessFileUrl();
    fetchProcessFile();
  });
</script>

<template>
  <div class="process-task">
    <!-- Process Header -->
    <header>
      <h1>{{ processLabel }}</h1>
      <p class="process-comment">{{ processComment }}</p>
    </header>

    <!-- Task Selection -->
    <section v-if="tasks.length > 0" class="task-selection">
      <label for="task-select">Select a Task:</label>
      <select id="task-select" v-model="selectedTask" @change="handleTaskSelection(selectedTask)">
        <option v-for="task in tasks" :key="task.url" :value="task">
          {{ getStringNoLocale(task, RDFS.label) || 'Unnamed Task' }}
        </option>
      </select>
    </section>

    <!-- Task Details -->
    <section v-if="selectedTask" class="task-details">
      <h2>Task Details</h2>
      <p>{{ taskComment }}</p>
    </section>

    <!-- Show loading state -->
    <div v-if="isLoading" class="loading-state">Loading process...</div>

    <!-- Dynamically render the ShapeStep component based on the current step -->
    <shape-step
      v-else-if="currentStep"
      :step-label="getStringNoLocale(currentStep, RDFS.label)"
      :step-description="getStringNoLocale(currentStep, DCTERMS.description)"
      :shape-url="getUrl(currentStep, DCTERMS.source)"
      @stepCompleted="handleStepCompleted"
    />

    <!-- Show a message if no steps -->
    <div v-else class="no-steps">No steps available.</div>
  </div>
</template>

<style scoped>
  .process-task {
    padding: 1rem;
  }

  header {
    margin-bottom: 1rem;
  }

  .process-comment {
    font-size: 1rem;
    color: #666;
  }

  .task-selection {
    margin-bottom: 1rem;
  }

  .task-details {
    margin-bottom: 2rem;
  }

  .loading-state {
    font-size: 1.2rem;
    color: #888;
    text-align: center;
    margin-top: 2rem;
  }

  .no-steps {
    font-size: 1.2rem;
    color: #888;
    text-align: center;
    margin-top: 2rem;
  }
</style>
