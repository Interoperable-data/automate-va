import { login, logout, Session, handleIncomingRedirect, getDefaultSession, fetch } from '@inrupt/solid-client-authn-browser';
import { getPodUrlAll } from '@inrupt/solid-client';
import { sessionStore } from './LWSSessionStore';
import { processStore } from './LWSProcessStore';
import { getTypeIndexContainers, getTypeRegistrationsFromContainers } from './LWSHost';

export const loginToSelectedIdP = (oidcIssuer: string) => {
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
    sessionStore.ownPodURLs = await getPodUrlAll(session.info.webId!, { fetch });

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
