<script setup lang="ts">
// import { RouterLink, RouterView } from 'vue-router'
import { defineCustomElement, ref } from 'vue'
import TranslationTester from './components/TranslationTester.ce.vue'
import I18nHost from './components/providers/I18nHost.ce.vue'

console.log(TranslationTester.styles) // ["/* inlined css */"]

// convert into custom element constructor
const TesterElement = defineCustomElement(TranslationTester)

// register
customElements.define('translation-tester', TesterElement)

// Locale should be set through component as well.
const locale = ref<string>('ja')

// Add the new element type to Vue's GlobalComponents type.
declare module 'vue' {
  interface GlobalComponents {
    // Be sure to pass in the Vue component type here (SomeComponent, *not* SomeElement).
    // Custom Elements require a hyphen in their name, so use the hyphenated element name here.
    'translation-tester': typeof TranslationTester
    'i18n-provider': typeof I18nHost
  }
}
</script>

<template>
  <!-- <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header> -->
  <form>
    <label for="locale-select">select language: </label>
    <select id="locale-select" v-model="locale">
      <option value="en">en</option>
      <option value="ja">ja</option>
      <option value="fr">fr</option>
    </select>
  </form>
  <i18n-provider .locale="locale">
    <section><h2>Only for serving the elements</h2></section>
    <translation-tester name="Matthijs">All other web components here as they use storage</translation-tester>
  </i18n-provider>
  <!-- <RouterView /> -->
</template>

<style scoped>
/* header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
} */
</style>
