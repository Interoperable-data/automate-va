---
next:
  text: 'Hauled passenger vehicles'
  link: './HAULED-PASSENGER'
---
# Freight Wagon Properties

The properties can be used for a unit consisting of:

- (`era:articulatedOrMultipleWagon` then True) a rake of permanently connected elements, those elements cannot be operated separately or
- (`era:connectedSeparateRailBogies` then True)separate rail bogies connected to compatible road vehicle(s) the combination of which forms a rake of a rail compatible system.
- (both then False) a wagon that can be operated separately, featuring an individual frame mounted on its own set of wheels or

The below properties must be considered *per wagon or element within a rake*. The number of elements carrying/supporting cargo is modeled in `era:numberOfUnitElements` and some properties will not be relevant, if the unit is composed as in one of the two latter cases above.

- [ ] new class `era:FreightWagon`, subClass of `era:Vehicle`, with properties:
  - [ ] `era:tonnage`, with range [`xsd:decimal`, `unit:TONNE` ]. For the load limits, see the `VehicleType`.
  - For the different lengths:
    - [ ] `era:loadingLength` (Lu for lower or unique deck, Lo for higher decks), with range `xsd:float`, `unit:METER`.
    - [ ] `era:length` should be copied from the VehicleType (4.8.1), and means the uncompressed buffer length (LüP);
  - [ ] `era:hasTipping`, with range a SKOS CS having values `{ [Side &| End] | Body }`
  - [ ] SHACL-rules defining valid combinations of the above tipping properties.
  - [ ] `era:hasFlatFloor`, a `xsd:boolean`
  - [ ] `era:hasFloorTrap`, a `xsd:boolean`
  - [ ] `era:numberFloors`, a `xsd:integer`, with `3` meaning 3 or more.
  - [ ] SHACL-rules defining valid combinations of the above floor properties.
  - [ ] `era:hasBrakeManStation`, a `xsd:boolean`
  - [ ] `era:hasEndDoor`, a `xsd:boolean`
  - [ ] `era:numberOfAxles`, a `xsd:integer` from the collection [2,3,4,6], with 6 meaning 6 or more.
  - [ ] `era:numberOfWheelsets`, a `xsd:integer` ().
  - [ ] `era:fixedGauge` and `era:adjustableGauge` with range a *stubbed* SKOS CS with values:
    - [ ] "Axles"
    - [ ] "Bogies"
  - [ ] `era:marking`, with range a stubClass `era:WagonCategory`, which itself has the following properties:
    - [ ] `era:articulatedOrMultipleWagon`, a `xsd:boolean`, distinguishing the letter marking as per Part 12.1 or 12.2
    - [ ] `era:connectedSeparateRailBogies`, a `xsd:boolean`.
    - [ ] IFF `era:articulatedOrMultipleWagon` or `era:connectedSeparateRailBogies` are "true", then a property `era:numberOfUnitElements`, a `xsd:integer`. The loading length of the total vehicle/rake is a factor of this number. It mostly represents the number of any division of the loading length into parts, apart from floors.
    - [ ] `era:evrSubCategory` with range a SKOS Concept Scheme with the categories from [Part 9](https://www.era.europa.eu/system/files/2022-11/appendix_6_p12_en.pdf?t=1722071487):
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
  - [ ] `era:ventilationApertures`, a `xsd:integer`.
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
