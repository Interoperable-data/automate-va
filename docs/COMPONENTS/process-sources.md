# Sources available for the Proof Of Concept

As discussed in the context of the [process handler](./process-handler.md), users need the ability to easily add URI's to other resources when filling out forms. To that end, `Sources` must be made available to the user to retrieve these URI's by searching for literal values in the instances.

In this document, we list sources which users of the `va-automate-poc` application may need to consult.

> [!IMPORTANT]
> Sources are an inherent part of processes, and must therefore be encoded in the process description resource! As described in [process manager](./process-manager.md), the sources are made explicit in the `Task` resource.

## Organisations

> Organisations are quoted as URI's in several use cases: `VehicleTypeAuthorisation`:`Applicant`, `CLD`:`NoBo`, `Applicant`, etc...

Currently not available as linked data.

Given rules on GDPR, organisational data should be managed preferably using LWS owned by the organisations. If not feasible, the Agency should collect the organisational data in its own LWS, and make it available to stakeholders requiring citations towards organisations.

Experimental [EUAR's LWS](https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/data/organisation/org).

See also: [Organisations](../ORG/ORGANISATION.md).

## Agents

> Agents are quoted as URI's in some use cases and need to be stored in the same datasets as above.

Use of `foaf:`, `org:` and its classes and properties is strongly recommended in order to model this aspect of an organisation.

## Legislation

> Legislation is quoted mostly in the context of CLD's (`dct:coverage`) as they are the link to Requirements. Some Requirements will also link to underlying SKOS Concept Schemes, `vpa:section`s of these Requirements.

Internally mostly available as linked data (JENA/ERALEX).

Experimental [EUAR's LWS](https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/data/requirements/eralex).

## Subsystems and their IC's

Internally available as linked data (JENA/ERALEX).

Experimental IC-list [EUAR's LWS](https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/data/requirements/ics)
Experimental SS-list [EUAR's LWS](https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/data/requirements/sss)
