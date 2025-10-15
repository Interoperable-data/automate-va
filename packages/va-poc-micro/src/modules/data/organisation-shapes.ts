import { Parser } from 'n3';
import datasetFactory from '@rdfjs/dataset';
import type { DatasetFactory } from '@rdfjs/dataset';
import type { DatasetCore, Quad } from '@rdfjs/types';
import type { GraphStore } from './graph-store';

export interface LoadViewerShapeOptions {
  /** Absolute or relative URL to the Turtle resource. */
  url: string;
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

const cache = new Map<string, LoadedShape>();

/**
 * Fetches and parses SHACL shapes from a Turtle resource.
 * Results are cached by URL to avoid redundant network traffic during a session.
 */
export async function loadViewerShapes(options: LoadViewerShapeOptions): Promise<LoadedShape> {
  const { url, fetchFn, datasetFactory: datasetFactoryOverride, forceReload } = options;
  if (!url) {
    throw new Error('loadViewerShapes requires a url option.');
  }

  if (!forceReload && cache.has(url)) {
    return cache.get(url)!;
  }

  const fetchImpl = fetchFn ?? fetch;
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Failed to load viewer shapes (${response.status} ${response.statusText})`);
  }

  const text = await response.text();
  const parser = new Parser({ format: 'application/trig' });
  const quads = parser.parse(text) as Quad[];
  const dataset = (datasetFactoryOverride ?? datasetFactory).dataset(quads);

  const result: LoadedShape = { text, quads, dataset };
  cache.set(url, result);
  return result;
}

export interface LoadViewerShapeIntoStoreOptions extends LoadViewerShapeOptions {
  /** GraphStore instance that will host the parsed shapes. */
  store: GraphStore;
}

/**
 * Loads viewer shapes into the provided GraphStore instance.
 * This helper is idempotent: calling it multiple times with the same resource
 * simply replays the same quads which quadstore treats as no-ops when already present.
 */
export async function loadViewerShapesIntoStore(
  options: LoadViewerShapeIntoStoreOptions
): Promise<LoadedShape> {
  const { store, ...loaderOptions } = options;
  const shapes = await loadViewerShapes(loaderOptions);
  await store.putQuads(shapes.quads);
  return shapes;
}

/**
 * Clears the cached shape entries. Primarily intended for tests.
 */
export function resetShapeCache(): void {
  cache.clear();
}
