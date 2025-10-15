import { describe, expect, it } from 'vitest';
import datasetFactory from '@rdfjs/dataset';
import { literal, namedNode, quad } from '@rdfjs/data-model';
import { serializeQuads, isClassOrSubclassOf } from './rdf-utils.js';

const SUBJECT = namedNode('https://example.org/resource/1');
const PREDICATE = namedNode('http://www.w3.org/2004/02/skos/core#prefLabel');
const OBJECT = literal('Example organisation', 'en');
const GRAPH = namedNode('https://example.org/graph');

const SAMPLE_QUAD = quad(SUBJECT, PREDICATE, OBJECT, GRAPH);

describe('serializeQuads', () => {
  it('emits TriG with project prefixes', async () => {
    const trig = await serializeQuads([SAMPLE_QUAD], 'application/trig');
    expect(trig).toContain('@prefix skos');
    expect(trig).toContain('Example organisation');
    expect(trig).toContain('<https://example.org/resource/1>');
    expect(trig).toContain('<https://example.org/graph> {');
  });

  it('emits N-Triples output when requested', async () => {
    const ntriples = await serializeQuads([SAMPLE_QUAD], 'text/plain');
    expect(ntriples).toContain('<https://example.org/resource/1>');
    expect(ntriples).toContain('<http://www.w3.org/2004/02/skos/core#prefLabel>');
    expect(ntriples.trim().endsWith('.')).toBe(true);
  });
});

describe('isClassOrSubclassOf', () => {
  const PARENT = namedNode('http://example.org/Parent');
  const CHILD = namedNode('http://example.org/Child');
  const GRANDCHILD = namedNode('http://example.org/Grandchild');
  const RDFS_SUBCLASS_OF = namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf');
  const GRAPH = namedNode('http://example.org/graph');

  it('returns true for the same class', () => {
    const dataset = datasetFactory.dataset();
    expect(isClassOrSubclassOf(PARENT, PARENT, dataset)).toBe(true);
  });

  it('detects subclass relationships transitively', () => {
    const dataset = datasetFactory.dataset([
      quad(CHILD, RDFS_SUBCLASS_OF, PARENT, GRAPH),
      quad(GRANDCHILD, RDFS_SUBCLASS_OF, CHILD, GRAPH),
    ]);

    expect(isClassOrSubclassOf(CHILD, PARENT, dataset)).toBe(true);
    expect(isClassOrSubclassOf(GRANDCHILD, PARENT, dataset)).toBe(true);
    expect(isClassOrSubclassOf(PARENT, CHILD, dataset)).toBe(false);
  });

  it('guards against subclass cycles', () => {
    const dataset = datasetFactory.dataset([
      quad(CHILD, RDFS_SUBCLASS_OF, GRANDCHILD, GRAPH),
      quad(GRANDCHILD, RDFS_SUBCLASS_OF, CHILD, GRAPH),
    ]);

    expect(isClassOrSubclassOf(CHILD, PARENT, dataset)).toBe(false);
  });
});
