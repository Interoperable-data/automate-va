<template>
  <div
    v-if="stepLabel && stepDescription"
    class="card draggable-container"
    draggable="true"
    @dragstart="onDragStart"
  >
    <!-- Draggable Bar -->
    <div class="drag-bar">
      <span>:: Drag</span>
    </div>

    <div class="card-header">
      <h5 class="card-title">{{ stepLabel }}</h5>
      <h6 class="card-subtitle text-muted">{{ stepDescription }}</h6>
    </div>
    <div class="card-body">
      <!-- Use shacl-form with documented "data-" props -->
      <shacl-form
        v-if="shapeText"
        :data-shapes="shapeText"
        :data-shape-subject="shapeSubject"
        @change="onFormChange"
      />

      <button class="btn btn-primary mt-3" :disabled="!isValid" @click="goNext">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { fetchTurtleFile } from '../helpers/localFileFetch.ts';

  // Props
  const props = defineProps<{
    formShapeUrl?: string; // Optional URL for the SHACL shape
    shapeSubject: string; // Required subject for the SHACL form
    stepLabel: string; // Required label for the step
    stepDescription: string; // Required description for the step
  }>();

  // Emits
  const emit = defineEmits(['stepCompleted', 'dragstart']);

  // Local state
  const shapeText = ref('');
  const isValid = ref(false);
  const submittedData = ref('');

  // Fetch the SHACL shapes file on mount
  onMounted(async () => {
    if (props.formShapeUrl) {
      try {
        shapeText.value = await fetchTurtleFile(props.formShapeUrl);
      } catch (error) {
        console.error('Error fetching SHACL shape:', error);
      }
    } else {
      shapeText.value = ''; // Set to falsy value if formShapeUrl is absent
    }
  });

  // Fired each time form changes
  function onFormChange(event: CustomEvent) {
    isValid.value = !!event.detail?.valid;
    if (isValid.value) {
      const formElement = event.target as HTMLElement & { serialize: () => string };
      submittedData.value = formElement.serialize();
      console.log('Form data (Turtle)', submittedData.value);
    }
  }

  // Move to the next step if valid
  function goNext() {
    if (isValid.value) {
      emit('stepCompleted', submittedData.value);
    }
  }

  // Emit dragstart event
  function onDragStart(event: DragEvent) {
    emit('dragstart', event); // Emit the DragEvent itself
  }

  // Provide a name for the custom element build
  defineOptions({ name: 'ShapeStep' });
</script>

<style scoped>
  .draggable-container {
    cursor: move;
    margin: 1rem auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .drag-bar {
    background-color: #e9ecef;
    padding: 0.5rem;
    cursor: grab;
    text-align: center;
    font-weight: bold;
    border-bottom: 1px solid #dee2e6;
  }

  .drag-bar:active {
    cursor: grabbing;
  }

  .card-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }

  .card-body {
    padding: 1rem;
  }
</style>
