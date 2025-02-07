<template>
  <BNavbar v-b-color-mode="'dark'" toggleable="lg" variant="primary">
    <BNavbarBrand to="/">JOSEPHA</BNavbarBrand>
    <BNavbarToggle target="nav-collapse" />
    <BCollapse id="nav-collapse" is-nav>
      <BNavbarNav>
        <BNavItem to="/processes">{{ t('processes') }}</BNavItem>
        <BNavItem to="/about">{{ t('about') }}</BNavItem>
        <BNavItem to="/debug">{{ t('debug') }}</BNavItem>
        <!-- Add link to DebugDashboard -->
      </BNavbarNav>
      <!-- Right aligned nav items -->
      <BNavbarNav class="ms-auto mb-2 mb-lg-0">
        <BNavItemDropdown right>
          <!-- Using 'button-content' slot -->
          <template #button-content>
            <em>{{
              sessionStore.loggedInWebId === '' ? t('noStorage') : sessionStore.loggedInWebId
            }}</em>
          </template>
          <BDropdownItem to="/containers" :disabled="sessionStore.loggedInWebId === ''"
            >Storage Profile</BDropdownItem
          >
          <BDropdownItem to="/id-profile" disabled>Identity Profile</BDropdownItem>
          <BDropdownItem to="/logout" v-if="sessionStore.loggedInWebId != ''"
            >Sign Out</BDropdownItem
          >
        </BNavItemDropdown>
        <I18nSelector @update:locale="emitNewLocale" />
      </BNavbarNav>
      <!-- <BNavForm class="d-flex">
        <BFormInput class="me-2" placeholder="Search" />
        <BButton type="submit" variant="warning outline-danger">Search</BButton>
      </BNavForm> -->
    </BCollapse>
  </BNavbar>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { sessionStore } from '@va-automate/lws-manager'
import { i18nStore } from '@va-automate/i18n-provider'
import I18nSelector from './I18nSelector.vue';

// Translation is done using the plugin
const { t, locale } = useI18n()
const emit = defineEmits(['update:locale'])
const emitNewLocale = (newLocale: string) => {
  // Update the locale in the NavBar
  locale.value = newLocale
  // update the locale in the PARENT component
  emit('update:locale', newLocale)
}

onMounted(() => {
  console.log(`NavBar mounted with locale: ${locale.value}`)
})
</script>

<style scoped></style>

<i18n>
  {
    "en": {
      "processes": "Processes",
      "about": "About",
      "debug": "Debug Dashboard", // Add translation for Debug Dashboard
      "noStorage": "Please Connect to LWS"
    },
    "fr": {
      "processes": "Processus",
      "about": "À propos",
      "debug": "Tableau de bord de débogage", // Add translation for Debug Dashboard
      "noStorage": "Veuillez vous connecter à LWS"
    },
    "de": {
      "processes": "Prozesse",
      "about": "Über",
      "debug": "Debug-Dashboard", // Add translation for Debug Dashboard
      "noStorage": "Bitte verbinden Sie sich mit LWS"
    },
    "es": {
      "processes": "Procesos",
      "about": "Acerca de",
      "debug": "Panel de depuración", // Add translation for Debug Dashboard
      "noStorage": "Por favor, conéctese a LWS"
    }
  }
</i18n>
