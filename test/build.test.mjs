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

    assert.equal(result.pages, 22);
    assert.equal(result.sections, 5);

    const welcome = read('docs/getting-started/welcome.html');
    assert.ok(welcome.includes('<title>Welcome | TuxBlox Docs</title>'));
    assert.ok(welcome.includes('<a href="/docs/getting-started/welcome" class="active">Welcome</a>'));
    assert.ok(welcome.includes('href="/static/styles/docs.css?v=20260904"'));
    assert.ok(welcome.includes('<a href="system-requirements">System Requirements</a>'));

    assert.ok(read('docs/index.html').includes('url=/docs/getting-started/welcome'));
    assert.ok(read('docs/troubleshooting/index.html').includes('url=/docs/troubleshooting/common-problems'));

    const index = JSON.parse(read('docs/search-index.json'));
    assert.equal(index.length, 22);
    assert.deepEqual(Object.keys(index[0]), ['title', 'section', 'urlPath', 'text']);
    assert.equal(index[0].urlPath, '/docs/getting-started/welcome');
    assert.equal(index[0].section, 'Getting Started');

    const sitemap = read('sitemap.xml');
    assert.equal(sitemap.match(/<loc>/g).length, 25);
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
