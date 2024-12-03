# Process Manager

> A `Process Manager` allows to create a process, add tasks, and refine the steps in these tasks in the writable location (LWS/TS/File). Further, the Manager allows, in some platforms, to control the access to the task to certain stakeholders.

Example: when using LWS to store processes, WebId's can be granted access to individual RDFResources (tasks), or BasicContainers containing the process. LWS always requires to log into the Storage with the provider's WebId itself before being able to add resources of any kind.

The process manager will require several assisting components. A limited set is given here.

## Add Process

From a SHACL SHAPE-file, a small form could be shown, and the process is added:

- LWS: AS a `LDP:BasicContainer`, of which the location is configured using `Public Type Index` (see also [connector](./process-connector.md));
- Triple Stores: to the relevant Graph/dataset;
- File: to the TTL file.

Currently, a process has no properties.

## Add Task

From a SHACL SHAPE-file, a small form could be shown, and the task is added to the Process with name `ProcessName`:

- LWS: AS a `LDP:RDFSource` and a `dul:Task` in the Process Container.
- TS: *add*
- File: *add*

Currently, a task has the following properties (LWS example):

```js
<https://{STORAGEPROVIDER/}{processRootContainer/}{ProcessName/}{TaskName}>
        a               dul:Task , ldp:RDFSource;
        rdf:first       <https://{STORAGEPROVIDER/}{processRootContainer/}/{ProcessName}/{TaskName}#1728977376498>;
        rdfs:comment    "TITLE OF THE TASK";
        dct:source      <URI-to-SOURCE>, <URI-to-OTHER-SOURCE> ;
        vcard:hasEmail <mailto:task.author@email.example> .
```

Sources (`dct:source`) contain datasets from which the user needs to enter URI's. They are retrievable by providing a search function on the resources datatype-properties, and returning the URI of the found resource, which is then entered.

## Add Step

From a SHACL Shape-file, a form could be shown, and the Step is added to the Task, with a unique identifier (uuid4).

- LWS:

Currently, a Step has the following properties (LWS example):

```js
<https://{STORAGEPROVIDER/}{processRootContainer/}{ProcessName/}{TaskName}#1728997997702>
        a               dul:Action;
        <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest>  ();
        rdfs:label      "STEP title"@nl-NL , "STEP title"@en-US , "Step title"@fr-FR;
        dct:description "STEP explanation"@en-US;
        dct:source      <https://{STORAGEPROVIDER/}{processRootContainer/}/{ProcessName/}{TaskName}/form_shape_file.ttl>;
        schema:version  1;
        dul:realizes    "org" .
```

In the context of a Step, a `dct:source` must refer to a SHACL-resource which describes the shape in order to generate a form, specific for that step.
