---
next:
  text: 'How to model TSI, IC, SS'
  link: './REQUIREMENTS.md'
---
# Data model for EC Declarations

## Scope

The EU Agency for Railways has introduced the [ontology for Verified Permissions](https://w3id.org/vpa). This ontology is not detailing - on purpose - the Datatype- and ObjectProperties which can be added in order to model EC Certificates and EC Declarations.

EC Declarations must be seen as fundamentally supported by EC Certificates. As such, they materialize the intent of a Manufacturer, in the role of Applicant, to achieve Permission to place an IC or SS on the market, for integration or further operation by another stakeholder.

A Declaration of Conformity should be able to cover a large collection of IC's, all supported by one or multiple QMSC (for instance based on production sites). The data model must therefore provide for the grouped reference of these certificates, such that it is always clear what combinations allow the declaration to support the scope of the document.

## Data model

For EC Certificates, [see this document](CERTIFICATES.md).

`era:ECDeclaration rdfs:subClassOf vpa:DocumentedEvidence ;` are, like certificates, instantiated from ERADIS data, and complemented by verifiable credentials (under design).

### Issuer

- ObjectProperty `http://purl.org/dc/elements/1.1/creator`
- range: IRI of the issuing Manufacturer, which must itself be an instance of `http://www.w3.org/ns/org#Organization`, detailed on `era:hasRole` at least `era-organisation-roles:Applicant`.

Ideally, Manufacturers would provide the IRI and further organisation data as part of their presence on the web. One way of doing so would be to store their organisational data as RDFa on their website (guideline under design).

### Issue date

- DatatypeProperty `http://purl.org/dc/terms/issued`
- range: `xsd:date`

### Period of validity

- No property foreseen.

Declarations are issued by the Manufacturer in an Applicant role, but the validity of the Declaration fundamentally depends on:

- if the verification module so requires it, the QMSC validity, which can be refined per production site and precise version/variant of the IC or SS.
- if no such QMSC is required by the verification module, other factors, to be registered by the Applicant.

This means that declarations should infer their validity from the (sometimes many) linked certificate groups, each as per precise scope of the module combination chosen.

### Supporting certificates

Declarations MUST hence refer to Certificate sets, so grouped together as per verification module, using the property `dct:hasPart` and `dct:references`.

As explained, the data model most provide for sets of certificates, together forming at least one basis for the declaration. This means that some certificates will be linked more than once, if they can be combined with others, together forming another basis set for the declaration. An example will clarify the approach and used properties:

```csharp
era-ecd:doc-uuid_of_document a era:ECDeclaration ;
        dct:issued "issue_date"^^xsd:date ;
        //# vpa:valid should NOT be used for declarations: the validity must be deduced from the underlying certificates! 
        //# refences to the certificate sets:
        dct:references [
            a era:CABEvidence ;
            dct:hasPart IRI_to_Certificate_A , IRI_to_Certificate_B ;
        ], [
            //# another certificate set
        ]

```

### Other properties of Declarations

#### Version

EC Declarations can have several versions without impact on their "Document ID number", and must therefore have a version.

- DatatypeProperty `dct:hasVersion`
- range: `xsd:integer`

#### Language

Text within a declaration must be marked with the @language identifier, and the resource as a whole could make use of `dct:language`.

#### Explicit data properties

The following mandatory properties are the basis for the data model allowing extraction from ERADIS:

|      Property      | ERADIS Data                                        |                Datatype/ObjectProperty                 | dataset @ ERA |
| :----------------: | :------------------------------------------------- | :----------------------------------------------------: | :-----------: |
|  `dct:identifier`  | 1. ID Data - Document ID number                    |            `xsd:string` (with `sh:pattern`)            |      n/a      |
|   `rdfs:comment`   | 3.3 Description of the subsystem                   |                      `xsd:string`                      |      n/a      |
| `dct:description`  | If amending a previous declaration:                |                      `xsd:string`                      |      n/a      |
|                    | 10. Description of the amendment                   |                                                        |               |
|   `dct:coverage`   | 5. References to EC Directives                     | (IRI to /ERALEX instances of the applied IO Directive) |    /ERALEX    |
|   To Be Defined    | 5. Reference "List of documents in technical file" |   `xsd:string` (`dct:source` can hence not be used)    |      n/a      |
|   `dct:coverage`   | 5. References to TSIs                              |            (IRI to those /ERALEX instances)            |    /ERALEX    |
|   `dct:coverage`   | 3.4 Description of procedures followed in order    |  (IRI to those /ERALEX instances, which are modules)   |    /ERALEX    |
|                    | to declare conformity of the subsystem             |                                                        |               |
|   `dct:replaces`   | Previous Declaration                               |               (IRI to that declaration)                |    /IODOCS    |
| `dct:isReplacedBy` | Declaration replacing the current                  | (if replaced, then IRI to that replacing declaration)  |    /IODOCS    |
|    `era:status`    | 9. Status of the doc                               |             (IRI to the ERA SKOS Concept)              |     SKOS      |
|  `dct:available`   | 9. Date of publication in Database                 |                       `xsd:date`                       |      n/a      |

For Applicant, Manufacturer, Document owner/holder and Approvals NoBo the IRI to those /ORGS instances MUST be used.

| Property          | Organization                                                                              |
| :---------------- | :---------------------------------------------------------------------------------------- |
| `dct:creator`     | For a declaration, this is the issuing **Applicant** and/or **authorised representative** |
| `dct:contributor` | For a declaration, the **NoBo** providing the latest supporting certificates              |
| `dct:audience`    | not used                                                                                  |

#### Implicit properties

The following properties are implied:

- "3.1 Type of subsystem" is deduced from the certificates supporting the declaration (see above): if they are subsystem certificates, the declaration must concern these subsystems.
- "3.2 IC's" must be those existing under the TSI's covered (as linked under "5.References to TSIs").  
- "3.4 Description of procedures followed in order..." should be deduced from the supporting certificates.
- "5. References to Conditions of Use" (tbd: instances of `vpa:Restriction` or `xsd:string`) should be deduced from the underlying certificates (`vpa:withRestriction`)
- "10. Amendment of the document" is realised through `dct:replaces`. The date at which the amending declaration is available is the date of amendment of the amended declaration.

#### Open points

- (3) List of IC's may be a more limited set than those existing in the mentioned TSIs.
- (4) Coverage by a CA module, makes the link to NoBo not required. Can be resolved using SHACL.
- (5, 8) Files attached to the declaration must be stored under resolvable URI (`xsd:anyURI`).
- (7) Additional information regarding the signatory.
