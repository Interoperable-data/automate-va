import {
  getWebIdDataset,
  getThing,
  getStringNoLocale,
} from '@inrupt/solid-client'

// Vocabularies
import { FOAF } from '@inrupt/vocab-common-rdf' // Add RDFS

// Store for process data
import { sessionStore } from './stores/LWSSessionStore'; // Import sessionStore

// Function to retrieve profile info from a WebID
export async function getProfileInfo(webId: URL): Promise<{ name: string | null }> {
  try {
    const dataset = await getWebIdDataset(webId.href)
    sessionStore.logDatasetAnalysis(webId.href, 'Retrieving profile info'); // Log dataset analysis
    const profile = getThing(dataset, webId.href)

    const name = profile ? getStringNoLocale(profile, FOAF.name) : null

    return { name }
  } catch (error) {
    console.error('Error retrieving profile info:', error)
    return { name: null }
  }
}

// isWebId function
export async function isWebId(uri: URL): Promise<boolean> {
  try {
    const dataset = await getWebIdDataset(uri.href)
    return dataset !== null
  } catch (error) {
    return false
  }
}
