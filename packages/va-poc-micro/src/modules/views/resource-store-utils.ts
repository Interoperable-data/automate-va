import rdfDataFactory from '@rdfjs/data-model';
import type { NamedNode, Quad, Term } from '@rdfjs/types';
import type { GraphStore } from '../data/graph-store';
import {
  RDF,
  RDF_NODES,
  SKOS_NODES,
  RDFS_NODES,
  DCTERMS_NODES,
  TIME_NODES,
  XSD_NODES,
} from './ontologies';

const RDF_TYPE_IRI = RDF.type;
const RDF_TYPE = RDF_NODES.type;
const DCTERMS_VALID = DCTERMS_NODES.valid;
const DCTERMS_CREATED = DCTERMS_NODES.created;
const DCTERMS_MODIFIED = DCTERMS_NODES.modified;
const TIME_INTERVAL = TIME_NODES.Interval;
const TIME_INSTANT = TIME_NODES.Instant;
const TIME_HAS_BEGINNING = TIME_NODES.hasBeginning;
const TIME_HAS_END = TIME_NODES.hasEnd;
const TIME_IN_XSD_DATE_TIME = TIME_NODES.inXSDDateTime;
const XSD_DATE_TIME = XSD_NODES.dateTime;
const SKOS_PREF_LABEL = SKOS_NODES.prefLabel;
const RDFS_LABEL = RDFS_NODES.label;

export function ensureGraph(quad: Quad, graph: NamedNode): Quad {
  if (quad.graph.termType === 'NamedNode' && quad.graph.value === graph.value) {
    return quad;
  }
  return rdfDataFactory.quad(quad.subject, quad.predicate, quad.object, graph);
}

export function ensureTypeQuad(
  quads: Quad[],
  subject: NamedNode,
  type: NamedNode,
  graph: NamedNode
): void {
  const hasType = quads.some(
    (quad) =>
      quad.subject.termType === 'NamedNode' &&
      quad.subject.value === subject.value &&
      quad.predicate.termType === 'NamedNode' &&
      quad.predicate.value === RDF_TYPE_IRI
  );
  if (!hasType) {
    quads.push(rdfDataFactory.quad(subject, RDF_TYPE, type, graph));
  }
}

export async function resolveLabel(
  store: GraphStore,
  subject: NamedNode,
  graph?: string
): Promise<string> {
  const graphNode = graph ? rdfDataFactory.namedNode(graph) : undefined;

  const pref = await matchLiteral(store, subject, SKOS_PREF_LABEL, graphNode);
  if (pref) {
    return pref;
  }

  const fallback = await matchLiteral(store, subject, RDFS_LABEL, graphNode);
  if (fallback) {
    return fallback;
  }

  return subject.value;
}

export async function matchLiteral(
  store: GraphStore,
  subject: NamedNode,
  predicate: NamedNode,
  graph?: NamedNode
): Promise<string | null> {
  const pattern: { subject: NamedNode; predicate: NamedNode; graph?: NamedNode } = {
    subject,
    predicate,
  };
  if (graph) {
    pattern.graph = graph;
  }
  const quads = await store.getQuads(pattern);
  const literal = quads.find((quad) => quad.object.termType === 'Literal');
  return literal ? literal.object.value : null;
}

export function quadsToGraphId(graph: Term): string | null {
  if (graph.termType === 'NamedNode') {
    return graph.value;
  }
  return null;
}

export function getGraphId(graph: Term): string | null {
  return quadsToGraphId(graph);
}

export function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function collectIncomingReferenceSubjects(
  store: GraphStore,
  targetIri: string
): Promise<string[]> {
  const target = rdfDataFactory.namedNode(targetIri);
  const quads = await store.getQuads({ object: target });
  const subjects = new Set<string>();

  for (const quad of quads) {
    if (quad.subject.termType === 'NamedNode') {
      subjects.add(quad.subject.value);
    }
  }

  return Array.from(subjects).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
}

function validityNodesFor(subject: NamedNode) {
  const base = subject.value;
  return {
    validity: rdfDataFactory.namedNode(`${base}#validity`),
    beginning: rdfDataFactory.namedNode(`${base}#validity-beginning`),
    end: rdfDataFactory.namedNode(`${base}#validity-end`),
  } as const;
}

function quadSignature(quad: Quad): string {
  const objectValue =
    quad.object.termType === 'NamedNode'
      ? `N:${quad.object.value}`
      : quad.object.termType === 'Literal'
      ? `L:${quad.object.value}|${quad.object.datatype.value}|${quad.object.language}`
      : `B:${quad.object.value}`;
  return `${quad.subject.termType}:${quad.subject.value}|${quad.predicate.termType}:${quad.predicate.value}|${objectValue}|${quad.graph.termType}:${quad.graph.value}`;
}

function dedupeQuadsInPlace(quads: Quad[]): Quad[] {
  const map = new Map<string, Quad>();
  for (const quad of quads) {
    map.set(quadSignature(quad), quad);
  }
  return Array.from(map.values());
}

function findDateLiteral(quads: Quad[], subject: NamedNode): string | undefined {
  const match = quads.find(
    (quad) =>
      quad.subject.termType === 'NamedNode' &&
      quad.subject.value === subject.value &&
      quad.predicate.equals(TIME_IN_XSD_DATE_TIME) &&
      quad.object.termType === 'Literal'
  );
  return match?.object.value;
}

function pushQuad(target: Quad[], quad: Quad): void {
  target.push(quad);
}

export function literalForTimestamp(value: string) {
  return rdfDataFactory.literal(value, XSD_DATE_TIME);
}

export interface ValidityWindow {
  begins?: string;
  ends?: string;
}

const VALIDITY_SUFFIXES = ['#validity', '#validity-beginning', '#validity-end'] as const;

function shouldSkipCreationFor(subject: NamedNode): boolean {
  const value = subject.value;
  return VALIDITY_SUFFIXES.some((suffix) => value.endsWith(suffix));
}

export function ensureCreationMetadata(options: {
  quads: Quad[];
  graph: NamedNode;
  existingQuads?: Quad[];
  timestamp?: string;
}): void {
  const { quads, graph, existingQuads = [], timestamp } = options;

  const existingCreated = new Set(
    existingQuads
      .filter(
        (quad) =>
          quad.predicate.equals(DCTERMS_CREATED) &&
          quad.subject.termType === 'NamedNode' &&
          quad.graph.termType === 'NamedNode' &&
          quad.graph.equals(graph)
      )
      .map((quad) => quad.subject.value)
  );

  const currentCreated = new Set(
    quads
      .filter(
        (quad) =>
          quad.predicate.equals(DCTERMS_CREATED) &&
          quad.subject.termType === 'NamedNode' &&
          quad.graph.termType === 'NamedNode' &&
          quad.graph.equals(graph)
      )
      .map((quad) => quad.subject.value)
  );

  const subjects = new Set<string>();
  for (const quad of quads) {
    if (quad.graph.termType !== 'NamedNode' || !quad.graph.equals(graph)) {
      continue;
    }
    if (quad.subject.termType !== 'NamedNode') {
      continue;
    }
    if (shouldSkipCreationFor(quad.subject)) {
      continue;
    }
    subjects.add(quad.subject.value);
  }

  for (const subjectIri of subjects) {
    if (existingCreated.has(subjectIri) || currentCreated.has(subjectIri)) {
      continue;
    }

    const literal = literalForTimestamp(timestamp ?? new Date().toISOString());
    const subject = rdfDataFactory.namedNode(subjectIri);

    quads.push(rdfDataFactory.quad(subject, DCTERMS_CREATED, literal, graph));
    currentCreated.add(subjectIri);
  }
}

export function ensureModificationMetadata(options: {
  quads: Quad[];
  subject: NamedNode;
  graph: NamedNode;
  timestamp?: string;
}): void {
  const { quads, subject, graph, timestamp } = options;

  for (let index = quads.length - 1; index >= 0; index -= 1) {
    const candidate = quads[index];
    if (
      candidate.subject.termType === 'NamedNode' &&
      candidate.subject.value === subject.value &&
      candidate.predicate.equals(DCTERMS_MODIFIED) &&
      candidate.graph.termType === 'NamedNode' &&
      candidate.graph.equals(graph)
    ) {
      quads.splice(index, 1);
    }
  }

  const literal = literalForTimestamp(timestamp ?? new Date().toISOString());
  quads.push(rdfDataFactory.quad(subject, DCTERMS_MODIFIED, literal, graph));
}

export function ensureValidityMetadata(options: {
  quads: Quad[];
  subject: NamedNode;
  graph: NamedNode;
  existingQuads?: Quad[];
  createValidity?: boolean;
}): { validity: NamedNode; beginning: NamedNode; end: NamedNode; window: ValidityWindow } {
  const { quads, subject, graph, existingQuads = [], createValidity = false } = options;
  const { validity, beginning, end } = validityNodesFor(subject);

  const combined = [...existingQuads, ...quads];

  const existingBeginning = findDateLiteral(combined, beginning);
  const existingEnd = findDateLiteral(combined, end);
  const hasExistingValidity = combined.some(
    (quad) =>
      quad.subject.termType === 'NamedNode' &&
      quad.subject.value === subject.value &&
      quad.predicate.equals(DCTERMS_VALID)
  );

  const working = [...quads];

  if (hasExistingValidity || createValidity) {
    pushQuad(working, rdfDataFactory.quad(subject, DCTERMS_VALID, validity, graph));
    pushQuad(working, rdfDataFactory.quad(validity, RDF_TYPE, TIME_INTERVAL, graph));

    if (existingBeginning) {
      const preservedBeginningQuads = existingQuads.filter(
        (quad) =>
          (quad.subject.termType === 'NamedNode' &&
            quad.subject.value === validity.value &&
            quad.predicate.equals(TIME_HAS_BEGINNING)) ||
          (quad.subject.termType === 'NamedNode' && quad.subject.value === beginning.value)
      );
      for (const preserved of preservedBeginningQuads) {
        pushQuad(working, preserved);
      }
    }

    if (existingEnd) {
      pushQuad(working, rdfDataFactory.quad(validity, TIME_HAS_END, end, graph));
      pushQuad(working, rdfDataFactory.quad(end, RDF_TYPE, TIME_INSTANT, graph));
      pushQuad(
        working,
        rdfDataFactory.quad(end, TIME_IN_XSD_DATE_TIME, literalForTimestamp(existingEnd), graph)
      );
    }
  }

  const deduped = dedupeQuadsInPlace(working);
  quads.splice(0, quads.length, ...deduped);

  return {
    validity,
    beginning,
    end,
    window: {
      begins: existingBeginning,
      ends: existingEnd,
    },
  };
}

export function readValidityWindow(quads: Quad[], subject: NamedNode): ValidityWindow {
  const { validity, beginning, end } = validityNodesFor(subject);
  const window: ValidityWindow = {};

  const graphQuads = quads.filter((quad) => quad.graph.termType === 'NamedNode');

  const hasValidity = graphQuads.some(
    (quad) =>
      quad.subject.termType === 'NamedNode' &&
      quad.subject.value === subject.value &&
      quad.predicate.equals(DCTERMS_VALID) &&
      quad.object.termType === 'NamedNode' &&
      quad.object.value === validity.value
  );

  if (!hasValidity) {
    return window;
  }

  window.begins = findDateLiteral(graphQuads, beginning);
  window.ends = findDateLiteral(graphQuads, end);
  return window;
}

export async function markResourceExpiration(
  store: GraphStore,
  subjectIri: string,
  graphIri: string,
  endedAt = new Date().toISOString()
): Promise<void> {
  const subject = rdfDataFactory.namedNode(subjectIri);
  const graph = rdfDataFactory.namedNode(graphIri);
  const existing = await store.getQuads({ graph });
  if (existing.length === 0) {
    return;
  }

  const working = existing.map((quad) => quad);
  const { validity, end } = ensureValidityMetadata({
    quads: working,
    subject,
    graph,
    existingQuads: existing,
    createValidity: true,
  });

  const filtered = working.filter(
    (quad) =>
      !(
        quad.subject.termType === 'NamedNode' &&
        ((quad.subject.value === validity.value && quad.predicate.equals(TIME_HAS_END)) ||
          (quad.subject.value === end.value && quad.predicate.equals(TIME_IN_XSD_DATE_TIME)))
      )
  );

  filtered.push(
    rdfDataFactory.quad(validity, TIME_HAS_END, end, graph),
    rdfDataFactory.quad(end, RDF_TYPE, TIME_INSTANT, graph),
    rdfDataFactory.quad(end, TIME_IN_XSD_DATE_TIME, literalForTimestamp(endedAt), graph)
  );

  const deduped = dedupeQuadsInPlace(filtered);
  await store.deleteQuads(existing);
  await store.putQuads(deduped);
}

export function isExpired(window: ValidityWindow, referenceDate = Date.now()): boolean {
  if (!window.ends) {
    return false;
  }
  const timestamp = Date.parse(window.ends);
  if (Number.isNaN(timestamp)) {
    return true;
  }
  return timestamp <= referenceDate;
}
