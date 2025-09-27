// SHACL validation client for EC endpoint.
// Added --info to fetch domain info (GET /<domain>/api/info).
//
// Usage:
//   node validate-shacl.js --data examples/Vtype-...ttl --shapes validation-shapes/va-scope-VehicleType-0.0.0.1.ttl
//   node validate-shacl.js --mode url --rawBase https://github.com/Interoperable-data/automate-va/raw/refs/heads/dev-lws/TTL --data ... --shapes validation-shapes/va-scope-VehicleType-0.0.0.1.ttl
//   node validate-shacl.js --info            (prints info JSON and exits)
//   node validate-shacl.js --info --domain era-shacl-test --data ... (info first, then validation)
// Options:
//   --info                Fetch domain info (no validation unless data+shapes also supplied)
//   --domain <d>          Defaults to era-shacl-test
//   --endpoint <url>      Defaults to https://www.itb.ec.europa.eu/shacl
//   --mode <inline|url>   Defaults inline
//   --rawBase <url>       Required if mode=url
//   --shapes file1.ttl[,file2.ttl]
//   --data data.ttl
//   --report text/turtle (or application/ld+json, etc.)
//   --contentSyntax text/turtle
//   --ruleSyntax text/turtle
//   --timeout <ms>
//   --dry-run
//   --prefix file.ttl[,more.ttl]   One or more Turtle files whose contents will be prepended as prefix block to data & shapes (forces inline if originally url mode)

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

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

const MODE = (opts.mode || 'inline').toLowerCase();
const RAW_BASE = opts.rawBase || '';
const DRY_RUN = !!opts['dry-run'];
const TIMEOUT = parseInt(opts.timeout || '30000', 10);
const OUTPUT_FILE_RAW = opts.out || opts.output || null; // original user-specified value (may include wrong extension)
let OUTPUT_FILE = OUTPUT_FILE_RAW; // will possibly be adjusted after content-type known

const CONTENT_SYNTAX = opts.contentSyntax || 'text/turtle';
const RULE_SYNTAX = opts.ruleSyntax || 'text/turtle';
const REPORT_SYNTAX = opts.report || 'text/turtle';

// If user requested turtle (default) and provided an output file without .ttl, normalise now.
if (OUTPUT_FILE && /turtle/i.test(REPORT_SYNTAX) && !/\.ttl$/i.test(OUTPUT_FILE)) {
  const forced = OUTPUT_FILE.replace(/\.[^.]+$/, '') + '.ttl';
  console.error(`Normalising output file extension to .ttl: '${OUTPUT_FILE}' -> '${forced}'`);
  OUTPUT_FILE = forced;
}

// Collect prefix files (optional)
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
function toUrl(rawBase, localPath) {
  return rawBase.replace(/\/+$/, '') + '/' + localPath.replace(/^[.\/]+/, '').replace(/\\/g, '/');
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
        headers: { Accept: 'application/json' },
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
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/turtle;q=0.9',
          'Content-Length': Buffer.byteLength(body),
        },
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
  // Remove BOM, normalise newlines to \n, trim trailing spaces on each line
  return str
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, ''); // drop trailing blank lines
}

function compactTurtle(str) {
  // Collapse multiple blank lines to a single blank line
  return normalizeTurtle(str).replace(/\n{2,}/g, '\n\n');
}

function prepareInlineContent(filePath, doCompact) {
  const raw = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
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
        headers: { Accept: acceptHdr },
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

const COMPACT = !!opts.compact; // --compact optional flag

(async () => {
  // Handle --info
  if (opts.info) {
    const infoUrl = ENDPOINT_BASE + INFO_PATH;
    try {
      const info = await getJson(infoUrl);
      console.log(JSON.stringify({ endpoint: infoUrl, ...info }, null, 2));
    } catch (e) {
      console.error('Info request error:', e.message);
      process.exit(2);
    }
    // If only info requested (no validation args), exit
    if (!opts.data || !opts.shapes) return;
  }

  if (!opts.data || !opts.shapes) {
    console.error('Validation requires --data and --shapes.');
    process.exit(1);
  }
  if (MODE === 'url' && !RAW_BASE) {
    console.error('In --mode url you must pass --rawBase.');
    process.exit(1);
  }

  const SHAPE_FILES = opts.shapes
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  let contentToValidate, embeddingMethod;

  let effectiveMode = MODE;
  if (PREFIX_BLOCK && MODE === 'url') {
    console.error(
      'Prefix block provided; switching from url mode to inline (embedding modified content).'
    );
    effectiveMode = 'inline';
  }

  if (effectiveMode === 'url') {
    contentToValidate = toUrl(RAW_BASE, opts.data);
    embeddingMethod = 'URL';
  } else {
    // inline: either originally inline or forced inline due to prefix usage
    if (MODE === 'url') {
      // Need to fetch remote data when original mode was url
      const remoteDataUrl = toUrl(RAW_BASE, opts.data);
      try {
        const fetched = await fetchText(remoteDataUrl);
        const norm = COMPACT ? compactTurtle(fetched) : normalizeTurtle(fetched);
        contentToValidate = PREFIX_BLOCK ? PREFIX_BLOCK + norm : norm;
      } catch (e) {
        console.error('Failed fetching remote data for inline embedding:', e.message);
        process.exit(6);
      }
    } else {
      const base = prepareInlineContent(opts.data, COMPACT);
      contentToValidate = PREFIX_BLOCK ? PREFIX_BLOCK + base : base;
    }
    embeddingMethod = null; // inline
  }

  const externalRules = await (async () => {
    const out = [];
    for (const f of SHAPE_FILES) {
      if (effectiveMode === 'url') {
        // If shape file exists locally, embed inline even in url mode (mixed mode support)
        if (fs.existsSync(f)) {
          const baseShape = prepareInlineContent(f, COMPACT);
          out.push({
            ruleSet: PREFIX_BLOCK ? PREFIX_BLOCK + baseShape : baseShape,
            ruleSyntax: RULE_SYNTAX,
          });
        } else {
          out.push({
            ruleSet: toUrl(RAW_BASE, f),
            embeddingMethod: 'URL',
            ruleSyntax: RULE_SYNTAX,
          });
        }
      } else {
        if (MODE === 'url') {
          // fetch remote shape file
          const remoteShapeUrl = toUrl(RAW_BASE, f);
          try {
            const fetchedShape = await fetchText(remoteShapeUrl);
            const normShape = COMPACT ? compactTurtle(fetchedShape) : normalizeTurtle(fetchedShape);
            out.push({
              ruleSet: PREFIX_BLOCK ? PREFIX_BLOCK + normShape : normShape,
              ruleSyntax: RULE_SYNTAX,
            });
          } catch (e) {
            console.error(
              'Failed fetching remote shape for inline embedding:',
              remoteShapeUrl,
              e.message
            );
            process.exit(7);
          }
        } else {
          const baseShape = prepareInlineContent(f, COMPACT);
          out.push({
            ruleSet: PREFIX_BLOCK ? PREFIX_BLOCK + baseShape : baseShape,
            ruleSyntax: RULE_SYNTAX,
          });
        }
      }
    }
    return out;
  })();

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
    if (!OUTPUT_FILE) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      let outStr;
      if (result.json) outStr = JSON.stringify(result.json, null, 2);
      else if (result.raw) outStr = result.raw;
      else outStr = JSON.stringify(result, null, 2);
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
