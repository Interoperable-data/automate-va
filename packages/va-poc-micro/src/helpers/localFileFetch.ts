import * as rdfParser from 'rdf-parse';
// import type { DatasetCore } from '@rdfjs/types';

/**
 * Fetches a Turtle file from the given URL and returns its content as a string.
 * @param url - The URL of the Turtle file to fetch.
 * @returns A promise resolving to the content of the Turtle file as a string.
 */
export async function fetchTurtleFile(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    } else {
      console.log(`Reading ${response.status}, url: ${url}`);
      const res = await response.text();
      console.log(res);

      return res;
    }
  } catch (error) {
    console.error('Error fetching Turtle file:', error);
    throw error;
  }
}

/**
 * Parses a Turtle file from a URL into an RDF/JS dataset.
 * @param url - The URL of the Turtle file to fetch and parse.
 * @returns A promise resolving to an RDF/JS dataset.
 */
export async function parseTurtleFromUrl(url: string): Promise<DatasetCore> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Turtle file: ${response.statusText}`);
    }

    const parser = rdfParser.parse(new ReadableStream({
      start(controller) {
        controller.enqueue(response.body);
        controller.close();
      },
    }), { contentType: 'text/turtle' });

    const quads: any[] = [];
    for await (const quad of parser) {
      quads.push(quad);
    }

    return {
      match: () => quads[Symbol.iterator](),
      size: quads.length,
    } as DatasetCore;
  } catch (error) {
    console.error('Error parsing Turtle file:', error);
    throw error;
  }
}
