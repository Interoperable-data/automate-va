import {
  getWebIdDataset,
  getThing,
  getStringNoLocale,
} from '@inrupt/solid-client'
import { FOAF } from '@inrupt/vocab-common-rdf'
import {
  type TypeRegistration,
  type PodProfileAndRegistrations,
} from './types/LWSHost'
import { sessionStore } from './stores/LWSSessionStore'
import {
  getTypeIndexContainers,
  getTypeRegistrationsFromContainers,
  getPropertiesFromTypeRegistration,
} from './LWSHelpers'

// Basic profile operations
export async function getProfileInfo(
  webId: URL
): Promise<{ name: string | null }> {
  try {
    const dataset = await getWebIdDataset(webId.href)
    sessionStore.logDatasetAnalysis(webId.href, 'Retrieving profile info')
    const profile = getThing(dataset, webId.href)
    const name = profile ? getStringNoLocale(profile, FOAF.name) : null
    return { name }
  } catch (error) {
    console.error('Error retrieving profile info:', error)
    return { name: null }
  }
}

// Fetches both profile info and pod type registrations
export async function getPodProfileAndRegistrations(
  webId: URL
): Promise<PodProfileAndRegistrations> {
  const profileInfo = await getProfileInfo(webId)
  const hasProfile = !!profileInfo.name

  if (!hasProfile) {
    return {
      name: null,
      typeIndexContainers: [],
      typeRegistrations: [],
      hasProfile: false,
    }
  }

  const typeIndexContainers = await getTypeIndexContainers(webId)
  const typeRegistrations = await getTypeRegistrationsFromContainers(
    webId,
    typeIndexContainers
  )

  // Fetch properties for each registration
  for (const registration of typeRegistrations) {
    const properties = await getPropertiesFromTypeRegistration(registration)
    console.log('Properties for', registration.forClass, ':', properties)
  }

  return {
    name: profileInfo.name,
    typeIndexContainers,
    typeRegistrations,
    hasProfile: true,
  }
}

// Mark old function as deprecated
/** @deprecated Use getPodProfileAndRegistrations instead */
export const getFullProfileInfo = getPodProfileAndRegistrations
