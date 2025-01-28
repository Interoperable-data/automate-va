<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, watchEffect } from 'vue'
import {
  getTypeIndexContainers,
  getProfileInfo,
  getPropertiesFromTypeRegistration,
  getTypeRegistrationsFromContainers,
} from './providers/LWSHost'

import { sessionStore } from './providers/LWSSessionStore'
import { type TypeRegistration } from './providers/LWSHost.d'

const props = defineProps<{ name: string }>()

const { t, locale } = useI18n({
  inheritLocale: true,
  useScope: 'local',
})

// Read the profile
const solidProfileName = ref<string | null>(null)
const typeIndexContainers = ref<URL[]>([])
const typeRegistrations = ref<TypeRegistration[]>([])

watchEffect(async () => {
  if (!sessionStore.loggedInWebId) return
  const webId = new URL(sessionStore.loggedInWebId)

  try {
    const profileInfo = await getProfileInfo(webId)
    solidProfileName.value = profileInfo.name

    typeIndexContainers.value = await getTypeIndexContainers(webId)
    typeRegistrations.value = await getTypeRegistrationsFromContainers(webId, typeIndexContainers.value)

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
  <div class="container">
    <h3>{{ props.name }}</h3>
    <div>
      {{ solidProfileName || props.name }} says [{{ locale }}]: {{ t('hello') + ' ' + t('world') }}
    </div>
    <slot id="first">Loading...</slot>
  </div>
</template>

<i18n>
  {
    "en": {
      "world": " world!"
    },
    "fr": {
      "world": "monde!"
    },
    "de": {
      "world": "welt!"
    },
    "es": {
      "world": "mundo!"
    }
  }
</i18n>

<style scoped>
@import './providers/LWSStyles.css';
</style>
