# Data model for Safety Certificates

## Scope

The EU Agency for Railways has introduced the [ontology for Verified Permissions](https://w3id.org/vpa). This ontology is not detailing - on purpose - the Datatype- and ObjectProperties which can be added in order to model [Safety Certificates](https://eur-lex.europa.eu/eli/dir/2016/798/2020-10-23#tocId23), [Safety Authorisations](https://eur-lex.europa.eu/eli/dir/2016/798/2020-10-23#tocId27) or [ECM Certificates](https://eur-lex.europa.eu/eli/dir/2016/798/2020-10-23#tocId31) as defined in the Railway Safety Directive, which all must be understood as verified permissions in order to function - as a railway stakeholder - as an Entity in charge of Maintenance (ECM) or a Railway Undertaking (RU) / Infrastructure Manager (IM).

Stakeholders wanting to represent this `vpa:Permission` as linked data, in order to achieve the objectives as described elsewhere, are invited to examine and return comments on the following proposal.

> [!IMPORTANT]
> There is an important difference between EC Certificates/EC Declarations (both subClassOf `vpa:EvidenceDocument`) and the Safety documents described here (class `vpa:Permission`). The documentation underlying a Safety Certificate/Authorisation can be linked to verified `vpa:Requirement`s from the Safety Directive. Currently these are further not specified, but could be, for instance as instances of eli:LegalResource and other classes. In order to understand the difference: the `vpa:PermittingEntity` for Safety Certificates/Authorisations are Authorising Entities like NSA. The documentation verified by the NSA in order to receive a Permission to operate as an ECM or RU is confidential and will be refered to as 'operational certificates'.

## ERADIS contains organisational data

Some datasets are only about organisations having a certain `era:OrganisationalRole` and not about the certification of these organisations.

## Common Data model for operational certificates

The below entities will share the following properties:

- EIN / unique identifier
- issue date;
- period of validity, starting date and (optionally) ending date or validity period (if fixed);
- date of state change (amendment/suspension/revocation/withdrawal), which - if present - requires the validity period to be updated (or not).
- link to the replaced operational certificate;
- `dct:subject` should link to the legislation defining the operational certificate;
- `dct:creator` should link to the ORG issuing the operational certificate;
- `dct:audience` should link to the ORG receiving the operational certificate;
- a Proof (on integrity and origin)

### Safety Certificates (Single, type A|B)

Instances of Railway undertaking's `era:SafetyCertificate a vpa:Permission ;` are deduced from [ERADIS Safety Certificate data](https://eradis.era.europa.eu/safety_docs/scert/default.aspx), and will be complemented by verifiable credentials (assumption).

For Infrastructure Managers, the term is '[Safety Authorisation](https://eur-lex.europa.eu/eli/dir/2016/798/2020-10-23#tocId28)', leading to `era:SafetyAuthorisation a vpa:Permission ;` but these are *not* in ERADIS.

| Property          | Organization (IRI)                                                     |
| :---------------- | :--------------------------------------------------------------------- |
| `dct:creator`     | The Agency or national safety authority in accordance with Chapter III |
| `dct:contributor` | Unused, unless another accredited or recognised body was involved      |
| `dct:audience`    | the **RU** who uses the Permission.                                    |

Further specific data is firstly the Category (A, B will not be migrated, only the SSC will be):

- Size of the RU
- IncludesHighSpeed (`xsd:boolean`)
- Passenger transport Volume (less or more than 300 MPgkm/yr)
- Freight transport Volume (less or more than 500 Mtonkm/yr)
- OnlyShunting (`xsd:boolean`)
- IncludingRID (`xsd:boolean`)
- AreaOfOperation <{URI to MS operated in}>
- NonCodedRestictionsConditions (maybe subClassOf `vpa:Compliance`), mostly if NSA is creator.

The Certificates type A may also indicate an ECM (link may then need to be encoded to that ORG).

> [!INFO]
> These documents mostly have a written scan as source! The data is present structured as well.

### ECM Certificate

The same is valid for ECM's `era:ECMCertificate a vpa:Permission ;`, as registered in [ERADIS ECM Certificates data](https://eradis.era.europa.eu/safety_docs/ecm/certificates/default.aspx?DocType=1).

{[Complete issue analysis](https://github.com/Interoperable-data/automate-va/issues/8)}

| Property          | Organization (IRI)                                                                                                  |
| :---------------- | :------------------------------------------------------------------------------------------------------------------ |
| `dct:creator`     | The accredited or recognised body or by a national safety authority in accordance with the conditions of Art 14 (4) |
|                   | In most cases `3. CERTIFICATION BODY`                                                                               |
| `dct:contributor` | Unused, unless another accredited or recognised body was involved                                                   |
| `dct:audience`    | the **ECM** who uses the certificate, so ie. `2. CERTIFIED ORGANISATION`                                            |

For non-organisational properties:

| Property      |                       Data | Datatype/ObjectProperty | dataset @ ERA |
| :------------ | -------------------------: | :---------------------- | :-----------: |
| `dct:subject` | Maintenance activity scope | ()                      |    /ERALEX    |

For the ECM-property (5. Scope of ECM activities) 'Covers wagons specialised in transport of dangerous goods' : (YES|NO), we could propose `era:ecmCertificateCoversRID` (a DatatypeProperty of `xsd:boolean`).

For the ECM-property (6. ADDITIONAL INFORMATION), which is free text, `rdfs:comment` (`xsd:string`) could be used.

> [!IMPORTANT]
> This section is an incomplete draft, to be reviewed by the working party.

### Notified and Designated Bodies (NoBo's and DeBos)

Important is to document the exact legal references the NoBo's are allowed to assess, which could be done using the `eralex:` instances. For DeBo's this link is more difficult (unless we link to the NNTR).

> [!IMPORTANT]
> This section is an incomplete draft, to be reviewed by the working party, as ERADIS does not contain this info on individual XBos.

### AsBos

The list of recognised/accredited AsBo's is also [on ERADIS](https://eradis.era.europa.eu/safety_docs/assessments/bodies/default.aspx). Apart from the issue date, the validity period, their topical Classification, the category and the type must be foreseen, together with a link to OCR+ (AsBo itself and its accred/recog body).

### Licenses to RU's

The license contains the information:
- (`dct:creator`) licensing member state/authority
- Temporary nature (`xsd:boolean`), with expiration date. Those without expiration date, may not be temporary.
- (`dct:rights`) (SKOS CS) Type of service: Freight, Passenger, traction only
- (`rdfs:comment`) Conditions and obligations


## Excluded

The data model for operational certificate will exclude the data for:

> `Memberstate decision on accrediting/recognising of AsBo's`
> This list in ERADIS contains all decisions from EU MS and non-EU states (OTIF) to acknowledge the 37 CSM AsBo bodies in their country.

The decisions themselves may be summarised using linked data, but the priority lies in the collection of their organisational data. Several examples are emails from the MS itself (or the delegated NSA) comfirming the accrediation/recognition of AsBos to be executed by themselves or other organisations, but nothing more than this info.