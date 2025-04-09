import { QueryEngine } from '@comunica/query-sparql';
import { executeDirectQuery } from './KGHostHelpers';

// Types
// import QuerySourceUnidentified from '@comunica/types'
import type { BindingsStream, QuerySourceUnidentified, QueryStringContext } from '@comunica/types';
// import { processClasses } from './LWSHost.d'
import type { TrisEndpoint, KeyValueObject } from './KGHost.d';

// Comunica Engine Configuration Generator
// See: https://comunica.dev/docs/query/advanced/context/#2--overview
// spec says destination by default is the same as sources.

// Example of a TrisEndpoint object, the view should allow this as a prop.
export const trisEndpoint: TrisEndpoint = {
  'http://va-inspector.era.europa.eu:3030': {
    datasets: [
      { set: 'USERS', type: 'sparql', baseIRI: 'http://data.europa.eu/949/taxonomies/user#' },
      { set: 'OSSDOCS', type: 'sparql', baseIRI: 'http://data.europa.eu/949/ontologies/erava#' },
      { set: 'ERALEX', type: 'sparql', baseIRI: 'http://data.europa.eu/949/legislation/eralex#' },
      { set: 'ORGS', type: 'sparql', baseIRI: 'http://data.europa.eu/949/taxonomies/org#' },
      { set: 'OSSLIB', type: 'sparql', baseIRI: 'http://data.europa.eu/949/taxonomies/eva#' },
      { set: 'ERAVOC', type: 'sparql', baseIRI: 'http://data.europa.eu/949/' },
      // {
      //   set: 'ERAVOC',
      //   type: 'file',
      //   baseIRI: 'http://data.europa.eu/949/',
      //   file: 'https://raw.githubusercontent.com/Interoperable-data/ERA-Ontology-3.1.0/main/ontology.ttl',
      // },
    ],
  },
  'https://demo.openlinksw.com/sparql': {
    datasets: [],
  },
};

export class KGHost {
  private myEngine = new QueryEngine();
  private options: QueryStringContext;
  private debug: boolean = false;
  private initialized: boolean = false;

  // Add private debug method
  private debugLog(message: string, ...args: any[]) {
    if (this.debug) {
      console.log(`[KGHost Debug] ${message}`, ...args);
    }
  }

  // Modified debug mode setter
  set debugMode(enabled: boolean) {
    this.debug = enabled;
    if (enabled) {
      console.log('=== KGHost Debug Mode Enabled ===');
      this.debugLog('Debug mode initialized');
    }
  }

  // URL normalization helper
  private normalizeUrl(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  // Configures Endpoints like JENA, where the URL becomes:
  // http://va-inspector.era.europa.eu:3030/{Dataset}/{verb, mostly sparql/query}
  private ldflexJenaConfig(
    endPoints: TrisEndpoint,
    endpoint: URL,
    dataset: string,
    update: boolean
  ) {
    try {
      const epKey = this.normalizeUrl(endpoint.href);
      this.debugLog('Configuring Jena endpoint:', { endpoint: epKey, dataset, update });

      if (!endPoints[epKey]) {
        // Try with trailing slash if not found
        const epKeyWithSlash = `${epKey}/`;
        if (!endPoints[epKeyWithSlash]) {
          throw new Error(`Endpoint ${epKey} not found in trisEndpoint configuration`);
        }
        endPoints[epKey] = endPoints[epKeyWithSlash];
      }

      if (!endPoints[epKey].datasets || !Array.isArray(endPoints[epKey].datasets)) {
        throw new Error(`No datasets configured for endpoint ${epKey}`);
      }

      const allDatasets = endPoints[epKey].datasets.map((o) => o.set);
      if (!allDatasets.includes(dataset)) {
        throw new Error(
          `Dataset ${dataset} not found in endpoint ${epKey}. Available datasets: ${allDatasets.join(', ')}`
        );
      }

      const index = allDatasets.indexOf(dataset);
      this.debugLog('Available datasets:', allDatasets);
      this.debugLog('Selected dataset index:', index);

      if (!endPoints[epKey].datasets[index]) {
        throw new Error(`Dataset configuration not found at index ${index}`);
      }

      const baseIRI = endPoints[epKey].datasets[index].baseIRI;
      if (!baseIRI) {
        throw new Error(`No baseIRI configured for dataset ${dataset}`);
      }

      // Keep existing tStores function with added validation
      const tStores = (verb: string) => {
        // Array of sources as per datasets
        try {
          this.debugLog('Creating tStores with verb:', verb);
          return endPoints[epKey].datasets.map((ds) => {
            if (!ds.type || !ds.set) {
              throw new Error(`Invalid dataset configuration: ${JSON.stringify(ds)}`);
            }
            const store = {
              type: ds.type,
              value:
                ds.type == 'sparql' ? this.normalizeUrl(`${epKey}/${ds.set}/${verb}`) : ds.file,
            };
            this.debugLog('Created store:', store);
            return store;
          });
        } catch (error) {
          this.debugLog('Error in tStores:', error);
          throw new Error(`Failed to create stores: ${error.message}`);
        }
      };

      // Keep existing basicOptionsObject configuration
      const basicOptionsObject: QueryStringContext = {
        baseIRI: baseIRI,
        // FIXME: creation of sources as usch systematically fails:
        sources: new Array(tStores('query')[index]) as [
          QuerySourceUnidentified,
          ...QuerySourceUnidentified[],
        ],
        // sources: new Array('http://va-inspector.era.europa.eu:3030/ERALEX/query'),
        // context: {},
        // lenient: true,
      };

      // Keep existing update mode configuration
      if (update) {
        this.debugLog('Configuring update mode');
        basicOptionsObject.sources = [tStores('query')[index]] as [
          QuerySourceUnidentified,
          ...QuerySourceUnidentified[],
        ];
        basicOptionsObject.destination = tStores('update').map((o) => {
          return { ...o, type: 'sparql' };
        })[index];
      }

      // Keep existing SPARQL context configuration
      /** if (endPoints[epKey].datasets[index].type == 'sparql') {
        this.debugLog('Configuring SPARQL context for dataset:', dataset)
        basicOptionsObject.context = {
          '@comunica/actor-init-sparql#source': {
            '@id': 'urn:sparql:source',
            '@type': 'comunica:JsonLDSparqlEndpoint',
            'comunica:sourceUri': `${epKey}/${dataset}/query`,
            'comunica:context': {
              '@vocab': 'http://www.w3.org/ns/sparql-service-description#',
              sd: 'http://www.w3.org/ns/sparql-service-description#',
              endpoint: {
                '@id': 'sd:endpoint',
                '@type': '@id',
              },
              defaultGraph: {
                '@id': 'sd:defaultGraph',
                '@type': '@id',
              },
              namedGraph: {
                '@id': 'sd:namedGraph',
                '@type': '@id',
              },
            },
          },
        }
      } */

      this.debugLog('Final Jena config:', { options: basicOptionsObject });
      return {
        options: basicOptionsObject,
      };
    } catch (error) {
      this.debugLog('Error in ldflexJenaConfig:', error);
      throw new Error(`Failed to configure Jena endpoint: ${error.message}`);
    }
  }

  private ldflexNonJenaConfig(endpoint: URL, update: boolean) {
    const epKey = this.normalizeUrl(endpoint.href);
    const isFile = epKey.endsWith('.ttl');
    const basicOptionsObject: QueryStringContext = {
      sources: [{ type: isFile ? 'file' : 'sparql', value: epKey }] as [
        QuerySourceUnidentified,
        ...QuerySourceUnidentified[],
      ],
      // context: {},
      lenient: true,
    };
    if (update) basicOptionsObject.destination = { type: 'sparql', value: epKey };
    return {
      options: basicOptionsObject,
    };
  }

  constructor(
    endPoints: TrisEndpoint | undefined,
    endpoint: URL,
    dataset?: string | undefined,
    update = false
  ) {
    this.debugLog('Initializing KGHost');
    if (endPoints && dataset) {
      const config = this.ldflexJenaConfig(endPoints, endpoint, dataset, update);
      this.options = config.options;
      this.debugLog('Initialized with Jena config:', config);
    } else {
      const config = this.ldflexNonJenaConfig(endpoint, update);
      this.options = config.options;
      this.debugLog('Initialized with SPARQL endpoint config:', config);
    }
    this.initialized = true;
    this.debugLog('Initialization complete');
  }

  async query(query: string): Promise<KeyValueObject | boolean | null> {
    try {
      if (!this.initialized) {
        this.debugLog('Not properly initialized');
        return null;
      }

      this.debugLog('Executing query:', query);
      this.debugLog('Using options:', this.options);

      const result = await this.myEngine.query(query, this.options);
      const qRes = await result.execute();
      this.debugLog('Query result type:', result.resultType);

      if (result.resultType === 'boolean') {
        // const boolResult = await result.execute() -->  The "chunk" argument must be of type string or an instance of Buffer or Uint8Array. Received an instance of Uint8Array
        // const boolResult = await this.myEngine.queryBoolean(query, this.options)
        this.debugLog('Boolean result:', qRes);
        return qRes as boolean;
      }

      if (result.resultType === 'bindings') {
        const res: KeyValueObject = {};
        const variables = (await result.metadata()).variables;
        this.debugLog('Query variables:', variables);

        // const bindingsStream = await result.execute()
        for await (const bindings of qRes as BindingsStream) {
          for (const variable of variables) {
            const value = bindings.get(variable);
            if (value && value.value !== null) {
              res[variable.value] = value.value;
            }
          }
        }
        this.debugLog('Query results:', res);
        return res;
      }

      console.error('Unsupported query result type:', result.resultType);
      return null;
    } catch (error) {
      this.debugLog('Query error:', error);
      console.error('Query failed:', error);
      return null;
    }
  }

  async directQuery(
    q: string,
    endpoint: URL,
    ds?: string
  ): Promise<KeyValueObject | boolean | null> {
    return await executeDirectQuery(q, endpoint, this.debug, ds);
  }
}

// isSparqlEndpoint function
export async function isSparqlEndpoint(
  uri: URL,
  dataset?: string,
  endPoints?: TrisEndpoint
): Promise<boolean> {
  try {
    const kgh = new KGHost(endPoints, uri, dataset);
    kgh.debugMode = true; // Enable debug logging
    const result = await kgh.directQuery('ASK { ?s ?p ?o }', uri, dataset);
    return result === true; // Now explicitly checking for boolean true since we handle ASK queries properly
  } catch (error) {
    console.error('isSparqlEndpoint failed: ', error);
    return false;
  }
}

export async function retrieveProcessesFromEndpoint(
  uri: URL,
  dataset?: string,
  endPoints?: TrisEndpoint,
  processClasses: string[]
): Promise<string[]> {
  try {
    const kgh = new KGHost(endPoints, uri, dataset);
    kgh.debugMode = true; // Enable debug logging
    const query = `
      SELECT DISTINCT ?class WHERE {
        ?class a ?type .
        FILTER(?type IN (${processClasses.map((cls) => `<${cls}>`).join(', ')}))
      }
    `;
    const result = await kgh.directQuery(query, uri, dataset);
    if (result) {
      return Object.values(result);
    } else {
      throw new Error('Query did not return any results.');
    }
  } catch (error) {
    console.error('retrieveProcessesFromEndpoint failed: ', error);
    throw error;
  }
}

export async function retrieveSubjectsByClass(
  uri: URL,
  rdfClass: string,
  dataset?: string,
  endPoints?: TrisEndpoint,
  limit: number = 5
): Promise<string[]> {
  try {
    const kgh = new KGHost(endPoints, uri, dataset);
    kgh.debugMode = true; // Enable debug logging
    const query =
      `SELECT ?sNode WHERE {
        ?sNode a <${rdfClass}> .
      }` + (limit ? ` LIMIT ${limit}` : '');
    const result = await kgh.directQuery(query, uri, dataset);
    if (result) {
      return Object.values(result);
    } else {
      throw new Error('Query did not return any results.');
    }
  } catch (error) {
    console.error('retrieveSubjectsByClass failed: ', error);
    throw error;
  }
}

/**
 * UNTESTED
 * Checks if a URL is a SPARQL endpoint by sending a test query.
 * @param url The URL to check.
 * @returns True if the URL is a SPARQL endpoint, false otherwise.
 */
// export async function isSparqlEndpoint(url: URL): Promise<boolean> {
//   try {
//     const engine = new QueryEngine();
//     const query = 'ASK WHERE { ?s ?p ?o }'; // Simple SPARQL ASK query
//     const result = await engine.query(query, { sources: [url.href] });
//     return result !== null;
//   } catch {
//     return false;
//   }
// }

/**
 * Fetches data as Turtle from a SPARQL endpoint.
 * @param endpointUrl The URL of the SPARQL endpoint.
 * @param query The SPARQL query to execute.
 * @returns The Turtle content as a string.
 */
export async function fetchTurtleFromSparql(endpointUrl: string, query: string): Promise<string> {
  try {
    const engine = new QueryEngine();
    const result = await engine.query(query, { sources: [endpointUrl] });
    const { data } = await engine.resultToString(result, 'text/turtle');
    return await streamToString(data);
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
