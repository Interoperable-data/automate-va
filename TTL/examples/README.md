# On the examples

The `/examples` folder contains `.ttl`-files of resources expected to be critical in the automated authorisation process. These examples show some important aspects of CLD, EC declarations and Vehicle Types. Only some are repeated here.

The introduction of new Vehicle Types must follow internal procedure [INS_VEA_011](../INS_VEA_011%20Registration%20in%20ERATV.pdf).

## CLD and EC Declaration

The following guidelines follow from the documentation on CLDs and EC Declarations.

- A set of certificates is stored as `rdfs:member` of `era:CABEvidence|vpa:Evidence` and can serve as the `dcterms:requires` of the EC Declaration supported by these CLDs. CLDs are in the end `vpa:EvidenceDocument`s.
- Where possible, the Certificates are represented with their eradis: CLD-URI's, if not a "shortened string-based" CLD must be added.
- SPARQL-query `?s dcterms:isReplacedBy+ ?p` must be able to reconstruct the historical evolution of the resource, both in the case of CLD as EC Declaration.
- An EC Declaration's end of validity date can ONLY be constructed:
  - (for all supporting certificates) through the property path `?decl dcterm:requires/rdfs:member/vpa:valid?/time:hasBeginning ?startdate` and then comparing the current date with the one calculated using the `time:hasDurationDescription`.
  - (for one specific certificate) through the path `?decl dcterms:requires/rdfs:member ?cert`, combined with `?cert vpa:valid/time:hasBeginning ?begin`, and using the same as above duration.
- Given the non-disclosed nature of some properties, the `vpa:checked` property must link to triples stored in a private graph or container.

## Other certificates and Statements

Examples are also present in order to also cover the data model of the OSS Library documents:

### Certificates referring to other EU legislation

- [ ] RID-certificate (link with era:Vehicle) - TODO, examples in V-20250417-006
- [ ] EMC, SPV, SPD-certificate: validity and legal reference

These certificates will reuse all properties of era:Certificate and are therefore classified by using of `dcterms:type` linking to `era-cert-types:`-Concept Scheme.

### Statements by the NSA, IM, RU

- [ ] Statements by the national Auth Ent.
- [X] ESC/RSC-statement

### The Declaration of Conformity to an authorised Vehicle Type

The DC2T (signed explicitly through the Application) is not explictly recreated as it can be constructed from the data in the VA Application (AuthCases).


## VA Applications

The data model confirms what is registered in ERATV: a vehicleType must be supported by  `era:VehicleAuthorisation` (for C2T or placing in service authorisations) and `era:VehicleTypeAuthorisation`, both of which are a subClassOf `vpa:Permission`. 

### From Fourth Railway Package (2016/979, 2018/545): link with authorising entities' authorisations

Each type which was authorised under the 4th Railway Package ((EU) 2016/797, detailed in (EU)2018/545), must be linked to the authorisation case for which it was the scope:

```js
eratv:{vehicle type identifier} a era:VehicleType ;
    ...
    vpa:definesCase erava:{authorisation case identified by type id + Authorising MS + index} , ... ;

erava:{authorisation case identified by type id + Authorising MS + index} a era:VehicleTypeAuthorisationCase ;
    vpa:permissionType era{SKOS-CS} ;
    ...
    # 4RP means the application exists
    vpa:constitutes erava:va-{OSSID} | erava:va-{NATIONAL AUTH ID} ;
    vpa:concerns eratv:{vehicle type identifier} ; # and relevant vehicle sets
    ...

erava:va-{OSS_ID} | erava:va-{NATIONAL AUTH ID} a era:VehicleTypeAuthorisationApplication ; 
    # if possible add more properties when known, using dcterms.
    vpa:requestFor erava:{OSSID} | erava:{NATIONAL AUTH} .

erava:{OSSID} a era:VehicleTypeAuthorisation ;
    # other properties as collected from the Authorisation-section in ERATV
```

The use of the OSS ID is possible if the VA-application was treated in OSS.

[Example type: 13-178-0010-8-001-001](https://eratv.era.europa.eu/Eratv/Home/View/13-178-0010-8-001-001)

### Before 2018/545 (3RP, 2016/797): types as introduced with 2008/57

It can generally be assumed that some information on types authorised under 3RP is not present. Comparing with a 4RP vehicle type:

- The Manufacturer is only identified by one Literal (string)
- The vehicle type holder: same
- The "area of use" not legally existing, authorisations were given for a member state.
- There is no trace in OSS, as this application did not exist and all "APIS" were delivered nationally.

In this case, the above structure is reduced as follows:

```js
eratv:vt-11-057-0018-9-001 a era:VehicleType ; # Uses: era:VehicleType subClassOf vpa:Scope
    dcterms:identifier "11-057-0018-9-001";
    era:vehicleTypeManufacturer [
      a era:OrganisationRole ;
      era:roleOf <rorg:BEST_GUESS> ;
      era:hasRole <skos:Manufacturer> .
   ];
    ...
    # ARTIFICIALLY CREATED authorisation cases per member state
    vpa:definesCase erava:vac-11-057-0018-9-001-1 ,
          erava:vac-11-057-0018-9-001-2 ,
          erava:vac-11-057-0018-9-001-3 ;

# MS 1
# Uses: era:VehicleTypeAuthorisationCase subClassOf vpa:Case
erava:vac-11-057-0018-9-001-1 a era:VehicleTypeAuthorisationCase ;                 
    vpa:permissionType era-va-authcase:PRE4RP ;  
    era:authorisingMemberState <MemberState-1> ; # Always the whole memberstate, AoU not used
    ...
    vpa:supportsRequest [
        # blankNode as it was never physically submitted
        a era:VehicleTypeAuthorisationApplication ; 
        vpa:requestFor erava:auth-11-057-0018-9-001-MS1-1 ; 
        # Only the first is needed as we can find corrections by following dcterms:isReplacedBy*
    ]. 
    
erava:auth-11-057-0018-9-001-MS1-1 a era:VehicleTypeAuthorisation ;
    # as retrieved from ERATV for older type authorisations
    dcterms:identifier "DE5920201005" ; 
    ...
```

As such, a harmonized encoding is possible.

## Configuration dependencies

### Technical Parameters

Technical parameters which depend on a configuration ?cfg are found for the VehicleType `<vt>` by using `era:configDependentParameter` as such:

```
SELECT ?vt ?val ?cfg WHERE {
?vt a era:VehicleType ;
    era:configDependentParameter/era:forConfiguration ?cfg ;
    era:configDependentParameter/era:contactStripMaterial ?val .
}
```

### (Non)Coded CfU and other restrictions

Authorisation Cases will document the (N)CCFU using `era:configDependentCondition`, a subClassOf `vpa:Compliance`, which allows the condition to link to the `vpa:checkedSection` in order to trace its origin where possible. The conditions will be instantiated as `era:VehicleTypeAuthorisationRestriction`s as such:

```
SELECT ?vt ?case ?auth ?cfg ?cfu ?cprop ?cval WHERE {
?vt a era:VehicleType ;
  vpa:definesCase ?case .
  FILTER {
    ?case a era:VehicleAuthorisationCase ;
      era:configDependentCondition/vpa:withRestriction ?cfu .
      FILTER {
        ?cfu a era:VehicleTypeAuthorisationRestriction ;
          era:forConfiguration ?cfg ;
          ?cprop ?cval .
      }
    }
}
```

### Compliance with TSI (non-checked sections and applicable specific cases)

Sections 2.1 and 2.3 of the VehicleType will make use of subClassesOf `vpa:Requirement` and `vpa:Compliance`, see the examples. 

For Section 2.2, we strongly recommend to use the `vpa:Evidence` instances, in which the certificates are a `rdfs:member`, and then express this Evidence to `vpa:supportsCase` the relevant AuthorisationCase.

> [!WARNING]
> The parameter `3.1.3.2.6 Parameters for which conformity to applicable national rules has been assessed` is also to be considered a `era:configDependentCompliance` of an AuthorisationCase.
