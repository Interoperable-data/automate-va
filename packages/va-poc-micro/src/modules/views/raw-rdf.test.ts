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

  it('removes dangling triples when the user confirms the cleanup', async () => {
    const container = document.createElement('div');
    const dangling = quad(
      namedNode('https://data.europa.eu/949/local/unit/1'),
      namedNode('http://example.org/relatesTo'),
      namedNode('https://data.europa.eu/949/local/organisation/missing'),
      namedNode('https://data.europa.eu/949/local/unit/1#graph')
    );
    const retained = quad(
      namedNode('https://data.europa.eu/949/local/organisation/2'),
      namedNode('http://example.org/name'),
      literal('Active'),
      namedNode('https://data.europa.eu/949/local/organisation/2#graph')
    );
    const typeTriple = quad(
      namedNode('https://data.europa.eu/949/local/organisation/2'),
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode('https://www.w3.org/ns/org#Organization'),
      namedNode('https://data.europa.eu/949/local/organisation/2#graph')
    );
    const referenced = quad(
      namedNode('https://data.europa.eu/949/local/unit/3'),
      namedNode('http://example.org/relatesTo'),
      namedNode('https://data.europa.eu/949/local/organisation/2'),
      namedNode('https://data.europa.eu/949/local/unit/3#graph')
    );

    const { store, deleteQuads, getQuads } = createStore([
      dangling,
      retained,
      referenced,
      typeTriple,
    ]);
    getQuads.mockResolvedValue([dangling, retained, referenced, typeTriple]);
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
    expect(payload).toEqual([dangling]);
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
