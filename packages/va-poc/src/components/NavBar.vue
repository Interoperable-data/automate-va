<template>
  <BNavbar v-b-color-mode="'dark'" toggleable="lg" variant="primary">
    <BNavbarBrand to="/">JOSEPHA</BNavbarBrand>
    <BNavbarToggle target="nav-collapse" />
    <BCollapse id="nav-collapse" is-nav>
      <BNavbarNav>
        <BNavItem to="/processes">{{ t("processes") }}</BNavItem>
        <BNavItem to="/about">{{ t("about") }}</BNavItem>
      </BNavbarNav>
      <!-- Right aligned nav items -->
      <BNavbarNav class="ms-auto mb-2 mb-lg-0">
        <BNavItemDropdown right>
          <!-- Using 'button-content' slot -->
          <template #button-content>
            <em>{{
              sessionStore.loggedInWebId === ""
                ? t("noStorage")
                : sessionStore.loggedInWebId
            }}</em>
          </template>
          <BDropdownItem
            to="/containers"
            :disabled="sessionStore.loggedInWebId === ''"
            >Storage Profile</BDropdownItem
          >
          <BDropdownItem to="/id-profile" disabled
            >Identity Profile</BDropdownItem
          >
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
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

// OPTION 1 - As a component, translation is done using the plugin
const { t, locale } = useI18n();

// OPTION 2 FAILS - Direct import does not work in normal components
// const i18n = inject(I18nInjectionKey);
// const t = i18n!.global.t;
// const locale = i18n!.global.locale;

import I18nSelector from "./providers/I18nSelector.vue";
import { sessionStore } from "./providers/LWSHost";

const emit = defineEmits(["update:locale"]);
const emitNewLocale = (newLocale: string) => {
  // Update the locale in the CURRENT component
  // OPTION 2 - i18n.global.locale = newLocale;
  locale.value = newLocale; // OPTION 1
  // update the locale in the PARENT component
  emit("update:locale", newLocale);
};

onMounted(() => {
  console.log(`NavBar mounted with locale: ${locale.value}`);
});
</script>

<style scoped></style>

<i18n>
  {
    "en": {
      "processes": "Processes",
      "about": "About",
      "noStorage": "Please Connect to LWS"
    },
    "fr": {
      "processes": "Processus",
      "about": "À propos",
      "noStorage": "Veuillez vous connecter à LWS"
    },
    "de": {
      "processes": "Prozesse",
      "about": "Über",
      "noStorage": "Bitte verbinden Sie sich mit LWS"
    },
    "es": {
      "processes": "Procesos",
      "about": "Acerca de",
      "noStorage": "Por favor, conéctese a LWS"
    }
  }
</i18n>
