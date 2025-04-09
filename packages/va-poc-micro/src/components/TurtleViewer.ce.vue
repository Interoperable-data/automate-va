<!-- filepath: c:\Projects\va-automate-poc-lws\automate-va\packages\va-poc-micro\src\components\TurtleViewer.ce.vue -->
<template>
  <div class="turtle-viewer draggable-container" draggable="true" @dragstart="onDragStart">
    <!-- Draggable Bar -->
    <div class="drag-bar">
      <span>:: Drag</span>
    </div>

    <!-- Non-editable block for @base and @prefix -->
    <div class="non-editable-block">
      <pre>
        <code class="turtle">
          {{ base || 'No @base defined.' }}{{ base ? ' .' : '' }}
          {{ prefixes || 'No @prefixes defined.' }}
        </code>
      </pre>
    </div>

    <!-- Editable block for the rest of the TTL -->
    <div class="editable-block">
      <textarea
        v-model="editableContent"
        class="editable-textarea"
        spellcheck="false"
        rows="15"
        placeholder="No content available to edit."
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';

  // Props
  const props = defineProps<{
    ttlContent: string; // The full TTL content to display
  }>();

  // Emits
  const emit = defineEmits(['dragstart']);

  // Local state
  const base = ref('');
  const prefixes = ref('');
  const editableContent = ref('');

  // Watch for changes in the TTL content and split it into sections
  watch(
    () => props.ttlContent,
    (newContent) => {
      if (newContent) {
        const lines = newContent.split('\n');
        const baseLine = lines.find((line) => line.startsWith('@base'));
        const prefixLines = lines.filter((line) => line.startsWith('@prefix'));
        const otherLines = lines.filter(
          (line) => !line.startsWith('@base') && !line.startsWith('@prefix')
        );

        base.value = baseLine ? baseLine.trim() : '';
        prefixes.value = prefixLines.map((line) => line.trim()).join('\n');
        editableContent.value = otherLines.join('\n');
      } else {
        base.value = '';
        prefixes.value = '';
        editableContent.value = '';
      }
      console.log('TurtleViewer received updated ttlContent:', newContent);
    },
    { immediate: true }
  );

  // Emit dragstart event
  function onDragStart(event: DragEvent) {
    emit('dragstart', event); // Emit the DragEvent itself
  }
</script>

<style scoped>
  .turtle-viewer {
    font-family: 'Courier New', Courier, monospace;
    margin: 1rem auto;
    max-width: 800px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .draggable-container {
    cursor: move;
  }

  .drag-bar {
    background-color: #e9ecef;
    padding: 0.5rem;
    cursor: grab;
    text-align: center;
    font-weight: bold;
    border-bottom: 1px solid #ddd;
  }

  .drag-bar:active {
    cursor: grabbing;
  }

  .non-editable-block {
    background-color: #f8f9fa;
    padding: 1rem;
    border-bottom: 1px solid #ddd;
    text-align: left; /* Ensure left alignment */
  }

  .non-editable-block pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .editable-block {
    padding: 1rem;
  }

  .editable-textarea {
    width: 100%;
    height: auto;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 0.5rem;
    resize: vertical;
    background-color: #fff;
    text-align: left; /* Ensure left alignment */
  }
</style>
