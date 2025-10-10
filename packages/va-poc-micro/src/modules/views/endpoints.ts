import { GraphStore } from '../data/graph-store';
import { assert } from '../utils/assert';
import { serializeQuads } from './rdf-utils';

interface EndpointsViewOptions {
  container: HTMLElement;
  store: GraphStore;
}

interface EndpointsViewController {
  activate: () => void;
}

interface LayoutRefs {
  form: HTMLFormElement;
  endpointInput: HTMLInputElement;
  tokenInput: HTMLInputElement;
  submitButton: HTMLButtonElement;
  status: HTMLElement;
  result: HTMLElement;
}

const STORAGE_KEYS = {
  endpoint: 'va:endpoints:endpointUrl',
  token: 'va:endpoints:authToken',
} as const;

export function initEndpointsView(options: EndpointsViewOptions): EndpointsViewController {
  const { container, store } = options;
  const layout = buildLayout(container);

  restorePreferences(layout);

  layout.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const endpoint = layout.endpointInput.value.trim();
    if (!endpoint) {
      layout.status.textContent = 'Provide an endpoint URL to run validation.';
      layout.endpointInput.focus();
      return;
    }

    const quads = await store.getQuads();
    if (quads.length === 0) {
      layout.status.textContent = 'The dataset is empty. Add organisation data before validating.';
      layout.result.textContent = '';
      return;
    }

    const payload = await serializeQuads(quads, 'text/turtle');
    const headers: Record<string, string> = {
      'content-type': 'text/turtle',
      accept: 'application/json, text/turtle;q=0.9, */*;q=0.1',
    };
    const rawToken = layout.tokenInput.value.trim();
    if (rawToken) {
      headers.Authorization = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
    }

    savePreferences(layout);

    layout.submitButton.disabled = true;
    layout.status.textContent = `Sending ${quads.length} triples to the SHACL endpoint…`;
    layout.result.textContent = '# Waiting for response…';

    try {
      const started = performance.now();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: payload,
      });
      const duration = formatDuration(performance.now() - started);
      const contentType = response.headers.get('content-type') ?? '';
      const text = await response.text();

      if (!response.ok) {
        layout.status.textContent = `Validation failed (${response.status} ${response.statusText}, ${duration}).`;
        layout.result.textContent = formatResponseBody(text, contentType);
        return;
      }

      layout.status.textContent = `Validation succeeded (${duration}).`;
      layout.result.textContent = formatResponseBody(text, contentType);
    } catch (error) {
      console.error('[endpoints] Validation request failed', error);
      layout.status.textContent = `Request failed: ${extractMessage(error)}`;
      layout.result.textContent = '';
    } finally {
      layout.submitButton.disabled = false;
    }
  });

  return {
    activate() {
      // No-op for now but kept for symmetry with other views.
    },
  };
}

function buildLayout(container: HTMLElement): LayoutRefs {
  container.innerHTML = `
    <section class="panel">
      <h2 class="panel__title">Validate against remote SHACL endpoint</h2>
      <p class="panel__body">
        Send the locally stored RDF graph to a SHACL validation service. The request uses HTTP POST with the Turtle payload.
      </p>
      <form class="endpoint-form" data-role="endpoint-form">
        <label class="endpoint-form__field">
          Endpoint URL
          <input type="url" name="endpoint" placeholder="https://example.org/shacl/validate" required />
        </label>
        <label class="endpoint-form__field">
          Authorization header (optional)
          <input type="text" name="token" placeholder="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…" />
        </label>
        <div class="endpoint-form__actions">
          <button type="submit" class="panel__button">Validate dataset</button>
        </div>
      </form>
      <footer class="endpoint-form__status" data-role="status">Waiting for validation.</footer>
      <pre class="endpoint-form__result" data-role="result"># Validation output will appear here.</pre>
    </section>
  `;

  const form = assert(
    container.querySelector<HTMLFormElement>('[data-role="endpoint-form"]'),
    'Endpoints form element missing'
  );
  const endpointInput = assert(
    form.querySelector<HTMLInputElement>('input[name="endpoint"]'),
    'Endpoint input missing'
  );
  const tokenInput = assert(
    form.querySelector<HTMLInputElement>('input[name="token"]'),
    'Token input missing'
  );
  const submitButton = assert(
    form.querySelector<HTMLButtonElement>('button[type="submit"]'),
    'Submit button missing'
  );
  const status = assert(
    container.querySelector<HTMLElement>('[data-role="status"]'),
    'Status element missing'
  );
  const result = assert(
    container.querySelector<HTMLElement>('[data-role="result"]'),
    'Result output missing'
  );

  const preferenceFields: Pick<LayoutRefs, 'endpointInput' | 'tokenInput'> = {
    endpointInput,
    tokenInput,
  };
  endpointInput.addEventListener('change', () => savePreferences(preferenceFields));
  tokenInput.addEventListener('change', () => savePreferences(preferenceFields));

  return { form, endpointInput, tokenInput, submitButton, status, result };
}

function restorePreferences(layout: Pick<LayoutRefs, 'endpointInput' | 'tokenInput'>): void {
  try {
    const storedEndpoint = window.localStorage.getItem(STORAGE_KEYS.endpoint);
    if (storedEndpoint) {
      layout.endpointInput.value = storedEndpoint;
    }
    const storedToken = window.localStorage.getItem(STORAGE_KEYS.token);
    if (storedToken) {
      layout.tokenInput.value = storedToken;
    }
  } catch (error) {
    console.warn('[endpoints] Failed to restore preferences', error);
  }
}

function savePreferences(layout: Pick<LayoutRefs, 'endpointInput' | 'tokenInput'>): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.endpoint, layout.endpointInput.value.trim());
    window.localStorage.setItem(STORAGE_KEYS.token, layout.tokenInput.value.trim());
  } catch (error) {
    console.warn('[endpoints] Unable to persist endpoint preferences', error);
  }
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) {
    return 'unknown time';
  }
  if (ms < 1000) {
    return `${ms.toFixed(0)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatResponseBody(body: string, contentType: string): string {
  if (!body) {
    return '# Endpoint responded with no body.';
  }
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      console.warn('[endpoints] Failed to parse JSON response', error);
      return body;
    }
  }
  return body;
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
