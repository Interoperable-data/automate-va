# Proof Of Concept Tasklist

> Before publication and rebase : move custom elements in `va-poc-ce`, after all testing is done.

See also: [the project page](https://github.com/users/Certiman/projects/4).

## Structure

Repo must be structured around `/packages` and `/playground`.

See example of a custom element library and use case [here](https://github.com/ElMassimo/vue-custom-element-example/tree/stimulus).

### Packages

The following custom elements are needed in order to reach the PoC milestones.

- [X] CE provider for Translation
- [X] CE provider for Linked Web Storage (login, /auth capture, session management, session reactivation)
- [ ] ThingProcessManager CE (based on a RDF resource under /process/task, build the steps' UI and provide for Thing creation)
- [ ] ThingsPresenter CE (needed for the reports based on (regrouped) Things' contents)
- [ ] ThingFinder CE (needed for the NamedNode's to enter during creation)
- [ ] ThingLister CE (needed for the Library to read edit and store as vpa:DocumentSet/Collection.)

### Playground

A minimal va-poc application enabling:

- [ ] Run the process to enter a subClassOf CLD
- [ ] Run the process to enter a EC Declaration
- [ ] Run the process to enter a VVT Application, and its Library
- [ ] Generate the assessment presentation using ThingsPresenter.

### Immediate priority

Refactoring within LWSHost, the functions necessary to manage:

- internal process Container (incl publicTypeIndex), creation of Task, creation of Step.
- external process collectionn through WebId, publicTypeIndex, execution of Task, Step.

Regarding the ThingsPresenter, the source of the template MUST be linked to by a property of the Step (and the file available from the process provider), through which the presentation takes place. The `ecto`-based rendered will need to have the template `source`-file available (propose to use .md), while the `data`-object will be created from the JSON-LD representation of the assessment, leaving out the `@context` key. 
