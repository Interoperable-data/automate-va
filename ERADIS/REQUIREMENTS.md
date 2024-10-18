# Requirements

This living document traces the requirements for the PoC which exist for the CLD's and 'EC'Declarations of Conformity, Suitability for Use & Verification, currently stored as database records in the ERADIS register.

> [!CAUTION]
> None of the mentioned or future requirements in this list can legally oblige any stakeholder, neither Applicant, accredited Body nor the Agency or any other organisation into providing manpower and means, as the Proof Of Concept as a whole does not change the existing legal obligations of any party involved. When a requirement is hence marked as obligatory, it is only to be interpreted in the context of the **success** of the Proof of Concept (objectives reached).

The success of the project is possible thanks to the intensive reuse of available ontologies (RDF(S), OWL, DCTERMS, SHACL, ...), the Agency's [Verified Permissions ontology](https://w3id.org/vpa) (created for this purpose) and the Agency's [formal Vocabulary](https://data-interop.era.europa.eu/era-vocabulary/) (versions to be used are 3.1.0 and higher). It MAY further make use of existing technologies for securing the integrity and authenticity of the mentioned datasets (e.g. [Verifiable Credentials/Presentations](https://www.w3.org/TR/vc-overview/) which allows authenticity and the assurance of origin of a resource, [RDF dataset canonicalisation](https://www.w3.org/TR/rdf-canon/#abstract) which allows hashing and integrity). On the digital representation of stakeholders themselves, this is considered out of scope of this work (see for instance: [DiD](https://www.w3.org/TR/did-core/) and the possible use of the EBSI ledger in order to attain [its verifiable data registry function](https://www.w3.org/TR/did-core/#dfn-distributed-ledger-technology). Other choices may be made in the future.)

> [!TIP]
> To contribute to this document, please use [the EUAR process as described  here](https://github.com/Interoperable-data/ERA_vocabulary/blob/main/README.md#Contributing). A GitHub account is required, and should be indicative of the organisation contributing.

## Overview and structure

The following requirements are based on inputs from relevant stakeholders, like the ERA NoBo Monitoring team, NBRail and Applicants. We distinguish between optional (nice-to-have) and mandatory requirements only based on the target objective of "automated C2T vehicle authorisation case". We also consider the solution at this stage a "Proof Of Concept", which will require additional RAMS-requirements when going into production, and hence replacing the current workflow through the ERADIS web app & database. This results in 3 requirement types:

1. For Target (SHALL, MUST)
2. Nice To Have (MAY)
3. For Production (SHOULD)

We will regroup the requirements in an opinionated process order:

* from **creation of a new CLD**, including the SHACL validation of the contents (forbidden data combinations, mandatory datatypes, selections from drop-down lists (SKOS Concept Schemes), etc)
* its **updates** or **modifications** (content and state, strictly as per [RFU-STR-001](https://nb-rail.eu/official-documents?_hash=sdZw5f9knrCRlgtc8tjzq263IkcdQhDo05f6n%2FKVqUA%3D&ctx=a%3A1%3A%7Bs%3A2%3A%22id%22%3Bi%3A154%3B%7D&p=documents%2FRFU%2FAll+subsystems%2FRFU-STR-001+Content+of+EC+Certificates.pdf)),
* its possible material/printable/human-readable **presentations** (as per [EU/2019/250 Annex IV](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02019R0250-20200616#tocId24) or [Annex V](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02019R0250-20200616#tocId28), RFU-STR-001, UNIFE preferences, etc),
* the registration of its more **confidential annexes**, like `Conditions and Limits of Use` and `NoBo File`, including the way these access is to be controlled by the NoBo, and the same for elements in the contet of DoC/DoV,
* and at all of the above, the measures taken to protect the digital CLD's **authenticity** and **integrity**.

## List

In what follows, we will name instances of a `CLD/DoC/DoV` as a `resource`, given that we represent it using RDF. In order to support all the below:

* [ ] The Agency SHALL provide[^OS], in its Linked Web Storage pod, a `process` which assures that any stakeholder activating this process through a web application, and running the provided `tasks`, is guaranteed to store the resources in the correct data model/ontology.
* [ ] The process and its tasks MUST be described as linked data.
* [ ] The shape files used for the forms, see below, SHALL be managed as open source, but fall under the Agency's decision mandate through the legislation on Registers.
* [ ] Stakeholders MAY develop their own interfaces with their Linked Web Storage pods, but SHALL NOT store data in the context of this work in any other format/data model/ontology than defined here, unless the property is of pure internal use.
* [ ] The Agency SHOULD investigate how data provisioning into the Linked web storage pods can be done by machine-to-machine interfaces, allowing easier introduction of data which already exists.
* [ ] Any stakeholder SHOULD be able to add processes in their own LWS pod, and define the tasks therein, using form shapes as they see fit, and make them available to other stakeholders, as they see fit, without however any impact on the data model/ontology as described here.
* [ ] Any stakeholder using a Linked Web Storage pod MUST be able to store and update its organisational data, including operational sites, and roles executed, in order to automate the retrieval of correct organisation name and addresses.
* [ ] This organisational information SHALL be made available to all stakeholders allowed to quote this information in any legally foreseen process. *The reason for this requirement is the large amount of quality problems with organisation names and locations, which can be solved if the core data is managed by the organisation itself and stored at its origin. No data on another organisation is hence to be entered by another stakeholder, as all organisational data can be retrieved through special linked search components in the tool.*
* [ ] ...

### Creation

* [ ] All resources MUST be instances of `vpa:DocumentedEvidence`. This means that it SHALL be linked to:
  * [ ] any `vpa:Request` for a `vpa:Permission`, like a request for a vehicle authorisation, using `vpa:submittedFor` (and in relation to the `vpa:Case`, using `vpa:submittedIn`, as for instance the vehicle authorisation Case `Conformity to Type`);
  * [ ] any legal requirement (`vpa:Requirement`) it closes, fully or with some restrictions (instances of `vpa:Restriction`), using `vpa:closes` and `vpa:withRestriction`;
* [ ] The data model/ontology underlying CLD's SHOULD be managed [here](CERTIFICATES.md) and MUST at least respond to the data model in A.2, B, C & D of RFU-STR-001, and its Annex 1.
* [ ] Resource data which is confidential MUST be stored in protected datasets, like for instance some elements in A.2.2 of RFU-STR-001 (Annex of CLD) or its A.2.3 (NoBo File or CA Report).
* [ ] The model MAY fully support the storage of DeBo CLD's as well.
* [ ] The model MAY support in full or partially the Verification matrices underlying a CLD, which allows to link a Condition or Limitation to an investigated requirement within a TSI or national rule. This technically would require the requirement lists of each TSI to be available as SKOS concept schemes.
* [ ] The data model/ontology underlying (EC)DoC/DoV SHOULD be managed [here](DECLARATIONS.md) and MUST at least respond to the Annexes I and II of (EU)2019/250.
* [ ] Both the data models for the resources SHALL be harmonised using inputs from NBRail and representative Applicants (with involvement of UNIFE where requested).
* [ ] The stakeholders MAY own a Linked Web Storage pod, which they connect to in order to store the generated linked data.
* [ ] Stakeholders not owning such a storage pod, MUST be able to store their data in a commonly used storage pod but confidential data SHALL NOT be stored there (for evident reasons: all data in the common storage system will be publicly accessible as there is no access control mechanism based on a stakeholders' [WebId](https://solid.github.io/webid-profile/)).
* [ ] The creation of the resource MUST happen through a sequence of forms (technically [SHACL-FORM](https://github.com/ULB-Darmstadt/shacl-form)s), which MUST respect the order as agreed on the current ERADIS forms.
* [ ] ...

### Updates to state and content

* [ ] CLD Resources MUST, after creation (state: `Newly issued`), be able to be changed as foreseen in Annex 7 of RFU-STR-001:
  * [ ] Suspension, with a `time:`-based indication of the mentioned time period.
  * [ ] Restoration, lifting the suspension
  * [ ] Restriction, meaning re-issue with restricted CLD, linking to the previous CLD
  * [ ] Withdrawal
  * [ ] Amendment, under the restricted conditions (and thereby different form) of RFU-STR-001, leading to a new version of the CLD.
* [ ] DoC/DoV resources MUST be able to be changed as currently foreseen in ERADIS:
  * [ ] *List to be added*
* [ ] Any change of state MUST lead to new resources, linking to the changed resource, which itself SHALL not be changed. The original resource MUST link to the new resource using `http://purl.org/dc/terms/isReplacedBy`.
* [ ] (after internal discussions at ERA) *all* properties and not only the changed ones, will be present in the new resource, and a full integrity hash SHOULD be present.
* [ ] The tool MAY allow any interested party to subscribe to the changes as mentioned above. This is technically realised using the [Notifications API](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/subscribe-to-notifications/).
* [ ] The tool further SHOULD allow the required automatic information flows for CLDs as described in the Interoperability Directive (IOD), article 42 (see also RISC Meeting 85)
* [ ] The tool SHOULD also allow for the periodical publishing as described in the IOD, Annex IV, 2.7.
* [ ] ...

### Presentation

* [ ] For the relevant CLD types/annexes of the Annexes 2 until 6 of RFU-STR-001, the presentations described therein MUST be available through the tool.
* [ ] The solution SHOULD provide a method in order to generate any presentation based on the available linked data, wherever it is stored (and available).
* [ ] The objective SHOULD be that presentations are strictly not required anymore in any automated process, unless a human agent needs to inspect it.
* [ ] A report which MUST be delivered, is the assessment report of Vehicle Authorisation Case C2T.
* [ ] ...

### Authenticity & integrity

This section SHOULD be attained.

* [ ] Any integrity hash, if provided, MUST ALSO be stored in the Agency's Linked Web Storage: i.e. any integrity hash will exist as a property of the resource, and a copy will be kept at the Agency.
* [ ] ...

[^OS]: The EU Agency for Railways develops this application based on javascript technologies, like the libraries provided by Inrupt, VueJS, SHACL-Form and others, but further assures a fully open source treatment. The repository will be extended with the codebase as developed so far.
