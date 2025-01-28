# Restrictions in Documented Evidence

This data most likely needs to be stored in non-public GRAPHS or LWS Containers. If possible, the document detailing the restrictions (for CLD's, the NoBo file) should also be privately stored and linked to.

## Model

The `Verified Permissions`-ontology allows for `vpa:DocumentedEvidence` (DE) to provide information on its restrictions.

Two ways to do this are provided on the `vpa:DocumentedEvidence` DE-class:

- using `vpa:withRestriction` directly; or,
- using `vpa:checked` with specific Compliance check results, which then link to the Restriction.

The Restriction always links to the high-level Requirement that caused it. As such, the data consumer at least can determine that context.

This Requirement can be detailed by providing precise `vpa:sections` to comply with (SKOS Concept Schemes). It is possible to express compliance to these sections as well.

To make use of this possibility, the DE can link to Compliance Checks, instance of `vpa:Compliance`. In these, it is possible to express the checked section, the result, and link back to the specific Restriction.

## Example with CLD

The following example contains properties of the `Dublin Core TERMS`-ontology (prefix `dct:`), which can always be used to detail the resource.

```csharp
# The publicly available data on the CLD
:eccert-{uuid} a vpa:DocumentedEvidence ;
        ...
        vpa:withRestriction :clou-{uuid} ; # direct link
        vpa:checked :comp-{uuid}-1 , :comp-{uuid}-2, :comp-{uuid}-3 ; # detailed link
        ...
.

# The Restriction is only documented in regard of the legislative reference used.
:clou-{uuid} a vpa:Restriction ;
        vpa:regarding eralex:{id of the /ERALEX resource} ;
        dct:identifier "{unique id of this identifier}" ;
        dct:source <{URI of the NoBoFile}> ;
        dct:created "{CREATION_DATE}" ;
        rdfs:comment "{The textual content of the restriction as noted by the Appropriate Body}" 
.

# Link through the specifics Compliance checks
:comp-{uuid}-1 a vpa:Compliance ;
        vpa:checkedSection eralex:{id of the checked section in /ERALEX resource} ;
        vpa:isCompliant "true"^^xsd:boolean ;
        dct:source <{URI of the NoBoFile}> ;
        dct:created "{CREATION_DATE}" ;
        wp:withRestriction :clou-{uuid} 
.
```

## Example with Section 2 of a VehicleType

The link between the VehicleType and the (non)-Compliance with TSI Sections happens through the mandatory `EC TEC`/`EC DEC`, linked to by `era:certificate`.


```
2.2 EC certificate of verification:
Reference of ‘EC type examination certificates’ (if module SB applied) and/or ‘EC design examination certificates’ (if module SH1 applied)
[character string] (possibility to indicate several certificates, e.g. certificate for rolling stock subsystem, certificate for CCS, etc.)
```


