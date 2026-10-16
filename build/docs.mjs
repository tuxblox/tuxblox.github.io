// The docs tree and page rendering for the static build, ported from the old
// server's modules/docs-server.js so pages come out byte for byte the same.
// Where this is stricter -- it fails where the server skipped -- the comment
// says so: a build can stop and leave the live site alone, which a server
// answering requests could not.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const { renderIcon } = createRequire(import.meta.url)('./icons.js');

export const SITE_ORIGIN = 'https://tuxblox.net';
export const URL_PREFIX = '/docs';
const INFO_NAME = 'docs-info.json';

// Slugs that would land on a file the build writes itself.
const RESERVED_PAGE_SLUGS = new Set(['index']);
const RESERVED_SECTION_SLUGS = new Set(['index.html', 'search-index.json']);
// A subcategory is a directory that also gets an index.html, so it is barred
// from both lists.
const RESERVED_GROUP_SLUGS = new Set([...RESERVED_PAGE_SLUGS, ...RESERVED_SECTION_SLUGS]);

export class DocsError extends Error {}

export function getFullUrl(urlPath) {
    return urlPath.startsWith(URL_PREFIX) ? urlPath : `${URL_PREFIX}${urlPath}`;
}

// Fallback display name for an entry docs-info.json names but does not title.
export function titleize(name) {
    return name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

export function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function isSafeSlug(slug) {
    return typeof slug === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug) && !slug.includes('..');
}

function sortKey(a, b) {
    const sa = Number.isFinite(a.sort) ? a.sort : Number.MAX_SAFE_INTEGER;
    const sb = Number.isFinite(b.sort) ? b.sort : Number.MAX_SAFE_INTEGER;
    return sa - sb || a.title.localeCompare(b.title);
}

// One page of a section, or of a subcategory inside it. A page nested in a
// subcategory carries no icon: only rows directly under a category get one.
function buildPage(docsDir, section, group, pageSlug, pageRaw) {
    const where = group ? `${section.slug}/${group.slug}/${pageSlug}` : `${section.slug}/${pageSlug}`;
    if (!isSafeSlug(pageSlug)) throw new DocsError(`unusable page slug: ${where}`);
    if (RESERVED_PAGE_SLUGS.has(pageSlug)) throw new DocsError(`reserved page slug: ${where}`);
    if (!pageRaw || typeof pageRaw !== 'object') throw new DocsError(`page ${where} is not an object`);

    const fsPath = path.join(docsDir, `${where}.md`);
    if (!fs.existsSync(fsPath)) {
        throw new DocsError(`${INFO_NAME} names ${where} but ${where}.md does not exist`);
    }

    return {
        kind: 'page',
        slug: pageSlug,
        title: pageRaw.Title || titleize(pageSlug),
        sort: Number(pageRaw.Sort),
        icon: group ? undefined : pageRaw.Icon,
        urlPath: `/${where}`,
        fsPath,
        sectionTitle: section.title,
        groupTitle: group ? group.title : null,
    };
}

// A subcategory: one level only, and empty ones are dropped the way an empty
// section is. Returns null when it names no pages.
function buildGroup(docsDir, section, groupSlug, groupRaw) {
    const where = `${section.slug}/${groupSlug}`;
    if (!isSafeSlug(groupSlug)) throw new DocsError(`unusable subcategory slug: ${where}`);
    if (RESERVED_GROUP_SLUGS.has(groupSlug)) throw new DocsError(`reserved subcategory slug: ${where}`);

    const group = { slug: groupSlug, title: groupRaw.Title || titleize(groupSlug) };
    const pages = [];
    for (const [pageSlug, pageRaw] of Object.entries(groupRaw.Content)) {
        if (pageRaw && typeof pageRaw === 'object' && pageRaw.Content && typeof pageRaw.Content === 'object') {
            throw new DocsError(`${where}/${pageSlug}: subcategories cannot contain subcategories`);
        }
        pages.push(buildPage(docsDir, section, group, pageSlug, pageRaw));
    }

    if (pages.length === 0) return null;
    pages.sort(sortKey);
    return {
        kind: 'group',
        slug: groupSlug,
        title: group.title,
        sort: Number(groupRaw.Sort),
        icon: groupRaw.Icon,
        pages,
    };
}

// Same ordering as the server's buildDocTree. Stricter: a bad slug, a page
// missing on disk, or an index with no pages is an error, where the server
// skipped the entry and served what was left. A Content entry is a
// subcategory when it has a Content of its own, and a page otherwise.
export function buildDocTree(docsDir) {
    let info;
    try {
        info = JSON.parse(fs.readFileSync(path.join(docsDir, INFO_NAME), 'utf8'));
    } catch (err) {
        throw new DocsError(`${INFO_NAME}: ${err.message}`);
    }

    const sections = [];
    for (const [sectionSlug, sectionRaw] of Object.entries(info)) {
        if (!isSafeSlug(sectionSlug)) throw new DocsError(`unusable section slug: ${sectionSlug}`);
        if (RESERVED_SECTION_SLUGS.has(sectionSlug)) throw new DocsError(`reserved section slug: ${sectionSlug}`);
        if (!sectionRaw || typeof sectionRaw !== 'object') throw new DocsError(`section ${sectionSlug} is not an object`);

        const section = { slug: sectionSlug, title: sectionRaw.Title || titleize(sectionSlug) };
        const items = [];
        for (const [slug, raw] of Object.entries(sectionRaw.Content || {})) {
            if (raw && typeof raw === 'object' && raw.Content && typeof raw.Content === 'object') {
                const group = buildGroup(docsDir, section, slug, raw);
                if (group) items.push(group);
            } else {
                items.push(buildPage(docsDir, section, null, slug, raw));
            }
        }

        if (items.length === 0) continue;
        items.sort(sortKey);
        sections.push({ ...section, sort: Number(sectionRaw.Sort), items });
    }

    if (sections.length === 0) throw new DocsError(`${INFO_NAME} names no pages`);
    sections.sort(sortKey);
    return sections;
}

// Display order, subcategories expanded where they sit. The prev/next links
// are cut from this, so the order has to be the one the sidebar shows.
export function flattenPages(tree) {
    const pages = [];
    for (const section of tree) {
        for (const item of section.items) {
            if (item.kind === 'group') pages.push(...item.pages);
            else pages.push(item);
        }
    }
    return pages;
}

// A page on disk the index does not name is never published. The old
// deploy.sh said so; the build says so now.
export function findUnindexed(docsDir, tree) {
    const named = new Set(flattenPages(tree).map(p => `${p.urlPath.slice(1)}.md`));
    const found = [];
    const dirs = fs.readdirSync(docsDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .sort();
    for (const dir of dirs) {
        const entries = fs.readdirSync(path.join(docsDir, dir), { withFileTypes: true })
            .sort((a, b) => a.name.localeCompare(b.name));
        for (const entry of entries) {
            const rel = `${dir}/${entry.name}`;
            // one level further than the sections, for subcategory directories
            if (entry.isDirectory()) {
                for (const file of fs.readdirSync(path.join(docsDir, rel)).sort()) {
                    const nested = `${rel}/${file}`;
                    if (file.endsWith('.md') && !named.has(nested)) found.push(nested);
                }
            } else if (entry.name.endsWith('.md') && !named.has(rel)) {
                found.push(rel);
            }
        }
    }
    return found;
}

function pageLink(page, currentUrlPath, nested) {
    const classes = ['docs-link'];
    if (nested) classes.push('docs-sub');
    if (page.urlPath === currentUrlPath) classes.push('active');
    // a nested page is a plain text row; only rows directly under a category
    // carry an icon
    const icon = nested ? '' : renderIcon(page.icon);
    return `<li><a class="${classes.join(' ')}" href="${encodeURI(getFullUrl(page.urlPath))}">`
        + `${icon}${escapeHtml(page.title)}</a></li>\n`;
}

// The open/closed state is decided here rather than by script, so a page
// arrives with the right subcategory already expanded and nothing flashes.
// docs-nav.js reads data-group and data-current-group to layer a reader's
// remembered choice on top.
export function renderSidebar(tree, currentUrlPath) {
    let currentGroup = '';
    for (const section of tree) {
        for (const item of section.items) {
            if (item.kind !== 'group') continue;
            if (item.pages.some(p => p.urlPath === currentUrlPath)) currentGroup = `${section.slug}/${item.slug}`;
        }
    }

    let html = `<ul class="docs-tree" data-current-group="${escapeHtml(currentGroup)}">\n`;
    for (const section of tree) {
        html += `<li class="docs-cat"><span>${escapeHtml(section.title)}</span>\n<ul>\n`;
        for (const item of section.items) {
            if (item.kind !== 'group') {
                html += pageLink(item, currentUrlPath, false);
                continue;
            }
            const groupPath = `${section.slug}/${item.slug}`;
            const open = groupPath === currentGroup ? ' open' : '';
            html += `<li class="docs-group"><details${open} data-group="${escapeHtml(groupPath)}">`
                + `<summary>${renderIcon(item.icon)}<span>${escapeHtml(item.title)}</span></summary>\n<ul>\n`;
            for (const page of item.pages) html += pageLink(page, currentUrlPath, true);
            html += '</ul>\n</details></li>\n';
        }
        html += '</ul>\n</li>\n';
    }
    html += '</ul>\n';
    return html;
}

const ICON_PREV = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_NEXT = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function renderDocNav(prevNode, nextNode) {
    if (!prevNode && !nextNode) return '';
    let html = '<nav class="doc-nav">';
    if (prevNode) {
        html += `<a href="${encodeURI(getFullUrl(prevNode.urlPath))}" class="doc-nav-btn doc-nav-prev">${ICON_PREV}<span>${escapeHtml(prevNode.title)}</span></a>`;
    } else {
        html += '<span></span>';
    }
    if (nextNode) {
        html += `<a href="${encodeURI(getFullUrl(nextNode.urlPath))}" class="doc-nav-btn doc-nav-next"><span>${escapeHtml(nextNode.title)}</span>${ICON_NEXT}</a>`;
    }
    html += '</nav>';
    return html;
}

// One pass with a function replacement, so "$&", "$1" and friends in the
// content are inserted literally. The server chained .replace() calls with
// string replacements, which would have rewritten them.
export function renderDocPage(template, tree, page, contentHtml, docNavHtml = '') {
    const values = {
        TITLE: escapeHtml(page.title),
        SIDEBAR: renderSidebar(tree, page.urlPath),
        CONTENT: contentHtml,
        DOCNAV: docNavHtml,
    };
    return template.replace(/{{(TITLE|SIDEBAR|CONTENT|DOCNAV)}}/g, (_, key) => values[key]);
}

// Pages has no server-side redirects, so /docs and /docs/<section> get a page
// that redirects three ways: meta refresh, script, and a plain link.
export function renderRedirectPage(target) {
    const href = escapeHtml(target);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TuxBlox Docs</title>
    <link rel="canonical" href="${SITE_ORIGIN}${href}">
    <meta http-equiv="refresh" content="0; url=${href}">
    <script>location.replace(${JSON.stringify(target)} + location.search + location.hash);</script>
</head>
<body>
    <p><a href="${href}">Continue to the documentation</a></p>
</body>
</html>
`;
}

function unescapeHtml(text) {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

// Every link in the rendered content that lands under /docs on this site must
// be one of knownPaths, exactly. Hash and query are ignored; a trailing slash
// is not, because Pages serves a page as <page>.html, so /docs/a/page/ is a 404
// while /docs/a/ (a section's redirect page) is fine. The caller lists both.
export function checkDocLinks(rendered, knownPaths) {
    const broken = [];
    for (const { urlPath, html } of rendered) {
        const base = new URL(urlPath, SITE_ORIGIN);
        for (const [, raw] of html.matchAll(/<a href="([^"]*)"/g)) {
            const href = unescapeHtml(raw);
            let target;
            try {
                target = new URL(href, base);
            } catch {
                broken.push({ page: urlPath, href });
                continue;
            }
            if (target.origin !== SITE_ORIGIN) continue;
            const p = target.pathname;
            if (p !== URL_PREFIX && !p.startsWith(`${URL_PREFIX}/`)) continue;
            if (!knownPaths.has(p)) broken.push({ page: urlPath, href });
        }
    }
    return broken;
}
