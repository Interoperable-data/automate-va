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
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";

import { useI18n } from "vue-i18n";
import { onMounted, ref } from "vue";
import {
  useRouter,
  type RouteLocationNormalizedLoadedGeneric,
} from "vue-router";
import {
  BNavbar,
  BNavbarBrand,
  BNavbarNav,
  BNavItem,
  BButton,
} from "bootstrap-vue-next";

import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
  Session,
} from "@inrupt/solid-client-authn-browser";

// Stores
import { sessionStore } from "./LWSHost";

// Refs
// TODO: this value should be one of a prop array
const SELECTED_IDP = ref("https://login.inrupt.com");

// props
const route = defineProps<{ info: RouteLocationNormalizedLoadedGeneric }>();

// translate
const { t, locale } = useI18n({
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
const setSession = (session: Session) => {
  const router = useRouter();
  const routeInfo = route.info.query;
  if (routeInfo.code && routeInfo.state) {
    console.warn(`Storing session return values:`, routeInfo);

    // Inrupt token returned, then store the token and reroute the application
    sessionStore.rerouting = true;
    sessionStore.addSolidPodAuthData({
      token: routeInfo.code,
      state: routeInfo.state,
    });
    setTimeout(() => router.push("/"), 3500);
  } else {
    console.warn(`No session return values found.`);
  }
  if (session.info.isLoggedIn) {
    console.log(`Session found:`, session.info);
    sessionStore.canReadPODURLs = true;
    sessionStore.loggedInWebId = session.info.webId!;
  } else {
    console.warn(`No active session found`);
  }
};

// Login
const tryIncomingRedirect = async () => {
  try {
    const currentSession = getDefaultSession();
    console.log(`Retrying to use a previous session:`, currentSession.info);
    if (!currentSession.info.sessionId) {
      console.log(`failed. Please log in yourself.`);
      await handleIncomingRedirect({ restorePreviousSession: true });
    } else {
      console.log(`worked. Reusing it.`);
      await handleIncomingRedirect(); // no-op if not part of login redirect
    }
    setSession(currentSession);
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
  <BNavbar variant="secondary" type="light">
    <!-- <BNavbarBrand href="#">Session Info</BNavbarBrand> -->
    <BNavbarNav>
      <BNavItem v-if="sessionStore.rerouting">
        Redirecting after session storage...
      </BNavItem>
      <BNavItem v-else-if="!sessionStore.loggedInWebId">
        {{ t("support") }}
        <BButton @click="loginToSelectedIdP" variant="outline-primary">{{
          t("login")
        }}</BButton>
      </BNavItem>
      <!-- <BNavItem v-else>
        Logged in as {{ sessionStore.loggedInWebId }}
      </BNavItem> -->
    </BNavbarNav>
  </BNavbar>
  <slot />
</template>

<style scoped></style>

<i18n>
  {
    "en": {
      "support": "We only support Linked Web Storage from Inrupt for the moment.",
      "login": "Login"
    },
    "fr": {
      "support": "Nous ne supportons que le stockage web lié d'Inrupt pour le moment.",
      "login": "Connexion"
    },
    "de": {
      "support": "Wir unterstützen derzeit nur Linked Web Storage von Inrupt.",
      "login": "Anmeldung"
    },
    "es": {
      "support": "Por el momento, solo admitimos almacenamiento web vinculado de Inrupt.",
      "login": "Iniciar sesión"
    }
  }
</i18n>
