# Application core component

This document describes the *functions* to be provided by the root application. Each function should be modeled as a module. Modules could be replaced by better versions in the future.  

The implementation details are not provided, as these are the choice of any party developing their own application itself. The Agency OPD responsible for the PoC application is considering [Vue3-based custom elements](https://vuejs.org/guide/extras/web-components#building-custom-elements-with-vue).

We use the following prefixes in what follows:

- `PREFIX dul: <http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#>`

## User identity provider (UIP)

> Depending on the `org:purpose` of the organisation (see `era:hasRole` for the roles as railway stakeholders), and the role of the user logging in (which is assigned by the organisation itself), certain protection mechanisms can be provided.

The application must provide for the connection to a user authentication system. The returned user authentication token must be verified and can be used to allow access to processes and storage, if a further access token is received (from the same or another system).

Examples: any system providing ID and if needed resource access tokens.

## Process provider connector (PPC)

> A process provider (PP) delivers a machine-readable collection of linked data expressing processes, their tasks, detailed per step of each task. A PPC connects to this PP, and delivers the IRI's of all processes to the application for further Handling by the Process Handler.

A process provider connection component must return, on successful connection: the [ IRI's of all instances of `dul:Process`].

The process handler will read from these URI's to find the contents of the tasks, the steps therein, and display them.

Details: [process-connectors](process-connector.md).

## Storage provider

The application will store the result of a linked data process at a certain storage provider. Must be foreseen:

- Linked Web Storage (given a WebId, these storage systems return sessions allowing to read and write in the own LWS, while allowing read/write access in other LWS if their WebId has been granted those rights)
- Triple Stores (given a means of authenticating, will allow the same comparable rights, although depending on the triple store implementation, access rights will be managed differently. At the minimum, all data might be publicaly available.)
- File systems (the client application can always provide for a download of the linked data results, in any of the available formats)
