import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Parser } from 'n3';
import datasetFactory from '@rdfjs/dataset';
import rdfDataFactory, { literal, namedNode } from '@rdfjs/data-model';
import { MemoryLevel } from 'memory-level';
import { GraphStore } from '../data/graph-store.js';
import { attachClassInstanceProvider } from './shacl-class-provider.js';

describe('shacl-class-provider', () => {
  const CLASS_IRI = 'http://example.org/TestClass';
  const RDF_TYPE_IRI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
  const SKOS_PREF_LABEL_IRI = 'http://www.w3.org/2004/02/skos/core#prefLabel';

  let store: GraphStore;
  let capturedProvider: ((classIri: string) => Promise<string>) | null;
  let detach: () => void;

  const parser = new Parser({ format: 'text/turtle' });
  const dataFactory = rdfDataFactory as any;

  async function insertResource(subject: string, label?: string): Promise<void> {
    const quads = [
      dataFactory.quad(
        namedNode(subject),
        namedNode(RDF_TYPE_IRI),
        namedNode(CLASS_IRI),
        dataFactory.defaultGraph()
      ),
    ];
    if (label) {
      quads.push(
        dataFactory.quad(
          namedNode(subject),
          namedNode(SKOS_PREF_LABEL_IRI),
          literal(label),
          dataFactory.defaultGraph()
        )
      );
    }
    await store.putQuads(quads);
  }

  interface FormStub extends HTMLElement {
    setClassInstanceProvider: (provider: (classIri: string) => Promise<string>) => void;
  }

  function createFormStub(): FormStub {
    const element = document.createElement('div') as unknown as FormStub;
    element.setClassInstanceProvider = (provider) => {
      capturedProvider = provider;
    };
    return element;
  }

  async function callProvider(classIri: string): Promise<string> {
    if (!capturedProvider) {
      throw new Error('Provider was not captured');
    }
    return capturedProvider(classIri);
  }

  beforeEach(async () => {
    const backend = new MemoryLevel({ storeEncoding: 'view' });
    store = await GraphStore.create({ backend });
    capturedProvider = null;
    const form = createFormStub();
    detach = attachClassInstanceProvider(form, store);
  });

  afterEach(async () => {
    detach();
    await store.clear();
    await store.close();
  });

  it('serializes rdf:type instances including labels', async () => {
    const resource = 'http://example.org/resources/1';
    const label = 'Resource One';

    await insertResource(resource, label);

    const ttl = await callProvider(CLASS_IRI);
    expect(ttl).not.toBe('');

    const dataset = datasetFactory.dataset(parser.parse(ttl));
    expect(
      dataset.match(namedNode(resource), namedNode(RDF_TYPE_IRI), namedNode(CLASS_IRI)).size
    ).toBeGreaterThan(0);
    expect(
      dataset.match(namedNode(resource), namedNode(SKOS_PREF_LABEL_IRI), literal(label)).size
    ).toBeGreaterThan(0);
  });

  it('caches responses and refreshes when rdf:type entries change', async () => {
    const firstResource = 'http://example.org/resources/1';
    await insertResource(firstResource);

    const getQuadsSpy = vi.spyOn(store, 'getQuads');
    const firstTtl = await callProvider(CLASS_IRI);
    expect(firstTtl).not.toBe('');
    const callsAfterFirst = getQuadsSpy.mock.calls.length;
    await callProvider(CLASS_IRI);
    expect(getQuadsSpy.mock.calls.length).toBe(callsAfterFirst);

    const secondResource = 'http://example.org/resources/2';
    await insertResource(secondResource);

    const refreshedTtl = await callProvider(CLASS_IRI);
    expect(getQuadsSpy.mock.calls.length).toBeGreaterThan(callsAfterFirst);

    const dataset = datasetFactory.dataset(parser.parse(refreshedTtl));
    expect(
      dataset.match(namedNode(secondResource), namedNode(RDF_TYPE_IRI), namedNode(CLASS_IRI)).size
    ).toBeGreaterThan(0);
  });

  it('clears cached results when the store is cleared', async () => {
    const resource = 'http://example.org/resources/1';
    await insertResource(resource);

    await callProvider(CLASS_IRI);

    const getQuadsSpy = vi.spyOn(store, 'getQuads');
    await store.clear();
    const ttl = await callProvider(CLASS_IRI);
    expect(ttl).toBe('');
    expect(getQuadsSpy).toHaveBeenCalled();
  });
});
