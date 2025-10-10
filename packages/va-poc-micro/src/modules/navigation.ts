import { assert } from './utils/assert';

export type ViewId = 'organisation' | 'objects' | 'eva' | 'rawRdf' | 'endpoints';

interface NavigationOptions {
  onViewChange: (viewId: ViewId) => void;
}

interface NavigationController {
  activate: (viewId: ViewId) => void;
}

const VIEW_BUTTON_SELECTOR = '[data-view-target]';
const VIEW_SECTION_SELECTOR = '[data-view]';
const SIDEBAR_SELECTOR = '.sidebar';
const BREADCRUMB_SELECTOR = '[data-breadcrumb]';

export function initNavigation({ onViewChange }: NavigationOptions): NavigationController {
  const sidebar = assert(
    document.querySelector<HTMLElement>(SIDEBAR_SELECTOR),
    'Sidebar container not found'
  );
  const breadcrumb = document.querySelector<HTMLElement>(BREADCRUMB_SELECTOR);
  const viewButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(VIEW_BUTTON_SELECTOR)
  );
  const sections = new Map<ViewId, HTMLElement>();

  viewButtons.forEach((button) => {
    const target = button.dataset.viewTarget;
    if (!isViewId(target)) {
      return;
    }

    const section = document.querySelector<HTMLElement>(
      `${VIEW_SECTION_SELECTOR}[data-view="${target}"]`
    );
    if (!section) {
      console.warn(`View section for "${target}" not found`);
      return;
    }
    sections.set(target, section);

    button.addEventListener('click', () => {
      activateView(target);
      onViewChange(target);
    });
  });

  const toggleButton = document.querySelector<HTMLButtonElement>('[data-action="toggle-sidebar"]');
  toggleButton?.addEventListener('click', () => {
    const collapsed = sidebar.dataset.collapsed === 'true';
    sidebar.dataset.collapsed = String(!collapsed);
  });

  function activateView(viewId: ViewId, { notify }: { notify: boolean } = { notify: false }) {
    viewButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.viewTarget === viewId);
    });

    sections.forEach((section, id) => {
      section.hidden = id !== viewId;
    });

    const activeButton = viewButtons.find((button) => button.dataset.viewTarget === viewId);
    if (activeButton && breadcrumb) {
      const label = activeButton.dataset.label ?? activeButton.textContent ?? viewId;
      breadcrumb.textContent = label.trim();
    }

    if (notify) {
      onViewChange(viewId);
    }
  }

  const initiallyActive = viewButtons.find((button) => button.classList.contains('is-active'));
  if (initiallyActive && isViewId(initiallyActive.dataset.viewTarget)) {
    activateView(initiallyActive.dataset.viewTarget as ViewId, { notify: true });
  }

  return {
    activate(viewId: ViewId) {
      activateView(viewId);
    },
  };
}

function isViewId(value: string | undefined): value is ViewId {
  return (
    value === 'organisation' ||
    value === 'objects' ||
    value === 'eva' ||
    value === 'rawRdf' ||
    value === 'endpoints'
  );
}
