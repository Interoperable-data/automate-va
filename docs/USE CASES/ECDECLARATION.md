# Use Cases for EC Declarations

Source: current EC DoV and DoC use cases.

Main objective: any application/process using Declarations should be able to retrieve the data of any Declaration that has not been replaced (no `dct:isReplacedBy`) by any superseded Declaration; Declarations supported by CLD's SHALL inherit certain properties from these CLD's.

> [!IMPORTANT]
> This document is an incomplete draft, to be reviewed by the working party. For the PoC, not all contents from a Declaration will be migrated as linked data.

## Parameters and other functions realised with Use Cases

Please consult the [CLD use cases](./CLD.md#other-functions-realised-by-use-cases) in order to find details about:

- presentation of a Declaration (`Presenter`)
- subscription to Declaration changes (`Notifications`)
- the parameters a Manufacturer will need to set in order to Store its Declarations (if in a LWS)

## Core usse cases

### Issue a new Declaration

URI: `/process/ECDeclaration/add`
SHACL: (LWS) `process/ECDeclaration/add#shape` or any URI which resolves to the shape of a new Declaration, which SHOULD be used to generate the form(s).

A digital EC Declaration will contain a subset of information resources as present on the many variations in the sector. The common data model is the one as deduced from ERADIS.
