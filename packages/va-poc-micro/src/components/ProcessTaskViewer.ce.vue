<!-- filepath: c:\Projects\va-automate-poc-lws\automate-va\packages\va-poc-micro\src\components\ProcessTaskViewer.ce.vue -->
<template>
  <div class="process-task-viewer">
    <!-- Left Section -->
    <div
      class="grid-item left"
      :class="{ 'drop-active': activeDropZone === 'left' }"
      @dragover.prevent
      @dragenter="onDragEnter('left')"
      @dragleave="onDragLeave"
      @drop="onDrop('left')"
      @dragstart="onDragStart"
    >
      <slot name="left"></slot>
    </div>

    <!-- Middle Section -->
    <div
      class="grid-item middle"
      :class="{ 'drop-active': activeDropZone === 'middle' }"
      @dragover.prevent
      @dragenter="onDragEnter('middle')"
      @dragleave="onDragLeave"
      @drop="onDrop('middle')"
      @dragstart="onDragStart"
    >
      <slot name="middle">Search Component Placeholder</slot>
    </div>

    <!-- Right Section -->
    <div
      class="grid-item right"
      :class="{ 'drop-active': activeDropZone === 'right' }"
      @dragover.prevent
      @dragenter="onDragEnter('right')"
      @dragleave="onDragLeave"
      @drop="onDrop('right')"
      @dragstart="onDragStart"
    >
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  // Provide a name for the custom element build
  defineOptions({ name: 'ProcessTaskViewer' });

  // State to track the currently dragged element
  const draggedElement = ref<HTMLElement | null>(null);
  const activeDropZone = ref<string | null>(null); // Track the active drop zone

  // Handle dragstart event from child components
  function onDragStart(event: DragEvent) {
    draggedElement.value = event.target as HTMLElement; // Store the dragged element
    console.log('Drag started:', draggedElement.value);
  }

  // Handle dragenter to highlight the drop area
  function onDragEnter(zone: string) {
    activeDropZone.value = zone; // Set the active drop zone
  }

  // Handle dragleave to remove the highlight
  function onDragLeave() {
    activeDropZone.value = null; // Clear the active drop zone
  }

  // Handle drop
  function onDrop(targetSlot: string) {
    if (draggedElement.value) {
      console.log(`Dropped into slot: ${targetSlot}`);

      // Find the target slot container
      const targetContainer = document.querySelector(`[slot="${targetSlot}"]`);

      if (targetContainer) {
        // Append the dragged element directly to the target container
        targetContainer.appendChild(draggedElement.value);
        console.log('Element moved to new slot');
      }

      // Reset the dragged element and active drop zone
      draggedElement.value = null;
      activeDropZone.value = null;
    }
  }
</script>

<style scoped>
  .process-task-viewer {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr; /* Three equal columns */
    gap: 1rem;
    height: 100vh; /* Full viewport height */
  }

  .grid-item {
    display: flex; /* Use flexbox for stacking */
    flex-direction: column; /* Stack children vertically */
    align-items: stretch; /* Ensure children take full width */
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    overflow: auto;
    min-height: 200px; /* Ensure drop areas are visible */
    transition: background-color 0.3s ease;
  }

  .grid-item.drop-active {
    background-color: #e0f7fa; /* Highlight drop area */
  }

  .left {
    background-color: #f8f9fa;
  }

  .middle {
    background-color: #ffffff;
  }

  .right {
    background-color: #f8f9fa;
  }
</style>
