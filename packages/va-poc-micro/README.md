# Vehicle Authorisation Toolbox (Preview)

This application helps railway applicants, conformity assessment bodies, and authorising entities prepare the material needed for vehicle authorisation and registration. It runs entirely in a web browser—no database or server installation is required.

> [!INFO]
> The toolbox is a proof of concept prepared by the EU Agency for Railways (ERA). It is shared to gather feedback from practitioners; using it does not grant any rights and ERA cannot be held responsible for the results produced.

## What the toolbox offers

- **Keep track of your organisations**: Record your holding companies, operational organisations, their units, and the sites where they operate. You can link units to their parent organisations and reuse the captured information in later tasks.
- **Store supporting evidence**: Organise EC declarations, certification level documents (CLDs), conditions and limits of use, and other statements/documents you need during authorisation.
- **Preview your data**: See the full dataset in a readable format, download it for archiving, or share it with colleagues for review.
- **Run remote checks**: Send your dataset to an ERA-hosted validation service. The tool highlights feedback from the service so you can adjust your submission before filing it officially.

## How your information is handled

- Your entries stay in your browser. The app saves them in the local storage space of the browser you use (IndexedDB). Clearing your browsing data will remove the records unless you export them first.
- You can export the information at any time as standards-based files (Turtle/Trig). These files can be shared with colleagues or re-imported later.
- When you add or edit information, the forms are pre-configured so that relationships use the correct vocabulary (for example, linking a unit to its parent organisation uses the proper `org:hasUnit` and `org:unitOf` relations behind the scenes).

## Manage your Objects of Assessment

Because these will be reused in potentially many of your applications for authorisation of a vehicle (type), you will be able to group together:

- All subsystem-level declarations, and their supporting subsystem CLDs;
- All Declarations of Conformity, which you can link to a subsystem CLD of choice.

You will also be able to link any CLD with Declarations of Verification or Conformity, if the ERA ERADIS+ knowledge graph does not yet contain the links.

Upon request of NBRail, Conditions and Limits of Use can be linked to certain types of CLD, and stored in separate files.

In order to accommodate the automatic pre-assessment for CLDs which are partially covering for newer TSIs, or (added or optional) functions (see CSS), the tool allows you to add this data to a given CLD.

The tool also supports the creation and management of DeBo certificates or any other certificate under EU railway legislation. At last, it also supports the creation and management of `Statements`, like the ESC, RSC statements, or statements from an authorising entity.

## Apply for Efficient Vehicle(Type) Authorisations (EVA)

The core function of the toolbox is to allow both Applicants and Authorising Entities to pre-assess their applications. After having created the Objects of Assessment as above (as a set of `era:CABEvidence`), the data necessary to compose a `VehicleTypeAuthorisationApplication` and its `VehicleTypeAuthorisationCase`s can be entered and managed. The draft `VehicleAuthorisation` will also be created in the local knowledge graph (browser-based). The full data graph can then be sent to the EC Interoperability Testbed for validation, using public shape graphs from the ERA. On return, the SHACL Validation report (which is only readable by experts) will be converted into a human-readable pre-assessment report.

## Typical workflow

1. **Capture organisation details**: Add holdings, operating companies, their business units, and sites. Use the built-in pick lists to link one entry to another.
2. **Upload or describe supporting evidence**: Keep Declarations of Conformity, Statements, and other documents together with the organisations or cases they support.
3. **Review the dataset**: Open the “Raw data” view to confirm everything looks correct. Export a copy if you need an offline record.
4. **Validate with ERA services**: When ready, trigger a validation round-trip to receive feedback on missing or inconsistent information.

## Getting access

- **Hosted preview**: ERA provides a secure HTTPS address for partners who want to try the toolbox. Use a recent version of Chrome, Edge, Firefox, or Safari.
- **Secure local run**: Organisations that need an offline demo or are blocked by network policies can host the compiled bundle themselves. See `TECHNICAL-SETUP.md` for the step‑by‑step procedure.

For additional support or to request new capabilities, contact the project team through the official ERA communication channels.
