import { describe, expect, it, vi } from 'vitest';
import { literal, namedNode, quad } from '@rdfjs/data-model';
import { initRawRdfView } from './raw-rdf.js';
import type { GraphStore, GraphStoreListener } from '../data/graph-store.js';

describe('raw rdf view', () => {
  async function flushPromises(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  function createStore(initialQuads = [] as ReturnType<typeof quad>[]) {
    let listeners: GraphStoreListener[] = [];
    const state: ReturnType<typeof quad>[] = [...initialQuads];

    const getQuads = vi.fn().mockImplementation(async () => [...state]);
    const clear = vi.fn().mockImplementation(async () => {
      state.length = 0;
      for (const listener of listeners) {
        listener({ type: 'clear' });
      }
    });
    const deleteQuads = vi.fn().mockImplementation(async (entries: ReturnType<typeof quad>[]) => {
      if (entries.length === 0) {
        return;
      }
      for (const listener of listeners) {
        listener({ type: 'delete', quads: entries });
      }
    });
    const putQuads = vi.fn().mockImplementation(async (entries: ReturnType<typeof quad>[]) => {
      if (!entries || entries.length === 0) {
        return;
      }
      state.push(...entries);
      for (const listener of listeners) {
        listener({ type: 'put', quads: entries });
      }
    });
    const subscribe = vi.fn((listener: GraphStoreListener) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((entry) => entry !== listener);
      };
    });

    return {
      store: {
        getQuads,
        clear,
        deleteQuads,
        putQuads,
        subscribe,
      } as unknown as GraphStore,
      clear,
      getQuads,
      deleteQuads,
      putQuads,
    };
  }

  function mockFilePicker(file: File) {
    const originalCreateElement = document.createElement.bind(document);
    const input = originalCreateElement('input');
    input.type = 'file';

    const spy = vi.spyOn(document, 'createElement').mockImplementation(((
      tagName: string,
      options?: unknown
    ) => {
      if (typeof tagName === 'string' && tagName.toLowerCase() === 'input') {
        return input;
      }
      return originalCreateElement(tagName as any, options as any);
    }) as typeof document.createElement);

    input.click = () => {
      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      });
      input.dispatchEvent(new Event('change'));
    };

    return {
      restore: () => spy.mockRestore(),
    };
  }

  function getAlertElements(container: HTMLElement) {
    const alert = container.querySelector<HTMLElement>('[data-role="alert"]');
    const message = container.querySelector<HTMLElement>('[data-role="alert-message"]');
    return { alert, message };
  }

  it('clears the browser storage when the user confirms the warning dialog', async () => {
    const container = document.createElement('div');
    const { store, clear } = createStore();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    initRawRdfView({ container, store });
    await flushPromises();

    const clearButton = container.querySelector<HTMLButtonElement>('[data-role="clear"]');
    expect(clearButton).not.toBeNull();

    clearButton!.click();
    await flushPromises();
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
    const { alert, message } = getAlertElements(container);
    expect(alert?.hidden).toBe(false);
    expect(message?.textContent).toBe('Browser storage cleared.');

    confirmSpy.mockRestore();
  });

  it('cancels the purge when the user dismisses the warning', async () => {
    const container = document.createElement('div');
    const { store, clear } = createStore();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    initRawRdfView({ container, store });
    await flushPromises();

    const clearButton = container.querySelector<HTMLButtonElement>('[data-role="clear"]');
    const status = container.querySelector<HTMLElement>('[data-role="status"]');
    expect(clearButton).not.toBeNull();
    expect(status).not.toBeNull();

    clearButton!.click();
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(clear).not.toHaveBeenCalled();
    expect(status!.textContent).toBe('Storage purge cancelled.');
    const { alert, message } = getAlertElements(container);
    expect(alert?.hidden).toBe(false);
    expect(message?.textContent).toBe('Storage purge cancelled.');

    confirmSpy.mockRestore();
  });

  it('removes references to expired resources when the user confirms the cleanup', async () => {
    const container = document.createElement('div');
    const expired = namedNode('https://data.europa.eu/949/local/organisation/expired');
    const expiredGraph = namedNode('https://data.europa.eu/949/local/organisation/expired#graph');
    const validity = namedNode('https://data.europa.eu/949/local/organisation/expired#validity');
    const validityBeginning = namedNode(
      'https://data.europa.eu/949/local/organisation/expired#validity-beginning'
    );
    const validityEnd = namedNode(
      'https://data.europa.eu/949/local/organisation/expired#validity-end'
    );
    const active = namedNode('https://data.europa.eu/949/local/organisation/active');
    const activeGraph = namedNode('https://data.europa.eu/949/local/organisation/active#graph');

    const expiredQuads = [
      quad(
        expired,
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('https://www.w3.org/ns/org#Organization'),
        expiredGraph
      ),
      quad(expired, namedNode('http://purl.org/dc/terms/valid'), validity, expiredGraph),
      quad(
        validity,
        namedNode('http://www.w3.org/2006/time#hasBeginning'),
        validityBeginning,
        expiredGraph
      ),
      quad(
        validityBeginning,
        namedNode('http://www.w3.org/2006/time#inXSDDateTime'),
        literal('2024-01-01T00:00:00Z', namedNode('http://www.w3.org/2001/XMLSchema#dateTime')),
        expiredGraph
      ),
      quad(validity, namedNode('http://www.w3.org/2006/time#hasEnd'), validityEnd, expiredGraph),
      quad(
        validityEnd,
        namedNode('http://www.w3.org/2006/time#inXSDDateTime'),
        literal('2024-01-02T00:00:00Z', namedNode('http://www.w3.org/2001/XMLSchema#dateTime')),
        expiredGraph
      ),
    ];

    const activeQuads = [
      quad(
        active,
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('https://www.w3.org/ns/org#Organization'),
        activeGraph
      ),
    ];

    const referenceToExpired = quad(
      namedNode('https://data.europa.eu/949/local/unit/1'),
      namedNode('http://example.org/relatesTo'),
      expired,
      namedNode('https://data.europa.eu/949/local/unit/1#graph')
    );

    const referenceToActive = quad(
      namedNode('https://data.europa.eu/949/local/unit/2'),
      namedNode('http://example.org/relatesTo'),
      active,
      namedNode('https://data.europa.eu/949/local/unit/2#graph')
    );

    const externalConceptReference = quad(
      active,
      namedNode('http://example.org/relatedConcept'),
      namedNode('http://example.org/concept/42'),
      activeGraph
    );

    const dataset = [
      ...expiredQuads,
      ...activeQuads,
      referenceToExpired,
      referenceToActive,
      externalConceptReference,
    ];

    const { store, deleteQuads, getQuads } = createStore(dataset);
    getQuads.mockResolvedValue(dataset);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    initRawRdfView({ container, store });
    await flushPromises();

    const cleanButton = container.querySelector<HTMLButtonElement>('[data-role="clean"]');
    const status = container.querySelector<HTMLElement>('[data-role="status"]');
    expect(cleanButton).not.toBeNull();
    expect(status).not.toBeNull();

    cleanButton!.click();
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(deleteQuads).toHaveBeenCalledTimes(1);
    const [payload] = deleteQuads.mock.calls[0];
    expect(payload).toEqual([referenceToExpired]);
    expect(status!.textContent).toBe('Removed 1 dangling triple.');
    const { alert, message } = getAlertElements(container);
    expect(alert?.hidden).toBe(false);
    expect(message?.textContent).toBe('Removed 1 dangling triple.');

    confirmSpy.mockRestore();
  });

  it('cancels the cleanup when the user dismisses the warning', async () => {
    const container = document.createElement('div');
    const { store, deleteQuads } = createStore();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    initRawRdfView({ container, store });
    await flushPromises();

    const cleanButton = container.querySelector<HTMLButtonElement>('[data-role="clean"]');
    const status = container.querySelector<HTMLElement>('[data-role="status"]');
    expect(cleanButton).not.toBeNull();
    expect(status).not.toBeNull();

    cleanButton!.click();
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(deleteQuads).not.toHaveBeenCalled();
    expect(status!.textContent).toBe('Graph cleanup cancelled.');
    const { alert, message } = getAlertElements(container);
    expect(alert?.hidden).toBe(false);
    expect(message?.textContent).toBe('Graph cleanup cancelled.');

    confirmSpy.mockRestore();
  });

  it('uploads TriG data and merges it into the store', async () => {
    const container = document.createElement('div');
    const { store, putQuads, getQuads } = createStore();

    initRawRdfView({ container, store });
    await flushPromises();

    const uploadButton = container.querySelector<HTMLButtonElement>('[data-role="upload"]');
    const status = container.querySelector<HTMLElement>('[data-role="status"]');
    expect(uploadButton).not.toBeNull();
    expect(status).not.toBeNull();

    const trig = `@prefix ex: <https://example.com/> .\nGRAPH ex:g {\n  ex:s ex:p ex:o .\n}`;
    const file = new File([trig], 'import.trig', { type: 'application/trig' });
    const { restore } = mockFilePicker(file);

    uploadButton!.click();
    await flushPromises();
    await flushPromises();

    expect(putQuads).toHaveBeenCalledTimes(1);
    const [uploaded] = putQuads.mock.calls[0] as [ReturnType<typeof quad>[]];
    expect(uploaded).toHaveLength(1);
    expect(uploaded[0].graph.termType).toBe('NamedNode');
    expect(uploaded[0].graph.value).toBe('https://example.com/g');
    expect(getQuads).toHaveBeenCalled();
    expect(status!.textContent ?? '').toContain('Imported 1 quad from import.trig');
    const { alert, message } = getAlertElements(container);
    expect(alert?.hidden).toBe(false);
    expect(message?.textContent).toBe('Imported 1 quad from import.trig');

    restore();
  });

  it('uploads N-Triples data into the default graph', async () => {
    const container = document.createElement('div');
    const { store, putQuads } = createStore();

    initRawRdfView({ container, store });
    await flushPromises();

    const uploadButton = container.querySelector<HTMLButtonElement>('[data-role="upload"]');
    const status = container.querySelector<HTMLElement>('[data-role="status"]');
    expect(uploadButton).not.toBeNull();
    expect(status).not.toBeNull();

    const nt = '<https://example.com/s> <https://example.com/p> "value" .';
    const file = new File([nt], 'dataset.nt', { type: 'text/plain' });
    const { restore } = mockFilePicker(file);

    uploadButton!.click();
    await flushPromises();
    await flushPromises();

    expect(putQuads).toHaveBeenCalledTimes(1);
    const [uploaded] = putQuads.mock.calls[0] as [ReturnType<typeof quad>[]];
    expect(uploaded).toHaveLength(1);
    expect(uploaded[0].graph.termType).toBe('DefaultGraph');
    expect(status!.textContent ?? '').toContain('Imported 1 quad from dataset.nt');
    const { alert, message } = getAlertElements(container);
    expect(alert?.hidden).toBe(false);
    expect(message?.textContent).toBe('Imported 1 quad from dataset.nt');

    restore();
  });

  it('uploads Turtle data into the default graph', async () => {
    const container = document.createElement('div');
    const { store, putQuads } = createStore();

    initRawRdfView({ container, store });
    await flushPromises();

    const uploadButton = container.querySelector<HTMLButtonElement>('[data-role="upload"]');
    const status = container.querySelector<HTMLElement>('[data-role="status"]');
    expect(uploadButton).not.toBeNull();
    expect(status).not.toBeNull();

    const ttl = `@prefix ex: <https://example.com/> .\nex:s ex:p ex:o .`;
    const file = new File([ttl], 'dataset.ttl', { type: 'text/turtle' });
    const { restore } = mockFilePicker(file);

    uploadButton!.click();
    await flushPromises();
    await flushPromises();

    expect(putQuads).toHaveBeenCalledTimes(1);
    const [uploaded] = putQuads.mock.calls[0] as [ReturnType<typeof quad>[]];
    expect(uploaded).toHaveLength(1);
    expect(uploaded[0].graph.termType).toBe('DefaultGraph');
    expect(status!.textContent ?? '').toContain('Imported 1 quad from dataset.ttl');
    const { alert, message } = getAlertElements(container);
    expect(alert?.hidden).toBe(false);
    expect(message?.textContent).toBe('Imported 1 quad from dataset.ttl');

    restore();
  });

  it('rejects Turtle uploads that contain named graphs', async () => {
    const container = document.createElement('div');
    const { store, putQuads } = createStore();

    initRawRdfView({ container, store });
    await flushPromises();

    const uploadButton = container.querySelector<HTMLButtonElement>('[data-role="upload"]');
    const status = container.querySelector<HTMLElement>('[data-role="status"]');
    expect(uploadButton).not.toBeNull();
    expect(status).not.toBeNull();

    const invalidTtl = `@prefix ex: <https://example.com/> .\nGRAPH ex:g { ex:s ex:p ex:o . }`;
    const file = new File([invalidTtl], 'invalid.ttl', { type: 'text/turtle' });
    const { restore } = mockFilePicker(file);

    uploadButton!.click();
    await flushPromises();
    await flushPromises();

    expect(putQuads).not.toHaveBeenCalled();
    expect(status!.textContent ?? '').toContain('Failed to upload invalid.ttl');
    const { alert, message } = getAlertElements(container);
    expect(alert?.hidden).toBe(false);
    expect(message?.textContent ?? '').toContain('Failed to upload invalid.ttl');

    restore();
  });
});
