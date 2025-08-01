// For browser: Comunica is loaded globally as Comunica.QueryEngine
// For Node: require Comunica if not present
let QueryEngine;
if (typeof window === 'undefined') {
  // Node.js
  QueryEngine = require('@comunica/query-sparql').QueryEngine;
} else {
  // Browser
  QueryEngine = Comunica.QueryEngine;
}

// Helper: Convert a Comunica binding to a plain JS object
function bindingToJSON(binding, headerKey) {
  var o = {};
  binding.forEach((value, key) => {
    o[key.value] = value.value; // ALWAYS a string
  });
  // comunica recommendation
  // o[binding.get('s').value] = binding.get('o').value;
  if (headerKey) o.header = o[headerKey];
  return o;
}

// Helper: Extract and replace URI prefixes, returning {prefixes, results}
function applyPrefixes(results) {
  const prefixMap = {};
  let prefixCount = 1;

  // Helper to process a value and replace with prefix if needed
  function processValue(val) {
    if (typeof val === 'string' && val.includes('#')) {
      const [base, local] = val.split('#');
      const prefixUri = base + '#';
      let prefix = Object.entries(prefixMap).find(([k, v]) => v === prefixUri)?.[0];
      if (!prefix) {
        prefix = `p${prefixCount++}:`;
        prefixMap[prefix] = prefixUri;
      }
      return prefix + local;
    }
    return val;
  }

  // Process all results
  const processed = results.map((row) => {
    const newRow = {};
    for (const key in row) {
      newRow[key] = processValue(row[key]);
    }
    return newRow;
  });

  return { prefixes: prefixMap, results: processed };
}

// Helper: Format prefixes as HTML
function prefixesToHtml(prefixes) {
  if (!prefixes || !Object.keys(prefixes).length) return '';
  let html = '<div style="margin-bottom:0.5em;"><strong>Prefixes:</strong><br>';
  for (const [prefix, uri] of Object.entries(prefixes)) {
    html += `${prefix} <span style="color:#888">${uri}</span><br>`;
  }
  html += '</div>';
  return html;
}

// Helper: Format results as HTML table (for browser), with prefixes
function resultsToTable(results) {
  if (!results.length) return '(No results)';
  const { prefixes, results: processed } = applyPrefixes(results);
  const keys = Array.from(new Set(processed.flatMap((obj) => Object.keys(obj))));
  let html = prefixesToHtml(prefixes);
  html += '<table border="1" style="border-collapse:collapse;"><thead><tr>';
  for (const key of keys) html += `<th>${key}</th>`;
  html += '</tr></thead><tbody>';
  for (const row of processed) {
    html += '<tr>';
    for (const key of keys) html += `<td>${row[key] !== undefined ? row[key] : ''}</td>`;
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

// Main query function
async function runSparqlQuery({ endpoint, query, username, password }) {
  const engine = new QueryEngine();
  const context = { sources: [endpoint] };
  if (username && password) {
    // Comunica Basic Auth (see docs)
    context['httpAuth'] = username + ':' + password;
  }
  const bindingsStream = await engine.queryBindings(query, context);
  const results = [];
  return new Promise((resolve, reject) => {
    bindingsStream.on('data', (binding) => results.push(bindingToJSON(binding)));
    bindingsStream.on('end', () => resolve(results));
    bindingsStream.on('error', reject);
  });
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runSparqlQuery, resultsToTable };
} else {
  window.runSparqlQuery = runSparqlQuery;
  window.resultsToTable = resultsToTable;
}
