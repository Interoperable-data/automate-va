<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ref, watchEffect } from "vue";
import { getTypeIndexContainers, getProfileInfo, getTypeRegistrationsFromContainers, sessionStore, type TypeRegistration } from "./providers/LWSHost";

const props = defineProps<{ name: string }>();

const { t, locale } = useI18n({
  inheritLocale: true,
  useScope: "local",
});

// Read the profile
const solidProfileName = ref<string | null>(null);
const typeIndexContainers = ref<URL[]>([]);
const typeRegistrations = ref<TypeRegistration[]>([]);

watchEffect(async () => {
  if (!sessionStore.loggedInWebId) return;
  const webId = new URL(sessionStore.loggedInWebId);

  try {
    const profileInfo = await getProfileInfo(webId);
    solidProfileName.value = profileInfo.name;

    typeIndexContainers.value = await getTypeIndexContainers(webId);
    typeRegistrations.value = await getTypeRegistrationsFromContainers(typeIndexContainers.value);
  } catch (error) {
    console.error('Error fetching profile info, type index containers, or type registrations:', error);
  }
});
</script>

<template>
  <h3>{{ props.name }}</h3>
  <div>
    {{ solidProfileName || props.name }} says [{{ locale }}]: {{ t("hello") + " " + t("world") }}
  </div>
  <ul>
    <li v-for="container in typeIndexContainers" :key="container.href">
      {{ container.href }}
      <ul>
        <li v-for="registration in typeRegistrations.filter(reg => reg.foundIn === container.href)"
          :key="registration.forClass">
          {{ registration.forClass }} in {{ registration.inContainer }}
        </li>
      </ul>
    </li>
  </ul>
  <slot id="first">Loading...</slot>
</template>

<i18n>
  {
    "en": {
      "world": " world!"
    },
    "fr": {
      "world": "monde!"
    },
    "de": {
      "world": "welt!"
    },
    "es": {
      "world": "mundo!"
    }
  }
</i18n>
