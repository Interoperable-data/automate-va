import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@ulb-darmstadt/shacl-form', () => ({}));

const loadShapesMock = vi.fn<(options: unknown) => Promise<unknown>>();
const graphStoreCreateMock = vi.fn<() => Promise<unknown>>();

vi.mock('./modules/data/organisation-shapes', () => ({
  loadViewerShapes: loadShapesMock,
}));

vi.mock('./modules/data/graph-store', () => ({
  GraphStore: {
    create: graphStoreCreateMock,
  },
}));

vi.mock('./modules/views/organisation-manager', () => ({
  initOrganisationManagerView: vi.fn(),
}));

vi.mock('./modules/views/raw-rdf', () => ({
  initRawRdfView: vi.fn(),
}));

vi.mock('./modules/views/endpoints', () => ({
  initEndpointsView: vi.fn(),
}));

vi.mock('./modules/navigation', () => ({
  initNavigation: vi.fn().mockReturnValue({}),
}));

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('application bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    loadShapesMock.mockReset();
    graphStoreCreateMock.mockReset();
    document.body.innerHTML = '<div data-app class="app-shell"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a fatal alert when organisation shapes fail to load', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    graphStoreCreateMock.mockResolvedValue({});
    loadShapesMock.mockRejectedValue(new Error('Expected entity but got eof on line 407.'));

    await import('./main.ts');
    await flushMicrotasks();

    const alert = document.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent ?? '').toContain('Unable to start the application');
    expect(alert?.textContent ?? '').toContain('Expected entity but got eof');
    expect(document.querySelector('.app-shell')?.classList.contains('app-shell--error')).toBe(true);

    consoleErrorSpy.mockRestore();
  });
});
