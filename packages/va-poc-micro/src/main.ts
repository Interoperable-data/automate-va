import './style.css';
import { initNavigation, type ViewId } from './modules/navigation';
import { assert } from './modules/utils/assert';

const appRoot = assert(document.querySelector<HTMLElement>('[data-app]'), 'App shell not found');

const controller = initNavigation({
  onViewChange(viewId) {
    handleViewChange(viewId);
  },
});

setupLoginButton();

function handleViewChange(viewId: ViewId) {
  console.debug(`[navigation] switched to view: ${viewId}`);
}

function setupLoginButton() {
  const loginButton = appRoot.querySelector<HTMLButtonElement>('[data-action="msal-login"]');
  loginButton?.addEventListener('click', () => {
    console.info('[auth] MSAL login clicked (handler pending integration)');
  });
}

// expose controller for debugging
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__vaNavigation__ = controller;
}
