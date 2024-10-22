# Vehicle Registration

The  [`Ontology for Verified Permissions`](https://w3id.org/vpa/) allows to store vehicle registration application (cases), leading to Registrations (VR). It allows to define:

- `era:VehicleRegistration` as a subClassOf `vp:Permission`. The registration permits the requesting body to (enable to) place the vehicle in operation. The instances of this class must align to the table in [Annex 2](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018D1614#d1e32-62-1) of the EVR legislation. Its properties are described below.
- `era:VRegistrationCase` as a subClassOf `vp:Case`, which could complement the preceding authorisation case in order to support the Application for Registration.
- `era:VRApplication` as a subClassOF `vp:Request`, as submitted to the Registering Entity.

## Example

To identify a VR, the Keeper's orgCode could be chosen, followed by a sequence number. Of course, a unique identifier could be chosen as well.

```
eravr:NNNN-n a era:VehicleRegistration .  
eravr:vr-NNNN-n a era:VRApplication .
```

The registration cases are defined in 3.2.2 of Annex II, Appendix 4 and will be available as SKOS Concepts. They merge the Registration Case type, with the Registration Case, e.g. as `rdfs:label "New - New Registration"` or `rdfs:label "Update - Change of Owner"`.

```
# The registration case itself documents the type of registration which is executed.
eravr:vrc-NNNN-n-0 a era:VRegistrationCase ;
                   vp:permissionType <era-vr-regCase:UpdateOwner> . # proposed name for the ERA SKOS CS.
```

The process requires the Keeper to request for the Registration, by issuing a Vehicle Registration Application:

```
keeper:KE-NNNN vp:requests eravr:NNNN-n ; # the keeper, with its org Id.
               vp:issues eravr:vr-NNNN-n .
```

Much of the data coming from the Vehicle's Authorisation, if available as linked data, could be reused as supporting the Registration process:

```
# The preceding Authorisation can serve the Registration!
erava:vac-V-YYYYMMDD-NNN-0 vp:supports eravr:vr-NNN-n ; # allows to reuse the linked data of the auth case regarding vehicles, aou, and underlying evidence.
                           vp:requestFor eravr:NNN-n .
```

## Data model

The data model for Vehicle Registrations is deduced from the e-form.

### (12) Additional fields

`rdfs:comments` can provide for this data.

### EVNs

The vehicles are regrouped into a `era:VehiclesCollection owl:subClassOf vp:Scope`. This enables us to express

`eravr:vrc-NNNN-n-0 a vp:Case ; vp:concerns eravr:vehcol-uuid` to indicate what vehicles are in the Registration Case.

### Memberstate of registration

We use the [existing](https://github.com/Certiman/ERA-Ontology-5.0.0-5.1.0/blob/main/ontology.ttl) property 'era:inCountry`, which shall have a.

`eravr:NNNN-n a era:VehicleRegistration ; era:inCountry <EU SKOS CS for relevant country> .`

### (3) Memberstate where Vehicles are authorised & underlying (11) Authorisations

The link between a registration and its preceding authorisation is modeled:

- OR, by linking an existing authorisationCase, containing the VehiclesCollection as above, through which the Authorisation can be retrieved. It contains the AoU.
- OR, using a property to be defined. In some cases, the preceding authorisation can not be recovered and should be deduced from data in ERATV.
- OR, by no such link, for cases which are not covered above.

In the last case, a property should be added.

### Additional conditions

### Manufacturing details

### EC DoV

### Owner, Keeper and ECM

### Registration Status
