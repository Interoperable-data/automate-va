# Process Handler

> A `Process Handler` will use the data retrieved by a `Process Connector` to execute the process.

It is at least able to:

- list the retrieved processes, and the tasks they provide;
- allow for a version of a task to be started, by starting the first step of that version (`rdf:first`);
- allow for tasks to be following each other, by executing the task and heading for the `rdf:rest`-refered Task;
- allow for the closure of the task, mostly the storage of the new or modified data, which can be shown as a summary.

The closure would return to the list of processes and tasks.

The handler does not change anything to the processes/tasks/steps, this is to be done by the task owner using the [Process Manager](./process-manager.md) component.

The process handler will require several assisting components to show and manipulate tasks. A limited set is given here.

## Process & Task List

As above, with UI-elements to start the task of a certain version. The versions of a task shall be collected by tracing the versions of its steps (`schema:version`).

## Form Displayer

Using a SHACL-shape as found in the step under `dcterms:source` (a TTL file), displays the SHACL-FORM and returns the triples for further use. 

If the Displayer is given an IRI of an instance of the class as described in the SHAPE file, the data will be displayed in non-editable form.


The displayer should not execute any writing into the storage.

