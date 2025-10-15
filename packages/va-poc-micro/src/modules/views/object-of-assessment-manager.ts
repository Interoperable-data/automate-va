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
  readResourceAsTurtle,
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
import { ERA } from './ontologies';
import type { ShaclFormElement } from '../../types/shacl-form';

const ERA_EC_DECLARATION = ERA.ECDeclaration;
const ERA_CLD = ERA.CLD;
const ERA_CAB_EVIDENCE = ERA.CABEvidence;

interface ObjectOfAssessmentManagerOptions {
  container: HTMLElement;
  store: GraphStore;
  shapes: LoadedShape;
}

interface ObjectOfAssessmentManagerController {
  activate: () => void;
}

interface DescriptorBuckets {
  declarations: ShapeDescriptor[];
  certificates: ShapeDescriptor[];
  evidence: ShapeDescriptor[];
}

type ColumnKey = 'ecEvidence' | 'otherCertificates' | 'statements';
type DescriptorBucketKey = keyof DescriptorBuckets;

const COLUMN_COPY: Record<ColumnKey, { title: string; description: string; empty: string }> = {
  ecEvidence: {
    title: 'EC Evidence (CLD, ECD)',
    description:
      'Capture EC declarations, EC certificates, and assessment evidence used for conformity.',
    empty: 'No EC evidence, declarations, or certificates available yet.',
  },
  otherCertificates: {
    title: 'Other Certificates (RID…)',
    description: 'Track additional certificates as soon as corresponding shapes are introduced.',
    empty: 'No other certificate shapes available yet.',
  },
  statements: {
    title: 'Statements (NSA, ESC/RSC…)',
    description: 'Record statements from authorities and safety bodies when shapes are defined.',
    empty: 'No statement shapes available yet.',
  },
} as const;

const COLUMN_ORDER: ColumnKey[] = ['ecEvidence', 'otherCertificates', 'statements'];

// Defines which descriptor buckets appear in each rendered column.
const COLUMN_DESCRIPTOR_GROUPS: Record<ColumnKey, DescriptorBucketKey[]> = {
  ecEvidence: ['evidence', 'declarations', 'certificates'],
  otherCertificates: [],
  statements: [],
} as const;

export async function initObjectOfAssessmentManagerView(
  options: ObjectOfAssessmentManagerOptions
): Promise<ObjectOfAssessmentManagerController> {
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
      'Add targetable NodeShapes to the shapes graph to start managing assessment objects.';
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
          console.warn('[object-of-assessment-manager] Modal cleanup failed', error);
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
      const turtle = await readResourceAsTurtle(store, existing);
      if (turtle) {
        form.setAttribute('data-values', turtle);
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
        console.error('[object-of-assessment-manager] Failed to delete resource', error);
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
        const turtle = form.serialize('text/turtle');
        await persistForm(store, {
          turtle,
          graph: identifiers.graph,
          subject: identifiers.subject,
          targetClass: descriptor.targetClass,
        });
        setStatusMessage(`${descriptor.label} saved.`);
        selectedSubject = identifiers.subject;
        await refreshResourceList(selectedSubject ?? undefined);
        modal.close();
      } catch (error) {
        console.error('[object-of-assessment-manager] Failed to save form', error);
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
        <h2 class="panel__title">Manage assessment objects</h2>
      </header>
      <p class="panel__body panel__body--muted" data-role="empty-state" hidden>No assessment data stored locally yet.</p>
      <div class="resource-list" data-role="resource-list">
        <div class="resource-list__column resource-list__column--ec-evidence" data-column="ecEvidence"></div>
        <div class="resource-list__column resource-list__column--other-certificates" data-column="otherCertificates"></div>
        <div class="resource-list__column resource-list__column--statements" data-column="statements"></div>
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
      ecEvidence: assert(
        container.querySelector<HTMLElement>(
          '[data-role="resource-list"] [data-column="ecEvidence"]'
        ),
        'Resource EC evidence column missing'
      ),
      otherCertificates: assert(
        container.querySelector<HTMLElement>(
          '[data-role="resource-list"] [data-column="otherCertificates"]'
        ),
        'Resource other certificates column missing'
      ),
      statements: assert(
        container.querySelector<HTMLElement>(
          '[data-role="resource-list"] [data-column="statements"]'
        ),
        'Resource statements column missing'
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
  const buckets: DescriptorBuckets = { declarations: [], certificates: [], evidence: [] };

  descriptors.forEach((descriptor) => {
    const target = descriptor.targetClass.value;

    if (
      target === ERA_EC_DECLARATION ||
      isClassOrSubclassOf(descriptor.targetClass, ERA_EC_DECLARATION, dataset)
    ) {
      buckets.declarations.push(descriptor);
      return;
    }

    if (target === ERA_CLD || isClassOrSubclassOf(descriptor.targetClass, ERA_CLD, dataset)) {
      buckets.certificates.push(descriptor);
      return;
    }

    if (
      target === ERA_CAB_EVIDENCE ||
      isClassOrSubclassOf(descriptor.targetClass, ERA_CAB_EVIDENCE, dataset)
    ) {
      buckets.evidence.push(descriptor);
      return;
    }

    // Default to declarations so new shapes stay visible while awaiting categorisation.
    buckets.declarations.push(descriptor);
  });

  return buckets;
}
