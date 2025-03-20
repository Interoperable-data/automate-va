---
next:
  text: 'Vehicle Data Model'
  link: '/EVR/VEHICLES/'
---
# Vehicle Registration

The  [`Ontology for Verified Permissions`](https://w3id.org/vpa/) allows to store vehicle registration application (cases), leading to Vehicle Registrations (VR). It allows to define:

- `era:VehicleRegistration` as a subClassOf `vpa:Permission`. The registration permits the requesting body to (enable to) place the vehicle in operation. The instances of this class must align to the table in [Annex 2](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018D1614#d1e32-62-1) of the EVR legislation. Its properties are described below.
- `era:VehicleRegistrationCase` as a subClassOf `vpa:Case`, which could complement the preceding authorisation case in order to support the Application for Registration.
- `era:VehicleRegistrationApplication` as a subClassOF `vpa:Request`, as submitted to the Registering Entity (RE).

## Example

To identify a VR, the Keeper's orgCode could be chosen, followed by a sequence number. Of course, a unique identifier could be chosen as well.

```js
eravr:NNNN-n a era:VehicleRegistration ; # vpa:Permission
  dcterms:issued "{date_of_issue_by_RE}"^^xsd:date ;
  vpa:status <{SKOS CS of Registration Status}> ;
  vpa:valid [
    a time:Interval ;
    # validity of the Permission
  ] ;
  vpa:grantedBy [
    a era:OrganisationRole ;
    era:hasOrganisationRole <{SKOS Concept for RE}> ;
    era:roleOf <{URI_of_RE}>
  ] ;
  vpa:requestedBy [
    a era:OrganisationRole ;
    era:hasOrganisationRole <{SKOS Concept for Keeper Role}> ;
    era:roleOf <{URI_of_Keeper}>
  ];
  # ...
  .

eravr:vr-NNNN-n a era:VehicleRegistrationApplication ; # vpa:Request
  vpa:status <{status of the application as a whole}> ;
  vpa:requestFor eravr:NNNN-n ;
  
```

The registration cases are defined in 3.2.2 of Annex II, Appendix 4 and will be available as SKOS Concepts. They merge the Registration Case type, with the Registration Case, e.g. as `rdfs:label "New - New Registration"` or `rdfs:label "Update - Change of Owner"`.

```js
# The registration case itself documents the type of registration which is executed, and contains the core data of the registration.
eravr:vrc-NNNN-n-0 a era:VehicleRegistrationCase ;
  vpa:permissionType <era-vr-regcase:{from the SKOS CS}> . # era-skos-VehicleRegistrationCase.ttl
  vpa:supports eravr:vr-NNNN-n ;
  era:registeringMemberState <{SKOS CS of the EU MS}> ;
  era:additionalVehicleConditions <{SKOS CS of the 4.1 table: era-skos-InternationalVehicleAgreements}> ;
  era:additionalOtherVehicleConditions "{Other conditions, added as text}" ;
```

In most circumstances, individual vehicles (having a manufacturing year and serial number), and a vehicle type (5.3 ERATV Reference), will be the Scope of every Registration Case:

```js
eravr:vrc-NNNN-n-0 a era:VehicleRegistrationCase ;
  # ... as above
  vpa:concerns evr:{Vehicle-Number} , evr:{Vehicle-Number} , ... ;
  vpa:concerns evr:{VehicleSeries} ; # alternative for a set of vehicles.
  vpa:concerns eratv:{VehicleType} ; # Automatic link to 6, 
```

### Reuse of authorisation data 

Much of the data coming from the Vehicle's Authorisation, if available as linked data, could be reused as supporting the Registration process:

```csharp
# The preceding Authorisation Case can support the Registration request!
erava:vac-V-YYYYMMDD-NNN-0 vpa:supports eravr:vr-NNN-n ; # allows to reuse the linked data of the auth case regarding vehicles, aou, and underlying evidence.
                           vpa:requestFor eravr:NNN-n .
```

## Data model

The data model for Vehicle Registrations is deduced from the e-form. The properties are mostly connected to the underlying `RegistrationCase`.

### (12) Additional fields

`rdfs:comments` can provide for this data.

### Vehicle Series (5.4)

The vehicles could also be regrouped into a `era:VehiclesSeries rdfs:subClassOf vpa:Scope`. This enables us to express `eravr:vrc-NNNN-n-0 a vpa:Case ; vpa:concerns eravr:vehcol-uuid` to indicate what vehicles are in the Registration Case.

### Memberstate of registration

We do not use the [existing](https://github.com/Certiman/ERA-Ontology-5.0.0-5.1.0/blob/main/ontology.ttl) property 'era:inCountry`, but a new property `era:registeringMemberState`.

`eravr:NNNN-n a era:VehicleRegistration ; era:registeringMemberState <EU SKOS CS for relevant country> .`

### (3) Memberstate where Vehicles are authorised & underlying (11) Authorisations

The link between a registration and its preceding authorisation is modeled:

- OR, by linking an existing authorisationCase, containing the VehiclesCollection as above, through which the Authorisation can be retrieved. It contains the AoU.
- OR, using a property to be defined. In some cases, the preceding authorisation can not be recovered and should be deduced from data in ERATV.
- OR, by no such link, for cases which are not covered above.

In the last case, a property should be added.

### Additional conditions

We reuse the approach as supported by the `vpa:` ontology, in which a Restriction originates from a Compliance check:

```js
eravr:vrc-NNNN-n-0 a era:VehicleRegistrationCase ;
  # ... as above
  era:vehicleDependentCondition [                      # New property for VehicleRegistrationCase to VehicleCompliance
    a era:VehicleRegistrationCheck ;                    # New Class,subClassOf vpa:Compliance
    vpa:withRestriction evr:NCCFU-uuid(NNNN-n) ;
    # optional vpa:checkedSection <{where the condition comes from}>
  ] .

evr:NCCFU-uuid(NNNN-n) a era:VehicleRegistrationRestriction ;
  {coded-restriction-property} {coded-restriction-literal-value} ; # see the approach as in authorisations
  era:nonCodedRestrictions "{any non-coded ones}" .
```

### Manufacturing details

The parameters 5.1 (Manufacturing Year), 5.2 (serial number) and 5.4 (`era:inVehicleSeries`) will be linked to the individual vehicle

### EC DoV

An automatic link with the EC DOV's is possible, through the VehicleType, which must have been the scope of an AuthorisationCase, in which the DOV was submitted as a `vpa:EvidenceDocument`. The Keeper should not be able to enter manually the EC DOV.

### Owner, Keeper and ECM

Link to the URI of that organisation (through the Organisation Role) as shown above. 

> [!WARNING]
> The process requires the Keeper to request for the Registration, by issuing a Vehicle Registration Application, but the link will be stored inversely, as we do not update the instances of the organisations themselves. The following triples will need to be avoided.

```csharp
keeper:KE-NNNN vpa:requests eravr:NNNN-n ; # the keeper, with its org Id.
               vpa:issues eravr:vr-NNNN-n .
```

### Registration Status

A SKOS Concept Scheme has been added based on [Appendix 3](https://eur-lex.europa.eu/eli/dec_impl/2018/1614/oj#anx_II.app_3) of Annex II of the EVR Regulation. We use `vpa:status`, as the `era:VehicleRegistration` is a subClassOf `vpa:Permission`. 
