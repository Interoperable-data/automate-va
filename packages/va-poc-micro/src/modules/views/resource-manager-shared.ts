import { Parser } from 'n3';
import rdfDataFactory from '@rdfjs/data-model';
import type { Quad, NamedNode } from '@rdfjs/types';
import type { GraphStore } from '../data/graph-store';
import type { ShapeDescriptor } from '../data/shape-descriptors';
import { quadsToTurtle } from './rdf-utils';
import {
  ensureGraph,
  ensureTypeQuad,
  resolveLabel,
  getGraphId,
  ensureCreationMetadata,
  ensureModificationMetadata,
  ensureValidityMetadata,
  readValidityWindow,
  isExpired,
  markResourceExpiration,
  collectIncomingReferenceSubjects,
} from './resource-store-utils';
import { RDF_NODES, DCTERMS } from './ontologies';

const RDF_TYPE = RDF_NODES.type;

export interface ResourceRecord {
  descriptor: ShapeDescriptor;
  subject: string;
  graph: string;
  label: string;
  expired: boolean;
}

export type ResourceIdentifiers = Pick<ResourceRecord, 'subject' | 'graph'>;

/**
 * Collects all resources for the supplied shape descriptors, returning basic
 * metadata so view components can render selection lists.
 */
export async function fetchResources(
  store: GraphStore,
  descriptors: ShapeDescriptor[]
): Promise<ResourceRecord[]> {
  const results: ResourceRecord[] = [];

  for (const descriptor of descriptors) {
    const quads = await store.getQuads({ predicate: RDF_TYPE, object: descriptor.targetClass });
    for (const quad of quads) {
      if (quad.subject.termType !== 'NamedNode') {
        continue;
      }
      const graph = getGraphId(quad.graph);
      const label = await resolveLabel(store, quad.subject, graph ?? undefined);
      const graphNode = rdfDataFactory.namedNode(graph ?? `${quad.subject.value}#graph`);
      const resourceQuads = await store.getQuads({ graph: graphNode });
      const validity = readValidityWindow(resourceQuads, quad.subject);
      const expired = isExpired(validity);
      results.push({
        descriptor,
        subject: quad.subject.value,
        graph: graph ?? `${quad.subject.value}#graph`,
        label,
        expired,
      });
    }
  }

  results.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  return results;
}

export async function readResourceAsTurtle(
  store: GraphStore,
  record: ResourceRecord
): Promise<string> {
  const graphNode = rdfDataFactory.namedNode(record.graph);
  const quads = await store.getQuads({ graph: graphNode });
  if (quads.length === 0) {
    return '';
  }
  return quadsToTurtle(quads);
}

export async function persistForm(
  store: GraphStore,
  options: { turtle: string; subject: string; graph: string; targetClass: NamedNode }
): Promise<void> {
  const graphNode = rdfDataFactory.namedNode(options.graph);
  const subjectNode = rdfDataFactory.namedNode(options.subject);

  const parser = new Parser({ format: 'application/trig' });
  const parsed = parser.parse(options.turtle) as Quad[];
  const normalized = parsed.map((quad) => ensureGraph(quad, graphNode));
  ensureTypeQuad(normalized, subjectNode, options.targetClass, graphNode);

  const existing = await store.getQuads({ graph: graphNode });
  const isNewResource = existing.length === 0;
  const timestamp = new Date().toISOString();
  const createdAt = isNewResource ? timestamp : undefined;

  ensureCreationMetadata({
    quads: normalized,
    graph: graphNode,
    existingQuads: existing,
    timestamp: createdAt,
  });

  if (!isNewResource) {
    ensureModificationMetadata({
      quads: normalized,
      subject: subjectNode,
      graph: graphNode,
      timestamp,
    });
  }

  const { validity, beginning, end } = ensureValidityMetadata({
    quads: normalized,
    subject: subjectNode,
    graph: graphNode,
    existingQuads: existing,
  });

  if (existing.length > 0) {
    const removableSubjects = new Set([
      subjectNode.value,
      validity.value,
      beginning.value,
      end.value,
    ]);
    const staleQuads = existing.filter((quad) => {
      if (quad.subject.termType !== 'NamedNode') {
        return false;
      }
      if (!removableSubjects.has(quad.subject.value)) {
        return false;
      }
      if (quad.subject.value === subjectNode.value) {
        if (quad.predicate.termType === 'NamedNode' && quad.predicate.value === DCTERMS.created) {
          return false;
        }
      }
      return true;
    });
    if (staleQuads.length > 0) {
      await store.deleteQuads(staleQuads);
    }
  }

  await store.putQuads(normalized);
}

export async function removeResource(store: GraphStore, record: ResourceRecord): Promise<void> {
  await markResourceExpiration(store, record.subject, record.graph);
}

export async function listIncomingReferenceSubjects(
  store: GraphStore,
  subject: string
): Promise<string[]> {
  return collectIncomingReferenceSubjects(store, subject);
}

export function createIdentifiers(descriptor: ShapeDescriptor): ResourceIdentifiers {
  const id = crypto.randomUUID();
  const subject = `${ensureTrailingSlash(descriptor.valuesNamespace)}${id}`;
  const graph = `${subject}#graph`;
  return { subject, graph };
}

export function ensureTrailingSlash(input: string): string {
  return input.endsWith('/') ? input : `${input}/`;
}
