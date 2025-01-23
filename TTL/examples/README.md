## On the examples

The `/examples` folder contains `.ttl`-files of resources expected to be critical in the automated authorisation process. These examples show some important aspects of CLD, EC declarations and Vehicle Types. Only some are repeted here.

### CLD and EC Declaration

The following guidelines follow from the documentation on CLDs and EC Declarations.

- A set of certificates `era:CertificateSet` constitutes the `dct:references` of the EC Declaration supported by these CLDs.
- Where possible, the Certificate Set `dct:hasPart` links to CLD-URI's, if not a "shortened string-based" CLD must be added.
- SPARQL-query `?s dcterms:isReplacedBy+ ?p` must be able to reconstruct the historical evolution of the resource, both in the case of CLD as EC Declaration.
- An EC Declaration's end of validity date can ONLY be constructed:
  - (for all supporting certificates) through the property path `?decl dcterm:references/dct:hasPart/vpa:valid?/time:hasBeginning ?startdate` and then comparing the current date with the one calculated using the `time:hasDurationDescription`.
  - (for one specific certificate) through the path `?decl dcterms:references/dct:hasPart ?cert`, combined with `?cert vpa:valid/time:hasBeginning ?begin`, and using the same as above duration.
- Given the non-disclosed nature of some properties, the `vpa:checked` property must link to triples stored in a private graph or container.

### VA Applications

The data model confirms what is registered in ERATV: a vehicleType must be supported by a `era:VVTAuthorisation`, which is a subClassOf `vpa:Permission`. 

#### Fourth Railway Package: link with authorising entities' authorisations

Each type which was authorised under the 4th Railway Package ((EU) 2016/797, detailed in (EU)2018/545), must be linked to the authorisation case for which it was the scope:

```js
eratv:{vehicle type identifier} a era:VehicleType ;
    ...
    vpa:definesCase eva:{authorisation case identified by type id + index} , ... ;

eva:{authorisation case identified by type id + index} a era:VAAuthorisationCase ;
    vpa:permissionType era{SKOS-CS} ;
    ...
    # 4RP means the application exists
    vpa:supports eva:va-{OSSID} | eva:va-{NATIONAL AUTH ID} ; 
    ...

eva:va-{OSS_ID} | eva:va-{NATIONAL AUTH ID} a era:VAApplication ; 
    # if possible add more properties when known, using dcterms.
    vpa:requestFor eva:{OSSID} | eva:{NATIONAL AUTH} .

eva:{OSSID} a era:VAAuthorisation ;
    # other properties as colected from the Authorisation-section in ERATV
```

[Example type: 13-178-0010-8-001-001](https://eratv.era.europa.eu/Eratv/Home/View/13-178-0010-8-001-001)

#### Before the fourth Railway Package

It can generally be assumed that several information on types authorised under pre-4RP is not present. Comparing with a 4RP vehicle type:

- The Manufacturer is only identified by one Literal (string)
- The vehicle type holder: same
- The "area of use" not legally existing, authorisations were given for a membse state.
- There is no trace with OSS, as this application did not exist and all "APIS" were delivered nationally.

In this case, the above structure is reduced as follows:

```js
eratv:vt-11-057-0018-9-001 a era:VehicleType ; # Uses: era:VehicleType subClassOf vpa:Scope
    dcterms:identifier "11-057-0018-9-001";
    era:manufacturer <era-org:BEST_GUESS> ;
    ...
    # ARTIFICIALLY CREATED authorisation cases
    vpa:definesCase eva:vac-11-057-0018-9-001-1 , eva:vac-11-057-0018-9-001-2 , eva:vac-11-057-0018-9-001-3 ;

# MS 1
# Uses: era:VAAuthorisationCase subClassOf vpa:Case
eva:vac-11-057-0018-9-001-1 a era:VAAuthorisationCase ;                 
    vpa:permissionType era-skos-va:HistoricalAuthCase ;  
    era:areaOfUse <MemberState-1> ; # Always the whole memberstate
    ...
    vpa:supports [
        # blankNode as it was never physically submitted
        a vpa:Request ; 
        vpa:requestFor eva:auth-11-057-0018-9-001-1-1 ; 
        # Only the first is needed as we can find corrections by following dcterms:isReplacedBy*
    ]. 
    
eva:auth-11-057-0018-9-001-1-1 a era:VAAuthorisation ;
    # as retrieved from ERATV for older type authoristions
    dcterms:identifier "DE5920201005" ; 
    ...
```

As such, a harmonized encoding is possible.
