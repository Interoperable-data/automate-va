# Use cases for Vehicle (Type) Authorisations (VTA)

Source: EULEX PAVA

Main objectives: any process/application which supports the submission of an application for VTA, its automatic checks and the preparation of the reports necessary to sign the VTA.

## Parameters

> [!IMPORTANT]
> This document is an incomplete draft, to be reviewed by the working party. It serves only to implement the PoC.

## Subscriptions

The creation of a VTA Application by a Requesting Body to an Authorising Entity (the Permitting Body) is notified to the latter and inversely, the publication of the VTA is notified to the first. Within the process, if additional comments are to be provided in the scope of some submitted document, a notification SHOULD be sent to the party to provide them.

## Core Use cases

### Issue a new VTA Application (private only)

URI: `/process/VehicleAuthorisation/addC2T`

Display a sequence of forms, for private storage of the VTAA:

- Administrative organisational data: **links** to Applicant, involved subsystem NoBo's, DeBo's and AsBo's.
- Administrative contact data: **link** to the `foaf:Person` of the applying organisation, who serves as 'General Contact'. The user should be able to add this info to the [internal organisation](../ORG/ORGANISATION.md) graph.
- VTA `vpa:Case`s (of a SKOS-defined `vpa:permissionType`), each with a precise `vpa:Scope` (a VehicleType and a VehiclesCollection), a statement on the adequacy of the selected VTA case, the language used and the project name. The record in EVR of each vehicle number present in the VehiclesCollection is verified through an API to be provided.
- If applicable, a link to a pre-engagement resource.
- A separate listing on the applicable rules (linking to ERALEX instances where possible) is not

### Collect Evidence

URI: `/process/VehicleAuthorisation/addEvidenceToApplication`

Compile reusable collections of evidence documents, and link them to an application.

- The required 'Sets of Evidence' for the VTA case, as now implemented in 'OSS Documentation'. This collection is a [`era:DocumentSet`](http://data.europa.eu/949/DocumentSet) (subClassOf `vpa:Evidence`), consisting of links to resources, and if needed, files. Each instance in the collection SHOULD be provided with extra property values for data reuse in the automated process.
- The required 'Mapping tables'.

Data available through links is not repeated in the VTA Application. Example: all the VehicleType related info, including the Holder must be retrieved through that `Source`.

```js
erava:myDEBOEvidenceForPlatformA a era:DocumentSet ; # subClassOf vpa:Evidence
  dcterms:description "These are all the DeBo documents we can reuse in the platform A approvals" ;
  vpa:checked [ a vpa:Compliance ; ] # SHOULD contains all details of what was checked exactly, as it is not in the members (of which we only know the identifier strings)
  vpa:supportsScope eratv:vt-myVehicleType ; # These typically are in section 2.1 of the type.
  rdfs:member [
    a vpa:EvidenceDocument ;
    rdfs:label “DE008/1/SB/2024/RST/DE/RST-20056/V01”
  ] , [
    a vpa:EvidenceDocument ;
    rdfs:label “004/1/NNTR/2023/CCO/DE EN/3708.1U/V01”
  ] , [
    a vpa:EvidenceDocument ;
    rdfs:label “004/1/NNTR/2023/CCO/DE EN/3708.1/V01”
  ] , [
    a vpa:EvidenceDocument ;
    rdfs:label ”004/1/NNTR/2023/CCO/DE EN/3708.2/V01”
  ] .

erava:myECDeclarationsforPlatformA a era:DocumentSet ; # subClassOf vpa:Evidence
  rdfs:label "ECDs for Platform A"@en ;
  dct:description "These are all the EC Declarations we can reuse in the platform A approvals"@en ;
  # vpa:checked [ a vpa:Compliance ; vpa:checkedRequirement <TSI> ; ] is NOT needed, given dcterms:coverage <> of the ECDs.
  vpa:submittedFor erava:my_app ;  # the link between an application and the evidence submitted
  rdfs:member eradis:ecd-ecDecl-29745 , eradis:ecd-ecDecl-27125 , eradis:ecd-ecDecl-18025 .

erava:mySpecificCertificatesForPlatformA a era:DocumentSet ; # subClassOf vpa:Evidence
  rdfs:label "Specific Pantograph CLD for Platform A"@en ;
  vpa:submittedFor erava:my_app ;  # the link between an application and the evidence submitted
  rdfs:member eradis:cld-NoBoCert-12325 .
```

As explained in the ERADIS documents, these ECDs link to their supporting CLDs using `dct:requires`. Only in the case of many supporting CLDs (mostly TEC/DEC), of which only one is applicable in the VA Application, it needs to be added to the Evidence.

### Update an existing VTA Application (private only)

URI: `/data/VehicleAuthorisation/{identifier of the resource to update}`

A limited amount of properties can be changed without the need to re-apply. Also, documents can always be added to the 'Sets of Evidence'.

If an VTAIssue-dialogue has been created, the applicant can always add a reply, which is notified to the Authorising Entity.

### Assess or report on a VTA Application: presentations

See [Presentations](#presentation).

### Signing a VTA Application Check, Assessment, Recommendation, Conclusion and Decision

These presentations SHOULD be signed using a [`Verifiable Credential`](https://www.w3.org/TR/vc-data-model-2.0/#securing-mechanisms) on the data which uniquely defines it (given the presentation itself is not linked data). Both the integrity as the authority to sign should be embedded in the digital signature. A final authorisation could therefore look as follows, but we repeat the need to provide digital signatures for all other reports where legally required:

```js
erava:EU812025{nnnn} a era:VehicleTypeAuthorisation ;
  vpa:requestedIn erava:my_app ; # links to the application
  dcterms:identifier "EU812025{nnnn}" ;
  dcterms:created "2025-06-07"^^xsd:date ;
  dcterms:author [ a era:OrganisationRole ; era:hasOrganisationRole era-organisation-roles:AuthorisingEntity ;
    era:roleOf <http://publications.europa.eu/resource/authority/corporate-body/ERA> ;
  ];
  dcterms:audience [ a era:OrganisationRole ; era:roleOf mydata:Applicant ; era:hasOrganisationRole era-organisation-roles:Applicant ] .

erasign:1234 a vc:VerifiableCredential, era:VehicleTypeAuthorisationCredential ;
  vc:issuer <https://www.era.europa.eu/person/maarten-duhoux> ; # I wish :)
  vc:validFrom "2025-06-10T19:23:24Z" ;
  vc:validUntil "2027-06-09T12:00:00Z" ;
  vc:credentialSubject erava:EU812025{nnnn} ;
  vc:proof [
    vc:type vc:DataIntegrityProof;
    vc:cryptosuite "eddsa-rdfc-2022";
    vc:created "2021-11-13T18:19:39Z";
    vc:verificationMethod  <http://publications.europa.eu/resource/issuers/corporate-body/ERA/PAD#signKey-1> ;
    vc:proofPurpose "assertionMethod";
    vc:proofValue "z58DAdFfa9SkqZMVPxAQp...jQCrfFPP2oumHKtz" 
  }
]
```

In order to avoid some `foaf:Agent` of an Authorising Entity to sign out of his/her authority, the organisational data should make use of `org:Membership` and `org:Role`. These roles can then be used to allow the Agent to execute the 'Signing'-use case.

### Other use cases

To be examined.

## Presentation

The presentation of VTA applications/authorisations is realised under the `/data/`-path (see further below), while the related data presentations (reports/check lists...) which need additional CONSTRUCT-queries are under `/presentations/`

URI: `/presentations/VehicleAuthorisation/{presentationGeneratorIdentifier}/{presentationIdentifier}

> [!CAUTION]
> Assessment reports, check lists and whatever presentation of collections of linked data are pre-generated automatically by CONSTRUCTing these triples from linked data (both submitted locally in the Pod, as by querying SPARQL-endpoints). The SPARQL CONSTRUCT queries to do so must be stored in a TTL-file, which is executed inside of the endpoint or LWS, in order to generate instances of a class representing a report/assessment. It is recommended to have the presentations created at the end of a process task if such is possible, but in most cases, several tasks will need to be executed first.

Presentations likely leave the creation space of the initial author towards other stakeholders:

- The (pre-assessment report) as generated by the applicant is normally not edited further. In order to inform the Applicant editing will be ignored, a role-based message might be needed in the dialogue presenting the report.
- The completeness and detailed reports will be regenerated by the authorising entity, which is able to add edits to it. These edits must be applied by a recognised user, which requires a login system to identify this user.
- The other reports as described in the PAVA can be treated in the same manner.

### Data model for a presentation generator

A presentation creates instances of new Classes, using a series of several CONSTRUCT queries. Given the complexity of some verifications, some [advanced, non-normative features of SHACL](https://www.w3.org/TR/shacl-af/) may also be required (See for instance [SCHACL-JS](https://www.w3.org/TR/shacl-js/#js-api)). Let us for instance describe the test on the validity of an EVN control number, of a Vehicle in the Scope of the Authorisation Case. This will - in the /data/ graph - appear as:

```js
mydata:Applicant a era:Body .               # Organisational data is hosted at ORG+ or the applicant
eratv:vt-myVehicleType a era:VehicleType ;  # Vehicle Types are in ERATV+ and are subClassOf vpa:Scope

:my_app a era:VehicleTypeAuthorisationApplication ;
  dct:identifier "My application"@en;
  rdfs:seeAlso "https://oss.era.europa.eu/{omitted}/{someIdhere}/application" ;
  dct:author [ a era:OrganisationRole ; era:roleOf mydata:Applicant ; era:hasOrganisationRole era-organisation-roles:Applicant ] ;
  
  vpa:constitutedBy [
    a era:VehicleTypeAuthorisationCase ;
    vpa:permissionType era-va-authcase:C2T ;
    vpa:concerns
      eratv:vt-myVehicleType ,
      [ a era:VehiclesSet ;
        rdfs:member [ a era:Vehicle ; dct:identifier "91 80 6187 520-2" ] # , [etc] other vehicles in the set
      ] ,
     [ a era:Vehicle ; dct:identifier "91 80 6187 525-7" ] ; # an extra vehicle

```
In the C2T-completeness assessment we have to execute many SHACL validations on the generated data. The result of these validation reports are reconstructed as the `era:VehicleTypeAuthorisationAssessment` like so:

```js
:my_pre-assessment a era:VehicleTypeAuthorisationCheck ; # subClassof rdf:Bag
   dcterms:type era-pava-at:PAVACompletenessC2T ;       # will enable the application of the relevant verified sections...
   rdfs:member [
      # other checks
   ] , [
      # The vehicle number check
      a era:AssessmentElement ; # subClassOf vpa:Compliance
      vpa:checkedSection eralex-pava:AnnexI-11 ;              # ... as they exist in ERALEX
      vpa:isCompliant "true"^^xsd:boolean ; # CONSTRUCTed from the SHACL validation report ("false|true"^^xsd:boolean) ;
   ] , [
     # other records of the completeness assessment
   ] .
```

This approach requires the legislation and its checklists to be machine readable (and strictly linked to SHACL validation shapes) as described in the [ERALEX Assessment Use Case](../ERALEX/assessments.md).

## Machine-to-machine cycle

> Idea launched 17/12/2024 - non-formalised

1. Applicant client sends data on VVTAApplication and its contained library (`era:DocumentSet`) to a SPARQL-endpoint/LWS. In any case, the DocumentSet contains only links to ECDeclarations, as the underlying certificates are referenced.
2. Applicant must generate the pre-assessment triples under `/presentationss`
3. A notification is sent to an ERA listener/subscriber.
4. The listener launches SHACL-validation on the added triples and returns:
   1. The SHACL-validation report
   2. A proposed DC2T, for the Applicant to confirm by sending it back (with some authentication token added)
   3. If non-blocking validation, the draft assessment reports (Completeness, Detailed, Proposed Recommendation)
5. The creation of the assessment triples causes another Notification to be sent to the ERA Decision Maker.
6. On reception of the signed DC2T, the DM can sign the Recommendation and proposed Authorisation.
