<script setup lang="ts">
// import { RouterLink, RouterView } from 'vue-router'
import { defineCustomElement, ref } from "vue";
import { RouterView } from "vue-router";

// import the Custom Element components
import TranslationTester from "./components/TranslationTester.ce.vue";
import I18nHost from "./components/providers/I18nHost.ce.vue";
import LWSHost from "./components/providers/LWSHost.ce.vue";
import NavBar from "./components/NavBar.vue";
import SecondNavbar from "./components/SecondNavbar.vue";
import { i18nStore } from "./components/providers/i18nHost";

// Internationalisation is done in the CE itself (https://vue-i18n.intlify.dev/guide/advanced/wc.html) using a wrapper in App
const I18nHostElement = defineCustomElement(I18nHost);

// convert into custom element constructor
const TesterElement = defineCustomElement(TranslationTester);
const LWSElement = defineCustomElement(LWSHost);

// register
customElements.define("i18n-provider", I18nHostElement);
customElements.define("translation-tester", TesterElement);
customElements.define("lws-provider", LWSElement);

// Locale should be set through component as well.
const locale = ref<string>(i18nStore.selectedLocale);
const updateLocale = (newLocale: string) => {
  locale.value = newLocale;
  console.log(`Locale updated to ${locale.value}`);
};

// Add the new element type to Vue's GlobalComponents type.
declare module "vue" {
  interface GlobalComponents {
    // Be sure to pass in the Vue component type here (SomeComponent, *not* SomeElement).
    // Custom Elements require a hyphen in their name, so use the hyphenated element name here.
    "translation-tester": typeof TranslationTester;
    "i18n-provider": typeof I18nHost;
    "lws-provider": typeof LWSHost;
  }
}
</script>

<template>
  <i18n-provider .locale="locale">
    <lws-provider :routeInfo="$route" target="#lws-btn">
      <NavBar @update:locale="updateLocale" />
      <SecondNavbar />
      <main class="container mt-10">
        <!-- <section><h3>Custom element locale: {{ locale }}</h3></section> -->
        <RouterView />
      </main>
    </lws-provider>
  </i18n-provider>
</template>
