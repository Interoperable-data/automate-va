import './style.css';
import '@ulb-darmstadt/shacl-form';
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
