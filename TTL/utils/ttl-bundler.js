const fs = require('fs');
const path = require('path');

const PREFIX_PATTERN = /^\s*(?:@prefix|PREFIX)\s+([A-Za-z][\w-]*)?:\s*<([^>]+)>\s*\.\s*$/i;
const BASE_PATTERN = /^\s*(?:@base|BASE)\s+<([^>]+)>\s*\.\s*$/i;

function normalizeTurtle(str) {
  return String(str || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

function compactTurtle(str) {
  return normalizeTurtle(str).replace(/\n{2,}/g, '\n\n');
}

function resolvePath(filePath, cwd = process.cwd()) {
  if (!filePath) throw new Error('Expected a file path string');
  return path.resolve(cwd, filePath);
}

function readUtf8(filePath, cwd = process.cwd()) {
  return fs.readFileSync(resolvePath(filePath, cwd), 'utf8');
}

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

function emitPrefixLines(prefixOrder, prefixMap) {
  return prefixOrder.map((key) => {
    const { iri } = prefixMap.get(key);
    const label = key ? `${key}:` : ':';
    return `@prefix ${label} <${iri}> .`;
  });
}

function emitBaseLines(baseOrder) {
  return baseOrder.map((iri) => `@base <${iri}> .`);
}

function ensureFinalNewline(str) {
  return str.endsWith('\n') ? str : `${str}\n`;
}

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
