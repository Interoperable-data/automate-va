import { reactive } from "vue";
import { type LocationQueryValue } from "vue-router";
type LWSAuth = {
  token: string | LocationQueryValue[];
  state: string | LocationQueryValue[];
};

export const sessionStore = reactive({
  canReadPODURLs: false,
  allPODURLs: [], // the WebId's OWN pod Urls
  usersPODURL: "",
  loggedInWebId: "", // falsy
  rerouting: false,
  authProvidersSessionData: { inrupt: {} },
  ownStoragePodRoot(): string | null {
    // From https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/
    // returns https://storage.inrupt.com, in order to recreate the RDFSource URIs
    const sp = this.usersPODURL;
    if (!sp) return null;
    const tld = sp.substring(0, sp.length - 1).lastIndexOf("/");
    return sp.substring(0, tld);
  },
  addSolidPodAuthData({ token, state }: LWSAuth) {
    // From Inrupt at least, to be checked for the others
    this.authProvidersSessionData.inrupt = { token: token, state: state };
  },
});
