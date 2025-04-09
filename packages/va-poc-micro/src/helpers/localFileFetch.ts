import { Parser as N3Parser } from 'n3';
import type { DatasetCore, Quad } from '@rdfjs/types';
import factory from '@rdfjs/dataset';
import { fromRdfJsDataset, type SolidDataset } from '@inrupt/solid-client';

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
    }
    const turtleContent = await response.text();
    console.log(`Fetched Turtle content from ${url}`);
    return turtleContent;
  } catch (error) {
    console.error('Error fetching Turtle file:', error);
    throw error;
  }
}

/**
 * Parses a Turtle string into an RDF/JS dataset.
 * @param turtleContent - The Turtle content as a string.
 * @returns A promise resolving to an RDF/JS dataset.
 */
export async function parseTurtleToDataset(turtleContent: string): Promise<DatasetCore> {
  try {
    const parser = new N3Parser();
    const rdfDataset = factory.dataset(); // Use the Factory to create a dataset

    parser.parse(turtleContent, (error, quad: Quad | null) => {
      if (error) {
        throw new Error(`Error parsing Turtle content: ${error.message}`);
      }
      if (quad) {
        rdfDataset.add(quad);
      }
    });

    console.log('Parsed Turtle content into RDF/JS dataset');
    return rdfDataset;
  } catch (error) {
    console.error('Error parsing Turtle to RDF/JS dataset:', error);
    throw error;
  }
}

/**
 * Converts a Turtle string directly into a SolidDataset.
 * @param turtleContent - The Turtle content as a string.
 * @returns A promise resolving to a SolidDataset.
 */
export async function parseTurtleToSolidDataset(turtleContent: string): Promise<SolidDataset> {
  try {
    // Parse the Turtle string into an RDF/JS dataset
    const rdfDataset = await parseTurtleToDataset(turtleContent);

    // Convert the RDF/JS dataset into a SolidDataset
    const solidDataset = fromRdfJsDataset(rdfDataset);

    console.log('Converted Turtle content into SolidDataset');
    return solidDataset;
  } catch (error) {
    console.error('Error converting Turtle to SolidDataset:', error);
    throw error;
  }
}

/**
 * Serializes an RDF/JS dataset into pure RDF (e.g., N-Triples).
 * @param rdfDataset - The RDF/JS dataset to serialize.
 * @returns A promise resolving to the RDF string representation of the dataset.
 */
export async function serializeDatasetToRdf(rdfDataset: DatasetCore): Promise<string> {
  try {
    let rdfString = '';

    // Iterate over each quad in the dataset
    for (const quad of rdfDataset) {
      rdfString += `${quad.subject.value} ${quad.predicate.value} ${formatObject(quad.object)} .\n`;
    }

    console.log('Serialized RDF/JS dataset to N-Triples');
    return rdfString;
  } catch (error) {
    console.error('Error serializing RDF/JS dataset to RDF:', error);
    throw error;
  }
}

/**
 * Formats an RDF term (object) for N-Triples serialization.
 * @param term - The RDF term to format.
 * @returns The formatted string representation of the term.
 */
function formatObject(term: Quad['object']): string {
  if (term.termType === 'Literal') {
    const escapedValue = term.value.replace(/"/g, '\\"'); // Escape double quotes
    const datatype =
      term.datatype?.value !== 'http://www.w3.org/2001/XMLSchema#string'
        ? `^^<${term.datatype.value}>`
        : '';
    const language = term.language ? `@${term.language}` : '';
    return `"${escapedValue}"${language}${datatype}`;
  } else if (term.termType === 'NamedNode') {
    return `<${term.value}>`;
  } else if (term.termType === 'BlankNode') {
    return `_:${term.value}`;
  } else {
    throw new Error(`Unsupported RDF term type: ${term.termType}`);
  }
}
