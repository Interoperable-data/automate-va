import rdfDataFactory from '@rdfjs/data-model';
import type { Literal, NamedNode, Quad } from '@rdfjs/types';
import type { GraphStore, GraphStoreChange } from '../data/graph-store';
import type { ShaclFormElement } from '../../types/shacl-form';
import { serializeQuads } from './rdf-utils';

const RDF_TYPE_IRI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const SKOS_PREF_LABEL_IRI = 'http://www.w3.org/2004/02/skos/core#prefLabel';
const RDFS_LABEL_IRI = 'http://www.w3.org/2000/01/rdf-schema#label';

const RDF_TYPE = rdfDataFactory.namedNode(RDF_TYPE_IRI);
const SKOS_PREF_LABEL = rdfDataFactory.namedNode(SKOS_PREF_LABEL_IRI);
const RDFS_LABEL = rdfDataFactory.namedNode(RDFS_LABEL_IRI);
const LABEL_PREDICATES = [SKOS_PREF_LABEL, RDFS_LABEL] as const;

export function attachClassInstanceProvider(form: ShaclFormElement, store: GraphStore): () => void {
  if (typeof form.setClassInstanceProvider !== 'function') {
    return () => {
      // noop when shacl-form does not expose the helper (e.g. older versions)
    };
  }

  const cache = new Map<string, string>();
  const inFlight = new Map<string, Promise<string>>();

  const buildInstances = async (classIri: string): Promise<string> => {
    const classNode = rdfDataFactory.namedNode(classIri);
    const typeQuads = await store.getQuads({ predicate: RDF_TYPE, object: classNode });
    const subjects = new Map<string, NamedNode>();

    for (const quad of typeQuads) {
      if (quad.subject.termType === 'NamedNode') {
        subjects.set(quad.subject.value, quad.subject);
      }
    }

    if (subjects.size === 0) {
      return '';
    }

    const output: Quad[] = [];
    for (const subject of subjects.values()) {
      output.push(rdfDataFactory.quad(subject, RDF_TYPE, classNode));
      const labelQuad = await findLabelQuad(store, subject);
      if (labelQuad) {
        output.push(labelQuad);
      }
    }

    const serialized = await serializeQuads(output, 'application/trig');
    console.debug('[shacl-class-provider] instances for class', classIri, serialized.trim());
    return serialized.trim();
  };

  const getInstances = async (classIri: string): Promise<string> => {
    if (cache.has(classIri)) {
      return cache.get(classIri) ?? '';
    }
    if (inFlight.has(classIri)) {
      return inFlight.get(classIri) ?? '';
    }

    const promise = buildInstances(classIri)
      .then((trig) => {
        cache.set(classIri, trig);
        inFlight.delete(classIri);
        return trig;
      })
      .catch((error) => {
        console.warn('[shacl-class-provider] Failed to gather instances', error);
        inFlight.delete(classIri);
        return '';
      });

    inFlight.set(classIri, promise);
    return promise;
  };

  form.setClassInstanceProvider(async (clazz) => getInstances(clazz));

  const unsubscribe = store.subscribe((change: GraphStoreChange) => {
    if (change.type === 'clear') {
      cache.clear();
      return;
    }

    if (!('quads' in change)) {
      return;
    }

    const affected = new Set<string>();
    for (const quad of change.quads) {
      if (
        quad.predicate.termType === 'NamedNode' &&
        quad.predicate.value === RDF_TYPE_IRI &&
        quad.object.termType === 'NamedNode'
      ) {
        affected.add(quad.object.value);
      }
    }

    if (affected.size === 0) {
      return;
    }

    for (const classIri of affected) {
      cache.delete(classIri);
    }
  });

  return () => {
    cache.clear();
    inFlight.clear();
    unsubscribe();
  };
}

async function findLabelQuad(store: GraphStore, subject: NamedNode): Promise<Quad | null> {
  for (const predicate of LABEL_PREDICATES) {
    const quads = await store.getQuads({ subject, predicate });
    const literalQuad = quads.find((quad) => quad.object.termType === 'Literal');
    if (literalQuad) {
      const literal = literalQuad.object as Literal;
      const value = literal.value;
      const language = literal.language;
      const newLiteral = language
        ? rdfDataFactory.literal(value, language)
        : rdfDataFactory.literal(value, literal.datatype);
      return rdfDataFactory.quad(subject, predicate, newLiteral);
    }
  }
  return null;
}
