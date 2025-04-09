<script setup lang="ts">
  const sampleTtl = `
@base <https://example.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix ex: <http://example.org/> .

ex:Resource1 a ex:Class1 ;
    rdfs:label "Example Resource" ;
    ex:property "Value" .
`;
</script>

<template>
  <process-task-viewer
    @dragstart="(id) => console.log(`Drag started for ID: ${id}`)"
    @drop="(slot) => console.log(`Dropped into slot: ${slot}`)"
  >
    <!-- Left Section: ShapeStep -->
    <shape-step
      slot="left"
      id="shape-step-1"
      step-label="Test Step Label"
      step-description="This is a test description for the ShapeStep component."
      form-shape-url="./public/form-shapes/organisation-start.ttl"
    />

    <!-- Middle Section: Placeholder for Search -->
    <div slot="middle" class="search-placeholder">Search Component Placeholder</div>

    <!-- Right Section: TurtleViewer -->
    <turtle-viewer slot="right" :ttl-content="sampleTtl" />
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
