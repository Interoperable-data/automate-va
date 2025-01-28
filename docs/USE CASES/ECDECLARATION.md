---
next:
  text: 'VA Applications'
  link: './VA-APPLICATION.md'
---
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

## Core use cases

> [!WARNING]
> Declaration issuers should be aware of the fact that if a declaration is supported by more than one certificate regarding the technical type or design, with the required QMSA for these scopes, a restriction/suspension of ONE such underlying CLD, causes the complete Declaration to be marked as restricted/suspended. The data model allows nevertheless to identify what CLD caused this state.

In all of the below use cases, the updated Declaration:

- SHALL have the property `dct:isReplacedBy` linking to the Declaration being created;
- SHALL be marked as updated using `dct:modified` to the DATE of that creation.

The Declaration created via all use cases (except `/add`):

- SHALL have the property `dct:replaces` linking to the updated Declaration;
- SHALL be marked as created in the kg using `dct:created` (date of creation in the KG).

### Issue a new Declaration

URI: `/process/ECDeclaration/add`
SHACL: (LWS) `process/ECDeclaration/add#shape` or any URI which resolves to the shape of a new Declaration, which SHOULD be used to generate the form(s).

A digital EC Declaration will contain a subset of information resources as present on the many variations in the sector. The common data model is the one as deduced from ERADIS and minimally able to deliver information needed for automated assessment.

A newly created Declaration SHOULD have the property `dct:hasVersion "0"^^xsd:number`.

### Issue a new version of a Declaration (update)

URI: `/process/ECDeclaration/update`

Reserved for non-administrative changes to the certification scope as mentioned in the Declaration, whereby the version number is increased.

### Amend existing Declaration

URI: `/process/ECDeclaration/amend`

Reserved for small and strictly administrative amendments, which correct typos. Correction of references in the certification scope require a new version.
The version number SHOULD increase, but if Applicants prefer not to, this is allowed.

### Restrict an existing Declaration

URI: `/process/ECDeclaration/restrict`

This use case should be triggered automatically, when one of the underlying Certificates has been restricted. The validity scope of the Declaration is relinked to that of the restricting CLD.

### Suspend a Declaration

URI: `/process/ECDeclaration/suspend`

This use case should be triggered automatically, when one of the underlying Certificates has been suspended. The validity scope of the Declaration is relinked to that of the suspending CLD.

### Restore a suspended/restricted Declaration

URI: `/process/ECDeclaration/restore`

This use case should be triggered automatically, when one of the underlying Certificates has been restored. The validity scope of the Declaration is relinked to that of the restoring CLD.

### Withdraw a Declaration

URI: `/process/ECDeclaration/withdraw`

## Declaration lifecycle (example)

Document ID number: `DE/00000000201298/2017/000001` ([Kesselwagen Zacens 77m³, L4BH, LÜP 16,4m](https://eradis.era.europa.eu/interop_docs/ecDecl/view.aspx?id=1199&DocumentType=ECDeclVer)) by `era-org:MF-DE-31008-1`.

1. ISSUE NEW as Declaration 1199, issued 13/12/2017 (2008/57/EC), based on:

```txt
1010/1/SB/2017/RST/DEEN/TRRC6242182 13/12/2017
1010/4/SD/2017/RST/DEEN/TRRC6252183 13/12/2017
1010/6/SD/2017/RST/DEEN/TRRC6252184 13/12/2017
```

2. UPDATE: New version (1A, 16/02/2022) as Declaration 12889, issued 01/03/2022 (2016/797/EU, error in ERADIS), based on new certificates:

```txt
1010/1/SB/2022/RST/DEEN/TRRC1294082/V01 18/02/2022
1010/4/SD/2022/RST/DEEN/TRRC1294083/V01 18/02/2022
1010/6/SD/2022/RST/DEEN/TRRC1294081/V01 18/02/2022
```

3. AMEND: Small amendment (1B = 1A, re-signed 24/05/2022) as Declaration 12890, applied on 2/03/2022.
4. UPDATE: New version (1C, 27/09/2022, new NoBo-file v2 reference) as Declaration 15571, applied on 29/09/2022.
5. UPDATE: New version (1D, 11/01/2023, new RID certificate added) as Declaration 17218, applied on 17/01/2023.
6. UPDATE: New version (1E, 7/11/2023, new QMSA- and COV-certificate, new NoBo-file v3 reference) as Declaration 24148, applied on 8/11/2023:

```txt
1010/4/SD/2023/RST/DEEN/TRRC1294802/V01 29/08/2023
1010/6/SD/2023/RST/DEEN/TRRC1294803/V01 29/08/2023
```

## Declarations with large amounts of type/design examination certificates

Example: [Schunk Carbon's DOC for Pantograph contact strips](https://eradis.era.europa.eu/interop_docs/ecDecl/view.aspx?id=8917&DocumentType=ECDeclCnf). This EC DOC contains many 2CH1 design examination certificates. Internally (see /OSSDOCS#doc-ecDecl-8917>), the property to link them was `erava:supportedBy`, while the proposed ontology prescribes the use of `era:CertificateSet`, a class of which all instances are linked to by the `dct:references` property. This EC Declaration has been elaborated [here](../../TTL/examples/ecDecl-8917.ttl).
