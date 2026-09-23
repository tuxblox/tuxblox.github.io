import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    DocsError, buildDocTree, flattenPages, findUnindexed, renderSidebar,
    renderDocNav, renderDocPage, renderRedirectPage, checkDocLinks,
} from '../build/docs.mjs';

// Writes a docs directory: info is docs-info.json, files are paths to create.
function makeDocs(info, files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-test-'));
    fs.writeFileSync(path.join(dir, 'docs-info.json'), JSON.stringify(info));
    for (const f of files) {
        fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
        fs.writeFileSync(path.join(dir, f), `# ${f}\n`);
    }
    return dir;
}

const INFO = {
    b: { Title: 'B', Sort: 2, Content: { z: { Title: 'Zed', Sort: 1 }, a: {} } },
    a: { Sort: 1, Content: { 'first-page': { Title: 'First', Sort: 1 } } },
};
const FILES = ['b/z.md', 'b/a.md', 'a/first-page.md'];

test('sections and pages sort by Sort then title, with titleized fallbacks', () => {
    const tree = buildDocTree(makeDocs(INFO, FILES));
    assert.deepEqual(tree.map(s => [s.slug, s.title]), [['a', 'A'], ['b', 'B']]);
    assert.deepEqual(tree[1].pages.map(p => [p.slug, p.title, p.urlPath, p.sectionTitle]),
        [['z', 'Zed', '/b/z', 'B'], ['a', 'A', '/b/a', 'B']]);
});

test('a page named in the index but missing on disk fails', () => {
    const dir = makeDocs(INFO, ['b/z.md', 'a/first-page.md']);
    assert.throws(() => buildDocTree(dir), (e) => e instanceof DocsError && /b\/a\.md does not exist/.test(e.message));
});

test('unusable and reserved slugs fail', () => {
    for (const [info, pattern] of [
        [{ '.hidden': { Content: { p: {} } } }, /unusable section slug: \.hidden/],
        [{ s: { Content: { '../x': {} } } }, /unusable page slug: s\/\.\.\/x/],
        [{ s: { Content: { index: {} } } }, /reserved page slug: s\/index/],
        [{ 'search-index.json': { Content: { p: {} } } }, /reserved section slug: search-index\.json/],
    ]) {
        assert.throws(() => buildDocTree(makeDocs(info, [])), pattern);
    }
});

test('an index naming no pages fails', () => {
    assert.throws(() => buildDocTree(makeDocs({}, [])), /names no pages/);
});

test('Markdown files the index does not name are reported, README.md is not', () => {
    const dir = makeDocs(INFO, [...FILES, 'b/extra.md', 'README.md']);
    assert.deepEqual(findUnindexed(dir, buildDocTree(dir)), ['b/extra.md']);
});

test('the sidebar marks the current page', () => {
    const tree = buildDocTree(makeDocs({ a: { Title: 'A', Content: { p: { Title: 'P' } } } }, ['a/p.md']));
    assert.equal(renderSidebar(tree, '/a/p'),
        '<ul>\n<li class="folder"><span>A</span>\n<ul>\n' +
        '<li><a href="/docs/a/p" class="active">P</a></li>\n</ul>\n</li>\n</ul>\n');
});

test('the first page gets an empty slot where the previous link would be', () => {
    const pages = flattenPages(buildDocTree(makeDocs(INFO, FILES)));
    assert.match(renderDocNav(null, pages[1]), /^<nav class="doc-nav"><span><\/span><a href="\/docs\/b\/z" class="doc-nav-btn doc-nav-next"><span>Zed<\/span>/);
    assert.equal(renderDocNav(null, null), '');
});

test('page content is inserted literally, $ sequences included', () => {
    const tree = buildDocTree(makeDocs(INFO, FILES));
    const page = tree[0].pages[0];
    const content = "<p>awk '{print $1}' then $& and $' and $$</p>";
    const html = renderDocPage('<title>{{TITLE}}</title>{{SIDEBAR}}<main>{{CONTENT}}</main>{{DOCNAV}}', tree, page, content, '<nav></nav>');
    assert.ok(html.startsWith('<title>First</title><ul>'));
    assert.ok(html.includes(`<main>${content}</main><nav></nav>`));
});

test('the link check accepts real targets and reports missing ones', () => {
    const known = new Set(['/docs', '/docs/a', '/docs/a/first-page', '/docs/b', '/docs/b/z']);
    const html = [
        '<a href="../b/z">', '<a href="../b/z#install">', '<a href="z?x=1">', '<a href="/docs/b">',
        '<a href="/docs/b/">', '<a href="/releases">', '<a href="mailto:a@b.c">',
        '<a href="https://example.com/docs/nope">', '<a href="https://github.com/x">',
        '<a href="../b/missing">', '<a href="https://tuxblox.net/docs/nope">',
    ].join('');
    const broken = checkDocLinks([{ urlPath: '/docs/b/a', html }], known);
    assert.deepEqual(broken.map(b => b.href), ['../b/missing', 'https://tuxblox.net/docs/nope']);
});

test('redirect pages point at their target three ways', () => {
    const html = renderRedirectPage('/docs/getting-started/welcome');
    assert.ok(html.includes('<meta http-equiv="refresh" content="0; url=/docs/getting-started/welcome">'));
    assert.ok(html.includes('<link rel="canonical" href="https://tuxblox.net/docs/getting-started/welcome">'));
    assert.ok(html.includes('location.replace("/docs/getting-started/welcome" + location.search + location.hash)'));
});
