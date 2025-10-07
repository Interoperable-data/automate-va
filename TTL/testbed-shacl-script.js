// SHACL validation client for EC endpoint.
// Use the following arguments:
//   --remoteBase <url>              Base URL to resolve relative remote resources (optional if all remotes absolute)
//   --localData <path>              Local data Turtle file (exactly one of localData / remoteData)
//   --remoteData <rel|abs>          Remote data Turtle (exactly one of localData / remoteData)
//   --localShape <path[,more]>      Local shape Turtle file(s) (at least one shape source required)
//   --remoteShape <rel|abs[,more]>  Remote shape Turtle file(s)
// Other options:
//   --info --domain <d> --endpoint <url>
//   --report <mime> --contentSyntax <mime> --ruleSyntax <mime>
//   --timeout <ms> --dry-run --prefix file.ttl[,more] --out <file> --compact
//   --clientHeader <name>           Custom identification header name (default X-VA-Client)
//   --clientTag <tag>               Optional deployment tag appended to the User-Agent value
// Behaviour:
//   * Exactly one of --localData / --remoteData must be supplied.
//   * At least one of --localShape / --remoteShape must be supplied.
//   * Relative remoteData / remoteShape require --remoteBase.
//   * When --prefix is used every inlined resource (local always, remote when prefix present) is prefixed.
//   * Without prefix: remote data is sent by URL (embeddingMethod='URL'), remote shapes likewise per-rule.
//   * With prefix: remote resources are fetched and inlined (forces inline embedding) to allow prefix injection.
//   * Each request logs the resolved User-Agent header value before response handling.
// Exit codes: 1 argument error, 2 info error, 3 validation HTTP>=400, 4 runtime error, 5 prefix read error, 6 remote data fetch error, 7 remote shape fetch error.

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

function readPackageVersion() {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const pkg = require('../package.json');
    return pkg && pkg.version ? String(pkg.version) : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const k = args[i].substring(2);
      const v = i + 1 < args.length && !args[i + 1].startsWith('--') ? args[++i] : true;
      opts[k] = v;
    }
  }
  return opts;
}

const opts = parseArgs();

const DOMAIN = opts.domain || 'any';
const ENDPOINT_BASE = (opts.endpoint || 'https://www.itb.ec.europa.eu/shacl').replace(/\/+$/, '');
const INFO_PATH = `/${DOMAIN}/api/info`;
const VALIDATE_PATH = `/${DOMAIN}/api/validate`;

const DRY_RUN = !!opts['dry-run'];
const TIMEOUT = parseInt(opts.timeout || '30000', 10);
const OUTPUT_FILE_RAW = opts.out || opts.output || null;
let OUTPUT_FILE = OUTPUT_FILE_RAW;

const CONTENT_SYNTAX = opts.contentSyntax || 'text/turtle';
const RULE_SYNTAX = opts.ruleSyntax || 'text/turtle';
const REPORT_SYNTAX = opts.report || 'text/turtle';

const PACKAGE_VERSION = readPackageVersion();
const DEFAULT_CLIENT_ID = `automate-va-shacl-script/${PACKAGE_VERSION}`;
const CLIENT_HEADER_NAME = opts.clientHeader || 'X-VA-Client';
const CLIENT_TAG = opts.clientTag || opts.clientId || process.env.VA_CLIENT_TAG || '';
const CLIENT_HEADER_VALUE = CLIENT_TAG ? `${DEFAULT_CLIENT_ID} (${CLIENT_TAG})` : DEFAULT_CLIENT_ID;

function withClientHeaders(baseHeaders = {}) {
  return {
    ...baseHeaders,
    [CLIENT_HEADER_NAME]: CLIENT_HEADER_VALUE,
    'User-Agent': CLIENT_HEADER_VALUE,
  };
}

// New model flags only
const REMOTE_BASE = opts.remoteBase || null;
const LOCAL_DATA = opts.localData || null;
const REMOTE_DATA = opts.remoteData || null;
const LOCAL_SHAPE = opts.localShape || null; // comma separated
const REMOTE_SHAPE = opts.remoteShape || null; // comma separated

function isAbsoluteUrl(u) {
  return /^https?:\/\//i.test(u);
}

// Normalise output extension for turtle
if (OUTPUT_FILE && /turtle/i.test(REPORT_SYNTAX) && !/\.ttl$/i.test(OUTPUT_FILE)) {
  const forced = OUTPUT_FILE.replace(/\.[^.]+$/, '') + '.ttl';
  console.error(`Normalising output file extension to .ttl: '${OUTPUT_FILE}' -> '${forced}'`);
  OUTPUT_FILE = forced;
}

// Prefix files
const PREFIX_FILES = (opts.prefix || opts.prefixes || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
let PREFIX_BLOCK = '';
if (PREFIX_FILES.length) {
  try {
    PREFIX_BLOCK = PREFIX_FILES.map((f) => readUtf8(f).trim()).join('\n') + '\n\n';
    console.error(
      `Loaded ${PREFIX_FILES.length} prefix file(s) totalling ${PREFIX_BLOCK.length} chars.`
    );
  } catch (e) {
    console.error('Error reading prefix file(s):', e.message);
    process.exit(5);
  }
}

function readUtf8(p) {
  return fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');
}
function toUrl(base, rel) {
  return base.replace(/\/+$/, '') + '/' + rel.replace(/^[.\/]+/, '').replace(/\\/g, '/');
}

function getJson(urlStr) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request(
      {
        method: 'GET',
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        headers: withClientHeaders({ Accept: 'application/json' }),
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (!body.trim()) return resolve({ status: res.statusCode, empty: true });
          try {
            resolve({ status: res.statusCode, json: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => req.destroy(new Error('Timeout')));
    req.end();
  });
}

function postJson(baseUrl, pathName, payload) {
  return new Promise((resolve, reject) => {
    const u = new URL(baseUrl);
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        method: 'POST',
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname.replace(/\/$/, '') + pathName,
        headers: withClientHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json, text/turtle;q=0.9',
          'Content-Length': Buffer.byteLength(body),
        }),
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          const ct = res.headers['content-type'] || '';
          if (/application\/json/i.test(ct)) {
            try {
              return resolve({
                status: res.statusCode,
                contentType: ct,
                json: JSON.parse(data),
                raw: data,
              });
            } catch {
              return resolve({ status: res.statusCode, contentType: ct, raw: data });
            }
          }
          resolve({ status: res.statusCode, contentType: ct, raw: data });
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => req.destroy(new Error('Timeout')));
    req.write(body);
    req.end();
  });
}

function normalizeTurtle(str) {
  return str
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}
function compactTurtle(str) {
  return normalizeTurtle(str).replace(/\n{2,}/g, '\n\n');
}
function prepareInlineContent(filePath, doCompact) {
  const raw = readUtf8(filePath);
  return doCompact ? compactTurtle(raw) : normalizeTurtle(raw);
}
function fetchText(urlStr, acceptHdr = 'text/turtle, text/plain;q=0.9, */*;q=0.1') {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request(
      {
        method: 'GET',
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        headers: withClientHeaders({ Accept: acceptHdr }),
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve(body));
      }
    );
    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => req.destroy(new Error('Timeout fetching ' + urlStr)));
    req.end();
  });
}

const COMPACT = !!opts.compact;

(async () => {
  // Info request
  if (opts.info) {
    const infoUrl = ENDPOINT_BASE + INFO_PATH;
    try {
      const info = await getJson(infoUrl);
      console.log(JSON.stringify({ endpoint: infoUrl, ...info }, null, 2));
    } catch (e) {
      console.error('Info request error:', e.message);
      process.exit(2);
    }
    const hasDataArgs = (LOCAL_DATA || REMOTE_DATA) && (LOCAL_SHAPE || REMOTE_SHAPE);
    if (!hasDataArgs) return; // only info
  }

  // Argument validation (new model only)
  if ((LOCAL_DATA && REMOTE_DATA) || (!LOCAL_DATA && !REMOTE_DATA)) {
    console.error('Exactly one of --localData or --remoteData must be provided.');
    process.exit(1);
  }
  if (!LOCAL_SHAPE && !REMOTE_SHAPE) {
    console.error('At least one of --localShape or --remoteShape must be provided.');
    process.exit(1);
  }

  const localShapes = LOCAL_SHAPE
    ? LOCAL_SHAPE.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const remoteShapes = REMOTE_SHAPE
    ? REMOTE_SHAPE.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Data resolution
  let contentToValidate;
  let embeddingMethod = null; // only set when using URL for main data
  if (LOCAL_DATA) {
    const base = prepareInlineContent(LOCAL_DATA, COMPACT);
    contentToValidate = PREFIX_BLOCK ? PREFIX_BLOCK + base : base;
  } else {
    // remote data
    const dataUrl = isAbsoluteUrl(REMOTE_DATA)
      ? REMOTE_DATA
      : REMOTE_BASE
        ? toUrl(REMOTE_BASE, REMOTE_DATA)
        : null;
    if (!dataUrl) {
      console.error('--remoteBase is required when --remoteData is relative.');
      process.exit(1);
    }
    if (PREFIX_BLOCK) {
      try {
        const fetched = await fetchText(dataUrl);
        const norm = COMPACT ? compactTurtle(fetched) : normalizeTurtle(fetched);
        contentToValidate = PREFIX_BLOCK + norm;
      } catch (e) {
        console.error('Failed fetching remote data for inline embedding:', e.message);
        process.exit(6);
      }
    } else {
      contentToValidate = dataUrl;
      embeddingMethod = 'URL';
    }
  }

  // Shapes resolution
  const externalRules = [];
  for (const ls of localShapes) {
    const baseShape = prepareInlineContent(ls, COMPACT);
    externalRules.push({
      ruleSet: PREFIX_BLOCK ? PREFIX_BLOCK + baseShape : baseShape,
      ruleSyntax: RULE_SYNTAX,
    });
  }
  for (const rs of remoteShapes) {
    const fullUrl = isAbsoluteUrl(rs) ? rs : REMOTE_BASE ? toUrl(REMOTE_BASE, rs) : null;
    if (!fullUrl) {
      console.error('--remoteBase is required when --remoteShape is relative.');
      process.exit(1);
    }
    if (PREFIX_BLOCK) {
      try {
        const fetchedShape = await fetchText(fullUrl);
        const normShape = COMPACT ? compactTurtle(fetchedShape) : normalizeTurtle(fetchedShape);
        externalRules.push({ ruleSet: PREFIX_BLOCK + normShape, ruleSyntax: RULE_SYNTAX });
      } catch (e) {
        console.error('Failed fetching remote shape for inline embedding:', fullUrl, e.message);
        process.exit(7);
      }
    } else {
      externalRules.push({ ruleSet: fullUrl, embeddingMethod: 'URL', ruleSyntax: RULE_SYNTAX });
    }
  }

  const payload = {
    contentToValidate,
    contentSyntax: CONTENT_SYNTAX,
    reportSyntax: REPORT_SYNTAX,
    externalRules,
  };
  if (embeddingMethod) payload.embeddingMethod = embeddingMethod;

  if (DRY_RUN) {
    const dryObj = { endpoint: ENDPOINT_BASE + VALIDATE_PATH, payload };
    const dryStr = JSON.stringify(dryObj, null, 2);
    if (!OUTPUT_FILE) console.log(dryStr);
    else {
      try {
        fs.writeFileSync(OUTPUT_FILE, dryStr, 'utf8');
        console.error('Dry-run payload written to', OUTPUT_FILE);
      } catch (e) {
        console.error('Failed writing --out file:', e.message);
      }
    }
    return;
  }

  try {
    const result = await postJson(ENDPOINT_BASE, VALIDATE_PATH, payload);
    if (
      OUTPUT_FILE &&
      result.contentType &&
      /text\/turtle/i.test(result.contentType) &&
      !/\.ttl$/i.test(OUTPUT_FILE)
    ) {
      const adj = OUTPUT_FILE.replace(/\.[^.]+$/, '') + '.ttl';
      console.error(
        `Content-Type is text/turtle; writing to '${adj}' instead of '${OUTPUT_FILE}'.`
      );
      OUTPUT_FILE = adj;
    }
    console.error(`Request with "User-Agent: ${CLIENT_HEADER_VALUE}"`);
    if (!OUTPUT_FILE) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const outStr = result.json
        ? JSON.stringify(result.json, null, 2)
        : result.raw || JSON.stringify(result, null, 2);
      try {
        fs.writeFileSync(OUTPUT_FILE, outStr, 'utf8');
        console.error('Result written to', OUTPUT_FILE);
      } catch (e) {
        console.error('Failed writing --out file:', e.message);
      }
    }
    if (result.status >= 400) process.exit(3);
  } catch (e) {
    console.error('Validation error:', e.message);
    if (e.stack) console.error(e.stack);
    process.exit(4);
  }
})();
