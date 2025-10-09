import rdfDataFactory from '@rdfjs/data-model';
import type { DatasetCore, Literal, NamedNode, Quad_Object } from '@rdfjs/types';

export interface ShapeDescriptor {
  shape: NamedNode;
  targetClass: NamedNode;
  label: string;
  pluralLabel: string;
  description: string;
  createButtonLabel: string;
  submitButtonLabel: string;
  slug: string;
  valuesNamespace: string;
}

const RDF_TYPE = rdfDataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
const SH_NODE_SHAPE = rdfDataFactory.namedNode('http://www.w3.org/ns/shacl#NodeShape');
const SH_TARGET_CLASS = rdfDataFactory.namedNode('http://www.w3.org/ns/shacl#targetClass');
const SKOS_PREF_LABEL = rdfDataFactory.namedNode('http://www.w3.org/2004/02/skos/core#prefLabel');
const RDFS_LABEL = rdfDataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label');
const SCHEMA_NAME = rdfDataFactory.namedNode('https://schema.org/name');
const SKOS_DEFINITION = rdfDataFactory.namedNode('http://www.w3.org/2004/02/skos/core#definition');
const RDFS_COMMENT = rdfDataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#comment');
const DCTERMS_DESCRIPTION = rdfDataFactory.namedNode('http://purl.org/dc/terms/description');
const SCHEMA_DESCRIPTION = rdfDataFactory.namedNode('https://schema.org/description');
const DASH_STEM = rdfDataFactory.namedNode('http://datashapes.org/dash#stem');
const XSD_ANY_URI = 'http://www.w3.org/2001/XMLSchema#anyURI';

const LABEL_PREDICATES = [RDFS_LABEL, SKOS_PREF_LABEL, SCHEMA_NAME] as const;
const DESCRIPTION_PREDICATES = [
  RDFS_COMMENT,
  DCTERMS_DESCRIPTION,
  SKOS_DEFINITION,
  SCHEMA_DESCRIPTION,
] as const;
const VALUES_NAMESPACE_PREDICATES = [DASH_STEM] as const;

export function discoverShapeDescriptors(dataset: DatasetCore): ShapeDescriptor[] {
  const descriptors: ShapeDescriptor[] = [];
  const shapeSubjects = new Set<string>();

  for (const quad of dataset.match(undefined, RDF_TYPE, SH_NODE_SHAPE)) {
    if (quad.subject.termType !== 'NamedNode') {
      continue;
    }
    shapeSubjects.add(quad.subject.value);
  }

  for (const shapeIri of shapeSubjects) {
    const shape = rdfDataFactory.namedNode(shapeIri);
    const target = findTargetClass(dataset, shape);
    if (!target) {
      continue;
    }

    const label = findLiteral(dataset, shape, LABEL_PREDICATES);
    if (!label) {
      console.warn(`[shape-descriptors] Skipping NodeShape ${shape.value}: missing rdfs:label.`);
      continue;
    }

    const pluralLabel = toPlural(label);
    const description = findLiteral(dataset, shape, DESCRIPTION_PREDICATES);
    if (!description) {
      console.warn(`[shape-descriptors] Skipping NodeShape ${shape.value}: missing rdfs:comment.`);
      continue;
    }

    const slug = toSlug(label);
    const createLabel = `Create ${slug}`;
    const submitLabel = `Save ${slug}`;
    const namespace = findUri(dataset, shape, VALUES_NAMESPACE_PREDICATES);
    if (!namespace) {
      console.warn(`[shape-descriptors] Skipping NodeShape ${shape.value}: missing dash:stem.`);
      continue;
    }

    descriptors.push({
      shape,
      targetClass: target,
      label,
      pluralLabel,
      description,
      createButtonLabel: createLabel,
      submitButtonLabel: submitLabel,
      slug,
      valuesNamespace: namespace,
    });
  }

  descriptors.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  return descriptors;
}

function findTargetClass(dataset: DatasetCore, shape: NamedNode): NamedNode | null {
  for (const quad of dataset.match(shape, SH_TARGET_CLASS, undefined)) {
    if (isNamedNode(quad.object)) {
      return quad.object;
    }
  }
  return null;
}

function findLiteral(
  dataset: DatasetCore,
  subject: NamedNode,
  predicates: readonly NamedNode[]
): string | null {
  for (const predicate of predicates) {
    for (const quad of dataset.match(subject, predicate, undefined)) {
      if (quad.object.termType === 'Literal') {
        return (quad.object as Literal).value;
      }
    }
  }
  return null;
}

function findUri(
  dataset: DatasetCore,
  subject: NamedNode,
  predicates: readonly NamedNode[]
): string | null {
  for (const predicate of predicates) {
    for (const quad of dataset.match(subject, predicate, undefined)) {
      if (quad.object.termType === 'NamedNode') {
        return (quad.object as NamedNode).value;
      }
      if (quad.object.termType === 'Literal') {
        const literal = quad.object as Literal;
        if (!literal.datatype || literal.datatype.value === XSD_ANY_URI) {
          return literal.value;
        }
      }
    }
  }
  return null;
}

function isNamedNode(object: Quad_Object): object is NamedNode {
  return object.termType === 'NamedNode';
}

function toPlural(label: string): string {
  const words = label.split(' ');
  const last = words[words.length - 1];
  words[words.length - 1] = pluralizeWord(last);
  return words.join(' ');
}

function pluralizeWord(word: string): string {
  if (/[^aeiou]y$/i.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }
  if (/(s|x|z|ch|sh)$/i.test(word)) {
    return `${word}es`;
  }
  return `${word}s`;
}

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
