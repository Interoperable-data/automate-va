import rdfDataFactory from '@rdfjs/data-model';
import { Writer } from 'n3';
import type { DatasetCore, NamedNode, Quad } from '@rdfjs/types';
import { DEFAULT_PREFIXES, RDFS_NODES } from './ontologies';

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

export function isClassOrSubclassOf(
  target: NamedNode,
  parent: string | NamedNode,
  dataset: DatasetCore
): boolean {
  const parentNode = typeof parent === 'string' ? rdfDataFactory.namedNode(parent) : parent;

  if (target.value === parentNode.value) {
    return true;
  }

  const visited = new Set<string>();

  const hasSubclass = (candidate: NamedNode): boolean => {
    if (visited.has(candidate.value)) {
      return false;
    }
    visited.add(candidate.value);

    for (const quad of dataset.match(candidate, RDFS_NODES.subClassOf, undefined)) {
      if (quad.object.termType !== 'NamedNode') {
        continue;
      }
      if (quad.object.value === parentNode.value) {
        return true;
      }
      if (hasSubclass(quad.object)) {
        return true;
      }
    }
    return false;
  };

  return hasSubclass(target);
}
