# Organisations

In order to link resources to organisations and contacts, an ontology is needed which takes into account:

- (optional) large holdings, encompassing many suborganisations, sometimes in more than one country;
- (mandatory) organisations, suborganisations of the above holdings if applicable, having a clear `era:hasRole`, executed at a specific `org:Site`.
- (mandatory if the case) units, suborganisations of the above organisations, having a clear `era:hasRole`, executed at a certain `org:Site`. This is applicable if several roles are executed in the Organisation, and the role can and should be assigned to a Unit therein.

The [Organisation ontology](https://www.w3.org/ns/org#) from W3C MUST be used as extended by the Agency, in order to model all stakeholders' organisational structure and locations.

## Prefixes

```
@prefix rorg: <http://data.europa.eu/949/organisation/
@prefix orgu: <http://data.europa.eu/949/organisation/unit/
@prefix orgs: <http://data.europa.eu/949/organisation/site/
@prefix lorg: <http://data.europa.eu/949/address/
```

## Common structure and properties

### Hierarchy and structure versus location

- [ ] Large conglomerate groups will be represented as `org:FormalOrganization`s and have at most one legally registered “corporate headquarter”, expressed using `org:hasRegisteredSite`, a `org:Site`. 
- [ ] FormalOrganizations themselves can `org:hasSubOrganization` other such FormalOrganizations.
- [ ] FormalOrganizations serve to regroup Organizations, which have a legally registered “seat of operation” (expressed using `org:hasRegisteredSite` , a `org:Site`), are executing the large group’s activities within `org:Unit`s, each located as well at an `org:Site`. If the site can be contacted by externals, the property `org:hasPrimarySite` can be used, if not `org:hasSite` should be used.
- [ ] An Organization’s role is therefore related to one of its operational entities and SHALL NOT be linked to a Site directly.
- [ ] An Organisation or Unit with a role must also be `era:Body`, and the `era:OrganisationRole` is detailed via the `era:role`-property. It must be avoided that a `era:Body` has multiple `era:OrganisationRole`s, if the precise role can be allocated to a SubOrganization or Unit. In the case of some organisations, this however cannot be avoided.
- [ ] The site of an organisation(al unit) should have a time-based validity, whereby the sites are linked together, and the most recent one added is retrieved as the 'active' site.
- [ ] 

### Properties

- [ ] Organisation short name: `foaf:nick`;
- [ ] Organisation name: `foaf:name`, with acronyms in `skos:altlabel` / `skos:prefLabel`;
- [ ] The link with the site is described above;
- Some roles have specific codes accompanying them, all modeled using `org:organisationCode`, and all with a start validity date and a period of validity (expressed in years or months). The instances, when updated, must be provided with `dcterms:modified`, while their creation in the register (OCR+), must be marked with `dcterms:created`.
  - [ ] Companies, involved in the exchange of TELEMATICS messages have a Company Code (which does not change)
  - [ ] Notified Bodies have a NANDO identifier, which remains the same during the lifecycle.
  - [ ] DeBo's and AsBo's have a changing identifier as procured by a Permitting Body, via the accreditation body (Appropriate Body).
  - [ ] IM's and RU's have an organisational code
  - [ ] INCOMPLETE
- [ ] Financial identifier, like national VAT-number, is in some cases known (example `gr:vatID`);
- [ ] A website with more information about the tasks and activities of the organisation (`foaf:homepage`);

## Specific properties

### ECM

Any (Unit within an) Organisation which uses an ECM certificate to operate as an ECM, MUST link to that ERADIS resource in the KG if it exists. 

## Applicants

Any (Unit within an) Organisation applying for vehicle (type) authorisations, must have the role of Applicant (`era-organisation-roles:Applicant`).

## Railway Undertakings and Infrastructure managers

Any (Unit within an) Organisation which uses a safety certificate or safety authorisation to operate as a RU or IM, MUST link to that ERADIS resource in the KG if it is available. 

## Individuals

Stored privately and preferably using LWS, each organisation shall also identify individual collaborators who play a role in linked data processes and must be mentioned in the process. These resurces SHOULD be linked to the organisation using the above mentioned ontology (using `org:Membership` and `org:member`).
