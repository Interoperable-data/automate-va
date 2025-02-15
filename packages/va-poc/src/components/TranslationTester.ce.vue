<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import {
  getTypeIndexContainers,
  getProfileInfo,
  getPropertiesFromTypeRegistration,
  getTypeRegistrationsFromContainers,
} from '@va-automate/lws-manager'
import { sessionStore } from '@va-automate/lws-manager'
import { type TypeRegistration } from '@va-automate/lws-manager'
import { BContainer, BAlert } from 'bootstrap-vue-next'

const router = useRouter()
const props = defineProps<{ name: string }>()

const { t, locale } = useI18n({
  inheritLocale: true,
  useScope: 'local',
})

// Read the profile
const solidProfileName = ref<string | null>(null)
const typeIndexContainers = ref<URL[]>([])
const typeRegistrations = ref<TypeRegistration[]>([])
const hasNoProfile = ref(false)

watchEffect(async () => {
  if (!sessionStore.loggedInWebId) return
  const webId = new URL(sessionStore.loggedInWebId)

  try {
    const profileInfo = await getProfileInfo(webId)
    if (!profileInfo.name) {
      hasNoProfile.value = true
      console.warn('No profile name found, user should create a profile')
      // Optional: Automatically redirect to profile page
      // router.push('/profile')
      return
    }

    solidProfileName.value = profileInfo.name
    hasNoProfile.value = false

    // Only fetch type information if we have a profile
    typeIndexContainers.value = await getTypeIndexContainers(webId)
    typeRegistrations.value = await getTypeRegistrationsFromContainers(
      webId,
      typeIndexContainers.value,
    )

    for (const registration of typeRegistrations.value) {
      const properties = await getPropertiesFromTypeRegistration(registration)
      console.log('Properties for', registration.forClass, ':', properties)
    }
  } catch (error) {
    console.error(
      'Error fetching profile info, type index containers, or type registrations:',
      error,
    )
  }
})
</script>

<template>
  <BContainer>
    <BAlert v-if="hasNoProfile" variant="warning" dismissible :model-value="true">
      <h4 class="alert-heading">{{ t('noProfileTitle') }}</h4>
      <p class="mb-0">
        {{ t('noProfile') }}
        <RouterLink to="/profile" class="alert-link">{{ t('createProfile') }}</RouterLink>
      </p>
    </BAlert>

    <template v-else>
      <h3>{{ props.name }}</h3>
      <div>
        {{ solidProfileName || props.name }} says [{{ locale }}]:
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
