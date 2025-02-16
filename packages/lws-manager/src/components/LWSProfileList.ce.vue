<template>
  <div class="lws-profile-list">
    <h3>{{ t('profileInformation') }}</h3>
    {{ sessionStore }}
    <div v-if="hasProfiles">
      <div v-for="(profile, webId) in sessionStore.profileValues" :key="webId" class="card mb-3">
        <img
          v-for="(value, index) in profile.photo"
          v-if="profile.photo && profile.photo.length"
          :key="index"
          class="card-img-top"
          :src="value"
          alt="Profile Photo"
        />
        <div class="card-body">
          <h5 class="card-title">{{ t('profileFor') }} {{ webId }}</h5>
          <div v-for="(values, category) in profile" :key="category">
            <ul v-if="values && values.length" class="list-group list-group-flush">
              <li class="list-group-item">
                <strong>{{ formatCategory(category) }}:</strong>
              </li>
              <li v-for="(value, index) in values" :key="index" class="list-group-item">
                <a v-if="isUrl(value)" :href="value" target="_blank" rel="noopener">
                  {{ value }}
                </a>
                <span v-else>{{ value }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-profiles">{{ t('noProfileInfoAvailable') }}</div>
  </div>
</template>

<script setup lang="ts">
  import { computed, watchEffect, onMounted, watch } from 'vue';
  import { sessionStore } from '../stores/LWSSessionStore';
  import { useI18n } from 'vue-i18n';
  import { getPodProfileAndRegistrations } from '../LWSProfileHelpers';

  // Translation
  import { i18nStore } from '@va-automate/i18n-provider';
  const { t, locale } = useI18n();
  const newLocale = computed(() => i18nStore.selectedLocale);
  watchEffect(() => {
    console.log(`Language captured in ProfileList watcher, changed to ${newLocale.value}!`);
    locale.value = newLocale.value;
  });

  const props = defineProps<{ reloadProfile: boolean }>();

  const hasProfiles = computed(() => {
    const entries = Object.entries(sessionStore.profileValues);
    if (!entries.length) return false;
    return entries.some(([_, profile]) =>
      Object.values(profile).some((values) => Array.isArray(values) && values.length)
    );
  });

  async function loadProfile(forceReload = false) {
    const webId = sessionStore.loggedInWebId;
    if (!webId) return;
    if (forceReload || !sessionStore.profileValues[webId]) {
      await getPodProfileAndRegistrations(new URL(webId));
    }
  }

  function reloadProfiles() {
    loadProfile(true);
  }

  onMounted(() => {
    loadProfile();
  });

  watch(
    () => props.reloadProfile,
    (newVal) => {
      if (newVal) {
        reloadProfiles();
      }
    }
  );

  function formatCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  function isUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
</script>

<style scoped>
  @import '../LWSStyles.css';
</style>

<i18n>
{
  "en": {
    "profileInformation": "Profile Information",
    "profileFor": "Profile for",
    "noProfileInfoAvailable": "No profile information available"
  },
  "fr": {
    "profileInformation": "Informations de profil",
    "profileFor": "Profil pour",
    "noProfileInfoAvailable": "Aucune information de profil disponible"
  },
  "de": {
    "profileInformation": "Profilinformationen",
    "profileFor": "Profil für",
    "noProfileInfoAvailable": "Keine Profilinformationen verfügbar"
  },
  "es": {
    "profileInformation": "Información del perfil",
    "profileFor": "Perfil para",
    "noProfileInfoAvailable": "No hay información de perfil disponible"
  }
}
</i18n>
