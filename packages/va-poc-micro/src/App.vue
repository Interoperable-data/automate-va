<script setup lang="ts">
  import { ref } from 'vue';

  const turtleContent = ref(''); // Shared state for Turtle content

  // Handle updates to the Turtle content from ProcessTask
  function updateTurtleContent(event: Event) {
    try {
      // Extract content from event.detail
      const content = (event as CustomEvent).detail?.[0];

      if (typeof content !== 'string') {
        throw new Error('Invalid content type: Expected a string in event.detail[0].');
      }
      turtleContent.value = content;
    } catch (error) {
      console.error('Error updating Turtle content:', error);
      console.error('Received event:', event);

      turtleContent.value = ''; // Reset to an empty string in case of an error
    }
  }

  // Handle dragstart event
  function onDragStart(event) {
    console.log('Drag started:', event);
  }

  // Handle drop event
  function onDrop(slot) {
    console.log('Dropped into slot:', slot);
  }
</script>

<template>
  <process-task-viewer @dragstart="onDragStart" @drop="onDrop">
    <!-- Left Section: ProcessTask -->
    <process-task
      slot="left"
      process-file-url="../../public/process/Organisations.ttl"
      @turtleContentUpdated="updateTurtleContent"
    ></process-task>

    <!-- Middle Section: ShapeStep -->
    <!-- WORKS <shape-step
      slot="middle"
      step-label="Middle Slot Test Step"
      step-description="This is a test ShapeStep in the middle slot."
      form-shape-url="./public/form-shapes/organisation-start.ttl"
      shape-subject="http://data.europa.eu/949/OrgOrFormalOrgShape"
    ></shape-step> -->

    <!-- Right Section: TurtleViewer -->
    <turtle-viewer slot="right" :ttl-content="turtleContent"></turtle-viewer>
  </process-task-viewer>
</template>

<style scoped>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
  }
  .search-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 1.2rem;
    color: #888;
    border: 1px dashed #ccc;
  }
</style>
