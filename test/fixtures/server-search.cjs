// The old server's docs search (modules/docs-server.js, as of 2026-09-23),
// kept as the reference the browser port is tested against. Copied verbatim
// except that searchDocs takes each page's Markdown from page.raw instead of
// reading it from disk, and returns full /docs URLs as the endpoint did.

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

function searchDocs(tree, rawQuery, limit = 8) {
    const query = rawQuery.trim().toLowerCase();
    if (!query) return [];

    const scored = [];

    for (const section of tree) {
        for (const page of section.pages) {
            const raw = page.raw;

            const plainText = stripMarkdown(raw);
            const titleLower = page.title.toLowerCase();
            const titleIdx = titleLower.indexOf(query);
            const bodyIdx = plainText.toLowerCase().indexOf(query);
            const sectionIdx = section.title.toLowerCase().indexOf(query);

            if (titleIdx === -1 && bodyIdx === -1 && sectionIdx === -1) continue;

            let score = 0;
            if (titleIdx === 0) score += 100;
            else if (titleIdx !== -1) score += 60;
            if (sectionIdx !== -1) score += 20;
            if (bodyIdx !== -1) score += 10;

            scored.push({
                title: page.title,
                section: section.title,
                urlPath: `/docs${page.urlPath}`,
                snippet: bodyIdx !== -1 ? buildSnippet(plainText, query) : buildSnippet(plainText, ''),
                score,
            });
        }
    }

    scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    return scored.slice(0, limit).map(({ score, ...rest }) => rest);
}

module.exports = { stripMarkdown, buildSnippet, searchDocs };
