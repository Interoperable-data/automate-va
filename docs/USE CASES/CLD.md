# Use Cases for CLD

Source: RFU-STR-001.

Main objective: any application/process using CLD's should be able to retrieve the data of any CLD that has not been replaced (no `dct:isReplacedBy`) by any superseded CLD;

## Parameters

### Data providers

Appropriate Bodies (NoBo, DeBo, AsBo), if they use LWS, should decide how to structure the CLD-repository in `{NoBo:Containers}/` and `{NoBo:Containers-Private}/`.
When using a triple store, they must decide on the GRAPHs to store the resource in as `{NoBo:Graphs}` and `{NoBo:Graphs-Private}`.

URI's of ?s when making use of LWS:

- `/data/CLD/{NoBo:Containers}/[eccert|qmsa|isv]-{uuid4}`, depending on the CLD's type
- `/data/CLD/{NoBo:Containers-Private}/[clou|compliance]-{uuid4}`

URI's of ?s when making use of Triple Stores:

- `GRAPH {NoBo:Graphs} { [eccert|qmsa|isv]-{uuid4} a vpa:DocumentedEvidence }`
- `GRAPH {NoBo:Graphs-Private} { [clou|compliance]-{uuid4} a vpa:DocumentedEvidence }`

### Data consumers

The URI of any CLD below must also be stored centrally, as [explained here](../COMPONENTS/app-core.md#search). The central search platform should be accessible publicly.

## Other functions realised by use cases

### Presentation

This document does not treat the approach to implement a [`Presenter for CLD's`](../COMPONENTS/app-core.md#presenters) as this module ony displays the CLD resource, in formats as configured outside of the scope of Use Cases.

### Subscriptions

Some of the use cases below MUST trigger `Notifications` to given `Subscribers`. In fact, the creation of a CLD should automatically trigger certain subscriptions as well.

More info is available [here](../COMPONENTS/app-subscriptions.md).

## Core Use Cases

### Issue new CLD

URI: `/process/CLD/add`
SHACL: (LWS) `process/CLD/add#shape` or any URI which resolves to the shape of a new CLD, which SHOULD be used to generate the form(s).

Displays a sequence of forms, for storage of the CLD as sets of public and private linked data:

- [Public data](../ERADIS/CERTIFICATES.md), with [Shape](../TTL/Certificate.ttl). Its initial status must be '`Issued`' or `Refused`.
- Confidential data, like [Restrictions](../ERADIS/RESTRICTION.md), linked to by the public instance.

Requires a [search function](../COMPONENTS/process-sources.md) retrieving the URI's for the ObjectProperties in the above models.
The issuing of a new CLD with an existing ERADIS ID and version should be prohibited. The data to do so is available at each Appropriate Body, as the identifiers contain an organisational ID.

### Issue a new version of a CLD (update)

URI: `/process/CLD/update`
SHACL: (LWS) `process/CLD/update#shape`, which contains ONLY the properties which MAY be changed during an update and SHALL NOT contain properties which MAY NOT be changed according to RFU-STR-001.

The user must first search for and select the CLD to update (from the collection of Issued but not any other CLD's) and displays **part** of its current data in a form. The updated CLD's other properties will be copied into the updating CLD.

The updated CLD is linked and as such identified (RFU-STR-001 R.37) via `dct:replaces`, and the updating CLD further keeps the ERADIS ID, with the version number `dct:hasVersion` increased by one. Note that new CLD's may have been amended as version 1 (version 0 being amended), their updates will then have version 2.

The updating CLD, like all new CLD's, MUST have `dct:issued`, the date of the issue, which may not be the publication date in the KG. Its status will be 'Issued'.

The updated CLD:

- SHOULD have the property `dct:isReplacedBy` linking to the updating CLD;
- SHALL be marked as updated using `dct:modified` to the DATE of amendment;
- SHALL have its status 'Issued' not changed, as it remains issued.

### Amend existing CLD

URI: `/process/CLD/amend`
SHACL: `/process/CLD/amend#shape`, which contains ONLY the properties which MAY be changed and SHALL NOT contain properties which MAY NOT be changed according to RFU-STR-001.

`
This case is used when a certificate must be amended. The “amend”
activity shall only be used in case of small and strictly administrative
amendments to an already issued CLD in order to correct an error.
`

Allows the user to search for and select the CLD (from the collection of Issued/Suspended/Restricted, and only after a warning, the Amended CLD's) to be amended and displays **part of** its current data in a form. The amended CLD's other properties will be copied into the amending CLD.

The amended CLD is linked and as such identified (RFU-STR-001 R.37) via `dct:replaces`, and the amending CLD further keeps the ERADIS ID, with the version number `dct:hasVersion` increased by one. Note that new CLD's may have version 0 (no version displayed), their amendments will have version 1.

The amending CLD must have:

- `dct:issued`, the date of the restriction.
- its status being 'Issued', given the Amending CLD has been issued by the NoBo on the same basis as the corrected CLD and with the full intention to replace it (and not restore it).

The amended CLD:

- SHOULD be updated by adding `dct:isReplacedBy` linking to the amending CLD;
- SHALL be marked as updated using `dct:modified` to the DATE of amendment;
- SHALL have its status be changed into `Suspended` (Potential Issue When Restoring!).

> [!WARNING]
> An amended CLD, which contains errors, should never be [restored](#restore-a-suspendedrestricted-cld) as this would restore the errors. Should the Status better not be `Amended`?

- SHALL NOT BE CHANGED in regard to its `vpa:valid` property.

The amending CLD must state 'the nature of the amendment' in an addition to its `dct:description`.

### Restrict an existing CLD

URI: `/process/CLD/restrict`
SHACL: `/process/CLD/restrict#shape`, which contains ONLY the properties which MAY be changed and SHALL NOT contain properties which MAY NOT be changed according to RFU-STR-001.

Allows the user to search for and select the CLD (from the collection of Issued, but not the Amended/Suspended/Restricted and other CLD's) to be restricted and displays **part of** the current data in a form, which will be copied into the restricting CLD, with all its other non-edited properties.

The restricted CLD is linked and as such identified (RFU-STR-001 R.37) via `dct:replaces`, and the restricting CLD receives a new ERADIS ID, with the version number `dct:hasVersion` back at 0 (no version visually) and further:

- `dct:issued`, the date of the restriction;
- its status being 'Issued' (issue) or if needed 'Issued, Restricting'.

The restricted CLD:

- SHOULD be updated by adding `dct:isReplacedBy` linking to the restricting CLD;
- SHALL be marked as updated using `dct:modified` to the DATE of restriction;
- SHALL have its status be changed into `Restricted`.
- SHALL NOT BE CHANGED in regard to its `vpa:valid` property.

The restricting CLD must state 'the nature of the restriction' in an addition to its `dct:description`.

### Suspend a CLD

URI: `/process/CLD/suspend`

Allows the user to search for the CLD (from the collection of Amended/Issued/Restricted but not the Suspended CLD's) to be suspended, but displays no data of the suspended CLD which can be modified.

The suspended CLD is linked via `dct:replaces` in a new, compact instance of a CLD (same type as the CLD), which further has:

- `dct:issued`, the date of the suspension.
- its status being 'Issued' (issue) or if needed 'Issued, Suspending'.

The suspended CLD itself:

- SHOULD be updated by adding `dct:isReplacedBy` linking to the suspending CLD;
- SHALL be marked as updated using `dct:modified` to the DATE of the suspension;
- SHALL have its status be changed into `Suspended`.
- SHALL NOT BE CHANGED in regard to its original `vpa:valid` property, but applications MUST comply with RFU-STR-001 in regard to the usage of suspended CLDs.

The suspending CLD SHOULD not have any other properties, like ERADIS ID or Version, as the core mechanism to detect Suspension is handled through the link.

### Restore a suspended/restricted CLD

URI: `/process/CLD/restore`
SHACL: `/process/CLD/restore#shape`, which contains ONLY the properties which MAY be changed and SHALL NOT contain properties which MAY NOT be changed according to RFU-STR-001.

Allows for the user to search for the CLD to be restored (from the collection of Suspending/Restricting, but not the other CLD's) and displays **most of** the current data in a form, which will be copied into the restoring CLD (the ERADIS ID and Version do not change). The restoring CLD `dct:replaces` the restored CLD and further has:

- `dct:issued`, the date of the restoring.
- its status being 'Issued' (as its original had)

> [!INFO]
> The reason a new CLD is created in the Knowledge Graph is to allow full review of the CLD to restore, and to keep a historical trace of the changes.

The restored CLD itself:

- SHOULD be updated by adding `dct:isReplacedBy` linking to the restoring CLD;
- SHALL be marked as updated using `dct:modified` to the DATE of restoring;
- SHALL have its status be changed into `Amended`, which blocks it from ever being restored again.
- SHALL NOT BE CHANGED in regard to its `vpa:valid` property, which must be corrected if needed in the restoring CLD.

The restoring CLD SHOULD state 'the reason of lifting the restriction' in an addition to its `dct:description` and links to the restored CLD using `dct:replaces`.

### Withdraw a CLD

URI: `/process/CLD/withdraw`

Allows for the user to search for the CLD to be withdrawn (from the collection of Issued/Suspended/Restricted, but not the Amended CLD's). The user cannot edit any of the properties of the CLD, and no copy will be made in the KG, but the withdrawn CLD itself:

- SHALL be marked as updated using `dct:modified` to the DATE of withdrawal;
- SHALL have its status be changed into `Withdrawn`, which blocks it from ever being restored again.
- SHALL BE CHANGED in regard to its `vpa:valid` property, whereby the Period of Validity is set to 0 ([more info here](../ERADIS/CERTIFICATES.md#w3c-time-ontology)).

All withdrawals must lead to the appropriate notifications.
