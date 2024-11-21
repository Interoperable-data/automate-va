# Data model for Safety Certificates

## Scope

The EU Agency for Railways has introduced the [ontology for Verified Permissions](https://w3id.org/vpa). This ontology is not detailing - on purpose - the Datatype- and ObjectProperties which can be added in order to model [Safety Certificates](https://eur-lex.europa.eu/eli/dir/2016/798/2020-10-23#tocId23), [Safety Authorisations](https://eur-lex.europa.eu/eli/dir/2016/798/2020-10-23#tocId27) or [ECM Certificates](https://eur-lex.europa.eu/eli/dir/2016/798/2020-10-23#tocId31) as defined in the Railway Safety Directive, which all must be understood as verified permissions in order to function - as a railway stakeholder - as an Entity in charge of Maintenance (ECM) or a Railway Undertaking (RU) / Infrastructure Manager (IM).

Stakeholders wanting to represent this `vpa:Permission` as linked data, in order to achieve the objectives as described elsewhere, are invited to examine and return comments on the following proposal.

> [!IMPORTANT]
> There is an important difference between EC Certificates (class `vpa:DocumentedEvidence`) and the Safety documents described here (class `vpa:Permission`). The documentation underlying a Safety Certificate/Authorisation can be linked to verified `vpa:Requirement`s from the Safety Directive. Currently these are further not specified, but could be, for instance as instances of eli:LegalResource and other classes. In order to understand the difference: the `vpa:PermittingEntity` for Safety Certificates/Authorisations are Authorising Entities like NSA. The documentation verified by the NSA in order to receive a Permission to operate as an ECM or RU is confidential.

## Data model

The below entities will share the following properties:

- EIN
- issue date and period of validity
- date of suspension, which - if present - requires the validity period to be updated.
- link to the replaced certificate

### Safety Certificate and Authorisation

Instances of Railway undertaking's `era:SafetyCertificate a vpa:Permission ;` are deduced from [ERADIS Safety Certificate data](https://eradis.era.europa.eu/safety_docs/scert/default.aspx), and will be complemented by verifiable credentials (assumption).

For Infrastructure Managers, the term is '[Safety Authorisation](https://eur-lex.europa.eu/eli/dir/2016/798/2020-10-23#tocId28)', leading to `era:SafetyAuthorisation a vpa:Permission ;`

| Property          | Organization (IRI)                                                     |
| :---------------- | :--------------------------------------------------------------------- |
| `dct:creator`     | The Agency or national safety authority in accordance with Chapter III |
| `dct:contributor` | Unused, unless another accredited or recognised body was involved      |
| `dct:audience`    | the **RU/IM** who uses the Permission.                                 |

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
