import { GraphStore } from '../data/graph-store';
import { assert } from '../utils/assert';
import { serializeQuads, type RdfSerializationFormat } from './rdf-utils';

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
      layout.output.textContent = lastSerialized || '# Dataset is empty.';
      layout.status.textContent = formatStatus(lastTripleCount, currentFormat);
    } catch (error) {
      console.error('[raw-rdf] Failed to serialize dataset', error);
      layout.output.textContent = `# Unable to render dataset\n# ${extractMessage(error)}`;
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
          <button type="button" data-role="refresh" class="panel__button">Refresh</button>
          <button type="button" data-role="copy" class="panel__button panel__button--secondary">Copy</button>
          <button type="button" data-role="download" class="panel__button panel__button--secondary">Download</button>
        </div>
      </div>
      <aside class="rdf-warning">
        <p class="rdf-warning__message">Clearing the browser storage deletes every saved graph and cannot be undone.</p>
        <button type="button" data-role="clear" class="panel__button panel__button--danger">Clear browser storage</button>
      </aside>
      <pre class="rdf-preview" data-role="output"># Dataset is empty. Create an organisation to get started.</pre>
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
