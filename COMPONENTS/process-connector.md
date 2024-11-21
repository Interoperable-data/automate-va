# Process Connector

> A `Process Connector` tries to read from a location on the WWW where processes are provided by a process provider. If needed, the Connector will first authenticate, and use that authentication token to access the processes.

Another [Process Manager component](./process-manager.md) supports adding and editing processes/tasks/steps for that PP.

The connector returns, for storage and usage:

- [SolidDatasets complying to the Process interface] if the contents can be read;
- [] if no processes are available to read from.

## Connectors' locations

The following `Repositories` for process resources must be supported:

- Linked Web Storage (Solid Pods)
- Triple Stores
- Files containing linked data

### Linked Web Storage

Given a WebId of the Process Provider, the PPC MUST look for the [Public Type Index](https://solid.github.io/type-indexes/index.html#public-type-index) for `Process`-instances (class `dul:Process`|`prov:Plan`), and retrieve the processes from there. For protected processes, the Connector must use the authentication token from the WebId requesting access to the processes.

This means the steps' contents are then available under:

```sql
<https://{LWSRootContainer/}{ProcessRootContainer/}{ProcessContainers[index]/}{TaskDatasetName}#{uuid of the Thing-step}>

WHERE (in the Pubic Type Index dataset):
<> a solid:TypeRegistration ; 
   solid:forClass dul:Process , prov:Plan ;
   solid:instanceContainer <ProcessContainer> . 
```

Processes will be located in a [`LDP:Container`](https://www.w3.org/TR/ldp/#ldpc-container), while the tasks will be [`LDP:RDFResource`](https://www.w3.org/TR/ldp/#dfn-linked-data-platform-rdf-source) in that container.

To use Solid terminology: steps will be `Thing`s in the Task `SolidDataset`, located in the Process `Container`. The steps' details will be in the triples of the `Thing`, which can be:

- added using Inrupt's [`thing/add`](https://docs.inrupt.com/developer-tools/api/javascript/solid-client/modules/thing_add.html#functions)-library or via `shacl-form`.
- retrieved using Inrupt's [`thing/get`](https://docs.inrupt.com/developer-tools/api/javascript/solid-client/modules/thing_get.html)-library.

The PPC, if implemented with LWS, will hence return: `https://{LWSRootContainer/}{ProcessRootContainer/}[{ProcessContainers/}]`, for all processes.

### Triple Stores

Given the URI of the endpoint containing the process task steps.

The process could be a Graph, or instances of `dul:Process`. Tasks should be members of the graph, or linked to the process using `TBD`. Steps are linked to tasks, using `DUL:isExecutedIn`.

### Files

RDF files containing the process, tasks and steps online can also be connected to. The files can be available locally or on the web.
