<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, watchEffect } from 'vue'
import {
  getPodProfileAndRegistrations,
  type PodProfileAndRegistrations,
} from '@va-automate/lws-manager'
import { sessionStore } from '@va-automate/lws-manager'
import { BContainer, BAlert } from 'bootstrap-vue-next'

const props = defineProps<{ name: string }>()

const { t, locale } = useI18n({
  inheritLocale: true,
  useScope: 'local',
})

// Profile state
const profile = ref<PodProfileAndRegistrations | null>(null)

watchEffect(async () => {
  if (!sessionStore.loggedInWebId) return

  try {
    profile.value = await getPodProfileAndRegistrations(new URL(sessionStore.loggedInWebId))
  } catch (error) {
    console.error('Error fetching profile and registration info:', error)
  }
})
</script>

<template>
  <BContainer>
    <BAlert v-if="profile && !profile.hasProfile" variant="warning" dismissible :model-value="true">
      <h4 class="alert-heading">{{ t('noProfileTitle') }}</h4>
      <p class="mb-0">
        {{ t('noProfile') }}
        <RouterLink to="/profile" class="alert-link">{{ t('createProfile') }}</RouterLink>
      </p>
    </BAlert>

    <template v-else>
      <h3>{{ props.name }}</h3>
      <div>
        {{ profile?.name || props.name }} says [{{ locale }}]:
        {{ t('hello') + ' ' + t('world') }}
      </div>
      <slot id="first">Loading...</slot>
    </template>
  </BContainer>
</template>

<i18n>
{
  "en": {
    "world": " world!",
    "noProfileTitle": "Profile Missing",
    "noProfile": "Your Solid pod does not have a profile yet.",
    "createProfile": "Click here to create your profile"
  },
  "fr": {
    "world": "monde!",
    "noProfileTitle": "Profil Manquant",
    "noProfile": "Votre pod Solid n'a pas encore de profil.",
    "createProfile": "Cliquez ici pour créer votre profil"
  },
  "de": {
    "world": "welt!",
    "noProfileTitle": "Profil Fehlt",
    "noProfile": "Ihr Solid Pod hat noch kein Profil.",
    "createProfile": "Klicken Sie hier, um Ihr Profil zu erstellen"
  },
  "es": {
    "world": "mundo!",
    "noProfileTitle": "Perfil Faltante",
    "noProfile": "Tu pod Solid aún no tiene un perfil.",
    "createProfile": "Haz clic aquí para crear tu perfil"
  }
}
</i18n>

<style scoped></style>
