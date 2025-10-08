import { Parser } from 'n3';
import datasetFactory from '@rdfjs/dataset';
import type { DatasetFactory } from '@rdfjs/dataset';
import type { DatasetCore, Quad } from '@rdfjs/types';
import type { GraphStore } from './graph-store';

export interface LoadShapeOptions {
  /** Absolute or relative URL to the Turtle resource. Defaults to the organisation starter shapes. */
  url?: string;
  /** Custom fetch implementation (useful for tests). Defaults to global fetch. */
  fetchFn?: typeof fetch;
  /** Dataset factory override (defaults to @rdfjs/dataset). */
  datasetFactory?: DatasetFactory;
  /** When true the loader bypasses the in-memory cache and re-fetches the resource. */
  forceReload?: boolean;
}

export interface LoadedShape {
  /** Raw Turtle text fetched from the network. */
  text: string;
  /** Parsed quads that make up the shape definition. */
  quads: Quad[];
  /** Dataset representation built from the parsed quads. */
  dataset: DatasetCore;
}

const DEFAULT_ORGANISATION_SHAPE_URL = '/form-shapes/organisation-start.ttl';
const cache = new Map<string, LoadedShape>();

/**
 * Fetches and parses the organisation SHACL shapes from a Turtle resource.
 * Results are cached by URL to avoid redundant network traffic during a session.
 */
export async function loadOrganisationShapes(options: LoadShapeOptions = {}): Promise<LoadedShape> {
  const url = options.url ?? DEFAULT_ORGANISATION_SHAPE_URL;
  if (!options.forceReload && cache.has(url)) {
    return cache.get(url)!;
  }

  const fetchImpl = options.fetchFn ?? fetch;
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(
      `Failed to load organisation shapes (${response.status} ${response.statusText})`
    );
  }

  const text = await response.text();
  const parser = new Parser({ format: 'text/turtle' });
  const quads = parser.parse(text) as Quad[];
  const dataset = (options.datasetFactory ?? datasetFactory).dataset(quads);

  const result: LoadedShape = { text, quads, dataset };
  cache.set(url, result);
  return result;
}

export interface LoadIntoStoreOptions extends LoadShapeOptions {
  /** GraphStore instance that will host the parsed shapes. */
  store: GraphStore;
}

/**
 * Loads the organisation shapes into the provided GraphStore instance.
 * This helper is idempotent: calling it multiple times with the same resource
 * simply replays the same quads which quadstore treats as no-ops when already present.
 */
export async function loadOrganisationShapesIntoStore(
  options: LoadIntoStoreOptions
): Promise<LoadedShape> {
  const { store, ...loaderOptions } = options;
  const shapes = await loadOrganisationShapes(loaderOptions);
  await store.putQuads(shapes.quads);
  return shapes;
}

/**
 * Clears the cached shape entries. Primarily intended for tests.
 */
export function resetShapeCache(): void {
  cache.clear();
}
