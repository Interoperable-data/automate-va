<script setup lang="ts">
  import { ref, defineProps } from 'vue';

  // Define incoming prop for display
  defineProps<{ msg: string }>();
  const count = ref(0);

  // (Optional) Handle the stepCompleted event
  function handleCompleted(turtleData: string) {
    console.log('SHACL form data submitted:', turtleData);
  }
</script>

<template>
  <header>
    <h1>Welcome to Organisation Management</h1>
  </header>

  <!-- shape-step is already registered globally in main.ts -->
  <shape-step
    :step-label="'Add Organisation - Step 1'"
    :step-description="'Fill out the basic organisation data...'"
    shape-url="../form-shapes/organisation-start.ttl"
    @stepCompleted="handleCompleted"
  />

</template>

<style scoped>
  header {
    margin-bottom: 1rem;
  }

  .read-the-docs {
    color: #888;
  }
</style>
