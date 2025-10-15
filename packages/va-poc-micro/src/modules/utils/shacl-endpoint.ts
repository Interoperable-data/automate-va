const DEFAULT_CLIENT_ID = 'automate-va-browser/0.1.0';
const DEFAULT_CONTENT_SYNTAX = 'application/trig';
const DEFAULT_RULE_SYNTAX = 'application/trig';
const DEFAULT_REPORT_SYNTAX = 'application/trig';

export interface ShaclValidationOptions {
  endpoint: string;
  dataGraph: string;
  shapeGraphs: string[];
  token?: string;
  reportSyntax?: string;
  contentSyntax?: string;
  ruleSyntax?: string;
  clientTag?: string;
  signal?: AbortSignal;
}

export interface ShaclValidationResult {
  ok: boolean;
  status: number;
  statusText: string;
  contentType: string;
  body: string;
  duration: number;
  requestPayload: string;
}

export function deriveInfoEndpoint(endpointUrl: string): string | null {
  try {
    const url = new URL(endpointUrl);
    const path = url.pathname.replace(/\/+$/, '');
    if (path.endsWith('/info')) {
      url.pathname = path;
    } else if (path.endsWith('/validate')) {
      url.pathname = path.replace(/\/validate$/, '/info');
    } else {
      url.pathname = `${path}/info`;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export async function validateShacl(
  options: ShaclValidationOptions
): Promise<ShaclValidationResult> {
  const {
    endpoint,
    dataGraph,
    shapeGraphs,
    token,
    reportSyntax = DEFAULT_REPORT_SYNTAX,
    contentSyntax = DEFAULT_CONTENT_SYNTAX,
    ruleSyntax = DEFAULT_RULE_SYNTAX,
    clientTag,
    signal,
  } = options;

  const externalRules = shapeGraphs.map((ruleSet) => ({ ruleSet, ruleSyntax }));
  const payload = {
    contentToValidate: dataGraph,
    contentSyntax,
    reportSyntax,
    externalRules,
  };
  const requestPayload = JSON.stringify(payload, null, 2);

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json, application/trig;q=0.9, */*;q=0.1',
    'X-VA-Client': clientTag ? `${DEFAULT_CLIENT_ID} (${clientTag})` : DEFAULT_CLIENT_ID,
  };

  if (token) {
    headers.Authorization = token;
  }

  const started = performance.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: requestPayload,
    signal,
  });
  const duration = performance.now() - started;
  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    contentType,
    body,
    duration,
    requestPayload,
  };
}
