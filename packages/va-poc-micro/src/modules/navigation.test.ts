import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initNavigation } from './navigation';

describe('navigation module', () => {
  const template = `
    <div class="app-shell" data-app>
      <aside class="sidebar" data-collapsed="false">
        <button data-action="toggle-sidebar" type="button"></button>
        <nav>
          <button data-view-target="organisation" class="is-active">Organisation data</button>
          <button data-view-target="rawRdf">Raw RDF</button>
        </nav>
      </aside>
      <div class="content">
        <div data-breadcrumb></div>
        <section data-view="organisation"></section>
        <section data-view="rawRdf" hidden></section>
      </div>
    </div>
  `;

  beforeEach(() => {
    document.body.innerHTML = template;
  });

  it('activates the initial view and updates the breadcrumb', () => {
    const handler = vi.fn();
    initNavigation({ onViewChange: handler });

    const breadcrumb = document.querySelector<HTMLElement>('[data-breadcrumb]');
    const organisationSection = document.querySelector<HTMLElement>('[data-view="organisation"]');
    const rawRdfSection = document.querySelector<HTMLElement>('[data-view="rawRdf"]');

    expect(handler).toHaveBeenCalledWith('organisation');
    expect(organisationSection?.getAttribute('hidden')).toBeNull();
    expect(rawRdfSection?.getAttribute('hidden')).toBe('');
    expect(breadcrumb?.textContent).toBe('Organisation data');
  });

  it('switches to another view when a navigation button is clicked', () => {
    const handler = vi.fn();
    initNavigation({ onViewChange: handler });

    const rawRdfButton = document.querySelector('[data-view-target="rawRdf"]') as HTMLButtonElement;
    const organisationSection = document.querySelector<HTMLElement>('[data-view="organisation"]');
    const rawRdfSection = document.querySelector<HTMLElement>('[data-view="rawRdf"]');

    rawRdfButton.click();

    expect(handler).toHaveBeenLastCalledWith('rawRdf');
    expect(organisationSection?.getAttribute('hidden')).toBe('');
    expect(rawRdfSection?.getAttribute('hidden')).toBeNull();
  });

  it('toggles the sidebar collapsed state', () => {
    initNavigation({ onViewChange: vi.fn() });

    const sidebar = document.querySelector<HTMLElement>('.sidebar');
    const toggle = document.querySelector('[data-action="toggle-sidebar"]') as HTMLButtonElement;

    expect(sidebar?.dataset.collapsed).toBe('false');
    toggle.click();
    expect(sidebar?.dataset.collapsed).toBe('true');
  });
});
