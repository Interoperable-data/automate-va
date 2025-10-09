import { Parser } from 'n3';
import rdfDataFactory from '@rdfjs/data-model';
import type { Quad, Term, NamedNode } from '@rdfjs/types';
import type { GraphStore } from '../data/graph-store';
import type { LoadedShape } from '../data/organisation-shapes';
import { discoverShapeDescriptors, type ShapeDescriptor } from '../data/shape-descriptors';
import { assert } from '../utils/assert';
import { quadsToTurtle } from './rdf-utils';

const RDF_TYPE_IRI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const SKOS_PREF_LABEL_IRI = 'http://www.w3.org/2004/02/skos/core#prefLabel';
const RDFS_LABEL_IRI = 'http://www.w3.org/2000/01/rdf-schema#label';
const RDF_TYPE = rdfDataFactory.namedNode(RDF_TYPE_IRI);
const SKOS_PREF_LABEL = rdfDataFactory.namedNode(SKOS_PREF_LABEL_IRI);
const RDFS_LABEL = rdfDataFactory.namedNode(RDFS_LABEL_IRI);

interface OrganisationManagerOptions {
  container: HTMLElement;
  store: GraphStore;
  shapes: LoadedShape;
}

interface OrganisationManagerController {
  activate: () => void;
}

interface ResourceRecord {
  descriptor: ShapeDescriptor;
  subject: string;
  graph: string;
  label: string;
}

type ResourceIdentifiers = Pick<ResourceRecord, 'subject' | 'graph'>;

type ShaclFormElement = HTMLElement & {
  serialize: (format?: string) => string;
  validate: (ignoreEmptyValues?: boolean) => Promise<boolean>;
};

export async function initOrganisationManagerView(
  options: OrganisationManagerOptions
): Promise<OrganisationManagerController> {
  const { container, store, shapes } = options;

  const descriptors = discoverShapeDescriptors(shapes.dataset);
  const layout = buildLayout(container);

  interface ModalHandle {
    close: () => void;
  }

  let activeModal: ModalHandle | null = null;

  if (descriptors.length === 0) {
    layout.createButtons.textContent =
      'No sh:NodeShape entries with sh:targetClass were found in the loaded shapes.';
    layout.emptyState.textContent =
      'Add targetable NodeShapes to the shapes graph to start managing resources.';
    layout.emptyState.hidden = false;
    return {
      activate() {
        // Nothing to activate without shapes to drive the manager.
      },
    };
  }

  populateCreateButtons(layout.createButtons, descriptors, (descriptor) => {
    void openForm(descriptor);
  });

  let resources: ResourceRecord[] = [];
  let selectedSubject: string | null = null;

  await refreshResourceList();

  store.subscribe(() => {
    void refreshResourceList(selectedSubject ?? undefined, { keepSelection: true });
  });

  function closeActiveModal(): void {
    if (activeModal) {
      activeModal.close();
      activeModal = null;
    }
  }

  function openModal(title: string): {
    body: HTMLElement;
    footer: HTMLElement;
    close: () => void;
  } {
    closeActiveModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal';

    const dialog = document.createElement('div');
    dialog.className = 'modal__dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', title);
    dialog.tabIndex = -1;

    const header = document.createElement('header');
    header.className = 'modal__header';

    const heading = document.createElement('h2');
    heading.className = 'modal__title';
    heading.textContent = title;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'modal__close';
    closeButton.setAttribute('aria-label', 'Close editor');
    closeButton.textContent = '×';

    header.append(heading, closeButton);

    const body = document.createElement('div');
    body.className = 'modal__body';

    const footer = document.createElement('footer');
    footer.className = 'modal__footer';

    dialog.append(header, body, footer);
    overlay.append(dialog);
    layout.modalHost.append(overlay);

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };

    const close = () => {
      document.removeEventListener('keydown', handleKeydown);
      overlay.remove();
      if (activeModal?.close === close) {
        activeModal = null;
      }
    };

    closeButton.addEventListener('click', () => close());
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        close();
      }
    });
    document.addEventListener('keydown', handleKeydown);

    requestAnimationFrame(() => {
      dialog.focus();
      overlay.classList.add('is-open');
    });

    activeModal = { close };

    return { body, footer, close };
  }

  async function refreshResourceList(
    highlightSubject?: string,
    { keepSelection = false }: { keepSelection?: boolean } = {}
  ) {
    resources = await fetchResources(store, descriptors);
    renderResourceList(layout.resourceList, descriptors, resources, {
      onSelect(resource) {
        selectedSubject = resource.subject;
        void openForm(resource.descriptor, resource);
      },
      highlightSubject:
        highlightSubject ?? (keepSelection ? selectedSubject ?? undefined : undefined),
    });
    layout.emptyState.hidden = resources.length > 0;
    layout.resourceList.hidden = resources.length === 0;
  }

  async function openForm(descriptor: ShapeDescriptor, existing?: ResourceRecord) {
    const modal = openModal(
      existing ? `Editing ${descriptor.label}` : `Create ${descriptor.label}`
    );

    const status = document.createElement('p');
    status.className = 'modal__status';
    status.textContent = 'Values are validated against the SHACL shapes.';

    const form = document.createElement('shacl-form') as ShaclFormElement;
    const identifiers: ResourceIdentifiers = existing
      ? { subject: existing.subject, graph: existing.graph }
      : createIdentifiers(descriptor);
    const namespace = `${ensureTrailingSlash(descriptor.valuesNamespace)}${descriptor.slug}/`;

    form.setAttribute('data-shapes', shapes.text);
    form.setAttribute('data-shape-subject', descriptor.shape.value);
    form.setAttribute('data-submit-button', descriptor.submitButtonLabel);
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
    } else {
      form.removeAttribute('data-values');
    }

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'modal__button modal__button--secondary';
    cancelButton.addEventListener('click', () => {
      modal.close();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = `Delete ${descriptor.label}`;
    deleteButton.className = 'modal__button modal__button--danger';
    deleteButton.disabled = !existing;
    deleteButton.addEventListener('click', async () => {
      if (!existing) {
        return;
      }
      deleteButton.disabled = true;
      status.textContent = `Removing ${descriptor.label.toLowerCase()}…`;
      try {
        await removeResource(store, existing);
        status.textContent = `${descriptor.label} deleted.`;
        selectedSubject = null;
        await refreshResourceList();
        modal.close();
      } catch (error) {
        console.error('[organisation-manager] Failed to delete resource', error);
        status.textContent = `Failed to delete: ${extractMessage(error)}`;
        deleteButton.disabled = false;
      }
    });

    modal.body.append(form, status);
    modal.footer.append(cancelButton, deleteButton);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = `Saving ${descriptor.label.toLowerCase()}…`;
      try {
        const turtle = form.serialize('text/turtle');
        await persistForm(store, {
          turtle,
          graph: identifiers.graph,
          subject: identifiers.subject,
          targetClass: descriptor.targetClass,
        });
        status.textContent = `${descriptor.label} saved.`;
        selectedSubject = identifiers.subject;
        await refreshResourceList(selectedSubject);
        modal.close();
      } catch (error) {
        console.error('[organisation-manager] Failed to save form', error);
        status.textContent = `Failed to save: ${extractMessage(error)}`;
      }
    });
  }

  return {
    activate() {
      void refreshResourceList(selectedSubject ?? undefined, { keepSelection: true });
    },
  };
}

function buildLayout(container: HTMLElement) {
  container.innerHTML = `
    <section class="panel panel--stacked">
      <header class="panel__header">
        <h2 class="panel__title">Manage organisation data</h2>
        <p class="panel__body">Create holdings, organisations, and units. Saved entries appear below and remain grouped by their SHACL class.</p>
      </header>
      <div class="panel__actions panel__actions--wrap" data-role="create-buttons"></div>
      <p class="panel__body panel__body--muted" data-role="empty-state" hidden>No organisation data stored locally yet.</p>
      <div class="resource-list" data-role="resource-list"></div>
    </section>
    <div data-role="modal-host"></div>
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
    modalHost: assert(
      container.querySelector<HTMLElement>('[data-role="modal-host"]'),
      'Modal host missing'
    ),
  } as const;
}

function populateCreateButtons(
  container: HTMLElement,
  descriptors: ShapeDescriptor[],
  onCreate: (descriptor: ShapeDescriptor) => void
): void {
  container.replaceChildren();
  descriptors.forEach((descriptor) => {
    const button = document.createElement('button');
    button.className = 'panel__button';
    button.type = 'button';
    button.textContent = descriptor.createButtonLabel;
    button.addEventListener('click', () => onCreate(descriptor));
    container.append(button);
  });
}

async function fetchResources(
  store: GraphStore,
  descriptors: ShapeDescriptor[]
): Promise<ResourceRecord[]> {
  const results: ResourceRecord[] = [];

  for (const descriptor of descriptors) {
    const quads = await store.getQuads({ predicate: RDF_TYPE, object: descriptor.targetClass });
    for (const quad of quads) {
      if (quad.subject.termType !== 'NamedNode') {
        continue;
      }
      const graph = getGraphId(quad.graph);
      const label = await resolveLabel(store, quad.subject, graph ?? undefined);
      results.push({
        descriptor,
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
  descriptors: ShapeDescriptor[],
  items: ResourceRecord[],
  options: RenderResourceListOptions
): void {
  host.replaceChildren();

  if (items.length === 0) {
    return;
  }

  descriptors.forEach((descriptor) => {
    const subset = items.filter((item) => item.descriptor.shape.equals(descriptor.shape));

    const section = document.createElement('section');
    section.className = 'resource-list__group';

    const heading = document.createElement('h3');
    heading.className = 'resource-list__heading';
    heading.textContent = descriptor.pluralLabel;
    section.append(heading);

    const description = document.createElement('p');
    description.className = 'resource-list__description';
    description.textContent = descriptor.description;
    section.append(description);

    if (subset.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'resource-list__empty';
      empty.textContent = `No ${descriptor.pluralLabel.toLowerCase()} stored yet.`;
      section.append(empty);
    } else {
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
    }

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
  options: { turtle: string; subject: string; graph: string; targetClass: NamedNode }
): Promise<void> {
  const graphNode = rdfDataFactory.namedNode(options.graph);
  const subjectNode = rdfDataFactory.namedNode(options.subject);

  const parser = new Parser({ format: 'application/trig' });
  const parsed = parser.parse(options.turtle) as Quad[];
  const normalized = parsed.map((quad) => ensureGraph(quad, graphNode));
  ensureTypeQuad(normalized, subjectNode, options.targetClass, graphNode);

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

function createIdentifiers(descriptor: ShapeDescriptor): ResourceIdentifiers {
  const id = crypto.randomUUID();
  const subject = `${ensureTrailingSlash(descriptor.valuesNamespace)}${descriptor.slug}/${id}`;
  const graph = `${subject}#graph`;
  return { subject, graph };
}

function ensureTrailingSlash(input: string): string {
  return input.endsWith('/') ? input : `${input}/`;
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
