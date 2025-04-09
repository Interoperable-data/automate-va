import { fetch } from '@inrupt/solid-client-authn-browser';
import { newEngine } from '@comunica/actor-init-sparql';

/**
 * Fetches a Turtle file from a remote URL.
 * @param url The URL of the Turtle file.
 * @returns The Turtle content as a string.
 */
export async function fetchTurtleFromRemoteFile(url: string): Promise<string> {
  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Failed to fetch Turtle file from ${url}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching Turtle file:', error);
    throw error;
  }
}

/**
 * Fetches data as Turtle from a SPARQL endpoint.
 * @param endpointUrl The URL of the SPARQL endpoint.
 * @param query The SPARQL query to execute.
 * @returns The Turtle content as a string.
 */
export async function fetchTurtleFromSparqlEndpoint(
  endpointUrl: string,
  query: string
): Promise<string> {
  try {
    const engine = newEngine();
    const result = await engine.query(query, {
      sources: [endpointUrl],
      headers: { Accept: 'text/turtle' }, // Request Turtle format
    });

    const { data } = await engine.resultToString(result, 'text/turtle');
    const turtleContent = await streamToString(data);
    return turtleContent;
  } catch (error) {
    console.error('Error fetching Turtle from SPARQL endpoint:', error);
    throw error;
  }
}

/**
 * Helper function to convert a ReadableStream to a string.
 * @param stream The ReadableStream to convert.
 * @returns The content of the stream as a string.
 */
async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
