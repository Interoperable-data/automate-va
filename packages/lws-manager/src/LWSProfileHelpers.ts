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

    // Log start of profile retrieval
    sessionStore.logDatasetAnalysis(
      webId.href,
      'Starting profile info retrieval from main and alternative profiles'
    );

    // Get all profile datasets
    const profileResult = await getProfileAll(webId.href, { fetch: fetch });
    sessionStore.logDatasetAnalysis(webId.href, 'Retrieved profile data from all sources');

    console.error(profileResult);
    
    // Combine all available datasets
    const datasetsToAnalyze = [
      profileResult.webIdProfile,
      ...(profileResult.altProfileAll || []),
    ].filter(Boolean); // Remove any undefined/null values

    // Log number of datasets found
    sessionStore.logDatasetAnalysis(
      webId.href,
      `Found ${datasetsToAnalyze.length} profile dataset(s) to analyze`
    );

    // Process all datasets
    for (const dataset of datasetsToAnalyze) {
      // Log dataset analysis
      sessionStore.logDatasetAnalysis(
        dataset.internal_resourceInfo.sourceIri,
        'Analyzing profile source'
      );

      const things = getThingAll(dataset);
      const values = extractProfileValues(things);

      // Log found values
      if (Object.keys(values).length > 0) {
        sessionStore.logDatasetAnalysis(
          dataset.internal_resourceInfo.sourceIri,
          `Found profile data: ${Object.keys(values).join(', ')}`
        );
      }

      // Merge values into allProfileValues
      Object.entries(values).forEach(([category, categoryValues]) => {
        if (!allProfileValues[category]) {
          allProfileValues[category] = [];
        }
        allProfileValues[category].push(...categoryValues);
      });
    }

    if (datasetsToAnalyze.length === 0) {
      sessionStore.logDatasetAnalysis(webId.href, 'No profile datasets found to analyze');
    }

    // Log storage of profile values
    sessionStore.logDatasetAnalysis(
      webId.href,
      `Stored profile values for categories: ${Object.keys(allProfileValues).join(', ')}`
    );

    // Store all found profile values
    sessionStore.profileValues[webId.href] = allProfileValues;

    // Return name for backward compatibility
    const names = allProfileValues.name || [];
    return { name: names.length > 0 ? names[0] : null };
  } catch (error) {
    // Log error
    sessionStore.logDatasetAnalysis(
      webId.href,
      `Error retrieving profile info: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
