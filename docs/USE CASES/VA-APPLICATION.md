# Use cases for Vehicle (Type) Authorisations (VTA)

Source: EULEX PAVA

Main objectives: any process/application which supports the submission of an application for VTA, its automatic checks and the preparation of the reports necessary to sign the VTA.

## Parameters

> [!IMPORTANT]
> This document is an incomplete draft, to be reviewed by the working party.

## Presentation

The presentation of VTA applications, the related reports/check lists and VTA's themselves is out of scope of this document.

## Subscriptions

The creation of a VTA Application by a Requesting Body to an Authorising Entity (the Permitting Body) is notified to the latter and inversely, the publication of the VTA is notified to the first. Within the process, if additional comments are to be provided in the scope of some submitted document, a notification SHOULD be sent to the party to provide them.

## Core Use cases

### Issue a new VTA Application (private only)

URI: `/process/vtaa/add`

Display a sequence of forms, for private storage of the VTAA:

- Administrative organisational data: **links** to Applicant, involved subsystem NoBo's, DeBo's and AsBo's.
- Administrative contact data: **link** to the `foaf:Person` of the applying organisation, who serves as 'General Contact'. The user should be able to add this info to the [internal organisation](../ORG/ORGANISATION.md) graph.
- VTA `vpa:Case`s (of a SKOS-defined `vpa:permissionType`), each with a precise `vpa:Scope` (a VehicleType and a VehiclesCollection), a statement on the adequacy of the selected VTA case, the language used and the project name. The record in EVR of each vehicle number present in the VehiclesCollection is verified through an API to be provided.
- If applicable, a link to a pre-engagement resource.
- A separate listing on the applicable rules (linking to ERALEX instances where possible)
- The required 'Sets of Evidence' for the VTA case, as now implemented in 'OSS Documentation'. This collection is a `DocumentsCollection`, consisting of links to resources, and if needed, files. Each instance in the collection SHOULD be provided with extra property values for data reuse in the automated process.
- The required 'Mapping tables'.

Data available through links is not repeated in the VTA Application. Example: all the VehicleType related info, including the Holder must be retrieved through that `Source`.

### Update an existing VTA Application (private only)

URI: `/process/vtaa#update`

A limited amount of properties can be changed without the need to re-apply. Also, documents can always be added to the 'Sets of Evidence'.

If an VTAIssue-dialogue has been created, the applicant can always add a reply, which is notified to the Authorising Entity.

### Assess a VTA Application

> [!CAUTION]
> Assessment reports and check lists are to be generated automatically by integrating the submitted linked data above. Assessment should be limited to editing the literals as displayed in these presentations and should NOT require any process to be run separately.

### Signing a VTA Application Check, Assessment, Recommendation, Conclusion and Decision

These presentations SHOULD be signed using a `Verifiable Credential` on the data which uniquely defines it (given the presentation itself is not linked data). Both the integrity as the authority to sign should be embedded in the digital signature.

In order to avoid some `foaf:Agent` of an Authorising Entity to sign out of his/her authority, the organisational data should make use of `org:Membership` and `org:Role`. These roles can then be used to allow the Agent to execute the 'Signing'-use case.

### Other use cases

To be examined.

## Machine-to-machine cycle

> Idea launched 17/12/2024 - non-formalised

1. Applicant client sends data on VVTAApplication and its contained library (`era:DocumentSet`) to a SPARQL-endpoint. In any case, the DocumentSet contains only links to ECDeclarations, as the underlying certificates are referenced.
2. A notification is sent to an ERA listener.
3. The listener launches SHACL-validation on the added triples and returns:
   1. The SHACL-validation report
   2. A proposed DC2T, for the Applicant to confirm by sending it back (with some authentication token added)
   3. If non-blocking validation, the draft assessment reports (Completeness, Detailed, Proposed Recommendation)
4. The creation of the assessment triples causes another Notification to be sent to the ERA Decision Maker.
5. On reception of the signed DC2T, the DM can sign the Recommendation and proposed Authorisation.
