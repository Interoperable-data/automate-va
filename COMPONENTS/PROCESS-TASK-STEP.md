# Process - Task - Step

We propose to use linked data descriptions of the collection and management processes as well.

In order to structure the required data, we imagine Processes, to contain Tasks, and Tasks to contain Steps.

The details of the action are present in the instance of a Step. The order of the Step within the Task is given by using `rdf:first` in the Task and `rdf:rest` in the Step, linking to the next Step instance. A version can be added to each Step as well, to model evolutions of the Task.

Each process task must be an instance of `dul:Task` or `prov:Action`, with its steps instances of `dul:Action` or `prov:Activity`. Each step contains several properties allowing a Process Handler to show the step contents, and know where to collect/store the data involved in the step. The processes are instance of `dul:Process`. Steps have versions (creating versions of the Task), and their sequence can be deduced (usage of `rdf:first`, `rdf:rest`).

The processes, tasks and steps can be created using a Process Manager component.
