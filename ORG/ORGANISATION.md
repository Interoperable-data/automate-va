# Organisations

In order to link resources to organisations and contacts, an ontology is needed.

The [Organisation ontology](https://www.w3.org/ns/org#) from W3C MUST be used as extended by the Agency, in order to model all stakeholders.

## Common properties

An internal document can be consulted as an example.

## Specific properties

### ECM

Any organisation which uses a certificate or authorisation to operate, MUST link to that resource in the KG if it exists.

## Individuals

Stored privately and preferably using LWS, each organisation shall also identify individual collaborators who play a role in linked data processes and must be mentioned in the process. These resurces SHOULD be linked to the organisation using the above mentioned ontology (using `org:Membership` and `org:member`).
