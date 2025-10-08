import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryLevel } from 'memory-level';
import { namedNode } from '@rdfjs/data-model';
import {
  loadOrganisationShapes,
  loadOrganisationShapesIntoStore,
  resetShapeCache,
} from './organisation-shapes.ts';
import { GraphStore } from './graph-store.ts';

const turtle = `
  @prefix ex: <https://example.com/> .
  ex:Shape a ex:Thing ;
    ex:label "Organisation"@en ;
    ex:targetNode ex:Organisation .
`;

const createFetchMock = (body: string = turtle) =>
  vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => body,
  })) as unknown as typeof fetch;

describe('organisation shape loader', () => {
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

  it('fetches and caches organisation shapes', async () => {
    const fetchMock = createFetchMock();
    const firstResult = await loadOrganisationShapes({ fetchFn: fetchMock });
    const secondResult = await loadOrganisationShapes({ fetchFn: fetchMock });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResult).toBe(secondResult);
    expect(firstResult.text.trim()).toContain('ex:Shape');
    expect(firstResult.quads.length).toBeGreaterThan(0);
    expect(firstResult.dataset.size).toBe(firstResult.quads.length);
  });

  it('forces a reload when requested', async () => {
    const fetchMock = createFetchMock();
    await loadOrganisationShapes({ fetchFn: fetchMock });
    await loadOrganisationShapes({ fetchFn: fetchMock, forceReload: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('loads organisation shapes into a graph store', async () => {
    const fetchMock = createFetchMock();
    const backend = new MemoryLevel({ storeEncoding: 'view' });
    store = await GraphStore.create({ backend });

    const { quads } = await loadOrganisationShapesIntoStore({ store, fetchFn: fetchMock });
    const stored = await store.getQuads();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(stored.length).toBe(quads.length);
    expect(stored.some((item) => item.subject.equals(namedNode('https://example.com/Shape')))).toBe(
      true
    );
  });
});
