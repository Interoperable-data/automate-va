<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { i18nStore } from "../components/providers/i18nHost";
import { sessionStore } from "../components/providers/LWSHost";

// As a component, translation is done using the main ts plugin
// AuthView is a component, so it MUST use the plugin directly,
// but the locale is available in the store, so it can be watched
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
  <div class="about">
    <h1>{{ t("welcome") }}</h1>
    <!-- <p>[Locale in Authview: {{ i18n!.global.locale || props.loc  }}]</p> -->
    <p>{{ t("message") }}</p>
    <!-- <p>Locale in Homeview: [{{ locale }}, {{ newLocale }}]</p> -->
    <translation-tester name="ERA">
      {{ t("all") }}
      {{
        sessionStore.loggedInWebId
          ? `Logged in webId: ${sessionStore.loggedInWebId}`
          : t("notConnected")
      }}
    </translation-tester>
  </div>
</template>

<i18n>
  {
    "en": {
      "welcome": "LWS Storage Manager",
      "message": "Manage all profile related data in your LWS",
      "all": "All other web components here as they use storage.",
      "notConnected": "Not connected to LWS."
    },
    "fr": {
      "message": "Gerez toutes les données de profil dans votre LWS",
      "all": "Tous les autres composants Web ici car ils utilisent le stockage.",
      "notConnected": "Pas connecté à LWS."
    },
    "de": {
      "message": "Verwalten Sie alle profilbezogenen Daten in Ihrem LWS",
      "all": "Alle anderen Webkomponenten hier, da sie den Speicher verwenden.",
      "notConnected": "Nicht mit LWS verbunden."
    },
    "es": {
      "message": "Administre todos los datos relacionados con el perfil en su LWS",
      "all": "Todas las demás webcomponents aquí ya que usan almacenamiento.",
      "notConnected": "No conectado a LWS."
    }
  }
</i18n>
