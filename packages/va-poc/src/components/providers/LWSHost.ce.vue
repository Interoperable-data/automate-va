<script setup lang="ts">
/**
 * Linked Web Storage provision component
 * - presents the option to connect to an LWS provider
 * - supports the language of the application
 *
 * Component should be placed on the AuthView, linked to the /auth route, the provider's return path.
 * ===> There it captures the info from the provider and reroutes to /
 *
 * Component should also be placed in the app, linked to the / route and any other where it needs to share the Session object.
 * ===> It should be visible as a button with choices of LWS providers and
 */

import { useI18n } from "vue-i18n";
import { onMounted, ref } from "vue";
import {
  //   CE's do not have the router
  //   useRouter,
  type RouteLocationNormalizedLoadedGeneric,
} from "vue-router";
// const router = useRouter();
import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
  Session,
  fetch,
} from "@inrupt/solid-client-authn-browser";
import { getPodUrlAll } from "@inrupt/solid-client";

// Stores
import { sessionStore } from "./LWSHost";

// Refs
// TODO: values should be props
const SELECTED_IDP = ref("https://login.inrupt.com"); // More options needed

// props
const props = defineProps<{
  routeInfo: RouteLocationNormalizedLoadedGeneric;
  target: string;
}>();

// translate
const { t } = useI18n({
  inheritLocale: true,
  useScope: "local",
});

// login function
const loginToSelectedIdP = () => {
  return login({
    oidcIssuer: SELECTED_IDP.value,
    redirectUrl: new URL("/auth", window.location.href).toString(),
    clientName: "VA Automate",
  });
};

// Component stores the Session it is own memory
const setSession = async (session: Session) => {
  console.log(`(setSession) Session:`, session);
  const routeInfo = props.routeInfo.query;
  if (routeInfo.code && routeInfo.state) {
    console.warn(`Storing session return values`);

    // Inrupt token returned, then store the token and reroute the application
    sessionStore.rerouting = true;
    sessionStore.addSolidPodAuthData({
      token: routeInfo.code,
      state: routeInfo.state,
    });

    // CE's do not have the router from App
    // const home = new URL("/", window.location.href).toString()
    // setTimeout(() => window.location.assign(home), 10000); // reloads and destroys session
    // FIXME: the page reload CAN be caught using a correct use of { restorePreviousSession: true }
  } else {
    console.warn(`No session return values found.`);
  }
  if (session.info.isLoggedIn) {
    sessionStore.canReadPODURLs = true;
    sessionStore.loggedInWebId = session.info.webId!;
    sessionStore.ownPodURLs = await getPodUrlAll(session.info.webId!, {
      fetch: fetch,
    });
  } else {
    console.warn(`No active session found`);
  }
};

// Login
const tryIncomingRedirect = async () => {
  try {
    const currentSession = getDefaultSession();
    console.log(`(tryIncomingRedirect) Current session:`, currentSession);
    if (!currentSession.info.sessionId) {
      //  && !currentSession.info.isLoggedIn should not be checked
      console.log(`Not logged in.`);
      await handleIncomingRedirect({ restorePreviousSession: true });
    } else {
      console.log(`Logged in.`);
      await handleIncomingRedirect(); // no-op if not part of login redirect
    }
    await setSession(currentSession);
  } catch (err) {
    console.error(`Relogin failed with error ${err}`);
  } finally {
    sessionStore.rerouting = false;
  }
};

onMounted(async () => {
  sessionStore.rerouting = true;
  // When the component is mounted, it should check the session
  await tryIncomingRedirect();
  // await nextTick();
  // BUTTON_TARGET.value = "#lws-button";
});

/**
 * Props for the
 * - provider?: string[] - Avoid to hard-code the possible providers, but at least we should support Inrupt
 *    More than one provider should be supported, many known issues with ESS - NSS - CSS login stream
 * - redirectURI: URI | null - given the complexities of Web Components, the component itself should catch the call from the OIDC.
 *    if null: the component should serve as the catcher of this call.
 * - TODO: from analysis
 *
 */
</script>

<template>
  <!-- IS LAUNCHED TOO EARLY <Teleport defer :to="props.target"> -->
  <BButton
    v-if="!sessionStore.loggedInWebId"
    @click="loginToSelectedIdP"
    variant="primary outline-warning"
  >
    {{ t("login") }}
  </BButton>
  <!-- </Teleport> -->
  <slot />
</template>

<style scoped></style>
<i18n>
  {
    "en": {
      "login": "Login to Solid Pod"
    },
    "fr": {
      "login": "Connexion au Solid Pod"
    },
    "de": {
      "login": "Anmeldung beim Solid Pod"
    },
    "es": {
      "login": "Iniciar sesión en Solid Pod"
    }
  }
</i18n>
