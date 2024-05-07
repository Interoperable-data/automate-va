# automate-va
This repository groups the requirements for automating Vehicle Authorisations as executed per PAVA (EU 2018/545). It is based on the Agency's internal work on automating C2T applications. It intends to support any open source development enabling authorising entities to execute this automated process at their own premises. It makes abstractions of the UI, and only talks about the functions provided. Technological advice on framework and UI are given in a separate document.

## Requirements
Based on information as made available by the Applicant in OSS, an automated tool has the following functions:
- Display the submitted files, extract the documents in them and annotate these documents for later reuse
- Assign the documents to legal requirements
- Generate the assessment based on these assignments and annotations.

Details are summarised in [REQUIREMENTS](REQUIREMENTS.md).
     
## Linked open data for Interoperability Documents and Vehicle Types
Some of the assessment comments require checks as executed on the ERADIS and ERATV data of the involved vehicle type(s). 

Details on the datasets as available in the ERA Knowledge Graph are [here](ERA_KG.md).

## Technology
Please consider the [technological recommendations](TECHNOLOGY.md) and the important requirements on [storing confidential information](STORAGE.md).
