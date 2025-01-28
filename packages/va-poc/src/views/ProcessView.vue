<script setup lang="ts">
import { computed, watchEffect } from "vue";

// translation
import { useI18n } from "vue-i18n";
import { i18nStore } from "../components/providers/i18nHost";
import { processStore } from "../components/providers/LWSProcessStore"; // Correct import path

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
  <section>
    <h1>{{ t("welcome") }}</h1>
    <p>{{ t("message") }}</p>
  </section>
</template>

<i18n>
  {
    "en": {
      "welcome": "LWS Process Manager",
      "message": "Activate linked containers, containing Process instances, allowing its Tasks to be executed.",
    },
    "fr": {
      "message": "Activer les containers connectés, contenant des instances de processus, permettant l'exécution de ses tâches.",
    },
    "de": {
      "message": "Aktivieren Sie Linked Containers, die Prozessinstanzen enthalten, damit Aufgaben ausgeführt werden können.",
    },
    "es": {
      "message": "Active los contenedores vinculados (Linked Containers), que contienen instancias de procesos, permitiendo que sus tareas se ejecuten.",
    }
  }
</i18n>
