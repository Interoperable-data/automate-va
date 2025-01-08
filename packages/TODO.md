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
- [ ] ThingsPresenter CE (needed for the reports based on Things' contents)
- [ ] ThingFinder CE (needed for the NamedNode's to enter during creation)
- [ ] ThingLister CE (needed for the Library to read edit and store as vpa:DocumentSet/Collection.)

### Playground

A minimal va-poc application enabling:

- [ ] Run the process to enter a subClassOf CLD
- [ ] Run the process to enter a EC Declaration
- [ ] Run the process to enter a VVT Application, and its Library

### Immediate priority

Refactoring within LWSHost, the functions necessary to manage:

- internal process Container (incl publicTypeIndex), creation of Task, creation of Step.
- external process collectionn through WebId, publicTypeIndex, execution of Task, Step.
