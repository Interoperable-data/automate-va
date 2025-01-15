import { reactive } from 'vue'
import { type QuerySourceUnidentified } from '@comunica/types'
import { type LocationQueryValue } from 'vue-router'
import { getWebIdDataset } from '@inrupt/solid-client'
import { QueryEngine } from '@comunica/query-sparql'

// Comunica engine
const queryEngine = new QueryEngine()

// Define the enum for target types
export enum TargetType {
  WebId = 'webId',
  SparqlEndpoint = 'sparqlEndpoint',
  TurtleFile = 'turtleFile',
}

type LWSAuth = {
  token: string | LocationQueryValue[]
  state: string | LocationQueryValue[]
}

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

export const sessionStore = reactive({
  canReadPODURLs: false,
  ownPodURLs: [], // all the WebId's OWN pod Urls
  selectedPodURL: '', // the WebId's selected pod URL
  loggedInWebId: '', // falsy
  rerouting: false,
  authProvidersSessionData: { inrupt: {} },
  ownStoragePodRoot(): string | null {
    // From https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/
    // returns https://storage.inrupt.com, in order to recreate the RDFSource URIs
    const sp = this.selectedPodURL
    if (!sp) return null
    const tld = sp.substring(0, sp.length - 1).lastIndexOf('/')
    return sp.substring(0, tld)
  },
  addSolidPodAuthData({ token, state }: LWSAuth) {
    // From Inrupt at least, to be checked for the others
    this.authProvidersSessionData.inrupt = { token: token, state: state }
  },
})

// TODO: Continue refactoring the processStore, it must cover:
// 1. The process providers and preferred process containers
// 2. The process/task being selected for execution
// 3. The process/task being edited
// 4. The process/task being executed

/**
 * This process store is used to manage the process providers, its process CONTAINERS and the task RESOURCES
 *  in that container.
 *
 * the processProviders array contains objects conforming to the following structure:
 * {
 *  processContainer: URL, // the BASE URL of the process container
 *  Examples:
 *      https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/ for a Solid Pod
 *      https://endpoint.example.com/ for a custom SPARQL endpoint
 *      file:///path/to/processes/ for a local file system
 *  processContainerName: string, // the name of the process container, for easy identification
 *  processContainerPath: string, // the path of the process container in the Pod (without the Pod URL)
 *  Examples:
 *      `process/` for a Solid Pod, the ending / is MANDATORY, as this MUST be a container.
 *      `sparql`|`query` for a custom SPARQL endpoint, the ending / MUST MANDATORY be absent
 *      `file.ttl` for a local file system, the ending file formal is MANDATORY
 *
 * }
 */
export const processStore = reactive({
  processProviders: [], // Comunica can query several process sources
  taskBeingEdited: '',
  taskURI: '', // pod URI of the process/task which is being selected for execution
  canProcessData() {
    return this.processProviders.length > 0
  },
})

// ---- HELP{ERS} to finish the processStore

/**
 *
 * @param processURI The URI of the process to extract the name from
 * @returns The name of the process
 *
 * Example:
 *   processURI: https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/Organisation/add
 *   processURI: https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/Organisation/
 *   processURI: https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/Organisation --> NOT A CONTAINER!
 *   processURI: https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/ --> NOT even a process!
 *
 *   processContainer: https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/
 *
 *  Returns: `Organisation`
 */
const extractProcessNamefromPodURL = (
  processURI: URL | undefined,
  processContainer: URL | undefined,
  asContainer: boolean,
) => {
  if (!processURI || !processContainer) return null

  const p = processURI.toString()
  const pContainer = processContainer.toString()
  const endPath = p.substring(p.indexOf(pContainer) + pContainer.length) // ['Organisation','add'] or ['Organisation'] if not a Task in the URI

  if (endPath.length === 0) return null
  if (!endPath.includes('/')) return null
  const ptNames = endPath.split('/')
  const endSlash = asContainer ? '/' : ''
  return ptNames[0].length > 0 ? ptNames[0] + endSlash : ptNames[1] + endSlash
}

/**
 *
 * @param taskURI The URI of the task to extract the name from
 * @param processContainer The URI of the process container
 * @param asURLFragment If true, the task is an URL fragment, otherwise it is a resource (without ending slash)
 * @returns The name of the task | null if the URI is not a Task URI.
 *
 * Example:
 *  taskURI: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
 *  or: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask#step5
 *
 * Returns: SecondTask(/)
 *
 * if TaskURI is a Container, ending on /, returns null as Tasks are NEVER stored in Containers.
 */
const extractTaskNamefromPodURL = (
  taskURI: URL | undefined,
  processContainer: URL | undefined,
  asURLFragment: boolean,
): string | null => {
  if (!taskURI || !processContainer) return null

  const p = taskURI.toString()
  const pContainer = processContainer.toString()
  const tsName = p.substring(p.lastIndexOf('/') + 1) // SecondTask or SecondTask#step5. If ending on /, it will be empty
  if (tsName.length > 0) {
    const taskName = tsName.split('#')[0] + (asURLFragment ? '/' : '')
    return taskName
  } else return null
}

/**
 *
 * @param taskURI The Pod URI of the Task resource
 * @param processContainer The URI of the Container containing the Process
 * @param step Optionally, the step being executed in the Task
 * @param asURLFragment If true, the step is an URI fragment, otherwise it is a IRI resource (without ending slash)
 * @returns
 *
 * Example:
 *  taskURI:
 *    https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
 *    https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask/ --> NULL
 *    https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask#stepNumber
 *  processContainer: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/
 *
 * Returns:
 *  TheThirdProcess/SecondTask if step is not given nor present in the taskURI
 *  TheThirdProcess/SecondTask/{stepNumber} if asURLFragment is true, with stepNumber being the step
 *  TheThirdProcess/SecondTask#{stepNumber} if asURLFragment is false, with stepNumber being the step
 */
const extractApplicationPathFromTaskURI = (
  taskURI: URL | undefined,
  processContainer: URL | undefined,
  step: string,
  asURLFragment: boolean,
) => {
  if (!taskURI || !processContainer) return null

  const p = taskURI.toString()
  const pContainer = processContainer.toString()
  try {
    const tag = asURLFragment ? '/' : '#'
    // ['TheThirdProcess','SecondTask'] or ['TheThirdProcess','SecondTask#stepNumber'] or ['TheThirdProcess','SecondTask' , '' if ending on /]
    const ptNames = p.substring(p.indexOf(pContainer) + pContainer.length).split('/')
    if (ptNames.length > 2) return null
    // ['SecondTask','stepNumber'] or ['SecondTask'] if not a step in the URI
    const proposedStep = ptNames[1].split('#')
    if (proposedStep.length == 2) {
      step = proposedStep[1]
      ptNames[1] = proposedStep[0]
    }
    const shURI = ptNames.join('/') + (step ? `${tag}${step}` : '')
    return shURI
  } catch (e) {
    console.error(`extractApplicationPathFromTaskURI(${taskURI}) failed: ${e}`)
    return null
  }
}

/**
 *
 * @param uri The URI to check if it is a WebId
 * @returns True if the URI is a WebId, false otherwise
 */
export async function isWebId(uri: URL): Promise<boolean> {
  try {
    const dataset = await getWebIdDataset(uri.href)
    return dataset !== null
  } catch (error) {
    return false
  }
}

// Generic SPARQL query function
type KeyValueObject = Record<string, string>
export async function querySparql(
  sources: QuerySourceUnidentified[],
  query: string,
): Promise<KeyValueObject | null> {
  try {
    const result = await queryEngine.query(query, {
      sources: sources,
      lenient: true,
    })
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
    }

    // const isAnEndPoint = await queryEngine.queryBoolean(query, options)
    // return isAnEndPoint

    const bindingsresult = await queryEngine.query(query, options);
    return bindingsresult.resultType === 'boolean' // ASK-query. others are 'bindings' | 'quads' | 'boolean' | 'rdfjsSource'
  } catch (error) {
    return false
  }
}

export default {
  fetchData,
  TargetType,
  isWebId,
  isSparqlEndpoint,
  querySparql,
  extractProcessNamefromPodURL,
  extractTaskNamefromPodURL,
  extractApplicationPathFromTaskURI,
}
