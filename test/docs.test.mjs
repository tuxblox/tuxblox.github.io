import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    DocsError, buildDocTree, flattenPages, findUnindexed, renderSidebar,
    renderDocNav, renderDocPage, renderRedirectPage, checkDocLinks,
} from '../build/docs.mjs';

// Everything this file creates lives under one directory, removed at the end,
// so test runs do not pile up in the (often RAM-backed) temp directory.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tuxbloxsite-test-'));
after(() => fs.rmSync(TMP, { recursive: true, force: true }));

// Writes a docs directory: info is docs-info.json, files are paths to create.
function makeDocs(info, files) {
    const dir = fs.mkdtempSync(path.join(TMP, 'docs-'));
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

const NESTED = {
    c: { Title: 'C', Sort: 1, Content: {
        solo: { Title: 'Solo', Sort: 1 },
        grp: { Title: 'Grp', Sort: 2, Content: { b: { Title: 'B', Sort: 2 }, a: { Title: 'A', Sort: 1 } } },
    } },
};
const NESTED_FILES = ['c/solo.md', 'c/grp/a.md', 'c/grp/b.md'];

test('sections and pages sort by Sort then title, with titleized fallbacks', () => {
    const tree = buildDocTree(makeDocs(INFO, FILES));
    assert.deepEqual(tree.map(s => [s.slug, s.title]), [['a', 'A'], ['b', 'B']]);
    assert.deepEqual(tree[1].items.map(p => [p.slug, p.title, p.urlPath, p.sectionTitle]),
        [['z', 'Zed', '/b/z', 'B'], ['a', 'A', '/b/a', 'B']]);
});

test('a subcategory nests pages and keeps display order when flattened', () => {
    const tree = buildDocTree(makeDocs(NESTED, NESTED_FILES));
    assert.deepEqual(tree[0].items.map(i => [i.kind, i.slug]), [['page', 'solo'], ['group', 'grp']]);
    assert.deepEqual(flattenPages(tree).map(p => p.urlPath), ['/c/solo', '/c/grp/a', '/c/grp/b']);
    assert.equal(flattenPages(tree)[1].groupTitle, 'Grp');
    assert.equal(flattenPages(tree)[0].groupTitle, null);
});

// Turning a page into a subcategory of the same name is the migration this
// level exists for. The old .md goes unnamed by the index rather than
// clashing, because one Content key cannot be both.
test('a page replaced by a subcategory of the same name is reported, not published', () => {
    const info = { c: { Title: 'C', Content: { s: { Content: { p: { Title: 'P' } } } } } };
    const dir = makeDocs(info, ['c/s/p.md', 'c/s.md']);
    const tree = buildDocTree(dir);
    assert.deepEqual(flattenPages(tree).map(p => p.urlPath), ['/c/s/p']);
    assert.deepEqual(findUnindexed(dir, tree), ['c/s.md']);
});

// Review Focus 4
test('a malformed or over-nested Content entry fails', () => {
    assert.throws(
        () => buildDocTree(makeDocs({ c: { Content: { g: { Content: { h: { Content: { p: {} } } } } } } }, [])),
        /c\/g\/h: subcategories cannot contain subcategories/);
    assert.throws(
        () => buildDocTree(makeDocs({ c: { Content: { p: 'nope' } } }, [])),
        /page c\/p is not an object/);
});

test('reserved and unusable subcategory slugs fail', () => {
    assert.throws(() => buildDocTree(makeDocs({ c: { Content: { index: { Content: { p: {} } } } } }, [])),
        /reserved subcategory slug: c\/index/);
    assert.throws(() => buildDocTree(makeDocs({ c: { Content: { '../x': { Content: { p: {} } } } } }, [])),
        /unusable subcategory slug: c\/\.\.\/x/);
});

test('an empty subcategory is skipped, like an empty section', () => {
    const tree = buildDocTree(makeDocs({ c: { Content: { solo: {}, empty: { Content: {} } } } }, ['c/solo.md']));
    assert.deepEqual(tree[0].items.map(i => i.slug), ['solo']);
});

test('unindexed Markdown inside a subcategory is reported', () => {
    const dir = makeDocs(NESTED, [...NESTED_FILES, 'c/grp/extra.md']);
    assert.deepEqual(findUnindexed(dir, buildDocTree(dir)), ['c/grp/extra.md']);
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

test('the sidebar renders categories, icon rows, and a collapsible subcategory', () => {
    const tree = buildDocTree(makeDocs(NESTED, NESTED_FILES));
    const html = renderSidebar(tree, '/c/grp/a');
    assert.ok(html.startsWith('<ul class="docs-tree" data-current-group="c/grp">\n'
        + '<li class="docs-cat"><span>C</span>\n<ul>\n'));
    assert.ok(html.includes('<li><a class="docs-link" href="/docs/c/solo"><svg'));
    assert.ok(html.includes('<li class="docs-group"><details open data-group="c/grp">'));
    assert.ok(html.includes('<a class="docs-link docs-sub active" href="/docs/c/grp/a">A</a>'));
    assert.ok(!html.includes('<a class="docs-link docs-sub active" href="/docs/c/grp/b">'));
});

test('a subcategory not holding the current page renders closed', () => {
    const html = renderSidebar(buildDocTree(makeDocs(NESTED, NESTED_FILES)), '/c/solo');
    assert.ok(html.includes('<li class="docs-group"><details data-group="c/grp">'));
    assert.ok(html.startsWith('<ul class="docs-tree" data-current-group="">'));
});

test('an unknown icon name stops the build', () => {
    const info = { c: { Content: { p: { Icon: 'no-such-icon' } } } };
    assert.throws(() => renderSidebar(buildDocTree(makeDocs(info, ['c/p.md'])), '/c/p'), /no-such-icon/);
});

test('the first page gets an empty slot where the previous link would be', () => {
    const pages = flattenPages(buildDocTree(makeDocs(INFO, FILES)));
    assert.match(renderDocNav(null, pages[1]), /^<nav class="doc-nav"><span><\/span><a href="\/docs\/b\/z" class="doc-nav-btn doc-nav-next"><span>Zed<\/span>/);
    assert.equal(renderDocNav(null, null), '');
});

test('page content is inserted literally, $ sequences included', () => {
    const tree = buildDocTree(makeDocs(INFO, FILES));
    const page = tree[0].items[0];
    const content = "<p>awk '{print $1}' then $& and $' and $$</p>";
    const html = renderDocPage('<title>{{TITLE}}</title>{{SIDEBAR}}<main>{{CONTENT}}</main>{{DOCNAV}}', tree, page, content, '<nav></nav>');
    assert.ok(html.startsWith('<title>First</title><ul class="docs-tree"'));
    assert.ok(html.includes(`<main>${content}</main><nav></nav>`));
});

test('the link check accepts real targets and reports missing ones', () => {
    const known = new Set(['/docs', '/docs/', '/docs/a', '/docs/a/', '/docs/a/first-page', '/docs/b', '/docs/b/', '/docs/b/z']);
    const html = [
        '<a href="../b/z">', '<a href="../b/z#install">', '<a href="z?x=1">', '<a href="/docs/b">',
        '<a href="/docs/b/">', '<a href="/releases">', '<a href="mailto:a@b.c">',
        '<a href="https://example.com/docs/nope">', '<a href="https://github.com/x">',
        '<a href="../b/missing">', '<a href="https://tuxblox.net/docs/nope">',
        // Pages serve <page>.html only, so a page URL with a trailing slash is a 404.
        '<a href="/docs/b/z/">', '<a href="z/">',
    ].join('');
    const broken = checkDocLinks([{ urlPath: '/docs/b/a', html }], known);
    assert.deepEqual(broken.map(b => b.href), ['../b/missing', 'https://tuxblox.net/docs/nope', '/docs/b/z/', 'z/']);
});

test('redirect pages point at their target three ways', () => {
    const html = renderRedirectPage('/docs/getting-started/welcome');
    assert.ok(html.includes('<meta http-equiv="refresh" content="0; url=/docs/getting-started/welcome">'));
    assert.ok(html.includes('<link rel="canonical" href="https://tuxblox.net/docs/getting-started/welcome">'));
    assert.ok(html.includes('location.replace("/docs/getting-started/welcome" + location.search + location.hash)'));
});
