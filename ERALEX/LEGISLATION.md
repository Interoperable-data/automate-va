# Railway Legislation

In order to represent Directives, TSIs and other legal references, like IC's and Subsystems as IRI's, and not as strings, the EU Agency for Railways proposes a set of properties and classess to be used.

The namespace for [European Legislation Identifier](http://data.europa.eu/eli/ontology#) `eli:` is [further explained here](https://op.europa.eu/en/web/eu-vocabularies/eli).

The namespace for [DCMI Metadata Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) `dct:` is [further explained here](https://www.dublincore.org/specifications/dublin-core/).

The following example will be elaborated in this document:

```csharp
eralex:reg_impl-2023-1694
        rdf:type        vpa:Requirement , eli:LegalResource ;
        rdfs:comment    "(Amending 2019/777) On the common specifications of the register of railway infrastructure"^^<xsd:string> ;
        rdfs:label      "2023/1694"^^<xsd:string> ;
        rdfs:seeAlso    "http://data.europa.eu/eli/reg_impl/2023/1694/oj"^^<xsd:anyURI> ;
        eli:amends      <http://data.europa.eu/eli/reg_impl/2019/777/oj> ;
        owl:deprecated  "false"^^<xsd:boolean> ;
        owl:sameAs      <http://data.europa.eu/eli/reg_impl/2023/1694/oj> .
```

We also will reuse the following TSI, as we will extend these to be `dct:Standard`s:

```csharp
eralex:cir-2023-1694  rdf:type  vpa:Requirement , eli:LegalResource, dct:Standard ;
...
        eli:has_part  eralex:ic-2023-1694-5.2.1 , eralex:ic-2023/1694-5.3.1.1 , eralex:ic-2023/1694-5.3.1 , eralex:ic-2023/1694-5.3.3 , eralex:ic-2023/1694-5.2.1 , eralex:ic-2023-1694-5_3.1.1 , eralex:ic-2023-1694-5_3.1 , eralex:ic-2023-1694-5_3.3 , eralex:ic-2023-1694-5_2.1 ;
        owl:deprecated  "false"^^<xsd:boolean> ;
        owl:sameAs      <http://data.europa.eu/eli/reg_impl/2023/1694/oj> .
```

And discuss the data model for Interoperability Constituents:

```csharp
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

- The instances of legislation (/ERALEX dataset) are `rdf:type vpa:Requirement`. As we declare the instances `owl:sameAs` IRI's in the ELI data, they are `eli:LegalResource` as well.
- This allows to reuse `eli:amends`.
- The scope of the legislation is given in `rdfs:comment`.
- The coding as YYYY/NNN or NNN/YYYY is in the `rdfs:label`
- The link to the URL at the Publications Office website is under `rdfs:seeAlso`.
- The `owl:deprecated` property must be replaced by `<http://www.w3.org/2003/06/sw-vocab-status/ns#term_status> "archaic"`. This property is used to indicate that it can not be used as a valid reference in new instances in the Agency's datasets.

### TSI's (Subsystems)

Regulations which are TSI's, can be used to identify a (verified) subsystem.

### Interoperability Constituents

> [!WARNING]
> The modelling of IC's is to be considered `unstable`.

For the instances of `erava:IC`:

- the defined IC's are linked as `eli:has_part`, given they are "A component of a legal act, at an arbitrary level of precision". This means the `erava:IC` and `erava:SS` class are subClassOf `eli:LegalResourceSubDivision`.
- The `rdfs:comment` details the IC, and `rdfs:label` is the IC name.
- A reverse link to the defining TSI is under `eli:is_part_of`.
- The ERADIS name of the IC is under `<http://purl.org/dc/elements/1.1/subject>`.

### Verification modules

Modules are foreseen to have the IRI `eralex:dec-2010-713-SB` whereby the last characters express the module. They are - like IC's - instances of `eli:LegalResourceSubdivision`, which as a subClassOf `eli:LegalResource`. In order to refer to them using for instance `dct:coverage`, they must also be considered subClassOf `dct:Jurisdiction`.
