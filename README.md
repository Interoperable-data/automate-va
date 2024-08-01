# automate-va

This repository groups the requirements for automating Vehicle Authorisations as executed per PAVA (EU 2018/545). It is based on the Agency's internal work on automating C2T applications. It intends to support any open source development enabling authorising entities to execute this automated process at their own premises. It makes abstractions of the UI, and only talks about the functions provided. Technological advice on framework and UI are given in a separate document.

> [!WARNING]
> The `va-automate` repository as a whole SHALL be considered voluntary and informational only. All legal obligations and rights of the railway stakeholders remain as they are described in the EU Agency for Railways formal documentation and the applicable EU legislation. This repository only targets voluntary harmonisation of data models and efficient collaboration between stakeholders on eventual software tools, having to do with the process as described in the Practical Arrangements for Vehicle (Type) Authorisations.
>
> ONLY the formally published ERA Vocabulary shall take precedence over the draft ontology descriptions as presented here and in the documentation.
>
> Contributions are welcome, please contribute as described [here](https://github.com/Interoperable-data/ERA_vocabulary/blob/main/README.md).

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
