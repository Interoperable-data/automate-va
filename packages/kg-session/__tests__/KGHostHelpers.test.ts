// import { namedNode } from '@rdfjs/data-model'
import { describe, it, expect, vi } from 'vitest'
import {
  badQuery,
  debugLog,
  normalizeUrl,
  ldflexJenaConfig,
  ldflexNonJenaConfig,
  executeQuery,
  executeDirectQuery,
} from '../providers/KGHostHelpers'
import { trisEndpoint } from '../providers/KGHost'

// local ones, launch to http://va-inspector.era.europa.eu:3030/ERALEX/sparql
const validLocalEndpoint = 'http://va-inspector.era.europa.eu:3030'

// remote ones: launch just like this.
const validEndpoint = 'https://demo.openlinksw.com/sparql'
const invalidEndpoint = 'https://demo.openlinksw.com/query'

// Files should work as well
const validTTLFile =
  'https://raw.githubusercontent.com/Interoperable-data/ERA-Ontology-3.1.0/main/ontology.ttl'

describe('KGHostHelpers', () => {
  describe('debugLog', () => {
    it('should log message when debug is true', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      debugLog(true, 'Test message')
      expect(consoleSpy).toHaveBeenCalledWith('[KGHost Debug] Test message')
      consoleSpy.mockRestore()
    })

    it('should not log message when debug is false', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      debugLog(false, 'Test message')
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('normalizeUrl', () => {
    it('should remove trailing slash from URL', () => {
      const url = 'http://example.com/'
      const normalizedUrl = normalizeUrl(url)
      expect(normalizedUrl).toBe('http://example.com')
    })

    it('should not change URL without trailing slash', () => {
      const url = 'http://example.com'
      const normalizedUrl = normalizeUrl(url)
      expect(normalizedUrl).toBe(url)
    })
  })

  describe('ldflexJenaConfig', () => {
    it('should configure Jena endpoint correctly', () => {
      const endpoint = new URL(validLocalEndpoint)
      const config = ldflexJenaConfig(trisEndpoint, endpoint, 'ERALEX', false, true)
      expect(config.options).toBeDefined()
      expect(config.options.sources).toHaveLength(1)
    })

    it('should throw error for invalid dataset', () => {
      const endpoint = new URL(validLocalEndpoint)
      expect(() =>
        ldflexJenaConfig(trisEndpoint, endpoint, 'INVALID_DATASET', false, true),
      ).toThrow()
    })
  })

  describe('ldflexNonJenaConfig', () => {
    it('should configure regular SPARQL endpoint correctly', () => {
      const endpoint = new URL(validEndpoint)
      const config = ldflexNonJenaConfig(endpoint, false)
      expect(config.options).toBeDefined()
      expect(config.options.sources).toHaveLength(1)
      expect(config.options.sources[0].value).toBe(endpoint.href)
    })
  })

  // As long as Comunica query fails, do not test it.
  describe('executeQuery (Non-JENA endpoints)', () => {
    it('should execute query and return results', async () => {
      const endpoint = new URL(validEndpoint)
      const config = ldflexNonJenaConfig(endpoint, false)
      const result = await executeQuery('ASK { ?s ?p ?o }', config.options)
      expect(result).not.toBeNull()
    })

    it('should return null for invalid query', async () => {
      const endpoint = new URL(validEndpoint)
      const config = ldflexNonJenaConfig(endpoint, false)
      const result = await executeQuery(badQuery, config.options)
      expect(result).toBeNull()
    })

    it('should return null for invalid endpoint', async () => {
      const endpoint = new URL(invalidEndpoint)
      const config = ldflexNonJenaConfig(endpoint, false)
      const result = await executeQuery('ASK { ?s ?p ?o }', config.options)
      expect(result).toBeNull()
    })
  })

  describe('executeQuery (file endpoints)', () => {
    // New tests for file-based endpoint
    it('should execute direct query and return results on a file-based endpoint', async () => {
      const endpoint = new URL(validTTLFile)
      const config = ldflexNonJenaConfig(endpoint, false)
      const result = await executeQuery('SELECT * WHERE { ?s ?p ?o } LIMIT 5', config.options)
      expect(result).not.toBeNull()
      expect(result).toBeInstanceOf(Array)
      expect(result).toHaveLength(5)
      // expect(result[0]).toHaveProperty('s')
      // expect(result[0]).toHaveProperty('p')
      // expect(result[0]).toHaveProperty('o')
    })

    it.skip('should return null for invalid query on a file-based endpoint', async () => {
      const endpoint = new URL(validTTLFile)
      const config = ldflexNonJenaConfig(endpoint, false)
      const result = await executeQuery(badQuery, config.options)
      expect(result).toBeNull()
    })
  })

  // Valid query:
  // https://demo.openlinksw.com/sparql/?query=SELECT%20*%20WHERE%20%7B%20%3Fs%20%3Fp%20%3Fo%20%7D%20LIMIT%201&format=JSON

  describe('executeDirectQuery', () => {
    it('should execute direct query and return results on a local endpoint', async () => {
      const endpoint = new URL(validLocalEndpoint)
      const result = await executeDirectQuery(
        'SELECT * WHERE { ?s ?p ?o } LIMIT 1',
        endpoint,
        false,
        'ERALEX',
      )
      const expectedResult = {
        s: {
          value: 'http://data.europa.eu/949/requirement/legislation/dir-2014-38',
        },
        p: {
          value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        },
        o: { value: 'https://w3id.org/vpa#Requirement' },
      }
      expect(result[0]).not.toBeNull()
      expect(result[0]).toHaveProperty(['s', 'value'], expectedResult.s.value)
      expect(result[0]).toHaveProperty(['p', 'value'], expectedResult.p.value)
      expect(result[0]).toHaveProperty(['o', 'value'], expectedResult.o.value)
    })

    it('should return null for invalid query on a local endpoint', async () => {
      const endpoint = new URL(validLocalEndpoint)
      const result = await executeDirectQuery(badQuery, endpoint, true, 'ERALEX')
      expect(result).toBeNull()
    })

    it('should return null for invalid endpoint', async () => {
      const endpoint = new URL(invalidEndpoint)
      const result = await executeDirectQuery('SELECT * WHERE { ?s ?p ?o } LIMIT 1', endpoint) // no loggging
      expect(result).toBeNull()
    })

    it('should execute direct query for non-JENA endpoint and return results', async () => {
      const endpoint = new URL(validEndpoint)
      const result = await executeDirectQuery('SELECT * WHERE { ?s ?p ?o } LIMIT 1', endpoint) // no logging
      const expectedResult = {
        s: {
          value: 'http://demo.openlinksw.com/tutorial/Northwind/ontology/CustomerContact',
        },
        p: {
          value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        },
        o: {
          value: 'http://www.openlinksw.com/schemas/virtrdf#QuadMapFormat',
        },
      }
      expect(result[0]).not.toBeNull()
      expect(result[0]).toHaveProperty(['s', 'value'], expectedResult.s.value)
      expect(result[0]).toHaveProperty(['p', 'value'], expectedResult.p.value)
      expect(result[0]).toHaveProperty(['o', 'value'], expectedResult.o.value)
    })

    it('should return null for invalid query on a remote endpoint', async () => {
      const endpoint = new URL(validEndpoint)
      const result = await executeDirectQuery(badQuery, endpoint)
      expect(result).toBeNull()
    })
  })
})
