import rdfDataFactory from '@rdfjs/data-model';

export const NAMESPACES = Object.freeze({
  era: 'http://data.europa.eu/949/',
  org: 'https://www.w3.org/ns/org#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  locn: 'http://www.w3.org/ns/locn#',
  rorg: 'http://data.europa.eu/949/organisations/',
  uorg: 'http://data.europa.eu/949/organisations/units/',
  orgr: 'http://data.europa.eu/949/organisations/roles/',
  lorg: 'http://data.europa.eu/949/organisations/sites/',
  'era-cert': 'http://data.europa.eu/949/evidences/',
  'era-ecd': 'http://data.europa.eu/949/evidences/ecds/',
  'era-cld': 'http://data.europa.eu/949/evidences/clds/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  time: 'http://www.w3.org/2006/time#',
  geo: 'http://www.opengis.net/ont/geosparql#',
  dcterms: 'http://purl.org/dc/terms/',
} as const);

export const RDF = Object.freeze({
  type: `${NAMESPACES.rdf}type`,
});

export const RDF_NODES = Object.freeze({
  type: rdfDataFactory.namedNode(RDF.type),
});

export const RDFS = Object.freeze({
  label: `${NAMESPACES.rdfs}label`,
  subClassOf: `${NAMESPACES.rdfs}subClassOf`,
});

export const RDFS_NODES = Object.freeze({
  label: rdfDataFactory.namedNode(RDFS.label),
  subClassOf: rdfDataFactory.namedNode(RDFS.subClassOf),
});

export const SKOS = Object.freeze({
  prefLabel: `${NAMESPACES.skos}prefLabel`,
});

export const SKOS_NODES = Object.freeze({
  prefLabel: rdfDataFactory.namedNode(SKOS.prefLabel),
});

export const DCTERMS = Object.freeze({
  valid: `${NAMESPACES.dcterms}valid`,
  created: `${NAMESPACES.dcterms}created`,
  modified: `${NAMESPACES.dcterms}modified`,
  Location: `${NAMESPACES.dcterms}Location`,
});

export const DCTERMS_NODES = Object.freeze({
  valid: rdfDataFactory.namedNode(DCTERMS.valid),
  created: rdfDataFactory.namedNode(DCTERMS.created),
  modified: rdfDataFactory.namedNode(DCTERMS.modified),
  Location: rdfDataFactory.namedNode(DCTERMS.Location),
});

export const ORG = Object.freeze({
  FormalOrganization: `${NAMESPACES.org}FormalOrganization`,
  Organization: `${NAMESPACES.org}Organization`,
  OrganizationalUnit: `${NAMESPACES.org}OrganizationalUnit`,
  Role: `${NAMESPACES.org}Role`,
  Site: `${NAMESPACES.org}Site`,
});

export const ORG_NODES = Object.freeze({
  FormalOrganization: rdfDataFactory.namedNode(ORG.FormalOrganization),
  Organization: rdfDataFactory.namedNode(ORG.Organization),
  OrganizationalUnit: rdfDataFactory.namedNode(ORG.OrganizationalUnit),
  Role: rdfDataFactory.namedNode(ORG.Role),
  Site: rdfDataFactory.namedNode(ORG.Site),
});

export const LOCN = Object.freeze({
  Address: `${NAMESPACES.locn}Address`,
});

export const LOCN_NODES = Object.freeze({
  Address: rdfDataFactory.namedNode(LOCN.Address),
});

export const ERA = Object.freeze({
  OrganisationRole: `${NAMESPACES.era}OrganisationRole`,
  ECDeclaration: `${NAMESPACES.era}ECDeclaration`,
  CLD: `${NAMESPACES.era}CLD`,
  CABEvidence: `${NAMESPACES.era}CABEvidence`,
});

export const ERA_NODES = Object.freeze({
  OrganisationRole: rdfDataFactory.namedNode(ERA.OrganisationRole),
  ECDeclaration: rdfDataFactory.namedNode(ERA.ECDeclaration),
  CLD: rdfDataFactory.namedNode(ERA.CLD),
  CABEvidence: rdfDataFactory.namedNode(ERA.CABEvidence),
});

export const TIME = Object.freeze({
  Interval: `${NAMESPACES.time}Interval`,
  Instant: `${NAMESPACES.time}Instant`,
  hasBeginning: `${NAMESPACES.time}hasBeginning`,
  hasEnd: `${NAMESPACES.time}hasEnd`,
  inXSDDateTime: `${NAMESPACES.time}inXSDDateTime`,
});

export const TIME_NODES = Object.freeze({
  Interval: rdfDataFactory.namedNode(TIME.Interval),
  Instant: rdfDataFactory.namedNode(TIME.Instant),
  hasBeginning: rdfDataFactory.namedNode(TIME.hasBeginning),
  hasEnd: rdfDataFactory.namedNode(TIME.hasEnd),
  inXSDDateTime: rdfDataFactory.namedNode(TIME.inXSDDateTime),
});

export const XSD = Object.freeze({
  dateTime: `${NAMESPACES.xsd}dateTime`,
});

export const XSD_NODES = Object.freeze({
  dateTime: rdfDataFactory.namedNode(XSD.dateTime),
});

export const DEFAULT_PREFIXES = Object.freeze({
  era: NAMESPACES.era,
  org: NAMESPACES.org,
  skos: NAMESPACES.skos,
  locn: NAMESPACES.locn,
  rorg: NAMESPACES.rorg,
  uorg: NAMESPACES.uorg,
  orgr: NAMESPACES.orgr,
  lorg: NAMESPACES.lorg,
  'era-cert': NAMESPACES['era-cert'],
  'era-ecd': NAMESPACES['era-ecd'],
  'era-cld': NAMESPACES['era-cld'],
  rdf: NAMESPACES.rdf,
  rdfs: NAMESPACES.rdfs,
  xsd: NAMESPACES.xsd,
  time: NAMESPACES.time,
  geo: NAMESPACES.geo,
  dcterms: NAMESPACES.dcterms,
} as const);
