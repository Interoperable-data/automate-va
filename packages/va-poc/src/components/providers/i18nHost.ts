import { reactive } from "vue";

export const i18nStore = reactive({
  selectedLanguage: "en",
  allLanguages: ["en", "fr", "de", "ja"],
});