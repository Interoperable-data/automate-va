# Data model for Vehicles

Individual vehicles have some properties which are not contained in the technical parameters of their Vehicle Type. This document describes a proposed ontology for instances of `era:Vehicle` in the KG.

Legal basis: <http://data.europa.eu/eli/dec_impl/2018/1614/oj> (Appendix 6)
For a catalogue with explanations: [see here]()

- (part 0) Vehicle Identification ("European Vehicle Number")
- (part 4) Coding of the countries in which the vehicles are registered (digits 3-4 and abbreviation): `era:VehicleRegistration`
- (part 6) Interoperability Codes
- (part 7) For hauled passenger vehicles: international traffic ability codes
- (part 8) For Tractive rolling stock and units in a trainset in fixed or pre-defined formation: type codes (digit 2)
- (parts 9 - 13)
  - Wagons: numerical (part 9) & letter (12) markings
  - Hauled Passenger stock: technical chars (10) and letter markings (13)
  - Special Vehicles: technical chars (11)

## Appendix 6: "EVN with encoded properties"

If the properties as encoded along the method of Appendix 6 are made explicit in the Vehicle instances, then - in theory - one could abandon the encoding of these properties in this number. In that case, the EVN can be chosen from a list of available numbers without encoded meaning .

## Rolling Stock Group

### Temporary model

- [ ] ObjectProperty `era:rstGroup` with range: existing SKOS Concept Scheme <http://data.europa.eu/949/concepts/vehicle-types/Categories>.
- [ ] Update this CS in order to align with the legislation.

### Final model

As many of the properties depend on the RS Group, it is better to subClassOf `era:Vehicle`, and provide the properties as having the appropriate `rdfs:range`.

### Common properties

- [ ] `era:letterMarking`, a general property for vehicle classes `era:FreightWagon` and `era:HauledPassengerStock`.

### Wagon Properties

- [ ] new class `era:FreightWagon`, subClass of `era:Vehicle`, with properties:
  - [ ] `era:hasTipping`, with range a SKOS CS having values { Side, End, Body } []
  - [ ] SHACL-rules defining valid combinations of the above tipping properties.
  - [ ] `era:hasFlatFloor`, a `xsd:boolean`
  - [ ] `era:hasFloorTrap`, a `xsd:boolean`
  - [ ] `era:numberFloors`, a `xsd:number`, with `3` meaning 3 or more.
  - [ ] SHACL-rules defining valid combinations of the above floor properties.
  - [ ] `era:hasBrakeManStation`, a `xsd:boolean`
  - [ ] `era:hasEndDoor`, a `xsd:boolean`
  - [ ] `era:numberOfAxles`, a `xsd:number` from the collection [2,3,4,6], with 6 meaning 6 or more.
  - [ ] `era:numberOfWheelsets`, a `xsd:number` ().
  - [ ] `era:marking`, with range a stubClass `era:WagonCategory`, which itself has the following properties:
    - [ ] `era:categoryLetter` with range a SKOS Concept Scheme with the categories from [Part 9](https://www.era.europa.eu/system/files/2022-11/appendix_6_p12_en.pdf?t=1722071487):
      - E ORDINARY OPEN HIGH-SIDED WAGON
      - F SPECIAL OPEN HIGH-SIDED WAGON (Open hopper wagons, Tipping hopper wagons, Bogie open hopper wagons...)
      - G ORDINARY COVERED WAGON
      - H SPECIAL COVERED WAGON (High-capacity sliding-wall covered wagons, Four-part, covered, double-deck car transporter wagons...)
      - I Temperature-controlled wagons
      - K ORDINARY 2-AXLE FLAT WAGON
      - L SPECIAL 2-AXLE FLAT WAGON (Car transporter units...)
      - O ORDINARY MIXED FLAT AND OPEN HIGH-SIDED WAGON
      - R Ordinary FLAT BOGIES WAGON
      - S SPECIAL FLAT BOGIES WAGON (Six-axle bogie flat wagons, Trestle wagons for transporting metal plate, Bogie coil wagons, Bogie flat wagons with cargo ratchet straps...)
      - T WAGON WITH OPENING ROOF (Bogie wagons with fully opening roller roofs, Covered wagons for agricultural goods, Bogie covered hopper wagons...)
      - U SPECIAL WAGONS (other than those in categories F, H, L, S ou Z)
      - Z TANK WAGON
    - [ ] `era:letterMarking`, a `xsd:string` with the numerical marking itself.
    - [ ] `articulatedOrMultipleWagon`, a `xsd:boolean`, distinguishing the letter marking as per Part 12.1 or 12.2.
    - [ ] `era:numericalMarking`, a `xsd:string` with the numerical marking itself.
  - [ ] `era:unloading`, with range a SKOS CS, with following options:
    - [ ] axial controlled gravity at the top
    - [ ] axial controlled gravity at the bottom
    - [ ] axial bulk gravity at the top
    - [ ] axial bulk gravity at the bottom
    - [ ] bulk gravity unloading, on both sides, simultaneously, at the top
    - [ ] bulk gravity unloading, on both sides, simultaneously, at the bottom
    - [ ] controlled gravity unloading, on both sides, alternately, at the top
    - [ ] controlled gravity unloading, on both sides, alternately, at the bottom
    - [ ] under pressure
  - [ ] `era:ventilationApertures`, a `xsd:number`.
  - [ ] `era:loadEquipment`, with range a stubClass `era:WagonLoadEquipment`, which itself has the following properties:
    - [ ] `era:wagonCooling` (only applicable when categoryLetter is "I - Temperature controlled wagon"!), with range as SKOS CS, having values:
      - with electric ventilation
      - with mechanical refrigeration
      - refrigerator with liquefied gas
      - with class IR thermal insulation
      - mechanically refrigerated by the machinery of an accompanying technical wagon
      - insulated without ice bunkers
      - with ice bunkers of capacity less than 3,5 m3
      - with ice bunkers of capacity more than 3,5 m3
      - without gratings ()
    - [ ] `era:withMeatHook`, `era:forFish`, both `xsd:boolean` 
    - [ ] `era:withHeatingDevice`, `era:withShockAbsorbingDevice`, `era:withSwivellingBolster`, all `xsd:boolean`
    - [ ] `era:withLargeDoorHeight`, `xsd:boolean` (with unobstructed height of the doors > 1,90 m)
    - [ ] `era:fittedForGaugeExceedingTransports`, a `xsd:boolean` (fitted out for the transport objects which should exceed the gauge if they were loaded on ordinary wagons).
    - [ ] `era:withNonMetallicTank`, a `xsd:boolean`
    - [ ] `era:withStanchions`, with range a SKOS CS having values { None, Normal, Long }
    - [ ] `era:withPartitions`, with range a SKOS CS having values { Fixed, Movable }
    - [ ] `era:withOpeningOrShuntWalls`, with range a SKOS CS having values { Normal, VeryRobust }
    - [ ] `era:withCover`, with range a SKOS CS having values { None, Fixed, Removable, VeryRobust }
    - [ ] `era:withSides`, with range a SKOS CS having values { None, Fixed, Removable, Drop }
    - [ ] `era:withEnds`, with range a SKOS CS having values { Removable, Drop, NonRemovableLargerThan2m, NonRemovableLessThan2m}
    - [ ] `era:forContainerTransport`, with range a SKOS CS having values:
      - [ ] fitted for the transport of containers, except pa
      - [ ] for transporting large containers up to 60 feet in length (except medium sized “pa” containers)
      - [ ] for transporting large containers over 60 feet in length (except medium sized “pa” containers)
    - [ ] `era:forSteelCoilsTransport`, with range a SKOS CS having values:
      - [ ] eye to side
      - [ ] eye to sky
      - [ ] eye longitudinal
    - [ ] `era:hasMotorCarTransportDecks`, a `xsd:boolean` (true if more than one deck).

### Hauled Passenger Vehicles

To be added

### Special Vehicles

To be added

### Tractive rolling stock and units in a trainset in fixed or pre-defined formation

To be added

## Vehicle parameters which are stored under the VehicleType

If parameters inherently are linked to the type, they are stored there:

- [ ] `era:length`
- [ ] parameters regarding payload (capacity)
- [ ] 