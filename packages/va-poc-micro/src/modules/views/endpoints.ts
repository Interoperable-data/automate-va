import rdfDataFactory from '@rdfjs/data-model';
import type { Quad_Object } from '@rdfjs/types';
import { discoverShapeDescriptors, type ShapeDescriptor } from '../data/shape-descriptors';
import type { LoadedShape } from '../data/organisation-shapes';
import { GraphStore } from '../data/graph-store';
import { assert } from '../utils/assert';
import { deriveInfoEndpoint, validateShacl } from '../utils/shacl-endpoint';
import { serializeQuads } from './rdf-utils';

interface EndpointsViewOptions {
  container: HTMLElement;
  store: GraphStore;
  shapes: LoadedShape[];
}

interface EndpointsViewController {
  activate: () => void;
}

interface LayoutRefs {
  checkButton: HTMLButtonElement;
  validateButton: HTMLButtonElement;
  status: HTMLElement;
  result: HTMLElement;
  endpointList: HTMLElement;
  endpointEmpty: HTMLElement;
}

const STORAGE_KEYS = {
  endpointCredentialsPrefix: 'va:endpoints:credentials:',
  hostCredentialsPrefix: 'va:endpoints:host:',
  legacyEndpointTokenPrefix: 'va:endpoints:token:',
} as const;

const DEFAULT_VALIDATOR_ENDPOINT = 'https://www.itb.ec.europa.eu/shacl/any/api/validate';
const DCTERMS_SOURCE = rdfDataFactory.namedNode('http://purl.org/dc/terms/source');
const XSD_ANY_URI = 'http://www.w3.org/2001/XMLSchema#anyURI';

interface ShapeEndpointUsage {
  shapeIri: string;
  label: string;
  targetClass: string | null;
}

interface ManagedEndpoint {
  url: string;
  host: string | null;
  usage: ShapeEndpointUsage[];
}

interface CredentialsPayload {
  token: string;
  username: string;
  password: string;
}

interface HostCredentialsPayload extends CredentialsPayload {
  applyToAll: boolean;
}

interface CredentialState extends CredentialsPayload {
  shared: boolean;
}

export function initEndpointsView(options: EndpointsViewOptions): EndpointsViewController {
  const { container, store, shapes } = options;
  const layout = buildLayout(container);

  const managedEndpoints = collectManagedEndpoints(shapes);
  renderEndpointList(layout, managedEndpoints);

  layout.endpointEmpty.hidden = managedEndpoints.length > 0;

  layout.checkButton.addEventListener('click', async () => {
    const endpointValue = DEFAULT_VALIDATOR_ENDPOINT;
    const infoUrl = deriveInfoEndpoint(endpointValue);
    if (!infoUrl) {
      layout.status.textContent = 'Unable to derive the info endpoint for the validator.';
      return;
    }

    layout.checkButton.disabled = true;
    layout.status.textContent = `Checking endpoint info at ${infoUrl}…`;
    layout.result.textContent = '# Waiting for endpoint info…';

    try {
      const started = performance.now();
      const response = await fetch(infoUrl, {
        method: 'GET',
        headers: {
          accept: 'application/json, text/plain;q=0.9, */*;q=0.1',
        },
      });
      const duration = formatDuration(performance.now() - started);
      const contentType = response.headers.get('content-type') ?? '';
      const body = await response.text();

      if (!response.ok) {
        layout.status.textContent = `Endpoint info failed (${response.status} ${response.statusText}, ${duration}).`;
        layout.result.textContent = formatResponseBody(body, contentType);
        return;
      }

      layout.status.textContent = `Endpoint info succeeded (${duration}).`;
      layout.result.textContent = formatResponseBody(body, contentType);
    } catch (error) {
      const message = extractMessage(error);
      const hint = message === 'Failed to fetch' ? ' (possible CORS restriction)' : '';
      layout.status.textContent = `Endpoint info request failed${hint}: ${message}`;
      layout.result.textContent = '';
    } finally {
      layout.checkButton.disabled = false;
    }
  });

  layout.validateButton.addEventListener('click', async () => {
    const endpoint = DEFAULT_VALIDATOR_ENDPOINT;
    const quads = await store.getQuads();
    if (quads.length === 0) {
      layout.status.textContent = 'The dataset is empty. Add organisation data before validating.';
      layout.result.textContent = '';
      return;
    }

    const payload = await serializeQuads(quads, 'application/trig');
    layout.validateButton.disabled = true;
    const shapeGraphs = shapes.map((shape) => shape.text);
    const shapeCount = shapeGraphs.length;
    layout.status.textContent = `Sending ${quads.length} triples and ${shapeCount} shape graphs to the SHACL endpoint…`;
    layout.result.textContent = '# Waiting for response…';

    try {
      const result = await validateShacl({
        endpoint,
        dataGraph: payload,
        shapeGraphs,
      });
      const duration = formatDuration(result.duration);

      if (!result.ok) {
        layout.status.textContent = `Validation failed (${result.status} ${result.statusText}, ${duration}).`;
        layout.result.textContent = formatResponseBody(
          result.body,
          result.contentType,
          result.requestPayload
        );
        return;
      }

      layout.status.textContent = `Validation succeeded (${duration}).`;
      layout.result.textContent = formatResponseBody(
        result.body,
        result.contentType,
        result.requestPayload
      );
    } catch (error) {
      console.error('[endpoints] Validation request failed', error);
      const message = extractMessage(error);
      const hint = message === 'Failed to fetch' ? ' (possible CORS restriction)' : '';
      layout.status.textContent = `Request failed${hint}: ${message}`;
      layout.result.textContent = '';
    } finally {
      layout.validateButton.disabled = false;
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
      <h2 class="panel__title">Connected linked data endpoints</h2>
      <p class="panel__body">
        The SHACL shapes reference external SPARQL or Graph Store endpoints. Provide credentials for each endpoint to allow the helper service to fetch additional data when needed.
      </p>
      <div class="endpoint-list" data-role="endpoint-list"></div>
      <p class="endpoint-list__empty" data-role="endpoint-empty">No endpoints discovered in the loaded shapes.</p>
    </section>
    <section class="panel">
      <h2 class="panel__title">Validate against remote SHACL endpoint</h2>
      <p class="panel__body">
        Send the locally stored RDF graph to the Interop testbed validator (https://www.itb.ec.europa.eu/shacl/any/api/validate).
      </p>
      <div class="endpoint-form" data-role="endpoint-form">
        <div class="endpoint-form__actions">
          <button type="button" class="panel__button panel__button--secondary" data-role="check-endpoint">Check endpoint</button>
          <button type="button" class="panel__button" data-role="run-validation">Validate dataset</button>
        </div>
      </div>
      <footer class="endpoint-form__status" data-role="status">Waiting for validation.</footer>
      <pre class="endpoint-form__result" data-role="result"># Validation output will appear here.</pre>
    </section>
  `;

  const endpointList = assert(
    container.querySelector<HTMLElement>('[data-role="endpoint-list"]'),
    'Endpoint list container missing'
  );
  const endpointEmpty = assert(
    container.querySelector<HTMLElement>('[data-role="endpoint-empty"]'),
    'Endpoint empty message missing'
  );
  const checkButton = assert(
    container.querySelector<HTMLButtonElement>('[data-role="check-endpoint"]'),
    'Check endpoint button missing'
  );
  const validateButton = assert(
    container.querySelector<HTMLButtonElement>('[data-role="run-validation"]'),
    'Validate button missing'
  );
  const status = assert(
    container.querySelector<HTMLElement>('[data-role="status"]'),
    'Status element missing'
  );
  const result = assert(
    container.querySelector<HTMLElement>('[data-role="result"]'),
    'Result output missing'
  );

  return {
    checkButton,
    validateButton,
    status,
    result,
    endpointList,
    endpointEmpty,
  };
}

function collectManagedEndpoints(shapes: LoadedShape[]): ManagedEndpoint[] {
  const descriptors = new Map<string, ShapeDescriptor>();
  for (const shape of shapes) {
    for (const descriptor of discoverShapeDescriptors(shape.dataset)) {
      descriptors.set(descriptor.shape.value, descriptor);
    }
  }

  const endpoints = new Map<string, ManagedEndpoint>();
  for (const shape of shapes) {
    for (const quad of shape.dataset.match(undefined, DCTERMS_SOURCE, undefined)) {
      if (quad.subject.termType !== 'NamedNode') {
        continue;
      }
      const endpointUrl = termToUrl(quad.object);
      if (!endpointUrl) {
        continue;
      }
      const descriptor = descriptors.get(quad.subject.value);
      const usage: ShapeEndpointUsage = {
        shapeIri: quad.subject.value,
        label: descriptor?.label ?? quad.subject.value,
        targetClass: descriptor?.targetClass?.value ?? null,
      };
      const entry = endpoints.get(endpointUrl);
      if (!entry) {
        endpoints.set(endpointUrl, {
          url: endpointUrl,
          host: extractHost(endpointUrl),
          usage: [usage],
        });
      } else if (!entry.usage.some((item) => item.shapeIri === usage.shapeIri)) {
        entry.usage.push(usage);
      }
    }
  }

  const managed = Array.from(endpoints.values());
  for (const endpoint of managed) {
    endpoint.usage.sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );
  }
  managed.sort((a, b) => a.url.localeCompare(b.url, undefined, { sensitivity: 'base' }));
  return managed;
}

function renderEndpointList(layout: LayoutRefs, endpoints: ManagedEndpoint[]): void {
  layout.endpointList.innerHTML = '';
  if (endpoints.length === 0) {
    layout.endpointEmpty.hidden = false;
    return;
  }
  layout.endpointEmpty.hidden = true;

  for (const endpoint of endpoints) {
    const card = document.createElement('article');
    card.className = 'endpoint-card';
    card.dataset.endpointUrl = endpoint.url;
    if (endpoint.host) {
      card.dataset.endpointHost = endpoint.host;
    }

    const title = document.createElement('h3');
    title.className = 'endpoint-card__title';
    title.textContent = endpoint.url;

    const hostLine = document.createElement('p');
    hostLine.className = 'endpoint-card__host';
    hostLine.textContent = endpoint.host ? `Host: ${endpoint.host}` : 'Host: unavailable';

    const usage = document.createElement('p');
    usage.className = 'endpoint-card__usage';
    const usageLabels = endpoint.usage.map((item) => item.label).join(', ');
    usage.textContent = `Used by: ${usageLabels}`;

    const tokenField = createCredentialField('Access token', 'password', 'Bearer …', 'token');
    const tokenInput = assert(
      tokenField.querySelector<HTMLInputElement>('input[data-credential="token"]'),
      'Token input missing'
    );

    const usernameField = createCredentialField('Username', 'text', 'service-account', 'username');
    const usernameInput = assert(
      usernameField.querySelector<HTMLInputElement>('input[data-credential="username"]'),
      'Username input missing'
    );

    const passwordField = createCredentialField('Password', 'password', '********', 'password');
    const passwordInput = assert(
      passwordField.querySelector<HTMLInputElement>('input[data-credential="password"]'),
      'Password input missing'
    );

    const shareControl = document.createElement('label');
    shareControl.className = 'endpoint-card__share';
    const shareCheckbox = document.createElement('input');
    shareCheckbox.type = 'checkbox';
    shareCheckbox.dataset.credential = 'share';
    shareCheckbox.disabled = !endpoint.host;
    const shareText = document.createElement('span');
    shareText.textContent = 'Same for all endpoints at this host';
    shareControl.append(shareCheckbox, shareText);

    const helper = document.createElement('p');
    helper.className = 'endpoint-card__helper';
    helper.dataset.credential = 'helper';

    card.append(
      title,
      hostLine,
      usage,
      tokenField,
      usernameField,
      passwordField,
      shareControl,
      helper
    );
    layout.endpointList.append(card);

    const applyState = () => {
      const state = resolveCredentialState(endpoint);
      updateCardFromState(card, endpoint, state);
    };

    applyState();

    const handleCredentialInput = () => {
      const credentials = collectCredentialsFromInputs(tokenInput, usernameInput, passwordInput);
      persistEndpointCredentials(endpoint.url, credentials);
      if (endpoint.host) {
        persistHostCredentials(endpoint.host, {
          ...credentials,
          applyToAll: shareCheckbox.checked,
        });
        if (shareCheckbox.checked) {
          refreshCredentialViews(layout, endpoints);
          return;
        }
      }
      updateCardFromState(card, endpoint, resolveCredentialState(endpoint));
    };

    tokenInput.addEventListener('input', handleCredentialInput);
    usernameInput.addEventListener('input', handleCredentialInput);
    passwordInput.addEventListener('input', handleCredentialInput);

    shareCheckbox.addEventListener('change', () => {
      if (!endpoint.host) {
        shareCheckbox.checked = false;
        return;
      }
      const credentials = collectCredentialsFromInputs(tokenInput, usernameInput, passwordInput);
      persistHostCredentials(endpoint.host, { ...credentials, applyToAll: shareCheckbox.checked });
      refreshCredentialViews(layout, endpoints);
    });
  }

  refreshCredentialViews(layout, endpoints);
}

function createCredentialField(
  labelText: string,
  inputType: 'text' | 'password',
  placeholder: string,
  credentialKey: 'token' | 'username' | 'password'
): HTMLLabelElement {
  const field = document.createElement('label');
  field.className = 'endpoint-card__field';
  field.textContent = labelText;

  const input = document.createElement('input');
  input.type = inputType;
  input.placeholder = placeholder;
  input.spellcheck = false;
  input.dataset.credential = credentialKey;

  switch (credentialKey) {
    case 'username':
      input.autocomplete = 'username';
      break;
    case 'password':
      input.autocomplete = 'current-password';
      break;
    default:
      input.autocomplete = 'off';
      break;
  }

  field.append(input);
  return field;
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

function formatResponseBody(body: string, contentType: string, requestPayload?: string): string {
  if (!body) {
    if (!requestPayload) {
      return '# Endpoint responded with no body.';
    }
    return `# Endpoint responded with no body.\n\n# Request payload\n${requestPayload}`;
  }
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(body);
      const formatted = JSON.stringify(parsed, null, 2);
      if (requestPayload) {
        return `${formatted}\n\n# Request payload\n${requestPayload}`;
      }
      return formatted;
    } catch (error) {
      console.warn('[endpoints] Failed to parse JSON response', error);
      return body;
    }
  }
  if (requestPayload) {
    return `${body}\n\n# Request payload\n${requestPayload}`;
  }
  return body;
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function termToUrl(object: Quad_Object): string | null {
  if (object.termType === 'NamedNode') {
    return object.value;
  }
  if (object.termType === 'Literal') {
    const datatype = object.datatype?.value;
    if (!datatype || datatype === XSD_ANY_URI) {
      return object.value;
    }
  }
  return null;
}

function extractHost(endpointUrl: string): string | null {
  try {
    const parsed = new URL(endpointUrl);
    return parsed.host || null;
  } catch (error) {
    return null;
  }
}

function collectCredentialsFromInputs(
  tokenInput: HTMLInputElement,
  usernameInput: HTMLInputElement,
  passwordInput: HTMLInputElement
): CredentialsPayload {
  return {
    token: tokenInput.value,
    username: usernameInput.value,
    password: passwordInput.value,
  };
}

function refreshCredentialViews(layout: LayoutRefs, endpoints: ManagedEndpoint[]): void {
  const cards = layout.endpointList.querySelectorAll<HTMLElement>('.endpoint-card');
  for (const card of cards) {
    const endpointUrl = card.dataset.endpointUrl;
    if (!endpointUrl) {
      continue;
    }
    const endpoint = endpoints.find((item) => item.url === endpointUrl);
    if (!endpoint) {
      continue;
    }
    const state = resolveCredentialState(endpoint);
    updateCardFromState(card, endpoint, state);
  }
}

function updateCardFromState(
  card: HTMLElement,
  endpoint: ManagedEndpoint,
  state: CredentialState
): void {
  const tokenInput = card.querySelector<HTMLInputElement>('input[data-credential="token"]');
  if (tokenInput && tokenInput.value !== state.token) {
    tokenInput.value = state.token;
  }

  const usernameInput = card.querySelector<HTMLInputElement>('input[data-credential="username"]');
  if (usernameInput && usernameInput.value !== state.username) {
    usernameInput.value = state.username;
  }

  const passwordInput = card.querySelector<HTMLInputElement>('input[data-credential="password"]');
  if (passwordInput && passwordInput.value !== state.password) {
    passwordInput.value = state.password;
  }

  const shareCheckbox = card.querySelector<HTMLInputElement>('input[data-credential="share"]');
  if (shareCheckbox) {
    shareCheckbox.disabled = !endpoint.host;
    const shouldBeChecked = Boolean(endpoint.host) && state.shared;
    if (shareCheckbox.checked !== shouldBeChecked) {
      shareCheckbox.checked = shouldBeChecked;
    }
  }

  const helper = card.querySelector<HTMLElement>('[data-credential="helper"]');
  if (helper) {
    helper.textContent = formatHelperMessage(endpoint, state.shared);
  }

  if (endpoint.host) {
    card.dataset.hostShared = state.shared ? 'true' : 'false';
  } else {
    delete card.dataset.hostShared;
  }
}

function resolveCredentialState(endpoint: ManagedEndpoint): CredentialState {
  const endpointCredentials = readEndpointCredentials(endpoint.url);
  if (!endpoint.host) {
    return { ...endpointCredentials, shared: false };
  }

  const hostCredentials = readHostCredentials(endpoint.host);
  if (hostCredentials?.applyToAll) {
    return {
      token: hostCredentials.token,
      username: hostCredentials.username,
      password: hostCredentials.password,
      shared: true,
    };
  }

  if (
    hostCredentials &&
    !isCredentialsEmpty(hostCredentials) &&
    isCredentialsEmpty(endpointCredentials)
  ) {
    return {
      token: hostCredentials.token,
      username: hostCredentials.username,
      password: hostCredentials.password,
      shared: false,
    };
  }

  return { ...endpointCredentials, shared: false };
}

function formatHelperMessage(endpoint: ManagedEndpoint, shared: boolean): string {
  const base =
    'Stored locally and sent to the helper service only when remote queries are executed.';
  if (!endpoint.host) {
    return `${base} Sharing is unavailable because the endpoint URL has no host segment.`;
  }
  if (shared) {
    return `${base} Currently shared with all endpoints on ${endpoint.host}.`;
  }
  return `${base} Enable "Same for all endpoints at this host" to reuse these credentials for other endpoints on ${endpoint.host}.`;
}

function readEndpointCredentials(endpointUrl: string): CredentialsPayload {
  try {
    const stored = window.localStorage.getItem(endpointCredentialsKey(endpointUrl));
    if (stored) {
      const parsed = JSON.parse(stored);
      return normalizeCredentials(parsed);
    }

    const legacyToken = window.localStorage.getItem(legacyTokenKey(endpointUrl));
    if (legacyToken) {
      const payload = normalizeCredentials({ token: legacyToken });
      persistEndpointCredentials(endpointUrl, payload);
      window.localStorage.removeItem(legacyTokenKey(endpointUrl));
      return payload;
    }
  } catch (error) {
    console.warn('[endpoints] Unable to read endpoint credentials', error);
  }
  return normalizeCredentials({});
}

function persistEndpointCredentials(endpointUrl: string, value: CredentialsPayload): void {
  const normalized = normalizeCredentials(value);
  try {
    const key = endpointCredentialsKey(endpointUrl);
    if (isCredentialsEmpty(normalized)) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(normalized));
    }
    window.localStorage.removeItem(legacyTokenKey(endpointUrl));
  } catch (error) {
    console.warn('[endpoints] Unable to persist endpoint credentials', error);
  }
}

function readHostCredentials(host: string): HostCredentialsPayload | null {
  try {
    const stored = window.localStorage.getItem(hostCredentialsKey(host));
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    return normalizeHostCredentials(parsed);
  } catch (error) {
    console.warn('[endpoints] Unable to read host credentials', error);
    return null;
  }
}

function persistHostCredentials(host: string, value: HostCredentialsPayload): void {
  const normalized = normalizeHostCredentials(value);
  try {
    const key = hostCredentialsKey(host);
    if (!normalized.applyToAll && isCredentialsEmpty(normalized)) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(normalized));
    }
  } catch (error) {
    console.warn('[endpoints] Unable to persist host credentials', error);
  }
}

function normalizeCredentials(value: Partial<CredentialsPayload>): CredentialsPayload {
  return {
    token: typeof value.token === 'string' ? value.token : '',
    username: typeof value.username === 'string' ? value.username : '',
    password: typeof value.password === 'string' ? value.password : '',
  };
}

function normalizeHostCredentials(value: Partial<HostCredentialsPayload>): HostCredentialsPayload {
  const base = normalizeCredentials(value);
  const rawFlag = (value as { applyToAll?: unknown })?.applyToAll;
  const applyToAll = rawFlag === true || rawFlag === 'true';
  return {
    ...base,
    applyToAll,
  };
}

function isCredentialsEmpty(value: CredentialsPayload): boolean {
  return value.token.trim() === '' && value.username.trim() === '' && value.password === '';
}

function endpointCredentialsKey(endpointUrl: string): string {
  return `${STORAGE_KEYS.endpointCredentialsPrefix}${encodeURIComponent(endpointUrl)}`;
}

function hostCredentialsKey(host: string): string {
  return `${STORAGE_KEYS.hostCredentialsPrefix}${encodeURIComponent(host)}`;
}

function legacyTokenKey(endpointUrl: string): string {
  return `${STORAGE_KEYS.legacyEndpointTokenPrefix}${encodeURIComponent(endpointUrl)}`;
}
