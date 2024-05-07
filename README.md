# automate-va
This repository groups the requirements for automating Vehicle Authorisations as executed per PAVA (EU 2018/545). It is based on the Agency's internal work on automating C2T applications. It intends to support any open source development enabling authorising entities to execute this automated process at their own premises. It makes abstractions of the UI, and only talks about the functions provided. Technological advice on framework and UI are given in a separate document.

## Requirements
Based on information as made available by the Applicant in OSS, an automated tool has the following functions:
- Display the submitted files, extract the documents in them and annotate these documents for later reuse
- Assign the documents to legal requirements
- Generate the assessment based on these assignments and annotations.

Details are summarised in [REQUIREMENTS](REQUIREMENTS.md).
     
## Linked open data for Interoperability Documents and Vehicle Types
Some of the assessment comments require checks as executed on the ERADIS and ERATV data of the involved vehicle type(s). The EU Agency for Railways will make available the following datasets in a Knowledge Graph:
- [ ] the actual state of all interoperability documents as in ERADIS. In essence, a digital representation of all EC declarations and certificates.
- [ ] Section 1 of each ERATV type (administrative information)
- [ ] Sections 2 + 3 of each ERATV type's authorisation: AoU, Status, member states
  - [ ] TSI-conformity, non-compliant sections, applicable specific cases per [ INF, ENE, CCS ] combination
  - [ ] Coded and non-coded restrictions per [ INF, ENE, CCS ] combination
  - [ ] link to any changed authorisation.
- [ ] Section 4 of each ERATV type (technical characteristics)

## Technology
Please consider the technological recommendations as in a separate document.
