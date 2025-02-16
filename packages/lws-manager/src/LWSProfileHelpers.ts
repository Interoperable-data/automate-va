import {
  getWebIdDataset,
  getThing,
  getThingAll,
  getStringNoLocale,
  getProfileAll,
  getUrlAll,
  getUrl,
  getSolidDataset,
  type ThingPersisted,
} from '@inrupt/solid-client';
import { fetch } from '@inrupt/solid-client-authn-browser';
import { type TypeRegistration, type PodProfileAndRegistrations } from './types/LWSHost';
import { sessionStore } from './stores/LWSSessionStore';
import {
  getTypeIndexContainers,
  getTypeRegistrationsFromContainers,
  getPropertiesFromTypeRegistration,
} from './LWSHelpers';
import { FOAF, VCARD, SCHEMA_INRUPT, RDF } from '@inrupt/vocab-common-rdf';

// Move PROFILE_PROPERTIES from LWSHelpers
const PROFILE_PROPERTIES = {
  name: [FOAF.name, VCARD.fn, SCHEMA_INRUPT.name],
  email: [FOAF.mbox, VCARD.email, VCARD.hasEmail, SCHEMA_INRUPT.email],
  photo: [FOAF.img, VCARD.photo, SCHEMA_INRUPT.image],
  website: [FOAF.homepage, VCARD.url, SCHEMA_INRUPT.url],
  bio: [VCARD.note, SCHEMA_INRUPT.description],
};

// Move and refactor profile-related functions
async function processVCardValue(thing: ThingPersisted, category: string): Promise<string[]> {
  const values: string[] = [];
  const types = getUrlAll(thing, RDF.type);
  const vcardValue = getUrl(thing, VCARD.value) || getStringNoLocale(thing, VCARD.value);

  if (vcardValue) {
    sessionStore.logDatasetAnalysis(thing.url, `Found VCARD value for ${category}: ${vcardValue}`);

    if (types.includes(VCARD.Home)) {
      sessionStore.logDatasetAnalysis(thing.url, `VCARD value is marked as Home ${category}`);
      values.push(`Home ${category}: ${vcardValue}`);
    } else if (types.includes(VCARD.Work)) {
      sessionStore.logDatasetAnalysis(thing.url, `VCARD value is marked as Work ${category}`);
      values.push(`Work ${category}: ${vcardValue}`);
    } else {
      values.push(vcardValue);
    }
  }

  return values;
}

/**
 * Extracts profile values from an array of Things based on predefined property categories.
 * Each category (name, email, photo, etc.) can have multiple predicates that are checked.
 *
 * @param things - Array of ThingPersisted objects containing profile data
 * @returns Record with categories as keys and arrays of values as values
 *
 * Example return value:
 * {
 *   name: ["John Doe"],
 *   email: ["john@example.com"],
 *   photo: ["https://example.com/photo.jpg"],
 *   website: ["https://johndoe.com"],
 *   bio: ["Software developer"]
 * }
 */
export async function extractProfileValues(
  things: ThingPersisted[],
  processedUrls: Set<string> = new Set()
): Promise<Record<string, string[]>> {
  const profileValues: Record<string, string[]> = {};

  sessionStore.logDatasetAnalysis(
    things[0]?.url || 'unknown',
    `Starting profile value extraction for ${things.length} things`
  );

  for (const thing of things) {
    for (const [category, predicates] of Object.entries(PROFILE_PROPERTIES)) {
      if (!profileValues[category]) {
        profileValues[category] = [];
      }

      for (const predicate of predicates) {
        const literals = getStringNoLocale(thing, predicate);
        const urls = getUrl(thing, predicate);

        if (literals && !profileValues[category].includes(literals)) {
          profileValues[category].push(literals);
          sessionStore.logDatasetAnalysis(thing.url, `Found ${category} (literal): ${literals}`);
        }

        if (urls) {
          const isInPod = sessionStore.ownPodURLs.some((podUrl) => urls.startsWith(podUrl));
          if (isInPod && !processedUrls.has(urls)) {
            await processNestedProfile(urls, category, profileValues, processedUrls);
          } else if (!profileValues[category].includes(urls)) {
            profileValues[category].push(urls);
          }
        }
      }
    }
  }

  return profileValues;
}

// New helper function to process nested profile data
async function processNestedProfile(
  url: string,
  category: string,
  profileValues: Record<string, string[]>,
  processedUrls: Set<string>
): Promise<void> {
  try {
    sessionStore.logDatasetAnalysis(url, `Found internal reference, retrieving data`);
    const dataset = await getSolidDataset(url, { fetch });
    const nestedThings = getThingAll(dataset);

    for (const nestedThing of nestedThings) {
      const vcardValues = await processVCardValue(nestedThing, category);
      vcardValues.forEach((value) => {
        if (!profileValues[category].includes(value)) {
          profileValues[category].push(value);
          sessionStore.logDatasetAnalysis(nestedThing.url, `Added VCARD value: ${value}`);
        }
      });
    }

    processedUrls.add(url);
    const nestedValues = await extractProfileValues(nestedThings, processedUrls);
    mergeProfileValues(profileValues, nestedValues);
  } catch (error) {
    sessionStore.logDatasetAnalysis(url, `Error retrieving nested profile data: ${error.message}`);
  }
}

// Helper function to merge profile values
function mergeProfileValues(
  target: Record<string, string[]>,
  source: Record<string, string[]>
): void {
  Object.entries(source).forEach(([category, values]) => {
    if (!target[category]) {
      target[category] = [];
    }
    values.forEach((value) => {
      if (!target[category].includes(value)) {
        target[category].push(value);
      }
    });
  });
}

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
      const values = await extractProfileValues(things);

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
