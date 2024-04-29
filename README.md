# automate-va
This repository groups the requirements for automating Vehicle Authorisations as executed per PAVA (EU 2018/545). It is based on the Agency's internal work on automating C2T applications. It intends to support any open source development enabling authorising entities to execute this automated process at their own premises. It makes abstractions of the UI, and only talks about the functions provided. Technological advice on framework and UI are given in a separate document.

## Requirements
Based on information as made available by the Applicant in OSS, an automated tool has the following functions:
- [ ] displaying basic information about the authorisation cases (EVN's per case, vehicle type per case, etc), involved parties (applicant, nobo, debo, asbo) and milestones (dates) of the Application.
- [ ] displaying the subsystems (and IC's) which the applicant declared applicable for the change/application, and allow for this collection to be updated. This updated collection will serve the linking of documents with the SS/IC they cover.
- [ ] listing the submitted *files* (as per Library), and allowing:
  - [ ] extracting ONE or more *documents* from each file, indicating on what pages each document is present in the file.
  - [ ] to check whether this file was already submitted in another application.
- Per document, extracted as such from each file:
  - [ ] provide a clear, human-readable label (Defaults to the filename, but this is rarely a good label)
  - [ ] allow to mark the document as "not applicable" if such would be the case in this specific application. Note that the status "obsolete" or "expired" is managed through the expiration dates or through the version of the document as submitted (older DOC for instance).
  - [ ] assign a document type from a fixed list
  - [ ] depending on this document type, allow for further properties to be added and stored for later reuse:
     - [ ] Subsystem and IC EC declarations and EC certificates: issue & expiration dates (to double check ERADIS data), and (as a link) their representation in the ERADIS knowledge graph. This allows for the assessor to immediately receive the actual status of this document in ERADIS. Storing the ERADIS ID should in practice not be required.
     - [ ] Certificates per other legislation: issue & expiration dates.
     - [ ] Certificates per EVN (like RID): issue date & EVN to which it is applicable.
     - [ ] declarations of C2T: issue date, location of signature. If possible, EVN's are extracted from the document and compared with the EVN's as mentioned in the authorisation case.
     - [ ] other authorisations: issue date and vehicle type.
     - [ ] lists, drawings, letters: (optionally) issue date.
  - [ ] link with the file in which is present, by using the SHA256 hash, and potentially an index (if more than one document is present in the file).
  - [ ] allow for comments to be added by assessors, in order to warn colleagues about some particularities of the document submitted.
  - [ ] what subsystem(s) it is documenting, and if relevant, what IC(s). Note that
     - a document can sometimes cover multiple subsystems and IC's.
     - the applicant is supposed to announce this list, but as already mentioned, corrections by the assessor are not rare.
     - a special addressing system can be used to store this information in the document.
     - a separate user interface is mostly required to execute this specific function.
- [ ] Per VA application, and based on all the document information as collected from previous applications or the above enrichment:
  - [ ] Generate a standard Completeness Assessment.
  - [ ] Generate a standard Detailed Assessment.
  - [ ] Generate the fixed phrases which appear in these assessments.
  - [ ] Allow for the easy conversion of this data into a Word file which can be submitted into OSS, after separate signing process as executed by the assessor.
     
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
