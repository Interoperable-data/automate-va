import type { Quad } from '@rdfjs/types';
import { Parser } from 'n3';
import { GraphStore } from '../data/graph-store';
import { serializeQuads, type RdfSerializationFormat } from './rdf-utils';
import { RDF_NODES, DCTERMS_NODES, TIME_NODES } from './ontologies';
import {
  initRdfViewer,
  formatRdfViewerStatus,
  type RdfViewerController,
} from '../../ui/rdf-viewer';

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

export function initRawRdfView(options: RawRdfViewOptions): RawRdfViewController {
  const { container, store } = options;

  let viewer: RdfViewerController;
  let currentFormat: RdfSerializationFormat = 'application/trig';
  let lastSerialized = '';
  let pending = false;
  let queued = false;
  let lastTripleCount = 0;
  let statusSuffix: string | null = null;
  const refreshDataset = async (): Promise<void> => {
    if (pending) {
      queued = true;
      return;
    }
    pending = true;
    viewer.setStatus('Refreshing data graph…');

    try {
      const quads = await store.getQuads();
      lastTripleCount = quads.length;
      lastSerialized = await serializeQuads(quads, currentFormat);
      const content = lastSerialized || '# Dataset is empty.';
      viewer.setContent(content, currentFormat);
      const statusText = formatRdfViewerStatus(lastTripleCount, currentFormat);
      viewer.setStatus(statusSuffix ? `${statusText} • ${statusSuffix}` : statusText);
      statusSuffix = null;
    } catch (error) {
      console.error('[raw-rdf] Failed to serialize dataset', error);
      viewer.setContent(`# Unable to render dataset\n# ${extractMessage(error)}`, currentFormat);
      viewer.setStatus('Failed to refresh dataset.');
      statusSuffix = null;
    } finally {
      pending = false;
      if (queued) {
        queued = false;
        void refreshDataset();
      }
    }
  };

  const handleCopy = async () => {
    if (!lastSerialized) {
      viewer.setStatus('No data to copy yet.');
      viewer.showAlert('warning', 'No data available to copy yet.');
      return;
    }
    try {
      await navigator.clipboard.writeText(lastSerialized);
      viewer.setStatus(
        `${formatRdfViewerStatus(lastTripleCount, currentFormat)} • Copied to clipboard.`
      );
      viewer.showAlert('success', 'Dataset copied to clipboard.');
    } catch (error) {
      console.warn('[raw-rdf] Clipboard copy failed', error);
      const message = 'Clipboard access denied. Please copy manually.';
      viewer.setStatus(message);
      viewer.showAlert('error', message);
    }
  };

  const handleDownload = () => {
    if (!lastSerialized) {
      viewer.setStatus('No data to download yet.');
      viewer.showAlert('warning', 'No data available to download yet.');
      return;
    }
    const filename = currentFormat === 'application/trig' ? 'va-dataset.trig' : 'va-dataset.nt';
    const blob = new Blob([lastSerialized], { type: currentFormat });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    viewer.setStatus(`${formatRdfViewerStatus(lastTripleCount, currentFormat)} • Downloaded.`);
    viewer.showAlert('success', `Dataset downloaded as ${filename}.`);
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.trig,.ttl,.nt';

    const handleChange = async () => {
      const file = input.files?.[0];
      if (!file) {
        viewer.setStatus('Upload cancelled.');
        viewer.showAlert('warning', 'Upload cancelled.');
        return;
      }

      let parserFormat: UploadParserFormat;
      try {
        parserFormat = detectUploadParserFormat(file.name);
      } catch (error) {
        const message = extractMessage(error);
        viewer.setStatus(message);
        viewer.showAlert('error', message);
        return;
      }

      viewer.setStatus(`Uploading ${file.name}…`);

      try {
        const source = await file.text();
        const parser = new Parser({ format: parserFormat });
        const quads = parser.parse(source);

        if (parserFormat === 'text/turtle') {
          ensureTurtleUsesDefaultGraph(quads);
        }

        if (!Array.isArray(quads) || quads.length === 0) {
          const message = `${file.name} contained no RDF quads.`;
          viewer.setStatus(message);
          viewer.showAlert('warning', message);
          return;
        }

        statusSuffix = `Imported ${quads.length} ${formatQuadLabel(quads.length)} from ${
          file.name
        }`;
        await store.putQuads(quads);
        viewer.showAlert('success', statusSuffix);
      } catch (error) {
        console.error('[raw-rdf] Failed to upload dataset', error);
        const message = `Failed to upload ${file.name}: ${extractMessage(error)}`;
        viewer.setStatus(message);
        viewer.showAlert('error', message);
        statusSuffix = null;
      } finally {
        input.value = '';
      }
    };

    input.addEventListener(
      'change',
      () => {
        void handleChange();
      },
      { once: true }
    );

    input.click();
  };

  const handleClear = async () => {
    const confirmed = window.confirm(
      'This will permanently remove every quad stored locally. This action cannot be undone. Do you want to continue?'
    );
    if (!confirmed) {
      viewer.setStatus('Storage purge cancelled.');
      viewer.showAlert('warning', 'Storage purge cancelled.');
      return;
    }

    viewer.setStatus('Clearing browser storage…');
    try {
      await store.clear();
      viewer.setStatus('Browser storage cleared.');
      viewer.showAlert('success', 'Browser storage cleared.');
    } catch (error) {
      console.error('[raw-rdf] Failed to clear data store', error);
      const message = `Failed to clear storage: ${extractMessage(error)}`;
      viewer.setStatus(message);
      viewer.showAlert('error', message);
    }
  };

  const handleClean = async () => {
    const confirmed = window.confirm(
      'This will remove triples whose object IRIs do not correspond to existing subject nodes. This action cannot be undone. Do you want to continue?'
    );
    if (!confirmed) {
      viewer.setStatus('Graph cleanup cancelled.');
      viewer.showAlert('warning', 'Graph cleanup cancelled.');
      return;
    }

    viewer.setStatus('Removing dangling references…');
    try {
      const removed = await removeDanglingReferenceQuads(store);
      if (removed === 0) {
        viewer.setStatus('No dangling references found.');
        viewer.showAlert('success', 'No dangling references found.');
      } else {
        const label = removed === 1 ? 'dangling triple' : 'dangling triples';
        const message = `Removed ${removed} ${label}.`;
        viewer.setStatus(message);
        viewer.showAlert('success', message);
      }
    } catch (error) {
      console.error('[raw-rdf] Failed to clean dangling references', error);
      const message = `Failed to clean graph: ${extractMessage(error)}`;
      viewer.setStatus(message);
      viewer.showAlert('error', message);
    }
  };

  viewer = initRdfViewer({
    container,
    initialFormat: currentFormat,
    onFormatChange: (format) => {
      currentFormat = format;
      void refreshDataset();
    },
    onRefresh: () => refreshDataset(),
    onCopy: () => handleCopy(),
    onDownload: handleDownload,
    onUpload: handleUpload,
    onClear: () => handleClear(),
    onClean: () => handleClean(),
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

function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
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

type UploadParserFormat = 'application/trig' | 'application/n-triples' | 'text/turtle';

function detectUploadParserFormat(filename: string): UploadParserFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.trig')) {
    return 'application/trig';
  }
  if (lower.endsWith('.ttl')) {
    return 'text/turtle';
  }
  if (lower.endsWith('.nt')) {
    return 'application/n-triples';
  }
  throw new Error('Unsupported file extension. Please upload a .trig, .ttl, or .nt file.');
}

function formatQuadLabel(count: number): string {
  return count === 1 ? 'quad' : 'quads';
}

function ensureTurtleUsesDefaultGraph(quads: Quad[]): void {
  const hasNamedGraph = quads.some((quad) => quad.graph.termType !== 'DefaultGraph');
  if (hasNamedGraph) {
    throw new Error('Turtle uploads must not contain named GRAPH contexts.');
  }
}
