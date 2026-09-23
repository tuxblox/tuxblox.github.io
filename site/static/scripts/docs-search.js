// Copyright © TuxBlox Project 2026

// Docs search. The build uses stripMarkdown to write docs/search-index.json;
// include.js loads this file on the first search and runs searchDocs over
// that index. Scoring, snippets and ordering are the old server's search,
// unchanged, so results match what /docs/api/search returned.
(function (root) {
  function stripMarkdown(md) {
    return md
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_~`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildSnippet(text, query, radius = 70) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());

    if (idx === -1) {
      return text.length > radius * 2 ? `${text.slice(0, radius * 2).trim()}…` : text;
    }

    const start = Math.max(0, idx - radius);
    const end = Math.min(text.length, idx + query.length + radius);
    let snippet = text.slice(start, end).trim();
    if (start > 0) snippet = `…${snippet}`;
    if (end < text.length) snippet += '…';
    return snippet;
  }

  // entries: [{ title, section, urlPath, text }] in sidebar order, with text
  // already run through stripMarkdown.
  function searchDocs(entries, rawQuery, limit = 8) {
    const query = String(rawQuery).trim().toLowerCase();
    if (!query) return [];

    const scored = [];

    for (const entry of entries) {
      const titleIdx = entry.title.toLowerCase().indexOf(query);
      const bodyIdx = entry.text.toLowerCase().indexOf(query);
      // The section name is part of how a reader thinks about a page, so
      // "troubleshooting" should find the pages under Troubleshooting.
      const sectionIdx = entry.section.toLowerCase().indexOf(query);

      if (titleIdx === -1 && bodyIdx === -1 && sectionIdx === -1) continue;

      let score = 0;
      if (titleIdx === 0) score += 100;
      else if (titleIdx !== -1) score += 60;
      if (sectionIdx !== -1) score += 20;
      if (bodyIdx !== -1) score += 10;

      scored.push({
        title: entry.title,
        section: entry.section,
        urlPath: entry.urlPath,
        snippet: bodyIdx !== -1 ? buildSnippet(entry.text, query) : buildSnippet(entry.text, ''),
        score,
      });
    }

    scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    return scored.slice(0, limit).map(({ score, ...rest }) => rest);
  }

  const api = { stripMarkdown, buildSnippet, searchDocs };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.tuxbloxDocsSearch = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
