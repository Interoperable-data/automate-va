import { Writer } from 'n3';
import type { Quad } from '@rdfjs/types';

export const DEFAULT_PREFIXES = {
  era: 'http://data.europa.eu/949/',
  org: 'https://www.w3.org/ns/org#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  locn: 'http://www.w3.org/ns/locn#',
  rorg: 'http://data.europa.eu/949/organisations/',
  uorg: 'http://data.europa.eu/949/organisations/units/',
  orgr: 'http://data.europa.eu/949/organisations/roles/',
  lorg: 'http://data.europa.eu/949/organisations/sites/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  time: 'http://www.w3.org/2006/time#',
  geo: 'http://www.opengis.net/ont/geosparql#',
  dcterms: 'http://purl.org/dc/terms/',
} as const;

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
