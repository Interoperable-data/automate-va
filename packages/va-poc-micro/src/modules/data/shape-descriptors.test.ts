import { describe, expect, it } from 'vitest';
import datasetFactory from '@rdfjs/dataset';
import { Parser } from 'n3';
import { discoverShapeDescriptors } from './shape-descriptors.js';

const parser = new Parser({ format: 'application/trig' });

const ttl = `
  @prefix sh: <http://www.w3.org/ns/shacl#> .
  @prefix ex: <http://example.org/> .
  @prefix skos: <http://www.w3.org/2004/02/skos/core#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix dash: <http://datashapes.org/dash#> .
  @prefix data: <https://example.org/data/> .

  ex:ExampleShape
    a sh:NodeShape ;
    rdfs:label "Example" ;
    rdfs:comment "Example descriptor" ;
    sh:targetClass ex:ExampleClass ;
    skos:prefLabel "Example" ;
    skos:definition "Example descriptor" ;
    dash:stem data: .

  ex:OtherShape
    a sh:NodeShape ;
    rdfs:label "Other Class" ;
    rdfs:comment "Manage other classes." ;
    sh:targetClass ex:OtherClass ;
    dash:stem data: .
`;

const dataset = datasetFactory.dataset(parser.parse(ttl));

describe('discoverShapeDescriptors', () => {
  it('extracts metadata from NodeShapes and target classes', () => {
    const descriptors = discoverShapeDescriptors(dataset);

    expect(descriptors).toHaveLength(2);

    const example = descriptors.find(
      (descriptor) => descriptor.shape.value === 'http://example.org/ExampleShape'
    );
    expect(example).toBeDefined();
    expect(example?.label).toBe('Example');
    expect(example?.pluralLabel).toBe('Examples');
    expect(example?.description).toBe('Example descriptor');
    expect(example?.createButtonLabel).toBe('Create example');
    expect(example?.submitButtonLabel).toBe('Save example');
    expect(example?.slug).toBe('example');
    expect(example?.valuesNamespace).toBe('https://example.org/data/');

    const other = descriptors.find(
      (descriptor) => descriptor.shape.value === 'http://example.org/OtherShape'
    );
    expect(other).toBeDefined();
    expect(other?.label).toBe('Other Class');
    expect(other?.pluralLabel).toBe('Other Classes');
    expect(other?.description).toBe('Manage other classes.');
    expect(other?.createButtonLabel).toBe('Create other-class');
    expect(other?.submitButtonLabel).toBe('Save other-class');
    expect(other?.slug).toBe('other-class');
    expect(other?.valuesNamespace).toBe('https://example.org/data/');
  });
});

it('skips NodeShapes missing required label or comment', () => {
  const invalidTtl = `
    @prefix sh: <http://www.w3.org/ns/shacl#> .
    @prefix ex: <http://example.org/> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix dash: <http://datashapes.org/dash#> .
    @prefix data: <https://example.org/data/> .

    ex:ShapeWithoutLabel
      a sh:NodeShape ;
      sh:targetClass ex:Entity ;
      rdfs:comment "Missing label" ;
      dash:stem data: .

    ex:ShapeWithoutComment
      a sh:NodeShape ;
      rdfs:label "No Comment" ;
      sh:targetClass ex:Entity ;
      dash:stem data: .
  `;

  const invalidDataset = datasetFactory.dataset(parser.parse(invalidTtl));
  const descriptors = discoverShapeDescriptors(invalidDataset);
  expect(descriptors).toHaveLength(0);
});

it('skips NodeShapes missing dash:stem', () => {
  const invalidTtl = `
    @prefix sh: <http://www.w3.org/ns/shacl#> .
    @prefix ex: <http://example.org/> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

    ex:ShapeWithoutNamespace
      a sh:NodeShape ;
      rdfs:label "Missing namespace" ;
      rdfs:comment "Needs a namespace for generated IRIs" ;
      sh:targetClass ex:Entity .
  `;

  const invalidDataset = datasetFactory.dataset(parser.parse(invalidTtl));
  const descriptors = discoverShapeDescriptors(invalidDataset);
  expect(descriptors).toHaveLength(0);
});
