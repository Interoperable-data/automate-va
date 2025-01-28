# Tractive rolling stock and units in a trainset in fixed or pre-defined formation

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