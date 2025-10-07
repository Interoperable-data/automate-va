/**
 * Turtle bundler utility functions used by the testbed SHACL client.
 *
 * The helpers in this file normalise `.ttl` content, merge multiple files while
 * preserving canonical prefix definitions, and surface prefix conflicts early.
 * They are intentionally dependency-free so that the tooling can run in
 * restricted Node.js environments.
 */

const fs = require('fs');
const path = require('path');

const PREFIX_PATTERN = /^\s*(?:@prefix|PREFIX)\s+([A-Za-z][\w-]*)?:\s*<([^>]+)>\s*\.\s*$/i;
const BASE_PATTERN = /^\s*(?:@base|BASE)\s+<([^>]+)>\s*\.\s*$/i;

/**
 * Normalise Turtle content by:
 * - removing byte-order marks
 * - converting CRLF to LF
 * - trimming trailing whitespace on each line
 * - ensuring the result does not end with blank lines
 *
 * @param {string} str Arbitrary Turtle content.
 * @returns {string} Normalised Turtle string.
 */
function normalizeTurtle(str) {
  return String(str || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

/**
 * Compact a Turtle string by normalising it and collapsing runs of blank lines
 * down to a single blank line. Useful when inlining content in SHACL payloads.
 *
 * @param {string} str Turtle source text.
 * @returns {string} Compact Turtle string with limited vertical whitespace.
 */
function compactTurtle(str) {
  return normalizeTurtle(str).replace(/\n{2,}/g, '\n\n');
}

/**
 * Resolve an absolute path for a file relative to the provided working
 * directory (defaults to the current process cwd).
 *
 * @param {string} filePath Path to resolve.
 * @param {string} [cwd=process.cwd()] Base directory for resolution.
 * @returns {string} Absolute path.
 */
function resolvePath(filePath, cwd = process.cwd()) {
  if (!filePath) throw new Error('Expected a file path string');
  return path.resolve(cwd, filePath);
}

/**
 * Read a file as UTF-8 text after resolving it with {@link resolvePath}.
 *
 * @param {string} filePath Path to the file.
 * @param {string} [cwd=process.cwd()] Base directory for resolution.
 * @returns {string} UTF-8 file contents.
 */
function readUtf8(filePath, cwd = process.cwd()) {
  return fs.readFileSync(resolvePath(filePath, cwd), 'utf8');
}

/**
 * Track a prefix definition while enforcing that canonical entries (from
 * prefix source files) win over conflicting definitions coming from other
 * Turtle inputs.
 *
 * @param {string[]} prefixOrder Ordered list of prefix labels.
 * @param {Map<string, object>} prefixMap Map of prefix label to definition.
 * @param {string} prefixLabel Prefix label (without the trailing colon).
 * @param {string} iri Fully-qualified IRI.
 * @param {string} source Source file or snippet label.
 * @param {number} lineNo 1-based line number inside the source.
 * @param {boolean} [isPrefixSource=false] True when the prefix comes from a canonical prefix file.
 */
function addPrefix(
  prefixOrder,
  prefixMap,
  prefixLabel,
  iri,
  source,
  lineNo,
  isPrefixSource = false
) {
  const key = prefixLabel ?? '';
  const existing = prefixMap.get(key);
  if (existing) {
    if (existing.iri === iri) return;
    const preferred = existing.isPrefixSource ? existing : { iri, source, lineNo, isPrefixSource };
    const conflicting = existing.isPrefixSource
      ? { iri, source, lineNo, isPrefixSource }
      : existing;
    const details = [
      `Conflicting prefix '${key || ':'}' detected.`,
      `Canonical definition expected from prefix file '${preferred.source}'.`,
      `Conflicting declaration found in '${conflicting.source}' (line ${conflicting.lineNo}).`,
      'Please align the Turtle files before bundling.',
    ].join(' ');
    throw new Error(details);
  }
  prefixOrder.push(key);
  prefixMap.set(key, { iri, source, lineNo, isPrefixSource: !!isPrefixSource });
}

/**
 * Track an @base statement while ensuring conflicting base declarations are
 * surfaced as errors.
 *
 * @param {string[]} baseOrder Ordered list of base IRIs.
 * @param {Map<string, object>} baseMap Map of IRI to definition metadata.
 * @param {string} iri Base IRI.
 * @param {string} source Source file or snippet label.
 * @param {number} lineNo 1-based line number inside the source.
 */
function addBase(baseOrder, baseMap, iri, source, lineNo) {
  const existing = baseMap.get(iri);
  if (existing) return;
  if (baseMap.size > 0) {
    const [{ iri: currentIri, source: currentSource }] = Array.from(baseMap.values());
    if (currentIri !== iri) {
      throw new Error(
        `Conflicting @base declarations detected: '${currentIri}' from '${currentSource}' vs '${iri}' from '${source}'.`
      );
    }
    return;
  }
  baseOrder.push(iri);
  baseMap.set(iri, { iri, source, lineNo });
}

/**
 * Slice the incoming Turtle into prefix/base declarations and body lines for
 * later reassembly. Canonical prefix entries are always preferred over
 * conflicting definitions.
 *
 * @param {object} params Function parameters.
 * @param {string} params.rawContent Raw Turtle text.
 * @param {string} params.source Source file path (used for error messages).
 * @param {string[]} params.prefixOrder Ordered list of prefixes encountered so far.
 * @param {Map<string, object>} params.prefixMap Prefix definitions keyed by label.
 * @param {string[]} params.baseOrder Ordered list of base IRIs.
 * @param {Map<string, object>} params.baseMap Base definitions keyed by IRI.
 * @param {string[]} params.bodyChunks Collected Turtle bodies.
 * @param {boolean} [params.isPrefixSource=false] Flag indicating canonical prefix content.
 */
function collectContent({
  rawContent,
  source,
  prefixOrder,
  prefixMap,
  baseOrder,
  baseMap,
  bodyChunks,
  isPrefixSource = false,
}) {
  if (!rawContent) return;
  const lines = normalizeTurtle(rawContent).split('\n');
  const bodyLines = [];

  lines.forEach((line, idx) => {
    const prefixMatch = line.match(PREFIX_PATTERN);
    if (prefixMatch) {
      const prefixLabel = prefixMatch[1] || '';
      const iri = prefixMatch[2];
      addPrefix(prefixOrder, prefixMap, prefixLabel, iri, source, idx + 1, isPrefixSource);
      return;
    }
    const baseMatch = line.match(BASE_PATTERN);
    if (baseMatch) {
      const iri = baseMatch[1];
      addBase(baseOrder, baseMap, iri, source, idx + 1);
      return;
    }
    bodyLines.push(line);
  });

  const body = bodyLines.join('\n').trim();
  if (body) bodyChunks.push(body);
}

/**
 * Reconstruct prefix declarations in the original encounter order.
 *
 * @param {string[]} prefixOrder Ordered list of prefix labels.
 * @param {Map<string, object>} prefixMap Map containing resolved IRIs per label.
 * @returns {string[]} Array of `@prefix` lines.
 */
function emitPrefixLines(prefixOrder, prefixMap) {
  return prefixOrder.map((key) => {
    const { iri } = prefixMap.get(key);
    const label = key ? `${key}:` : ':';
    return `@prefix ${label} <${iri}> .`;
  });
}

/**
 * Reconstruct `@base` declarations in the encounter order.
 *
 * @param {string[]} baseOrder Ordered list of base IRIs.
 * @returns {string[]} Array of `@base` lines.
 */
function emitBaseLines(baseOrder) {
  return baseOrder.map((iri) => `@base <${iri}> .`);
}

/**
 * Guarantee that the provided string ends with a newline. Useful before
 * writing files so the OS-native editors behave consistently.
 *
 * @param {string} str Arbitrary string content.
 * @returns {string} The same content ending with `\n`.
 */
function ensureFinalNewline(str) {
  return str.endsWith('\n') ? str : `${str}\n`;
}

/**
 * Bundle a collection of Turtle files (and/or inline snippets) with optional
 * canonical prefix sources. Prefix conflicts raise errors early to avoid
 * sending inconsistent payloads to the SHACL service.
 *
 * @param {object} options Bundle options.
 * @param {string[]} options.files Turtle file paths to include.
 * @param {string} [options.cwd=process.cwd()] Working directory for path resolution.
 * @param {boolean} [options.compact=false] When true, collapse extra blank lines.
 * @param {string[]} [options.prefixFiles=[]] Canonical prefix sources (highest priority).
 * @param {Array<string|{content:string,source?:string,includeBody?:boolean,isPrefixSource?:boolean}>} [options.snippets=[]]
 *        Inline Turtle fragments to merge.
 * @param {string|null} [options.writeFile=null] Optional output path to write bundled Turtle.
 * @param {string|null} [options.headerComment=null] Optional comment inserted ahead of prefix lines.
 * @returns {{content: string, prefixCount: number, baseCount: number, bodyCount: number}}
 *          The bundled Turtle content and some stats for logging.
 */
function bundleTurtleFiles({
  files,
  cwd = process.cwd(),
  compact = false,
  prefixFiles = [],
  snippets = [],
  writeFile = null,
  headerComment = null,
}) {
  if (!Array.isArray(files)) {
    throw new TypeError('bundleTurtleFiles requires an array of Turtle file paths.');
  }
  if (!Array.isArray(prefixFiles)) {
    throw new TypeError('prefixFiles must be an array when provided.');
  }
  if (!Array.isArray(snippets)) {
    throw new TypeError('snippets must be an array when provided.');
  }
  if (!files.length && !prefixFiles.length && !snippets.length) {
    throw new Error('At least one Turtle file, prefix file, or raw snippet must be provided.');
  }

  const prefixOrder = [];
  const prefixMap = new Map();
  const baseOrder = [];
  const baseMap = new Map();
  const bodyChunks = [];

  const processFileList = (fileList, isPrefix = false) => {
    fileList.forEach((filePath) => {
      const resolved = resolvePath(filePath, cwd);
      const rawContent = readUtf8(resolved, cwd);
      collectContent({
        rawContent,
        source: resolved,
        prefixOrder,
        prefixMap,
        baseOrder,
        baseMap,
        bodyChunks: isPrefix ? [] : bodyChunks,
        isPrefixSource: isPrefix,
      });
    });
  };

  processFileList(prefixFiles, true);
  processFileList(files, false);

  const processSnippets = (list) => {
    list.forEach((entry, idx) => {
      if (entry == null) return;
      let content;
      let source;
      let includeBody = true;
      if (typeof entry === 'string') {
        content = entry;
        source = `snippet#${idx + 1}`;
      } else if (typeof entry === 'object') {
        ({ content, source } = entry);
        if (Object.prototype.hasOwnProperty.call(entry, 'includeBody')) {
          includeBody = Boolean(entry.includeBody);
        }
      } else {
        throw new TypeError('Each snippet must be a string or an object with a content property.');
      }
      if (typeof content !== 'string') {
        throw new TypeError('Snippet content must be a string.');
      }
      collectContent({
        rawContent: content,
        source: source || `snippet#${idx + 1}`,
        prefixOrder,
        prefixMap,
        baseOrder,
        baseMap,
        bodyChunks: includeBody ? bodyChunks : [],
        isPrefixSource: !!entry.isPrefixSource,
      });
    });
  };

  processSnippets(snippets);

  const baseLines = emitBaseLines(baseOrder);
  const prefixLines = emitPrefixLines(prefixOrder, prefixMap);
  const header = [headerComment, ...baseLines, ...prefixLines].filter(Boolean).join('\n');

  const body = bodyChunks.join('\n\n');
  const combined = [header, body].filter((section) => section && section.trim()).join('\n\n');
  const normalized = compact ? compactTurtle(combined) : normalizeTurtle(combined);
  const finalContent = ensureFinalNewline(normalized);

  if (writeFile) {
    fs.writeFileSync(resolvePath(writeFile, cwd), finalContent, 'utf8');
  }

  return {
    content: finalContent,
    prefixCount: prefixLines.length,
    baseCount: baseLines.length,
    bodyCount: bodyChunks.length,
  };
}

module.exports = {
  bundleTurtleFiles,
  normalizeTurtle,
  compactTurtle,
  readUtf8,
};
