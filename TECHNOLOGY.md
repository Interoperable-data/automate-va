# Technologies: lessons learnt

This document wants to support the decision making process in order to maximally take into account the experience of the EU Agency for Railways when developing the VA Inspector. It proposes a certain open architecture which would allow other stakeholders to use VA automation as easily as possible on their own premises, without forcing large and costly infrastructural needs.

## Confidentiality requirements

Data associated with a VA application in OSS can in fact only be shared with specific assigned role holders (assessors, pm, qm, dm).

Can nevertheless be considered public information and is allowed in knowledge graphs:

- The information in ERADIS regarding interoperability documents like declarations and underlying certificates
- The public ERATV data
- Therefore: the link with vehicle types and the certification material used.

Regarding vehicles, some authentication is required in order to learn:

- vehicles authorised by type and the declarations of verification linked to this.

In conclusion, all data enabling to link (numbers of) vehicles with the underlying certification material should require some authentication.

## Architecture in production

- Storage of OSS information in XML files, extracted on a server backend, close to OSS.
- Storage of ERADIS data (interoperability documents) in a local Apache JENA knowledge graph (which will become public after consultation)
- nodejs express API which supports several requests to send the XML and linked data to internal front-end applications and which allows some administrative operations
- nodejs vue3 frontend which executes all functions as mentioned in this repository.
- internal authentication through the user system, all assessors are able to reuse each other's data.

## Recommendations

### Data collection, caching and storage

- Use the OSS API to locally collect all the relevant data on the Library and application authorisation cases. Cache but do not store this data separately.
- For ERADIS' IO documents, use the available KG's, which will need to be extended with the file hashes. This allows assessors to easily collect the data of ERADIS, based on OSS files.
- For ERATV data, idem.

The Agency's OPD Unit examining available technologies is examining the Solid Project technology, as detailed [here](STORAGE.md) in order to store the confidential info, which nevertheless may need to be shared with colleagues.

### UI

- Even if front-end frameworks can speed up the delivery of the UI, we would currently recommend to build the web application with pure Javascript, HTML and CSS.
- Any reactive front-end framework should not locate in the UI-components any of the retrieval and analysis functions.
- The retrieval and assessment reconstruction functions should preferably be grouped in a separate codebase, which can be placed between the KG's and the front-end.
- The visualisation and editing functions could be placed in reactive components, but when using HTMX and implementing the codebase above as a HTML-returning API, this could be avoided.

In summary, the following approach seems to lead to the most reusable operation between authorising entities with a maximal cost reduction in developing the interfaces:

- Use the linked data knowledge graphs of the Agency for ERADIS and ERATV data. See below for libraries enabling i/o without SPARQL.
- Use the OSS API for the data related to applications. A document will be made available with the supported endpoints.
- Design a _common_ RESTFUL API in order to translate the collected data into HTML fragments.
- Use HTMX in the frontend to collect these HTML fragments, and update the data in a KG with authentication, using Solid Pods.

### Use linked data to the fullest

The generation of the assessment (and all checks involved) is possible in an OPEN way, if data from the applications is stored as RDF, upon which SHACL or SHEX shapes are validated. Recommendations regarding the approach are in a [separate recommendation](STORAGE.md) in this repository.
