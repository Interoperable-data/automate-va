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
import type { Session } from '@inrupt/solid-client-authn-browser'
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router'
import {
  loginToSelectedIdP,
  logoutFromSolidPod,
  tryIncomingRedirect,
  getStoredIdP,
  setStoredIdP,
  SOLID_PROVIDERS,
  getSelectedProviderName,
} from '../auth/LWSAuth' // Import login and logout functions

// Stores
import { sessionStore } from '../stores/LWSSessionStore'

// Refs
// TODO: values should be props
const SELECTED_IDP = ref(getStoredIdP()) // Initialize with stored value

// Add new ref for dropdown state
const isDropdownOpen = ref(false)

// Add dropdown toggle function
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

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

const selectProvider = (provider: string) => {
  SELECTED_IDP.value = provider
  setStoredIdP(provider) // Store selection
  isDropdownOpen.value = false // Close dropdown after selection
}

// Get provider name for display
const getProviderName = () => getSelectedProviderName(SELECTED_IDP.value)

// logout function
const logout = async () => {
  await logoutFromSolidPod()
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
  <nav class="navbar navbar-expand fixed-top py-1 lws-navbar">
    <div class="container-fluid">
      <span class="navbar-brand">
        <template v-if="sessionStore.loggedInWebId">
          {{ t('connectedTo') }} {{ getProviderName() }}
        </template>
        <template v-else>
          {{ t('connectTo') }}
        </template>
      </span>

      <div class="me-auto" v-if="!sessionStore.loggedInWebId">
        <div class="dropdown lws-dropdown">
          <button
            class="btn btn-outline-secondary dropdown-toggle"
            type="button"
            id="providerDropdown"
            @click="toggleDropdown"
            :aria-expanded="isDropdownOpen"
          >
            {{ t('selectProvider') }}
          </button>
          <ul
            class="dropdown-menu"
            :class="{ show: isDropdownOpen }"
            aria-labelledby="providerDropdown"
          >
            <li v-for="(url, name) in SOLID_PROVIDERS" :key="url">
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="selectProvider(url)"
                :class="{ active: SELECTED_IDP === url }"
              >
                {{ name }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="ms-auto">
        <button
          v-if="!sessionStore.loggedInWebId"
          @click="login"
          class="btn btn-primary"
        >
          {{ t('loginTo') }} {{ getProviderName() }}
        </button>
        <button
          v-if="sessionStore.loggedInWebId"
          @click="logout"
          class="btn btn-danger"
        >
          {{ t('logout') }}
        </button>
      </div>
    </div>
  </nav>
  <slot />
</template>

<style>
@import '../LWSStyles.css';
</style>

<i18n>
{
  "en": {
    "login": "Login to Solid Pod",
    "loginTo": "Login using",
    "logout": "Logout from Solid Pod",
    "selectProvider": "Select Provider",
    "connectedTo": "Connected to",
    "connectTo": "Connect to:"
  },
  "fr": {
    "login": "Connexion au Solid Pod",
    "loginTo": "Connexion via",
    "logout": "Déconnexion du Solid Pod",
    "selectProvider": "Sélectionner un fournisseur",
    "connectedTo": "Connecté à",
    "connectTo": "Se connecter à:"
  },
  "de": {
    "login": "Anmeldung beim Solid Pod",
    "loginTo": "Anmelden über",
    "logout": "Abmeldung vom Solid Pod",
    "selectProvider": "Provider auswählen",
    "connectedTo": "Verbunden mit",
    "connectTo": "Verbinden mit:"
  },
  "es": {
    "login": "Iniciar sesión en Solid Pod",
    "loginTo": "Iniciar sesión con",
    "logout": "Cerrar sesión en Solid Pod",
    "selectProvider": "Seleccionar proveedor",
    "connectedTo": "Conectado a",
    "connectTo": "Conectar a:"
  }
}
</i18n>
