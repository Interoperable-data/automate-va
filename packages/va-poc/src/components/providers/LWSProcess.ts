// ---- HELPERS to finish the processStore

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

export default {
  extractProcessNamefromPodURL,
  extractTaskNamefromPodURL,
  extractApplicationPathFromTaskURI,
}