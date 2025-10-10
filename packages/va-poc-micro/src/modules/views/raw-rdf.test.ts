import { describe, expect, it, vi } from 'vitest';
import { initRawRdfView } from './raw-rdf.js';
import type { GraphStore, GraphStoreListener } from '../data/graph-store.js';

describe('raw rdf view', () => {
  async function flushPromises(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  function createStore() {
    let listeners: GraphStoreListener[] = [];
    const getQuads = vi.fn().mockResolvedValue([]);
    const clear = vi.fn().mockImplementation(async () => {
      for (const listener of listeners) {
        listener({ type: 'clear' });
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
        subscribe,
      } as unknown as GraphStore,
      clear,
      getQuads,
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
});
