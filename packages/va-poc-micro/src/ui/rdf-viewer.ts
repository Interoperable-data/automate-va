import { assert } from '../modules/utils/assert';
import { DEFAULT_PREFIXES } from '../modules/views/ontologies';
import type { RdfSerializationFormat } from '../modules/views/rdf-utils';

const BUTTON_SUCCESS_CLASS = 'rdf-toolbar__button--success';
const BUTTON_FEEDBACK_DURATION = 500;

type ViewerAlertLevel = 'success' | 'warning' | 'error';

const ALERT_LEVEL_CLASSES: Record<ViewerAlertLevel, string> = {
  success: 'rdf-alert--success',
  warning: 'rdf-alert--warning',
  error: 'rdf-alert--error',
} as const;

export type ViewerAction = 'refresh' | 'copy' | 'download' | 'upload' | 'clear' | 'clean';

export interface RdfViewerOptions {
  container: HTMLElement;
  initialFormat?: RdfSerializationFormat;
  initialStatus?: string;
  initialContent?: string;
  onFormatChange?: (format: RdfSerializationFormat) => void;
  onRefresh?: () => void | Promise<unknown>;
  onCopy?: () => void | Promise<unknown>;
  onDownload?: () => void | Promise<unknown>;
  onUpload?: () => void | Promise<unknown>;
  onClear?: () => void | Promise<unknown>;
  onClean?: () => void | Promise<unknown>;
}

export interface RdfViewerController {
  getFormat: () => RdfSerializationFormat;
  setFormat: (format: RdfSerializationFormat) => void;
  setStatus: (message: string) => void;
  setContent: (content: string, format?: RdfSerializationFormat) => void;
  flashAction: (action: ViewerAction) => void;
  showAlert: (level: ViewerAlertLevel, message: string) => void;
  clearAlert: () => void;
}

const FORMAT_LABELS: Record<RdfSerializationFormat, string> = {
  'application/trig': 'TriG',
  'text/plain': 'N-Triples',
} as const;

type LayoutRefs = {
  output: HTMLElement;
  status: HTMLElement;
  formatSelect: HTMLSelectElement;
  alert: HTMLElement;
  alertMessage: HTMLElement;
  alertDismiss: HTMLButtonElement;
  buttons: Record<ViewerAction, HTMLButtonElement>;
};

type TriplePosition = 'subject' | 'predicate' | 'object';

export function initRdfViewer(options: RdfViewerOptions): RdfViewerController {
  const {
    container,
    initialFormat = 'application/trig',
    initialStatus = 'Waiting for data…',
    initialContent = '# Dataset is empty. Create an organisation to get started.',
    onFormatChange,
    onRefresh,
    onCopy,
    onDownload,
    onUpload,
    onClear,
    onClean,
  } = options;

  const layout = buildLayout(container);
  let currentFormat: RdfSerializationFormat = initialFormat;
  let currentAlertLevel: ViewerAlertLevel | null = null;

  const clearAlert = () => {
    if (currentAlertLevel) {
      layout.alert.classList.remove(ALERT_LEVEL_CLASSES[currentAlertLevel]);
    }
    layout.alertMessage.textContent = '';
    layout.alert.hidden = true;
    currentAlertLevel = null;
  };

  const showAlert = (level: ViewerAlertLevel, message: string) => {
    if (currentAlertLevel) {
      layout.alert.classList.remove(ALERT_LEVEL_CLASSES[currentAlertLevel]);
    }
    layout.alert.classList.add(ALERT_LEVEL_CLASSES[level]);
    layout.alertMessage.textContent = message;
    layout.alert.hidden = false;
    currentAlertLevel = level;
  };

  layout.alertDismiss.addEventListener('click', () => {
    clearAlert();
  });

  layout.formatSelect.value = initialFormat;
  layout.status.textContent = initialStatus;
  renderOutput(layout.output, initialContent, initialFormat);

  layout.formatSelect.addEventListener('change', () => {
    currentFormat = layout.formatSelect.value as RdfSerializationFormat;
    onFormatChange?.(currentFormat);
  });

  const actionMap: Record<ViewerAction, (() => void | Promise<unknown>) | undefined> = {
    refresh: onRefresh,
    copy: onCopy,
    download: onDownload,
    upload: onUpload,
    clear: onClear,
    clean: onClean,
  };

  (Object.keys(actionMap) as ViewerAction[]).forEach((action) => {
    attachButton(layout, action, actionMap[action]);
  });

  return {
    getFormat: () => currentFormat,
    setFormat: (format) => {
      currentFormat = format;
      layout.formatSelect.value = format;
    },
    setStatus: (message) => {
      layout.status.textContent = message;
    },
    setContent: (content, format) => {
      if (format) {
        currentFormat = format;
        layout.formatSelect.value = format;
      }
      renderOutput(layout.output, content, currentFormat);
    },
    flashAction: (action) => {
      const button = layout.buttons[action];
      if (!button) {
        return;
      }
      triggerButtonFeedback(button);
    },
    showAlert,
    clearAlert,
  };
}

export function formatRdfViewerStatus(count: number, format: RdfSerializationFormat): string {
  const triples = count === 1 ? '1 triple' : `${count} triples`;
  const timestamp = new Date().toLocaleTimeString();
  return `${triples} • ${FORMAT_LABELS[format] ?? format} • Updated ${timestamp}`;
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
            <option value="application/trig">TriG</option>
            <option value="text/plain">N-Triples</option>
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
          <button type="button" data-role="upload" class="panel__button panel__button--secondary">
            <i aria-hidden="true" class="panel__button-icon bi bi-upload"></i>
            <span>Upload</span>
          </button>
        </div>
      </div>
      <div class="rdf-alert" data-role="alert" hidden>
        <span class="rdf-alert__message" data-role="alert-message"></span>
        <button
          type="button"
          data-role="alert-dismiss"
          class="rdf-alert__dismiss"
          aria-label="Dismiss notification"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <pre class="rdf-preview" data-role="output"></pre>
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
      <footer class="rdf-status" data-role="status"></footer>
    </section>
  `;

  return {
    output: assert(
      container.querySelector<HTMLElement>('[data-role="output"]'),
      'RDF viewer output element missing'
    ),
    status: assert(
      container.querySelector<HTMLElement>('[data-role="status"]'),
      'RDF viewer status element missing'
    ),
    formatSelect: assert(
      container.querySelector<HTMLSelectElement>('[data-role="format"]'),
      'RDF viewer format selector missing'
    ),
    alert: assert(
      container.querySelector<HTMLElement>('[data-role="alert"]'),
      'RDF viewer alert container missing'
    ),
    alertMessage: assert(
      container.querySelector<HTMLElement>('[data-role="alert-message"]'),
      'RDF viewer alert message missing'
    ),
    alertDismiss: assert(
      container.querySelector<HTMLButtonElement>('[data-role="alert-dismiss"]'),
      'RDF viewer alert dismiss button missing'
    ),
    buttons: {
      refresh: assert(
        container.querySelector<HTMLButtonElement>('[data-role="refresh"]'),
        'RDF viewer refresh button missing'
      ),
      copy: assert(
        container.querySelector<HTMLButtonElement>('[data-role="copy"]'),
        'RDF viewer copy button missing'
      ),
      download: assert(
        container.querySelector<HTMLButtonElement>('[data-role="download"]'),
        'RDF viewer download button missing'
      ),
      upload: assert(
        container.querySelector<HTMLButtonElement>('[data-role="upload"]'),
        'RDF viewer upload button missing'
      ),
      clear: assert(
        container.querySelector<HTMLButtonElement>('[data-role="clear"]'),
        'RDF viewer clear button missing'
      ),
      clean: assert(
        container.querySelector<HTMLButtonElement>('[data-role="clean"]'),
        'RDF viewer clean button missing'
      ),
    },
  };
}

function attachButton(
  layout: LayoutRefs,
  action: ViewerAction,
  handler?: () => void | Promise<unknown>
): void {
  const button = layout.buttons[action];
  button.addEventListener('click', () => {
    if (!handler) {
      triggerButtonFeedback(button);
      return;
    }

    try {
      const result = handler();
      if (isPromise(result)) {
        result
          .then(() => {
            triggerButtonFeedback(button);
          })
          .catch((error) => {
            console.error(`[rdf-viewer] Action "${action}" handler failed`, error);
            triggerButtonFeedback(button);
          });
        return;
      }
      triggerButtonFeedback(button);
    } catch (error) {
      console.error(`[rdf-viewer] Action "${action}" handler threw`, error);
      triggerButtonFeedback(button);
    }
  });
}

function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    typeof value === 'object' && value !== null && typeof (value as Promise<T>).then === 'function'
  );
}

function triggerButtonFeedback(button: HTMLButtonElement): void {
  button.classList.remove(BUTTON_SUCCESS_CLASS);
  // Force reflow so successive animations retrigger reliably.
  void button.offsetWidth;
  button.classList.add(BUTTON_SUCCESS_CLASS);
  window.setTimeout(() => {
    button.classList.remove(BUTTON_SUCCESS_CLASS);
  }, BUTTON_FEEDBACK_DURATION);
}

function renderOutput(host: HTMLElement, content: string, format: RdfSerializationFormat): void {
  if (format === 'application/trig') {
    host.innerHTML = highlightTrig(content);
    return;
  }
  host.textContent = content;
}

function highlightTrig(content: string): string {
  if (!content) {
    return '';
  }

  const prefixPattern = /@prefix\s+([^:]+):\s*<([^>]+)>\s*\./g;
  const knownPrefixes = new Map<string, string>();
  const classSegmentByLabel = new Map<string, string>();
  let triplePosition: TriplePosition = 'subject';
  let prefixMatch: RegExpExecArray | null;

  while ((prefixMatch = prefixPattern.exec(content)) !== null) {
    const [, prefix, iri] = prefixMatch;
    registerPrefix(prefix, iri);
  }

  for (const [prefix, iri] of Object.entries(DEFAULT_PREFIXES)) {
    registerPrefix(prefix, iri);
  }

  const tokenPattern =
    /@prefix[^\r\n]*|"(?:[^"\\]|\\.)*"|<[^>]*>|\bGRAPH\b|\b[A-Za-z][A-Za-z0-9_-]*:[^\s;.,()]+|\ba\b/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(content)) !== null) {
    const preceding = content.slice(lastIndex, match.index);
    if (preceding) {
      updateStateForPreceding(preceding);
      result += escapeHtml(preceding);
    }

    const token = match[0];
    if (token.startsWith('@prefix')) {
      result += `<span class="rdf-token rdf-token--directive">${escapeHtml(token)}</span>`;
      lastIndex = tokenPattern.lastIndex;
      continue;
    }

    const priorPosition: TriplePosition = triplePosition;
    let nextPosition: TriplePosition = priorPosition;

    if (token === 'GRAPH') {
      result += `<span class="rdf-token rdf-token--directive">${token}</span>`;
      nextPosition = 'subject';
    } else if (token === 'a') {
      result += `<span class="rdf-token rdf-token--predicate">${escapeHtml(token)}</span>`;
      nextPosition = 'object';
    } else if (token.startsWith('<')) {
      const iri = token.slice(1, -1);
      const classNames = ['rdf-token', 'rdf-token--iri'];
      if (token.endsWith('#graph>')) {
        classNames.push('rdf-token--iri-graph');
      }
      const prefixClass = findPrefixClassForIri(iri);
      if (priorPosition === 'predicate') {
        classNames.push('rdf-token--predicate');
      } else if (prefixClass) {
        classNames.push(`rdf-token--prefix-${prefixClass}`);
      }
      result += `<span class="${classNames.join(' ')}">${escapeHtml(token)}</span>`;
      if (priorPosition === 'subject') {
        nextPosition = 'predicate';
      } else if (priorPosition === 'predicate') {
        nextPosition = 'object';
      }
    } else if (/^[A-Za-z][A-Za-z0-9_-]*:[^\s;,.()]+$/.test(token)) {
      const colonIndex = token.indexOf(':');
      const prefix = colonIndex === -1 ? token : token.slice(0, colonIndex);
      const classNames = ['rdf-token', 'rdf-token--iri'];
      if (priorPosition === 'predicate') {
        classNames.push('rdf-token--predicate');
      } else {
        const classSegment = classSegmentByLabel.get(prefix);
        if (classSegment) {
          classNames.push(`rdf-token--prefix-${classSegment}`);
        }
      }
      result += `<span class="${classNames.join(' ')}">${escapeHtml(token)}</span>`;
      if (priorPosition === 'subject') {
        nextPosition = 'predicate';
      } else if (priorPosition === 'predicate') {
        nextPosition = 'object';
      } else {
        nextPosition = 'object';
      }
    } else {
      result += `<span class="rdf-token rdf-token--literal">${escapeHtml(token)}</span>`;
      nextPosition = 'object';
    }

    triplePosition = nextPosition;

    lastIndex = tokenPattern.lastIndex;
  }

  const remainder = content.slice(lastIndex);
  if (remainder) {
    result += escapeHtml(remainder);
  }

  return result;

  function registerPrefix(prefix: string, iri: string): void {
    const classSegment = sanitizeClassSegment(prefix);
    if (!classSegmentByLabel.has(prefix)) {
      classSegmentByLabel.set(prefix, classSegment);
    }
    if (!knownPrefixes.has(iri)) {
      knownPrefixes.set(iri, classSegment);
    }
  }

  function updateStateForPreceding(snippet: string): void {
    let inComment = false;
    for (let i = 0; i < snippet.length; i += 1) {
      const char = snippet[i];
      if (inComment) {
        if (char === '\n' || char === '\r') {
          inComment = false;
        }
        continue;
      }
      if (char === '#') {
        inComment = true;
        continue;
      }
      if (char === ';') {
        triplePosition = 'predicate';
      } else if (char === ',') {
        triplePosition = 'object';
      } else if (char === '.') {
        triplePosition = 'subject';
      }
    }
  }

  function findPrefixClassForIri(iri: string): string | undefined {
    for (const [base, classSegment] of knownPrefixes.entries()) {
      if (iri.startsWith(base)) {
        return classSegment;
      }
    }
    return undefined;
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeClassSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}
