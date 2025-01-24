import { reactive } from 'vue';
import { type LWSAuth } from './LWSHost.d';
export type StringMap = { [key: string]: string };

export const sessionStore = reactive({
  canReadPODURLs: false,
  ownPodURLs: [] as string[], // all the WebId's OWN pod Urls
  allPrefixes: {
    'http://www.w3.org/1999/02/22-rdf-syntax-ns': 'rdf',
    'http://www.w3.org/2000/01/rdf-schema': 'rdfs',
    'http://www.w3.org/2002/07/owl': 'owl',
    'http://www.w3.org/2001/XMLSchema': 'xsd',
    'http://xmlns.com/foaf/0.1': 'foaf',
    'http://www.w3.org/ns/auth/acl': 'acl',
    'http://www.w3.org/ns/pim/space': 'pim',
    'http://www.w3.org/ns/ldp': 'ldp',
    'http://www.w3.org/ns/solid/terms': 'solid',
    'http://www.w3.org/ns/solid/app': 'app',
    'http://www.w3.org/ns/solid/data': 'data',
    'http://www.w3.org/ns/solid/interop': 'interop',
    'http://www.w3.org/ns/solid/web': 'web',
    'http://www.w3.org/ns/solid/messaging': 'messaging',
    'http://www.w3.org/ns/solid/notification': 'notification',
    'http://schema.org': 'schema',
  } as StringMap, // all the prefixes of the WebId's Classes
  selectedPodURL: '', // the WebId's selected pod URLn
  loggedInWebId: '', // falsy
  rerouting: false,
  authProvidersSessionData: { inrupt: {} },
  analysedDatasets: [] as { url: string, description: string }[], // New property to store analysed datasets

  /**
   * Returns the root URL of the storage pod.
   * @returns {string | null} The root URL of the storage pod or null if not available.
   */
  ownStoragePodRoot(): string | null {
    const sp = this.selectedPodURL;
    if (!sp) return null;
    const tld = sp.substring(0, sp.length - 1).lastIndexOf('/');
    return sp.substring(0, tld);
  },

  /**
   * Adds authentication data for a Solid pod.
   * @param {LWSAuth} param0 - The authentication data.
   */
  addSolidPodAuthData({ token, state }: LWSAuth) {
    this.authProvidersSessionData.inrupt = { token: token, state: state };
  },

  /**
   * Returns an array of prefixes for the user's own pods.
   * @returns {string[]} An array of prefixes.
   */
  ownPodPrefixes(): string[] {
    return this.ownPodURLs.map((url: string, index: number) => `pod${index + 1}:`);
  },

  /**
   * Finds the prefix for a given URL by consulting the prefix.cc API.
   * @param {string} url - The URL to find the prefix for.
   * @returns {Promise<string>} The prefix for the URL.
   */
  async findPrefixFor(url: string): Promise<string> {
    const trimmedUrl = url.split(/[#/]/).slice(0, -1).join('/');
    console.log(`(findPrefixFor) Finding prefix for URL: ${trimmedUrl}`);
    if (!this.allPrefixes[trimmedUrl]) {
      const response = await fetch(`http://prefix.cc/reverse?${trimmedUrl}&format=json`);
      const prefixes = await response.json();
      console.log(`(findPrefixFor) Prefixes found: ${JSON.stringify(prefixes)}`);
      this.allPrefixes[trimmedUrl] = prefixes[trimmedUrl];
      return prefixes[trimmedUrl];
    } else {
      console.log(`(findPrefixFor) Prefix found in cache: ${this.allPrefixes[trimmedUrl]}`);
      return this.allPrefixes[trimmedUrl];
    }
  },

  /**
   * Converts a URL into a prefixed string.
   * @param {string} url - The URL to convert.
   * @returns {Promise<string>} The prefixed string.
   */
  async prefixify(url: string): Promise<string> {
    console.log(`(prefixify) Prefixifying URL: ${url}`);
    for (const [index, podUrl] of this.ownPodURLs.entries()) {
      if (url.startsWith(podUrl)) {
        const res = `pod${index + 1}:${url.substring(podUrl.length)}`;
        console.log(`(prefixify) Prefix found in ownPodURLs: ${res}`);
        return res;
      }else {
        console.warn(`(prefixify) URL ${url} does not start with any of the ownPodURLs`);
      }
    }
    const prefix = await this.findPrefixFor(url);
    console.log(`(prefixify) Prefix found using findPrefixFor: ${prefix}`);
    return prefix;
  },

  /**
   * Logs the analysis of a dataset.
   * @param {string} url - The URL of the dataset.
   * @param {string} description - A description of what was hoped to be found.
   */
  logDatasetAnalysis(url: string, description: string) {
    this.analysedDatasets.push({ url, description });
  },

  /**
   * Resets the session store to its initial state.
   */
  reset() {
    this.canReadPODURLs = false;
    this.ownPodURLs = [];
    this.selectedPodURL = '';
    this.loggedInWebId = '';
    this.rerouting = false;
    this.authProvidersSessionData = { inrupt: {} };
  }
});