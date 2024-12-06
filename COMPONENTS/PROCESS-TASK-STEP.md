# Process - Task - Step

We propose to use linked data descriptions of the collection and management processes as well. This allows to add and manage the way linked data is created using the same methods as by which the data itself is stored.

In order to structure the required data, we require `Process`es, to contain `Task`s, and Tasks to contain `Step`s.

The details of the action are present in the instance of a `Step`. The order of the `Step` within the Task is given by using `rdf:first` in the `Task` and `rdf:rest` in the `Step`, linking to the next `Step` instance. A version can be added to each `Step` as well, to model evolutions of the `Task`.

Each process task must be an instance of `dul:Task` or `prov:Action`, with its steps instances of `dul:Action` or `prov:Activity`. Each step contains several properties allowing a Process Handler to show the step contents, and know where to collect/store the data involved in the step. The processes are instance of `dul:Process`. `Step`s have versions (creating versions of the `Task`), and their sequence can be deduced (usage of `rdf:first`, `rdf:rest`).

The processes, tasks and steps can be created using a Process Manager component. The ontology used for them is also elaborated in [that component](./process-manager.md).

## @base

Depending on the storage systems, the URI's to Processes may be:

- (JENA TS) `http://{JENA-server:port}/#/dataset/{DATASET Containing the Process Task Graphs}/{verb}`, with verbs `[get|data|query|sparql|shacl|update]` as for JENA endpoints;
- (LWS) `https://{LWS-provider}/{Pod-identifier}/{Type Index Path to prov:Action}/{ProcessLabel}/`-container;
- (FILE) `{ProcessLabel}.ttl` with the Tasks grouped in Graphs and the Steps as triples in these graphs.

In all cases:

- Processes should be managed as containers, implemented as `RDF datasets`, LWS storage containers or files.
- Tasks should be managed as `RDF Graphs`, be it through `Graph`s directly or `SolidDataset`s.
- Steps within the tasks are managed as linked data resources, be it through RDF resources or Solid `Thing`s.

## 