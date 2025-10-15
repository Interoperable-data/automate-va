import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Parser } from 'n3';
import datasetFactory from '@rdfjs/dataset';
import { literal, namedNode, quad } from '@rdfjs/data-model';
import { MemoryLevel } from 'memory-level';
import { GraphStore } from '../data/graph-store.js';
import { initObjectOfAssessmentManagerView } from './object-of-assessment-manager.js';

type SerializeProvider = (element: HTMLElement) => string;

let serializeProvider: SerializeProvider | null = null;

const SHAPES_TTL = `
  @prefix sh: <http://www.w3.org/ns/shacl#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix era: <http://data.europa.eu/949/> .
  @prefix dash: <http://datashapes.org/dash#> .
  @prefix ooa: <http://data.europa.eu/949/objects-of-assessment/> .

  <http://example.org/shapes/Declaration>
    a sh:NodeShape ;
    rdfs:label "EC declaration"@en ;
    rdfs:comment "Capture EC declaration references"@en ;
    sh:targetClass era:ECDeclaration ;
    dash:stem ooa: .

  <http://example.org/shapes/Certificate>
    a sh:NodeShape ;
    rdfs:label "EC certificate"@en ;
    rdfs:comment "Capture EC certificates"@en ;
    sh:targetClass era:CLD ;
    dash:stem ooa: .

  <http://example.org/shapes/Evidence>
    a sh:NodeShape ;
    rdfs:label "Assessment evidence"@en ;
    rdfs:comment "Combine declarations and certificates"@en ;
    sh:targetClass era:CABEvidence ;
    dash:stem ooa: .
`;

class ShaclFormStub extends HTMLElement {
  serialize(): string {
    if (serializeProvider) {
      return serializeProvider(this);
    }
    const subject = this.getAttribute('data-values-subject');
    return `@prefix skos: <http://www.w3.org/2004/02/skos/core#> .\n<${subject}> skos:prefLabel "Example entry" .`;
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

describe('object-of-assessment-manager view', () => {
  let store: GraphStore;
  let container: HTMLElement;
  const parser = new Parser({ format: 'application/trig' });

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

  it('renders columns and create actions for each descriptor', async () => {
    const quads = parser.parse(SHAPES_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPES_TTL, quads, dataset };

    await initObjectOfAssessmentManagerView({ container, store, shapes });

    const createButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('.resource-list__create')
    );
    expect(createButtons).toHaveLength(3);
    expect(createButtons.map((button) => button.textContent)).toEqual(
      expect.arrayContaining([
        'Create ec-declaration',
        'Create ec-certificate',
        'Create assessment-evidence',
      ])
    );
  });

  it('persists submitted declarations into the quadstore using descriptor namespace', async () => {
    const quads = parser.parse(SHAPES_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPES_TTL, quads, dataset };

    const uuidSpy = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

    await initObjectOfAssessmentManagerView({ container, store, shapes });

    const createDeclaration = findButtonByText(container, 'Create ec-declaration');
    expect(createDeclaration).not.toBeNull();
    createDeclaration?.click();

    await flushMicrotasks();

    const form = container.querySelector('shacl-form') as ShaclFormStub | null;
    expect(form).not.toBeNull();

    const saveButton = findButtonByText(container, 'Create EC declaration');
    expect(saveButton).not.toBeNull();
    saveButton?.click();

    await waitForModalToDisappear(container);

    const expectedSubject =
      'http://data.europa.eu/949/objects-of-assessment/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const expectedGraph = `${expectedSubject}#graph`;

    const quadsInStore = await store.getQuads({ graph: namedNode(expectedGraph) });
    expect(quadsInStore.length).toBeGreaterThanOrEqual(2);
    expect(
      quadsInStore.some(
        (entry) =>
          entry.subject.termType === 'NamedNode' &&
          entry.subject.value === expectedSubject &&
          entry.predicate.termType === 'NamedNode' &&
          entry.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
          entry.object.termType === 'NamedNode' &&
          entry.object.value === 'http://data.europa.eu/949/ECDeclaration'
      )
    ).toBe(true);

    expect(uuidSpy).toHaveBeenCalled();
  });

  it('opens existing resources in an editor modal with loaded TriG data', async () => {
    const quads = parser.parse(SHAPES_TTL);
    const dataset = datasetFactory.dataset(quads);
    const shapes = { text: SHAPES_TTL, quads, dataset };

    const subject = namedNode(
      'http://data.europa.eu/949/objects-of-assessment/declarations/existing'
    );
    const graph = namedNode(`${subject.value}#graph`);

    await store.putQuads([
      quad(
        subject,
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://data.europa.eu/949/ECDeclaration'),
        graph
      ),
      quad(
        subject,
        namedNode('http://www.w3.org/2004/02/skos/core#prefLabel'),
        literal('Stored declaration'),
        graph
      ),
    ]);

    await initObjectOfAssessmentManagerView({ container, store, shapes });

    const selectButton = container.querySelector<HTMLButtonElement>('.resource-list__button');
    expect(selectButton).not.toBeNull();
    selectButton?.click();

    await flushMicrotasks();

    const status = container.querySelector<HTMLElement>('.modal__status');
    expect(status?.textContent ?? '').toContain(
      'Values are validated against the SHACL shapes defining the form.'
    );

    const form = container.querySelector('shacl-form');
    expect(form).not.toBeNull();
    expect(form!.getAttribute('data-values-subject')).toBe(subject.value);
  });
});

async function waitForModalToDisappear(root: HTMLElement): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (!root.querySelector('.modal')) {
      return;
    }
  }
  throw new Error('Modal did not close in time');
}
