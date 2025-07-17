# Machine-readable assessments

In order to execute the validation of assessments as linked data, also the individual requirements must be present in the KG ERALEX.

## Example: Annexes I and II of the PAVA

The VPA ontology allows the contents of these annexes to be expressed as `vpa:Requirement`s, and more specifically as `vpa:checkedSection`s within these.

### Annex as a `vpa:Requirement`

The Annexes being part of an EURLEX instance can be represented as a `vpa:Requirement` themselves:

```rdf
# The collection of checks as a Requirement, as located in the ERALEX graph
eralex:PAVA-AnnexI a vpa:Requirement ;
  rdfs:label "ANNEX I" ;
  rdfs:comment "Content of the application";
  dcterms:description "Required information to be submitted by the applicant. Optional information may still be submitted by the applicant."@en ;
  vpa:sections eralex:PAVA-AnnexI-1 , eralex:PAVA-AnnexI-2 , eralex:PAVA-AnnexI-11 # , ...
  dcterms:source <http://data.europa.eu/eli/reg_impl/2018/545/2020-06-16#anx_I> .

eralex:PAVA-AnnexII a vpa:Requirement ;
  rdfs:label "ANNEX II" ;
  rdfs:comment "Aspects for assessment by the authorising entity";
  dcterms:description "The information that shall be assessed by the authorising entity is specified per authorisation case. An (x) in the column for the applicable authorisation case indicates that this aspect is mandatory to assess for this authorisation case."@en ;
  vpa:sections eralex:PAVA-AnnexII-1 , eralex:PAVA-AnnexII-2 , eralex:PAVA-AnnexII-11 # , ...
  dcterms:source <http://data.europa.eu/eli/reg_impl/2018/545/2020-06-16#anx_II> .
```

### The Annex verification as Sections of that Requirement

The sections represent the legal text of the individual requirement to be checked, extended with `era:shaclShapeValidationRule` if there is a SCHACL-shape which could be applied to execute that assessment automatically:

#### Annex I

Annex I can be deduced from the completeness reports in OSS

```rdf
# The collection of sections within that requirement some of which have automated shacl validation rulez.
eralex:PAVA-AnnexI-1 a skos:Concept ;
  rdfs:label "(I) 1." ;
  rdfs:comment "The type of application is described in the application form" ;
  skos:note "AUTOMATIC" ; # Check of vpa:permissionType to be the relevant one.
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_1> .

eralex:PAVA-AnnexI-2 a skos:Concept ;
  rdfs:label "(I) 2." ;
  rdfs:comment "The authorisation case is described in the application form" ;
  skos:note "AUTOMATIC" ; # Check of a `dcterms:description`
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_2> .

eralex:PAVA-AnnexI-3-1 a skos:Concept ;
  rdfs:label "(I) 3.1" ;
  skos:note "AUTOMATIC" ;
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_31> ;
  rdfs:comment """3. The area of use is described in the application form, regarding the following aspects:
3.1. Member States"""@en .

eralex:PAVA-AnnexI-3-2 a skos:Concept ;
  rdfs:label "(I) 3.2" ;
  skos:note "AUTOMATIC" ;
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_32> ;
  rdfs:comment """3. The area of use is described in the application form, regarding the following aspects:
3.2. Networks (per Member State)"""@en .

eralex:PAVA-AnnexI-3-3 a skos:Concept ;
  rdfs:label "(I) 3.3" ;
  skos:note "AUTOMATIC" ;
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_33> ;
  rdfs:comment """3. The area of use is described in the application form, regarding the following aspects:
3.3. Stations with similar network characteristics in neighbouring Member States when those stations are close to the border"""@en .

eralex:PAVA-AnnexI-3-4 a skos:Concept ;
  rdfs:label "(I) 3.4" ;
  skos:note "AUTOMATIC" ;
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_34> ;
  rdfs:comment """3. The area of use is described in the application form, regarding the following aspects:
3.4. Definition of the extended area of use (only applicable for the authorisation case ‘Extended area of use’)"""@en .

eralex:PAVA-AnnexI-3-5 a skos:Concept ;
  rdfs:label "(I) 3.5" ;
  skos:note "AUTOMATIC" ;
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_35> ;
  rdfs:comment """3. The area of use is described in the application form, regarding the following aspects:
3.5. Whole EU network (applicable for wagons conforming with chapter 7.1.2 of TSI WAG )"""@en .

eralex:PAVA-AnnexI-4-1 a skos:Concept ;
  rdfs:label "(I) 4.1" ;
  skos:note "AUTOMATIC" ; # Check of the dcterms:audience ORG-URI vs the SINGLE OR MULTIPLE area of use of the auth cases.
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_41> ;
  rdfs:comment """The authorising entity issuing authority is identified in the application form and corresponds to:
4.1. The Agency: area of use covers networks in 1 or more MS"""@en .

eralex:PAVA-AnnexI-4-2 a skos:Concept ;
  rdfs:label "(I) 4.2" ;
  skos:note "AUTOMATIC" ; # Check of the dcterms:audience ORG-URI vs the SINGLE area of use of the auth cases.
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_42> ;
  rdfs:comment """The authorising entity issuing authority is identified in the application form and corresponds to:
4.2 The national safety authority of the Member State concerned: area of use covering 1 MS"""@en .
#...
eralex:PAVA-AnnexI-11 a skos:Concept ;
  rdfs:label "(I) 11.1"
  rdfs:comment "The information about the vehicles is complete in the application form: vehicles are properly identified (EVN numbers, pre-reserved vehicle numbers, other identification)"
  skos:note "AUTOMATIC" ;
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_11_1a> , <http://data.europa.eu/949/shapes/PAVA/CC_I_11_1b> .
# ...
eralex:PAVA-AnnexI-18-1 a skos:Concept ;
  rdfs:label "(I) 18.1"
  rdfs:comment "18.4 The declaration(s) of conformity to the type (Article 24 Directive (EU) 2016/797) are available in the file accompanying the application for authorisation."
  skos:note "AUTOMATIC" ; # The DC2T is automatically generated from the URI(Applicant) & the vpa:Scope of all the authorisation cases.
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_I_18_1> .
```

#### Annex II and III

Annex II can be taken directly from the legislation:

```
eralex:PAVA-AnnexII-1 a skos:Concept ;
  rdfs:label "(II) 1." ;
  skos:note "MANUAL ONLY - pre-engagement baseline is not machine-readable" ;
  rdfs:comment "Application consistent with the pre-engagement baseline (when applicable)" .

eralex:PAVA-AnnexII-2 a skos:Concept ;
  rdfs:label "(II) 2." ;
  skos:note "AUTOMATIC" ; # eg: C2T requires its scope 'VT' to be in state Valid. Others require it to be in Draft.
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_II_2> ;
  rdfs:comment "Authorisation case selected by the applicant is adequate" .

eralex:PAVA-AnnexII-3 a skos:Concept ;
  rdfs:label "(II) 3." ;
  skos:note "AUTOMATIC" ; # The submittedFor Evidence must contain the URI's to the expected TSI's
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_II_3> ;
  rdfs:comment "The TSIs and other applicable Union law identified by the applicant are correct" .

eralex:PAVA-AnnexII-4 a skos:Concept ;
  rdfs:label "(II) 4." ;
  skos:note "AUTOMATIC" ; # All EvidenceDocuments 'dcterms:author` organisations must link to a valid accreditation/refcognition in ERADIS+
  era:shaclShapeValidationRule <http://data.europa.eu/949/shapes/PAVA/CC_II_4> ;
  rdfs:comment "Selected conformity assessment bodies (notified body(ies), assessment body (CSM RA)) have the proper accreditation or recognition as applicable" .

eralex:PAVA-AnnexII-51 a skos:Concept ;
  rdfs:label "(II) 5.1." ;
  skos:note "MANUAL" ; # Currently not annotated in the EvidenceDocument's in ERADIS+
  rdfs:comment """Non-applications of TSIs according to the provisions of Article 7 of Directive (EU) 2016/797:
5.1.  Validity (time and area of use);"""@en .
#...
eralex:PAVA-AnnexII-81 a skos:Concept ;
  rdfs:label "(II) 8.1." ;
  skos:note "MANUAL" ; # Currently not automated
  rdfs:comment """EC Declarations of Verification and EC certificates (Article 15 Directive (EU) 2016/797), check:
8.1.  Signatures;"""@en .

eralex:PAVA-AnnexII-82 a skos:Concept ;
  rdfs:label "(II) 8.2." ;
  skos:note "AUTOMATIC" ; # EvidenceDocuments in Evidence have their `dcterms:expires` before the current date and are applicable to the Case.
  rdfs:comment """EC Declarations of Verification and EC certificates (Article 15 Directive (EU) 2016/797), check:
8.2.  Validity;"""@en .
#...
```

## The final SHACL validation rules

Each requirement in the legislation can be verified using one or more typical SHACL validation checks, for instance like so:

```shacl
<http://data.europa.eu/949/shapes/PAVA/CC_II_2>
  a sh:NodeShape ;
  sh:targetClass era:VehicleTypeAuthorisationApplication ;
  sh:sparql [
    a sh:SPARQLConstraint ;   # This triple is optional
    sh:message "VA Applications contain a valid authorisation case. Valid combinations are not checked." ;
    sh:prefixes vpa: , era-va-authcase: ;
    sh:select """
  SELECT $this ?authcasetype
  WHERE {
    $this vpa:constitutedBy/vpa:permissionType ?authcasetype .
    FILTER (  !isLiteral(?authcasetype)                ||  # literal is not allowed
              !( ?authcasetype = era-va-authcase:C2T ) ||  # correct SKOS Concept for C2T
              !( ?authcasetype = era-va-authcase:NEW )     # correct SKOS Concept for NEW
              # incomplete
           )
    }
    """ ;
  ] .

<http://data.europa.eu/949/shapes/PAVA/CC_I_11_1b>
  a sh:NodeShape ;
  sh:targetClass era:VehicleTypeAuthorisationApplication ;
  sh:sparql [
    a sh:SPARQLConstraint ;   # This triple is optional
    sh:message "VA Applications contain valid vehicle numbers (eventually in vehicle sets) as their scope." ;
    sh:js [ # js helper to validate the vehicle numbers at ?this  ]
  ]. 
```
