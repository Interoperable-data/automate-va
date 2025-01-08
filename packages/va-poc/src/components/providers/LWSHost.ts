import { reactive } from "vue";
import { type LocationQueryValue } from "vue-router";
type LWSAuth = {
  token: string | LocationQueryValue[];
  state: string | LocationQueryValue[];
};

export const sessionStore = reactive({
  canReadPODURLs: false,
  ownPodURLs: [], // all the WebId's OWN pod Urls
  selectedPodURL: "", // the WebId's selected pod URL
  loggedInWebId: "", // falsy
  rerouting: false,
  authProvidersSessionData: { inrupt: {} },
  ownStoragePodRoot(): string | null {
    // From https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/
    // returns https://storage.inrupt.com, in order to recreate the RDFSource URIs
    const sp = this.selectedPodURL;
    if (!sp) return null;
    const tld = sp.substring(0, sp.length - 1).lastIndexOf("/");
    return sp.substring(0, tld);
  },
  addSolidPodAuthData({ token, state }: LWSAuth) {
    // From Inrupt at least, to be checked for the others
    this.authProvidersSessionData.inrupt = { token: token, state: state };
  },
});

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

// TODO: HELP{ERS} to finish the processStore
export const extractProcessName = (processURI: URL) => {
  // FIXME: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/ can not be assumed!

  // https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/Organisation/add
  // returns '/Organisation'
  if (!processURI) return null;
  let p = processURI.toString();
  const identifier = "/process/";
  const pName = p
    .substring(p.indexOf(identifier) + identifier.length)
    .split("/");
  console.log(`extractProcessName(${processURI}): ${pName[0]}`);
  return `/${pName[0]}`;
}

export const shorthandForProcessURI = (processURI:URL) => {
  // FIXME: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/ can not be assumed!
  // https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/
  // Returns TheThirdProcess/
  if (!processURI) return null;
  let p = processURI.toString();
  const shortHURI = p.substring(
    p.substring(0, p.length - 1).lastIndexOf("/") + 1
  );
  // console.log(`shortHURI() generated: ${shortHURI}.`)
  console.log(`shorthandForProcessURI(${processURI}): ${shortHURI}`);
  return shortHURI;
}

// TODO: Continue refactoring the processStore, it must cover:
// 1. The process providers and preferred process containers
// 2. The process/task being selected for execution
// 3. The process/task being edited
// 4. The process/task being executed

export const processStore = reactive({
  processProviders: [], // Comunica can query several process sources
  taskBeingEdited: "",
  taskURI: "", // pod URI of the process/task which is being selected for execution
  canProcessData() {
    return this.processProviders.length > 0;
  },
  shorthandForTaskURI(taskURI) {
    // Given: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns SecondTask and NEVER SecondTask#0 if a step is present.
    if (!taskURI) return null;
    let p = taskURI;
    const shorthandForTaskURI = p.substring(p.lastIndexOf("/") + 1);
    console.log(`shorthandForTaskURI(${taskURI}): ${shorthandForTaskURI}`);
    return shorthandForTaskURI;
  },
  extractProcTaskAppPath(taskURI, step) {
    // Given: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns TheThirdProcess/SecondTask/{step}
    // and NOT TheThirdProcess/SecondTask#{step}
    if (!taskURI) return null;
    let p = taskURI;
    const identifier = "/process/";
    const shURI =
      p.substring(p.indexOf(identifier) + identifier.length) + `/${step}`;
    console.log(`extractProcTaskAppPath(${taskURI}): ${shURI}`);
    return shURI;
  },
  extractProcTaskResource(taskURI, step) {
    // Given: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns TheThirdProcess/SecondTask#{step}
    let p = taskURI;
    const identifier = "/process/";
    const shPTURI =
      p.substring(p.indexOf(identifier) + identifier.length) +
      (step ? `#${step}` : "");
    console.log(`extractProcTaskResource(${taskURI}): ${shPTURI}`);
    return shPTURI;
  },
});
