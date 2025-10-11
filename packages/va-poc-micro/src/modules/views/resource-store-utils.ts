import rdfDataFactory from '@rdfjs/data-model';
import type { NamedNode, Quad, Term } from '@rdfjs/types';
import type { GraphStore } from '../data/graph-store';

export const RDF_TYPE_IRI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const SKOS_PREF_LABEL_IRI = 'http://www.w3.org/2004/02/skos/core#prefLabel';
const RDFS_LABEL_IRI = 'http://www.w3.org/2000/01/rdf-schema#label';
const DCTERMS_VALID_IRI = 'http://purl.org/dc/terms/valid';
const TIME_INTERVAL_IRI = 'http://www.w3.org/2006/time#Interval';
const TIME_INSTANT_IRI = 'http://www.w3.org/2006/time#Instant';
const TIME_HAS_BEGINNING_IRI = 'http://www.w3.org/2006/time#hasBeginning';
const TIME_HAS_END_IRI = 'http://www.w3.org/2006/time#hasEnd';
const TIME_IN_XSD_DATE_TIME_IRI = 'http://www.w3.org/2006/time#inXSDDateTime';
const XSD_DATE_TIME_IRI = 'http://www.w3.org/2001/XMLSchema#dateTime';

export const RDF_TYPE = rdfDataFactory.namedNode(RDF_TYPE_IRI);
export const DCTERMS_VALID = rdfDataFactory.namedNode(DCTERMS_VALID_IRI);
export const TIME_INTERVAL = rdfDataFactory.namedNode(TIME_INTERVAL_IRI);
export const TIME_INSTANT = rdfDataFactory.namedNode(TIME_INSTANT_IRI);
export const TIME_HAS_BEGINNING = rdfDataFactory.namedNode(TIME_HAS_BEGINNING_IRI);
export const TIME_HAS_END = rdfDataFactory.namedNode(TIME_HAS_END_IRI);
export const TIME_IN_XSD_DATE_TIME = rdfDataFactory.namedNode(TIME_IN_XSD_DATE_TIME_IRI);
export const XSD_DATE_TIME = rdfDataFactory.namedNode(XSD_DATE_TIME_IRI);
const SKOS_PREF_LABEL = rdfDataFactory.namedNode(SKOS_PREF_LABEL_IRI);
const RDFS_LABEL = rdfDataFactory.namedNode(RDFS_LABEL_IRI);

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

function literalForTimestamp(value: string) {
  return rdfDataFactory.literal(value, rdfDataFactory.namedNode(XSD_DATE_TIME_IRI));
}

export interface ValidityWindow {
  begins?: string;
  ends?: string;
}

export function ensureValidityMetadata(options: {
  quads: Quad[];
  subject: NamedNode;
  graph: NamedNode;
  existingQuads?: Quad[];
  createdAt?: string;
}): { validity: NamedNode; beginning: NamedNode; end: NamedNode; window: ValidityWindow } {
  const { quads, subject, graph, existingQuads = [], createdAt } = options;
  const { validity, beginning, end } = validityNodesFor(subject);

  const combined = [...existingQuads, ...quads];

  const existingBeginning = findDateLiteral(combined, beginning);
  const existingEnd = findDateLiteral(combined, end);

  const working = [...quads];

  pushQuad(working, rdfDataFactory.quad(subject, DCTERMS_VALID, validity, graph));
  pushQuad(working, rdfDataFactory.quad(validity, RDF_TYPE, TIME_INTERVAL, graph));
  pushQuad(working, rdfDataFactory.quad(validity, TIME_HAS_BEGINNING, beginning, graph));
  pushQuad(working, rdfDataFactory.quad(beginning, RDF_TYPE, TIME_INSTANT, graph));

  const beginningValue = existingBeginning ?? createdAt;
  if (beginningValue) {
    pushQuad(
      working,
      rdfDataFactory.quad(
        beginning,
        TIME_IN_XSD_DATE_TIME,
        literalForTimestamp(beginningValue),
        graph
      )
    );
  }

  if (existingEnd) {
    pushQuad(working, rdfDataFactory.quad(validity, TIME_HAS_END, end, graph));
    pushQuad(working, rdfDataFactory.quad(end, RDF_TYPE, TIME_INSTANT, graph));
    pushQuad(
      working,
      rdfDataFactory.quad(end, TIME_IN_XSD_DATE_TIME, literalForTimestamp(existingEnd), graph)
    );
  }

  const deduped = dedupeQuadsInPlace(working);
  quads.splice(0, quads.length, ...deduped);

  return {
    validity,
    beginning,
    end,
    window: {
      begins: beginningValue,
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

  const previousWindow = readValidityWindow(existing, subject);
  const working = existing.map((quad) => quad);
  const { validity, beginning, end, window } = ensureValidityMetadata({
    quads: working,
    subject,
    graph,
    existingQuads: existing,
  });

  const beginsAt = window.begins ?? previousWindow.begins;
  const hasBeginningLiteral = working.some(
    (quad) =>
      quad.subject.termType === 'NamedNode' &&
      quad.subject.value === beginning.value &&
      quad.predicate.equals(TIME_IN_XSD_DATE_TIME)
  );
  if (!hasBeginningLiteral && beginsAt) {
    working.push(
      rdfDataFactory.quad(beginning, TIME_IN_XSD_DATE_TIME, literalForTimestamp(beginsAt), graph)
    );
  }

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
