// Builds the site into _site/: site/ copied as is, the docs rendered with the
// old server's markdown.js and template, a search index, and a sitemap.
//
//   node build/build.mjs
//
// Any problem stops the build before a deploy can happen, so the live site
// stays as it was.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
    SITE_ORIGIN, DocsError, getFullUrl, buildDocTree, flattenPages, findUnindexed,
    renderDocNav, renderDocPage, renderRedirectPage, renderToc, checkDocLinks,
} from './docs.mjs';
import { renderSitemap } from './sitemap.mjs';

const require = createRequire(import.meta.url);
const { renderMarkdown } = require('./markdown.js');
const { stripMarkdown } = require('../site/static/scripts/docs-search.js');

export const TOP_PAGES = ['/', '/releases', '/privacy'];

// Files the TuxBlox app, its build, its READMEs or the pages themselves
// depend on. A build without any of them is not deployed.
export const REQUIRED_FILES = [
    'index.html', 'releases.html', 'privacy.html', '404.html',
    'install.sh', 'robots.txt', 'favicon.ico', '.well-known/security.txt',
    'static/scripts/include.js', 'static/scripts/docs-search.js',
    'static/images/icon/tuxblox-icon.png', 'static/images/banner/tuxblox-banner.png',
    'docs/index.html', 'docs/search-index.json', 'sitemap.xml',
];

function write(file, contents) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
}

export function build({ root, out, log = console }) {
    const docsDir = path.join(root, 'docs');

    fs.rmSync(out, { recursive: true, force: true });
    fs.cpSync(path.join(root, 'site'), out, { recursive: true });

    const tree = buildDocTree(docsDir);
    for (const file of findUnindexed(docsDir, tree)) {
        log.warn(`note: docs/${file} is not in docs-info.json and will not be published`);
    }

    const template = fs.readFileSync(path.join(root, 'build', 'docs-template.html'), 'utf8');
    const pages = flattenPages(tree);
    const rendered = [];
    const searchIndex = [];
    const idsByPath = new Map();

    pages.forEach((page, i) => {
        const markdown = fs.readFileSync(page.fsPath, 'utf8');
        const headings = [];
        const contentHtml = renderMarkdown(markdown, { headings });
        const docNav = renderDocNav(pages[i - 1] || null, pages[i + 1] || null);
        const fullUrl = getFullUrl(page.urlPath);

        // <page>.html rather than <page>/index.html: Pages serves it without a
        // trailing slash, so relative links written against the repo resolve.
        write(path.join(out, `${fullUrl.slice(1)}.html`),
            renderDocPage(template, tree, page, contentHtml, docNav, renderToc(headings)));

        rendered.push({ urlPath: fullUrl, html: contentHtml });
        idsByPath.set(fullUrl, new Set(headings.map(h => h.id)));
        // a nested page is filed under both names, so a search hit says which
        // subcategory it came from
        const section = page.groupTitle ? `${page.sectionTitle} › ${page.groupTitle}` : page.sectionTitle;
        searchIndex.push({ title: page.title, section, urlPath: fullUrl, text: stripMarkdown(markdown) });
    });

    // /docs and each section work with or without a trailing slash (Pages
    // redirects to the slash form, whose index.html redirects on). Pages only
    // work without one.
    const groupDirs = tree.flatMap(s => s.items
        .filter(i => i.kind === 'group')
        .map(g => `/docs/${s.slug}/${g.slug}`));
    const known = new Set([
        '/docs', '/docs/',
        ...tree.flatMap(s => [`/docs/${s.slug}`, `/docs/${s.slug}/`]),
        ...groupDirs.flatMap(d => [d, `${d}/`]),
        ...pages.map(p => getFullUrl(p.urlPath)),
    ]);
    const broken = checkDocLinks(rendered, known, idsByPath);
    if (broken.length) {
        throw new DocsError(broken.map(b => `${b.page}: broken link ${b.href}`).join('\n'));
    }

    // /docs and /docs/<section> land on the first page, as the server's 302s did.
    write(path.join(out, 'docs', 'index.html'), renderRedirectPage(getFullUrl(pages[0].urlPath)));
    for (const section of tree) {
        write(path.join(out, 'docs', section.slug, 'index.html'),
            renderRedirectPage(getFullUrl(flattenPages([section])[0].urlPath)));
        for (const group of section.items.filter(i => i.kind === 'group')) {
            write(path.join(out, 'docs', section.slug, group.slug, 'index.html'),
                renderRedirectPage(getFullUrl(group.pages[0].urlPath)));
        }
    }

    write(path.join(out, 'docs', 'search-index.json'), JSON.stringify(searchIndex));
    write(path.join(out, 'sitemap.xml'), renderSitemap(SITE_ORIGIN, [...TOP_PAGES, ...pages.map(p => getFullUrl(p.urlPath))]));

    const missing = REQUIRED_FILES.filter(f => !fs.existsSync(path.join(out, f)));
    if (missing.length) throw new Error(`missing from the build: ${missing.join(', ')}`);

    return { pages: pages.length, sections: tree.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const root = fileURLToPath(new URL('..', import.meta.url));
    try {
        const { pages, sections } = build({ root, out: path.join(root, '_site') });
        console.log(`Built _site/ with ${pages} docs pages in ${sections} sections`);
    } catch (err) {
        console.error(`!! ${err.message}`);
        process.exit(1);
    }
}
