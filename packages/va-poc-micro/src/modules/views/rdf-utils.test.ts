import { describe, expect, it } from 'vitest';
import { literal, namedNode, quad } from '@rdfjs/data-model';
import { serializeQuads } from './rdf-utils.js';

const SUBJECT = namedNode('https://example.org/resource/1');
const PREDICATE = namedNode('http://www.w3.org/2004/02/skos/core#prefLabel');
const OBJECT = literal('Example organisation', 'en');
const GRAPH = namedNode('https://example.org/graph');

const SAMPLE_QUAD = quad(SUBJECT, PREDICATE, OBJECT, GRAPH);

describe('serializeQuads', () => {
  it('emits Turtle with project prefixes', async () => {
    const turtle = await serializeQuads([SAMPLE_QUAD], 'text/turtle');
    expect(turtle).toContain('@prefix skos');
    expect(turtle).toContain('Example organisation');
    expect(turtle).toContain('<https://example.org/resource/1>');
  });

  it('emits N-Triples output when requested', async () => {
    const ntriples = await serializeQuads([SAMPLE_QUAD], 'application/n-triples');
    expect(ntriples).toContain('<https://example.org/resource/1>');
    expect(ntriples).toContain('<http://www.w3.org/2004/02/skos/core#prefLabel>');
    expect(ntriples.trim().endsWith('.')).toBe(true);
  });
});
