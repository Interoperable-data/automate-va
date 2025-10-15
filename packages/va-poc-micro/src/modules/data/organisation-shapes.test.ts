import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryLevel } from 'memory-level';
import { namedNode } from '@rdfjs/data-model';
import {
  loadViewerShapes,
  loadViewerShapesIntoStore,
  resetShapeCache,
} from './organisation-shapes.ts';
import { GraphStore } from './graph-store.ts';

const turtle = `
  @prefix ex: <https://example.com/> .
  ex:Shape a ex:Thing ;
    ex:label "Organisation"@en ;
    ex:targetNode ex:Organisation .
`;

const shapeUrl = '/test-viewer-shapes.ttl';

const createFetchMock = (body: string = turtle) =>
  vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => body,
  })) as unknown as typeof fetch;

describe('viewer shape loader', () => {
  let store: GraphStore | undefined;

  beforeEach(() => {
    resetShapeCache();
  });

  afterEach(async () => {
    if (store) {
      await store.clear();
      await store.close();
      store = undefined;
    }
  });

  it('fetches and caches viewer shapes', async () => {
    const fetchMock = createFetchMock();
    const firstResult = await loadViewerShapes({ fetchFn: fetchMock, url: shapeUrl });
    const secondResult = await loadViewerShapes({ fetchFn: fetchMock, url: shapeUrl });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResult).toBe(secondResult);
    expect(firstResult.text.trim()).toContain('ex:Shape');
    expect(firstResult.quads.length).toBeGreaterThan(0);
    expect(firstResult.dataset.size).toBe(firstResult.quads.length);
  });

  it('forces a reload when requested', async () => {
    const fetchMock = createFetchMock();
    await loadViewerShapes({ fetchFn: fetchMock, url: shapeUrl });
    await loadViewerShapes({ fetchFn: fetchMock, url: shapeUrl, forceReload: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('loads viewer shapes into a graph store', async () => {
    const fetchMock = createFetchMock();
    const backend = new MemoryLevel({ storeEncoding: 'view' });
    store = await GraphStore.create({ backend });

    const { quads } = await loadViewerShapesIntoStore({
      store,
      fetchFn: fetchMock,
      url: shapeUrl,
    });
    const stored = await store.getQuads();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(stored.length).toBe(quads.length);
    expect(stored.some((item) => item.subject.equals(namedNode('https://example.com/Shape')))).toBe(
      true
    );
  });
});
