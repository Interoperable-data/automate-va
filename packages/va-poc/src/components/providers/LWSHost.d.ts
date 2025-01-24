import { type LocationQueryValue } from 'vue-router';

// Vocabularies
import { FOAF } from '@inrupt/vocab-common-rdf';
import { SOLID } from '@inrupt/vocab-solid';
import { DUL } from '@/vocabularies/DUL' // Import DUL vocabulary

// Define the enum for target types
export enum TargetType {
  WebId = 'webId',
  SparqlEndpoint = 'sparqlEndpoint',
  TurtleFile = 'turtleFile',
}

export type TypeRegistration = {
  forClass: string;
  inContainer: string;
  foundIn: string;
  literalProperties?: string[];
  uriProperties?: string[];
};

export type LWSAuth = {
  token: string | LocationQueryValue[];
  state: string | LocationQueryValue[];
};

export type KeyValueObject = Record<string, string>;

export type TaskRegistration = {
  label: string;
  tasks: any[];
};

// Array of possible property names where type indices can hide
export const typeIndexProperties: string[] = [
  FOAF.isPrimaryTopicOf,
  SOLID.publicTypeIndex,
  SOLID.privateTypeIndex
];

// Array of possible Process Classes, should not use prefixes internally
export const processClasses: string[] = [
  DUL.Process
];