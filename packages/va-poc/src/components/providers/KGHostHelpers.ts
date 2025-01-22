import { QueryEngine } from '@comunica/query-sparql'
import { literal, namedNode } from '@rdfjs/data-model'
import type { BindingsStream, QuerySourceUnidentified, QueryStringContext } from '@comunica/types'
import type { TrisEndpoint, KeyValueObject } from './KGHost.d'

// Debug logging helper
export function debugLog(debug: boolean, message: string, ...args: any[]) {
  if (debug) {
    console.log(`[KGHost Debug] ${message}`, ...args)
  }
}

// URL normalization helper
export function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

// Configure Jena endpoints
export function ldflexJenaConfig(
  endPoints: TrisEndpoint,
  endpoint: URL,
  dataset: string,
  update: boolean,
  debug: boolean = false,
): { options: QueryStringContext } {
  try {
    const epKey = normalizeUrl(endpoint.href)
    debugLog(debug, 'Configuring Jena endpoint:', { endpoint: epKey, dataset, update })

    if (!endPoints[epKey]) {
      const epKeyWithSlash = `${epKey}/`
      if (!endPoints[epKeyWithSlash]) {
        throw new Error(`Endpoint ${epKey} not found in trisEndpoint configuration`)
      }
      endPoints[epKey] = endPoints[epKeyWithSlash]
    }

    if (!endPoints[epKey].datasets || !Array.isArray(endPoints[epKey].datasets)) {
      throw new Error(`No datasets configured for endpoint ${epKey}`)
    }

    const allDatasets = endPoints[epKey].datasets.map((o) => o.set)
    if (!allDatasets.includes(dataset)) {
      throw new Error(
        `Dataset ${dataset} not found in endpoint ${epKey}. Available datasets: ${allDatasets.join(', ')}`,
      )
    }

    const index = allDatasets.indexOf(dataset)
    debugLog(debug, 'Available datasets:', allDatasets)
    debugLog(debug, 'Selected dataset index:', index)

    if (!endPoints[epKey].datasets[index]) {
      throw new Error(`Dataset configuration not found at index ${index}`)
    }

    const baseIRI = endPoints[epKey].datasets[index].baseIRI
    if (!baseIRI) {
      throw new Error(`No baseIRI configured for dataset ${dataset}`)
    }

    const tStores = (verb: string) => {
      try {
        debugLog(debug, 'Creating tStores with verb:', verb)
        return endPoints[epKey].datasets.map((ds) => {
          if (!ds.type || !ds.set) {
            throw new Error(`Invalid dataset configuration: ${JSON.stringify(ds)}`)
          }
          const store = {
            type: ds.type,
            value: ds.type == 'sparql' ? normalizeUrl(`${epKey}/${ds.set}/${verb}`) : ds.file,
          }
          debugLog(debug, 'Created store:', store)
          return store
        })
      } catch (error) {
        debugLog(debug, 'Error in tStores:', error)
        throw new Error(`Failed to create stores: ${error.message}`)
      }
    }

    const basicOptionsObject: QueryStringContext = {
      baseIRI: baseIRI,
      sources: new Array(tStores('query')[index]) as [
        QuerySourceUnidentified,
        ...QuerySourceUnidentified[],
      ],
    }

    if (update) {
      debugLog(debug, 'Configuring update mode')
      basicOptionsObject.sources = [tStores('query')[index]] as [
        QuerySourceUnidentified,
        ...QuerySourceUnidentified[],
      ]
      basicOptionsObject.destination = tStores('update').map((o) => {
        return { ...o, type: 'sparql' }
      })[index]
    }

    debugLog(debug, 'Final Jena config:', { options: basicOptionsObject })
    return {
      options: basicOptionsObject,
    }
  } catch (error) {
    debugLog(debug, 'Error in ldflexJenaConfig:', error)
    throw new Error(`Failed to configure Jena endpoint: ${error.message}`)
  }
}

// Configure regular SPARQL endpoints
export function ldflexNonJenaConfig(
  endpoint: URL,
  update: boolean,
): { options: QueryStringContext } {
  const epKey = normalizeUrl(endpoint.href)
  const basicOptionsObject: QueryStringContext = {
    sources: [{ type: 'sparql', value: epKey }] as [
      QuerySourceUnidentified,
      ...QuerySourceUnidentified[],
    ],
    lenient: true,
  }
  if (update) basicOptionsObject.destination = { type: 'sparql', value: epKey }
  return {
    options: basicOptionsObject,
  }
}

// Query execution
export async function executeQuery(
  query: string,
  options: QueryStringContext,
  debug: boolean = false,
): Promise<KeyValueObject | boolean | null> {
  try {
    debugLog(debug, 'Executing query:', query)
    debugLog(debug, 'Using options:', options)

    const engine = new QueryEngine()
    const result = await engine.query(query, options)
    const qRes = await result.execute()
    debugLog(debug, 'Query result type:', result.resultType)

    if (result.resultType === 'boolean') {
      debugLog(debug, 'Boolean result:', qRes)
      return qRes as boolean
    }

    if (result.resultType === 'bindings') {
      const res: KeyValueObject = {}
      const variables = (await result.metadata()).variables
      debugLog(debug, 'Query variables:', variables)

      for await (const bindings of qRes as BindingsStream) {
        for (const variable of variables) {
          const value = bindings.get(variable)
          if (value && value.value !== null) {
            res[variable.value] = value.value
          }
        }
      }
      debugLog(debug, 'Query results:', res)
      return res
    }

    console.error('Unsupported query result type:', result.resultType)
    return null
  } catch (error) {
    debugLog(debug, 'Query error:', error)
    console.error('Query failed:', error)
    return null
  }
}

// Direct query execution (for JENA and non-JENA endpoints)
export async function executeDirectQuery(
  q: string,
  endpoint: URL,
  debug: boolean = false,
  ds?: string,
): Promise<KeyValueObject | boolean | null> {
  const res: KeyValueObject = {}

  try {
    const epKey = normalizeUrl(endpoint.href)
    const sparqlQ = q
    const queryString = `?query=${encodeURIComponent(sparqlQ)}&format=JSON`
    const queryUrl = ds ? `${epKey}/${ds}/sparql${queryString}` : `${epKey}/${queryString}`

    debugLog(debug, 'Executing direct query:', sparqlQ)
    debugLog(debug, 'Query URL:', queryUrl)

    const request = new XMLHttpRequest()
    request.open('GET', queryUrl, false)
    request.send()

    if (request.status == 200) {
      const data = JSON.parse(request.responseText)
      debugLog(debug, 'Query response data:', data)
      if (data['results']) {
        if (data['results']['bindings'].length > 0) {
          const bindings = data['results']['bindings']
          debugLog(debug, 'Bindings:', bindings)
          const variables = data['head']['vars']
          for (const binding of bindings) {
            for (const variable of variables) {
              const value = binding[variable] || binding.get(variable)
              if (value && value.value !== null) {
                res[variable] = value.type === 'uri' ? namedNode(value.value) : literal(value.value)
              }
            }
          }
        }
      } else if (data['boolean']) {
        debugLog(debug, 'Boolean result (ASK):', data.boolean)
        return data.boolean
      } else {
        debugLog(debug, 'No results found for query:', sparqlQ)
        return {}
      }
    } else {
      debugLog(debug, `Problem while querying ${queryUrl} returned statusCode ${request.status}.`)
      console.error(request.statusText)
      return null
    }
  } catch (err) {
    debugLog(debug, `Error running direct query (${err}) with directQuery(${q}) in dataset ${ds}`)
    return null
  }

  debugLog(debug, 'Direct query results:', res)
  return res
}
