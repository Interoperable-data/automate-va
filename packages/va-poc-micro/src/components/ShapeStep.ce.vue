<template>
  <div>
    <h2>{{ stepLabel }}</h2>
    <p>{{ stepDescription }}</p>

    <!-- Use shacl-form with documented "data-" props -->
    <!-- data-shape-subject="era:OrgOrFormalOrgShape" FAILS -->
    <!-- data-values-subject="http://example.org/newResource" -->
    <shacl-form
      v-if="shapeText"
      :data-shapes="shapeText"
      data-shape-subject="http://data.europa.eu/949/OrgOrFormalOrgShape"
      @change="onFormChange"
    />

    <button :disabled="!isValid" @click="goNext">Next</button>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { ShaclForm } from '@ulb-darmstadt/shacl-form';

  // Props
  const props = defineProps<{
    shapeUrl?: string;
    stepLabel?: string;
    stepDescription?: string;
  }>();

  // Default prop values
  const {
    shapeUrl = new URL('../public/form-shapes/organisation-start.ttl', import.meta.url).href, // Corrected file reference
    stepLabel = 'Add Organisation - Step 1',
    stepDescription = 'Add your organisation’s basic data.',
  } = props;

  // Emits
  const emit = defineEmits(['stepCompleted']);

  // Local state
  const shapeText = ref('');
  const isValid = ref(false);
  const submittedData = ref('');

  // Fetch the SHACL shapes file on mount
  onMounted(async () => {
    try {
      const response = await fetch(shapeUrl);
      console.log(response);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch shape file: ${response.statusText}`);
      }
      shapeText.value = await response.text();
    } catch (error) {
      console.error('Error fetching SHACL shape:', error);
    }
  });

  // Fired each time form changes
  function onFormChange(event: CustomEvent) {
    isValid.value = !!event.detail?.valid;
    if (isValid.value) {
      // "event.target" is the shacl-form element
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

  // Provide a name for the custom element build
  defineOptions({ name: 'ShapeStep' });
</script>
