import { type LocationQueryValue } from 'vue-router';

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
  steps: any[] | null; // Use steps instead of tasks
};