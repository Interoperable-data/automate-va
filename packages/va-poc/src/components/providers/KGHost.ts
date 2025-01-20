// Generic SPARQL query function
import { QueryEngine } from '@comunica/query-sparql'

// Types
import type { QuerySourceUnidentified, QueryStringContext } from '@comunica/types'
import { processClasses } from './LWSHost.d'
import type {
  TrisEndpoint,
  KeyValueObject
} from './KGHost.d'

// Store for process data
import { processStore } from './LWSProcessStore'

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
      {
        set: 'ERAVOC',
        type: 'file',
        baseIRI: 'http://data.europa.eu/949/',
        file: 'https://raw.githubusercontent.com/Interoperable-data/ERA-Ontology-3.1.0/main/ontology.ttl',
      },
    ],
  },
  'https://demo.openlinksw.com/sparql': {
    datasets: [],
  },
}

export class KGHost {
  private queryEngine = new QueryEngine();
  private options: QueryStringContext;

  // Configures Endpoints like JENA, where the URL becomes:
  // http://va-inspector.era.europa.eu:3030/{Dataset}/{verb, mostly sparql/query}
  private ldflexJenaConfig(
    endPoints: TrisEndpoint,
    endpoint: URL,
    dataset: string,
    update: boolean
  ) {
    // prepares the right context of the destination, given a dataset out of the allDatasets array.
    const epKey = endpoint.href
    const allDatasets = endPoints[epKey].datasets.map((o) => o.set)
    const index = allDatasets.indexOf(dataset) || 0
    const tStores = (verb: string): QuerySourceUnidentified[] => {
      // verb should mostly be query, but can be update|sparql for several kgs.
      return endPoints[epKey].datasets.map((ds) => {
        return {
          type: ds.type,
          value: ds.type == 'sparql' ? `${epKey}/${ds.set}/${verb}` : ds.file,
        } as QuerySourceUnidentified
      })
    }
    const baseIRI = endPoints[epKey].datasets[index].baseIRI
    /**
     * `basicOptionsObject` - Represents the basic options object for configuring a Comunica query engine.
     *
     * @property {string} baseIRI - The base IRI for the query engine. This is not used for the @base in the applicable context (user, docs, etc).
     * @property {Array} sources - An array containing the query sources. Uses 'query' if a destination is also provided with 'update'.
     * @property {Object} context - The context for the query engine.
     *
     * @see https://comunica.dev/docs/query/advanced/destination_types/ for more information on destination types.
     *
     * @example
     * // Example usage:
     * let basicOptionsObject = {
     *   baseIRI: 'http://example.org/',
     *   sources: [tStores('query')[index]],
     *   context: {}
     * };
     */
    const basicOptionsObject: QueryStringContext = {
      // The query engine and its source, the configured tstores.
      baseIRI: baseIRI, // @base in Applicable (user, docs, etc) Context is not used for
      sources: [tStores('query')[index]] as [QuerySourceUnidentified, ...QuerySourceUnidentified[]],
      context: {},
      destination: undefined,
      lenient: true,
    }

    if (update) {
      // For destination, see: https://comunica.dev/docs/query/advanced/destination_types/ must be ONE value.
      // destination: tStores('update').map((o) => {
      //   return { ...o, type: 'sparql' };
      // })[index],
      basicOptionsObject.sources = [tStores('update')[index]] as [QuerySourceUnidentified, ...QuerySourceUnidentified[]];
      basicOptionsObject.destination = tStores('update').map((o) => {
        return { ...o, type: 'sparql' }
      })[index]
    } else {
      // use the initial source (query)
    }
    if (endPoints[epKey].datasets[index].type == 'sparql') {
      // Insinuated by Copilot.
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
    }
    return {
      options: basicOptionsObject,
    }
  }

  private sparqlEndpointConfig(endpoint: URL, update: boolean) {
    const basicOptionsObject: QueryStringContext = {
      sources: [{ type: 'sparql', value: endpoint.href }] as [QuerySourceUnidentified, ...QuerySourceUnidentified[]],
      context: {},
      destination: update ? { type: 'sparql', value: endpoint.href } : undefined,
      lenient: true,
    };
    return {
      options: basicOptionsObject,
    };
  }

  constructor(
    endPoints: TrisEndpoint | undefined,
    endpoint: URL,
    dataset: string | undefined,
    update = false
  ) {
    if (endPoints && dataset) {
      const config = this.ldflexJenaConfig(endPoints, endpoint, dataset, update);
      this.options = config.options;
    } else {
      const config = this.sparqlEndpointConfig(endpoint, update);
      this.options = config.options;
    }
  }

  async query(query: string): Promise<KeyValueObject | boolean | null> {
    try {
      console.log('Executing SPARQL query:', query);
      console.log('Using options:', this.options);

      // Execute the query using our internal queryEngine and options
      const result = await this.queryEngine.query(query, this.options);

      if (result.resultType === 'boolean') {
        const boolResult = await result.execute();
        return boolResult;
      }

      if (result.resultType === 'bindings') {
        const res: KeyValueObject = {};
        const variables = (await result.metadata()).variables;
        const bindingsStream = await result.execute();
        for await (const bindings of bindingsStream) {
          for (const variable of variables) {
            const value = bindings.get(variable);
            if (value && value.value !== null) {
              res[variable.value] = value.value;
            }
          }
        }
        return res;
      }

      console.error('Unsupported query result type:', result.resultType);
      return null;
    } catch (error) {
      console.error('Query failed:', error);
      return null;
    }
  }
}

// isSparqlEndpoint function
async function isSparqlEndpoint(
  uri: URL,
  dataset?: string,
  endPoints?: TrisEndpoint
): Promise<boolean> {
  try {
    const kgh = new KGHost(endPoints, uri, dataset);
    const result = await kgh.query('ASK { ?s ?p ?o }');
    return result === true; // Now explicitly checking for boolean true since we handle ASK queries properly
  } catch (error) {
    console.error('isSparqlEndpoint failed: ', error);
    return false;
  }
}

async function retrieveProcessesFromEndpoint(
  uri: URL,
  dataset?: string,
  endPoints?: TrisEndpoint
): Promise<string[]> {
  try {
    const kgh = new KGHost(endPoints, uri, dataset);
    const query = `
      SELECT ?s WHERE {
        ?s a ?type .
        FILTER(?type IN (${processClasses.map((cls) => `<${cls}>`).join(', ')}))
      }
    `;
    const result = await kgh.query(query);
    if (result) {
      return Object.values(result);
    } else {
      throw new Error('Query did not return any results.');
    }
  } catch (error) {
    console.error('retrieveProcessesFromEndpoint failed: ', error)
    throw error
  }
}

async function retrieveSubjectsByClass(
  uri: URL,
  rdfClass: string,
  dataset?: string,
  endPoints?: TrisEndpoint
): Promise<string[]> {
  try {
    const kgh = new KGHost(endPoints, uri, dataset);
    const query = `
      SELECT ?s WHERE {
        ?s a <${rdfClass}> .
      }
    `;
    const result = await kgh.query(query);
    if (result) {
      return Object.values(result);
    } else {
      throw new Error('Query did not return any results.');
    }
  } catch (error) {
    console.error('retrieveSubjectsByClass failed: ', error)
    throw error
  }
}

export {
  isSparqlEndpoint,
  retrieveProcessesFromEndpoint,
  retrieveSubjectsByClass,
}
