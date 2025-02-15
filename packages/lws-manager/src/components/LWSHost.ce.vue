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
const dropdownRef = ref<HTMLElement | null>(null)

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (event) => {
    if (
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      isDropdownOpen.value = false
    }
  })
})

// Add dropdown toggle function
const toggleDropdown = (event: Event) => {
  event.stopPropagation()
  isDropdownOpen.value = !isDropdownOpen.value
}

const selectProvider = (provider: string, event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  SELECTED_IDP.value = provider
  setStoredIdP(provider) // Store selection
  isDropdownOpen.value = false // Close dropdown after selection
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
  <div class="lws-status-bar">
    <div class="container-fluid">
      <div class="d-flex align-items-center">
        <!-- Status info -->
        <span class="lws-status-text">
          <template v-if="sessionStore.loggedInWebId">
            {{ t('connectedTo') }} {{ getProviderName() }}
          </template>
          <template v-else>
            {{ t('connectTo') }}
          </template>
        </span>

        <!-- Provider selection -->
        <div class="me-auto" v-if="!sessionStore.loggedInWebId">
          <div class="lws-custom-dropdown" ref="dropdownRef">
            <button
              class="btn btn-outline-secondary btn-sm"
              type="button"
              @click="toggleDropdown"
            >
              {{ t('selectProvider') }}
              <i
                class="bi bi-chevron-down ms-2"
                :class="{ 'rotate-180': isDropdownOpen }"
              ></i>
            </button>
            <div
              class="lws-custom-dropdown-menu"
              :class="{ show: isDropdownOpen }"
            >
              <div
                v-for="(url, name) in SOLID_PROVIDERS"
                :key="url"
                class="lws-custom-dropdown-item"
                :class="{ active: SELECTED_IDP === url }"
                @click="(e) => selectProvider(url, e)"
              >
                {{ name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Login/Logout buttons -->
        <div class="ms-auto">
          <button
            v-if="!sessionStore.loggedInWebId"
            @click="login"
            class="btn btn-primary btn-sm"
          >
            {{ t('loginTo') }} {{ getProviderName() }}
          </button>
          <button v-else @click="logout" class="btn btn-danger btn-sm">
            {{ t('logout') }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <slot />
</template>

<style>
@import '../LWSStyles.css';

.lws-custom-dropdown {
  position: relative;
  display: inline-block;
}

.lws-custom-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  display: none;
  min-width: 200px;
  margin-top: 0.5rem;
  padding: 0.5rem 0;
  background-color: var(--bs-body-bg);
  border: 1px solid var(--theme-border-color);
  border-radius: 0.375rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.lws-custom-dropdown-menu.show {
  display: block;
}

.lws-custom-dropdown-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: var(--theme-link-color);
}

.lws-custom-dropdown-item:hover,
.lws-custom-dropdown-item.active {
  background-color: var(--theme-border-color);
  color: var(--theme-active-color);
}

.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.2s;
}
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
