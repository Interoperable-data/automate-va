# VA-POC (local)

This package contains the W3C RDF-based Vehicle Authorisation toolbox for Applicants, Conformity Assessment Bodies (CAB) and Authorising Entities, for use in a modern HTML browser. With the current proof of concept you can either consume the hosted build provided by ERA or run the bundle locally (see _Runtime Options_ below).

> [!INFO]
> This package is made available to all interested parties involved in vehicle authorisation and registration processes as a Proof of Concept. No rights can be deduced from its use and the EU Agency for Railways (ERA) is not responsible for any consequences of its use.

## What's new in this iteration

- **Organisation manager** – auto-discovers SHACL NodeShapes, then renders create/edit flows for holdings, organisations, and units with zero hard-coded mappings. Data is written to the local quadstore and grouped per named graph for easier reuse.
- **Raw RDF snapshot** – inspect the active dataset in Turtle or N-Triples, copy it to the clipboard, or download it for offline analysis. The view refreshes automatically whenever the graph changes.
- **Endpoint validation console** – post the current dataset to a remote SHACL validation service using a single click, with optional bearer token support and readable response previews.

## Manage your organisation data and roles

For reuse in all of your applications, you will be able to store linked data per W3C `org:`-ontology of all your Organizations (`org:Organization`), Units (`org:organizationUnit`) and where they are located (`org:Site`). This information will be stored in a local JSON-LD file, for later reuse.

When needing to quote another stakeholder, a lookup function will provide for the URI of its data as well.

## Manage your Objects of Assessments

Because these will be reused in potentially many of your applications for authorisation of a vehicle (type), you will be able to group together:

- All subsystem-level declarations, and their supporting subsystem CLDs;
- All Declarations of Conformity, which you can link to a subsystem CLD of choice.

You will also be able to link any CLD with Declarations of Verification or Conformity, if the ERA ERADIS+ knowledge graph does not yet contain the links.

Upon request of NBRail, Conditions and Limits of Use can be linked to certain types of CLD, and stored in separate files.

In order to accomodate the automatic pre-assessment for CLD's which are partially covering for newer TSI's, or (added or optional) functions (see CSS), the tool allows to add this data to a given CLD.

The tool also supports the creation and management of DeBo certificates or any other certificate under EU railway legislation. At last, it also supports the creation and management of `Statements`, like the ESC, RSC statements, or statements from an authorising entity.

## Apply for Efficient Vehicle(Type) Authorisations (EVA)

The core function of the va-poc local version is to allow both Applicants as Authorising Entities to pre-assess their applications. After having created the OoA as above (as a set of `era:CABEvidence`), the data necessary to compose a `VehicleTypeAuthorisationApplication` and its `VehicleTypeAuthorisationCase`s can be entered and managed. The draft `VehicleAuthorisation` will also be created in the local KG (browser-based). The full data graph can then be sent to the EC Interoperability Testbed for validation, using public shape graphs from the ERA. On return, the SHACL Validation report (which is only readable by experts) will be converted in a human-readable pre-assessment report.

## Technical requirements and installation

## Runtime Options

- **Hosted proof of concept**: ERA publishes the latest build on the Agency's GitHub Pages space at the URL communicated to stakeholders. Accessing the application through that HTTPS endpoint is the recommended path for day-to-day exploration.
- **Local fallback**: If network policies block the hosted site or you need an offline demo, follow `TECHNICAL-SETUP.md` to serve the `dist/` bundle securely on your workstation.
