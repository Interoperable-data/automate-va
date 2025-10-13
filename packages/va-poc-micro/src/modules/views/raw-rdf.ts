import type { Quad } from '@rdfjs/types';
import { GraphStore } from '../data/graph-store';
import { assert } from '../utils/assert';
import { serializeQuads, type RdfSerializationFormat } from './rdf-utils';
import { DEFAULT_PREFIXES, RDF_NODES, DCTERMS_NODES, TIME_NODES } from './ontologies';

const RDF_TYPE = RDF_NODES.type;
const DCTERMS_VALID = DCTERMS_NODES.valid;
const TIME_HAS_END = TIME_NODES.hasEnd;
const TIME_IN_XSD_DATE_TIME = TIME_NODES.inXSDDateTime;

interface RawRdfViewOptions {
  container: HTMLElement;
  store: GraphStore;
}

interface RawRdfViewController {
  activate: () => void;
}

interface LayoutRefs {
  output: HTMLElement;
  status: HTMLElement;
  formatSelect: HTMLSelectElement;
  refreshButton: HTMLButtonElement;
  copyButton: HTMLButtonElement;
  downloadButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  cleanButton: HTMLButtonElement;
}

const FORMAT_LABELS: Record<RdfSerializationFormat, string> = {
  'text/turtle': 'Turtle (TTL)',
  'application/n-triples': 'N-Triples',
};

export function initRawRdfView(options: RawRdfViewOptions): RawRdfViewController {
  const { container, store } = options;
  const layout = buildLayout(container);

  let currentFormat: RdfSerializationFormat = 'text/turtle';
  let lastSerialized = '';
  let pending = false;
  let queued = false;
  let lastTripleCount = 0;

  async function refreshDataset(): Promise<void> {
    if (pending) {
      queued = true;
      return;
    }
    pending = true;
    layout.status.textContent = 'Refreshing data graph…';

    try {
      const quads = await store.getQuads();
      lastTripleCount = quads.length;
      lastSerialized = await serializeQuads(quads, currentFormat);
      renderOutput(layout.output, lastSerialized || '# Dataset is empty.', currentFormat);
      layout.status.textContent = formatStatus(lastTripleCount, currentFormat);
    } catch (error) {
      console.error('[raw-rdf] Failed to serialize dataset', error);
      renderOutput(
        layout.output,
        `# Unable to render dataset\n# ${extractMessage(error)}`,
        currentFormat
      );
      layout.status.textContent = 'Failed to refresh dataset.';
    } finally {
      pending = false;
      if (queued) {
        queued = false;
        void refreshDataset();
      }
    }
  }

  layout.formatSelect.addEventListener('change', () => {
    currentFormat = layout.formatSelect.value as RdfSerializationFormat;
    void refreshDataset();
  });

  layout.refreshButton.addEventListener('click', () => {
    void refreshDataset();
  });

  layout.copyButton.addEventListener('click', async () => {
    if (!lastSerialized) {
      layout.status.textContent = 'No data to copy yet.';
      return;
    }
    try {
      await navigator.clipboard.writeText(lastSerialized);
      layout.status.textContent = `${formatStatus(
        lastTripleCount,
        currentFormat
      )} • Copied to clipboard.`;
    } catch (error) {
      console.warn('[raw-rdf] Clipboard copy failed', error);
      layout.status.textContent = 'Clipboard access denied. Please copy manually.';
    }
  });

  layout.downloadButton.addEventListener('click', () => {
    if (!lastSerialized) {
      layout.status.textContent = 'No data to download yet.';
      return;
    }
    const blob = new Blob([lastSerialized], { type: currentFormat });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFormat === 'text/turtle' ? 'va-dataset.ttl' : 'va-dataset.nt';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    layout.status.textContent = `${formatStatus(lastTripleCount, currentFormat)} • Downloaded.`;
  });

  layout.clearButton.addEventListener('click', async () => {
    const confirmed = window.confirm(
      'This will permanently remove every quad stored locally. This action cannot be undone. Do you want to continue?'
    );
    if (!confirmed) {
      layout.status.textContent = 'Storage purge cancelled.';
      return;
    }

    layout.status.textContent = 'Clearing browser storage…';
    try {
      await store.clear();
      layout.status.textContent = 'Browser storage cleared.';
    } catch (error) {
      console.error('[raw-rdf] Failed to clear data store', error);
      layout.status.textContent = `Failed to clear storage: ${extractMessage(error)}`;
    }
  });

  layout.cleanButton.addEventListener('click', async () => {
    const confirmed = window.confirm(
      'This will remove triples whose object IRIs do not correspond to existing subject nodes. This action cannot be undone. Do you want to continue?'
    );
    if (!confirmed) {
      layout.status.textContent = 'Graph cleanup cancelled.';
      return;
    }

    layout.status.textContent = 'Removing dangling references…';
    try {
      const removed = await removeDanglingReferenceQuads(store);
      if (removed === 0) {
        layout.status.textContent = 'No dangling references found.';
      } else {
        const label = removed === 1 ? 'dangling triple' : 'dangling triples';
        layout.status.textContent = `Removed ${removed} ${label}.`;
      }
    } catch (error) {
      console.error('[raw-rdf] Failed to clean dangling references', error);
      layout.status.textContent = `Failed to clean graph: ${extractMessage(error)}`;
    }
  });

  store.subscribe(() => {
    void refreshDataset();
  });

  void refreshDataset();

  return {
    activate() {
      void refreshDataset();
    },
  };
}

function buildLayout(container: HTMLElement): LayoutRefs {
  container.innerHTML = `
    <section class="panel">
      <h2 class="panel__title">Current data graph</h2>
      <p class="panel__body">This snapshot mirrors the quads stored in your browser. Use it to debug, export, or validate against external services.</p>
      <div class="rdf-toolbar">
        <label class="rdf-toolbar__format">
          Format
          <select data-role="format">
            <option value="text/turtle">Turtle (TTL)</option>
            <option value="application/n-triples">N-Triples</option>
          </select>
        </label>
        <div class="rdf-toolbar__actions">
          <button type="button" data-role="refresh" class="panel__button">
            <i aria-hidden="true" class="panel__button-icon bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
          <button type="button" data-role="copy" class="panel__button panel__button--secondary">
            <i aria-hidden="true" class="panel__button-icon bi bi-clipboard"></i>
            <span>Copy</span>
          </button>
          <button type="button" data-role="download" class="panel__button panel__button--secondary">
            <i aria-hidden="true" class="panel__button-icon bi bi-download"></i>
            <span>Download</span>
          </button>
        </div>
      </div>
      <pre class="rdf-preview" data-role="output"># Dataset is empty. Create an organisation to get started.</pre>
      <aside class="rdf-warning">
        <p class="rdf-warning__message">Cleaning the browser graph from non-existing IRI's removes triples linking to non-existing subject nodes and cannot be undone.</p>
        <button type="button" data-role="clean" class="panel__button panel__button--warning">
          <i aria-hidden="true" class="panel__button-icon bi bi-stars"></i>
          <span>Clean dangling triples</span>
        </button>
      </aside>
      <aside class="rdf-warning">
        <p class="rdf-warning__message">Clearing the browser storage deletes every saved graph and cannot be undone.</p>
        <button type="button" data-role="clear" class="panel__button panel__button--danger">
          <i aria-hidden="true" class="panel__button-icon bi bi-trash"></i>
          <span>Clear browser storage</span>
        </button>
      </aside>
      <footer class="rdf-status" data-role="status">Waiting for data…</footer>
    </section>
  `;

  return {
    output: assert(
      container.querySelector<HTMLElement>('[data-role="output"]'),
      'Raw RDF output element missing'
    ),
    status: assert(
      container.querySelector<HTMLElement>('[data-role="status"]'),
      'Raw RDF status element missing'
    ),
    formatSelect: assert(
      container.querySelector<HTMLSelectElement>('[data-role="format"]'),
      'Raw RDF format selector missing'
    ),
    refreshButton: assert(
      container.querySelector<HTMLButtonElement>('[data-role="refresh"]'),
      'Raw RDF refresh button missing'
    ),
    copyButton: assert(
      container.querySelector<HTMLButtonElement>('[data-role="copy"]'),
      'Raw RDF copy button missing'
    ),
    downloadButton: assert(
      container.querySelector<HTMLButtonElement>('[data-role="download"]'),
      'Raw RDF download button missing'
    ),
    clearButton: assert(
      container.querySelector<HTMLButtonElement>('[data-role="clear"]'),
      'Raw RDF clear button missing'
    ),
    cleanButton: assert(
      container.querySelector<HTMLButtonElement>('[data-role="clean"]'),
      'Raw RDF clean button missing'
    ),
  };
}

function currentFormatLabel(format: RdfSerializationFormat): string {
  return FORMAT_LABELS[format];
}

function formatStatus(count: number, format: RdfSerializationFormat): string {
  const triples = count === 1 ? '1 triple' : `${count} triples`;
  const timestamp = new Date().toLocaleTimeString();
  return `${triples} • ${currentFormatLabel(format)} • Updated ${timestamp}`;
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function renderOutput(host: HTMLElement, content: string, format: RdfSerializationFormat): void {
  if (format === 'text/turtle') {
    host.innerHTML = highlightTurtle(content);
    return;
  }
  host.textContent = content;
}

function highlightTurtle(content: string): string {
  if (!content) {
    return '';
  }

  const prefixPattern = /@prefix\s+([^:]+):\s*<([^>]+)>\s*\./g;
  const knownPrefixes = new Map<string, string>();
  let prefixMatch: RegExpExecArray | null;

  while ((prefixMatch = prefixPattern.exec(content)) !== null) {
    const [, prefix, iri] = prefixMatch;
    knownPrefixes.set(iri, prefix);
  }

  for (const [prefix, iri] of Object.entries(DEFAULT_PREFIXES)) {
    if (!knownPrefixes.has(iri)) {
      knownPrefixes.set(iri, prefix);
    }
  }

  const tokenPattern = /@prefix[^\r\n]*|<[^>]*>|"(?:[^"\\]|\\.)*"/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(content)) !== null) {
    const preceding = content.slice(lastIndex, match.index);
    if (preceding) {
      result += escapeHtml(preceding);
    }

    const token = match[0];
    if (token.startsWith('@prefix')) {
      result += `<span class="rdf-token rdf-token--directive">${escapeHtml(token)}</span>`;
    } else if (token.startsWith('<')) {
      const iri = token.slice(1, -1);
      let classNames = ['rdf-token', 'rdf-token--iri'];
      if (token.endsWith('#graph>')) {
        classNames.push('rdf-token--iri-graph');
      }
      for (const [base, prefix] of knownPrefixes.entries()) {
        if (iri.startsWith(base)) {
          classNames.push(`rdf-token--prefix-${prefix}`);
          break;
        }
      }
      result += `<span class="${classNames.join(' ')}">${escapeHtml(token)}</span>`;
    } else {
      result += `<span class="rdf-token rdf-token--literal">${escapeHtml(token)}</span>`;
    }

    lastIndex = tokenPattern.lastIndex;
  }

  const remainder = content.slice(lastIndex);
  if (remainder) {
    result += escapeHtml(remainder);
  }

  return result;
}

async function removeDanglingReferenceQuads(store: GraphStore): Promise<number> {
  const quads = await store.getQuads();
  if (quads.length === 0) {
    return 0;
  }

  const subjectIris = new Set<string>();
  const managedSubjects = new Set<string>();
  const resourceValidity = new Map<string, string>();
  const validityEndNode = new Map<string, string>();
  const timeLiteral = new Map<string, string>();
  const candidateObjects: Quad[] = [];

  for (const quad of quads) {
    if (quad.subject.termType === 'NamedNode') {
      subjectIris.add(quad.subject.value);
      if (quad.predicate.equals(DCTERMS_VALID) && quad.object.termType === 'NamedNode') {
        managedSubjects.add(quad.subject.value);
        resourceValidity.set(quad.subject.value, quad.object.value);
      }
      if (quad.predicate.equals(TIME_HAS_END) && quad.object.termType === 'NamedNode') {
        validityEndNode.set(quad.subject.value, quad.object.value);
      }
      if (quad.predicate.equals(TIME_IN_XSD_DATE_TIME) && quad.object.termType === 'Literal') {
        timeLiteral.set(quad.subject.value, quad.object.value);
      }
    }
    if (quad.object.termType === 'NamedNode' && !quad.predicate.equals(RDF_TYPE)) {
      candidateObjects.push(quad);
    }
  }

  if (candidateObjects.length === 0) {
    return 0;
  }

  const now = Date.now();
  const expiredSubjects = new Set<string>();

  for (const subject of managedSubjects) {
    const validityNode = resourceValidity.get(subject);
    if (!validityNode) {
      continue;
    }
    const endNode = validityEndNode.get(validityNode);
    if (!endNode) {
      continue;
    }
    const timestamp = timeLiteral.get(endNode);
    if (!timestamp) {
      continue;
    }
    const parsed = Date.parse(timestamp);
    if (Number.isNaN(parsed) || parsed <= now) {
      expiredSubjects.add(subject);
    }
  }

  const dangling = candidateObjects.filter((quad) => {
    if (quad.object.termType !== 'NamedNode') {
      return false;
    }
    const objectIri = quad.object.value;
    if (expiredSubjects.has(objectIri)) {
      return true;
    }
    if (!managedSubjects.has(objectIri)) {
      return false;
    }
    return !subjectIris.has(objectIri);
  });
  if (dangling.length === 0) {
    return 0;
  }

  await store.deleteQuads(dangling);
  return dangling.length;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
