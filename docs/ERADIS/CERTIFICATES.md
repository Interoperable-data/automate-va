---
next:
  text: 'EC Declarations'
  link: './DECLARATIONS.md'
---
# EC Certificates, QMS Approvals and Intermediate Statements (CLDs)

## Scope

The EU Agency for Railways has introduced the [ontology for Verified Permissions](https://w3id.org/vpa). This ontology is not detailing - on purpose - the Datatype- and ObjectProperties which can be added in order to model CLDs and EC Declarations, the first of which exists in the current ERA vocabulary.

> `Documented evidence` allows permission seekers to ask these permissions to permission providers (permitting bodies). Instances of documented evidence are resources, potentially having a physical/electronic document as its presentation.

Stakeholders wanting to represent this `vpa:DocumentedEvidence` as linked data, in order to achieve the objectives as described elsewhere, are invited to examine and return comments on the following proposal.

> [!NOTE]
> The class `vpa:DocumentedEvidence` can be linked to verified `vpa:Requirement`, which are further not specified, but can be, for instance to eli:LegalResource and other classes. The EU Agency for Railways uses the `vpa:DocumentedEvidence` class to model [ERADIS Interoperability documents](https://eradis.era.europa.eu/default.aspx). The process is described [here](./RESTRICTION.md).

## Data model

For EC Declarations, [see this document](DECLARATIONS.md).

`era:Certificate a vpa:DocumentedEvidence ;` are instantiated from ERADIS data, and will be complemented by verifiable credentials (open point).

A CLD has the following properties. For the use cases, please consult [this document](../USE%20CASES/CLD.md).

### ERADIS URL (public)

- [X] For archiving purpose, and as long as the ERADIS data exists on the website, this property will contain the URL:
  - DatatypeProperty `rdfs:seeAlso`
  - range: `xsd:anyURI` of the ERADIS URL

> This web page can be seen as one presentation of the data collected in the Documented Evidence instance, while a PDF file can be another (the file is sometimes available on the ERADIS web page).

### Issuer (public)

- ObjectProperty `http://purl.org/dc/elements/1.1/creator`
- range: IRI of the issuing NoBo, which must itself be an instance of `<http://www.w3.org/ns/org#Organization>`.

The Agency is considering to provide `era-org:NoBo-` + `NANDO number of the NoBo`, in order to cover for this IRI[^1].

[^1]: Ideally, NoBo's would provide the IRI as part of their presence on the web. One way of doing so would be to store their organisational data as RDFa on their website (guideline under design).

### Issue date (public)

- [X] The data at which the NoBo issued the Certificate (signatory process).
  - DatatypeProperty `http://purl.org/dc/terms/issued`
  - range: `xsd:date`

### Period of Validity (public)

We reuse the following ontologies and namespaces:

- `PREFIX dct: <http://purl.org/dc/terms/>`
- `PREFIX vpa: <https://w3id.org/vpa#>`
- `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>`
- `PREFIX era: <http://data.europa.eu/949/>`
- `PREFIX dc: <http://purl.org/dc/elements/1.1/>` (explanation [here](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/elements11/date/))
- `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>`.
- `PREFIX common: <http://www.w3.org/2007/uwa/context/common.owl#>`.

#### XSD durations

We wish to avoid using the datatype `xsd:yearMonthDuration`. We also note that `dct:valid` can only express the eventual expiration date, while a validity interval might be more suited.

#### W3C Time ontology

We reuse the [time: ontology candidate recommendation draft of 2022](https://www.w3.org/TR/owl-time/), as it has been used also in the ERA Vocabulary.

An unnamed subClass (implemented through blank nodes) of `time:Interval` is needed in order to store the beginning and end date of a certificate's validity. The property linking instances of the vp classes to any validity duration, reused for other classes as well, is the ObjectProperty `vpa:valid` from the VP ontology[^2].

[^2]: Reusing `dc:date` (which has no specific Range) has the disadvantage to cause confusion with `dct:date`.

An example will make this clear for a certificate which is valid for two years, issued on April 5th, 2020:

```js
era:doc-uuid_of_document a era:CLD ;
        dct:issued "2020-04-05"^^xsd:date ;
        vpa:valid [ 
            # TemporalEntity
            a time:Interval ; 
            time:hasBeginning  [
                a time:Instant ;
                time:inXSDDate "2020-04-13"^^xsd:date 
            ] ;
            # If no DurationDescription, unlimited duration
            time:hasDurationDescription [
                a time:DurationDescription ;
                time:years 2 ;
            ] 
        ];
        # see other properties below
```

> [!WARNING]
> CLD's SHALL express their validity expiration by using the Duration method, as this period is reset to 0 in the case of Withdrawn CLD's! Other properties are not allowed and applications must calculate valid expiration dates themselves. See also issue #19.

### Refinement of Certificate Subsystem (SS) and Interoperability Constituent (IC)

#### The subject (public)

The legal subject of the certificates can be documented using links to instances of ERALEX/ELI. Details are [here](../ERALEX/LEGISLATION.md).

| Property      |                          Data | Datatype/ObjectProperty                                   | dataset @ ERA |
| :------------ | ----------------------------: | :-------------------------------------------------------- | :-----------: |
| `dct:subject` |                     Subsystem | (IRI to the /ERALEX instance representing that subsystem) |    /ERALEX    |
| `dct:subject` | Interoperability Constituents | (IRI to those /ERALEX instances, if relevant)             |    /ERALEX    |

#### The spatial range (public)

Because different certificates sometimes treat the same IC or SS but produced or manufactured at different sites, the spatial applicability is in some cases required to distinguish this aspect:

| Property      |                                              Data | Datatype/ObjectProperty                      | dataset @ ERA |
| :------------ | ------------------------------------------------: | :------------------------------------------- | :-----------: |
| `dct:spatial` | Validity restricted in Location (production site) | (IRI to the /ORG containing the site's data) |     /ORG      |
|               |                           RFU-STR-001  [R3.a,R33] |                                              |               |

#### The [INF, ENE, CCS]-combination

Finally, some certificates are inherently specifying a limited application, regarding [ENE, INF, CCS]-combinations. The `era:CommonCharacteristicsSubset` could in that case be used, be it through the relevant classes as in the following table. More information is available in the [ERA Vocabulary](https://linkedvocabs.org/data/era-ontology/3.1.0/doc/index-en.html).

| Property                        |                                     Data | Datatype/ObjectProperty                                          | dataset @ ERA |
| :------------------------------ | ---------------------------------------: | :--------------------------------------------------------------- | :-----------: |
| `era:belongsTo`        |                                          | `era:CommonCharacteristicsSubset`                            |               |
| `era:parameter`                 |                                          | `era:InfrastructureSubsystem`, `era:EnergySubsystem` & `era:CCSSubsystem` |               |
| `era:wheelsetGauge`             | Validity limited to a certain INF gauge, | (IRI to the SKOS Concept representing the gauge)                 |     /RINF     |
| `era:energySupplySystem`        |                       ENE supply system, | (IRI to the SKOS Concept representing the supply)                |     /RINF     |
| `era:etcsEquipmentOnBoardLevel` |             CCS train protection system. | (IRI to the SKOS Concept representing the ATP)                   |     /RINF     |

### Other properties of Certificates

CLDs must only have versions consistent with the ERADIS Identifier, which has `/V_version_number_` at the end.

To clarify that a certificate has:

- a version, `dct:hasVersion` must be used additionally, only if it is consistent with its ERADIS Identifier. If in older CLDs no version is present in the ERADIS ID, and a CLD replacing it exists with `/V01`, then the first has to encode a `dct:hasVersion "0"` exceptionally.
- a language, `dct:language` can be used, only if it is consistent with the languages encoded in the ERADIS identifier. The languages must be IRI's and not strings.

> [!WARNING]
> The following is not made explicit in the /ERALEX dataset, and must be refined in the [specification](../ERALEX/LEGISLATION.md).
> The (optional) use of `dct:conformsTo` requires the ?o IRI of TSI's used to be a subClassOf `dct:Standard`. We assume the annexes of the TSI to have held the verified requirement sections, as such Standards.
> The (mandatory) use of `dct:coverage` equally requires the ?o IRI of Applied Modules and Directives to be a subClassOf `dct:Jurisdiction`.

The following mandatory properties are the basis for the data model allowing extraction from ERADIS:

| Property           | Data                               |                          Datatype/ObjectProperty                          | dataset @ ERA |
| :----------------- | :--------------------------------- | :-----------------------------------------------------------------------: | :-----------: |
| `rdfs:comment`     | Object of assessment               |                               `xsd:string`                                |      n/a      |
| `dct:description`  | Supplementary information          |                               `xsd:string`                                |      n/a      |
| `dct:type`         | Certificate type                   | (IRI to [SKOS Concept](https://github.com/Certiman/automate-va/issues/2)) |    /ERALEX    |
| `dct:identifier`   | Certificate Number                 |                     `xsd:string` (with `sh:pattern`)                      |      n/a      |
| `dct:replaces`     | Previous Certificate               |                         (IRI to that certificate)                         |    /IODOCS    |
| `dct:isReplacedBy` | Certificate replacing the current  |           (if replaced, then IRI to that replacing certificate)           |    /IODOCS    |
| `dct:coverage`     | Interoperability Directive applied |          (IRI to /ERALEX instances of the applied IO Directive)           |    /ERALEX    |
| `dct:coverage`     | Modules Applied                    |            (IRI to those /ERALEX instances, which are modules)            |    /ERALEX    |
| `dct:coverage`     | TSI's used (amendments included)   |                     (IRI to those /ERALEX instances)                      |    /ERALEX    |

> [!NOTE]
> [Modules are foreseen to have the IRI](../ERALEX/LEGISLATION.md): `eralex:dec-2010-713-SB` whereby the last characters express the module. They are - like IC's - instances of `eli:LegalResourceSubdivision`, which as a subClassOf `eli:LegalResource` must still be considered `dct:Jurisdiction` (hence `dct:coverage`).

The following properties are not mandatory but allow detailing the verification activities:

| Property              | Data                                    | Datatype/ObjectProperty                                    |
| :-------------------- | :-------------------------------------- | :--------------------------------------------------------- |
| `common:serialNumber` | Unique serial number                    | `xsd:string`                                               |
| TBD                   | Underlying certification report         | `xsd:string` (`dct:source` can hence not be used)          |
| `vpa:checked`         | See the VPA ontology                    | (IRI to the vpa:Compliance instances, which themselves     |
|                       |                                         | contain the checked sections of the above conformsTo link, |
|                       |                                         | and allow to link the restrictions as well)                |
| `vpa:withRestriction` | Certificate restrictions and conditions | (IRI to the instance of the Restriction)                   |
| `dct:conformsTo`      | If not using `vpa:checked`, then the    | (IRI to SKOS Concepts, expressing verified sections,       |
|                       | Sections of TSI to which compliance was | without indication of the result)                          |
|                       | verified.                               |                                                            |

For Applicant, Manufacturer and NoBo the IRI to those /ORGS instances MUST be used.

| Property          | Organization (IRI)                                                                          |
| :---------------- | :------------------------------------------------------------------------------------------ |
| `dct:creator`     | For a certificate, this is the issuing **NoBo**                                             |
| `dct:contributor` | For a certificate, the **manufacturer** of the IC/SS in scope of the verification process. |
| `dct:audience`    | the **applicant** who uses the certificate in a permission-achieving process.               |

If in ERADIS, 'supplementary information' contains certificate numbers, they must be linked as IRI's under Previous or Replacing Certificate.

Certificates should **never** link to the declarations they support, the link is created inversely.

See also [EC Declarations](DECLARATIONS.md).

## Links between CLD's

OPEN POINT

## Non-disclosed properties

See also [Restrictions](./RESTRICTION.md) for the non-disclosed data regarding the Conditions and Limits of Use.

The following data should be stored in non-disclosed graphs.

- ASSESSMENT REQUIREMENTS: In combination with those Harmonised Standards, Voluntary Standards (or parts thereof), other European or national rules authorized by the TSI and Alternative Solutions as identified in the EC NoBo [File/Documentation]
- STANDARD USED [optional]
- ASSESSMENT RESULT: This is the core statement of the Certificate. NoBo statement that the object of assessment (Interoperability Constituent/Subsystem, or its phase/part/Quality Management System), was shown to comply with the assessment requirements, subject to any restrictions and conditions as listed in the relevant field. The essential requirements have been assessed as being met through compliance with the requirements of the relevant TSI only. The details of the assessment results are provided within the documentation part of the NoBo File and/or NoBo Assessment Report.
- RESTRICTIONS / CONDITIONS FOR USE [optional]
- ANNEXES (each with [identifier, revision-if used, date]):
  - [optional]
  - [optional - NOBO ASSESSMENT REPORT]
  - [optional - NOBO FILE/TECHNICAL DOCUMENTATION]
