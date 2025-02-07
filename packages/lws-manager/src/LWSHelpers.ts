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
  type ThingPersisted,
} from '@inrupt/solid-client'

// Store for session and process data
import { sessionStore } from './stores/LWSSessionStore'; // Import sessionStore
import { processStore } from './stores/LWSProcessStore'; // Import processStore

// Vocabularies
import { RDF, RDFS } from '@inrupt/vocab-common-rdf' // Add RDFS
import { SOLID } from '@inrupt/vocab-solid'

// Types
import type { TypeRegistration, TaskRegistration } from './types/LWSHost.d'
import { TargetType } from './types/LWSHost.d'
import { typeIndexProperties, processClasses } from './vocabularies' // Import typeIndexProperties and processClasses

import LWSProcessHelpers from './LWSProcess';
const { extractTaskNamefromPodURL } = LWSProcessHelpers // Import extractTaskNamefromPodURL

// Fetch data function
export async function fetchData(uri: URL, type: TargetType) {
    switch (type) {
        case TargetType.WebId:
            // Fetch data for WebId
            // Implementation here
            break;
        case TargetType.SparqlEndpoint:
            // Fetch data for SPARQL endpoint
            // Implementation here
            break;
        case TargetType.TurtleFile:
            // Fetch data for Turtle file
            // Implementation here
            break;
        default:
            throw new Error('Unknown type');
    }
    // Return fetched data
}

// Helper function to extract type indexes from things
function extractTypeIndexes(things: any[]): URL[] {
    const typeIndexContainers: URL[] = [];

    things.forEach((thing) => {
        const privateTypeIndexes = getUrlAll(thing, SOLID.privateTypeIndex);
        const publicTypeIndexes = getUrlAll(thing, SOLID.publicTypeIndex);

        console.log(
            `Found ${privateTypeIndexes.length} private type indexes and ${publicTypeIndexes.length} public type indexes.`
        );

        privateTypeIndexes.forEach((index) => {
            typeIndexContainers.push(new URL(index));
            console.log(`Added private type index: ${index}`);
        });

        publicTypeIndexes.forEach((index) => {
            typeIndexContainers.push(new URL(index));
            console.log(`Added public type index: ${index}`);
        });
    });

    return typeIndexContainers;
}

// Function to retrieve type index containers from a WebID
export async function getTypeIndexContainers(webId: URL, reload: boolean = false): Promise<URL[]> {
    console.log(`Fetching type index containers for WebID: ${webId.href}`);
    const webIdKey = webId.href;

    if (!reload && processStore.typeIndexContainers[webIdKey]) {
        console.log(`Returning cached type index containers for WebID: ${webId.href}`);
        return processStore.typeIndexContainers[webIdKey];
    }

    try {
        sessionStore.logDatasetAnalysis(webId.href, 'Fetching type index containers for WebID'); // Log dataset analysis
        const dataset = await getWebIdDataset(webId.href);
        console.log('WebID dataset retrieved successfully.');
        const things = getThingAll(dataset);
        console.log(`Found ${things.length} things in the WebID dataset.`, things);

        let typeIndexContainers = extractTypeIndexes(things);

        if (typeIndexContainers.length === 0) {
            console.log(
                'No type index containers found directly in the WebID dataset. Checking the primary topic resource.'
            );
            for (const property of typeIndexProperties) {
                const primaryTopicUrl = getUrl(things[0], property);
                if (primaryTopicUrl) {
                    sessionStore.logDatasetAnalysis(
                        primaryTopicUrl,
                        `Checking primary topic resource for type index containers, using ${property}`
                    ); // Log dataset analysis
                    const primaryTopicDataset = await getSolidDataset(primaryTopicUrl, {
                        fetch: fetch,
                    });
                    const primaryTopicThings = getThingAll(primaryTopicDataset);

                    typeIndexContainers = extractTypeIndexes(primaryTopicThings);
                    break;
                } else {
                    console.warn(`No ${property} URL found in the WebID dataset.`);
                }
            }
        }

        console.log(`Total type index containers found: ${typeIndexContainers.length}`);
        processStore.typeIndexContainers[webIdKey] = typeIndexContainers;
        return typeIndexContainers;
    } catch (error) {
        console.error('Error retrieving type index containers:', error);
        return [];
    }
}

// Function to update the literal and NamedNode properties from a type registration - returns the registration itself
export async function getPropertiesFromTypeRegistration(
    registration: TypeRegistration
): Promise<TypeRegistration> {
    try {
        sessionStore.logDatasetAnalysis(
            registration.inContainer,
            'Fetching properties from type registration'
        ); // Log dataset analysis
        const dataset = await getSolidDataset(registration.inContainer, { fetch: fetch });
        const things = getThingAll(dataset);
        console.log(`Found ${things.length} things in the container dataset.`, things);

        const literalProperties: string[] = [];
        const uriProperties: string[] = [];

        things.forEach((thing) => {
            console.log(`Inspecting thing:`, thing);
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
        });

        registration.literalProperties = literalProperties;
        registration.uriProperties = uriProperties;
    } catch (error) {
        if (error.statusCode === 404) {
            console.log(`Container ${registration.inContainer} not found (404). Skipping.`);
        } else {
            console.error(`Error accessing container ${registration.inContainer}:`, error);
        }
    } finally {
        return registration;
    }
}

// Helper function to add sub-containers to processStore
export async function addProcessSubContainers(
    webId: URL,
    instanceContainer: string
): Promise<void> {
    try {
        sessionStore.logDatasetAnalysis(instanceContainer, 'Adding sub-containers for process'); // Log dataset analysis
        const dataset = await getSolidDataset(instanceContainer, { fetch: fetch });
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
        processStore.processProviders.push(instanceContainer); // Add container to processProviders array
        console.log(`Added sub-containers for WebID ${webId.href}:`, subContainers);

        // Add task resources for each sub-container
        for (const subContainer of subContainers) {
            await addTaskResources(subContainer);
        }
    } catch (error) {
        console.error(`Error adding sub-containers for WebID ${webId.href}:`, error);
    }
}

// Helper function to add task resources to processStore
export async function addTaskResources(processContainer: URL): Promise<void> {
    try {
        sessionStore.logDatasetAnalysis(
            processContainer.href,
            'Adding task resources for process container'
        ); // Log dataset analysis
        const dataset = await getSolidDataset(processContainer.href, { fetch: fetch });
        const resourceUrls = getContainedResourceUrlAll(dataset);
        const taskResources: Record<string, TaskRegistration> = {};

        for (const resourceUrl of resourceUrls) {
            if (!isContainer(resourceUrl)) {
                sessionStore.logDatasetAnalysis(resourceUrl, 'Fetching task resource'); // Log dataset analysis
                const taskDataset = await getSolidDataset(resourceUrl, { fetch: fetch });
                const taskThing = getThing(taskDataset, resourceUrl) as ThingPersisted;

                let label =
                    extractTaskNamefromPodURL(new URL(resourceUrl), processContainer, false) ||
                    'No label';
                if (taskThing) {
                    label = getStringNoLocale(taskThing, RDFS.comment) || label; // Use RDFS.comment
                } else {
                    console.warn(
                        `Task resource ${resourceUrl} is empty. Using extracted label from URI.`
                    );
                }

                taskResources[resourceUrl] = {
                    label,
                    steps: taskThing ? [] : null, // Use steps instead of tasks
                };
                console.log(`Stored task content for ${resourceUrl}:`, taskResources[resourceUrl]);
            }
        }

        if (!processStore.taskRegistrations[processContainer.href]) {
            processStore.taskRegistrations[processContainer.href] = {};
        }

        processStore.taskRegistrations[processContainer.href] = taskResources;
        console.log(
            `Added task resources for process container ${processContainer.href}:`,
            taskResources
        );
    } catch (error) {
        console.error(
            `Error adding task resources for process container ${processContainer.href}:`,
            error
        );
    }
}

// Function to retrieve type registrations from containers
export async function getTypeRegistrationsFromContainers(
    webId: URL,
    containers: URL[],
    reload: boolean = false
): Promise<TypeRegistration[]> {
    console.log(
        `Fetching type registrations for WebID: ${webId.href} from ${containers.length} containers.`
    );
    const typeRegistrations: TypeRegistration[] = [];

    for (const container of containers) {
        const containerKey = container.href;

        if (
            !reload &&
            processStore.typeRegistrations &&
            processStore.typeRegistrations[containerKey]
        ) {
            console.log(`Returning cached type registrations for container: ${container.href}`);
            typeRegistrations.push(...processStore.typeRegistrations[containerKey]);
            continue;
        }

        try {
            console.log(`Fetching dataset from container: ${container.href}`);
            sessionStore.logDatasetAnalysis(
                container.href,
                'Fetching type registrations from container'
            ); // Log dataset analysis
            const dataset = await getSolidDataset(container.href, { fetch: fetch });
            const things = getThingAll(dataset);
            console.log(`Found ${things.length} things in the container dataset.`);

            const containerRegistrations: TypeRegistration[] = [];

            things.forEach(async (thing) => {
                const types = getUrlAll(thing, RDF.type);
                if (types.includes(SOLID.TypeRegistration)) {
                    const forClass = getUrl(thing, SOLID.forClass);
                    const instanceContainer = getUrl(thing, SOLID.instanceContainer);
                    if (forClass && instanceContainer) {
                        const registration = {
                            forClass,
                            inContainer: instanceContainer,
                            foundIn: container.href,
                        };
                        containerRegistrations.push(registration);
                        typeRegistrations.push(registration);
                        console.log(
                            `Added type registration: forClass=${forClass}, inContainer=${instanceContainer}, foundIn=${container.href}`
                        );

                        // Check if forClass is a processClass and add subContainers to processStore
                        if (processClasses.includes(forClass)) {
                            await addProcessSubContainers(webId, instanceContainer);
                        }
                    }
                }
            });

            processStore.typeRegistrations = {
                ...processStore.typeRegistrations,
                [containerKey]: containerRegistrations,
            };
        } catch (error) {
            console.error(`Error accessing container ${container.href}:`, error);
        }
    }

    console.log(`Total type registrations found: ${typeRegistrations.length}`);
    return typeRegistrations;
}