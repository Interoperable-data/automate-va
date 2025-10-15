import './style.css';
import '@ulb-darmstadt/shacl-form';
import { initNavigation, type ViewId } from './modules/navigation';
import { assert } from './modules/utils/assert';
import { GraphStore } from './modules/data/graph-store';
import { loadViewerShapes } from './modules/data/organisation-shapes';
import { initOrganisationManagerView } from './modules/views/organisation-manager';
import { initObjectOfAssessmentManagerView } from './modules/views/object-of-assessment-manager';
import { initRawRdfView } from './modules/views/raw-rdf';
import { initEndpointsView } from './modules/views/endpoints';

const SHAPE_RESOURCES = {
  organisation: '/form-shapes/organisation-start.ttl',
  objects: '/form-shapes/objects-of-assessments-start.ttl',
} as const;

const appRoot = assert(document.querySelector<HTMLElement>('[data-app]'), 'App shell not found');

void bootstrap().catch((error) => {
  console.error('[bootstrap] Application failed to start', error);
  renderFatalBootstrapError(error);
});

interface ViewController {
  activate: () => void;
}

async function bootstrap(): Promise<void> {
  const [store, organisationShapes, objectsShapes] = await Promise.all([
    GraphStore.create(),
    loadViewerShapes({ url: SHAPE_RESOURCES.organisation }),
    loadViewerShapes({ url: SHAPE_RESOURCES.objects }),
  ]);

  const viewControllers: Partial<Record<ViewId, ViewController>> = {};

  viewControllers.organisation = await initOrganisationManagerView({
    container: getViewSlot('organisation'),
    store,
    shapes: organisationShapes,
  });

  viewControllers.objects = await initObjectOfAssessmentManagerView({
    container: getViewSlot('objects'),
    store,
    shapes: objectsShapes,
  });

  viewControllers.rawRdf = initRawRdfView({
    container: getViewSlot('rawRdf'),
    store,
  });

  viewControllers.endpoints = initEndpointsView({
    container: getViewSlot('endpoints'),
    store,
    shapeSources: [organisationShapes.text, objectsShapes.text],
  });

  const navigation = initNavigation({
    onViewChange(viewId) {
      console.debug(`[navigation] switched to view: ${viewId}`);
      const controller = viewControllers[viewId];
      controller?.activate();
    },
  });

  setupLoginButton();
  setupThemeToggle();

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

function setupThemeToggle() {
  const toggleButton = appRoot.querySelector<HTMLButtonElement>('[data-action="toggle-theme"]');
  if (!toggleButton) {
    return;
  }
  const button = toggleButton;
  const icon = assert(
    button.querySelector<HTMLElement>('.content__theme-toggle-icon'),
    'Theme toggle icon missing'
  );
  const label = assert(
    button.querySelector<HTMLElement>('.content__theme-toggle-label'),
    'Theme toggle label missing'
  );

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)');
  const storedPreference = readStoredTheme();
  let currentTheme: 'light' | 'dark' =
    storedPreference ?? (prefersDark?.matches ? 'dark' : 'light');

  applyTheme(currentTheme);
  updateToggleUi(currentTheme);

  button.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
    persistTheme(currentTheme);
    updateToggleUi(currentTheme);
  });

  prefersDark?.addEventListener('change', (event) => {
    if (readStoredTheme() !== null) {
      return;
    }
    currentTheme = event.matches ? 'dark' : 'light';
    applyTheme(currentTheme);
    updateToggleUi(currentTheme);
  });

  function updateToggleUi(theme: 'light' | 'dark') {
    const isDark = theme === 'dark';
    icon.classList.remove('bi-sun', 'bi-moon-stars');
    icon.classList.add(isDark ? 'bi-sun' : 'bi-moon-stars');
    label.textContent = isDark ? 'Light mode' : 'Dark mode';
    button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  }
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
}

function persistTheme(theme: 'light' | 'dark') {
  try {
    window.localStorage.setItem('va.theme-preference', theme);
  } catch (error) {
    console.warn('[theme] Unable to persist theme preference', error);
  }
}

function readStoredTheme(): 'light' | 'dark' | null {
  try {
    const value = window.localStorage.getItem('va.theme-preference');
    if (value === 'light' || value === 'dark') {
      return value;
    }
  } catch (error) {
    console.warn('[theme] Unable to read theme preference', error);
  }
  return null;
}

function renderFatalBootstrapError(error: unknown): void {
  const message = formatBootstrapError(error);
  appRoot.classList.add('app-shell--error');
  appRoot.replaceChildren();

  const container = document.createElement('section');
  container.className = 'app-error';
  container.setAttribute('role', 'alert');
  container.setAttribute('aria-live', 'assertive');

  const title = document.createElement('h1');
  title.className = 'app-error__title';
  title.textContent = 'Unable to start the application';

  const summary = document.createElement('p');
  summary.className = 'app-error__message';
  summary.textContent =
    'The app could not load the SHACL shapes it needs. Please review the shapes file and reload the page.';

  const details = document.createElement('details');
  details.className = 'app-error__details';
  const detailsSummary = document.createElement('summary');
  detailsSummary.textContent = 'Technical details';
  const detailsBody = document.createElement('pre');
  detailsBody.textContent = message;
  details.append(detailsSummary, detailsBody);

  const actions = document.createElement('div');
  actions.className = 'app-error__actions';
  const reloadButton = document.createElement('button');
  reloadButton.type = 'button';
  reloadButton.className = 'app-error__button';
  reloadButton.textContent = 'Reload application';
  reloadButton.addEventListener('click', () => {
    window.location.reload();
  });
  actions.append(reloadButton);

  container.append(title, summary, details, actions);
  appRoot.append(container);
}

function formatBootstrapError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}
