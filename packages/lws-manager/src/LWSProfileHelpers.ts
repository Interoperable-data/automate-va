import {
  getWebIdDataset,
  getThing,
  getThingAll,
  getStringNoLocale,
  getProfileAll,
} from '@inrupt/solid-client';
import { fetch } from '@inrupt/solid-client-authn-browser';
import { extractProfileValues } from './LWSHelpers';
import { type TypeRegistration, type PodProfileAndRegistrations } from './types/LWSHost';
import { sessionStore } from './stores/LWSSessionStore';
import {
  getTypeIndexContainers,
  getTypeRegistrationsFromContainers,
  getPropertiesFromTypeRegistration,
} from './LWSHelpers';

// Basic profile operations
export async function getProfileInfo(webId: URL): Promise<{ name: string | null }> {
  try {
    const allProfileValues: Record<string, string[]> = {};

    // Get all profile datasets
    const profileResult = await getProfileAll(webId.href, { fetch: fetch });
    sessionStore.logDatasetAnalysis(webId.href, 'Retrieving profile info from all sources');

    // Process main profile and alternative profiles
    if (profileResult.altProfileAll) {
      for (const dataset of profileResult.altProfileAll) {
        const things = getThingAll(dataset);
        const values = extractProfileValues(things);

        // Merge values into allProfileValues
        Object.entries(values).forEach(([category, categoryValues]) => {
          if (!allProfileValues[category]) {
            allProfileValues[category] = [];
          }
          allProfileValues[category].push(...categoryValues);
        });
      }
    }

    // Store all found profile values
    sessionStore.profileValues[webId.href] = allProfileValues;

    // Return name for backward compatibility
    const names = allProfileValues.name || [];
    return { name: names.length > 0 ? names[0] : null };
  } catch (error) {
    console.error('Error retrieving profile info:', error);
    return { name: null };
  }
}

// Fetches both profile info and pod type registrations
export async function getPodProfileAndRegistrations(
  webId: URL
): Promise<PodProfileAndRegistrations> {
  const profileInfo = await getProfileInfo(webId);
  const hasProfile = !!profileInfo.name;

  if (!hasProfile) {
    return {
      name: null,
      typeIndexContainers: [],
      typeRegistrations: [],
      hasProfile: false,
    };
  }

  const typeIndexContainers = await getTypeIndexContainers(webId);
  const typeRegistrations = await getTypeRegistrationsFromContainers(webId, typeIndexContainers);

  // Fetch properties for each registration
  for (const registration of typeRegistrations) {
    const properties = await getPropertiesFromTypeRegistration(registration);
    console.log('Properties for', registration.forClass, ':', properties);
  }

  return {
    name: profileInfo.name,
    typeIndexContainers,
    typeRegistrations,
    hasProfile: true,
  };
}

// Mark old function as deprecated
/** @deprecated Use getPodProfileAndRegistrations instead */
export const getFullProfileInfo = getPodProfileAndRegistrations;
