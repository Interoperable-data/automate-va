// Vocabularies
import { FOAF } from '@inrupt/vocab-common-rdf';
import { SOLID } from '@inrupt/vocab-solid';
import { DUL } from './DUL' // Import DUL vocabulary

// Array of possible property names where type indices can hide
export const typeIndexProperties: string[] = [
  FOAF.isPrimaryTopicOf,
  FOAF.primaryTopic, // solidweb for instance
  SOLID.publicTypeIndex,
  SOLID.privateTypeIndex
];

// Array of possible Process Classes, should not use prefixes internally
export const processClasses: string[] = [
  DUL.Process
];