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

import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sessionStore } from './LWSHost'
import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
  Session,
} from '@inrupt/solid-client-authn-browser'

const route = useRoute()
const router = useRouter()

// login function
const SELECTED_IDP = ref('https://login.inrupt.com')
const loginToSelectedIdP = () => {
  return login({
    oidcIssuer: SELECTED_IDP.value,
    redirectUrl: new URL('/auth', window.location.href).toString(),
    clientName: 'VA Automate',
  })
}

// Component stores the Session it is own memory
const setSession = (session: Session) => {
  if (session.info.isLoggedIn) {
    sessionStore.canReadPODURLs = true
    sessionStore.loggedInWebId = session.info.webId!
  } else {
    console.warn(`No active session found`)
  }
}

// Login
const tryIncomingRedirect = async () => {
  try {
    const currentSession = getDefaultSession()
    console.log(`Retrying to use a previous session...`)
    if (!currentSession.info.sessionId) {
      console.log(`failed. Please log in yourself.`)
      await handleIncomingRedirect({ restorePreviousSession: true })
    } else {
      console.log(`worked. Reusing it.`, currentSession.info)
      await handleIncomingRedirect() // no-op if not part of login redirect
    }
    setSession(currentSession)
  } catch (err) {
    console.error(`Relogin failed with error ${err}`)
  }
}

onMounted(async () => {
  if (route.query.code && route.query.state) {
    // Inrupt token returned, then store the token and reroute the application
    sessionStore.state.rerouting = true
    sessionStore.addSolidPodAuthData({ token: route.query.code, state: route.query.state })
    setTimeout(() => router.push('/'), 3500)
  } else {
    // When the component is mounted, it should check the session
    await tryIncomingRedirect()
  }
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
  <section v-if="sessionStore.state.rerouting">
    <h5>Authentication redirect (debug)</h5>
    <div>Parameters: {{ $route.params }}</div>
    <div>Route query object: {{ $route.query }}</div>
  </section>
  <section v-else-if="!sessionStore.loggedInWebId">
    <p>We only support LWS at Inrupt for the moment.</p>
    <button @click="loginToSelectedIdP">Login to LWS Inrupt</button>
  </section>
  <section v-else>Logged in as {{ sessionStore.loggedInWebId }}</section>
</template>

<style scoped></style>
