# Railway Legislation

In order to represent Directives, TSIs and other legal references, like IC's and Subsystems as IRI's, and not as strings, the EU Agency for Railways proposes a set of properties and classess to be used. The namespace for European Legislation Identifier `eli:`ontology is `[[http://](https://op.europa.eu/en/web/eu-vocabularies/eli)](http://data.europa.eu/eli/ontology#).

The following example will be elaborated in this document:

```csharp
eralex:dir-2014-38  rdf:type  vpa:Requirement ;
        rdfs:comment    "Amendment to Annex III to Directive 2008/57/EC, as far as noise pollution is concerned"^^<xsd:string> ;
        rdfs:label      "2014/38"^^<xsd:string> ;
        rdfs:seeAlso    "https://eur-lex.europa.eu/eli/dir/2014/38/oj"^^<xsd:anyURI> ;
        eli:amends      <http://data.europa.eu/eli/dir/2008/57/oj> ;
        owl:deprecated  "false"^^<xsd:boolean> ;
        owl:sameAs      <http://data.europa.eu/eli/dir/2014/38/oj> .
```

We also will reuse the following TSI:

```js
eralex:cir-2023-1694  rdf:type  vpa:Requirement ;
...
        eli:has_part  eralex:ic-2023-1694-5.2.1 , eralex:ic-2023/1694-5.3.1.1 , eralex:ic-2023/1694-5.3.1 , eralex:ic-2023/1694-5.3.3 , eralex:ic-2023/1694-5.2.1 , eralex:ic-2023-1694-5_3.1.1 , eralex:ic-2023-1694-5_3.1 , eralex:ic-2023-1694-5_3.3 , eralex:ic-2023-1694-5_2.1 ;
        owl:deprecated  "false"^^<xsd:boolean> ;
        owl:sameAs      <http://data.europa.eu/eli/reg_impl/2023/1694/oj> .
```

And discuss the data model for Interoperability Constituents:

```js
eralex:ic-2020-387-TS-3
        rdf:type          erava:IC ;
        rdfs:comment      "This IC (#TS-3 of its defining TSI 2020/387) handles about Eurobalise. It concerns the subsystem function CCS trackside." ;
        rdfs:label        "Eurobalise" ;
        eli:is_part_of  eralex:cir-2020-387 ;
        <http://purl.org/dc/elements/1.1/subject>
                "Eurobalise/CCS trackside" .
```

## Proposed convention

### Directives, Regulations, Decisions

For full `eli:LegalResource`, like directives, regulations, decisions, etc:

- The instances of legislation (/ERALEX dataset) are `rdf:type vp:Requirement`. As we declare the instances `owl:sameAs` IRI's in the ELI data, they are `eli:LegalResource` as well.
- This allows to reuse `eli:amends`.
- The scope of the legislation is given in `rdfs:comment`.
- The coding as YYYY/NNN or NNN/YYYY is in the `rdfs:label`
- The link to the URL at the Publications Office website is under `rdfs:seeAlso`.
- The `owl:deprecated` property must be replaced by `<http://www.w3.org/2003/06/sw-vocab-status/ns#term_status> "archaic"`. This property is used to indicate that it can not be used as a valid reference in new instances in the Agency's datasets.

### TSI's

For regulations which are TSI's:

- the defined IC's will be linked as `eli:has_part`, given they are "A component of a legal act, at an arbitrary level of precision". This means the `erava:IC` and `erava:SS` class are subClassOf `eli:LegalResourceSubDivision`.

### Subsystems and IC's

For the instances of `erava:IC`:

- The `rdfs:comment` details the IC, and `rdfs:label` is the IC name.
- A reverse link to the defining TSI is under `eli:is_part_of`.
- The ERADIS name of the IC is under `<http://purl.org/dc/elements/1.1/subject>`.

Subsystems as a whole can be refered to by using their defining TSI.

### Verification modules

Modules are foreseen to have the IRI `eralex:dec-2010-713-SB` whereby the last characters express the module. They are - like IC's - instances of `eli:LegalResourceSubdivision`, which as a subClassOf `eli:LegalResource`. In order to refer to them using for instance `dct:coverage`, they must also be considered subClassOf `dct:Jurisdiction`.
