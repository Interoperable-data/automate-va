<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ref, watchEffect } from "vue";
import { getProfileAll, getWebIdDataset, getPodUrlAllFrom, getThing, getStringNoLocale } from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import { FOAF } from "@inrupt/vocab-common-rdf";

const props = defineProps<{ name: string }>();

const { t, locale } = useI18n({
  inheritLocale: true,
  useScope: "local",
});

// Read the profile
import { sessionStore } from "./providers/LWSHost";
const solidProfile = ref(null);
watchEffect(async () => {
  if (!sessionStore.loggedInWebId) return;
  const webId = sessionStore.loggedInWebId

  // const profile = await getWebIdDataset(webId, { fetch: fetch });
  // const podRoot = getPodUrlAllFrom(
  //   { webIdProfile: profile, altProfileAll: [] },
  //   webId
  // );
  // const profileThing = getThing(profile, webId);
  // const name = getStringNoLocale(profileThing, FOAF.name);
  // solidProfile.value = JSON.stringify(profile, null, 2) || "No profile found";

  
});
</script>

<template>
  <h3>{{ podRoot }}</h3>
  <div>
    {{ solidProfile || props.name }} says [{{ locale }}]: {{ t("hello") + " " + t("world") }}
  </div>
  <slot id="first">Loading...</slot>
</template>

<i18n>
  {
    "en": {
      "world": " world!",
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
