import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Parser } from 'n3';
import datasetFactory from '@rdfjs/dataset';
import { literal, namedNode, quad } from '@rdfjs/data-model';
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
    sh:targetClass org:Organization ;
    eraUi:valuesNamespace "https://data.europa.eu/949/local"^^<http://www.w3.org/2001/XMLSchema#anyURI> .
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

  async function waitForModalToDisappear(root: HTMLElement): Promise<void> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (!root.querySelector('.modal')) {
        return;
      }
    }
    throw new Error('Modal did not close in time');
  }

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

  it('reveals existing data-values payload when toggled', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    const subjectIri = 'https://data.europa.eu/949/local/organization/42';
    const graphIri = `${subjectIri}#graph`;
    await store.putQuads([
      quad(
        namedNode(subjectIri),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://www.w3.org/ns/org#Organization'),
        namedNode(graphIri)
      ),
      quad(
        namedNode(subjectIri),
        namedNode('http://www.w3.org/2004/02/skos/core#prefLabel'),
        literal('Existing Org'),
        namedNode(graphIri)
      ),
    ]);

    await initOrganisationManagerView({ container, store, shapes });

    const resourceButton = container.querySelector<HTMLButtonElement>('.resource-list__button');
    expect(resourceButton, 'resource list should surface existing entry').not.toBeNull();
    resourceButton?.dispatchEvent(new Event('click'));

    await Promise.resolve();
    await Promise.resolve();

    const statusButton = container.querySelector<HTMLButtonElement>('.modal__status--toggle');
    const inspector = container.querySelector<HTMLPreElement>('.modal__inspector');
    expect(statusButton, 'status toggle button rendered').not.toBeNull();
    expect(inspector, 'inspector code block rendered').not.toBeNull();
    expect(inspector?.hidden).toBe(true);

    statusButton?.click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(statusButton?.getAttribute('aria-expanded')).toBe('true');
    expect(inspector?.hidden).toBe(false);
    expect(inspector?.textContent ?? '').toContain('Existing Org');
    expect(inspector?.textContent ?? '').toContain('http://www.w3.org/ns/org#Organization');
  });

  it('shows a helpful message when no data-values were supplied', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    await initOrganisationManagerView({ container, store, shapes });

    const createButton = container.querySelector<HTMLButtonElement>('button.panel__button');
    expect(createButton).not.toBeNull();
    createButton?.dispatchEvent(new Event('click'));

    await Promise.resolve();

    const statusButton = container.querySelector<HTMLButtonElement>('.modal__status--toggle');
    const inspector = container.querySelector<HTMLPreElement>('.modal__inspector');
    expect(statusButton).not.toBeNull();
    expect(inspector).not.toBeNull();

    statusButton?.click();

    expect(inspector?.textContent).toContain('Form did not receive data-values');
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
      'https://data.europa.eu/949/local/organisation/00000000-0000-0000-0000-000000000000';
    const expectedGraph = `${expectedSubject}#graph`;

    expect(subject).toBe(expectedSubject);
    expect(graph).toBe(expectedGraph);

    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await waitForModalToDisappear(container);

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
      typedQuads.some((quad) => {
        if (quad.subject.value !== subjectValue) {
          return false;
        }
        if (quad.predicate.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
          return false;
        }
        return (
          quad.object.value === 'http://www.w3.org/ns/org#Organisation' ||
          quad.object.value === 'http://www.w3.org/ns/org#Organization'
        );
      })
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
    expect(container.querySelector('.modal')).toBeNull();
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

    await waitForModalToDisappear(container);

    const graph = form?.getAttribute('data-values-graph');
    expect(graph).not.toBeNull();

    const quadsInStore = await store.getQuads({ graph: namedNode(graph!) });
    expect(quadsInStore.length).toBeGreaterThan(0);

    expect(uuidSpy).toHaveBeenCalled();
    expect(container.querySelector('.modal')).toBeNull();
  });

  it('closes the modal without persisting data when cancelled', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    await initOrganisationManagerView({ container, store, shapes });

    const createButton = container.querySelector('button.panel__button');
    expect(createButton).not.toBeNull();
    createButton?.dispatchEvent(new Event('click'));

    await Promise.resolve();

    const cancelButton = container.querySelector('.modal__button--secondary');
    expect(cancelButton).not.toBeNull();
    cancelButton?.dispatchEvent(new Event('click'));

    await waitForModalToDisappear(container);

    expect(container.querySelector('.modal')).toBeNull();
    const allQuads = await store.getQuads({});
    expect(allQuads.length).toBe(0);
  });
});
