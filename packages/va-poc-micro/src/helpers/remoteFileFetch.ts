import { fetchTurtleFromWeb, fetchTurtleFromSparql, isSparqlEndpoint } from '@va-automate/kg-session';

export enum TargetType {
  WebId = 'webId',
  SparqlEndpoint = 'sparqlEndpoint',
  TurtleFile = 'turtleFile',
}

/**
 * Determines the type of a given URL (SPARQL endpoint, Turtle file, or WebId).
 * Delegates to `lws-manager` and `kg-session` for implementation.
 * @param url The URL to check.
 * @returns The type of the URL as TargetType.
 */
export async function checkUrlType(url: string): Promise<TargetType> {
  try {
    const parsedUrl = new URL(url);

    // Check if the URL is a SPARQL endpoint
    if (await isSparqlEndpoint(parsedUrl)) {
      return TargetType.SparqlEndpoint;
    }

    // Check if the URL is a Turtle file
    if (url.endsWith('.ttl')) {
      await fetchTurtleFromWeb(url); // Validate the Turtle file
      return TargetType.TurtleFile;
    }

    // Default to WebId if no other type matches
    return TargetType.WebId;
  } catch (error) {
    console.error(`Error determining URL type for ${url}:`, error);
    throw new Error('Unable to determine URL type.');
  }
}
