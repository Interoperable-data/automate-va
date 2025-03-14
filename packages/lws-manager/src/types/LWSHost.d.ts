import { type LocationQueryValue } from 'vue-router'

// Authentication related types
export type LWSAuth = {
  token: string | LocationQueryValue[]
  state: string | LocationQueryValue[]
}

// Profile related types
export interface PodProfileAndRegistrations {
  // Renamed from ProfileInfo
  name: string | null
  typeIndexContainers: URL[]
  typeRegistrations: TypeRegistration[]
  hasProfile: boolean
}

// Target and registration types
export enum TargetType {
  WebId = 'webId',
  SparqlEndpoint = 'sparqlEndpoint',
  TurtleFile = 'turtleFile',
}

export type TypeRegistration = {
  forClass: string
  inContainer: string
  foundIn: string
  literalProperties?: string[]
  uriProperties?: string[]
}

export type TaskRegistration = {
  label: string
  steps: any[] | null // Use steps instead of tasks
}

export type KeyValueObject = Record<string, string>
