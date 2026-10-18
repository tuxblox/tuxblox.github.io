import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../build/build.mjs';

// Everything this file creates lives under one directory, removed at the end,
// so test runs do not pile up in the (often RAM-backed) temp directory.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tuxbloxsite-test-'));
after(() => fs.rmSync(TMP, { recursive: true, force: true }));

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const quiet = { warn() {} };

function tmp(prefix) {
    return fs.mkdtempSync(path.join(TMP, prefix));
}

test('builds the real site', () => {
    const out = tmp('site-');
    const result = build({ root: ROOT, out, log: quiet });
    const read = (f) => fs.readFileSync(path.join(out, f), 'utf8');

    assert.equal(result.pages, 35);
    assert.equal(result.sections, 5);

    const welcome = read('docs/getting-started/welcome.html');
    assert.ok(welcome.includes('<title>Welcome | TuxBlox Docs</title>'));
    assert.ok(welcome.includes('<a class="docs-link active" href="/docs/getting-started/welcome">'));
    assert.ok(welcome.includes('href="/static/styles/docs.css?v=20261017"'));
    // not the homepage's URL: each page is its own canonical, in both places
    assert.ok(welcome.includes('<link rel="canonical" href="https://tuxblox.net/docs/getting-started/welcome">'));
    assert.ok(welcome.includes('<meta property="og:url" content="https://tuxblox.net/docs/getting-started/welcome" />'));
    assert.ok(welcome.includes('<a href="system-requirements">System Requirements</a>'));
    assert.ok(welcome.includes('<nav class="docs-toc"'));
    assert.ok(welcome.includes('id="docs-rail"'));
    assert.ok(welcome.includes('id="docs-drawer-toggle"'));
    assert.ok(welcome.includes('<noscript>'));
    assert.ok(welcome.includes('/static/scripts/docs-nav.js?v=20261018'));

    // Without this every anchor -- the 11 cross-page ones and every TOC
    // click -- scrolls its heading under the fixed topbar.
    const css = read('static/styles/docs.css');
    assert.match(css, /scroll-margin-top:\s*calc\(var\(--header-h\)/);
    // TUXBLOX_WEBVIEW_IPC_TIMEOUT is wider than the 232px rail
    assert.match(css, /\.docs-toc a\s*\{[^}]*overflow-wrap:\s*anywhere/);
    assert.ok(read('docs/advanced/environment-variables.html').includes('href="#tuxblox_log_limit"'));

    // The download page renders a release's CHANGELOGS.md in the browser from
    // the same markdown.js the docs are built with, so it has to be published
    // under the name the page asks for.
    assert.ok(read('releases.html').includes('src="/static/scripts/markdown.js?v=20261018"'));
    assert.match(read('static/scripts/markdown.js'), /globalThis\.markdown = api/);

    assert.ok(read('docs/index.html').includes('url=/docs/getting-started/welcome'));
    assert.ok(read('docs/troubleshooting/index.html').includes('url=/docs/troubleshooting/common-problems'));

    const index = JSON.parse(read('docs/search-index.json'));
    assert.equal(index.length, 35);
    assert.deepEqual(Object.keys(index[0]), ['title', 'section', 'urlPath', 'text']);
    assert.equal(index[0].urlPath, '/docs/getting-started/welcome');
    assert.equal(index[0].section, 'Getting Started');

    // A nested page names its subcategory, which is the only thing telling
    // Settings > Launcher apart from the top-level The Launcher page in a
    // search result, and Settings > Troubleshooting from that whole section.
    const privacy = index.find(e => e.urlPath === '/docs/using-tuxblox/settings/privacy');
    assert.equal(privacy.section, 'Using TuxBlox › Settings');

    // The old flat URL is now a directory, so it carries a redirect on to the
    // group's first page rather than 404ing for anyone holding the old link.
    assert.ok(read('docs/using-tuxblox/settings/index.html')
        .includes('url=/docs/using-tuxblox/settings/launcher'));

    const sitemap = read('sitemap.xml');
    assert.equal(sitemap.match(/<loc>/g).length, 39);
    assert.ok(sitemap.includes('<loc>https://tuxblox.net/</loc>'));
    assert.ok(sitemap.includes('<loc>https://tuxblox.net/docs/development/contributing</loc>'));

    assert.ok(fs.existsSync(path.join(out, '.well-known/security.txt')));
    assert.ok(!fs.existsSync(path.join(out, 'docs/README.html')));
});

// A throwaway repository root: the real template and site, with docs replaced.
function fakeRoot(info, files) {
    const root = tmp('root-');
    fs.cpSync(path.join(ROOT, 'site'), path.join(root, 'site'), { recursive: true });
    fs.mkdirSync(path.join(root, 'build'));
    fs.copyFileSync(path.join(ROOT, 'build/docs-template.html'), path.join(root, 'build/docs-template.html'));
    fs.mkdirSync(path.join(root, 'docs'));
    fs.writeFileSync(path.join(root, 'docs/docs-info.json'), JSON.stringify(info));
    for (const [f, body] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(root, 'docs', f)), { recursive: true });
        fs.writeFileSync(path.join(root, 'docs', f), body);
    }
    return root;
}

test('a broken docs link fails the build', () => {
    const root = fakeRoot({ s: { Content: { p: {} } } }, { 's/p.md': '[gone](missing.md)\n' });
    assert.throws(() => build({ root, out: tmp('out-'), log: quiet }), /\/docs\/s\/p: broken link missing/);
});

test('a subcategory gets a redirect page and nests its pages', () => {
    const root = fakeRoot(
        { s: { Title: 'S', Content: { g: { Title: 'G', Content: { p: { Title: 'P' } } } } } },
        { 's/g/p.md': '# p\n' });
    const out = tmp('out-');
    build({ root, out, log: quiet });
    assert.ok(fs.existsSync(path.join(out, 'docs/s/g/p.html')));
    assert.ok(fs.readFileSync(path.join(out, 'docs/s/g/index.html'), 'utf8').includes('url=/docs/s/g/p'));
    const index = JSON.parse(fs.readFileSync(path.join(out, 'docs/search-index.json'), 'utf8'));
    assert.equal(index[0].section, 'S › G');
});

test('a link to a heading that does not exist fails the build', () => {
    const root = fakeRoot({ s: { Content: { p: {}, q: {} } } },
        { 's/p.md': '# p\n\n[bad](q.md#nope)\n', 's/q.md': '# q\n\n## Real\n' });
    // the href is reported as rendered, so the .md is already gone
    assert.throws(() => build({ root, out: tmp('out-'), log: quiet }), /broken link q#nope/);
});

test('a missing required file fails the build', () => {
    const root = fakeRoot({ s: { Content: { p: {} } } }, { 's/p.md': '# p\n' });
    fs.rmSync(path.join(root, 'site/install.sh'));
    assert.throws(() => build({ root, out: tmp('out-'), log: quiet }), /missing from the build: install\.sh/);
});

test('unindexed Markdown is reported, not published', () => {
    const root = fakeRoot({ s: { Content: { p: {} } } }, { 's/p.md': '# p\n', 's/extra.md': '# x\n' });
    const warnings = [];
    const out = tmp('out-');
    build({ root, out, log: { warn: (m) => warnings.push(m) } });
    assert.deepEqual(warnings, ['note: docs/s/extra.md is not in docs-info.json and will not be published']);
    assert.ok(!fs.existsSync(path.join(out, 'docs/s/extra.html')));
});

test('a rebuild removes files a previous build left behind', () => {
    const out = tmp('out-');
    fs.writeFileSync(path.join(out, 'stale.html'), 'old');
    build({ root: ROOT, out, log: quiet });
    assert.ok(!fs.existsSync(path.join(out, 'stale.html')));
});

test('no built file points at static.tuxblox.net or the old search endpoint', () => {
    const out = tmp('site-');
    build({ root: ROOT, out, log: quiet });
    const offenders = [];
    for (const f of fs.readdirSync(out, { recursive: true })) {
        if (!/\.(html|js|css|json|xml)$/.test(f)) continue;
        const text = fs.readFileSync(path.join(out, f), 'utf8');
        if (text.includes('https://static.tuxblox.net') || text.includes('/api/search')) offenders.push(f);
    }
    assert.deepEqual(offenders, []);
});
