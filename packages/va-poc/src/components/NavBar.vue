<template>
  <BNavbar
    toggleable="md"
    :variant="isDark ? 'dark' : 'light'"
    :class="['nav-bar fixed-top top-48', isDark ? 'bg-dark' : 'bg-light']"
  >
    <!-- ref="target" FAILS -->
    <BNavbarBrand to="/"><h1>JOSEPHA</h1></BNavbarBrand>

    <BNavbarToggle target="nav-collapse" />

    <BCollapse id="nav-collapse" is-nav>
      <BNavbarNav>
        <BNavItem to="/processes" v-if="sessionStore.loggedInWebId != ''">{{
          t('processes')
        }}</BNavItem>
        <BNavItem to="/about">{{ t('about') }}</BNavItem>
        <BNavItem to="/debug" v-if="sessionStore.loggedInWebId != ''">{{ t('debug') }}</BNavItem>
      </BNavbarNav>

      <BNavbarNav class="ms-auto">
        <BNavItemDropdown class="me-2" v-if="sessionStore.loggedInWebId != ''">
          <template #button-content>
            <em>{{ sessionStore.loggedInWebId === '' ? t('noStorage') : t('menu') }}</em>
          </template>
          <BDropdownItem to="/containers" :disabled="sessionStore.loggedInWebId === ''">
            {{ t('storageProfile') }}
          </BDropdownItem>
          <BDropdownItem to="/id-profile" disabled>{{ t('identityProfile') }}</BDropdownItem>
          <BDropdownItem to="/logout">
            {{ t('signOut') }}
          </BDropdownItem>
        </BNavItemDropdown>

        <I18nSelector @update:locale="emitNewLocale" />

        <BNavItem>
          <DarkModeSwitch />
        </BNavItem>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { sessionStore } from '@va-automate/lws-manager'
import { i18nStore } from '@va-automate/i18n-provider'
import {
  BNavbar,
  BNavbarBrand,
  BNavbarNav,
  BNavItem,
  BNavItemDropdown,
  BDropdownItem,
  BNavbarToggle,
  BCollapse,
  useColorMode,
} from 'bootstrap-vue-next'
import I18nSelector from './I18nSelector.vue'
import DarkModeSwitch from './DarkModeSwitch.vue'

const isDark = ref(document.documentElement.getAttribute('data-bs-theme') === 'dark')

// Only in simple components, the ref target approach for darkmode works. In this NavBar, it does not.
const target = ref<HTMLElement | null>(null)
useColorMode({
  selector: target,
})

// Watch for theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'data-bs-theme') {
      isDark.value = document.documentElement.getAttribute('data-bs-theme') === 'dark'
    }
  })
})

onMounted(() => {
  observer.observe(document.documentElement, { attributes: true })
  console.log(`NavBar mounted with locale: ${locale.value}`)
})

// Translation is done using the plugin
const { t, locale } = useI18n()
const emit = defineEmits(['update:locale'])
const emitNewLocale = (newLocale: string) => {
  // Update the locale in the NavBar
  locale.value = newLocale
  // update the locale in the PARENT component
  emit('update:locale', newLocale)
}
</script>

<i18n>
  {
    "en": {
      "processes": "Processes",
      "about": "About",
      "debug": "Debug", // Add translation for Debug Dashboard
      "noStorage": "Please Connect to LWS",
      "menu": "Menu",
      "storageProfile": "Storage Profile",
      "identityProfile": "Identity Profile",
      "signOut": "Sign Out"
    },
    "fr": {
      "processes": "Processus",
      "about": "À propos",
      "noStorage": "Veuillez vous connecter à LWS",
      "menu": "Menu",
      "storageProfile": "Profil de stockage",
      "identityProfile": "Profil d'identité",
      "signOut": "Déconnexion"
    },
    "de": {
      "processes": "Prozesse",
      "about": "Über",
      "noStorage": "Bitte verbinden Sie sich mit LWS",
      "menu": "Menü",
      "storageProfile": "Speicherprofil",
      "identityProfile": "Identitätsprofil",
      "signOut": "Abmelden"
    },
    "es": {
      "processes": "Procesos",
      "about": "Acerca de",
      "noStorage": "Por favor, conéctese a LWS",
      "menu": "Menú",
      "storageProfile": "Perfil de almacenamiento",
      "identityProfile": "Perfil de identidad",
      "signOut": "Cerrar sesión"
    }
  }
</i18n>
