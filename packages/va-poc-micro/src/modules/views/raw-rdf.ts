import type { Quad } from '@rdfjs/types';
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
  let currentFormat: RdfSerializationFormat = 'text/turtle';
  let lastSerialized = '';
  let pending = false;
  let queued = false;
  let lastTripleCount = 0;
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
      viewer.setStatus(formatRdfViewerStatus(lastTripleCount, currentFormat));
    } catch (error) {
      console.error('[raw-rdf] Failed to serialize dataset', error);
      viewer.setContent(`# Unable to render dataset\n# ${extractMessage(error)}`, currentFormat);
      viewer.setStatus('Failed to refresh dataset.');
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
      return;
    }
    try {
      await navigator.clipboard.writeText(lastSerialized);
      viewer.setStatus(
        `${formatRdfViewerStatus(lastTripleCount, currentFormat)} • Copied to clipboard.`
      );
      viewer.flashAction('copy');
    } catch (error) {
      console.warn('[raw-rdf] Clipboard copy failed', error);
      viewer.setStatus('Clipboard access denied. Please copy manually.');
    }
  };

  const handleDownload = () => {
    if (!lastSerialized) {
      viewer.setStatus('No data to download yet.');
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
    viewer.setStatus(`${formatRdfViewerStatus(lastTripleCount, currentFormat)} • Downloaded.`);
  };

  const handleClear = async () => {
    const confirmed = window.confirm(
      'This will permanently remove every quad stored locally. This action cannot be undone. Do you want to continue?'
    );
    if (!confirmed) {
      viewer.setStatus('Storage purge cancelled.');
      return;
    }

    viewer.setStatus('Clearing browser storage…');
    try {
      await store.clear();
      viewer.setStatus('Browser storage cleared.');
    } catch (error) {
      console.error('[raw-rdf] Failed to clear data store', error);
      viewer.setStatus(`Failed to clear storage: ${extractMessage(error)}`);
    }
  };

  const handleClean = async () => {
    const confirmed = window.confirm(
      'This will remove triples whose object IRIs do not correspond to existing subject nodes. This action cannot be undone. Do you want to continue?'
    );
    if (!confirmed) {
      viewer.setStatus('Graph cleanup cancelled.');
      return;
    }

    viewer.setStatus('Removing dangling references…');
    try {
      const removed = await removeDanglingReferenceQuads(store);
      if (removed === 0) {
        viewer.setStatus('No dangling references found.');
      } else {
        const label = removed === 1 ? 'dangling triple' : 'dangling triples';
        viewer.setStatus(`Removed ${removed} ${label}.`);
      }
    } catch (error) {
      console.error('[raw-rdf] Failed to clean dangling references', error);
      viewer.setStatus(`Failed to clean graph: ${extractMessage(error)}`);
    }
  };

  viewer = initRdfViewer({
    container,
    initialFormat: currentFormat,
    onFormatChange: (format) => {
      currentFormat = format;
      void refreshDataset();
    },
    onRefresh: () => {
      void refreshDataset();
    },
    onCopy: () => {
      void handleCopy();
    },
    onDownload: handleDownload,
    onClear: () => {
      void handleClear();
    },
    onClean: () => {
      void handleClean();
    },
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
