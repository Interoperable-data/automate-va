import { Parser } from 'n3';
import rdfDataFactory from '@rdfjs/data-model';
import type { Quad, Term, NamedNode } from '@rdfjs/types';
import type { GraphStore } from '../data/graph-store';
import type { LoadedShape } from '../data/organisation-shapes';
import { assert } from '../utils/assert';
import { quadsToTurtle } from './rdf-utils';

const RDF_TYPE_IRI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const SKOS_PREF_LABEL_IRI = 'http://www.w3.org/2004/02/skos/core#prefLabel';
const RDFS_LABEL_IRI = 'http://www.w3.org/2000/01/rdf-schema#label';
const DEFAULT_NAMESPACE = 'https://data.europa.eu/va/local';

const RDF_TYPE = rdfDataFactory.namedNode(RDF_TYPE_IRI);
const SKOS_PREF_LABEL = rdfDataFactory.namedNode(SKOS_PREF_LABEL_IRI);
const RDFS_LABEL = rdfDataFactory.namedNode(RDFS_LABEL_IRI);

export type ResourceTypeId = 'formalOrganisation' | 'organisation' | 'unit';

interface ResourceTypeConfig {
  id: ResourceTypeId;
  label: string;
  description: string;
  shape: string;
  targetClass: string;
  buttonLabel: string;
  submitLabel: string;
}

const RESOURCE_TYPES: ResourceTypeConfig[] = [
  {
    id: 'formalOrganisation',
    label: 'Holding or group',
    description: 'Mother holdings or owning groups that can control subsidiary organisations.',
    shape: 'http://data.europa.eu/949/FormalOrganisationShape',
    targetClass: 'https://www.w3.org/ns/org#FormalOrganisation',
    buttonLabel: 'New holding/group',
    submitLabel: 'Save holding',
  },
  {
    id: 'organisation',
    label: 'Operational organisation',
    description: 'Legal entities with an organisation code and optional units and subsidiaries.',
    shape: 'http://data.europa.eu/949/OrganisationShape',
    targetClass: 'https://www.w3.org/ns/org#Organisation',
    buttonLabel: 'New organisation',
    submitLabel: 'Save organisation',
  },
  {
    id: 'unit',
    label: 'Organisational unit',
    description: 'Departments or units that belong to an organisation and operate sites.',
    shape: 'http://data.europa.eu/949/UnitShape',
    targetClass: 'https://www.w3.org/ns/org#OrganizationalUnit',
    buttonLabel: 'New unit / department',
    submitLabel: 'Save unit',
  },
];

interface OrganisationManagerOptions {
  container: HTMLElement;
  store: GraphStore;
  shapes: LoadedShape;
}

interface OrganisationManagerController {
  activate: () => void;
}

interface ResourceRecord {
  type: ResourceTypeId;
  subject: string;
  graph: string;
  label: string;
}

type ShaclFormElement = HTMLElement & {
  serialize: (format?: string) => string;
  validate: (ignoreEmptyValues?: boolean) => Promise<boolean>;
};

export async function initOrganisationManagerView(
  options: OrganisationManagerOptions
): Promise<OrganisationManagerController> {
  const { container, store, shapes } = options;

  const layout = buildLayout(container);
  populateCreateButtons(layout.createButtons, (typeId) => openForm(typeId));

  let resources: ResourceRecord[] = [];
  let selectedSubject: string | null = null;

  await refreshResourceList();

  store.subscribe(() => {
    void refreshResourceList(selectedSubject ?? undefined, { keepSelection: true });
  });

  async function refreshResourceList(
    highlightSubject?: string,
    { keepSelection = false }: { keepSelection?: boolean } = {}
  ) {
    resources = await fetchResources(store);
    renderResourceList(layout.resourceList, resources, {
      onSelect(resource) {
        selectedSubject = resource.subject;
        openForm(resource.type, resource);
      },
      highlightSubject:
        highlightSubject ?? (keepSelection ? selectedSubject ?? undefined : undefined),
    });
    layout.emptyState.hidden = resources.length > 0;
  }

  async function openForm(typeId: ResourceTypeId, existing?: ResourceRecord) {
    const typeConfig = getResourceType(typeId);
    layout.editorTitle.textContent = existing
      ? `Editing ${typeConfig.label}`
      : `Create ${typeConfig.label}`;
    layout.formHost.innerHTML = '';

    const status = document.createElement('p');
    status.className = 'resource-editor__status';
    status.textContent = 'Values are validated against the SHACL shapes.';

    const form = document.createElement('shacl-form') as ShaclFormElement;
    const identifiers = existing ?? createIdentifiers(typeConfig.id);
    const namespace = `${DEFAULT_NAMESPACE}/${typeConfig.id}/`;

    form.setAttribute('data-shapes', shapes.text);
    form.setAttribute('data-shape-subject', typeConfig.shape);
    form.setAttribute('data-submit-button', existing ? 'Update entry' : typeConfig.submitLabel);
    form.setAttribute('data-values-subject', identifiers.subject);
    form.setAttribute('data-values-graph', identifiers.graph);
    form.setAttribute('data-values-namespace', namespace);
    form.setAttribute('data-collapse', 'open');
    form.setAttribute('data-loading', 'Preparing SHACL form…');

    if (existing) {
      const turtle = await readResourceAsTurtle(store, existing);
      if (turtle) {
        form.setAttribute('data-values', turtle);
      }
    }

    const actions = document.createElement('div');
    actions.className = 'resource-editor__actions';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete entry';
    deleteButton.className = 'panel__button panel__button--secondary';
    deleteButton.disabled = !existing;
    deleteButton.addEventListener('click', async () => {
      if (!existing) {
        return;
      }
      deleteButton.disabled = true;
      status.textContent = 'Removing entry…';
      try {
        await removeResource(store, existing);
        status.textContent = `${typeConfig.label} deleted.`;
        layout.formHost.innerHTML = '';
        selectedSubject = null;
        await refreshResourceList();
      } catch (error) {
        console.error('[organisation-view] Failed to delete resource', error);
        status.textContent = `Failed to delete: ${extractMessage(error)}`;
        deleteButton.disabled = false;
      }
    });

    actions.append(deleteButton);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = 'Saving…';
      try {
        const turtle = form.serialize('text/turtle');
        await persistForm(store, {
          turtle,
          graph: identifiers.graph,
          subject: identifiers.subject,
          targetClass: typeConfig.targetClass,
        });
        status.textContent = 'Saved.';
        selectedSubject = identifiers.subject;
        await refreshResourceList(selectedSubject);
      } catch (error) {
        console.error('[organisation-view] Failed to save form', error);
        status.textContent = `Failed to save: ${extractMessage(error)}`;
      }
    });

    layout.formHost.append(form, status, actions);
  }

  return {
    activate() {
      // Ensure the latest list is rendered when the view becomes active.
      void refreshResourceList(selectedSubject ?? undefined, { keepSelection: true });
    },
  };
}

function buildLayout(container: HTMLElement) {
  container.innerHTML = `
    <section class="panel">
      <h2 class="panel__title">Create a new entry</h2>
      <p class="panel__body">Start with a holding, organisation, or unit. SHACL forms guide you through required fields.</p>
      <div class="panel__actions" data-role="create-buttons"></div>
    </section>
    <section class="panel">
      <h2 class="panel__title">Existing entries</h2>
      <p class="panel__body" data-role="empty-state">No organisation data stored locally yet.</p>
      <div class="resource-list" data-role="resource-list"></div>
    </section>
    <section class="panel">
      <h2 class="panel__title" data-role="editor-title">SHACL editor</h2>
      <div class="resource-form-host" data-role="form-host">
        <p class="panel__body">Select an entry or start a new one to load the form.</p>
      </div>
    </section>
  `;

  return {
    createButtons: assert(
      container.querySelector<HTMLElement>('[data-role="create-buttons"]'),
      'Create buttons host missing'
    ),
    resourceList: assert(
      container.querySelector<HTMLElement>('[data-role="resource-list"]'),
      'Resource list host missing'
    ),
    emptyState: assert(
      container.querySelector<HTMLElement>('[data-role="empty-state"]'),
      'Empty state paragraph missing'
    ),
    editorTitle: assert(
      container.querySelector<HTMLElement>('[data-role="editor-title"]'),
      'Editor title element missing'
    ),
    formHost: assert(
      container.querySelector<HTMLElement>('[data-role="form-host"]'),
      'Form host missing'
    ),
  } as const;
}

function populateCreateButtons(
  container: HTMLElement,
  onCreate: (type: ResourceTypeId) => void
): void {
  RESOURCE_TYPES.forEach((config) => {
    const button = document.createElement('button');
    button.className = 'panel__button';
    button.type = 'button';
    button.textContent = config.buttonLabel;
    button.addEventListener('click', () => onCreate(config.id));
    container.append(button);
  });
}

async function fetchResources(store: GraphStore): Promise<ResourceRecord[]> {
  const results: ResourceRecord[] = [];

  for (const config of RESOURCE_TYPES) {
    const typeNode = rdfDataFactory.namedNode(config.targetClass);
    const quads = await store.getQuads({ predicate: RDF_TYPE, object: typeNode });
    for (const quad of quads) {
      if (quad.subject.termType !== 'NamedNode') {
        continue;
      }
      const graph = getGraphId(quad.graph);
      const label = await resolveLabel(store, quad.subject, graph ?? undefined);
      results.push({
        type: config.id,
        subject: quad.subject.value,
        graph: graph ?? `${quad.subject.value}#graph`,
        label,
      });
    }
  }

  results.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  return results;
}

interface RenderResourceListOptions {
  onSelect: (resource: ResourceRecord) => void;
  highlightSubject?: string;
}

function renderResourceList(
  host: HTMLElement,
  items: ResourceRecord[],
  options: RenderResourceListOptions
): void {
  host.replaceChildren();

  RESOURCE_TYPES.forEach((config) => {
    const subset = items.filter((item) => item.type === config.id);
    if (subset.length === 0) {
      return;
    }

    const section = document.createElement('section');
    section.className = 'resource-list__group';

    const heading = document.createElement('h3');
    heading.className = 'resource-list__heading';
    heading.textContent = config.label;
    section.append(heading);

    const description = document.createElement('p');
    description.className = 'resource-list__description';
    description.textContent = config.description;
    section.append(description);

    const list = document.createElement('ul');
    list.className = 'resource-list__items';

    subset.forEach((resource) => {
      const listItem = document.createElement('li');
      listItem.className = 'resource-list__item';

      const button = document.createElement('button');
      button.className = 'resource-list__button';
      button.type = 'button';
      button.dataset.subject = resource.subject;
      button.textContent = resource.label;
      if (options.highlightSubject && options.highlightSubject === resource.subject) {
        button.classList.add('is-active');
      }

      button.addEventListener('click', () => options.onSelect(resource));

      listItem.append(button);
      list.append(listItem);
    });

    section.append(list);
    host.append(section);
  });
}

async function readResourceAsTurtle(store: GraphStore, record: ResourceRecord): Promise<string> {
  const graphNode = rdfDataFactory.namedNode(record.graph);
  const quads = await store.getQuads({ graph: graphNode });
  if (quads.length === 0) {
    return '';
  }
  return quadsToTurtle(quads);
}

async function persistForm(
  store: GraphStore,
  options: { turtle: string; subject: string; graph: string; targetClass: string }
): Promise<void> {
  const graphNode = rdfDataFactory.namedNode(options.graph);
  const subjectNode = rdfDataFactory.namedNode(options.subject);

  const parser = new Parser({ format: 'text/turtle' });
  const parsed = parser.parse(options.turtle) as Quad[];
  const normalized = parsed.map((quad) => ensureGraph(quad, graphNode));
  ensureTypeQuad(normalized, subjectNode, rdfDataFactory.namedNode(options.targetClass), graphNode);

  const existing = await store.getQuads({ graph: graphNode });
  if (existing.length > 0) {
    await store.deleteQuads(existing);
  }
  await store.putQuads(normalized);
}

async function removeResource(store: GraphStore, record: ResourceRecord): Promise<void> {
  const graphNode = rdfDataFactory.namedNode(record.graph);
  const quads = await store.getQuads({ graph: graphNode });
  if (quads.length === 0) {
    return;
  }
  await store.deleteQuads(quads);
}

function ensureGraph(quad: Quad, graph: NamedNode): Quad {
  if (quad.graph.termType === 'NamedNode' && quad.graph.value === graph.value) {
    return quad;
  }
  return rdfDataFactory.quad(quad.subject, quad.predicate, quad.object, graph);
}

function ensureTypeQuad(
  quads: Quad[],
  subject: NamedNode,
  type: NamedNode,
  graph: NamedNode
): void {
  const hasType = quads.some(
    (quad) =>
      quad.subject.termType === 'NamedNode' &&
      quad.subject.value === subject.value &&
      quad.predicate.termType === 'NamedNode' &&
      quad.predicate.value === RDF_TYPE_IRI
  );
  if (!hasType) {
    quads.push(rdfDataFactory.quad(subject, RDF_TYPE, type, graph));
  }
}

async function resolveLabel(
  store: GraphStore,
  subject: NamedNode,
  graph?: string
): Promise<string> {
  const graphNode = graph ? rdfDataFactory.namedNode(graph) : undefined;

  const pref = await matchLiteral(store, subject, SKOS_PREF_LABEL, graphNode);
  if (pref) {
    return pref;
  }

  const fallback = await matchLiteral(store, subject, RDFS_LABEL, graphNode);
  if (fallback) {
    return fallback;
  }

  return subject.value;
}

async function matchLiteral(
  store: GraphStore,
  subject: NamedNode,
  predicate: NamedNode,
  graph?: NamedNode
): Promise<string | null> {
  const pattern: { subject: NamedNode; predicate: NamedNode; graph?: NamedNode } = {
    subject,
    predicate,
  };
  if (graph) {
    pattern.graph = graph;
  }
  const quads = await store.getQuads(pattern);
  const literal = quads.find((quad) => quad.object.termType === 'Literal');
  return literal ? literal.object.value : null;
}

function getResourceType(id: ResourceTypeId): ResourceTypeConfig {
  const match = RESOURCE_TYPES.find((item) => item.id === id);
  if (!match) {
    throw new Error(`Unsupported resource type: ${id}`);
  }
  return match;
}

function createIdentifiers(type: ResourceTypeId): ResourceRecord {
  const typeConfig = getResourceType(type);
  const id = crypto.randomUUID();
  const subject = `${DEFAULT_NAMESPACE}/${typeConfig.id}/${id}`;
  const graph = `${subject}#graph`;
  return {
    type,
    subject,
    graph,
    label: subject,
  };
}

function quadsToGraphId(graph: Term): string | null {
  if (graph.termType === 'NamedNode') {
    return graph.value;
  }
  return null;
}

function getGraphId(graph: Term): string | null {
  return quadsToGraphId(graph);
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
