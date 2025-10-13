import { Writer } from 'n3';
import type { Quad } from '@rdfjs/types';
import { DEFAULT_PREFIXES } from './ontologies';

export type RdfSerializationFormat = 'text/turtle' | 'application/n-triples';

export function serializeQuads(quads: Quad[], format: RdfSerializationFormat): Promise<string> {
  const writer = new Writer(
    format === 'text/turtle'
      ? {
          format: 'Turtle',
          prefixes: DEFAULT_PREFIXES,
        }
      : {
          format: 'N-Triples',
        }
  );
  writer.addQuads(quads);
  return new Promise((resolve, reject) => {
    writer.end((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result ?? '');
      }
    });
  });
}

export function quadsToTurtle(quads: Quad[]): Promise<string> {
  return serializeQuads(quads, 'text/turtle');
}
