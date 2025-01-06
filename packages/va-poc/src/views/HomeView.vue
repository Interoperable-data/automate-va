<script setup lang="ts">
import { sessionStore } from "../components/providers/LWSHost";

// As a component, translation is done using the plugin
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>

<template>
  <div class="home">
    <h1>{{ t('welcome') }}</h1>
    <p>{{ t('message') }}</p>
    <!-- <p>Locale in Homeview: {{ locale }}</p> -->
    <translation-tester name="Matthijs">
      {{ t('all') }}
      {{
        sessionStore.loggedInWebId
          ? `Logged in webId: ${sessionStore.loggedInWebId}`
          : t('notConnected')
      }}
    </translation-tester>
    <!-- <slot/> -->
  </div>
</template>

<i18n>
  {
    "en": {
      "welcome": "Welcome to Home View",
      "message": "This is the root path of the application.",
      "all": "All other web components here as they use storage.",
      "notConnected": "Not connected to LWS."
    },
    "fr": {
      "welcome": "Bienvenu a Home View",
      "message": "C'est le chemin racine de l'application.",
      "all": "Tous les autres composants Web ici car ils utilisent le stockage",
      "notConnected": "Pas connecté à LWS."
    },
    "de": {
      "welcome": "Willkommen zu Home View",
      "message": "Dies ist der Root der Anwendung.",
      "all": "Alle anderen Webkomponenten hier, da sie den Speicher verwenden.",
      "notConnected": "Nicht mit LWS verbunden."
    },
    "ja": {
      "welcome": "ホームビューへようこそ",
      "message": "これはアプリケーションのルートパスです。",
      "all": "他のすべてのWebコンポーネントがここにあります。",
      "notConnected": "LWSに接続されていません。"
    }
  }
</i18n>
