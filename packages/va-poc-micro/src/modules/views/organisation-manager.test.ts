import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Parser } from 'n3';
import datasetFactory from '@rdfjs/dataset';
import { namedNode } from '@rdfjs/data-model';
import { MemoryLevel } from 'memory-level';
import { GraphStore } from '../data/graph-store.js';
import { initOrganisationManagerView } from './organisation-manager.js';

const SHAPE_TTL = `
  @prefix sh: <http://www.w3.org/ns/shacl#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix org: <http://www.w3.org/ns/org#> .
  @prefix eraUi: <http://data.europa.eu/949/ui/> .

  <http://example.org/OrganisationShape>
    a sh:NodeShape ;
    rdfs:label "Organisation" ;
    rdfs:comment "Test organisation shape" ;
    sh:targetClass org:Organisation ;
    eraUi:valuesNamespace "https://data.europa.eu/va/local"^^<http://www.w3.org/2001/XMLSchema#anyURI> .
`;

type SerializeProvider = (element: HTMLElement) => string;

let serializeProvider: SerializeProvider | null = null;

class ShaclFormStub extends HTMLElement {
  serialize(): string {
    if (serializeProvider) {
      return serializeProvider(this);
    }
    const subject = this.getAttribute('data-values-subject');
    return `@prefix skos: <http://www.w3.org/2004/02/skos/core#> .\n<${subject}> skos:prefLabel "ACME Logistics" .`;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(): Promise<boolean> {
    return true;
  }
}

describe('organisation-manager persistence', () => {
  let store: GraphStore;
  let container: HTMLElement;
  const parser = new Parser({ format: 'text/turtle' });

  beforeAll(() => {
    if (!customElements.get('shacl-form')) {
      customElements.define('shacl-form', ShaclFormStub);
    }
  });

  beforeEach(async () => {
    const backend = new MemoryLevel({ storeEncoding: 'view' });
    store = await GraphStore.create({ backend });
    container = document.createElement('div');
    document.body.append(container);
    serializeProvider = null;
  });

  afterEach(async () => {
    await store.clear();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await store.close();
    container.remove();
    vi.restoreAllMocks();
    serializeProvider = null;
  });

  it('persists submitted resources into the quadstore using the descriptor namespace graph', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    const uuidSpy = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-0000-0000-000000000000');

    await initOrganisationManagerView({ container, store, shapes });

    const createButton = container.querySelector('button.panel__button');
    expect(createButton).not.toBeNull();
    createButton?.dispatchEvent(new Event('click'));

    await Promise.resolve();

    const form = container.querySelector('shacl-form') as ShaclFormStub | null;
    expect(form).not.toBeNull();

    const subject = form?.getAttribute('data-values-subject');
    const graph = form?.getAttribute('data-values-graph');

    const expectedSubject =
      'https://data.europa.eu/va/local/organisation/00000000-0000-0000-0000-000000000000';
    const expectedGraph = `${expectedSubject}#graph`;

    expect(subject).toBe(expectedSubject);
    expect(graph).toBe(expectedGraph);

    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    const subjectValue = subject!;
    const graphValue = graph!;
    const graphNode = namedNode(graphValue);
    const quadsInStore = await store.getQuads({ graph: graphNode });
    type MinimalQuad = {
      subject: { value: string };
      predicate: { value: string };
      object: { value: string };
    };
    const typedQuads = quadsInStore as MinimalQuad[];

    expect(typedQuads.length).toBeGreaterThanOrEqual(2);
    expect(
      typedQuads.some(
        (quad) =>
          quad.subject.value === subjectValue &&
          quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
          quad.object.value === 'http://www.w3.org/ns/org#Organisation'
      )
    ).toBe(true);
    expect(
      typedQuads.some(
        (quad) =>
          quad.subject.value === subjectValue &&
          quad.predicate.value === 'http://www.w3.org/2004/02/skos/core#prefLabel' &&
          quad.object.value === 'ACME Logistics'
      )
    ).toBe(true);

    expect(uuidSpy).toHaveBeenCalled();
  });

  it('persists form output when the shacl-form emits TriG content', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    serializeProvider = (element) => {
      const subject = element.getAttribute('data-values-subject');
      return `@prefix skos: <http://www.w3.org/2004/02/skos/core#> .\n{\n  <${subject}> skos:prefLabel "ACME Logistics" .\n}`;
    };

    const uuidSpy = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('11111111-1111-1111-1111-111111111111');

    await initOrganisationManagerView({ container, store, shapes });

    const createButton = container.querySelector('button.panel__button');
    expect(createButton).not.toBeNull();
    createButton?.dispatchEvent(new Event('click'));

    await Promise.resolve();

    const form = container.querySelector('shacl-form') as ShaclFormStub | null;
    expect(form).not.toBeNull();

    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    const graph = form?.getAttribute('data-values-graph');
    expect(graph).not.toBeNull();

    const quadsInStore = await store.getQuads({ graph: namedNode(graph!) });
    expect(quadsInStore.length).toBeGreaterThan(0);

    expect(uuidSpy).toHaveBeenCalled();
  });
});
