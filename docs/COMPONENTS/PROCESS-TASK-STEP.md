# Process - Task - Step

We propose to use linked data descriptions of the collection and management processes as well. This allows to add and manage the way linked data is created using the same methods as by which the data itself is stored.

In order to structure the required data, we require `Process`es, to contain `Task`s, and Tasks to contain `Step`s.

The details of the action are present in the instance of a `Step`. The order of the `Step` within the Task is given by using `rdf:first` in the `Task` and `rdf:rest` in the `Step`, linking to the next `Step` instance. A version can be added to each `Step` as well, to model evolutions of the `Task`.

Each process task must be an instance of `dul:Task` or `prov:Action`, with its steps instances of `dul:Action` or `prov:Activity`. Each step contains several properties allowing a Process Handler to show the step contents, and know where to collect/store the data involved in the step. The processes are instance of `dul:Process`. `Step`s have versions (creating versions of the `Task`), and their sequence can be deduced (usage of `rdf:first`, `rdf:rest`).

The processes, tasks and steps can be created using a Process Manager component. The ontology used for them is also elaborated in [that component](./process-manager.md).

## @base

Depending on the storage systems, the URI's to Processes may be:

- (JENA TS) `http://{JENA-server:port}/#/dataset/{DATASET Containing the Process Task Graphs}/{verb}`, with verbs `[get|data|query|sparql|shacl|update]` as for JENA endpoints;
- (LWS) `https://{LWS-provider}/{Pod-identifier}/{Type Index Path to the Process class}/{ProcessLabel}/`-container;
- (FILE) `{ProcessLabel}.ttl` with the Tasks grouped in Graphs and the Steps as triples in these graphs.

In all cases:

- Processes should be managed as `Graph Containers`, implemented as `Triple Store datasets`, LWS storage containers or files.
- Tasks should be managed as `RDF Graphs`, be it through `Graph`s directly or [`SolidDataset`](https://docs.inrupt.com/developer-tools/javascript/client-libraries/reference/glossary/#term-SolidDataset)s. Tasks are the RDF resources inside of the process file.
- Steps within the tasks are managed as linked data resources, be it through RDF resources or Solid `Thing`s.

## Examples

- (JENA TS) The JENA dataset endpoint above will contain a named GRAPH for Task T, which contains all triples grouped per Task Step.
- (LWS) The Solid Pod Container above will contain the Task SolidDataset `taskname`, in which the Solid `Thing`s are the steps of the Task.
- A file process.ttl will contain graphs per Task, in which each step is a named resource.

## Use case: Registers

The EU Agency for Railways is a process provider on data registers which exist under the Safety and Interoperability Directives.

The Agency is hence required - via the legislation on several so-called Registers - to manage data as provided by several stakeholders and has defined a common `era:` ontology in order to allow interoperability between processes in which this data is used. The current proof of concept allows stakeholders, mainly NoBos and Manufacturers to run the data gathering and maintaining processes as a set of forms which are defined by the Agency on its own Solid Pod, hence being a Process provideer to those stakeholders. The stakeholders log into their own Pod and can access the processes as provided, be it because they are public, or because their WebId has been allowed access by the Process Provider.

As a general example of a process which is always available, all stakeholders have public access to read the process `/Organisation` and the several tasks therein, like `/add`, `/addSite`, `/addUnit`, and `/addPost`. In the Agency's Solid Pod, each task is stored as a Solid Dataset within the `/process/Organisation`-container:

- [X] The general process is stored under Container `https://{STORAGE PROVIDER}/{STORAGE_ID}/process/Organisation/`;
- The tasks are stored as datasets:
  - [X] `https://{STORAGE PROVIDER}/{STORAGE_ID}/process/Organisation/add`
  - [ ] `https://{STORAGE PROVIDER}/{STORAGE_ID}/process/Organisation/addSite` (foreseen)
  - [ ] `https://{STORAGE PROVIDER}/{STORAGE_ID}/process/Organisation/addPost` (not yet foreseen)
  - [ ] `https://{STORAGE PROVIDER}/{STORAGE_ID}/process/Organisation/addMember` (idem)
  - [ ] `https://{STORAGE PROVIDER}/{STORAGE_ID}/process/Organisation/addAgent` (idem, requires connection to separate identity provider)
  - [ ] `https://{STORAGE PROVIDER}/{STORAGE_ID}/data/Organisation/` (showing the data allows to edit it)
- [X] The steps of the task are stored as Things in the dataset, and contain themselves the contents to visualise or manage of that step.
- [X] All steps have a `schema:version`, such that the user can choose between task versions, and the process provider can add new versions of tasks on the fly.
- [X] All task steps with a SHACL-Form will store the outcome into an UPDATED Dataset in the Pod of the process user (with a small set of triples added also at the Provider for search objectives using `owl:sameAs`). The action depends on the Task properties, but in general, Things should always be the first to appear or `dct:replaces` a previous Thing.

## Contents of a Task description Thing

An instance of `http://www.w3.org/ns/ldp#RDFSource` which is also a `dul:Task` holds the administrative data of the Task, like the Label (under `rdfs:comment`), and the person to contact for questions under `vcard:hasEmail`.

- [X] The steps are chained using `rdf:rest` within the step, and all first tasks (no matter their version) are present on the Tasks descriptor Thing [Example](https://{STORAGE PROVIDER}/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/Organisation/add) under the property `rdf:first`.
- [X] The rules to construct the URI of where the outcome must be stored (for LWS, eg. within which user's `/data/` subcontainer) is a property of a step with SHACL-Form, it is expressed using a `dcterms`-property.

## Contents of a step Thing

A Step will be of `rdf:type`: `http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Action`.

For the example `/Organisation/add#uuid`, the step Things have the properties:

- `rdfs:comment`: not used.
- `http://purl.org/dc/elements/1.1/description` | `http://purl.org/dc/terms/description`: a long explanation of the step, always shown as intro before the form. Examples:
  - (/add) "Add your organisation's data, including sites where legally located and contact address."
  - (n/a) "Add a department, unit or other part of the organization that in itself is not a legal entity on its own. Will link an instance of org:OrganizationalUnit to the selected Organisation."
  - (/addSite) "Add a location in which an Organisation or Unit is taking residence. The site can be linked to the organisation or unit using the LinkSiteToOrganisation task."
  - (n/a) "Link a site to any organisation or unit. Available links are org:hasSite, org:hasPrimarySite (contact address) and org:hasRegisteredSite (legally registered address)."
- `rdfs:label`: the short title of each task
- `http://schema.org/version`: the version of the task this step belongs to.
- `http://purl.org/dc/terms/source` for the SHAPE of the form to show, which must be stored in a readable container of the process.
- `rdf:rest` links the task step to the next one (unique in one version)
- If a Shape File is used, the Step must indicate where to store the resulting triples, and the URI of the shapefile must also be stored in the data triples, for easier viewing of the data triples.

## Storage, append|write

Processes have at least the following 3 objectives:

1. to collect and manage data about registered resources as RDF expressed using the process provider's ontology.
2. to convert data in RDF into lists, reports, documents (for analysis and presentation)
3. to be findable by search action, as started from the Process Provider.

The data collected by tasks in the process `https://{STORAGE PROVIDER}/{STORAGE_ID}/process/:Process/`, will always be `https://{STORAGE PROVIDER}/{STORAGE_ID}/data/:ProcessAbbreviated/{taskStorageContainer/}{subject}#uuid`, whereby the `#uuid` is generated by SHACL form and the `taskStorageContainer` is determined/calculated by the Task Step in which it is stored. The subject is defined by the step under a property.

We propose: `ProcessAbbreviated = LOWERCASE(if no CamelCase is used ? full process name  : CamelCase capitals only)`

### Example

- `/Organisation` store data in:
  - `/data/organisation/org#uuid` for (Formal)Organisation(alUnit);
  - `/data/organisation/site#uuid` for Sites;
  - `/data/organisation/post#uuid` for Posts;
- `/CertificationLevelDocuments` store data in:
  - `/data/cld/{YEAR}/{MODULE}/{SUBSYSTEM}/cld#uuid`, whereby the Conditions & Limits of Use are stored under:
  - `/data/cld/{YEAR}/{MODULE}/{SUBSYSTEM}/clou#uuid`, whereby the technical file COULD be stored under:
  - `/data/cld/{YEAR}/{MODULE}/{SUBSYSTEM}/nobofile#uuid`.
 
The steps collecting data for the `CertificationLevelDocuments`-process, must define the pattern `{YEAR}/{MODULE}/{SUBSYSTEM}` using the properties of the triple data which contain these literals.
