<template>
  <div class="process-finder">
    <label for="process-url">Enter Process URL:</label>
    <input
      id="process-url"
      type="text"
      v-model="processUrl"
      placeholder="Enter a file URL, SPARQL endpoint, or Solid Pod URL"
    />
    <button @click="checkUrl">Check URL</button>
    <p v-if="urlType">
      Detected URL Type: <strong>{{ urlType }}</strong>
    </p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { checkUrlType, TargetType } from '../helpers/remoteFileFetch';

  // Props and emits
  const emit = defineEmits(['urlValidated']);

  const processUrl = ref('');
  const urlType = ref<TargetType | null>(null);
  const errorMessage = ref<string | null>(null);

  async function checkUrl() {
    try {
      errorMessage.value = null; // Reset error message
      urlType.value = null; // Reset URL type

      if (!processUrl.value) {
        throw new Error('Please enter a valid URL.');
      }

      // Use the helper from remoteFileFetch to determine the URL type
      urlType.value = await checkUrlType(processUrl.value);

      // Emit the URL if it is valid and of a supported type
      if (urlType.value === TargetType.TurtleFile || urlType.value === TargetType.SparqlEndpoint) {
        emit('urlValidated', processUrl.value);
      } else {
        throw new Error(
          'Unsupported URL type. Please provide a valid Turtle file or SPARQL endpoint.'
        );
      }
    } catch (error) {
      errorMessage.value = error.message || 'An error occurred while checking the URL.';
    }
  }
</script>

<style scoped>
  .process-finder {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .error {
    color: red;
    font-size: 0.9rem;
  }
</style>
