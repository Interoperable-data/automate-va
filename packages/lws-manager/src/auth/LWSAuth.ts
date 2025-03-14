import {
  login,
  logout,
  handleIncomingRedirect,
  getDefaultSession,
  fetch,
  type Session,
} from '@inrupt/solid-client-authn-browser';
import { getPodUrlAll } from '@inrupt/solid-client';
import { sessionStore } from '../stores/LWSSessionStore';
import { processStore } from '../stores/LWSProcessStore';
import { getTypeIndexContainers, getTypeRegistrationsFromContainers } from '../LWSHelpers';

// Solid Provider configurations
export const SOLID_PROVIDERS = {
  'Inrupt.com': 'https://login.inrupt.com',
  'SolidCommunity.net': 'https://solidcommunity.net',
  'SolidWeb.org': 'https://solidweb.org',
  'RedPencil.io': 'https://solid.redpencil.io',
  'Use.id': 'https://idp.use.id',
  'Inrupt.net': 'https://inrupt.net',
  'Solidweb.me': 'https://solidweb.me',
  'TeamId.Live': 'https://teamid.live',
  // 'PodSpaces.net': 'https://pods.podspaces.me',
  // 'Dev.inrupt.net': 'https://dev.inrupt.net',
};

const STORAGE_KEY = 'lws-selected-idp';
const DEFAULT_IDP = 'https://login.inrupt.com';

// Provider management
export const getStoredIdP = (): string => {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_IDP;
};

export const setStoredIdP = (idp: string): void => {
  localStorage.setItem(STORAGE_KEY, idp);
};

export const getSelectedProviderName = (selectedIdp: string): string => {
  return (
    Object.entries(SOLID_PROVIDERS).find(([_, url]) => url === selectedIdp)?.[0] ||
    'Unknown Provider'
  );
};

export const loginToSelectedIdP = (oidcIssuer: string) => {
  setStoredIdP(oidcIssuer); // Store IDP before login
  return login({
    oidcIssuer,
    redirectUrl: new URL('/auth', window.location.href).toString(),
    clientName: 'VA Automate',
  });
};

export const logoutFromSolidPod = async () => {
  await logout();
  sessionStore.reset();
  processStore.reset();
  console.log('Logged out from Solid Pod');
};

export const setSession = async (session: Session, routeInfo: any) => {
  console.log(`(setSession) Session:`, session);
  if (routeInfo.code && routeInfo.state) {
    console.warn(`Storing session return values`);

    sessionStore.rerouting = true;
    sessionStore.addSolidPodAuthData({
      token: routeInfo.code,
      state: routeInfo.state,
    });
  } else {
    console.warn(`No session return values found.`);
  }
  if (session.info.isLoggedIn) {
    sessionStore.canReadPODURLs = true;
    sessionStore.loggedInWebId = session.info.webId!;

    // Get and log pod URLs
    let podUrls = await getPodUrlAll(session.info.webId!, { fetch: fetch });

    // If no pod URLs found, try to extract from WebID
    if (!podUrls || podUrls.length === 0) {
      const webIdUrl = new URL(session.info.webId!);
      const pathSegments = webIdUrl.pathname.split('/').filter(Boolean);

      // Get base URL with first path segment if it exists
      const baseUrl = `${webIdUrl.protocol}//${webIdUrl.hostname}${
        pathSegments.length > 0 ? '/' + pathSegments[0] : ''
      }`;

      podUrls = [baseUrl];

      sessionStore.logDatasetAnalysis(
        session.info.webId!,
        `No pod URLs returned by getPodUrlAll, derived URL from WebID path: ${baseUrl}`
      );
    }

    sessionStore.ownPodURLs = podUrls;
    sessionStore.logDatasetAnalysis(
      session.info.webId!,
      `Using ${podUrls.length} pod URLs: ${podUrls.join(', ')}`
    );

    const webIdUri = new URL(session.info.webId!);
    const typeIndexContainers = await getTypeIndexContainers(webIdUri);
    await getTypeRegistrationsFromContainers(webIdUri, typeIndexContainers);
  } else {
    console.warn(`No active session found`);
  }
};

export const tryIncomingRedirect = async (routeInfo: any) => {
  try {
    const currentSession = getDefaultSession();
    console.log(`(tryIncomingRedirect) Current session:`, currentSession);
    if (!currentSession.info.sessionId) {
      console.log(`Not logged in.`);
      await handleIncomingRedirect({ restorePreviousSession: true });
    } else {
      console.log(`Logged in.`);
      await handleIncomingRedirect();
    }
    await setSession(currentSession, routeInfo);
  } catch (err) {
    console.error(`Relogin failed with error ${err}`);
  } finally {
    sessionStore.rerouting = false;
  }
};
