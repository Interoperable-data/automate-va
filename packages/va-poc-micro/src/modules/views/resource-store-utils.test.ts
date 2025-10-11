import { describe, expect, it, vi } from 'vitest';
import { literal, namedNode, quad, blankNode } from '@rdfjs/data-model';
import {
  RDF_TYPE,
  RDF_TYPE_IRI,
  ensureGraph,
  ensureTypeQuad,
  resolveLabel,
  matchLiteral,
  quadsToGraphId,
  getGraphId,
  extractMessage,
  collectIncomingReferenceSubjects,
} from './resource-store-utils.js';
import type { GraphStore } from '../data/graph-store.js';

function createStore({
  quads = [] as ReturnType<typeof quad>[],
  byPredicate = new Map<string, ReturnType<typeof quad>[]>(),
} = {}): GraphStore {
  const getQuads = vi.fn(async (pattern: Record<string, unknown>) => {
    if (pattern.object) {
      const target = pattern.object as { value?: string };
      return quads.filter(
        (entry) => entry.object.termType === 'NamedNode' && entry.object.value === target.value
      );
    }
    if (pattern.predicate) {
      const predicate = pattern.predicate as { value?: string };
      return byPredicate.get(predicate.value ?? '') ?? [];
    }
    return quads;
  });

  return {
    getQuads,
  } as unknown as GraphStore;
}

describe('resource-store-utils', () => {
  it('keeps quads in the same graph when already aligned', () => {
    const subject = namedNode('http://example.org/subject');
    const predicate = namedNode('http://example.org/predicate');
    const object = literal('test');
    const graph = namedNode('http://example.org/graph');
    const original = quad(subject, predicate, object, graph);

    const result = ensureGraph(original, graph);
    expect(result).toBe(original);
  });

  it('relocates quads into the provided graph when missing', () => {
    const subject = namedNode('http://example.org/subject');
    const predicate = namedNode('http://example.org/predicate');
    const object = literal('test');
    const graph = namedNode('http://example.org/graph');
    const original = quad(subject, predicate, object, namedNode('http://example.org/original'));

    const result = ensureGraph(original, graph);
    expect(result.graph.equals(graph)).toBe(true);
    expect(result).not.toBe(original);
  });

  it('injects a rdf:type triple when ensureTypeQuad runs on a set missing it', () => {
    const subject = namedNode('http://example.org/resource');
    const type = namedNode('http://example.org/Type');
    const graph = namedNode('http://example.org/graph');
    const quads: ReturnType<typeof quad>[] = [];

    ensureTypeQuad(quads, subject, type, graph);

    expect(quads).toHaveLength(1);
    const [typeQuad] = quads;
    expect(typeQuad.subject.equals(subject)).toBe(true);
    expect(typeQuad.predicate.equals(RDF_TYPE)).toBe(true);
    expect(typeQuad.object.equals(type)).toBe(true);
    expect(typeQuad.graph.equals(graph)).toBe(true);
  });

  it('does not duplicate rdf:type triples when already present', () => {
    const subject = namedNode('http://example.org/resource');
    const type = namedNode('http://example.org/Type');
    const graph = namedNode('http://example.org/graph');
    const existing = quad(subject, RDF_TYPE, type, graph);
    const quads = [existing];

    ensureTypeQuad(quads, subject, type, graph);

    expect(quads).toHaveLength(1);
    expect(quads[0]).toBe(existing);
  });

  it('resolves labels preferring skos:prefLabel over rdfs:label', async () => {
    const subject = namedNode('http://example.org/subject');
    const prefPredicate = namedNode('http://www.w3.org/2004/02/skos/core#prefLabel');
    const rdfsPredicate = namedNode('http://www.w3.org/2000/01/rdf-schema#label');
    const graph = namedNode('http://example.org/graph');
    const prefQuad = quad(subject, prefPredicate, literal('Preferred'), graph);
    const rdfsQuad = quad(subject, rdfsPredicate, literal('Fallback'), graph);
    const store = createStore({
      byPredicate: new Map([
        [prefPredicate.value, [prefQuad]],
        [rdfsPredicate.value, [rdfsQuad]],
      ]),
    });

    const result = await resolveLabel(store, subject, graph.value);
    expect(result).toBe('Preferred');
  });

  it('falls back to rdfs:label when no prefLabel is available', async () => {
    const subject = namedNode('http://example.org/subject');
    const rdfsPredicate = namedNode('http://www.w3.org/2000/01/rdf-schema#label');
    const graph = namedNode('http://example.org/graph');
    const rdfsQuad = quad(subject, rdfsPredicate, literal('Fallback'), graph);
    const store = createStore({
      byPredicate: new Map([[rdfsPredicate.value, [rdfsQuad]]]),
    });

    const result = await resolveLabel(store, subject, graph.value);
    expect(result).toBe('Fallback');
  });

  it('returns the subject IRI when no labels exist', async () => {
    const subject = namedNode('http://example.org/subject');
    const store = createStore();

    const result = await resolveLabel(store, subject);
    expect(result).toBe(subject.value);
  });

  it('extracts literal values through matchLiteral', async () => {
    const subject = namedNode('http://example.org/subject');
    const predicate = namedNode('http://example.org/property');
    const graph = namedNode('http://example.org/graph');
    const literalQuad = quad(subject, predicate, literal('Value'), graph);
    const store = createStore({ byPredicate: new Map([[predicate.value, [literalQuad]]]) });

    const result = await matchLiteral(store, subject, predicate, graph);
    expect(result).toBe('Value');
  });

  it('converts graph terms into identifiers', () => {
    const graph = namedNode('http://example.org/graph');
    expect(quadsToGraphId(graph)).toBe(graph.value);
    expect(getGraphId(graph)).toBe(graph.value);
  });

  it('serialises errors into readable messages', () => {
    const error = new Error('Boom');
    expect(extractMessage(error)).toBe('Boom');
    expect(extractMessage('text')).toBe('text');
  });

  it('collects referencing subjects and sorts them case-insensitively', async () => {
    const target = 'http://example.org/target';
    const store = createStore({
      quads: [
        quad(
          namedNode('http://example.org/C'),
          namedNode('http://example.org/p'),
          namedNode(target),
          namedNode('http://example.org/graph')
        ),
        quad(
          namedNode('http://example.org/a'),
          namedNode('http://example.org/p'),
          namedNode(target),
          namedNode('http://example.org/graph')
        ),
        quad(
          namedNode('http://example.org/B'),
          namedNode('http://example.org/p'),
          namedNode(target),
          namedNode('http://example.org/graph')
        ),
        quad(
          namedNode('http://example.org/a'),
          namedNode('http://example.org/p'),
          namedNode(target),
          namedNode('http://example.org/graph')
        ),
      ],
    });

    const subjects = await collectIncomingReferenceSubjects(store, target);
    expect(subjects).toEqual([
      'http://example.org/a',
      'http://example.org/B',
      'http://example.org/C',
    ]);
  });

  it('filters non-named-node subjects when collecting references', async () => {
    const target = 'http://example.org/target';
    const store = createStore({
      quads: [
        quad(
          namedNode('http://example.org/good'),
          namedNode('http://example.org/p'),
          namedNode(target),
          namedNode('http://example.org/graph')
        ),
        quad(
          namedNode('http://example.org/alsoGood'),
          namedNode('http://example.org/p'),
          namedNode(target),
          namedNode('http://example.org/graph')
        ),
        quad(
          blankNode('ignored'),
          namedNode('http://example.org/p'),
          namedNode(target),
          namedNode('http://example.org/graph')
        ),
      ],
    });

    const subjects = await collectIncomingReferenceSubjects(store, target);
    expect(subjects).toEqual(['http://example.org/alsoGood', 'http://example.org/good']);
  });

  it('reuses getQuads lookups when matchLiteral is invoked without a graph', async () => {
    const subject = namedNode('http://example.org/subject');
    const predicate = namedNode('http://example.org/property');
    const literalQuad = quad(
      subject,
      predicate,
      literal('Value'),
      namedNode('http://example.org/graph')
    );
    const store = createStore({ byPredicate: new Map([[predicate.value, [literalQuad]]]) });

    const result = await matchLiteral(store, subject, predicate);
    expect(result).toBe('Value');
  });

  it('recognises existing rdf:type triples using the exported constant', () => {
    const subject = namedNode('http://example.org/resource');
    const type = namedNode('http://example.org/Type');
    const graph = namedNode('http://example.org/graph');
    const existing = quad(subject, namedNode(RDF_TYPE_IRI), type, graph);

    const quads = [existing];
    ensureTypeQuad(quads, subject, type, graph);

    expect(quads).toHaveLength(1);
    expect(quads[0]).toBe(existing);
  });
});
