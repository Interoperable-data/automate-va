import { describe, it, expect } from 'vitest'

import {
  KGHost,
  trisEndpoint,
  isSparqlEndpoint,
  retrieveProcessesFromEndpoint,
  retrieveSubjectsByClass,
} from '../providers/KGHost'
import { badQuery } from '../providers/KGHostHelpers'

// local ones, launch to http://va-inspector.era.europa.eu:3030/ERALEX/sparql
const validLocalEndpoint = 'http://va-inspector.era.europa.eu:3030'

// remote ones: launch just like this.
const validEndpoint = 'https://demo.openlinksw.com/sparql'
const invalidEndpoint = 'https://demo.openlinksw.com/query'

describe.skip('KGHost', () => {
  describe('isSparqlEndpoint', () => {
    // https://demo.openlinksw.com/sparql, , 'https://dbpedia.org/sparql', https://fragments.dbpedia.org/2015/en

    // TESTs
    it('should return true for a valid SPARQL endpoint', async () => {
      const sparqlEndpointURI = new URL(validEndpoint)
      const result = await isSparqlEndpoint(sparqlEndpointURI)
      expect(result).toBe(true)
    })

    it('should return true for a valid local SPARQL endpoint', async () => {
      const sparqlEndpointURI = new URL(validLocalEndpoint)
      const result = await isSparqlEndpoint(sparqlEndpointURI, 'ERALEX', trisEndpoint)
      expect(result).toBe(true)
    })

    it('should return false for an invalid SPARQL endpoint', async () => {
      const sparqlEndpointURI = new URL(invalidEndpoint) // not an endpoint, even 404
      const result = await isSparqlEndpoint(sparqlEndpointURI)
      expect(result).toBe(false)
    })

    it('should return true for a standalone SPARQL endpoint', async () => {
      const sparqlEndpointURI = new URL(validEndpoint)
      const result = await isSparqlEndpoint(sparqlEndpointURI)
      expect(result).toBe(true)
    })

    it('should return true for a JENA endpoint with dataset', async () => {
      const sparqlEndpointURI = new URL(validLocalEndpoint)
      const result = await isSparqlEndpoint(sparqlEndpointURI, 'ERALEX', trisEndpoint)
      expect(result).toBe(true)
    })

    it('should return false for an invalid endpoint', async () => {
      const sparqlEndpointURI = new URL(invalidEndpoint)
      const result = await isSparqlEndpoint(sparqlEndpointURI)
      expect(result).toBe(false)
    })

    it('should return false for an invalid JENA dataset', async () => {
      const sparqlEndpointURI = new URL(validLocalEndpoint)
      const result = await isSparqlEndpoint(sparqlEndpointURI, 'INVALID_DATASET', trisEndpoint)
      expect(result).toBe(false)
    })
  })

  describe('retrieveProcessesFromEndpoint', () => {
    it('should return an empty array for a local SPARQL endpoint with no processes', async () => {
      const sparqlEndpointURI = new URL(validLocalEndpoint)
      const result = await retrieveProcessesFromEndpoint(sparqlEndpointURI, 'ERALEX', trisEndpoint)
      expect(result).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      const invalidURI = new URL('http://invalid-endpoint')
      await expect(retrieveProcessesFromEndpoint(invalidURI)).rejects.toThrow()
    })
  })

  describe('retrieveSubjectsByClass', () => {
    it('should return more than 80 instances for the class <https://w3id.org/vpa#Requirement> in local endpoint', async () => {
      const sparqlEndpointURI = new URL(validLocalEndpoint)
      const rdfClass = 'https://w3id.org/vpa#Requirement'
      const result = await retrieveSubjectsByClass(
        sparqlEndpointURI,
        rdfClass,
        'ERALEX',
        trisEndpoint,
        100
      )
      expect(result).not.toBeNull()
      expect(result!.length).toBeGreaterThan(80)
    })
  })

  // New tests for regular SPARQL endpoints
  describe('Regular SPARQL endpoints', () => {
    // NO dataset is to be selected for these endpoints
    const testEndpoint = new URL(validEndpoint)

    it('should configure regular SPARQL endpoint correctly', () => {
      const kgh = new KGHost(undefined, testEndpoint)
      expect(kgh['options'].sources).toHaveLength(1)
      expect(kgh['options'].sources[0].value).toBe(testEndpoint.href)
      expect(kgh['options'].baseIRI).toBeUndefined()
    })

    it('should execute query against regular SPARQL endpoint', async () => {
      const kgh = new KGHost(undefined, testEndpoint)
      const result = await kgh.directQuery('ASK { ?s ?p ?o }', testEndpoint)
      expect(result).not.toBeNull()
    })
  })

  describe('Utility functions with different endpoint types', () => {
    it('isSparqlEndpoint should work with regular endpoints', async () => {
      const result = await isSparqlEndpoint(new URL(validEndpoint))
      expect(result).toBe(true)
    })

    it('retrieveSubjectsByClass should work with both endpoint types', async () => {
      // Test with regular endpoint
      const regularResult = await retrieveSubjectsByClass(
        new URL(validEndpoint),
        'http://www.w3.org/2002/07/owl#Class',
      )
      expect(regularResult).toBeInstanceOf(Array)
      expect(regularResult.length).toBeGreaterThan(4) // limit set to 5

      // Test with Jena endpoint
      const jenaResult = await retrieveSubjectsByClass(
        new URL(validLocalEndpoint),
        'http://www.w3.org/2002/07/owl#Class',
        'ERAVOC',
        trisEndpoint,
        20
      )
      expect(jenaResult).toBeInstanceOf(Array)
      expect(jenaResult.length).toBeGreaterThan(19) // limit set to 5
    })
  })

  describe('Error handling', () => {
    it('should handle invalid endpoint configurations', () => {
      expect(() => new KGHost(undefined, new URL('invalid-url'), undefined)).toThrow()
    })

    it('should handle query failures gracefully', async () => {
      const ep = new URL(validEndpoint)
      const kgh = new KGHost(undefined, ep, undefined)
      const result = await kgh.directQuery(badQuery, ep)
      expect(result).toBeNull()
    })

    // Add new test for local endpoint without proper configuration
    it('should handle missing Jena configuration', async () => {
      const ep = new URL(validLocalEndpoint)
      const kgh = new KGHost(undefined, ep , undefined)
      const result = await kgh.directQuery('ASK { ?s ?p ?o }', ep)
      expect(result).toBeNull()
    })
  })

  describe('Constructor initialization', () => {
    it('should properly initialize with SPARQL endpoint', () => {
      const kgh = new KGHost(undefined, new URL(validEndpoint), undefined)
      expect(kgh['initialized']).toBe(true)
      expect(kgh['options']).toBeDefined()
    })

    it('should properly initialize with Jena endpoint', () => {
      const kgh = new KGHost(trisEndpoint, new URL(validLocalEndpoint), 'ERALEX')
      expect(kgh['initialized']).toBe(true)
      expect(kgh['options']).toBeDefined()
    })

    it('should fail query if not properly initialized', async () => {
      const kgh = new KGHost(undefined, new URL('http://invalid-url'), undefined)
      // Force initialized to false for testing
      kgh['initialized'] = false
      const result = await kgh.directQuery('ASK { ?s ?p ?o }', new URL('invalid-url'))
      expect(result).toBeNull()
    })
  })
})
