import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryLevel } from 'memory-level';
import { namedNode, literal, quad } from '@rdfjs/data-model';
import { GraphStore, type GraphStoreChange } from './graph-store.ts';

describe('GraphStore', () => {
  let store: GraphStore;

  beforeEach(async () => {
    const backend = new MemoryLevel({ storeEncoding: 'view' });
    store = await GraphStore.create({ backend });
  });

  afterEach(async () => {
    await store?.clear();
    await store?.close();
  });

  const quadA = quad(
    namedNode('https://example.com/subject'),
    namedNode('https://example.com/predicate'),
    literal('object-a'),
    namedNode('https://example.com/graph')
  );

  const quadB = quad(
    namedNode('https://example.com/subject-2'),
    namedNode('https://example.com/predicate-2'),
    literal('object-b'),
    namedNode('https://example.com/graph')
  );

  const serialise = (change: GraphStoreChange): string =>
    change.type === 'clear'
      ? 'clear'
      : `${change.type}:${change.quads.map((item) => item.object.value).join(',')}`;

  it('stores and retrieves quads', async () => {
    await store.putQuads([quadA, quadB]);

    const quads = await store.getQuads();
    expect(quads).toHaveLength(2);

    const dataset = await store.getDataset();
    expect(dataset.size).toBe(2);
    expect(dataset.has(quadA)).toBe(true);
    expect(dataset.has(quadB)).toBe(true);
  });

  it('deletes and clears quads', async () => {
    await store.putQuads([quadA, quadB]);

    await store.deleteQuads([quadA]);
    let quads = await store.getQuads();
    expect(quads).toHaveLength(1);
    expect(quads[0].subject.equals(quadB.subject)).toBe(true);

    await store.clear();
    quads = await store.getQuads();
    expect(quads).toHaveLength(0);
  });

  it('emits change events for mutations', async () => {
    const changes: string[] = [];
    const unsubscribe = store.subscribe((change: GraphStoreChange) =>
      changes.push(serialise(change))
    );

    await store.putQuads([quadA]);
    await store.deleteQuads([quadA]);
    await store.clear();

    unsubscribe();

    expect(changes).toEqual(['put:object-a', 'delete:object-a', 'clear']);
  });

  it('recovers from corrupted quad entries by clearing the store', async () => {
    const innerStore = (store as unknown as { store: { get: () => Promise<unknown> } }).store;
    const getSpy = vi
      .spyOn(innerStore, 'get')
      .mockRejectedValueOnce(new Error('Unexpected encoded term type ""'));
    const clearSpy = vi.spyOn(store, 'clear');

    const quads = await store.getQuads();

    expect(quads).toEqual([]);
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);

    getSpy.mockRestore();
    clearSpy.mockRestore();
  });
});
