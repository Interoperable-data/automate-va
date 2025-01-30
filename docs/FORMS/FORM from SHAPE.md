# Generating forms from Linked Data

The shape files `{Class}.ttl` contain **named** nodes for the `sh:PropertyShape`s in each Class. The shapes should not be blank nodes, as their subject node is explicitly required in what we propose to name the `Form Display Shape`.

Using a reference to these named nodes, this separate display shape file `{DisplayCommentForClass}-{Step Index}.ttl` can be created which structures the properties for usage in `shacl-form`.

As such, their is no double information, with the Class separated from its possible presentations as a form.

Example:
The class defining `Certificate.ttl` and `ConditionLimitOfUse.ttl` MUST have the presentation forms:

- `AddCertificateForm - step 1.ttl`, `AddCertificateForm - step 2.ttl`, ``AddCLOUForm - step 1.ttl`, etc
- `AmendCertificateForm - step 1.ttl`,
- `RestrictCertificateForm - step 1.ttl`,
- etc

each supporting the form to be generated for that step in the process.

> [!WARNING]
> In order to make an abstraction of these presentation shapes, they all `owl:import` the core classes, and are all encoded as a property of the task step of the use case.
