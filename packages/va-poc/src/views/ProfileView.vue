<script setup lang="ts">
import { computed, watchEffect } from "vue";

// stores
import { sessionStore } from "../components/providers/LWSHost";

// translation
import { useI18n } from "vue-i18n";
import { i18nStore } from "../components/providers/i18nHost";
const { t, locale } = useI18n();
const newLocale = computed(() => i18nStore.selectedLocale);
watchEffect(() => {
  console.log(
    `Language captured in ProfileView watcher, changed to ${newLocale.value}!`
  );
  locale.value = newLocale.value;
});
</script>

<template>
  <section class="about">
    <h1>{{ t("welcome") }}</h1>
    <p>{{ t("message") }}</p>
    <BContainer>
      {{ sessionStore.ownPodURLs }}
    </BContainer>
  </section>
</template>

<i18n>
  {
    "en": {
      "welcome": "LWS Storage Manager",
      "message": "Manage the Containers to store Linked data Class instances in.",
      "all": "All other web components here as they use storage.",
      "notConnected": "Not connected to LWS."
    },
    "fr": {
      "message": "",
      "all": "Tous les autres composants Web ici car ils utilisent le stockage.",
      "notConnected": "Pas connecté à LWS."
    },
    "de": {
      "message": "",
      "all": "Alle anderen Webkomponenten hier, da sie den Speicher verwenden.",
      "notConnected": "Nicht mit LWS verbunden."
    },
    "es": {
      "message": "",
      "all": "Todas las demás webcomponents aquí ya que usan almacenamiento.",
      "notConnected": "No conectado a LWS."
    }
  }
</i18n>
