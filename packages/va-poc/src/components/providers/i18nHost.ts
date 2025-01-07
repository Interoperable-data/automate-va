import { reactive } from "vue";
/**
 * i18nStore configures the translation custom element.
 *
 * messages: Object containing the translations for each language, as to be available in EACH component.
 * selectedLocale: The current locale selected by the user.
 * allLanguages: The list of all available languages.
 */
export const i18nStore = reactive({
  selectedLocale: "en",
  allLanguages: ["en", "fr", "de", "es"],
  messages: {
    en: {
      hello: "Hello",
    },
    fr: {
      hello: "Bonjour",
    },
    de: {
      hello: "Hallo",
    },
    es: {
      hello: "Hola",
    },
  },
});