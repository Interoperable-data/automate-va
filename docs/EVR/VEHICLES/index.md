# Data model for Vehicles

Individual vehicles have some properties which are not contained in the technical parameters of their Vehicle Type. This document describes a proposed ontology for instances of `era:Vehicle` in the KG.

Legal basis: <http://data.europa.eu/eli/dec_impl/2018/1614/oj> (Appendix 6)

- (part 0) Vehicle Identification ("European Vehicle Number")
- (part 4) Coding of the countries in which the vehicles are registered (digits 3-4 and abbreviation): `era:VehicleRegistration`
- (part 6) Interoperability Codes
- (part 7) For hauled passenger vehicles: international traffic ability codes
- (part 8) For Tractive rolling stock and units in a trainset in fixed or pre-defined formation: type codes (digit 2)
- (parts 9 - 13)
  - Wagons: numerical (part 9) & letter (12) markings
  - Hauled Passenger stock: technical chars (10) and letter markings (13)
  - Special Vehicles: technical chars (11)

## Preliminary remarks

### Appendix 6: "EVN with encoded properties"

If the properties as encoded along the method of Appendix 6 are made explicit in the Vehicle instances, then - in theory - one could abandon the encoding of these properties in this number. In that case, the EVN can be chosen from a list of available numbers without encoded meaning.

### Assumptions for units of Mass and Length

All masses in EVR-context are mostly `unit:TONNE`, while those in the EVA process are expressed in `unit:KILOGRAM`. This would require conversions, but the conversion factors are trivial based on the `qudt:Unit`.

> [!WARNING]
> One unit for mass/loads/... should be selected **for registering these values in the KG**, as conversion can be done client-side. OPD Unit is in favor of using tonnes.

### ERATV Subcategories

The property `era:eratvSubCategory` currently throws together all subCategories that exist as per EVR. This must be corrected, see "Common properties".

## Rolling Stock Group

### Temporary model

To be removed, as the subClassOf approach is better.

- [ ] ObjectProperty `era:rstGroup` with range: existing SKOS Concept Scheme <http://data.europa.eu/949/concepts/vehicle-types/Categories>.
- [ ] Update this CS in order to align with the legislation.

### Final model

As many of the properties depend on the RS Group, it is better to subClassOf `era:Vehicle`, and provide the properties as having the appropriate `rdfs:range`.

### Common properties

Some of the main vehicle classes share properties, but its values must be available and may be different per class.

- [ ] `era:letterMarking`, a general property for vehicle classes `era:FreightWagon` and `era:HauledPassengerStock`, a `xsd:string` independent of the class (although the Regular Expression check is different).
- [ ] `era:speedRange`, a general property for vehicle classes `era:HauledPassengerStock` and `era:Specialvehicle`, a SKOS Concept (detailed per class).
- [ ] existing property `era:subCategory` must be renamed to `era:eratvSubCategory` for vehicle classes `era:HauledPassengerStock`, `era:TractiveRollingStock` and `era:Specialvehicle`, a SKOS Concept (stubbed per class, and not put into one SKOS CS!).
- [ ] `era:fixedGauge` and `era:adjustableGauge`, for vehicle classes `era:FreightWagon` and `era:HauledPassengerStock`, a SKOS Concept (detailed per class).
- [ ] `era:evrSubCategory`, a general property for vehicle classes `era:FreightWagon` and `era:SpecialVehicle`, a SKOS Concept (detailed per class).

> [!WARNING]
> A letter marking encodes certain properties, which need to be made explicit in the lists below, since we do not require/provide an automatic "letter marking decoder". This means that any data encoded through the letter marking must explicitly be available as a separate property.

### Freight Wagons

### Hauled Passenger Vehicles

### Special Vehicles

### Tractive rolling stock and units in a trainset in fixed or pre-defined formation

## Vehicle parameters which are stored under the VehicleType

The properties of VehicleType are documented [here](https://github.com/Certiman/ERA-Ontology-5.0.0-5.1.0/blob/main/CHANGELOG.md).

Notable example:

- [ ] `era:energySupplySystem` for the Energy Supply of Hauled Passenger vehicles. The values from EVR are:
  - [ ] "Steam", to be added to [SKOS CS](http://data.europa.eu/949/concepts/energy-supply-systems/EnergySupplySystems).
  - [ ] 1^^unit:KILOV, with frequency "16 2/3"^^unit:HZ
  - [ ] 1^^unit:KILOV, with frequency "50"^^unit:HZ
  - [ ] 1.5^^unit:KILOV, with frequency 50^^unit:HZ
  - [ ] 3^^unit:KILOV, with frequency 50^^unit:HZ
  - [ ] 3^^unit:KILOV, with frequency 0^^unit:HZ, for the DC value.
  - [ ] 3.5^^unit:KILOV, with frequency 0^^unit:HZ, for the DC value.
