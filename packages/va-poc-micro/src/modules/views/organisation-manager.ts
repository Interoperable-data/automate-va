import type { DatasetCore } from '@rdfjs/types';
import type { GraphStore } from '../data/graph-store';
import type { LoadedShape } from '../data/organisation-shapes';
import { discoverShapeDescriptors, type ShapeDescriptor } from '../data/shape-descriptors';
import { assert } from '../utils/assert';
import { attachClassInstanceProvider } from './shacl-class-provider';
import { applyMaterialShaclTheme } from './shacl-material-theme';
import { extractMessage } from './resource-store-utils';
import {
  fetchResources,
  readResourceAsTrig,
  persistForm,
  removeResource,
  createIdentifiers,
  ensureTrailingSlash,
  listIncomingReferenceSubjects,
  type ResourceIdentifiers,
  type ResourceRecord,
} from './resource-manager-shared';
import { renderResourceColumns, type ColumnDefinition } from './resource-column-renderer';
import { isClassOrSubclassOf } from './rdf-utils';
import { ORG, DCTERMS, LOCN, ERA } from './ontologies';
import type { ShaclFormElement } from '../../types/shacl-form';

const ORG_FORMAL_ORGANIZATION = ORG.FormalOrganization;
const ORG_ORGANIZATION = ORG.Organization;
const ORG_ORGANIZATIONAL_UNIT = ORG.OrganizationalUnit;
const ORG_ROLE = ORG.Role;
const ORG_SITE = ORG.Site;
const DCTERMS_LOCATION = DCTERMS.Location;
const LOCN_ADDRESS = LOCN.Address;
const ERA_ORGANISATION_ROLE = ERA.OrganisationRole;

interface OrganisationManagerOptions {
  container: HTMLElement;
  store: GraphStore;
  shapes: LoadedShape;
}

interface OrganisationManagerController {
  activate: () => void;
}

interface DescriptorBuckets {
  roles: ShapeDescriptor[];
  organisations: ShapeDescriptor[];
  sites: ShapeDescriptor[];
}

type DescriptorBucketKey = keyof DescriptorBuckets;
type ColumnKey = keyof DescriptorBuckets;

const COLUMN_COPY: Record<ColumnKey, { title: string; description: string; empty: string }> = {
  roles: {
    title: 'Roles & assignments',
    description: 'Define organisational roles and link them to units or sites.',
    empty: 'No role shapes available yet.',
  },
  organisations: {
    title: 'Organisations & units',
    description: 'Capture organisations and their units that participate in the application.',
    empty: 'No organisation shapes available yet.',
  },
  sites: {
    title: 'Sites & locations',
    description: 'Record sites, facilities, and related location information.',
    empty: 'No site or location shapes available yet.',
  },
} as const;

const COLUMN_ORDER: ColumnKey[] = ['roles', 'organisations', 'sites'];

// Defines which descriptor buckets appear in each rendered column.
const COLUMN_DESCRIPTOR_GROUPS: Record<ColumnKey, DescriptorBucketKey[]> = {
  roles: ['roles'],
  organisations: ['organisations'],
  sites: ['sites'],
} as const;

export async function initOrganisationManagerView(
  options: OrganisationManagerOptions
): Promise<OrganisationManagerController> {
  const { container, store, shapes } = options;

  const descriptors = discoverShapeDescriptors(shapes.dataset);
  const descriptorBuckets = categorizeDescriptors(descriptors, shapes.dataset);
  const layout = buildLayout(container);

  interface ModalHandle {
    close: () => void;
    addCleanup: (callback: () => void) => void;
  }

  let activeModal: ModalHandle | null = null;

  if (descriptors.length === 0) {
    layout.emptyState.textContent =
      'Add targetable NodeShapes to the shapes graph to start managing resources.';
    layout.emptyState.hidden = false;
    layout.resourceListRoot.hidden = true;
    return {
      activate() {
        // Nothing to activate without shapes to drive the manager.
      },
    };
  }

  let resources: ResourceRecord[] = [];
  let selectedSubject: string | null = null;

  const handleCreate = (descriptor: ShapeDescriptor) => {
    selectedSubject = null;
    void openForm(descriptor);
  };

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
    addCleanup: (callback: () => void) => void;
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

    const cleanupCallbacks = new Set<() => void>();

    const runCleanup = () => {
      if (cleanupCallbacks.size === 0) {
        return;
      }
      for (const callback of cleanupCallbacks) {
        try {
          callback();
        } catch (error) {
          console.warn('[organisation-manager] Modal cleanup failed', error);
        }
      }
      cleanupCallbacks.clear();
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };

    const close = () => {
      document.removeEventListener('keydown', handleKeydown);
      runCleanup();
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

    const addCleanup = (callback: () => void) => {
      cleanupCallbacks.add(callback);
    };

    activeModal = { close, addCleanup };

    return { body, footer, close, addCleanup };
  }

  async function refreshResourceList(
    highlightSubject?: string,
    { keepSelection = false }: { keepSelection?: boolean } = {}
  ) {
    resources = await fetchResources(store, descriptors);

    const columnDefinitions: ColumnDefinition[] = COLUMN_ORDER.map((key) => ({
      key,
      host: layout.resourceColumns[key],
      descriptors: COLUMN_DESCRIPTOR_GROUPS[key].flatMap(
        (bucketKey) => descriptorBuckets[bucketKey]
      ),
      copy: COLUMN_COPY[key],
    }));

    renderResourceColumns(columnDefinitions, resources, {
      onSelect(resource) {
        selectedSubject = resource.subject;
        void openForm(resource.descriptor, resource);
      },
      onCreate: handleCreate,
      highlightSubject:
        highlightSubject ?? (keepSelection ? selectedSubject ?? undefined : undefined),
    });
    layout.emptyState.hidden = resources.length > 0;
  }

  async function openForm(descriptor: ShapeDescriptor, existing?: ResourceRecord) {
    const modal = openModal(
      existing ? `Editing ${descriptor.label}` : `Create ${descriptor.label}`
    );

    const form = document.createElement('shacl-form') as ShaclFormElement;
    applyMaterialShaclTheme(form);

    modal.addCleanup(() => {
      form.replaceWith();
    });

    const status = document.createElement('p');
    status.className = 'modal__status';

    const setStatusMessage = (message?: string) => {
      if (message) {
        status.textContent = message;
      } else {
        status.textContent = 'Values are validated against the SHACL shapes defining the form.';
      }
    };

    setStatusMessage();
    const identifiers: ResourceIdentifiers = existing
      ? { subject: existing.subject, graph: existing.graph }
      : createIdentifiers(descriptor);
    const namespace = ensureTrailingSlash(descriptor.valuesNamespace);

    form.setAttribute('data-shapes', shapes.text);
    form.setAttribute('data-shape-subject', descriptor.shape.value);
    form.setAttribute('data-values-subject', identifiers.subject);
    form.setAttribute('data-values-graph', identifiers.graph);
    form.setAttribute('data-values-namespace', namespace);
    form.setAttribute('data-collapse', 'open');
    form.setAttribute('data-loading', 'Preparing SHACL form…');

    const detachClassProvider = attachClassInstanceProvider(form, store);
    modal.addCleanup(() => {
      detachClassProvider();
    });

    modal.body.append(form, status);

    if (existing) {
      const trig = await readResourceAsTrig(store, existing);
      if (trig) {
        form.setAttribute('data-values', trig);
      } else {
        form.removeAttribute('data-values');
      }
    } else {
      form.removeAttribute('data-values');
    }

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
      try {
        const references = await listIncomingReferenceSubjects(store, existing.subject);
        if (references.length > 0) {
          const previewLimit = 10;
          const listed = references
            .slice(0, previewLimit)
            .map((iri: string) => `• ${iri}`)
            .join('\n');
          const remainder =
            references.length > previewLimit
              ? `\n…and ${references.length - previewLimit} more.`
              : '';
          const confirmMessage = [
            `${descriptor.label} is referenced by the following resources:`,
            listed,
            remainder,
            '',
            'Deleting it will leave those triples with dangling object IRIs. Continue?',
          ]
            .filter(Boolean)
            .join('\n');
          const proceed = window.confirm(confirmMessage);
          if (!proceed) {
            deleteButton.disabled = false;
            return;
          }
        }

        setStatusMessage(`Marking ${descriptor.label.toLowerCase()} as expired…`);
        await removeResource(store, existing);
        setStatusMessage(`${descriptor.label} expired.`);
        selectedSubject = null;
        await refreshResourceList();
        modal.close();
      } catch (error) {
        console.error('[organisation-manager] Failed to delete resource', error);
        setStatusMessage(`Failed to delete: ${extractMessage(error)}`);
        deleteButton.disabled = false;
      }
    });
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'modal__button modal__button--secondary';
    cancelButton.addEventListener('click', () => {
      modal.close();
    });

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.textContent = existing ? `Save ${descriptor.label}` : `Create ${descriptor.label}`;
    saveButton.className = 'modal__button';
    saveButton.addEventListener('click', async () => {
      saveButton.disabled = true;
      setStatusMessage(`Validating ${descriptor.label.toLowerCase()}…`);
      try {
        const report = await form.validate();
        const conforms =
          typeof report === 'object' && report !== null
            ? report.conforms !== false
            : report === true;
        if (!conforms) {
          setStatusMessage('Resolve validation issues before saving.');
          const invalidField = modal.body.querySelector('.invalid .editor') as HTMLElement | null;
          if (invalidField) {
            invalidField.focus();
          }
          return;
        }

        setStatusMessage(`Saving ${descriptor.label.toLowerCase()}…`);
        const trig = form.serialize('application/trig');
        await persistForm(store, {
          trig,
          graph: identifiers.graph,
          subject: identifiers.subject,
          targetClass: descriptor.targetClass,
        });
        setStatusMessage(`${descriptor.label} saved.`);
        selectedSubject = identifiers.subject;
        await refreshResourceList(selectedSubject ?? undefined);
        modal.close();
      } catch (error) {
        console.error('[organisation-manager] Failed to save form', error);
        setStatusMessage(`Failed to save: ${extractMessage(error)}`);
      } finally {
        saveButton.disabled = false;
      }
    });

    modal.footer.append(saveButton, cancelButton, deleteButton);
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
      </header>
      <p class="panel__body panel__body--muted" data-role="empty-state" hidden>No organisation data stored locally yet.</p>
      <div class="resource-list" data-role="resource-list">
        <div class="resource-list__column resource-list__column--roles" data-column="roles"></div>
        <div class="resource-list__column resource-list__column--organisations" data-column="organisations"></div>
        <div class="resource-list__column resource-list__column--sites" data-column="sites"></div>
      </div>
    </section>
    <div data-role="modal-host"></div>
  `;

  return {
    resourceListRoot: assert(
      container.querySelector<HTMLElement>('[data-role="resource-list"]'),
      'Resource list root missing'
    ),
    resourceColumns: {
      roles: assert(
        container.querySelector<HTMLElement>('[data-role="resource-list"] [data-column="roles"]'),
        'Resource roles column missing'
      ),
      organisations: assert(
        container.querySelector<HTMLElement>(
          '[data-role="resource-list"] [data-column="organisations"]'
        ),
        'Resource organisations column missing'
      ),
      sites: assert(
        container.querySelector<HTMLElement>('[data-role="resource-list"] [data-column="sites"]'),
        'Resource sites column missing'
      ),
    },
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

// Buckets shapes into the column that matches their target class semantics.
function categorizeDescriptors(
  descriptors: ShapeDescriptor[],
  dataset: DatasetCore
): DescriptorBuckets {
  const buckets: DescriptorBuckets = { roles: [], organisations: [], sites: [] };

  descriptors.forEach((descriptor) => {
    if (
      isClassOrSubclassOf(descriptor.targetClass, ORG_ROLE, dataset) ||
      descriptor.targetClass.value === ERA_ORGANISATION_ROLE
    ) {
      buckets.roles.push(descriptor);
      return;
    }

    const target = descriptor.targetClass.value;

    if (target === ORG_SITE || target === DCTERMS_LOCATION || target === LOCN_ADDRESS) {
      buckets.sites.push(descriptor);
      return;
    }

    if (
      target === ORG_FORMAL_ORGANIZATION ||
      target === ORG_ORGANIZATION ||
      target === ORG_ORGANIZATIONAL_UNIT
    ) {
      buckets.organisations.push(descriptor);
      return;
    }

    // Default to the organisations column so new shapes stay visible.
    buckets.organisations.push(descriptor);
  });

  return buckets;
}
