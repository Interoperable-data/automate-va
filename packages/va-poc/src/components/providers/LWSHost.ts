import { fetch } from '@inrupt/solid-client-authn-browser'
import {
  getWebIdDataset,
  getThingAll,
  getUrlAll,
  getSolidDataset,
  getThing,
  getUrl,
  getStringNoLocale,
  getContainedResourceUrlAll,
  isContainer,
} from '@inrupt/solid-client'
import { QueryEngine } from '@comunica/query-sparql'

// Vocabularies
import { FOAF, RDF } from '@inrupt/vocab-common-rdf'
import { SOLID } from '@inrupt/vocab-solid'

// Types
import type { QuerySourceUnidentified, QueryStringContext } from '@comunica/types'
import type { TypeRegistration, KeyValueObject } from './LWSHost.d'
import { TargetType, typeIndexProperties, processClasses } from './LWSHost.d'

// Store for process data
import { processStore } from './LWSProcessStore'

// Comunica engine
const queryEngine = new QueryEngine()

// Fetch data function
export async function fetchData(uri: URL, type: TargetType) {
  switch (type) {
    case TargetType.WebId:
      // Fetch data for WebId
      // Implementation here
      break
    case TargetType.SparqlEndpoint:
      // Fetch data for SPARQL endpoint
      // Implementation here
      break
    case TargetType.TurtleFile:
      // Fetch data for Turtle file
      // Implementation here
      break
    default:
      throw new Error('Unknown type')
  }
  // Return fetched data
}

// Helper function to extract type indexes from things
function extractTypeIndexes(things: any[]): URL[] {
  const typeIndexContainers: URL[] = []

  things.forEach((thing) => {
    const privateTypeIndexes = getUrlAll(thing, SOLID.privateTypeIndex)
    const publicTypeIndexes = getUrlAll(thing, SOLID.publicTypeIndex)

    console.log(
      `Found ${privateTypeIndexes.length} private type indexes and ${publicTypeIndexes.length} public type indexes.`,
    )

    privateTypeIndexes.forEach((index) => {
      typeIndexContainers.push(new URL(index))
      console.log(`Added private type index: ${index}`)
    })

    publicTypeIndexes.forEach((index) => {
      typeIndexContainers.push(new URL(index))
      console.log(`Added public type index: ${index}`)
    })
  })

  return typeIndexContainers
}

// Function to retrieve type index containers from a WebID
export async function getTypeIndexContainers(webId: URL, reload: boolean = false): Promise<URL[]> {
  console.log(`Fetching type index containers for WebID: ${webId.href}`)
  const webIdKey = webId.href

  if (!reload && processStore.typeIndexContainers[webIdKey]) {
    console.log(`Returning cached type index containers for WebID: ${webId.href}`)
    return processStore.typeIndexContainers[webIdKey]
  }

  try {
    const dataset = await getWebIdDataset(webId.href)
    console.log('WebID dataset retrieved successfully.')
    const things = getThingAll(dataset)
    console.log(`Found ${things.length} things in the dataset.`, things)

    let typeIndexContainers = extractTypeIndexes(things)

    if (typeIndexContainers.length === 0) {
      console.log(
        'No type index containers found directly in the WebID dataset. Checking the primary topic resource.',
      )
      for (const property of typeIndexProperties) {
        const primaryTopicUrl = getUrl(things[0], property)
        if (primaryTopicUrl) {
          const primaryTopicDataset = await getSolidDataset(primaryTopicUrl, { fetch: fetch })
          const primaryTopicThings = getThingAll(primaryTopicDataset)

          typeIndexContainers = extractTypeIndexes(primaryTopicThings)
          break
        } else {
          console.log(`No ${property} URL found in the WebID dataset.`)
        }
      }
    }

    console.log(`Total type index containers found: ${typeIndexContainers.length}`)
    processStore.typeIndexContainers[webIdKey] = typeIndexContainers
    return typeIndexContainers
  } catch (error) {
    console.error('Error retrieving type index containers:', error)
    return []
  }
}

// Function to update the literal and NamedNode properties from a type registration - returns the registration itself
export async function getPropertiesFromTypeRegistration(
  registration: TypeRegistration,
): Promise<TypeRegistration> {
  try {
    const dataset = await getSolidDataset(registration.inContainer, { fetch: fetch })
    const things = getThingAll(dataset)
    console.log(`Found ${things.length} things in the container dataset.`, things)

    const literalProperties: string[] = []
    const uriProperties: string[] = []

    things.forEach((thing) => {
      console.log(`Inspecting thing:`, thing)
      // FIXME: there seems to be no functions returning the properties themselves.
      // FIXME: const literals = getStringNoLocaleAll(thing, PROPERTY MISSING);
      // FIXME: const uris = getLinkedResourceUrlAll(thing DOES NOT WORK as thing is not resource.);

      // literals.forEach(literal => {
      //   if (!literalProperties.includes(literal)) {
      //     literalProperties.push(literal);
      //   }
      // });

      // uris.forEach(uri => {
      //   if (!uriProperties.includes(uri)) {
      //     uriProperties.push(uri);
      //   }
      // });
    })

    registration.literalProperties = literalProperties
    registration.uriProperties = uriProperties
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`Container ${registration.inContainer} not found (404). Skipping.`)
    } else {
      console.error(`Error accessing container ${registration.inContainer}:`, error)
    }
  } finally {
    return registration
  }
}

// Helper function to add sub-containers to processStore
export async function addProcessSubContainers(webId: URL, instanceContainer: string): Promise<void> {
  try {
    const dataset = await getSolidDataset(instanceContainer, { fetch: fetch })
    const resourceUrls = getContainedResourceUrlAll(dataset);
    const subContainers: URL[] = [];

    for (const resourceUrl of resourceUrls) {
      if (isContainer(resourceUrl)) {
        subContainers.push(new URL(resourceUrl));
      }
    }

    if (!processStore.processRegistrations[webId.href]) {
      processStore.processRegistrations[webId.href] = [];
    }

    processStore.processRegistrations[webId.href].push(...subContainers);
    console.log(`Added sub-containers for WebID ${webId.href}:`, subContainers);
  } catch (error) {
    console.error(`Error adding sub-containers for WebID ${webId.href}:`, error);
  }
}

// Function to retrieve type registrations from containers
export async function getTypeRegistrationsFromContainers(
  webId: URL,
  containers: URL[],
  reload: boolean = false,
): Promise<TypeRegistration[]> {
  console.log(
    `Fetching type registrations for WebID: ${webId.href} from ${containers.length} containers.`,
  )
  const typeRegistrations: TypeRegistration[] = []

  for (const container of containers) {
    const containerKey = container.href

    if (!reload && processStore.typeRegistrations && processStore.typeRegistrations[containerKey]) {
      console.log(`Returning cached type registrations for container: ${container.href}`)
      typeRegistrations.push(...processStore.typeRegistrations[containerKey])
      continue
    }

    try {
      console.log(`Fetching dataset from container: ${container.href}`)
      const dataset = await getSolidDataset(container.href, { fetch: fetch })
      const things = getThingAll(dataset)
      console.log(`Found ${things.length} things in the container dataset.`)

      const containerRegistrations: TypeRegistration[] = []

      things.forEach(async (thing) => {
        const types = getUrlAll(thing, RDF.type)
        if (types.includes(SOLID.TypeRegistration)) {
          const forClass = getUrl(thing, SOLID.forClass)
          const instanceContainer = getUrl(thing, SOLID.instanceContainer)
          if (forClass && instanceContainer) {
            const registration = {
              forClass,
              inContainer: instanceContainer,
              foundIn: container.href,
            }
            containerRegistrations.push(registration)
            typeRegistrations.push(registration)
            console.log(
              `Added type registration: forClass=${forClass}, inContainer=${instanceContainer}, foundIn=${container.href}`,
            )

            // Check if forClass is a processClass and add subContainers to processStore
            if (processClasses.includes(forClass)) {
              await addProcessSubContainers(webId, instanceContainer)
            }
          }
        }
      })

      processStore.typeRegistrations = {
        ...processStore.typeRegistrations,
        [containerKey]: containerRegistrations,
      }
    } catch (error) {
      console.error(`Error accessing container ${container.href}:`, error)
    }
  }

  console.log(`Total type registrations found: ${typeRegistrations.length}`)
  return typeRegistrations
}

// Function to retrieve profile info from a WebID
export async function getProfileInfo(webId: URL): Promise<{ name: string | null }> {
  try {
    const dataset = await getWebIdDataset(webId.href)
    const profile = getThing(dataset, webId.href)

    const name = profile ? getStringNoLocale(profile, FOAF.name) : null

    return { name }
  } catch (error) {
    console.error('Error retrieving profile info:', error)
    return { name: null }
  }
}

// isWebId function
export async function isWebId(uri: URL): Promise<boolean> {
  try {
    const dataset = await getWebIdDataset(uri.href)
    return dataset !== null
  } catch (error) {
    return false
  }
}

// Generic SPARQL query function
export async function querySparql(
  sources: QuerySourceUnidentified[],
  query: string,
): Promise<KeyValueObject | null> {
  try {
    const options = {
      sources: sources,
      lenient: true,
    } as QueryStringContext
    const result = await queryEngine.query(query, options)
    if (result.resultType === 'bindings') {
      const res: KeyValueObject = {}
      const variables = (await result.metadata()).variables
      const bindingsStream = await result.execute()
      for await (const bindings of bindingsStream) {
        for (const variable of variables) {
          res[variable.value] = bindings.get(variable)!.value
        }
      }
      return res
    } else {
      console.error('Query result type is not bindings: ', result.resultType)
      return null
    }
  } catch (error) {
    return null
  }
}

// isSparqlEndpoint function
export async function isSparqlEndpoint(uri: URL): Promise<boolean> {
  try {
    const query = `ASK { ?s ?p ?o }` // SELECT ?s WHERE { ?s ?p ?o } LIMIT 1

    // FIXME: const endpoint = new Array( { type: 'sparql', value: uri.href } )
    const endpoint = new Array(uri.href)
    const options = {
      sources: endpoint,
      lenient: true,
    } as QueryStringContext
    // const isAnEndPoint = await queryEngine.queryBoolean(query, options)
    // return isAnEndPoint

    const bindingsresult = await queryEngine.query(query, options)
    return bindingsresult.resultType === 'boolean'
  } catch (error) {
    console.error('isSparqlEndpoint failed: ', error)
    return false
  }
}

export default {
  fetchData,
  isWebId,
  isSparqlEndpoint,
  querySparql,
  getTypeIndexContainers,
  getTypeRegistrationsFromContainers,
  getPropertiesFromTypeRegistration,
  getProfileInfo,
}
