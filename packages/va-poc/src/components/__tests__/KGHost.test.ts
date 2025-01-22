import { describe, it, expect } from 'vitest'

import { KGHost, trisEndpoint, isSparqlEndpoint, retrieveProcessesFromEndpoint, retrieveSubjectsByClass } from '../providers/KGHost'

// local ones, launch to http://va-inspector.era.europa.eu:3030/ERALEX/sparql
const validLocalEndpoint = 'http://va-inspector.era.europa.eu:3030'

// remote ones: launch just like this.
const validEndpoint = 'https://demo.openlinksw.com/sparql'
const invalidEndpoint = 'https://demo.openlinksw.com/query'

describe('KGHost', () => {
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
    it('should return more than 80 instances for the class <https://w3id.org/vpa#Requirement>', async () => {
      const sparqlEndpointURI = new URL(validLocalEndpoint)
      const rdfClass = 'https://w3id.org/vpa#Requirement'
      const result = await retrieveSubjectsByClass(sparqlEndpointURI, rdfClass, 'ERALEX', trisEndpoint)
      expect(result).not.toBeNull()
      expect(result!.length).toBeGreaterThan(80)
    })
  })

  // New tests for regular SPARQL endpoints
  describe('Regular SPARQL endpoints', () => {
    const testEndpoint = new URL('https://demo.openlinksw.com/sparql')

    it('should configure regular SPARQL endpoint correctly', () => {
      const kgh = new KGHost(undefined, testEndpoint, undefined)
      expect(kgh['options'].sources).toHaveLength(1)
      expect(kgh['options'].sources[0]).toBe(testEndpoint.href)
      expect(kgh['options'].baseIRI).toBeUndefined()
    })

    it('should execute query against regular SPARQL endpoint', async () => {
      const kgh = new KGHost(undefined, testEndpoint, undefined)
      const result = await kgh.query('ASK { ?s ?p ?o }')
      expect(result).not.toBeNull()
    })
  })

  describe('Utility functions with different endpoint types', () => {
    it('isSparqlEndpoint should work with regular endpoints', async () => {
      const result = await isSparqlEndpoint(new URL('https://demo.openlinksw.com/sparql'))
      expect(result).toBe(true)
    })

    it('retrieveSubjectsByClass should work with both endpoint types', async () => {
      // Test with regular endpoint
      const regularResult = await retrieveSubjectsByClass(
        new URL('https://demo.openlinksw.com/sparql'),
        'http://www.w3.org/2002/07/owl#Class',
      )
      expect(regularResult).toBeInstanceOf(Array)

      // Test with Jena endpoint
      const jenaResult = await retrieveSubjectsByClass(
        new URL('http://va-inspector.era.europa.eu:3030'),
        'http://www.w3.org/2002/07/owl#Class',
        'ERAVOC',
        trisEndpoint,
      )
      expect(jenaResult).toBeInstanceOf(Array)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid endpoint configurations', () => {
      expect(() => new KGHost(undefined, new URL('invalid-url'), undefined)).toThrow()
    })

    it('should handle query failures gracefully', async () => {
      const kgh = new KGHost(undefined, new URL(validEndpoint), undefined)
      const result = await kgh.query('INVALID QUERY SYNTAX')
      expect(result).toBeNull()
    })

    // Add new test for local endpoint without proper configuration
    it('should handle missing Jena configuration', async () => {
      const kgh = new KGHost(undefined, new URL(validLocalEndpoint), undefined)
      const result = await kgh.query('ASK { ?s ?p ?o }')
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
      const kgh = new KGHost(undefined, new URL('invalid-url'), undefined)
      // Force initialized to false for testing
      kgh['initialized'] = false
      const result = await kgh.query('ASK { ?s ?p ?o }')
      expect(result).toBeNull()
    })
  })
})
