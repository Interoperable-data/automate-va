import { getSolidDataset } from '@inrupt/solid-client';

/**
 * Fetches a Turtle file from a Solid Pod.
 * @param url The URL of the Turtle file.
 * @returns The Turtle content as a string.
 */
export async function fetchTurtleFromPod(url: string): Promise<string> {
  try {
    const dataset = await getSolidDataset(url, { fetch });
    return JSON.stringify(dataset); // Convert dataset to Turtle (if needed, use a serializer)
  } catch (error) {
    console.error('Error fetching Turtle file from Solid Pod:', error);
    throw error;
  }
}
