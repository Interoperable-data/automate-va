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

import { useI18n } from 'vue-i18n'
import { onMounted, ref } from 'vue'
import {
  //   CE's do not have the router
  //   useRouter,
  type RouteLocationNormalizedLoadedGeneric,
} from 'vue-router'
// const router = useRouter();
import {
  loginToSelectedIdP,
  logoutFromSolidPod,
  tryIncomingRedirect,
} from '../auth/LWSAuth' // Import login and logout functions

// Stores
import { sessionStore } from '../stores/LWSSessionStore'

// Refs
// TODO: values should be props
const SELECTED_IDP = ref('https://login.inrupt.com') // More options needed

// props
const props = defineProps<{
  routeInfo: RouteLocationNormalizedLoadedGeneric
  target: string
}>()

// translate
const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
})

// login function
const login = () => {
  return loginToSelectedIdP(SELECTED_IDP.value)
}

// logout function
const logout = async () => {
  await logoutFromSolidPod()
}

// Component stores the Session it is own memory
const setSession = async (session: Session) => {
  await setSession(session, props.routeInfo.query)
}

// Login
const tryRedirect = async () => {
  await tryIncomingRedirect(props.routeInfo.query)
}

onMounted(async () => {
  sessionStore.rerouting = true
  // When the component is mounted, it should check the session
  await tryRedirect()
  // await nextTick();
  // BUTTON_TARGET.value = "#lws-button";
})

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
  <button
    v-if="!sessionStore.loggedInWebId"
    @click="login"
    class="btn btn-primary"
  >
    {{ t('login') }}
  </button>
  <button
    v-if="sessionStore.loggedInWebId"
    @click="logout"
    class="btn btn-danger"
  >
    {{ t('logout') }}
  </button>
  <slot />
</template>

<style scoped>
@import '../LWSStyles.css';
</style>

<i18n>
  {
    "en": {
      "login": "Login to Solid Pod",
      "logout": "Logout from Solid Pod"
    },
    "fr": {
      "login": "Connexion au Solid Pod",
      "logout": "Déconnexion du Solid Pod"
    },
    "de": {
      "login": "Anmeldung beim Solid Pod",
      "logout": "Abmeldung vom Solid Pod"
    },
    "es": {
      "login": "Iniciar sesión en Solid Pod",
      "logout": "Cerrar sesión en Solid Pod"
    }
  }
</i18n>
