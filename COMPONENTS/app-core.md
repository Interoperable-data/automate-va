# Application core component

This document describes the *functions* to be provided by the root application. Each function should be modeled as a module. Modules could be replaced by better versions in the future.  

The implementation details are not provided, as these are the choice of any party developing their own application itself. The Agency OPD responsible for the PoC application is considering [Vue3-based custom elements](https://vuejs.org/guide/extras/web-components#building-custom-elements-with-vue).

We use the following prefixes in what follows:

- `PREFIX dul: <http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#>`
- `PREFIX prov: <http://www.w3.org/ns/prov#>`

## User identity provider (UIP)

> Depending on the `org:purpose` of the organisation (see `era:hasRole` for the roles as railway stakeholders), and the role of the user logging in (which is assigned by the organisation itself), certain protection mechanisms can be provided.

The application must provide for the connection to a user authentication system. The returned user authentication token must be verified and can be used to allow access to processes and storage, if a further access token is received (from the same or another system).

Examples: any system providing ID and if needed resource access tokens.

## Process providers: connector & handler

> A process provider (PP) delivers a machine-readable collection of linked data expressing processes, their tasks, detailed per step of each task. A connector connects to this PP, and delivers the IRI's of all processes to the application for further Handling by the Process Handler.

A process provider connection component must return, on successful connection: the [ IRI's of all instances of `dul:Process`|`prov:Plan`]. The process handler will read from these URI's to find the contents of the tasks, the steps therein, and display the required UI elements. As such the user can add and edit datasets in a sequential way, whereby the underlying data model is provided by the process provider (and of no concern to users).

Details: [process-connectors](./process-connector.md), [process-handlers](./process-handler.md).

## Storage provider: connector & handler

The application will store the result of a linked data process at a certain storage provider, to which the organisation has access. Must be foreseen:

- Linked Web Storage (given a WebId, these storage systems return sessions allowing to read and write in the own LWS, while allowing read/write access in other LWS if their WebId has been granted those rights)
- Triple Stores (given a means of authenticating, will allow the same comparable rights, although depending on the triple store implementation, access rights will be managed differently. At the minimum, all data might be publicaly available.)
- File systems (the client application can always provide for a download of the linked data results, in any of the available formats)
- User provided API's (given a means of authenticating, will allow the POSTing of JSON-LD from the application, to an API endpoint, in order to feed into the user's own processes). This requires configurations by the user in a separate manner, to be generally supported by the application.

The storage provider connector will return, on succesful connection, a function to the storage system, which the storage handler can then use. If required for some properties, the handler encrypts the literals first (see below).

## Process Manager

> Any organisation must be able to become a process provider as well. In order to add processes, task and steps to its own storage, the Process Manager can be used.

In essence, the process manager connects to a central process provider and retrieves the process `/create-process/` from there, which contains the tasks and steps needed to correctly add processes to the organisations' storage.

Details: [process manager](./process-manager.md)

## Presenters

> A Presenter is a module which can be called from a process step in order to present the data collected in the process so far in a human readable form. The Presenter uses templates located as readable resources on the web (its URI is a property of the step itself), in which it can copy-paste linked data literals or URI's.

For a template in which data is missing (the literal can not be found or a link not resolved), the user must be able to manually add the data.

The template language should be `Handlebars` or alike.

## Encryptor

> Organisations may prefer to encrypt the value of some literals, before storing it, because data will be stored in public storage systems. The decryption of those literals can then be executed by the organisation itself (using a master key) or by those possessing the private key of the key pair with which the literals were encrypted.

> [!WARNING]
> Encrypted triple literals are evidently unavailable for any search query. Before encrypting literals, it should be examined if privately accessible storage systems are not possible (as for instance provided by LWS).

If the organisation itself is the only one accessing the data, a non-stored master key is used, derived from a master password. Further, client-side encryption mechanisms can then be used to encrypt the literals. An example is elaborated [here](https://blog.cozy.io/en/cozy-cloud-how-to-encrypt-web-application/).

If the organisation wants to share the triple contents with some reserved stakeholders, and the storage provider does not have a function to allow access based on user credentials, the literals may be encrypted by a key, which itself is encrypted using the stakeholder's public key. This mechanism has its disadvantages as well and should be avoided.
