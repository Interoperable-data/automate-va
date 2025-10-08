import './style.css';
import '@ulb-darmstadt/shacl-form/form-default.js';
import { initNavigation, type ViewId } from './modules/navigation';
import { assert } from './modules/utils/assert';
import { GraphStore } from './modules/data/graph-store';
import { loadOrganisationShapes } from './modules/data/organisation-shapes';
import { initOrganisationManagerView } from './modules/views/organisation-manager';
import { initRawRdfView } from './modules/views/raw-rdf';
import { initEndpointsView } from './modules/views/endpoints';

const appRoot = assert(document.querySelector<HTMLElement>('[data-app]'), 'App shell not found');

void bootstrap();

interface ViewController {
  activate: () => void;
}

async function bootstrap(): Promise<void> {
  const [store, shapes] = await Promise.all([GraphStore.create(), loadOrganisationShapes()]);

  const viewControllers: Partial<Record<ViewId, ViewController>> = {};

  viewControllers.organisation = await initOrganisationManagerView({
    container: getViewSlot('organisation'),
    store,
    shapes,
  });

  viewControllers.rawRdf = initRawRdfView({
    container: getViewSlot('rawRdf'),
    store,
  });

  viewControllers.endpoints = initEndpointsView({
    container: getViewSlot('endpoints'),
    store,
  });

  const navigation = initNavigation({
    onViewChange(viewId) {
      console.debug(`[navigation] switched to view: ${viewId}`);
      const controller = viewControllers[viewId];
      controller?.activate();
    },
  });

  setupLoginButton();

  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__vaNavigation__ = navigation;
  }
}

function getViewSlot(viewId: ViewId): HTMLElement {
  return assert(
    document.querySelector<HTMLElement>(`[data-view-slot="${viewId}"]`),
    `View slot for ${viewId} not found`
  );
}

function setupLoginButton() {
  const loginButton = appRoot.querySelector<HTMLButtonElement>('[data-action="msal-login"]');
  loginButton?.addEventListener('click', () => {
    console.info('[auth] MSAL login clicked (handler pending integration)');
  });
}
