import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Parser } from 'n3';
import datasetFactory from '@rdfjs/dataset';
import { literal, namedNode, quad } from '@rdfjs/data-model';
import { MemoryLevel } from 'memory-level';
import { GraphStore } from '../data/graph-store.js';
import { initOrganisationManagerView } from './organisation-manager.js';
import * as resourceStoreUtils from './resource-store-utils.js';

const SHAPE_TTL = `
  @prefix sh: <http://www.w3.org/ns/shacl#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix org: <http://www.w3.org/ns/org#> .
  @prefix dash: <http://datashapes.org/dash#> .

  <http://example.org/OrganisationShape>
    a sh:NodeShape ;
    rdfs:label "Organisation" ;
    rdfs:comment "Test organisation shape" ;
    sh:targetClass org:Organization ;
    dash:stem <https://data.europa.eu/949/local/> .
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

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function findButtonByText(root: ParentNode, text: string): HTMLButtonElement | null {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
  return buttons.find((button) => button.textContent?.includes(text)) ?? null;
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

  async function waitForElement<TElement extends Element>(
    root: ParentNode,
    selector: string
  ): Promise<TElement> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const element = root.querySelector<TElement>(selector);
      if (element) {
        return element;
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    throw new Error(`Element matching selector "${selector}" not found in time`);
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

    await flushMicrotasks();

    const status = container.querySelector<HTMLElement>('.modal__status');
    expect(status, 'status message rendered beneath form').not.toBeNull();
    expect(status?.textContent ?? '').toContain(
      'Values are validated against the SHACL shapes defining the form.'
    );
    expect(container.querySelector('.modal__inspector')).toBeNull();
  });

  it('shows the validation reminder beneath newly created forms', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    await initOrganisationManagerView({ container, store, shapes });

    const createButton = container.querySelector<HTMLButtonElement>('.resource-list__create');
    expect(createButton).not.toBeNull();
    createButton?.dispatchEvent(new Event('click'));

    await flushMicrotasks();

    const status = container.querySelector<HTMLElement>('.modal__status');
    expect(status).not.toBeNull();
    expect(status?.textContent ?? '').toContain(
      'Values are validated against the SHACL shapes defining the form.'
    );
    expect(container.querySelector('.modal__inspector')).toBeNull();
  });

  it('persists submitted resources into the quadstore using the descriptor namespace graph', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    const uuidSpy = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-0000-0000-000000000000');

    await initOrganisationManagerView({ container, store, shapes });

    const createButton = container.querySelector('.resource-list__create');
    expect(createButton).not.toBeNull();
    createButton?.dispatchEvent(new Event('click'));

    await flushMicrotasks();

    const form = container.querySelector('shacl-form') as ShaclFormStub | null;
    expect(form).not.toBeNull();

    const subject = form?.getAttribute('data-values-subject');
    const graph = form?.getAttribute('data-values-graph');

    const expectedSubject = 'https://data.europa.eu/949/local/00000000-0000-0000-0000-000000000000';
    const expectedGraph = `${expectedSubject}#graph`;

    expect(subject).toBe(expectedSubject);
    expect(graph).toBe(expectedGraph);

    const saveButton = findButtonByText(container, 'Create Organisation');
    expect(saveButton).not.toBeNull();
    saveButton?.click();

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
    expect(
      typedQuads.some(
        (quad) =>
          quad.subject.value === subjectValue &&
          quad.predicate.value === 'http://purl.org/dc/terms/modified'
      )
    ).toBe(false);

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

    const createButton = container.querySelector('.resource-list__create');
    expect(createButton).not.toBeNull();
    createButton?.dispatchEvent(new Event('click'));

    await flushMicrotasks();

    const form = container.querySelector('shacl-form') as ShaclFormStub | null;
    expect(form).not.toBeNull();

    const saveButton = findButtonByText(container, 'Create Organisation');
    expect(saveButton).not.toBeNull();
    saveButton?.click();

    await waitForModalToDisappear(container);

    const graph = form?.getAttribute('data-values-graph');
    expect(graph).not.toBeNull();

    const quadsInStore = await store.getQuads({ graph: namedNode(graph!) });
    expect(quadsInStore.length).toBeGreaterThan(0);

    expect(uuidSpy).toHaveBeenCalled();
    expect(container.querySelector('.modal')).toBeNull();
  });

  it('preserves creation metadata and records modification timestamps when updating resources', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    const subjectIri = 'https://data.europa.eu/949/local/organization/90';
    const graphIri = `${subjectIri}#graph`;
    const previousModified = '2024-03-01T00:00:00Z';

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
        literal('Original Org'),
        namedNode(graphIri)
      ),
      quad(
        namedNode(subjectIri),
        namedNode('http://purl.org/dc/terms/created'),
        literal('2024-01-01T00:00:00Z', namedNode('http://www.w3.org/2001/XMLSchema#dateTime')),
        namedNode(graphIri)
      ),
      quad(
        namedNode(subjectIri),
        namedNode('http://purl.org/dc/terms/modified'),
        literal(previousModified, namedNode('http://www.w3.org/2001/XMLSchema#dateTime')),
        namedNode(graphIri)
      ),
    ]);

    serializeProvider = () =>
      `@prefix skos: <http://www.w3.org/2004/02/skos/core#> .\n<${subjectIri}> skos:prefLabel "Updated Org" .`;
    await initOrganisationManagerView({ container, store, shapes });

    const resourceButton = await waitForElement<HTMLButtonElement>(
      container,
      '.resource-list__button'
    );
    resourceButton.click();

    await flushMicrotasks();

    const saveButton = await waitForElement<HTMLButtonElement>(
      container,
      '.modal__button:not(.modal__button--secondary):not(.modal__button--danger)'
    );
    expect(saveButton.textContent ?? '').toContain('Save');
    saveButton.click();

    await waitForModalToDisappear(container);

    const stored = await store.getQuads({ graph: namedNode(graphIri) });
    const created = stored.filter(
      (entry) =>
        entry.subject.termType === 'NamedNode' &&
        entry.subject.value === subjectIri &&
        entry.predicate.termType === 'NamedNode' &&
        entry.predicate.value === 'http://purl.org/dc/terms/created'
    );
    expect(created).toHaveLength(1);
    expect(created[0]?.object.value).toBe('2024-01-01T00:00:00Z');

    const modified = stored.filter(
      (entry) =>
        entry.subject.termType === 'NamedNode' &&
        entry.subject.value === subjectIri &&
        entry.predicate.termType === 'NamedNode' &&
        entry.predicate.value === 'http://purl.org/dc/terms/modified'
    );
    expect(modified).toHaveLength(1);
    const modifiedValue = modified[0]?.object.value ?? '';
    expect(modifiedValue).not.toBe(previousModified);
    expect(Date.parse(modifiedValue)).not.toBeNaN();

    const labels = stored.filter(
      (entry) =>
        entry.subject.termType === 'NamedNode' &&
        entry.subject.value === subjectIri &&
        entry.predicate.termType === 'NamedNode' &&
        entry.predicate.value === 'http://www.w3.org/2004/02/skos/core#prefLabel'
    );
    expect(labels.some((entry) => entry.object.value === 'Updated Org')).toBe(true);
  });

  it('closes the modal without persisting data when cancelled', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    await initOrganisationManagerView({ container, store, shapes });

    const createButton = container.querySelector('.resource-list__create');
    expect(createButton).not.toBeNull();
    createButton?.dispatchEvent(new Event('click'));

    await flushMicrotasks();

    const cancelButton = container.querySelector('.modal__button--secondary');
    expect(cancelButton).not.toBeNull();
    cancelButton?.dispatchEvent(new Event('click'));

    await waitForModalToDisappear(container);

    expect(container.querySelector('.modal')).toBeNull();
    const allQuads = await store.getQuads({});
    expect(allQuads.length).toBe(0);
  });

  it('warns about inbound references before deleting a resource and honours cancellation', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    const subjectIri = 'https://data.europa.eu/949/local/organization/77';
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
        literal('Referenced Org'),
        namedNode(graphIri)
      ),
      quad(
        namedNode('https://data.europa.eu/949/local/unit/123'),
        namedNode('http://data.europa.eu/949/role'),
        namedNode(subjectIri),
        namedNode('https://data.europa.eu/949/local/unit/123#graph')
      ),
    ]);

    const collectSpy = vi
      .spyOn(resourceStoreUtils, 'collectIncomingReferenceSubjects')
      .mockResolvedValue(['https://data.europa.eu/949/local/unit/123']);

    await initOrganisationManagerView({ container, store, shapes });

    const resourceButton = container.querySelector<HTMLButtonElement>('.resource-list__button');
    expect(resourceButton).not.toBeNull();
    resourceButton?.dispatchEvent(new Event('click'));

    await flushMicrotasks();

    const deleteButton = await waitForElement<HTMLButtonElement>(
      container,
      '.modal__button--danger'
    );

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    deleteButton.click();

    await flushMicrotasks();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(collectSpy).toHaveBeenCalledTimes(1);
    expect(collectSpy).toHaveBeenCalledWith(store, subjectIri);
    const message = confirmSpy.mock.calls[0]?.[0];
    expect(typeof message).toBe('string');
    expect((message as string) ?? '').toContain('• https://data.europa.eu/949/local/unit/123');
    expect(deleteButton.disabled).toBe(false);

    const remaining = await store.getQuads({ graph: namedNode(graphIri) });
    expect(remaining.length).toBeGreaterThan(0);

    confirmSpy.mockRestore();
    collectSpy.mockRestore();
  });

  it('removes the resource when the user confirms the deletion warning', async () => {
    const quads = parser.parse(SHAPE_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPE_TTL, quads, dataset };

    const subjectIri = 'https://data.europa.eu/949/local/organization/88';
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
        literal('Disposable Org'),
        namedNode(graphIri)
      ),
      quad(
        namedNode('https://data.europa.eu/949/local/unit/200'),
        namedNode('http://data.europa.eu/949/role'),
        namedNode(subjectIri),
        namedNode('https://data.europa.eu/949/local/unit/200#graph')
      ),
    ]);

    const collectSpy = vi
      .spyOn(resourceStoreUtils, 'collectIncomingReferenceSubjects')
      .mockResolvedValue(['https://data.europa.eu/949/local/unit/200']);

    await initOrganisationManagerView({ container, store, shapes });

    const resourceButton = container.querySelector<HTMLButtonElement>('.resource-list__button');
    expect(resourceButton).not.toBeNull();
    resourceButton?.dispatchEvent(new Event('click'));

    await flushMicrotasks();

    const deleteButton = await waitForElement<HTMLButtonElement>(
      container,
      '.modal__button--danger'
    );

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    deleteButton.click();

    await flushMicrotasks();
    await waitForModalToDisappear(container);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(collectSpy).toHaveBeenCalledTimes(1);
    expect(collectSpy).toHaveBeenCalledWith(store, subjectIri);
    const remaining = await store.getQuads({ graph: namedNode(graphIri) });
    expect(remaining.length).toBeGreaterThan(0);
    expect(
      remaining.some(
        (quad) =>
          quad.subject.value === `${subjectIri}#validity` &&
          quad.predicate.value === 'http://www.w3.org/2006/time#hasEnd'
      )
    ).toBe(true);
    const endLiteral = remaining.find(
      (quad) =>
        quad.subject.value === `${subjectIri}#validity-end` &&
        quad.predicate.value === 'http://www.w3.org/2006/time#inXSDDateTime'
    );
    expect(endLiteral?.object.termType).toBe('Literal');
    expect(Date.parse(endLiteral?.object.value ?? '')).not.toBeNaN();

    expect(container.querySelector('.modal')).toBeNull();
    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('.resource-list__button')
    );
    const disposableButton = buttons.find((button) =>
      button.textContent?.includes('Disposable Org')
    );
    expect(disposableButton).toBeDefined();
    expect(disposableButton?.style.textDecoration).toBe('line-through');

    confirmSpy.mockRestore();
    collectSpy.mockRestore();
  });
});
