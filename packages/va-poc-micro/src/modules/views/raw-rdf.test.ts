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
    const getQuads = vi.fn().mockResolvedValue(initialQuads);
    const clear = vi.fn().mockImplementation(async () => {
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
        subscribe,
      } as unknown as GraphStore,
      clear,
      getQuads,
      deleteQuads,
    };
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

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);

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

    confirmSpy.mockRestore();
  });
});
