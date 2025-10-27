import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Parser } from 'n3';
import datasetFactory from '@rdfjs/dataset';
import type { GraphStore } from '../data/graph-store.js';
import type { LoadedShape } from '../data/organisation-shapes.js';
import { initEndpointsView } from './endpoints.js';

const parser = new Parser({ format: 'application/trig' });

function createLoadedShape(turtle: string): LoadedShape {
  const quads = parser.parse(turtle);
  const dataset = datasetFactory.dataset(quads);
  return {
    text: turtle,
    quads,
    dataset,
  };
}

describe('endpoints view', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('renders endpoints discovered in the shapes and persists credential changes', () => {
    const shape = createLoadedShape(`
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix dcterms: <http://purl.org/dc/terms/> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      @prefix ex: <https://example.com/ns/> .

      ex:ShapeA a sh:NodeShape ;
        rdfs:label "Shape A" ;
        dcterms:source <https://data.example.com/sparql> .

      ex:ShapeB a sh:NodeShape ;
        rdfs:label "Shape B" ;
        dcterms:source <https://data.example.com/sparql> , <https://data.other.example/sparql> .
    `);

    const container = document.createElement('div');
    initEndpointsView({
      container,
      store: {
        getQuads: vi.fn().mockResolvedValue([]),
      } as unknown as GraphStore,
      shapes: [shape],
    });

    const cards = container.querySelectorAll('.endpoint-card');
    expect(cards).toHaveLength(2);

    const firstCard = cards[0] as HTMLElement;
    const tokenInput = firstCard.querySelector<HTMLInputElement>('input[data-credential="token"]');
    const usernameInput = firstCard.querySelector<HTMLInputElement>(
      'input[data-credential="username"]'
    );
    expect(tokenInput).toBeInstanceOf(HTMLInputElement);
    expect(usernameInput).toBeInstanceOf(HTMLInputElement);

    tokenInput!.value = 'Bearer token-123';
    tokenInput!.dispatchEvent(new Event('input', { bubbles: true }));
    usernameInput!.value = 'svc-user';
    usernameInput!.dispatchEvent(new Event('input', { bubbles: true }));

    const storedCredentialsRaw = window.localStorage.getItem(
      'va:endpoints:credentials:' + encodeURIComponent('https://data.example.com/sparql')
    );
    expect(storedCredentialsRaw).not.toBeNull();
    expect(JSON.parse(storedCredentialsRaw!)).toEqual({
      token: 'Bearer token-123',
      username: 'svc-user',
      password: '',
    });

    const hostStoredRaw = window.localStorage.getItem(
      'va:endpoints:host:' + encodeURIComponent('data.example.com')
    );
    expect(hostStoredRaw).not.toBeNull();
    expect(JSON.parse(hostStoredRaw!)).toEqual({
      token: 'Bearer token-123',
      username: 'svc-user',
      password: '',
      applyToAll: false,
    });
  });

  it('restores stored endpoint tokens when rendering cards', () => {
    const endpointUrl = 'https://reused.example/sparql';
    window.localStorage.setItem(
      'va:endpoints:token:' + encodeURIComponent(endpointUrl),
      'Bearer restored'
    );

    const shape = createLoadedShape(`
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix dcterms: <http://purl.org/dc/terms/> .
      @prefix ex: <https://example.com/ns/> .

      ex:Shape a sh:NodeShape ;
        dcterms:source <${endpointUrl}> .
    `);

    const container = document.createElement('div');
    initEndpointsView({
      container,
      store: {
        getQuads: vi.fn().mockResolvedValue([]),
      } as unknown as GraphStore,
      shapes: [shape],
    });

    const input = container.querySelector<HTMLInputElement>('input[data-credential="token"]');
    expect(input).not.toBeNull();
    expect(input?.value).toBe('Bearer restored');

    const migratedRaw = window.localStorage.getItem(
      'va:endpoints:credentials:' + encodeURIComponent(endpointUrl)
    );
    expect(migratedRaw).not.toBeNull();
    expect(JSON.parse(migratedRaw!)).toEqual({
      token: 'Bearer restored',
      username: '',
      password: '',
    });
    expect(
      window.localStorage.getItem('va:endpoints:token:' + encodeURIComponent(endpointUrl))
    ).toBeNull();
  });

  it('shares credentials across endpoints with the same host when requested', () => {
    const shape = createLoadedShape(`
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix dcterms: <http://purl.org/dc/terms/> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      @prefix ex: <https://example.com/ns/> .

      ex:ShapeA a sh:NodeShape ;
        rdfs:label "Shape A" ;
        dcterms:source <https://data.example.com/sparql> .

      ex:ShapeB a sh:NodeShape ;
        rdfs:label "Shape B" ;
        dcterms:source <https://data.example.com/collection> .
    `);

    const container = document.createElement('div');
    initEndpointsView({
      container,
      store: {
        getQuads: vi.fn().mockResolvedValue([]),
      } as unknown as GraphStore,
      shapes: [shape],
    });

    const cards = Array.from(container.querySelectorAll<HTMLElement>('.endpoint-card'));
    expect(cards).toHaveLength(2);

    const [firstCard, secondCard] = cards;
    const tokenInput = firstCard.querySelector<HTMLInputElement>('input[data-credential="token"]');
    const passwordInput = firstCard.querySelector<HTMLInputElement>(
      'input[data-credential="password"]'
    );
    const shareCheckbox = firstCard.querySelector<HTMLInputElement>(
      'input[data-credential="share"]'
    );
    expect(tokenInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(shareCheckbox).not.toBeNull();

    tokenInput!.value = 'Bearer shared';
    tokenInput!.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput!.value = 'secret';
    passwordInput!.dispatchEvent(new Event('input', { bubbles: true }));

    shareCheckbox!.checked = true;
    shareCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));

    const otherToken = secondCard.querySelector<HTMLInputElement>('input[data-credential="token"]');
    const otherPassword = secondCard.querySelector<HTMLInputElement>(
      'input[data-credential="password"]'
    );
    expect(otherToken?.value).toBe('Bearer shared');
    expect(otherPassword?.value).toBe('secret');
    expect(firstCard.dataset.hostShared).toBe('true');
    expect(secondCard.dataset.hostShared).toBe('true');

    const hostStoredRaw = window.localStorage.getItem(
      'va:endpoints:host:' + encodeURIComponent('data.example.com')
    );
    expect(hostStoredRaw).not.toBeNull();
    expect(JSON.parse(hostStoredRaw!)).toEqual({
      token: 'Bearer shared',
      username: '',
      password: 'secret',
      applyToAll: true,
    });
  });

  it('shows an empty state when shapes do not reference endpoints', () => {
    const shape = createLoadedShape(`
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix ex: <https://example.com/ns/> .

      ex:Shape a sh:NodeShape .
    `);

    const container = document.createElement('div');
    initEndpointsView({
      container,
      store: {
        getQuads: vi.fn().mockResolvedValue([]),
      } as unknown as GraphStore,
      shapes: [shape],
    });

    expect(container.querySelector('.endpoint-card')).toBeNull();
    const emptyState = container.querySelector('.endpoint-list__empty');
    expect(emptyState).not.toBeNull();
    expect(emptyState?.hasAttribute('hidden')).toBe(false);
  });
});
