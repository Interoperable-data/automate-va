import { reactive } from 'vue';
import { type LWSAuth } from './LWSHost.d';

export const sessionStore = reactive({
  canReadPODURLs: false,
  ownPodURLs: [], // all the WebId's OWN pod Urls
  selectedPodURL: '', // the WebId's selected pod URLn
  loggedInWebId: '', // falsy
  rerouting: false,
  authProvidersSessionData: { inrupt: {} },
  ownStoragePodRoot(): string | null {
    // From https://storage.inrupt.com/b5186a91-pfffe-422a-bf6a-02a61f470541/
    // returns https://storage.inrupt.com, in order to recreate the RDFSource URIs
    const sp = this.selectedPodURL;
    if (!sp) return null;
    const tld = sp.substring(0, sp.length - 1).lastIndexOf('/');
    return sp.substring(0, tld);
  },
  addSolidPodAuthData({ token, state }: LWSAuth) {
    // From Inrupt at least, to be checked for the others
    this.authProvidersSessionData.inrupt = { token: token, state: state }
  },
});