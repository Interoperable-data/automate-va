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
- [ ] existing property `era:eratvSubCategory` for vehicle classes `era:HauledPassengerStock`, `era:TractiveRollingStock` and `era:Specialvehicle`, a SKOS Concept (stubbed per class, and not put into one SKOS CS!).
- [ ] `era:fixedGauge` and `era:adjustableGauge`, for vehicle classes `era:FreightWagon` and `era:HauledPassengerStock`, a SKOS Concept (detailed per class).
- [ ] `era:evrSubCategory`, a general property for vehicle classes `era:FreightWagon` and `era:SpecialVehicle`, a SKOS Concept (detailed per class).

> [!WARNING]
> A letter marking encodes certain properties, which need to be made explicit in the lists below, since we do not require/provide an automatic "letter marking decoder". This means that any data encoded through the letter marking must explicitly be available as a separate property.

### Freight Wagon Properties

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
  - [ ] `era:hasTipping`, with range a SKOS CS having values { [Side &| End] | Body }
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

### Hauled Passenger Vehicles

- [ ] new class `era:HauledPassengerVehicle`, subClass of `era:Vehicle`, with properties:
  - [ ] `era:withAutonomousAirCo`, a `xsd:boolean`. Vehicles requiring a generator van to supply air conditioning have this value `False`.
  - [ ] `era:withTrainBusElectricitySupply`, a `xsd:boolean`
  - [ ] `era:pressureTight`, a `xsd:boolean`
  - [ ] `era:eratvSubCategory`, for which a stubbed CS must contain:
    - [ ] Coach
    - [ ] Van
    - [ ] Car carrier
    - [ ] Driving Coach
    - [ ] Driving Van
    - [ ] Fixed Rake of coaches
    - [ ] Reserved
  - [ ] `era:fixedGauge` with range a *stubbed* SKOS CS with values:
    - [ ] "TEN (a) and/or COTIF (b) and/or PPV/PPW"
    - [ ] "PVV/PPW"
  - [ ] `era:adjustableGauge` with range a *stubbed* SKOS CS with values:
    - [ ] "(1435/1520) vehicles with change of bogies"
    - [ ] "(1435/1520) vehicles with gauge-adjustable axles"
    - [ ] "(1435/1668)"
  - [ ] The two previous parameters are mutually exclusive and cannot appear both at the same time.
  - [ ] The energy supply system MUST be modeled via the ERATV type (see below).
  - [ ] `era:marking`, with range a stubClass `era:HauledVehicleCategory`, which itself has the following properties:
    - [ ] `era:hauledPassengerVehicleCategory` with range a SKOS Concept Scheme with the categories from [Part X](TBC):
      - VEHICLES With FIRST CLASS SEATS
      - VEHICLES WITH SECOND CLASS SEATS
      - VEHICLES WITH 1ST OR 1ST/2ND CLASS SEATS
      - COUCHETTE CARS 1ST OR 1ST/2ND CLASS
      - COUCHETTE CARS 2ND CLASS
      - SLEEPING CARS
      - VEHICLES OF SPECIAL DESIGN AND VANS
    - [ ] For the VEHICLES above, a property `era:vehicleSpaces` (side-corridor compartments or equivalent open-saloon space with centre aisle) having range a SKOS CS with values:
      - [ ] 8
      - [ ] 9
      - [ ] 10
      - [ ] 11
      - [ ] 7 or more
      - [ ] 8 or more
      - [ ] 12 or more  
    - [ ] For the VEHICLES above, a property `era:vehicleConfiguration`, with range SKOS CS containing:
      - [ ] Three axles
      - [ ] Two axles
      - [ ] Two or three axles
      - [ ] Only for OSJD, double-deck coaches
      - [ ] Double-deck coaches
    - [ ] For the mixed couchette cars, a property `era:vehicleMixedClassCompartments`, with range a SKOS CS containing:
      - [ ] 9 or less
      - [ ] 10
    - [ ] For the 2nd class couchette cars, a property `era:vehicle2NDClassCompartments`, with range a SKOS CS containing:
      - [ ] 9 or less
      - [ ] 10
      - [ ] 11
      - [ ] 12
    - [ ] For the sleeping cars, reuse property `era:vehicleSpaces` (compartments), although only [10, 11, 12 and '12 or more' are allowed].
    - [ ] For the vehicles of special design/vans, a property `era:specialHauledPassengerVehicleCategory`, with range a SKOS CS containing:
      - [ ] Driving coach with seats, all classes, with or without luggage compartment, with driving cab for reversible working
      - [ ] Luggage vans
      - [ ] Luggage vans with mail compartment
      - [ ] Luggage vans and two or three-axle 2nd class vehicles with seats, with luggage or mail compartment
      - [ ] Side-corridor luggage vans, with or without compartment under customs seal
      - [ ] Mail vans
      - [ ] Vehicles with 1st or 1st/2nd class seats with luggage or mail compartment
      - [ ] Vehicles with 2nd class seats with luggage or mail compartment
      - [ ] Vehicles with seats, all classes with specially-fitted areas, e.g. children’s play area
      - [ ] Coaches with seats and couchette cars, all classes, with bar or buffet area
      - [ ] Double-deck driving coach with seats, all classes, with or without luggage compartment, with driving cab for reversible working
      - [ ] Dining cars or coaches with bar or buffet area, with luggage compartment
      - [ ] Dining cars
      - [ ] Other special coaches (conference, disco, bar, cinema, video, ambulance coaches)
      - [ ] Two or three-axle luggage vans with mail compartment
      - [ ] Two or three-axle car-carrying wagons
      - [ ] Car-carrying wagons
      - [ ] Service vehicles
  - [ ] A SKOS Concept Scheme with the `era:speedRange` ranges, expressed using the conventions:
    - [ ] maxInclusive "120"^^qudt:km/h,
    - [ ] minInclusive "161"^^qudt:km/h,
    - [ ] minInclusive "121"^^qudt:km/h, maxInclusive "140"^^qudt:km/h,
    - [ ] minInclusive "141"^^qudt:km/h, maxInclusive "160"^^qudt:km/h,

### Special Vehicles

- [ ] new class `era:SpecialVehicle`, subClass of `era:Vehicle`, with properties:
  - [ ] `era:inTrainComposition`, a `xsd:boolean`.
  - [ ] `era:marking`, with range a StubClass `era:SpecialVehicleCategory`, which has the following properties:
    - [ ] `era:vehicleFunction`, a SKOS CS with following values:
      - [ ] "1 Infrastructure and superstructure"
      - [ ] "2 Track"
      - [ ] "3 Overhead Contact Line"
      - [ ] "4 Structures"
      - [ ] "5 Loading, unloading and various transport"
      - [ ] "6 Measuring"
      - [ ] "7 Emergency"
      - [ ] "8 Traction, transport, energy, etc. "
      - [ ] "9 Environment"
      - [ ] "0 Rail-road"
    - [ ] `era:evrSubCategory`, a SKOS CS, which depends on the value selected under `era:vehicleFunction`:
      - [ ] 1.1 Track laying and renewal train
      - [ ] 1.2 Switches and crossing laying equipment
      - [ ] 1.3 Track rehabilitation train
      - [ ] 1.4 Ballast cleaning machine
      - [ ] 1.5 & 1.6 Earthworks machine
      - [ ] 1.7 (Reserved)
      - [ ] 1.8 (Reserved)
      - [ ] 1.9 Rail-mounted crane (excl. re-railing)
      - [ ] 1.0 None of the above
      - [ ] 2.1 High-capacity plain track tamping machine
      - [ ] 2.2 Other plain track tamping machines
      - [ ] 2.3 Tamping machine with stabilisation
      - [ ] 2.4 Tamping machine for switches and crossings
      - [ ] 2.5 Ballast plough
      - [ ] 2.6 Stabilisation machine
      - [ ] 2.7 Grinding and welding machine
      - [ ] 2.8 Multi-purpose machine
      - [ ] 2.9 Track inspection car
      - [ ] 2.0 None of the above
      - [ ] 3.1 Multi-purpose machine
      - [ ] 3.2 Rolling and unrolling machine
      - [ ] 3.3 Mast installation machine
      - [ ] 3.4 Drum carrier machine
      - [ ] 3.5 Overhead line tensioning machine
      - [ ] 3.6 Machine with elevating work platform and machine with scaffold
      - [ ] 3.7 Cleaning train
      - [ ] 3.8 Greasing train
      - [ ] 3.9 Overhead line inspection car
      - [ ] 3.0 None of the above
      - [ ] 4.1 Deck laying machine
      - [ ] 4.2 Bridge inspection platform
      - [ ] 4.3 Tunnel inspection platform
      - [ ] 4.4 Gas purification machine
      - [ ] 4.5 Ventilation machine
      - [ ] 4.6 Machine with elevating work platform or with scaffold
      - [ ] 4.7 Tunnel lighting machine
      - [ ] 4.0 None of the above
      - [ ] 5.1 Rail loading/unloading and transport machine
      - [ ] 5.2, 5.3 & 5.4 Loading/unloading and transport machine for ballast, gravel, etc.
      - [ ] 5.5, 5.6 & 5.7 Sleeper loading/unloading and transport machine
      - [ ] 5.8 Loading/unloading and transport machine for switchgear, etc.
      - [ ] 5.9 Loading/unloading and transport machine for other materials
      - [ ] 5.0 None of the above
      - [ ] 6.1 Earthworks recording car
      - [ ] 6.2 Track recording car
      - [ ] 6.3 Overhead line recording car
      - [ ] 6.4 Gauge recording car
      - [ ] 6.5 Signalling recording car
      - [ ] 6.6 Telecommunications recording car
      - [ ] 6.0 None of the above
      - [ ] 7.1 Emergency crane
      - [ ] 7.2 Emergency haulage car
      - [ ] 7.3 Emergency tunnel train
      - [ ] 7.4 Emergency car
      - [ ] 7.5 Fire car
      - [ ] 7.6 Sanitary vehicle
      - [ ] 7.7 Equipment car
      - [ ] 7.0 None of the above
      - [ ] 8.1 & 8.2 Tractive units
      - [ ] 8.3 Transport car (excl. 59)
      - [ ] 8.4 Power car
      - [ ] 8.5 & 8.6 Track car / powered car
      - [ ] 8.7 Concreting train
      - [ ] 8.0 None of the above
      - [ ] 9.1 Self-propelled snow plough
      - [ ] 9.2 Hauled snow plough
      - [ ] 9.3 Snow broom
      - [ ] 9.4 De-icing machine
      - [ ] 9.5 Weed-killing machine
      - [ ] 9.6 Rail cleaning machine
      - [ ] 9.0 None of the above
      - [ ] 0.1 & 0.2 Category 1 rail/road machine
      - [ ] 0.3 & 0.4 Category 2 rail/road machine
      - [ ] 0.5 & 0.6 Category 3 rail/road machine
      - [ ] 0.7 & 0.8 Category 4 rail/road machine
      - [ ] 0.0 None of the above
  - [ ] `era:eratvSubCategory`, for which a stubbed CS must contain, and which must be consistent with the `era:marking` properties above:
    - [ ] On track Machine (OTM)
    - [ ] Hauled Special Vehicle
    - [ ] Infrastructure Inspection Vehicle
    - [ ] Environment inspection Vehicle
    - [ ] Emergency Vehicle
    - [ ] Road-rail Vehicle
  - [ ] `era:selfPropelled`, a `xsd:boolean`, which IFF "true" requires `era:speedRange` from a SKOS Concept Scheme with the ranges, expressed using the conventions:
    - [ ] maxInclusive "100"^^qudt:km/h, for speeds lower than 100 km/h
    - [ ] minInclusive "101"^^qudt:km/h, for speeds more than 101 km/h

### Tractive rolling stock and units in a trainset in fixed or pre-defined formation

- [ ] new class `era:TractiveRollingStockTrainsetUnit`, subClass of `era:Vehicle`, with properties:
  - [ ] `era:eratvSubCategory`, for which a stubbed CS must contain:
    - [ ] Locomotive
    - [ ] Self-propelled passenger trainset
    - [ ] Railcar
    - [ ] Power Unit/Car
    - [ ] Article 1(4) of 2016/797
  - [ ] `era:isShuntingEngine`, a `xsd:boolean`.
  - [ ] IFF `era:eratvSubCategory` is "Locomotive" OR `era:isShuntingEngine` is "true", a property `era:propulsion`, with a SKOS CS containing "Electric" and "Diesel".
  - [ ] `era:hasMultipleUnits`, a `xsd:boolean`, which IFF "true", requires the property `era:multipleUnits`, with a SKOS CS, containing:
    - [ ] High-speed electric multiple-unit set
    - [ ] Non-High-speed electric multiple-unit set
    - [ ] Diesel multiple-unit set
    - [ ] Specialised trailer
  - [ ] Other properties should be deduced from the vehicle Type.

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
