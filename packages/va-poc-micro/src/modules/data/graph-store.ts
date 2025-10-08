import { BrowserLevel } from 'browser-level';
import { Quadstore } from 'quadstore';
import type {
  DatasetCore,
  DataFactory,
  Quad,
  Quad_Graph,
  Quad_Object,
  Quad_Predicate,
  Quad_Subject,
} from '@rdfjs/types';
import rdfDataFactory from '@rdfjs/data-model';
import datasetFactory from '@rdfjs/dataset';
import type { DatasetFactory } from '@rdfjs/dataset';
import type { Prefixes, TermName, Pattern, StoreOpts, GetOpts } from 'quadstore';

export type GraphStoreChange =
  | { type: 'put'; quads: Quad[] }
  | { type: 'delete'; quads: Quad[] }
  | { type: 'clear' };

export type GraphStoreListener = (change: GraphStoreChange) => void;

type QuadstoreBackend = StoreOpts['backend'];

const DEFAULT_INDEXES: TermName[][] = [
  ['subject', 'predicate', 'object', 'graph'],
  ['object', 'graph', 'subject', 'predicate'],
  ['graph', 'subject', 'predicate', 'object'],
  ['object', 'subject', 'predicate', 'graph'],
  ['predicate', 'object', 'graph', 'subject'],
  ['graph', 'predicate', 'object', 'subject'],
];

export interface GraphStoreOptions {
  /**
   * Identifier used when creating the default browser backend.
   * Provide a custom backend when running outside the browser (e.g. tests).
   */
  name?: string;
  /** Optional RDF/JS data factory implementation. */
  dataFactory?: DataFactory;
  /** Custom quadstore backend. Defaults to a BrowserLevel instance. */
  backend?: QuadstoreBackend;
  /** Custom quadstore indexes. Defaults to the standard permutations. */
  indexes?: TermName[][];
  /** Optional prefix helper passed to quadstore. */
  prefixes?: Prefixes;
  /** Dataset factory, defaults to @rdfjs/dataset. */
  datasetFactory?: DatasetFactory;
}

export type GraphQueryPattern = Pattern;

export class GraphStore {
  private readonly store: Quadstore;
  private readonly datasetFactory: DatasetFactory;
  private readonly listeners = new Set<GraphStoreListener>();
  private opened = false;

  private constructor(store: Quadstore, datasetFactory: DatasetFactory) {
    this.store = store;
    this.datasetFactory = datasetFactory;
  }

  static async create(options: GraphStoreOptions = {}): Promise<GraphStore> {
    const datasetFactoryImpl = options.datasetFactory ?? datasetFactory;
    const dataFactoryImpl = options.dataFactory ?? rdfDataFactory;
    const backend: QuadstoreBackend =
      options.backend ?? GraphStore.createBrowserBackend(options.name ?? 'va-graph-store');
    const store = new Quadstore({
      backend,
      dataFactory: dataFactoryImpl,
      indexes: options.indexes ?? DEFAULT_INDEXES,
      prefixes: options.prefixes,
    });
    const graphStore = new GraphStore(store, datasetFactoryImpl);
    await graphStore.open();
    return graphStore;
  }

  private static createBrowserBackend(name: string): QuadstoreBackend {
    if (typeof indexedDB === 'undefined') {
      throw new Error(
        'GraphStore requires IndexedDB in this environment. Provide a custom backend via GraphStoreOptions.backend when running outside the browser.'
      );
    }

    return new BrowserLevel<string, string>(name, { prefix: 'va-lws-' });
  }

  async open(): Promise<void> {
    if (this.opened) {
      return;
    }

    await this.store.open();
    this.opened = true;
  }

  async close(): Promise<void> {
    if (!this.opened) {
      return;
    }

    await this.store.close();
    this.opened = false;
  }

  subscribe(listener: GraphStoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async clear(): Promise<void> {
    await this.ensureReady();
    await this.store.clear();
    this.emit({ type: 'clear' });
  }

  async putQuads(quads: Iterable<Quad>): Promise<void> {
    const items = Array.from(quads);
    if (items.length === 0) {
      return;
    }

    await this.ensureReady();
    if (items.length === 1) {
      await this.store.put(items[0]);
    } else {
      await this.store.multiPut(items);
    }
    this.emit({ type: 'put', quads: items });
  }

  async deleteQuads(quads: Iterable<Quad>): Promise<void> {
    const items = Array.from(quads);
    if (items.length === 0) {
      return;
    }

    await this.ensureReady();
    if (items.length === 1) {
      await this.store.del(items[0]);
    } else {
      await this.store.multiDel(items);
    }
    this.emit({ type: 'delete', quads: items });
  }

  async loadDataset(dataset: DatasetCore): Promise<void> {
    await this.putQuads(dataset);
  }

  async getQuads(pattern: GraphQueryPattern = {}): Promise<Quad[]> {
    await this.ensureReady();
    const { items } = await this.store.get(pattern);
    return items;
  }

  async getDataset(pattern: GraphQueryPattern = {}): Promise<DatasetCore> {
    const quads = await this.getQuads(pattern);
    return this.datasetFactory.dataset(quads);
  }

  match(
    subject?: Quad_Subject,
    predicate?: Quad_Predicate,
    object?: Quad_Object,
    graph?: Quad_Graph,
    opts?: GetOpts
  ) {
    return this.store.match(subject, predicate, object, graph, opts);
  }

  private emit(change: GraphStoreChange): void {
    for (const listener of this.listeners) {
      listener(change);
    }
  }

  private async ensureReady(): Promise<void> {
    if (!this.opened) {
      await this.open();
    }
  }
}
