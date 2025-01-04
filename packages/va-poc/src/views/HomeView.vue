<script setup lang="ts">
import { sessionStore } from "../components/providers/LWSHost";
</script>

<template>
  <div class="home">
    <h1>Welcome to Home View</h1>
    <p>This is the root path of the application.</p>
    <translation-tester name="Matthijs"
      >All other web components here as they use storage.
      {{
        sessionStore.loggedInWebId
          ? `Logged in webId: ${sessionStore.loggedInWebId}`
          : "Not connected to LWS."
      }}</translation-tester
    >
  </div>
</template>
