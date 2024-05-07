# Linked Open Data as driver for Automation

This document will be updated with information regarding how to access the data below.

## Registers which are being migrated to Linked Open Data

The EU Agency for Railways will make/is making available the following public datasets in a Knowledge Graph (further: KG):

### ERADIS
Please note that the first publication as linked data of ERADIS will only contain a static, non-verifiable image of the following data:
- [ ] the actual state of all interoperability documents as in ERADIS. In essence, a digital representation of all EC declarations and certificates.
- [ ] (in a different dataset) the Manufacturers and Notified Bodies having issued these documents.
- [ ] (in your private dataset) data and remarks about these documents as submitted in several OSS applications.

In order to allow for the formal use of this dataset, ERA is in the process of examining the representation of these datasets as Verifiable Presentations, whereby each stakeholder signs of the integrity and authenticity of the data.

### ERATV
The Vehicle Type information is composed of 4 major groups of data:
- [ ] Section 1 of each ERATV type (administrative information);
- [ ] Sections 2 + 3 of each ERATV type's authorisation: AoU, Status, member states;
  - [ ] TSI-conformity, non-compliant sections, applicable specific cases per [ INF, ENE, CCS ] combination;
  - [ ] Coded and non-coded restrictions per [ INF, ENE, CCS ] combination;
  - [ ] link to any changed authorisation.
- [ ] Section 4 of each ERATV type (technical characteristics). A first version of this KG is [here](https://virtuoso.ecdp.tech.ec.europa.eu/describe/?url=http%3A%2F%2Fdata.europa.eu%2F949%2FVehicleType).

### EULEX
- [ ] All railway legislation, including the subsystems and interoperability constituents defined therein.

### RINF
At the moment, no use of the existing RINF KG is foreseen in the context of VA.

## Shared Ontology for Verified Permissions

The Agency proposes to/is asked by its stakeholders to work together efficiently. To that end, it has been working and sharing a common vocabulary and ontology to store the open data in its Registers. To enable advanced collaboration regarding [Authorisations, Approvals and other verified Permissions](https://linkedvocabs.org/data/VPADoc/doc/index-en.html), an ontology will be made available in order to commonly store the work in these processes, while strictly following the legal obligations regarding confidentiality.

> [!TIP]
> The linked Ontology is a draft proposal and we invite the stakeholders to collaborate on its completeness.
