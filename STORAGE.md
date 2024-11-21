# Storing the confidential aspects of applications

## Introduction

It is vital to combine the automation of assessments with the existing confidentiality requirements. As such, any stakeholder executing assessments may not share, and hence is required to store in a private manner:

- any assessment comment added to an application of a vehicle type
- any metadata added to any of the (documents in the) submitted files
- the contents of any of the files in the Library or any data belonging to an OSS Application.

This hard requirement has some technological consequences, given the combination with linked open data as described [here](TECHNOLOGY.md). We give an overview of possible storage solutions and clarify important consequences of these choices.

## Using a backend database

It is evidently possible to store confidential data in a proprietary database, run at the premises of the assessor. Several disadvantages however exist:

- the stakeholder cannot (simply) share the data with other allowed stakeholders, who need the work to be reused as well.
- the data interface layer of the internal application requires CRUD operation on a proprietary database, next to accessing routins for KG's: at least two interfaces are then to be supported.
- the backend database itself requires maintenance and results in an extra operational cost, which only increases when external access by authorised stakeholders is needed.

> [!NOTE]
> Running database servers with external access is a complication on its own and does not reduce the operational cost of these systems.

When working already with the Linked Open Data from the Agency, it could be recommended to store the private data also inherently as linked data, open to stakeholders who (also) need it.

> [!CAUTION]
> External stakeholders may not be allowed to use login data for the database directly and hence complicated authorisation mechanisms allowing to do so are to be put in place.

## Using a private triple store

One such solution requires the installation and maintenance of a private instance of a triple store, which also would enable the storage of linked data. But several disadvantages still exist:

- the ontology must be shared with other stakeholders for them to be able to read from this triple store. Updates to the ontology would require renaming operations in all the private triple stores.
- authentication on a triple store is not simple, because access is to be configured per dataset or even on lower levels. This is supported only by a few high-end triple store products.
- the cost on maintaining and operating a local TS is about the same as running database servers, but it requires additional levels of knowledge on RDF and TS security.

> [!WARNING]
> Apart from the same complication as above and the increased complexity in most triple store implementations to authenticate and give access to only a subset of triples, there is a contradiction in hosting separate triple stores for central authenticated access from outside.

Only when the stakeholder already has invested in RDF representations of his data, the private triple store may already be present and may then evidently be used.

> [!TIP]
> If an API already exists at the premises of the stakeholder, a Triple Store is not needed if the data can be presented as [JSON-LD](https://json-ld.org/) or [any other linked Data presentation format](https://data.europa.eu/en/academy/incorporating-open-data-your-application).

## Storing and exchanging private data using Linked Web Storage

An ideal solution should be built on open data, with a rigourous access model built in. Teams inspired by an original idea from Sir Tim Berners-Lee, have provided a solution based on this vision which could be examined by the stakeholders of automating OSS assessments: Linked Web Storage vaults, usually called Solid Pods[^solid].

### [What are Linked Web Storage pods](https://www.w3.org/groups/wg/lws/)

Linked Web Storage pods are explained [here](https://www.inrupt.com/videos/what-is-a-solid-pod) and the formalisation of the technology is handled a the [Linked Web Storage WG of W3C](https://www.w3.org/groups/wg/lws/).

In essence, this personal online data storage allow structured and unstructured resources to be stored in the area of control of the stakeholder (a person or organisation), whereby he/she alone is able to control precise access to this data.

### Approach

The architectural consequence of using these Pods are:

- each stakeholder could create, in its Organisational Pod,  a Container 'Applications', in which (per vehicle type) another Container will store the metadata of its assessments, per file. We explain below why this Container should not regroup applications.
- These containers within the 'Applications' Container are only available for the stakeholder themselves, to execute [CRUD operations](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/read-write-data/) on. These CRUD operations are all described in the [Requirements](REQUIREMENTS.md).
- The data is stored using the Agency's [common ontology for Authorisations](ERA_KG.md), such that other applicable stakeholders can retrieve the data as well, if at least given access.

> [!TIP]
> You are invited to collaborate on this ontology for Authorisations by forking its Github repository.

- If another stakeholder requires to look up information on files submitted in his applications, he can be given access to the data in the relevant Container (Vehicle Type based). Based on the hash of the file, the metadata and remarks can be shared. No other data can be shared.

### Proposed Containers

After creation of the Pod by each stakeholder wishing to automate the authorisation process, a [certain structure](https://docs.inrupt.com/ess/latest/services/service-pod-storage/#pod-storage-resource-container) of Containers must be chosen in common. The root container should be called in common, we propose '/data/applications'. Then, there is a choice to make regarding the lower Containers holding the confidential data, only accessible for allowed (other) stakeholders.

``
https://{CSS/ESS Storage Provider Domain}/{Unique Root Container}/data/applications/{VehicleType}/files#{file-hash}
``

> [!WARNING]
> The EU Legislation does not allow data of an Application to be shared, which leads to the constraint that no containers per application are allowed. Access to individual applications and what they hold as information is not allowed explicitly.

The legislation does however not prohibit that authorising entities work efficiently and reuse observations and facts about files submitted in Applications. This means that data about individual files, when having been reused in applications and only when added by authorised stakeholders themselves, can be shared in principle if the annotating stakeholder agrees on this sharing.

> [!IMPORTANT]
> The data added by stakeholders is limited to observation comments, a check on the dates, the scope and applicability. No contents of the file are allowed to be annotated again, unless the data is on public registers like ERADIS or ERATV. Not even the filename is stored in the vehicle type Containers.

As stakeholders on Authorisations will generally work on vehicles belonging to the same type, we propose the LWS Container to be named after the Vehicle type. The dataset within this container will then contain instances (`Thing`s) in a [`SolidDataset`](https://docs.inrupt.com/developer-tools/javascript/client-libraries/structured-data/#structured-data) belonging together.

The structure of the open data with strictly controlled access will be documented as discussed above.

[^solid]: Until very recently named "Solid Pods", W3C wishes to avoid standardising the technology using the [Solid Project](https://solidproject.org/about)'s name. The Solid name also has competition with SolidJS and other technologies.
