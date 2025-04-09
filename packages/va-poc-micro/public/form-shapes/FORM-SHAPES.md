# SHACL defining form contents

We use `@ulb-darmstadt/shacl-form` to generate forms (as displayed in Steps) from SHACL. The Step in RDF contains the property `dcterms:source` to point to the SHACL file containing the NodeShapes necessary. If it does not contain SHACL or the property is not in the Step, no form should be displayed.