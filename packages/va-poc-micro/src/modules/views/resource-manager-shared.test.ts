import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Parser } from 'n3';
import datasetFactory from '@rdfjs/dataset';
import { literal, namedNode, quad } from '@rdfjs/data-model';
import { MemoryLevel } from 'memory-level';
import { GraphStore } from '../data/graph-store.js';
import { discoverShapeDescriptors } from '../data/shape-descriptors.js';
import {
  fetchResources,
  readResourceAsTurtle,
  persistForm,
  removeResource,
  listIncomingReferenceSubjects,
  createIdentifiers,
  ensureTrailingSlash,
  type ResourceRecord,
} from './resource-manager-shared.js';

const SHAPES_TTL = `
  @prefix sh: <http://www.w3.org/ns/shacl#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix org: <http://www.w3.org/ns/org#> .
  @prefix dash: <http://datashapes.org/dash#> .

  <http://example.org/OrganisationShape>
    a sh:NodeShape ;
    rdfs:label "Organisation" ;
    rdfs:comment "Manage organisations" ;
    sh:targetClass org:Organization ;
    dash:stem <https://data.example.test/org/> .

  <http://example.org/SiteShape>
    a sh:NodeShape ;
    rdfs:label "Site" ;
    rdfs:comment "Manage organisation sites" ;
    sh:targetClass org:Site ;
    dash:stem <https://data.example.test/site/> .
`;

const RDF_TYPE = namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
const SKOS_PREF_LABEL = namedNode('http://www.w3.org/2004/02/skos/core#prefLabel');
const DCTERMS_VALID = namedNode('http://purl.org/dc/terms/valid');
const TIME_END = namedNode('http://www.w3.org/2006/time#inXSDDateTime');

describe('resource-manager-shared helpers', () => {
  const parser = new Parser({ format: 'text/turtle' });
  let store: GraphStore;

  beforeEach(async () => {
    const backend = new MemoryLevel({ storeEncoding: 'view' });
    store = await GraphStore.create({ backend });
  });

  afterEach(async () => {
    await store.clear();
    await store.close();
    vi.restoreAllMocks();
  });

  function loadDescriptors() {
    const quads = parser.parse(SHAPES_TTL);
    const dataset = datasetFactory.dataset(quads);
    const descriptors = discoverShapeDescriptors(dataset);
    const organisation = descriptors.find((descriptor) => descriptor.label === 'Organisation');
    const site = descriptors.find((descriptor) => descriptor.label === 'Site');
    if (!organisation || !site) {
      throw new Error('Expected organisation and site descriptors');
    }
    return { organisation, site } as const;
  }

  it('fetchResources returns sorted records with descriptor metadata', async () => {
    const { organisation } = loadDescriptors();
    const graphOne = namedNode('https://data.example.test/org/a#graph');
    const subjectOne = namedNode('https://data.example.test/org/a');
    const graphTwo = namedNode('https://data.example.test/org/b#graph');
    const subjectTwo = namedNode('https://data.example.test/org/b');

    await store.putQuads([
      quad(subjectOne, RDF_TYPE, organisation.targetClass, graphOne),
      quad(subjectOne, SKOS_PREF_LABEL, literal('Beta Org'), graphOne),
      quad(subjectTwo, RDF_TYPE, organisation.targetClass, graphTwo),
      quad(subjectTwo, SKOS_PREF_LABEL, literal('Alpha Org'), graphTwo),
    ]);

    const records = await fetchResources(store, [organisation]);

    expect(records).toHaveLength(2);
    expect(records[0]?.label).toBe('Alpha Org');
    expect(records[1]?.label).toBe('Beta Org');
    expect(records.every((record) => record.descriptor.shape.equals(organisation.shape))).toBe(
      true
    );
  });

  it('readResourceAsTurtle serialises resource quads into turtle text', async () => {
    const { organisation } = loadDescriptors();
    const subject = namedNode('https://data.example.test/org/c');
    const graph = namedNode(`${subject.value}#graph`);

    await store.putQuads([
      quad(subject, RDF_TYPE, organisation.targetClass, graph),
      quad(subject, SKOS_PREF_LABEL, literal('Gamma Org'), graph),
    ]);

    const [record] = await fetchResources(store, [organisation]);
    expect(record).toBeDefined();

    const turtle = await readResourceAsTurtle(store, record as ResourceRecord);
    expect(turtle).toContain('<https://data.example.test/org/c>');
    expect(turtle).toContain('Gamma Org');
  });

  it('persistForm stores submitted data and enforces rdf:type and creation metadata', async () => {
    const { organisation } = loadDescriptors();
    const identifiers = createIdentifiers(organisation);
    const turtle = `@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
<${identifiers.subject}> skos:prefLabel "Delta Org" .`;

    await persistForm(store, {
      turtle,
      subject: identifiers.subject,
      graph: identifiers.graph,
      targetClass: organisation.targetClass,
    });

    const stored = await store.getQuads({ graph: namedNode(identifiers.graph) });
    const typeQuad = stored.find((entry) => entry.predicate.equals(RDF_TYPE));
    expect(typeQuad?.object.value).toBe(organisation.targetClass.value);

    const createdQuad = stored.find(
      (entry) => entry.predicate.value === 'http://purl.org/dc/terms/created'
    );
    expect(createdQuad).toBeDefined();
  });

  it('removeResource marks the resource validity interval as ended', async () => {
    const { organisation } = loadDescriptors();
    const subject = namedNode('https://data.example.test/org/remove');
    const graph = namedNode(`${subject.value}#graph`);

    await store.putQuads([quad(subject, RDF_TYPE, organisation.targetClass, graph)]);

    const [record] = await fetchResources(store, [organisation]);
    expect(record).toBeDefined();

    const timestamp = '2025-01-01T12:00:00.000Z';
    vi.useFakeTimers();
    vi.setSystemTime(new Date(timestamp));

    await removeResource(store, record as ResourceRecord);

    vi.useRealTimers();

    const updated = await store.getQuads({ graph });
    const validityQuad = updated.find((entry) => entry.predicate.equals(DCTERMS_VALID));
    expect(validityQuad).toBeDefined();
    const endLiteral = updated.find((entry) => entry.predicate.equals(TIME_END))?.object;
    expect(endLiteral?.termType).toBe('Literal');
    expect(endLiteral?.value).toBe(timestamp);
  });

  it('listIncomingReferenceSubjects returns sorted referring IRIs', async () => {
    const target = namedNode('https://data.example.test/org/target');
    const graph = namedNode('https://data.example.test/misc#graph');
    const predicate = namedNode('http://example.org/relatesTo');

    await store.putQuads([
      quad(namedNode('https://data.example.test/org/ref-b'), predicate, target, graph),
      quad(namedNode('https://data.example.test/org/ref-a'), predicate, target, graph),
    ]);

    const references = await listIncomingReferenceSubjects(store, target.value);
    expect(references).toEqual([
      'https://data.example.test/org/ref-a',
      'https://data.example.test/org/ref-b',
    ]);
  });

  it('createIdentifiers respects descriptor namespace and ensureTrailingSlash appends slash', () => {
    const { organisation } = loadDescriptors();
    const uuidSpy = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('11111111-1111-1111-1111-111111111111');

    const identifiers = createIdentifiers(organisation);
    expect(identifiers.subject).toBe(
      `${ensureTrailingSlash(organisation.valuesNamespace)}11111111-1111-1111-1111-111111111111`
    );
    expect(identifiers.graph).toBe(
      `${ensureTrailingSlash(
        organisation.valuesNamespace
      )}11111111-1111-1111-1111-111111111111#graph`
    );

    uuidSpy.mockRestore();

    expect(ensureTrailingSlash('https://data.example.test/ns')).toBe(
      'https://data.example.test/ns/'
    );
  });
});
