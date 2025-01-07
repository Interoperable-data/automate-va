<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { i18nStore } from "../components/providers/i18nHost";

// As a component, translation is done using the main ts plugin
// AuthView is a component, so it MUST use the plugin directly,
// but the locale is available in the store, so it can be watched
const { t, locale } = useI18n();
const newLocale = computed(() => i18nStore.selectedLocale);
watchEffect(() => {
  console.log(`Language captured in HomeView watcher, changed to ${newLocale.value}!`);
  locale.value = newLocale.value;
});

// FAILS - Direct inject does not work in normal components
// FAILS ALSO - using props in RouterView get
// import { inject } from 'vue';
// import { I18nInjectionKey } from 'vue-i18n';
// const i18n = inject(I18nInjectionKey);
// const t = i18n!.global.t;
// const locale = i18n!.global.locale;
import { sessionStore } from "../components/providers/LWSHost";
</script>

<template>
  <div class="home">
    <h1>{{ t("welcome") }}</h1>
    <p>{{ t("message") }}</p>
    <!-- <p>[PROPS - Locale {{ props.justAProp }} in Homeview: {{ props.loc }}]</p> -->
    <p>Locale in Homeview: [{{ locale }}, {{ newLocale }}]</p>
    <translation-tester name="Matthijs">
      {{ t("all") }}
      {{
        sessionStore.loggedInWebId
          ? `Logged in webId: ${sessionStore.loggedInWebId}`
          : t("notConnected")
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
      "welcome": "Bienvenu `a` Home View",
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
