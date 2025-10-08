declare module '@rdfjs/data-model' {
  import type { DataFactory } from '@rdfjs/types';

  export interface RdfDataFactory extends DataFactory {
    init(): void;
  }

  const factory: RdfDataFactory;
  export default factory;

  export const namedNode: RdfDataFactory['namedNode'];
  export const blankNode: RdfDataFactory['blankNode'];
  export const literal: RdfDataFactory['literal'];
  export const defaultGraph: RdfDataFactory['defaultGraph'];
  export const variable: RdfDataFactory['variable'];
  export const quad: RdfDataFactory['quad'];
}

declare module '@rdfjs/dataset' {
  import type { DatasetCore, Quad } from '@rdfjs/types';

  export interface DatasetFactory {
    dataset(quads?: Iterable<Quad>): DatasetCore;
  }

  const factory: DatasetFactory;
  export default factory;
  export const dataset: DatasetFactory['dataset'];
}
